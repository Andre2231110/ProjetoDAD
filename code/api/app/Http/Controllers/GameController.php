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
        $request->validate([
            'email'          => 'required|email',
            'player1_points' => 'required|integer',
            'player2_points' => 'required|integer',
            'duration'       => 'required|integer',
            'match_id'       => 'nullable|exists:matches,id',
            'moves'          => 'nullable|array'
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $botUser = User::where('email', "bot@mail.pt")->first();
        if (!$botUser) {
            return response()->json(['error' => 'Bot configuration missing'], 500);
        }
        $botId = $botUser->id;

        $p1Score = $request->player1_points;
        $p2Score = $request->player2_points;
        $winnerId = null;
        $loserId = null;
        $isDraw = 0;

        if ($p1Score > $p2Score) {
            $winnerId = $user->id;
            $loserId = $botId;
        } elseif ($p2Score > $p1Score) {
            $winnerId = $botId;
            $loserId = $user->id;
        } else {
            $isDraw = 1;
        }

        try {
            $gameId = DB::transaction(function () use ($request, $user, $botId, $winnerId, $loserId, $isDraw, $p1Score, $p2Score) {

                $game = Game::create([
                    'type'            => '9',
                    'status'          => 'Ended',
                    'player1_user_id' => $user->id,
                    'player2_user_id' => $botId,
                    'match_id'        => $request->match_id,
                    'winner_user_id'  => $winnerId,
                    'loser_user_id'   => $loserId,
                    'is_draw'         => $isDraw,
                    'player1_points'  => $p1Score,
                    'player2_points'  => $p2Score,
                    'total_time'      => $request->duration,
                    'ended_at'        => now(),
                    'began_at'        => now()->subSeconds($request->duration)
                ]);

                // CORREÇÃO DO ERRO: Definir o tipo de transação para o histórico de moedas
                $payoutType = DB::table('coin_transaction_types')
                                ->where('name', 'Game payout')
                                ->first();

                if (!$isDraw && $payoutType) {
                    DB::table('coin_transactions')->insert([
                        'user_id' => $winnerId,
                        'game_id' => $game->id,
                        'coins' => ($p1Score == 120 || $p2Score == 120) ? 6 : ($p1Score >= 91 ? 4 : 3),
                        'coin_transaction_type_id' => $payoutType->id, // Agora a variável existe!
                        'transaction_datetime' => now(),
                    ]);
                }

                if ($request->has('moves') && is_array($request->moves)) {
                    $movesData = [];
                    foreach ($request->moves as $move) {
                        $movesData[] = [
                            'game_id'       => $game->id,
                            'round_number'  => $move['round'],
                            'player_card'   => $move['p_card'],
                            'bot_card'      => $move['b_card'],
                            'winner'        => $move['winner'],
                            'points_earned' => $move['points'],
                            'created_at'    => now(),
                            'updated_at'    => now()
                        ];
                    }
                    if (count($movesData) > 0) {
                        DB::table('game_moves')->insert($movesData);
                    }
                }

                return $game->id;
            });

            return response()->json([
                'message' => 'Game saved successfully with history',
                'game_id' => $gameId
            ], 201);

        } catch (\Exception $e) {
            Log::error("SaveGame Error: " . $e->getMessage());
            return response()->json(['error' => 'Erro ao guardar jogo: ' . $e->getMessage()], 500);
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
