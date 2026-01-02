<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCoinPurchaseRequest;
use App\Http\Resources\CoinTransactionResource;
use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

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
            'nickname'      => $request->user()->nickname,
            'coins_balance' => $request->user()->coins_balance,
        ]);
    }

    public function getAllTransactions(Request $request)
    {
        if ($request->user()->type !== 'A') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        
        $transactions = CoinTransaction::with(['user', 'game', 'match', 'type'])
            ->orderBy('transaction_datetime', 'desc')
            ->paginate(20);

        return CoinTransactionResource::collection($transactions);
    }

    public function purchase(StoreCoinPurchaseRequest $request)
    {
        $user = $request->user();
        $data = $request->validated(); // type, reference, value (euros)

        // 1. chamar o Payment Gateway
        $response = Http::withoutVerifying()->post(
            'https://dad-payments-api.vercel.app/api/debit',
            [
                'type'      => $data['type'],
                'reference' => $data['reference'],
                'value'     => $data['value'],
            ]
        ); // envia JSON automaticamente[web:14]

        if (! $response->created()) {
            return response()->json([
                'message' => 'Payment failed',
                'errors'  => $response->json(),
            ], $response->status() ?: 422);
        }

        // 2. se o pagamento passou, registar transação + compra
        return DB::transaction(function () use ($user, $data) {
            $coins = $data['value'] * 10;

                                 // tipo da transação: assume que tens um ID/enum para PURCHASE
            $purchaseTypeId = 2; // valor nos seeders

            $transaction = CoinTransaction::create([
                'transaction_datetime'     => now(),
                'user_id'                  => $user->id,
                'game_id'                  => null,
                'match_id'                 => null,
                'coin_transaction_type_id' => $purchaseTypeId,
                'coins'                    => $coins,
            ]);

            // atualizar saldo do utilizador
            $user->increment('coins_balance', $coins);

            CoinPurchase::create([
                'purchase_datetime'   => now(),
                'user_id'             => $user->id,
                'coin_transaction_id' => $transaction->id,
                'euros'               => $data['value'],
                'payment_type'        => $data['type'],
                'payment_reference'   => $data['reference'],
                'custom'              => null,
            ]);

            return new CoinTransactionResource(
                $transaction->load(['game', 'match', 'type'])
            );
        });
    }
}
