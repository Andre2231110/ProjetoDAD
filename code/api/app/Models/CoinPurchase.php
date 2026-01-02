<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinPurchase extends Model
{
    protected $fillable = [
        'purchase_datetime',
        'user_id',
        'coin_transaction_id',
        'euros',
        'payment_type',
        'payment_reference',
        'custom',
    ];

    protected $casts = [
        'purchase_datetime' => 'datetime',
        'custom' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coinTransaction()
    {
        return $this->belongsTo(CoinTransaction::class);
    }
}
