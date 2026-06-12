<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EbookOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class EbookOrderController extends Controller
{
    private function toFrontend(EbookOrder $order): array
    {
        return [
            'id'          => $order->order_ref,
            'dbId'        => $order->id,
            'userId'      => $order->user_id ?? '',
            'userName'    => $order->user_name,
            'userEmail'   => $order->user_email,
            'userPhone'   => $order->user_phone ?? '',
            'ebookId'     => $order->ebook_id,
            'ebookTitle'  => $order->ebook_title,
            'ebookAuthor' => $order->ebook_author ?? '',
            'totalAmount' => (float) $order->total_amount,
            'status'      => $order->status,
            'receiptUrl'  => $order->receipt_url,
            'pdfUrl'      => $order->pdf_url,
            'createdAt'   => $order->created_at->toISOString(),
        ];
    }

    /**
     * GET /api/ebook-orders
     * GET /api/ebook-orders?email=foo@bar.com
     */
    public function index(Request $request): JsonResponse
    {
        $query = EbookOrder::query()->latest();

        if ($request->filled('email')) {
            $query->whereRaw('LOWER(user_email) = ?', [strtolower($request->input('email'))]);
        }

        return response()->json(
            $query->get()->map(fn (EbookOrder $o) => $this->toFrontend($o))
        );
    }

    /**
     * POST /api/ebook-orders
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'id'          => 'nullable|string',
                'userId'      => 'nullable|string',
                'userName'    => 'required|string|max:255',
                'userEmail'   => 'required|email|max:255',
                'userPhone'   => 'nullable|string|max:50',
                'ebookId'     => 'required|string',
                'ebookTitle'  => 'required|string|max:255',
                'ebookAuthor' => 'nullable|string|max:255',
                'totalAmount' => 'required|numeric|min:0',
                'status'      => 'nullable|in:en_attente,paye,livre',
                'receiptUrl'  => 'nullable|string',
                'pdfUrl'      => 'nullable|string',
            ]);

            $ref = $data['id'] ?? ('EBOOK-' . (string) (time() * 1000 + rand(0, 999)));

            $existing = EbookOrder::where('order_ref', $ref)->first();
            if ($existing) {
                return response()->json($this->toFrontend($existing), 200);
            }

            $order = EbookOrder::create([
                'order_ref'   => $ref,
                'user_id'     => $data['userId'] ?? null,
                'user_name'   => $data['userName'],
                'user_email'  => $data['userEmail'],
                'user_phone'  => $data['userPhone'] ?? null,
                'ebook_id'    => $data['ebookId'],
                'ebook_title' => $data['ebookTitle'],
                'ebook_author' => $data['ebookAuthor'] ?? null,
                'total_amount' => $data['totalAmount'],
                'status'      => $data['status'] ?? 'en_attente',
                'receipt_url' => $data['receiptUrl'] ?? null,
                'pdf_url'     => $data['pdfUrl'] ?? null,
            ]);

            return response()->json($this->toFrontend($order), 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Données invalides.', 'errors' => $e->errors()], 422);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/ebook-orders/{ref}
     */
    public function show(string $ref): JsonResponse
    {
        $order = EbookOrder::where('order_ref', $ref)->firstOrFail();
        return response()->json($this->toFrontend($order));
    }

    /**
     * PATCH /api/ebook-orders/{ref}/status
     */
    public function updateStatus(Request $request, string $ref): JsonResponse
    {
        try {
            $data  = $request->validate(['status' => 'required|in:en_attente,paye,livre']);
            $order = EbookOrder::where('order_ref', $ref)->firstOrFail();
            $order->update(['status' => $data['status']]);
            return response()->json($this->toFrontend($order->refresh()));
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * PATCH /api/ebook-orders/{ref}/receipt
     */
    public function updateReceipt(Request $request, string $ref): JsonResponse
    {
        try {
            $data  = $request->validate(['receiptUrl' => 'required|string']);
            $order = EbookOrder::where('order_ref', $ref)->firstOrFail();
            $order->update([
                'receipt_url' => $data['receiptUrl'],
                'status'      => 'paye',
            ]);
            return response()->json($this->toFrontend($order->refresh()));
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/ebook-orders/{ref}
     */
    public function destroy(string $ref): JsonResponse
    {
        EbookOrder::where('order_ref', $ref)->firstOrFail()->delete();
        return response()->json(null, 204);
    }
}
