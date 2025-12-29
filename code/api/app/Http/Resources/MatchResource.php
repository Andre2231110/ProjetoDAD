<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatchResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request) {
        return [
            'id' => $this->id,
            'type' => "Bisca de " . $this->type,
            'winner' => $this->winner ? $this->winner->nickname : 'N/A',
            'stake' => $this->stake . ' coins', // Valor apostado [cite: 319]
            'marks' => $this->player1_marks . ' - ' . $this->player2_marks,
            'status' => $this->status,
        ];
    }
}
