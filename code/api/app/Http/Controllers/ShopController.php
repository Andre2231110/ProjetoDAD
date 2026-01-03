<?php
namespace App\Http\Controllers;

use App\Models\ShopItem;
use App\Models\User;
use App\Models\UserInventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShopController extends Controller
{
    // GET /api/shop/items?email=...
    public function index(Request $request)
    {
        $email = $request->query('email');

        // 1. Encontrar o User para saber o ID
        $user = User::where('email', $email)->first();

        if (! $user) {
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
                'name'         => $item->name,
                'resourceName' => $item->resource_name,
                'price'        => $item->price,
                'isPurchased'  => in_array($item->resource_name, $myInventory),
                'type'         => $item->type,
            ];
        });

        return response()->json($formattedItems);
    }

    // POST /api/shop/buy
    public function buy(Request $request)
    {
        $request->validate([
            'item_id' => 'required|string|exists:shop_items,resource_name',
        ]);

        $user = $request->user();

        $item = ShopItem::where('resource_name', $request->item_id)->first();

        if ($user->coins_balance < $item->price) {
            return response()->json(['message' => 'Saldo insuficiente'], 400);
        }

        $alreadyOwned = UserInventory::where('user_id', $user->id)
            ->where('item_resource_name', $item->resource_name)
            ->exists();

        if ($alreadyOwned) {
            return response()->json(['message' => 'Item já adquirido'], 400);
        }

        DB::transaction(function () use ($user, $item) {
            $user->coins_balance -= $item->price;
            $user->save();

            UserInventory::create([
                'user_id'            => $user->id,
                'item_resource_name' => $item->resource_name,
            ]);
        });

        return response()->json([
            'message'     => 'Compra efetuada com sucesso',
            'new_balance' => $user->coins_balance,
        ]);
    }
}
