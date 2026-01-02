<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CoinController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RankingController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StatsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->delete('/profile/delete', [ProfileController::class, 'destroy']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/profile/update', [ProfileController::class, 'update']);
});
Route::get('/admin/users', [AdminController::class, 'listAllUsers']);
Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser']);
Route::post('/admin/users/{id}/toggle-block', [AdminController::class, 'toggleBlockUser']);
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/admin/create-user', [AdminController::class, 'createUser']);

});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::post('logout', [AuthController::class, 'logout']);
});

Route::apiResource('games', GameController::class);

Route::middleware('auth:sanctum')->get('/users/me/games', [GameController::class, 'userGames']);
 
Route::get("/ranking/global", [RankingController::class, "globalRanking"]);

Route::middleware("auth:sanctum")->get("/ranking/personal", [RankingController::class, "personalStats"]);
// Rotas da Loja
Route::get('/shop/items', [ShopController::class, 'index']); // Listar itens
Route::post('/shop/buy', [ShopController::class, 'buy']);    // Comprar item

// Rotas do Inventário (Customizações)
Route::get('/users/inventory', [InventoryController::class, 'index']);

// Rota para Fim de Jogo (Escrever dados e dar moedas)
Route::post('/matches/end', [MatchController::class, 'endMatch']);

Route::post('/matches/start', [MatchController::class, 'startMatch']);

Route::get('/matches', [MatchController::class, 'index']);

Route::post('/users/equip', [InventoryController::class, 'equip']);

Route::post('/matches/undo', [MatchController::class, 'undoPlay']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/matches/user', [MatchController::class, 'userMatches']);

});

Route::get('/matches/{id}/games', [MatchController::class, 'matchGames']);

Route::get("/ranking/global", [RankingController::class, "globalRanking"]);
//shop
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/coins', [CoinController::class, 'index']);
    Route::get('/coins/balance', [CoinController::class, 'getBalance']);
    Route::post('/coins/purchase', [CoinController::class, 'purchase']);

    // apenas admins: todas as transações
    Route::get('/admin/coins/transactions', [CoinController::class, 'getAllTransactions']);

});
