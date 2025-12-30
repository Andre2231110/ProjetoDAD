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
    public function listAllUsers(Request $request): JsonResponse
    {
        try {
            // Pega os usuários direto do banco, sem usar o modelo
            $users = \DB::table('users')
                ->select('id', 'name', 'nickname', 'email', 'type', 'blocked')
                ->orderBy('id', 'desc')
                ->get();

            return response()->json([
                'data' => $users
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
