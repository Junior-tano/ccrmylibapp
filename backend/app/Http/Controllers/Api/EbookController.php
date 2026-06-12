<?php

namespace App\Http\Controllers\Api;

use App\Models\Ebook;

class EbookController extends CrudController
{
    protected string $modelClass = Ebook::class;

    protected array $rules = [
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'author' => 'required|string|max:255',
        'coverImage' => 'nullable|string',
        'price' => 'required|numeric|min:0',
        'isFree' => 'required|boolean',
        'pdfUrl' => 'nullable|string',
    ];
}
