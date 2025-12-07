<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ShopItem;
use App\Models\UserInventory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ShopController extends Controller
{
    // GET /api/shop/items?email=...
    public function index(Request $request)
    {
        $email = $request->query('email');

        // 1. Encontrar o User para saber o ID
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([]);
        }

        // 2. Busca todos os itens da loja
        $shopItems = ShopItem::all();

        // 3. Busca inventário pelo user_id
        $myInventory = UserInventory::where('user_id', $user->id)
                                    ->pluck('item_resource_name')
                                    ->toArray();

        // 4. Formata a resposta
        $formattedItems = $shopItems->map(function ($item) use ($myInventory) {
            return [
                'name' => $item->name,
                'resourceName' => $item->resource_name,
                'price' => $item->price,
                'isPurchased' => in_array($item->resource_name, $myInventory),
                'type' => $item->type
            ];
        });

        return response()->json($formattedItems);
    }

    // POST /api/shop/buy
    public function buy(Request $request)
    {
        $email = $request->input('email');
        $itemId = $request->input('item_id'); // resource_name
        $price = $request->input('price');

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Verifica saldo (Confirma se na BD é 'coins_balance')
        if ($user->coins_balance < $price) {
            return response()->json(['error' => 'Insufficient coins'], 400);
        }

        // Verifica se já tem o item
        $exists = UserInventory::where('user_id', $user->id)
                               ->where('item_resource_name', $itemId)
                               ->exists();

        if ($exists) {
            return response()->json(['error' => 'Item already purchased'], 400);
        }

        try {
            DB::beginTransaction();

            // Desconta o dinheiro
            $user->coins_balance -= $price;
            $user->save();

            // Adiciona ao inventário
            // Se o 'user_id' não estiver no $fillable do Modelo, isto falha com erro 500!
            UserInventory::create([
                'user_id' => $user->id,
                'item_resource_name' => $itemId
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Purchase successful',
                'new_balance' => $user->coins_balance
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            // O getMessage() vai dizer-te exatamente qual foi o erro no Android Logcat se falhar
            return response()->json(['error' => 'Transaction failed: ' . $e->getMessage()], 500);
        }
    }
}
