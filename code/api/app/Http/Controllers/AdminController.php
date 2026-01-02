<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminController extends Controller
{
    public function createUser(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'nickname' => 'required|string|max:50|unique:users,nickname',
            'email'    => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|confirmed|min:3',
            'avatar'   => 'nullable|image|max:2048',
        ]);

        $user = User::create([
            'name'          => $request->name,
            'nickname'      => $request->nickname,
            'email'         => $request->email,
            'password'      => Hash::make($request->password),
            'type'          => 'A', // admin
            'blocked'       => 0,
            'coins_balance' => 0,
        ]);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('photos_avatars', 'public');
            $user->photo_avatar_filename = $path;
            $user->current_avatar        = $path;
            $user->save();
        }

        return response()->json([
            'user' => $user,
        ], 201);
    }

    public function listAllUsers(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $type = $request->input('type');
            $blocked = $request->input('blocked');

            $usersQuery = User::select('id', 'name', 'nickname', 'email', 'type', 'blocked')
                ->orderBy('id', 'desc');

            // Filtros
            if (!empty($type)) {
                $usersQuery->where('type', $type);
            }

            if ($blocked !== null && $blocked !== '') {
                $usersQuery->where('blocked', $blocked);
            }

            $users = $usersQuery->paginate($perPage);

            return response()->json([
                'data' => $users->items(),
                'meta' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total()
                ]
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function toggleBlockUser(Request $request, $id)
    {
        try {
            $request->validate([
                'blocked' => 'required|boolean', // espera 0 ou 1
            ]);

            $user = User::findOrFail($id);

            // Evitar bloquear outro admin, se necessário
            if ($user->type === 'A') {
                return response()->json([
                    'error' => 'Não é permitido bloquear outro admin.'
                ], 403);
            }

            $user->blocked = $request->input('blocked');
            $user->save();

            return response()->json([
                'message' => $user->blocked ? 'Usuário bloqueado com sucesso.' : 'Usuário desbloqueado com sucesso.',
                'data' => [
                    'id' => $user->id,
                    'blocked' => $user->blocked
                ]
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => 'Dados inválidos.',
                'messages' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Erro no servidor.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteUser($id)
    {
        try {
            $user = User::findOrFail($id);

            if ($user->type === 'A') {
                return response()->json([
                    'error' => 'Não é permitido eliminar administradores.'
                ], 403);
            }

            $user->delete();

            return response()->json([
                'message' => 'Usuário eliminado com sucesso'
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Erro no servidor',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
