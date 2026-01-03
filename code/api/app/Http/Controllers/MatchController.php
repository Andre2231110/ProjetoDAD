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
    // 1. Log inicial dos dados recebidos
    Log::info("[PAYOUT] A iniciar finalização da Match #$id", $request->all());

    $request->validate([
        'winner_user_id' => 'nullable|exists:users,id',
        'player1_marks'  => 'required|integer',
        'player2_marks'  => 'required|integer',
        'player1_points' => 'sometimes|integer',
        'player2_points' => 'sometimes|integer',
        'is_match'       => 'required|boolean',
    ]);

    Log::info("Teste pontosplayer1{$request->player1_points}");

    try {
        DB::transaction(function () use ($request, $id) {
            $match = DB::table('matches')->where('id', $id)->first();
            
            // Log do estado atual antes do update
            Log::info("[PAYOUT] Dados da DB para Match #$id - Stake: {$match->stake}, Tipo: " . ($request->is_match ? 'Match' : 'Standalone'));

            // 2. Atualizar a Tabela Matches
            DB::table('matches')->where('id', $id)->update([
                'winner_user_id' => $request->winner_user_id,
                'player1_marks'  => $request->player1_marks,
                'player2_marks'  => $request->player2_marks,
                'player1_points' => $request->player1_points,
                'player2_points' => $request->player2_points,
                'status'         => 'Ended',
                'ended_at'       => now(),
            ]);

            $winnerId = $request->winner_user_id;

            // --- CENÁRIO A: É UMA MATCH (PARTIDA COMPLETA) ---
            if ($request->is_match) {
                if ($winnerId) {
                    $winner = User::find($winnerId);
                    
                    // Cálculo: (Aposta * 2) - 1
                    $payout = ($match->stake * 2) - 1;
                    
                    Log::info("[PAYOUT-MATCH] Vencedor: {$winnerId}. Stake: {$match->stake}. Cálculo: ({$match->stake} * 2) - 1 = {$payout} moedas.");

                    if ($winner && $winner->email !== 'bot@mail.pt') {
                        $winner->increment('coins_balance', $payout);

                        DB::table('coin_transactions')->insert([
                            'user_id' => $winner->id,
                            'match_id' => $id,
                            'coin_transaction_type_id' => 6,
                            'coins' => $payout,
                            'transaction_datetime' => now(),
                        ]);
                        Log::info("[PAYOUT-MATCH] Pagamento de {$payout} efetuado ao user {$winnerId}.");
                    } else {
                        Log::warning("[PAYOUT-MATCH] Pagamento ignorado: Vencedor é BOT ou não encontrado.");
                    }
                }
            } 
            // --- CENÁRIO B: É UM JOGO STANDALONE (SOLTEIRO) ---
            else {
                if ($winnerId) {
                    $winnerPoints = ($winnerId == $match->player1_user_id) 
                                    ? $request->player1_points 
                                    : $request->player2_points;

                    // Regras
                    $reward = 3; 
                    if ($winnerPoints == 120) $reward = 6;
                    elseif ($winnerPoints >= 91) $reward = 4;

                    Log::info("[PAYOUT-SOLO] Vencedor: {$winnerId}. Pontos: {$winnerPoints}. Recompensa calculada: {$reward} moedas.");

                    $winner = User::find($winnerId);
                    if ($winner && $winner->email !== 'bot@mail.pt') {
                        $winner->increment('coins_balance', $reward);
                        
                        DB::table('coin_transactions')->insert([
                            'user_id' => $winner->id,
                            'match_id' => $id, 
                            'coin_transaction_type_id' => 5, 
                            'coins' => $reward,
                            'transaction_datetime' => now(),
                        ]);
                        Log::info("[PAYOUT-SOLO] Pagamento de {$reward} efetuado ao user {$winnerId}.");
                    } else {
                         Log::warning("[PAYOUT-SOLO] Pagamento ignorado: Vencedor é BOT.");
                    }
                } 
                else {
                    // Empate
                    Log::info("[PAYOUT-SOLO] Empate detetado. A processar reembolso de 1 moeda.");

                    // Reembolso Player 1
                    $p1 = User::find($match->player1_user_id);
                    if ($p1) {
                        $p1->increment('coins_balance', 1);
                        DB::table('coin_transactions')->insert([
                            'user_id' => $p1->id,
                            'match_id' => $id,
                            'coin_transaction_type_id' => 1, 
                            'coins' => 1,
                            'transaction_datetime' => now(),
                        ]);
                        Log::info("[PAYOUT-SOLO] Reembolso efetuado ao Player 1 ({$p1->id}).");
                    }

                    // Reembolso Player 2
                    $p2 = User::find($match->player2_user_id);
                    if ($p2 && $p2->email !== 'bot@mail.pt') {
                        $p2->increment('coins_balance', 1);
                        DB::table('coin_transactions')->insert([
                            'user_id' => $p2->id,
                            'match_id' => $id,
                            'coin_transaction_type_id' => 1,
                            'coins' => 1,
                            'transaction_datetime' => now(),
                        ]);
                        Log::info("[PAYOUT-SOLO] Reembolso efetuado ao Player 2 ({$p2->id}).");
                    }
                }
            }
        });

        return response()->json(['message' => 'Match finalized']);
    } catch (\Exception $e) {
        Log::error("[PAYOUT-ERROR] Falha na transação da Match #$id: " . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

}