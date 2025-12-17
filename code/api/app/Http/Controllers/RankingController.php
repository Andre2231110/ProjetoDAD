<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RankingController extends Controller
{
    public function globalRanking(Request $request)
    {
        $perPage = 50;
        
        // Pega o ID do user alvo e a página solicitada (se houver)
        $targetUserId = $request->input('target_user_id'); 
        $requestedPage = (int) $request->input('page', 1);

        // Por defeito, todas as listas começam na página 1 ou na solicitada
        $winsPage = $requestedPage;
        $coinsPage = $requestedPage;
        $achPage = $requestedPage;

        // Se passarmos um target_user_id e NÃO passarmos uma página específica,
        // calculamos onde esse user está em cada ranking.
        if ($targetUserId && !$request->has('page')) {
            $user = User::find($targetUserId);
            if ($user) {
                $winsPage = $this->calculatePageForUser('wins', $user, $perPage);
                $coinsPage = $this->calculatePageForUser('coins', $user, $perPage);
                $achPage = $this->calculatePageForUser('achievements', $user, $perPage);
            }
        }

        // --- 1. Ranking de Vitórias ---
        // Ordenação: Mais vitórias > Conta mais antiga > ID menor
        $wins = User::withCount('gamesWon as wins')
            ->orderByDesc('wins')
            ->orderBy('created_at', 'asc') // Desempate por timestamp (antiguidade)
            ->orderBy('id', 'asc')
            ->simplePaginate($perPage, ['*'], 'page', $winsPage);

        $wins->getCollection()->transform(function ($u) {
            return [
                'id'       => $u->id,
                'name'     => $u->name,
                'nickname' => $u->nickname,
                'wins'     => $u->wins,
            ];
        });

        // --- 2. Ranking de Moedas ---
        // Ordenação: Mais moedas > Conta mais antiga > ID menor
        $coins = User::orderByDesc('coins_balance')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->simplePaginate($perPage, ['*'], 'page', $coinsPage);

        $coins->getCollection()->transform(function ($u) {
            return [
                'id'            => $u->id,
                'name'          => $u->name,
                'nickname'      => $u->nickname,
                'coins_balance' => $u->coins_balance,
            ];
        });

        // --- 3. Ranking de Achievements ---
        // Ordenação: Total > Bandeiras > Conta mais antiga > ID
        $achievements = User::select('id', 'name', 'nickname', 'capote_count', 'bandeira_count', 'created_at')
            ->selectRaw('(COALESCE(capote_count,0) + COALESCE(bandeira_count,0)) as total')
            ->orderByDesc('total')
            ->orderByDesc('bandeira_count')
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->simplePaginate($perPage, ['*'], 'page', $achPage);

        $achievements->getCollection()->transform(function ($u) {
            return [
                'id'            => $u->id,
                'name'          => $u->name,
                'nickname'      => $u->nickname,
                'capote_count'   => $u->capote_count,
                'bandeira_count' => $u->bandeira_count,
                'total'         => $u->total,
            ];
        });

        return response()->json([
            'wins'         => $wins,
            'coins'        => $coins,
            'achievements' => $achievements,
            'meta' => [
                'wins_page'  => $winsPage,
                'coins_page' => $coinsPage,
                'ach_page'   => $achPage
            ]
        ]);
    }

    /**
     * Calcula a página exata baseada na ordenação complexa (Score -> Timestamp -> ID)
     */
    private function calculatePageForUser($type, $user, $perPage)
    {
        // Define os valores base para comparação
        $myId = $user->id;
        $myCreatedAt = $user->created_at; 

        // Constrói a query base dependendo do tipo
        $query = User::query();

        if ($type === 'coins') {
            $myScore = $user->coins_balance ?? 0;
            $column = 'coins_balance';

            // 1. Quem tem estritamente mais pontos
            $betterScore = User::where($column, '>', $myScore)->count();

            // 2. Quem tem mesmos pontos MAS conta mais antiga (created_at menor)
            $tieTime = User::where($column, '=', $myScore)
                ->where('created_at', '<', $myCreatedAt)
                ->count();

            // 3. Quem tem mesmos pontos, mesmo tempo, MAS id menor (ou igual para incluir o próprio)
            $tieId = User::where($column, '=', $myScore)
                ->where('created_at', '=', $myCreatedAt)
                ->where('id', '<=', $myId)
                ->count();

            $rank = $betterScore + $tieTime + $tieId;

        } elseif ($type === 'wins') {
            // Wins é complexo porque é um COUNT de relacionamento.
            // Precisamos usar has() para filtrar por contagem.
            
            // Primeiro descobrimos quantas vitórias o user tem
            $myScore = $user->gamesWon()->count(); 

            // 1. Quem tem mais vitórias que eu
            $betterScore = User::has('gamesWon', '>', $myScore)->count();

            // 2. Quem tem mesmas vitórias MAS conta mais antiga
            $tieTime = User::has('gamesWon', '=', $myScore)
                ->where('created_at', '<', $myCreatedAt)
                ->count();

            // 3. Empate total até ao ID
            $tieId = User::has('gamesWon', '=', $myScore)
                ->where('created_at', '=', $myCreatedAt)
                ->where('id', '<=', $myId)
                ->count();
            
            $rank = $betterScore + $tieTime + $tieId;

        } elseif ($type === 'achievements') {
            // Este é o mais complexo: Total -> Bandeiras -> Timestamp -> ID
            $myCapote = $user->capote_count ?? 0;
            $myBandeira = $user->bandeira_count ?? 0;
            $myTotal = $myCapote + $myBandeira;

            // Expressão raw para o total
            $rawTotal = '(COALESCE(capote_count,0) + COALESCE(bandeira_count,0))';

            // 1. Total Maior
            $betterTotal = User::whereRaw("$rawTotal > ?", [$myTotal])->count();

            // 2. Total Igual, mas Bandeiras Maior
            $betterSub = User::whereRaw("$rawTotal = ?", [$myTotal])
                ->where('bandeira_count', '>', $myBandeira)
                ->count();

            // 3. Total Igual, Bandeiras Igual, mas Timestamp Mais Antigo
            $tieTime = User::whereRaw("$rawTotal = ?", [$myTotal])
                ->where('bandeira_count', '=', $myBandeira)
                ->where('created_at', '<', $myCreatedAt)
                ->count();

            // 4. Tudo Igual, ID menor/igual
            $tieId = User::whereRaw("$rawTotal = ?", [$myTotal])
                ->where('bandeira_count', '=', $myBandeira)
                ->where('created_at', '=', $myCreatedAt)
                ->where('id', '<=', $myId)
                ->count();

            $rank = $betterTotal + $betterSub + $tieTime + $tieId;
        } else {
            return 1;
        }

        return ceil($rank / $perPage);
    }
}