<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_ref')->unique(); // ex: ORD-1781165390836
            $table->string('user_id')->nullable();
            $table->string('user_name');
            $table->string('user_email');
            $table->string('user_phone')->nullable();
            $table->text('address')->nullable();
            $table->enum('country', ['france', 'benin', 'cote_ivoire'])->default('cote_ivoire');
            $table->json('items'); // [{bookId, bookTitle, quantity, price}]
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('shipping_fee', 12, 2)->default(0);
            $table->enum('status', ['en_attente', 'paye', 'livre'])->default('en_attente');
            $table->string('receipt_url')->nullable();
            $table->unsignedTinyInteger('delivery_step')->nullable(); // 1, 2 or 3
            $table->timestamp('step1_validated_at')->nullable();
            $table->timestamp('step2_validated_at')->nullable();
            $table->timestamp('step3_validated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
