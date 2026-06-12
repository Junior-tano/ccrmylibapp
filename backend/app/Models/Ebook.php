<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ebook extends Model
{
    protected $fillable = [
        'title',
        'description',
        'author',
        'cover_image',
        'price',
        'is_free',
        'pdf_url',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_free' => 'boolean',
    ];
}
