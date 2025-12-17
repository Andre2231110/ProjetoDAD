<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public static $startDate;
    public static $dbInsertBlockSize = 500;
    public static $seedLanguage = "en_US";

    public function run(): void
    {
        $this->command->info("-----------------------------------------------");
        $this->command->info("START of database seeder");
        $this->command->info("-----------------------------------------------");

        self::$startDate = Carbon::now()->subMonths(14);
        self::$seedLanguage = $this->command->choice('What is the language for users\' names?', ['pt_PT', 'en_US'], 0);

        // --- 1. LIMPEZA DE TABELAS ---
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        } else {
            DB::statement('SET foreign_key_checks=0');
            DB::statement("SET time_zone = '+00:00'");
        }

        DB::table('users')->delete();
        DB::table('matches')->delete();
        DB::table('games')->delete();
        DB::table('coin_purchases')->delete();
        DB::table('coin_transactions')->delete();
        DB::table('coin_transaction_types')->delete();
        
        // Reset Auto Increments
        $tables = ['users', 'matches', 'games', 'coin_purchases', 'coin_transactions', 'coin_transaction_types'];
        foreach($tables as $table) {
            if (DB::getDriverName() === 'sqlite') {
                DB::statement("DELETE FROM sqlite_sequence WHERE name = '$table'");
            } else {
                DB::statement("ALTER TABLE $table AUTO_INCREMENT = 0");
            }
        }

        $this->command->info("-----------------------------------------------");

        // --- 2. CHAMADA DOS SEEDERS ---
        $this->call(TransactionTypesSeeder::class);
        $this->call(UsersSeeder::class);
        $this->call(InitialTransactionsSeeder::class);
        $this->call(GamesSeeder::class);
        $this->call(GamesTransactionsSeeder::class);

        // --------------------------------------------------------------------
        // ✨ CORREÇÃO FINAL (Versão Compatível com TransactionTypesSeeder) ✨
        // --------------------------------------------------------------------
        $this->command->info('-----------------------------------------------');
        $this->command->info('Fixing Test Users Values (Cleaning History & Forcing Balance)...');

        $usersToFix = [
            'coins@ipleiria.pt' => ['coins' => 110, 'capote' => 25, 'bandeira' => 10],
            'pa@mail.pt'        => ['coins' => 10,  'capote' => 13, 'bandeira' => 6],
            'aluno@ipleiria.pt' => ['coins' => 200, 'capote' => 10, 'bandeira' => 5],
            'rico@mail.pt'      => ['coins' => 9999,'capote' => 50, 'bandeira' => 20],
            'pobre@ipleiria.pt' => ['coins' => 0,   'capote' => 0,  'bandeira' => 0],
        ];

        foreach ($usersToFix as $email => $data) {
            $user = \App\Models\User::where('email', $email)->first();
            
            if ($user) {
                // 1. LIMPEZA: Apagar histórico "sujo"
                DB::table('coin_transactions')->where('user_id', $user->id)->delete();
                DB::table('coin_purchases')->where('user_id', $user->id)->delete();

                // 2. JUSTIFICATIVA: Inserir transação de ajuste
                if ($data['coins'] > 0) {
                    DB::table('coin_transactions')->insert([
                        'user_id' => $user->id,
                        // AQUI ESTÁ A CORREÇÃO: Usar 'coin_transaction_type_id' e o valor 1 (Bonus)
                        'coin_transaction_type_id' => 1, 
                        'coins' => $data['coins'],
                        'custom' => 'Force Fix Seeder (Matilde)',
                        'transaction_datetime' => now(), // Nome da coluna depende da tua migração (created_at ou transaction_datetime)
                    ]);
                }

                // 3. ATUALIZAÇÃO: Forçar saldo na tabela users
                $user->update([
                    'coins_balance' => $data['coins'],
                    'capote_count'  => $data['capote'],
                    'bandeira_count'=> $data['bandeira']
                ]);
            }
        }

        $this->command->info('Test Users Values Fixed Successfully! ✨');

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement('SET foreign_key_checks=1');
        }

        $this->command->info("-----------------------------------------------");
        $this->command->info("END of database seeder");
        $this->command->info("-----------------------------------------------");
    }
}