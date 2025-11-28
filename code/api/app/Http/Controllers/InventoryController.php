<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ShopItem;
use App\Models\UserInventory;
use App\Models\User; // Necessário para buscar o ID

class InventoryController extends Controller
{
    // GET /api/users/inventory?email=...
    public function index(Request $request)
    {
        $email = $request->query('email');

        // 1. Encontrar o User para saber o ID
        $user = User::where('email', $email)->first();

        // Se o user não existir, retornamos apenas os defaults para não dar erro no Android
        if (!$user) {
            return response()->json([
                'decks' => ['deck1_preview'],
                'avatars' => ['default_avatar']
            ]);
        }

        // 2. Faz um JOIN usando o USER_ID
        $inventoryItems = UserInventory::join('shop_items', 'user_inventory.item_resource_name', '=', 'shop_items.resource_name')
            ->where('user_inventory.user_id', $user->id) // <--- AQUI ESTAVA O ERRO (era user_email)
            ->get(['shop_items.resource_name', 'shop_items.type']);

        // Separa em duas listas
        $decks = [];
        $avatars = [];

        foreach ($inventoryItems as $item) {
            if ($item->type === 'deck') {
                $decks[] = $item->resource_name;
            } elseif ($item->type === 'avatar') {
                $avatars[] = $item->resource_name;
            }
        }

        // Garante os defaults
        if (!in_array('deck1_preview', $decks)) array_unshift($decks, 'deck1_preview');
        if (!in_array('default_avatar', $avatars)) array_unshift($avatars, 'default_avatar');

        return response()->json([
            'decks' => $decks,
            'avatars' => $avatars
        ]);
    }
}
