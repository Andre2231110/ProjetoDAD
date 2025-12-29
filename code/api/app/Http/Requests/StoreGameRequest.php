<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules() {
    return [
        'type' => 'required|in:3,9', 
        'status' => 'required|in:Pending,Playing,Ended,Interrupted', 
        'player1_user_id' => 'required|exists:users,id', 
        'player2_user_id' => 'nullable|exists:users,id', 
        'player1_points' => 'integer|min:0|max:120', 
        'player2_points' => 'integer|min:0|max:120',
        'total_time' => 'numeric|min:0', 
    ];
}
}
