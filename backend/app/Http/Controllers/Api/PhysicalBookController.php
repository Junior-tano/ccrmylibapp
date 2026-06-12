<?php

namespace App\Http\Controllers\Api;

use App\Models\PhysicalBook;

class PhysicalBookController extends CrudController
{
    protected string $modelClass = PhysicalBook::class;

    protected array $rules = [
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'author' => 'required|string|max:255',
        'coverImage' => 'nullable|string',
        'price' => 'required|numeric|min:0',
        'stock' => 'required|integer|min:0',
    ];
}
