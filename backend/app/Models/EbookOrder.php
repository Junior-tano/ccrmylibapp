<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EbookOrder extends Model
{
    protected $fillable = [
        'order_ref',
        'user_id',
        'user_name',
        'user_email',
        'user_phone',
        'ebook_id',
        'ebook_title',
        'ebook_author',
        'total_amount',
        'status',
        'receipt_url',
        'pdf_url',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];
}
