<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Podcast extends Model
{
    protected $fillable = [
        'title',
        'description',
        'speaker',
        'date',
        'duration',
        'audio_url',
        'theme',
        'cover_image',
    ];
}
