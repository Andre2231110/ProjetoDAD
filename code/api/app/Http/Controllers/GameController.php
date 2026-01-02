<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\GameMove;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Game::query()->with(['winner']);

        if ($user->type !== 'A') {
            $query->where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                  ->orWhere('player2_user_id', $user->id);
            });
        }

        if ($request->has('type') && in_array($request->type, ['3', '9'])) {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && in_array($request->status, ['Pending', 'Playing', 'Ended', 'Interrupted'])) {
            $query->where('status', $request->status);
        }

        $sortField = $request->input('sort_by', 'began_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSortFields = ['began_at', 'ended_at', 'total_time', 'type', 'status'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        $perPage = $request->input('per_page', 15);
        $games = $query->paginate($perPage);

        return response()->json([
            'data' => $games->items(),
            'meta' => [
                'current_page' => $games->currentPage(),
                'last_page' => $games->lastPage(),
                'per_page' => $games->perPage(),
                'total' => $games->total()
            ]
        ]);
    }

    public function userGames(Request $request)
    {
        $userId = $request->user()->id;
        $games = Game::with(['winner'])
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                  ->orWhere('player2_user_id', $userId);
            })
            ->orderBy('began_at', 'desc')
            ->get();

        return response()->json(['data' => $games]);
    }

public function store(Request $request)
{

    try {
        $validated = $request->validate([
            'match_id'        => 'required|exists:matches,id',
            'type'            => 'required', // Simplifica para testar
            'player1_user_id' => 'required|exists:users,id',
            'player2_user_id' => 'required|exists:users,id',
        ]);

        Log::info('2. Validação passou');

        $gameId = DB::table('games')->insertGetId([
            'match_id'        => $request->match_id,
            'type'            => $request->type,
            'status'          => 'Playing',
            'player1_user_id' => $request->player1_user_id,
            'player2_user_id' => $request->player2_user_id,
            'began_at'        => now(),
            'player1_points'  => 0,
            'player2_points'  => 0,
            'began_at'      => now(),
        ]);

        Log::info('3. Inseriu na BD com ID: ' . $gameId);

        return response()->json(['id' => $gameId], 201);

    } catch (\Illuminate\Validation\ValidationException $ve) {
        Log::error('ERRO DE VALIDAÇÃO: ', $ve->errors());
        return response()->json(['errors' => $ve->errors()], 422);
    } catch (\Exception $e) {
        Log::error('ERRO FATAL: ' . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    /**
     * Finalizar um jogo Single Player (Bot)
     * PATCH /api/games/{id}
     */
    public function update(Request $request, $id)
    {
        // 1. Log inicial para ver o que está a chegar do JS
        Log::info("Update Game - Dados recebidos para o ID $id:", $request->all());

        // 2. Validação Manual para podermos logar os erros antes de falhar
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'player1_points' => 'required|integer|min:0|max:120',
            'player2_points' => 'required|integer|min:0|max:120',
            'total_time'     => 'required|numeric',
        ]);

        if ($validator->fails()) {
            Log::error("Erro de Validação no Update Game $id:", $validator->errors()->toArray());
            return response()->json([
                'message' => 'Dados inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $game = Game::findOrFail($id);
            
            if ($game->status === 'Ended') {
                Log::warning("Tentativa de atualizar jogo já finalizado: $id");
                return response()->json(['message' => 'Este jogo já foi finalizado'], 400);
            }

            $p1Score = $request->player1_points;
            $p2Score = $request->player2_points;
            $winnerId = null;
            $loserId = null;
            $isDraw = 0;

            // Determinar vencedor
            if ($p1Score > $p2Score) {
                $winnerId = $game->player1_user_id;
                $loserId = $game->player2_user_id;
            } elseif ($p2Score > $p1Score) {
                $winnerId = $game->player2_user_id;
                $loserId = $game->player1_user_id;
            } else {
                $isDraw = 1;
            }

            Log::info("Cálculo de resultado - Winner: $winnerId, Loser: $loserId, Draw: $isDraw");

            DB::transaction(function () use ($game, $request, $winnerId, $loserId, $isDraw, $p1Score) {
                // 1. Atualizar o Jogo
                $game->update([
                    'status' => 'Ended',
                    'winner_user_id' => $winnerId,
                    'loser_user_id' => $loserId,
                    'is_draw' => $isDraw,
                    'player1_points' => $p1Score,
                    'player2_points' => $request->player2_points,
                    'total_time' => $request->total_time,
                    'ended_at' => now(), // Boa prática adicionar aqui
                ]);
                Log::info("Jogo $game->id atualizado para Ended.");

                // 2. Lógica de Recompensa
                if ($game->match_id === null) {
            
            if ($game->match_id === null) {
            
            // 2. Lógica de Recompensa para Vitória
            if ($winnerId && $winnerId === $game->player1_user_id) {
                // Valores da Pág 3: 3 (moca), 4 (capote), 6 (bandeira)
                $reward = 3; 
                if ($p1Score == 120) $reward = 6;
                elseif ($p1Score >= 91) $reward = 4;

                $user = \App\Models\User::find($winnerId);
                if ($user && $user->email !== 'bot@mail.pt') {
                    $user->increment('coins_balance', $reward);
                    DB::table('coin_transactions')->insert([
                        'user_id' => $user->id,
                        'game_id' => $game->id,
                        'coin_transaction_type_id' => 5, // 'Game payout'
                        'coins' => $reward,
                        'transaction_datetime' => now(),
                    ]);
                }
            }
            
            // 3. Empate em jogo standalone: Devolver 1 moeda a cada (Pág 3)
            if ($isDraw) {
                // Devolve ao Player 1
                $u1 = \App\Models\User::find($game->player1_user_id);
                if ($u1) {
                    $u1->increment('coins_balance', 1);
                    DB::table('coin_transactions')->insert([
                        'user_id' => $u1->id,
                        'game_id' => $game->id,
                        'coin_transaction_type_id' => 1, // 'Refund'
                        'coins' => 1,
                        'transaction_datetime' => now(),
                    ]);
                }
                // Devolve ao Player 2
                $u2 = \App\Models\User::find($game->player2_user_id);
                if ($u2 && $u2->email !== 'bot@mail.pt') {
                    $u2->increment('coins_balance', 1);
                    DB::table('coin_transactions')->insert([
                        'user_id' => $u2->id,
                        'game_id' => $game->id,
                        'coin_transaction_type_id' => 1,
                        'coins' => 1,
                        'transaction_datetime' => now(),
                    ]);
                }
            }
        }
            }
        });

            return response()->json(['message' => 'Resultado guardado com sucesso']);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error("Jogo não encontrado: $id");
            return response()->json(['error' => 'Jogo não encontrado'], 404);
        } catch (\Exception $e) {
            Log::error("Update Game Error (ID $id): " . $e->getMessage());
            Log::error($e->getTraceAsString()); // Log da pilha de erro completa
            return response()->json(['error' => 'Erro interno ao processar resultado', 'debug' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $game = Game::find($id);
            if (!$game) {
                return response()->json(['message' => 'Game not found'], 404);
            }

            $moves = GameMove::where('game_id', $id)
                        ->orderBy('round_number', 'asc')
                        ->get();

            $responseData = $game->toArray();
            $responseData['moves'] = $moves;

            return response()->json($responseData, 200);

        } catch (\Exception $e) {
            Log::error("Erro ao mostrar jogo $id: " . $e->getMessage());
            return response()->json(['error' => 'Server error'], 500);
        }
    }
}
