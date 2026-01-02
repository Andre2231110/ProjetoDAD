<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MatchController extends Controller
{
    /**
     * 1. Criar Partida (Chamado pelo Socket ao iniciar)
     * POST /api/matches
     */
    public function store(Request $request)
    {
        $request->validate([
            'type'            => 'required|in:3,9',
            'player1_user_id' => 'required|exists:users,id',
            'player2_user_id' => 'nullable|exists:users,id',
            'stake'           => 'required|integer',
            'is_match'        => 'required|boolean'
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // Se for Match, stake mínimo 3. Se for jogo único, custo 2. (Pág 3)
                $entryFee = $request->is_match ? $request->stake : 2;

                $p1 = User::findOrFail($request->player1_user_id);
                
                // Verificar saldo do Player 1
                if ($p1->coins_balance < $entryFee) {
                    return response()->json(['message' => 'Saldo insuficiente'], 403);
                }
                $p2 = User::findOrFail($request->player2_user_id);
                
                // Verificar saldo do Player 1
                if ($p2->coins_balance < $entryFee) {
                    return response()->json(['message' => 'Saldo insuficiente'], 403);
                }

                // Deduzir moedas e criar transação de "Game fee" ou "Match stake"
                $p1->decrement('coins_balance', $entryFee);
                $p2->decrement('coins_balance', $entryFee);
                
                $matchId = DB::table('matches')->insertGetId([
                    'type'            => $request->type,
                    'player1_user_id' => $request->player1_user_id,
                    'player2_user_id' => $request->player2_user_id, // Pode ser o BOT ou humano
                    'status'          => 'Playing',
                    'stake'           => $entryFee,
                    'began_at'        => now(),
                    'player1_marks'   => 0,
                    'player2_marks'   => 0,
                    'player1_points'  => 0,
                    'player2_points'  => 0,
                ]);

                // Registar Transação (Pág 11)
                DB::table('coin_transactions')->insert([
                    'user_id' => $p1->id,
                    'match_id' => $matchId,
                    'coin_transaction_type_id' => $request->is_match ? 4 : 3, // 3=Game fee, 4=Match stake
                    'coins' => -$entryFee,
                    'transaction_datetime' => now(),
                ]);

                DB::table('coin_transactions')->insert([
                    'user_id' => $p2->id,
                    'match_id' => $matchId,
                    'coin_transaction_type_id' => $request->is_match ? 4 : 3, // 3=Game fee, 4=Match stake
                    'coins' => -$entryFee,
                    'transaction_datetime' => now(),
                ]);

                return response()->json(['id' => $matchId], 201);
            });
        } catch (\Exception $e) {
            Log::error("Erro storeMatch: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * 2. Finalizar Partida (Match)
     * PATCH /api/matches/{id}
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'winner_user_id' => 'required|exists:users,id',
            'player1_marks'  => 'required|integer',
            'player2_marks'  => 'required|integer',
            'status'         => 'required|in:Ended',
        ]);

        try {
            DB::transaction(function () use ($request, $id) {
                $match = DB::table('matches')->where('id', $id)->first();
                
                // 1. Atualizar Match
                DB::table('matches')->where('id', $id)->update([
                    'winner_user_id' => $request->winner_user_id,
                    'player1_marks'  => $request->player1_marks,
                    'player2_marks'  => $request->player2_marks,
                    'status'         => 'Ended',
                    'ended_at'       => now(),
                ]);

                // 2. Lógica de Payout (Pág 3: Stake combinado - 1 de comissão)
                $winner = User::find($request->winner_user_id);
                $payout = ($match->stake * 2) - 1;

                if ($winner && $winner->email !== 'bot@mail.pt') {
                    $winner->increment('coins_balance', $payout);

                    DB::table('coin_transactions')->insert([
                        'user_id' => $winner->id,
                        'match_id' => $id,
                        'coin_transaction_type_id' => 6, // 6 = Match payout
                        'coins' => $payout,
                        'transaction_datetime' => now(),
                    ]);
                }
            });

            return response()->json(['message' => 'Match finalized']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}