<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GamesSeeder extends Seeder
{
    private $ratioStandaloneToMatch = 15;
    private $gameID = 0;
    private $matchID = 0;

    // Baralho para visualização nas vazas
    private $deckCards = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
    private $deckSuits = ['c', 'e', 'o', 'p']; 

    private function calculateRandomSeconds($filteredCollection)
    {
        $totalPlayers = $filteredCollection->count() + 1;
        return (12 * 60 * 60) / $totalPlayers + rand(0, 2000);
    }

    private function nextGameDateTime(&$d, $filteredPlayers, $withinSameMatch = false) {
        if ($withinSameMatch) {
            $deltaSegundos = rand(300, 900);
        } else {
            $deltaSegundos = $this->calculateRandomSeconds($filteredPlayers);
        }
        $d->addSeconds($deltaSegundos);
    }

    public function run(): void
    {
        $this->command->info("Games seeder - Start");

        // Inicializar IDs
        $this->gameID = DB::table('games')->max('id') ?? 0;
        $this->matchID = DB::table('matches')->max('id') ?? 0;

        $start = DB::table('users')->where('type', 'P')->min('created_at');
        // Se não houver users, usa now() para não dar erro, mas idealmente deve haver users
        $start = $start ? $start : Carbon::now()->subDays(30);

        $allPlayers = DB::table('users')->where('type', 'P')->get();
        
        if ($allPlayers->isEmpty()) {
            $this->command->error("No players found.");
            return;
        }

        $sortedPlayers = $allPlayers->sortBy('created_at')->values();

        $d = new \Carbon\Carbon($start);
        $d = $d->addDay();
        $now = \Carbon\Carbon::now();
        
        $games = [];
        $matches = [];
        $moves = [];

        $i = 0;
        $filteredPlayers = null;
        $filteredPlayersIds = null;
        $nextCreatedAt = null;

        while ($d->lte($now)) {
            $i++;
            
            if (($filteredPlayers === null) || ($nextCreatedAt === null) || ($d->gte($nextCreatedAt))) {
                $filteredPlayers = $allPlayers->filter(function ($value) use ($d) { return $d->gt($value->created_at); });
                $nextCreatedAtPlayer = $sortedPlayers->first(function ($value) use ($d) { return $d->lte($value->created_at); });
                $nextCreatedAt = $nextCreatedAtPlayer ? $nextCreatedAtPlayer->created_at : new \Carbon\Carbon('9999-12-31');
                $filteredPlayersIds = $filteredPlayers->pluck('id')->toArray();
            }

            if (!$filteredPlayersIds || count($filteredPlayersIds) < 2) {
                $this->nextGameDateTime($d, $filteredPlayers);
                continue;
            }

            $userIdKeys = array_rand($filteredPlayersIds, 2);
            $userIDPlayer1 = $filteredPlayersIds[$userIdKeys[0]];
            $userIDPlayer2 = $filteredPlayersIds[$userIdKeys[1]];

            if ($userIDPlayer1 == $userIDPlayer2) {
                $this->nextGameDateTime($d, $filteredPlayers);
                continue;
            }

            // --- Lógica Principal ---
            $match = null;
            if (rand(1, $this->ratioStandaloneToMatch) === 1) {
                // MATCH
                $match = $this->newMatch($filteredPlayers, $userIDPlayer1, $userIDPlayer2, $d);
                $playersMarks = [0, 0];
                $playersPoints = [0, 0];
                
                $p1CapoteMatch = false; $p1BandeiraMatch = false;
                $p2CapoteMatch = false; $p2BandeiraMatch = false;

                while($playersMarks[0] < 4 && $playersMarks[1] < 4) {
                    $gameData = $this->newGame($filteredPlayers, $match, $userIDPlayer1, $userIDPlayer2, $d);
                    
                    $newGame = $gameData['game'];
                    $games[] = $newGame;
                    $moves = array_merge($moves, $gameData['moves']);

                    $playersPoints[0] += $newGame['player1_points'];
                    $playersPoints[1] += $newGame['player2_points'];

                    $isBandeira = $gameData['is_bandeira'] ?? false;
                    $gameWinner = $newGame['player1_points'] > $newGame['player2_points'] ? 1 : 2;

                    if ($newGame['player1_points'] == 120) $p1CapoteMatch = true;
                    if ($newGame['player2_points'] == 120) $p2CapoteMatch = true;
                    if ($isBandeira && $gameWinner == 1) $p1BandeiraMatch = true;
                    if ($isBandeira && $gameWinner == 2) $p2BandeiraMatch = true;

                    if ($newGame['player1_points'] > $newGame['player2_points']) {
                        if ($newGame['player1_points'] >= 120) $playersMarks[0]+= 4;
                        elseif ($newGame['player1_points'] >= 91) $playersMarks[0] += 2;
                        else $playersMarks[0]++;
                    } elseif ($newGame['player2_points'] > $newGame['player1_points']) {
                        if ($newGame['player2_points'] >= 120) $playersMarks[1]+= 4;
                        elseif ($newGame['player2_points'] >= 91) $playersMarks[1] += 2;
                        else $playersMarks[1]++;
                    }
                }

                $this->updateMatchWinner(
                    $match, 
                    $playersMarks[0], $playersMarks[1], 
                    $playersPoints[0], $playersPoints[1], 
                    $d,
                    $p1CapoteMatch, $p1BandeiraMatch,
                    $p2CapoteMatch, $p2BandeiraMatch
                );
                $matches[] = $match;

            } else {
                // SINGLE GAME
                $gameData = $this->newGame($filteredPlayers, $match, $userIDPlayer1, $userIDPlayer2, $d);
                $games[] = $gameData['game'];
                $moves = array_merge($moves, $gameData['moves']);
            }

            if ($i >= 200) { 
                $this->flushToDatabase($matches, $games, $moves, $d);
                $matches = []; $games = []; $moves = []; $i = 0;
            }
        }
        $this->flushToDatabase($matches, $games, $moves, $d);
        $this->command->info("Games seeder - End");
    }

    private function flushToDatabase($matches, $games, $moves, $d) {
        if (!empty($matches)) DB::table('matches')->insert($matches);
        if (!empty($games)) {
            DB::table('games')->insert($games);
            foreach (array_chunk($moves, 1000) as $chunk) {
                DB::table('game_moves')->insert($chunk);
            }
            $this->command->info("Saved state at " . $d->format('Y-m-d H:i:s'));
        }
    }

    private function newMatch($filteredPlayers, $user1, $user2, $d) {
        $this->matchID++;
        $this->nextGameDateTime($d, $filteredPlayers);
        return [
            'id' => $this->matchID,
            'type' => random_int(1,2) == 1 ? '3' : '9',
            'player1_user_id' => $user1,
            'player2_user_id' => $user2,
            'status' => 'Ended',
            'stake' => random_int(1,4) > 1 ? 3 : random_int(4,100),
            'began_at' => $d->copy(),
            'coins_reward' => 0,
            // REMOVIDO: created_at e updated_at
        ];
    }

    private function updateMatchWinner(&$match, $player1Marks, $player2Marks, $totalPlayers1, $totalPlayers2, $d, $p1Capote, $p1Bandeira, $p2Capote, $p2Bandeira)
    {
        $match['player1_marks'] = $player1Marks;
        $match['player2_marks'] = $player2Marks;
        $match['player1_points'] = $totalPlayers1;
        $match['player2_points'] = $totalPlayers2;
        $match['ended_at'] = $d->copy();
        
        $began = $match['began_at'] instanceof Carbon ? $match['began_at'] : Carbon::parse($match['began_at']);
        $match['total_time'] = $began->diffInSeconds($d);

        if ($player1Marks > $player2Marks) {
            $match['winner_user_id'] = $match['player1_user_id'];
            $match['loser_user_id'] = $match['player2_user_id'];
        } elseif ($player2Marks > $player1Marks) {
            $match['winner_user_id'] = $match['player2_user_id'];
            $match['loser_user_id'] = $match['player1_user_id'];
        } else {
            $match['winner_user_id'] = null;
            $match['loser_user_id'] = null;
        }

        $coins = 0;
        if ($match['player1_marks'] > $match['player2_marks']) {
            $coins = 50; 
            if ($p1Capote) $coins += 20;
            if ($p1Bandeira) $coins += 30;
        }
        $match['coins_reward'] = $coins;
    }

    private function newGame($filteredPlayers, $match, $user1, $user2, $d)
    {
        $this->gameID++;
        $this->nextGameDateTime($d, $filteredPlayers, $match != null);
        $begin_d = $d->copy();

        $pointsUser1 = 60;
        $pointsUser2 = 60;
        $isBandeira = false;
        $forcedWinner = null; 

        $rand = random_int(1, 100);
        if ($rand <= 5) {
            $pointsUser1 = 120; $pointsUser2 = 0;
            $isBandeira = true; $forcedWinner = 'player';
        } elseif ($rand <= 10) {
            $pointsUser1 = 0; $pointsUser2 = 120;
            $isBandeira = true; $forcedWinner = 'bot';
        } elseif ($rand <= 20) {
            $pointsUser1 = 120; $pointsUser2 = 0;
        } elseif ($rand <= 30) {
            $pointsUser1 = 0; $pointsUser2 = 120;
        } else {
            if (random_int(1, 30) > 1) {
                $pointsUser1 = rand(0, 119);
                $pointsUser2 = 120 - $pointsUser1;
            }
        }

        $duration = random_int(200, 900);
        $d->addSeconds($duration);

        $game = [
            'id' => $this->gameID,
            'type' => $match ? $match['type'] : '9',
            'match_id' => $match ? $match['id'] : null,
            'player1_user_id' => $user1,
            'player2_user_id' => $user2,
            'is_draw' => $pointsUser1 == $pointsUser2,
            'winner_user_id' => $pointsUser1 > $pointsUser2 ? $user1 : ($pointsUser2 > $pointsUser1 ? $user2 : null),
            'loser_user_id' => $pointsUser1 < $pointsUser2 ? $user1 : ($pointsUser2 < $pointsUser1 ? $user2 : null),
            'status' => 'Ended',
            'began_at' => $begin_d,
            'ended_at' => $d->copy(),
            'total_time' => $duration,
            'player1_points' => $pointsUser1,
            'player2_points' => $pointsUser2,
            // REMOVIDO: created_at e updated_at
        ];

        $moves = $this->generateMoves($this->gameID, $pointsUser1, $pointsUser2, $d, $forcedWinner);

        return [
            'game' => $game,
            'moves' => $moves,
            'is_bandeira' => $isBandeira 
        ];
    }

    private function generateMoves($gameId, $totalP1, $totalP2, $date, $forcedWinner = null)
    {
        $moves = [];
        $p1Remaining = $totalP1;
        $p2Remaining = $totalP2;

        $deck = [];
        foreach($this->deckSuits as $suit) {
            foreach($this->deckCards as $card) $deck[] = $card . $suit;
        }
        shuffle($deck);

        for ($round = 1; $round <= 10; $round++) {
            $p1Card = array_pop($deck) ?? 'ac';
            $p2Card = array_pop($deck) ?? '7o';

            $winner = ''; 
            $pointsThisRound = 0;

            if ($forcedWinner) {
                $winner = $forcedWinner;
            } else {
                if ($p1Remaining > 0 && $p2Remaining > 0) {
                    $winner = (rand(0, 100) < 50) ? 'player' : 'bot';
                } elseif ($p1Remaining > 0) {
                    $winner = 'player';
                } else {
                    $winner = 'bot';
                }
            }

            if ($winner === 'player') {
                if ($round == 10 || $p1Remaining <= 11) {
                    $pointsThisRound = $p1Remaining;
                } else {
                    $max = min($p1Remaining, 25);
                    $pointsThisRound = rand(0, $max);
                }
                $p1Remaining -= $pointsThisRound;
            } else {
                if ($round == 10 || $p2Remaining <= 11) {
                    $pointsThisRound = $p2Remaining;
                } else {
                    $max = min($p2Remaining, 25);
                    $pointsThisRound = rand(0, $max);
                }
                $p2Remaining -= $pointsThisRound;
            }

            $moves[] = [
                'game_id'       => $gameId,
                'round_number'  => $round,
                'player_card'   => $p1Card,
                'bot_card'      => $p2Card,
                'winner'        => $winner,
                'points_earned' => $pointsThisRound,
            ];
        }
        return $moves;
    }
}