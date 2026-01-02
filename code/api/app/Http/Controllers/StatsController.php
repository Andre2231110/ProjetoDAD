<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\MatchGame;
use App\Models\Game;
use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StatsController extends Controller
{
    /**
     * ESTATÍSTICAS PÚBLICAS
     * Acessíveis a qualquer visitante (anónimo ou logado).
     */
    public function publicStats()
    {
        return response()->json([
            'total_registered_players' => User::where('type', 'P')->count(),
            'total_matches_played' => MatchGame::where('status', 'Ended')->count(),
            'total_games_played' => Game::count(),
            'total_coins_in_circulation' => User::sum('coins_balance'),
            'daily_games_volume' => MatchGame::whereDate('began_at', now()->today())->count()
        ]);
    }

    /**
     * ESTATÍSTICAS PESSOAIS
     * Apenas para o utilizador autenticado.
     */
    public function personal(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Não autenticado'], 401);
        }

        // Total de Matches (Partidas completas)
        $totalMatches = MatchGame::where(function($q) use ($user) {
            $q->where('player1_user_id', $user->id)
              ->orWhere('player2_user_id', $user->id);
        })->where('status', 'Ended')->count();

        // Vitórias totais
        $wins = MatchGame::where('winner_user_id', $user->id)->count();

        return response()->json([
            'nickname' => $user->nickname,
            'total_matches' => $totalMatches,
            'wins' => $wins,
            'winrate' => $totalMatches > 0 ? round(($wins / $totalMatches) * 100, 1) : 0,
            'coins_balance' => $user->coins_balance,
            'capote_count' => $user->capote_count ?? 0,
            'bandeira_count' => $user->bandeira_count ?? 0
        ]);
    }

    /**
     * ESTATÍSTICAS ADMINISTRATIVAS
     * Dashboard completo com gráficos para Admins.
     */
    public function adminStats(Request $request)
    {
        return response()->json([
            'summary' => [
                'total_users' => User::count(),
                'total_games' => Game::count(),
                'total_coin_purchases' => CoinPurchase::count(),
                'total_revenue_euros' => CoinPurchase::sum('euros'),
            ],
            'purchases_by_day' => CoinPurchase::select(
                DB::raw('DATE(purchase_datetime) as day'),
                DB::raw('count(*) as purchases_count'),
                DB::raw('sum(euros) as total_spent')
            )->groupBy('day')->orderBy('day', 'asc')->get(),

            'games_won_by_day' => MatchGame::select(
                DB::raw('DATE(ended_at) as day'),
                DB::raw('count(*) as wins')
            )->whereNotNull('winner_user_id')->groupBy('day')->orderBy('day', 'asc')->get(),

            'coins_by_day' => MatchGame::select(
                DB::raw('DATE(ended_at) as day'),
                DB::raw('sum(coins_reward) as coins_total')
            )->whereNotNull('winner_user_id')->groupBy('day')->orderBy('day', 'asc')->get(),

            'all_users' => User::select('id', 'name', 'nickname', 'coins_balance', 'type')->get()
        ]);
    }
}