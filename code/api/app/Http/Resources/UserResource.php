<?php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        return [
            'id'        => $this->id,
            'name'      => $this->name,
            'nickname'  => $this->nickname,
            'email'     => $this->email,
            'coins'     => $this->coins_balance,
            'photo_url' => $this->photo_avatar_filename
            ? asset('storage/' . $this->photo_avatar_filename)
            : asset('default.jpg'),
            'type'      => $this->type == 'A' ? 'Administrator' : 'Player', // [cite: 269]
        ];
    }
}
