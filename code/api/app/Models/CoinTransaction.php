<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinTransaction extends Model
{
    protected $fillable = [
        'transaction_datetime',
        'user_id',
        'game_id',
        'match_id',
        'coin_transaction_type_id',
        'coins',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function match()
    {
        return $this->belongsTo(MatchGame::class, 'match_id');
    }

    public function type()
    {
        return $this->belongsTo(CoinTransactionType::class, 'coin_transaction_type_id');
    }
}
