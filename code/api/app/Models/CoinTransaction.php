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
    'coins'
    ]; 
}
