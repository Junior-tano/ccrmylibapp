<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Autorise le frontend Next.js à communiquer avec l'API Laravel.
    | Inclut localhost (dev) et toute URL configurée via FRONTEND_URL (prod).
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'uploads/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
    ],

    // Permet d'ajouter l'URL de prod via variable d'environnement FRONTEND_URL
    'allowed_origins_patterns' => [
        env('FRONTEND_URL') ? '#^' . preg_quote(env('FRONTEND_URL'), '#') . '#' : null,
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => false,

];