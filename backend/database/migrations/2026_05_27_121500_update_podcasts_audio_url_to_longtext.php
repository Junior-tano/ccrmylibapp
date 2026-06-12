<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE podcasts MODIFY audio_url LONGTEXT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE podcasts MODIFY audio_url VARCHAR(255) NULL');
    }
};
