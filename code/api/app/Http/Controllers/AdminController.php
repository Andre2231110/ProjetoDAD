<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\MatchGame;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminController extends Controller
{
    public function createUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nickname' => 'required|string|max:50|unique:users,nickname',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|confirmed|min:3',
            'avatar' => 'nullable|image|max:2048',
        ]);

        $user = User::create([
            'name' => $request->name,
            'nickname' => $request->nickname,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'type' => 'A', // admin
            'blocked' => 0,
            'coins_balance' => 0,
        ]);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('photos_avatars', 'public');
            $user->photo_avatar_filename = $path;
            $user->current_avatar = $path;
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
            $search = $request->input('search');

            // 1. Iniciamos a query APENAS UMA VEZ
            $usersQuery = User::select('id', 'name', 'nickname', 'email', 'type', 'blocked', 'photo_avatar_filename')
                ->orderBy('id', 'desc');

            // 2. Aplicamos os filtros de forma condicional
            if (!empty($type)) {
                $usersQuery->where('type', $type);
            }

            if ($blocked !== null && $blocked !== '') {
                $usersQuery->where('blocked', $blocked);
            }

            // 3. Aplicamos a pesquisa por nome/nick/email
            if (!empty($search)) {
                $usersQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                        ->orWhere('nickname', 'like', "%$search%")
                        ->orWhere('email', 'like', "%$search%");
                });
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

    public function userMatchHistory(Request $request, $userId)
    {
        // 1. Verificação de Segurança: Só admins
        if ($request->user()->type !== 'A') {
            return response()->json(['error' => 'Acesso negado! Só para admins.'], 403);
        }

        try {
            // 2. Procuramos os matches. Importante: usamos with() para evitar o Erro 500 se as relações falharem
            $history = MatchGame::where(function ($query) use ($userId) {
                $query->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            // Requisito: Metadados como marcas e variante devem estar presentes
            ->with(['player1:id,nickname', 'player2:id,nickname', 'games']) 
            ->orderBy('began_at', 'desc')
            ->paginate(10);

            return response()->json($history);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
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

    public function getGlobalStats()
{
    return response()->json([
        'total_users' => User::where('type', 'P')->count(),
        'active_games' => DB::table('matches')->where('status', 'On-going')->count(),
        'total_coins_circulating' => User::sum('coins_balance'),
        'today_matches' => DB::table('matches')->whereDate('began_at', now()->today())->count(),
    ]);
}
    public function deleteUser($id)
    {
        try {
            $user = User::findOrFail($id);

            if ($user->id === auth()->user()->id) {
            return response()->json([
                'error' => 'Não é permitido eliminar a própria conta.'
            ], 403);
        }
            $user->delete();

            return response()->json([
                'message' => 'Utilizador eliminado com sucesso'
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Erro no servidor',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
