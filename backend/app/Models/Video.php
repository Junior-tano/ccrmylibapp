<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    protected $fillable = [
        'title',
        'description',
        'speaker',
        'date',
        'youtube_url',
        'video_url',
        'thumbnail',
        'category',
    ];
}
