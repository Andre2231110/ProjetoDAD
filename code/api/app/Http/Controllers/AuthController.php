<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user  = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'nickname' => 'required|string|max:50|unique:users,nickname',
            'email'    => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|confirmed|min:3',
            'avatar'   => 'nullable|image|max:2048', // opcional
        ]);

        try {
            // Criação do usuário apenas com os campos existentes
            $user = User::create([
                'name'          => $request->name,
                'nickname'      => $request->nickname,
                'email'         => $request->email,
                'password'      => Hash::make($request->password),
                'type'          => 'P', // player por padrão
                'blocked'       => 0,   // desbloqueado
                'coins_balance' => 10,  // ganha 10 coins no registo
            ]);

            if ($request->hasFile('avatar')) {
                $path                        = $request->file('avatar')->store('photos_avatars', 'public');
                $user->photo_avatar_filename = $path;
                $user->current_avatar        = $path; // define como avatar atual
                $user->save();
            }

            // Cria token de autenticação
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'user'  => $user,
                'token' => $token,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating user',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }


    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
