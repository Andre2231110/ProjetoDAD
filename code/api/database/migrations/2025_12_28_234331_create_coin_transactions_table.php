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
        Schema::create('coin_transactions', function (Blueprint $table) {
            $table->id();

            // Datetime of the coin transaction
            $table->dateTime('transaction_datetime');

            // User associated with the transaction
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users');

            // Match associated with the transaction (optional - it can be null)
            $table->unsignedBigInteger('match_id')->nullable();
            $table->foreign('match_id')->references('id')->on('matches');

            // Game associated with the transaction (optional - it can be null)
            $table->unsignedBigInteger('game_id')->nullable();
            $table->foreign('game_id')->references('id')->on('games');

            // Type of the transaction
            $table->unsignedBigInteger('coin_transaction_type_id');
            $table->foreign('coin_transaction_type_id')->references('id')->on('coin_transaction_types');

            // Amount of the transaction (coins)
            // Positive -> increments the total amount of brain coins (Credit)
            // Negative -> decrements the total amount of brain coins (Debit)
            $table->integer('coins');

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
        Schema::dropIfExists('coin_transactions');
    }
};


