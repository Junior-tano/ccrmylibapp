<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_ref',
        'user_id',
        'user_name',
        'user_email',
        'user_phone',
        'address',
        'country',
        'items',
        'total_amount',
        'shipping_fee',
        'status',
        'receipt_url',
        'delivery_step',
        'step1_validated_at',
        'step2_validated_at',
        'step3_validated_at',
    ];

    protected $casts = [
        'items'              => 'array',
        'total_amount'       => 'decimal:2',
        'shipping_fee'       => 'decimal:2',
        'delivery_step'      => 'integer',
        'step1_validated_at' => 'datetime',
        'step2_validated_at' => 'datetime',
        'step3_validated_at' => 'datetime',
    ];
}
