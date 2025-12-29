<?php
namespace App\Http\Controllers;

use App\Http\Resources\CoinTransactionResource;
use Illuminate\Http\Request;

class CoinController extends Controller
{
    // Mostrar o histórico de moedas do próprio utilizador [cite: 88]
    public function index(Request $request)
    {
        $transactions = $request->user()->coinTransactions()
            ->with(['game', 'match', 'type'])
            ->orderBy('transaction_datetime', 'desc')
            ->paginate(15);

        return CoinTransactionResource::collection($transactions);
    }

    // Endpoint para ver o saldo atual [cite: 83]
    public function getBalance(Request $request)
    {
        return response()->json([
            'nickname' => $request->user()->nickname,
            'coins_balance' => $request->user()->coins_balance
        ]);
    }
}