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
        Schema::create('coin_transaction_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40);
            // Credit - increase coins
            // Debit - decrease coins
            $table->enum('type', ['C', 'D']);
            // Transaction Types can be deleted with "soft deletes"
            $table->softDeletes();

            // custom data
            $table->json('custom')->nullable();

            //boas praticas
            $table->timestamps();
        });

        DB::table('coin_transaction_types')->insert([
        ['name' => 'Bonus', 'type' => 'C'],
        ['name' => 'Coin purchase', 'type' => 'C'],
        ['name' => 'Game fee', 'type' => 'D'],
        ['name' => 'Match stake', 'type' => 'D'],
        ['name' => 'Game payout', 'type' => 'C'],
        ['name' => 'Match payout', 'type' => 'C'],
    ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_transaction_types');
    }
};
