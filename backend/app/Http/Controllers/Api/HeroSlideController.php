<?php

namespace App\Http\Controllers\Api;

use App\Models\HeroSlide;

class HeroSlideController extends CrudController
{
    protected string $modelClass = HeroSlide::class;

    /**
     * Règles de validation pour les Hero Slides.
     *
     * CORRECTIONS apportées :
     * - 'isActive' : suppression de 'nullable' qui est incompatible avec 'boolean'
     *   en Laravel. Un booléen JSON (true/false) est rejeté si 'nullable' est présent
     *   car Laravel considère alors que null est attendu, pas un bool. On utilise
     *   'sometimes|boolean' pour accepter true/false optionnellement.
     *
     * - 'image' : on garde 'nullable|string' pour accepter les URLs ou le base64.
     *   La colonne 'image' est définie en LONGTEXT dans la migration, ce qui supporte
     *   les images encodées en base64.
     *
     * - 'buttonText' / 'buttonLink' : on augmente max à 500 pour les URLs longues.
     */
    protected array $rules = [
        'title'       => 'required|string|max:255',
        'subtitle'    => 'nullable|string|max:255',
        'description' => 'required|string',
        'image'       => 'nullable|string',
        'buttonText'  => 'nullable|string|max:500',
        'buttonLink'  => 'nullable|string|max:500',
        'isActive'    => 'sometimes|boolean',
    ];
}