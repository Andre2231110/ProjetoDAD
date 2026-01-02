<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\{
    AuthController, AdminController, CoinController, 
    GameController, InventoryController, MatchController, 
    ProfileController, RankingController, ShopController, 
    MatchHistoryController, StatsController
};

// ---------------------------------------------------------
// 1. ROTAS PÚBLICAS (Qualquer pessoa vê)
// ---------------------------------------------------------
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get("/ranking/global", [RankingController::class, "globalRanking"]);
Route::get('/shop/items', [ShopController::class, 'index']);
Route::get('stats/public', [StatsController::class, 'publicStats']);
// ---------------------------------------------------------
// 2. ROTAS PROTEGIDAS (Tens de estar logada)
// ---------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    
    // Perfil e Logout
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/users/me', fn (Request $request) => $request->user());
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::delete('/profile/delete', [ProfileController::class, 'destroy']);

    // Estatísticas e Rankings Pessoais
    Route::get('/stats/personal', [StatsController::class, 'personal']);
    Route::get("/ranking/personal", [RankingController::class, "personalStats"]);

    // Matches e Jogos (IMPORTANTE: Específicas ANTES do Resource)
    Route::get('/matches/history', [MatchHistoryController::class, 'index']); 
    Route::get('/matches/user', [MatchController::class, 'userMatches']);
    Route::get('/users/me/games', [GameController::class, 'userGames']);
    
    Route::apiResource('games', GameController::class);
    Route::apiResource('matches', MatchController::class)->except(['show']); 

    // Moedas e Loja
    Route::get('/coins/balance', [CoinController::class, 'getBalance']);
    Route::post('/coins/purchase', [CoinController::class, 'purchase']);
    Route::get('/users/me/transactions', [CoinController::class, 'index']);
    Route::post('/shop/buy', [ShopController::class, 'buy']);
    Route::get('/users/inventory', [InventoryController::class, 'index']);
    Route::post('/users/equip', [InventoryController::class, 'equip']);

    // ---------------------------------------------------------
    // 3. ÁREA DE ADMINISTRAÇÃO (Apenas Admins)
    // ---------------------------------------------------------
    Route::prefix('admin')->group(function () {
        Route::get('/stats', [StatsController::class, 'adminStats']);
        Route::get('/users', [AdminController::class, 'listAllUsers']);
        Route::post('/create-user', [AdminController::class, 'createUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::post('/users/{id}/toggle-block', [AdminController::class, 'toggleBlockUser']);
        Route::get('/users/{userId}/history', [AdminController::class, 'userMatchHistory']);
        Route::get('/coins/transactions', [CoinController::class, 'getAllTransactions']);
    });
});