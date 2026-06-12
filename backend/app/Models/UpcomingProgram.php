<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UpcomingProgram extends Model
{
    protected $fillable = [
        'title',
        'description',
        'date',
        'time',
        'location',
        'image',
        'speaker',
        'category',
    ];
}
