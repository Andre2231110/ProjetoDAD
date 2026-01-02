<?php

namespace App\Http\Controllers;

use App\Models\MatchGame;
use Illuminate\Http\Request;

class MatchHistoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $history = MatchGame::where(function($query) use ($user) {
                $query->where('player1_user_id', $user->id)
                      ->orWhere('player2_user_id', $user->id);
            })
            ->where('status', 'Ended') 
            ->with(['player1', 'player2', 'games']) 
            ->orderBy('ended_at', 'desc') 
            ->paginate(10); 

        return response()->json($history);
    }
}