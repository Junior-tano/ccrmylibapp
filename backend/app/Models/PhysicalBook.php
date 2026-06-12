<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhysicalBook extends Model
{
    protected $fillable = [
        'title',
        'description',
        'author',
        'cover_image',
        'price',
        'stock',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock' => 'integer',
    ];
}
