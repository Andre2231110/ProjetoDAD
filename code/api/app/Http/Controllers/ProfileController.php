<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use App\Models\UserInventory;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        // Validação dos campos
        $request->validate([
            'name' => 'required|string|max:255',
            'nickname' => ['required', 'string', 'max:50', Rule::unique('users', 'nickname')->ignore($user->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:3|confirmed',
            'avatar' => 'nullable|image|max:2048',
            'inventory_avatar' => 'nullable|string',
            'inventory_deck' => 'nullable|string',
        ]);

        // Atualiza campos básicos
        $user->name = $request->name;
        $user->nickname = $request->nickname;
        $user->email = $request->email;

        // Atualiza senha se fornecida
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        // PRIORIDADE: Upload personalizado > Avatar do inventário
        if ($request->hasFile('avatar')) {
            // Remove avatar antigo se existir
            if ($user->current_avatar && Storage::disk('public')->exists('photos_avatars/' . $user->current_avatar)) {
                Storage::disk('public')->delete('photos_avatars/' . $user->current_avatar);
            }

            $path = $request->file('avatar')->store('photos_avatars', 'public');
            $filename = basename($path);

            $user->photo_avatar_filename = $filename;
            $user->current_avatar = $filename;
        }
        // Só equipa avatar do inventário se NÃO houver upload
        elseif ($request->filled('inventory_avatar')) {
            $avatarResource = $request->inventory_avatar;

            // Verifica se o user possui este avatar no inventário (ou é default)
            $hasAvatar = UserInventory::where('user_id', $user->id)
                ->where('item_resource_name', $avatarResource)
                ->exists();

            if ($hasAvatar || $avatarResource === 'default_avatar') {
                // Remove avatar personalizado antigo se existir
                if ($user->current_avatar &&
                    !str_starts_with($user->current_avatar, 'avatar') &&
                    !str_starts_with($user->current_avatar, 'default_') &&
                    Storage::disk('public')->exists('photos_avatars/' . $user->current_avatar)) {
                    Storage::disk('public')->delete('photos_avatars/' . $user->current_avatar);
                }

                // Simplesmente guarda o resource_name
                $user->current_avatar = $avatarResource;
            }
        }

        // Equipar deck do inventário
        if ($request->filled('inventory_deck')) {
            $deckResource = $request->inventory_deck;

            // Verifica se o user possui este deck no inventário (ou é default)
            $hasDeck = UserInventory::where('user_id', $user->id)
                ->where('item_resource_name', $deckResource)
                ->exists();

            if ($hasDeck || $deckResource === 'deck1_preview') {
                $user->current_deck = $deckResource;
            }
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil atualizado com sucesso',
            'user' => $user,
        ]);
    }

    public function destroy(Request $request)
    {
        $user = $request->user();

        // Bloqueia admin do tipo A
        if ($user->type === 'A') {
            return response()->json(['message' => 'Administradores não podem deletar sua própria conta.'], 403);
        }

        // Validação da confirmação explícita (senha)
        $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Senha incorreta.'], 403);
        }

        // Remove avatar se existir e for upload personalizado
        if ($user->current_avatar &&
            !str_starts_with($user->current_avatar, 'avatar') &&
            !str_starts_with($user->current_avatar, 'default_') &&
            Storage::disk('public')->exists('photos_avatars/' . $user->current_avatar)) {
            Storage::disk('public')->delete('photos_avatars/' . $user->current_avatar);
        }

        // Zerar coins
        if ($user->coins_balance) {
            $user->coins_balance = 0;
            $user->save();
        }

        // Soft delete
        $user->delete();

        return response()->json(['message' => 'Conta deletada com sucesso.']);
    }
}
