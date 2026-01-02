<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCoinPurchaseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Auth já feita no middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules() {
    return [
            'type'      => ['required', 'in:MBWAY,PAYPAL,IBAN,MB,VISA'],
            'value'     => ['required', 'integer', 'min:1', 'max:99'],
            'reference' => ['required', $this->referenceRule()],
        ];
    }
    
    protected function referenceRule()
    {
        return match ($this->get('type')) {
            'MBWAY' => 'regex:/^9\d{8}$/',
            'PAYPAL'=> 'email:rfc',
            'IBAN'  => 'regex:/^[A-Za-z]{2}\d{23}$/',
            'MB'    => 'regex:/^\d{5}-\d{9}$/',
            'VISA'  => 'regex:/^4\d{15}$/',
            default => 'sometimes',
        };
    }
}
