<?php

namespace App\Http\Controllers\Api;

use App\Models\UpcomingProgram;

class UpcomingProgramController extends CrudController
{
    protected string $modelClass = UpcomingProgram::class;

    protected array $rules = [
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'date' => 'nullable|date',
        'time' => 'nullable|string|max:255',
        'location' => 'required|string|max:255',
        'image' => 'nullable|string',
        'speaker' => 'nullable|string|max:255',
        'category' => 'required|string|max:255',
    ];
}
