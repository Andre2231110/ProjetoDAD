<?php
namespace App\Http\Resources;
use Illuminate\Http\Resources\Json\JsonResource;

class GameResource extends JsonResource {
    public function toArray($request) {
        return [
            'id' => $this->id,
            'type' => $this->type == '3' ? 'Bisca de 3' : 'Bisca de 9',
            'status' => $this->status,
            'player1' => $this->player1 ? $this->player1->nickname : 'Bot', 
            'player2' => $this->player2 ? $this->player2->nickname : 'Bot', 
            'winner' => $this->winner ? $this->winner->nickname : ($this->is_draw ? 'Empate' : 'N/A'), 
            'player1_points' => $this->player1_points, 
            'player2_points' => $this->player2_points,
            'date' => $this->began_at ? $this->began_at->format('Y-m-d H:i') : null, 
            'duration' => $this->total_time . 's', 
        ];
    }
}