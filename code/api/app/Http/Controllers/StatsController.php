<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function personal(Request $request)
    {
        $user = $request->user(); // user autenticado pelo token

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // --------- ESTATÍSTICAS ---------

        // Número total de jogos onde o user participou
        $totalMatches = Game::where('player1_user_id', $user->id)
            ->orWhere('player2_user_id', $user->id)
            ->count();

        // Número de vitórias
        $wins = Game::where('winner_user_id', $user->id)->count();

        // Winrate
        $winrate = $totalMatches > 0
            ? round(($wins / $totalMatches) * 100, 1)
            : 0;

        // Coins ganhas (somando coins_balance do winner)
        $coinsEarned = Game::where('winner_user_id', $user->id)
            ->with('winner')
            ->get()
            ->sum(fn($g) => $g->winner->coins_balance ?? 0);


        return response()->json([
            'total_matches' => $totalMatches,
            'wins' => $wins,
            'winrate' => $winrate,
            'coins_earned' => $coinsEarned,
            'capote_count' => $user->capote_count ?? 0, //diretamente do User model
            'bandeira_count' => $user->bandeira_count ?? 0
        ]);
    }
     public function adminStats(Request $request)
    {
        $user = $request->user();


        // ---------- JOGOS ----------
        $totalGames = Game::count();
        $totalGamesByPlayer = Game::select('winner_user_id', DB::raw('count(*) as wins'))
            ->groupBy('winner_user_id')
            ->with('winner')
            ->get()
            ->map(function($g) {
                return [
                    'player_id' => $g->winner->id ?? null,
                    'player_name' => $g->winner->name ?? 'Unknown',
                    'wins' => $g->wins
                ];
            });

        // ---------- COMPRAS DE COINS ----------
        $totalPurchases = CoinPurchase::count();
        $totalRevenue = CoinPurchase::sum('euros');

        $purchasesByUser = CoinPurchase::with('user')
            ->select('user_id', DB::raw('count(*) as purchases_count'), DB::raw('sum(euros) as total_spent'))
            ->groupBy('user_id')
            ->get()
            ->map(function($p) {
                return [
                    'user_id' => $p->user->id ?? null,
                    'user_name' => $p->user->name ?? 'Unknown',
                    'purchases_count' => $p->purchases_count,
                    'total_spent' => $p->total_spent,
                ];
            });

        // ---------- COINS GANHOS ----------
        $coinsByUser = CoinTransaction::with('user')
            ->select('user_id', DB::raw('sum(coins) as coins_total'))
            ->groupBy('user_id')
            ->get()
            ->map(function($c) {
                return [
                    'user_id' => $c->user->id ?? null,
                    'user_name' => $c->user->name ?? 'Unknown',
                    'coins_total' => $c->coins_total,
                ];
            });

        // ---------- USUÁRIOS ----------
        $totalUsers = User::count();
        $users = User::select('id', 'name', 'email', 'coins_balance', 'capote_count', 'bandeira_count')->get();

        return response()->json([
            'summary' => [
                'total_users' => $totalUsers,
                'total_games' => $totalGames,
                'total_coin_purchases' => $totalPurchases,
                'total_revenue_euros' => $totalRevenue,
            ],
            'games_by_player' => $totalGamesByPlayer,
            'purchases_by_user' => $purchasesByUser,
            'coins_by_user' => $coinsByUser,
            'all_users' => $users
        ]);
    }

}
