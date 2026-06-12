<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class UploadController extends Controller
{
    /**
     * Upload d'une image (couverture de podcast, livre, etc.)
     * Endpoint : POST /api/uploads/images
     */
    public function image(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
            ]);

            $file      = $request->file('image');
            $filename  = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $directory = public_path('uploads/images');

            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            $file->move($directory, $filename);

            return response()->json([
                'url' => url('/uploads/images/' . $filename),
            ], 201);

        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'upload de l\'image : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload d'un fichier audio (podcast MP3, WAV, M4A, OGG)
     * Endpoint : POST /api/uploads/audio
     */
    public function audio(Request $request): JsonResponse
    {
        // Augmenter les limites PHP à l'exécution pour les gros fichiers
        @ini_set('upload_max_filesize', '512M');
        @ini_set('post_max_size', '512M');
        @ini_set('max_execution_time', '300');
        @ini_set('max_input_time', '300');
        @ini_set('memory_limit', '512M');

        try {
            $request->validate([
                // mimes vérifie le contenu réel du fichier (pas seulement l'extension)
                // mpga = alias MIME pour mp3 dans certains navigateurs
                'audio' => 'required|file|mimes:mp3,wav,m4a,ogg,mpeg,mpga|max:512000',
            ]);

            $file      = $request->file('audio');
            $filename  = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $directory = public_path('uploads/audio');

            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            // Déplacer le fichier dans public/uploads/audio/
            $file->move($directory, $filename);

            // Retourner l'URL publique complète
            return response()->json([
                'url'      => url('/uploads/audio/' . $filename),
                'filename' => $filename,
                'size'     => filesize(public_path('uploads/audio/' . $filename)),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Fichier invalide. Formats acceptés : MP3, WAV, M4A, OGG. Taille max : 500 MB.',
                'errors'  => $e->errors(),
            ], 422);

        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'upload audio : ' . $e->getMessage(),
            ], 500);
        }
    }
}