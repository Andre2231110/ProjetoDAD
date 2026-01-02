<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Game; // IMPORTANTE
use App\Models\MatchGame; // IMPORTANTE
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RankingController extends Controller
{
    public function globalRanking(Request $request)
    {
        $variant = $request->query('variant');

        // Top Jogadores por Jogos
        $byWins = User::where('type', 'P')
            ->select('id', 'nickname', 'photo_avatar_filename', 'capote_count', 'bandeira_count')
            ->withCount(['gamesWon as total_wins' => function ($q) use ($variant) {
                if ($variant) $q->where('type', $variant);
            }])
            ->orderBy('total_wins', 'desc')
            ->orderBy('id', 'asc') // Desempate por antiguidade
            ->take(10)->get();

        // Top Jogadores por Matches
        $byMatches = User::where('type', 'P')
            ->select('id', 'nickname', 'photo_avatar_filename', 'capote_count', 'bandeira_count')
            ->withCount(['matchesWon as total_matches']) 
            ->orderBy('total_matches', 'desc')
            ->orderBy('id', 'asc')
            ->take(10)->get();

        return response()->json([
            'by_wins' => $byWins,
            'by_matches' => $byMatches
        ]);
    }

    public function personalStats(Request $request)
    {
        try {
            $user = $request->user();

            // Contagem direta para evitar erros de relação complexa
            $gameWins = Game::where('winner_user_id', $user->id)->count();
            $matchWins = MatchGame::where('winner_user_id', $user->id)->count();

            // Lógica de posição simplificada e segura
            $position = User::where('type', 'P')
                ->whereHas('gamesWon', function($q) use ($gameWins) {
                     // Conta apenas users que têm mais vitórias que tu
                }, '>', $gameWins)
                ->count() + 1;

            // Se a query acima for pesada, usamos esta alternativa SQL direta:
            $position = DB::table('users')
                ->where('type', 'P')
                ->whereRaw('(SELECT COUNT(*) FROM games WHERE games.winner_user_id = users.id) > ?', [$gameWins])
                ->count() + 1;

            return response()->json([
                'game_wins' => $gameWins,
                'match_wins' => $matchWins,
                'capotes' => $user->capote_count ?? 0,
                'bandeiras' => $user->bandeira_count ?? 0,
                'position' => $position
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}