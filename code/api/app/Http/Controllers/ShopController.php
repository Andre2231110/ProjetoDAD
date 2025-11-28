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

        // 1. PRIMEIRO: Encontrar o User pelo email para saber o ID
        $user = User::where('email', $email)->first();

        if (!$user) {
            // Se o user não existir, retorna lista vazia ou erro
            return response()->json([]);
        }

        // 2. Busca todos os itens da loja
        $shopItems = ShopItem::all();

        // 3. Busca o que este user já comprou USANDO O ID (user_id)
        // CORREÇÃO: Antes estava 'user_email', mas a tabela usa 'user_id'
        $myInventory = UserInventory::where('user_id', $user->id)
                                    ->pluck('item_resource_name')
                                    ->toArray();

        // 4. Formata a resposta para o Android
        $formattedItems = $shopItems->map(function ($item) use ($myInventory) {
            return [
                'name' => $item->name,
                'resourceName' => $item->resource_name,
                'price' => $item->price,
                // Agora o in_array vai funcionar porque $myInventory já tem dados!
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
        $itemId = $request->input('item_id');
        $price = $request->input('price');

        // 1. Verificar User e Saldo
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($user->coins_balance < $price) { // Confirma se é 'coins' ou 'coins_balance' no teu User Model
            return response()->json(['error' => 'Insufficient coins'], 400);
        }

        // 2. Verificar se já tem o item (USANDO user_id)
        $exists = UserInventory::where('user_id', $user->id) // <--- CORREÇÃO AQUI TAMBÉM
                               ->where('item_resource_name', $itemId)
                               ->exists();

        if ($exists) {
            return response()->json(['error' => 'Item already purchased'], 400);
        }

        // 3. Transação
        try {
            DB::beginTransaction();

            // Atualiza saldo
            $user->coins_balance -= $price; // Confirma o nome da coluna
            $user->save();

            // Adiciona ao inventário (USANDO user_id)
            UserInventory::create([
                'user_id' => $user->id, // <--- CORREÇÃO
                'item_resource_name' => $itemId
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Purchase successful',
                'new_balance' => $user->coins_balance
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Transaction failed: ' . $e->getMessage()], 500);
        }
    }
}
