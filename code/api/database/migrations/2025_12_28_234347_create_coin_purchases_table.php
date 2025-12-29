<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coin_purchases', function (Blueprint $table) {
            $table->id();

            // Datetime of the coin purchase
            $table->dateTime('purchase_datetime');

            // User associated with the purchase
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users');

            // Coin Transaction associated with this purchase
            // One to One relation (purchase must have a coin transaction)
            $table->unsignedBigInteger('coin_transaction_id')->unique();
            $table->foreign('coin_transaction_id')->references('id')->on('coin_transactions');

            // Amount of the purchase (real money in euros)
            $table->decimal('euros', 8, 2);

            // Purchases will involve a payment with a type and a reference
            // MBWAY -  Phone number with 9 digits
            // PAYPAL - eMail
            // IBAN - bank transfer (2 letters + 23 digits)
            // MB - Multibanco payment - entity number (5 digits) + Reference (9 digits))
            // VISA - Visa card number (16 digits)
            $table->enum('payment_type', ['MBWAY', 'PAYPAL', 'IBAN', 'MB', 'VISA']);
            $table->string('payment_reference', 30);

            // custom data
            $table->json('custom')->nullable();

            //boas praticas
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_purchases');
    }
};
