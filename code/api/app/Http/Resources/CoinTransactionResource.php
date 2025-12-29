<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoinTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request) {
        return [
            'date' => $this->transaction_datetime,
            'amount' => $this->coins,
            'type' => $this->type->name,
            'game_id' => $this->game_id,
            'match_id' => $this->match_id,
        ];
    }
}
