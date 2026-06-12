<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class ReceiptUploadController extends Controller
{
    /**
     * POST /api/uploads/receipts
     * Champ : "receipt" (image jpg/png ou pdf)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'receipt' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            ]);

            $file      = $request->file('receipt');
            $filename  = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $directory = public_path('uploads/receipts');

            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            $file->move($directory, $filename);

            return response()->json([
                'url' => url('/uploads/receipts/' . $filename),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Fichier invalide. Formats acceptés : JPG, PNG, PDF. Taille max : 5 MB.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'upload du reçu : ' . $e->getMessage(),
            ], 500);
        }
    }
}
