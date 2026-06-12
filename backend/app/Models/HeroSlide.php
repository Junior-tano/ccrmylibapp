<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroSlide extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'description',
        'image',
        'button_text',
        'button_link',
        'is_active',
    ];

    /**
     * CORRECTION : is_active est casté en booléen natif PHP.
     * Sans ce cast, MySQL renvoie 0/1 (entier) et le frontend
     * reçoit isActive: 0 au lieu de isActive: false, ce qui peut
     * provoquer des comportements inattendus côté React/TypeScript.
     *
     * Ajout de 'subtitle', 'button_text', 'button_link' dans $casts
     * pour s'assurer que les valeurs NULL sont bien transmises comme
     * null (et non comme la chaîne "null").
     */
    protected $casts = [
        'is_active'   => 'boolean',
        'subtitle'    => 'string',
        'button_text' => 'string',
        'button_link' => 'string',
    ];

    /**
     * Valeurs par défaut pour les champs optionnels.
     * Évite que is_active soit null lors de la création si
     * le frontend omet le champ.
     */
    protected $attributes = [
        'is_active' => true,
        'subtitle'  => '',
    ];
}