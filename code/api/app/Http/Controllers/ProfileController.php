<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

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
            'password' => 'nullable|string|min:3|confirmed', // opcional
            'avatar' => 'nullable|image|max:2048',           // opcional
        ]);

        // Atualiza campos básicos
        $user->name = $request->name;
        $user->nickname = $request->nickname;
        $user->email = $request->email;

        // Atualiza senha se fornecida
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        // Atualiza avatar se fornecido
        if ($request->hasFile('avatar')) {
            // Remove avatar antigo se existir
            if ($user->current_avatar && Storage::disk('public')->exists($user->current_avatar)) {
                Storage::disk('public')->delete($user->current_avatar);
            }

            $path = $request->file('avatar')->store('photos_avatars', 'public');

            $filename = basename($path);
            $user->photo_avatar_filename = $filename;
            $user->current_avatar = $filename;
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

        // Zerar coins ou histórico relacionado
        if ($user->coins_balance) {
            $user->coins_balance = 0;
            $user->save();
       }

        // Soft delete
        $user->delete();

        return response()->json(['message' => 'Conta deletada com sucesso.']);
    }
}
