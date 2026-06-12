<?php

namespace App\Http\Controllers\Api;

use App\Models\Podcast;

class PodcastController extends CrudController
{
    protected string $modelClass = Podcast::class;

    protected array $rules = [
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'speaker' => 'required|string|max:255',
        'date' => 'nullable|date',
        'duration' => 'required|string|max:255',
        'audioUrl' => 'nullable|string',
        'theme' => 'required|string|max:255',
        'coverImage' => 'nullable|string',
    ];
}
