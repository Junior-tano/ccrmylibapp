<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ebook_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_ref')->unique(); // ex: EBOOK-1781165390836
            $table->string('user_id')->nullable();
            $table->string('user_name');
            $table->string('user_email');
            $table->string('user_phone')->nullable();
            $table->string('ebook_id');
            $table->string('ebook_title');
            $table->string('ebook_author')->nullable();
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->enum('status', ['en_attente', 'paye', 'livre'])->default('en_attente');
            $table->string('receipt_url')->nullable();
            $table->string('pdf_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ebook_orders');
    }
};
