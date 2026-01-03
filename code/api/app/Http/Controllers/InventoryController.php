<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ShopItem;
use App\Models\UserInventory;
use App\Models\User;

class InventoryController extends Controller
{
    // GET /api/users/inventory (para Web - Vue)
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Não autenticado'], 401);
        }

        // Busca itens do inventário com JOIN para obter o type
        $inventoryItems = UserInventory::join('shop_items', 'user_inventory.item_resource_name', '=', 'shop_items.resource_name')
            ->where('user_inventory.user_id', $user->id)
            ->select('shop_items.resource_name as item_resource_name', 'shop_items.type')
            ->get();

        // Converte para array
        $items = $inventoryItems->toArray();

        // Verifica se tem os defaults
        $hasDefaultDeck = collect($items)->contains(fn($item) =>
            $item['item_resource_name'] === 'deck1_preview'
        );
        $hasDefaultAvatar = collect($items)->contains(fn($item) =>
            $item['item_resource_name'] === 'default_avatar'
        );

        // Adiciona defaults se necessário
        if (!$hasDefaultDeck) {
            array_unshift($items, ['item_resource_name' => 'deck1_preview', 'type' => 'deck']);
        }
        if (!$hasDefaultAvatar) {
            array_unshift($items, ['item_resource_name' => 'default_avatar', 'type' => 'avatar']);
        }

        return response()->json($items);
    }

    // POST /api/users/equip (compatível com Web e Android)
    public function equip(Request $request)
    {
        $user = $request->user();

        // Se não tem auth (Android), usa email
        if (!$user) {
            $request->validate([
                'email' => 'required|email',
                'type' => 'required|in:deck,avatar',
                'resource_name' => 'required|string'
            ]);

            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $resourceName = $request->resource_name;
            $type = $request->type;
        } else {
            // Web (Sanctum)
            $request->validate([
                'item_resource_name' => 'required|string',
                'type' => 'required|in:deck,avatar',
            ]);

            $resourceName = $request->item_resource_name;
            $type = $request->type;
        }

        // Verificar se o user TEM o item no inventário (ou é default)
        $hasItem = UserInventory::where('user_id', $user->id)
            ->where('item_resource_name', $resourceName)
            ->exists();

        $isDefault = ($resourceName === 'deck1_preview' || $resourceName === 'default_avatar');

        if (!$hasItem && !$isDefault) {
            return response()->json(['error' => 'Não tens este item no inventário'], 403);
        }

        // Atualizar current_deck ou current_avatar
        if ($type === 'deck') {
            $user->current_deck = $resourceName;
        } else {
            $user->current_avatar = $resourceName;
        }

        $user->save();

        return response()->json([
            'message' => 'Equipado com sucesso',
            'current_item' => $resourceName,
            'user' => $user
        ]);
    }
}
