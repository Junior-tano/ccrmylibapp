<?php

namespace App\Http\Controllers\Api;

use App\Models\Video;

class VideoController extends CrudController
{
    protected string $modelClass = Video::class;

    protected array $rules = [
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'speaker' => 'required|string|max:255',
        'date' => 'nullable|date',
        'youtubeUrl' => 'nullable|string',
        'videoUrl' => 'nullable|string',
        'thumbnail' => 'nullable|string',
        'category' => 'required|string|max:255',
    ];
}
