<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class OrderController extends Controller
{
    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function toFrontend(Order $order): array
    {
        return [
            'id'           => $order->order_ref,
            'dbId'         => $order->id,
            'userId'       => $order->user_id ?? '',
            'userName'     => $order->user_name,
            'userEmail'    => $order->user_email,
            'userPhone'    => $order->user_phone ?? '',
            'address'      => $order->address ?? '',
            'country'      => $order->country,
            'items'        => $order->items ?? [],
            'totalAmount'  => (float) $order->total_amount,
            'shippingFee'  => (float) $order->shipping_fee,
            'status'       => $order->status,
            'receiptUrl'   => $order->receipt_url,
            'deliveryStep' => $order->delivery_step,
            'stepUpdatedAt' => [
                'step1' => $order->step1_validated_at?->toISOString(),
                'step2' => $order->step2_validated_at?->toISOString(),
                'step3' => $order->step3_validated_at?->toISOString(),
            ],
            'createdAt'    => $order->created_at->toISOString(),
        ];
    }

    // ─── Index ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/orders
     * GET /api/orders?email=foo@bar.com  → filtrage par email client
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::query()->latest();

        if ($request->filled('email')) {
            $query->whereRaw('LOWER(user_email) = ?', [strtolower($request->input('email'))]);
        }

        return response()->json(
            $query->get()->map(fn (Order $o) => $this->toFrontend($o))
        );
    }

    // ─── Store ─────────────────────────────────────────────────────────────────

    /**
     * POST /api/orders
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'id'          => 'nullable|string',   // order_ref fourni par le frontend
                'userId'      => 'nullable|string',
                'userName'    => 'required|string|max:255',
                'userEmail'   => 'required|email|max:255',
                'userPhone'   => 'nullable|string|max:50',
                'address'     => 'nullable|string',
                'country'     => 'required|in:france,benin,cote_ivoire',
                'items'       => 'required|array|min:1',
                'totalAmount' => 'required|numeric|min:0',
                'shippingFee' => 'required|numeric|min:0',
                'status'      => 'nullable|in:en_attente,paye,livre',
                'receiptUrl'  => 'nullable|string',
            ]);

            // Utilise le ref fourni ou en génère un nouveau
            $ref = $data['id'] ?? ('ORD-' . (string) (time() * 1000 + rand(0, 999)));

            // Vérifie l'unicité — si la commande existe déjà, retourne-la sans doublon
            $existing = Order::where('order_ref', $ref)->first();
            if ($existing) {
                return response()->json($this->toFrontend($existing), 200);
            }

            $order = Order::create([
                'order_ref'   => $ref,
                'user_id'     => $data['userId'] ?? null,
                'user_name'   => $data['userName'],
                'user_email'  => $data['userEmail'],
                'user_phone'  => $data['userPhone'] ?? null,
                'address'     => $data['address'] ?? null,
                'country'     => $data['country'],
                'items'       => $data['items'],
                'total_amount' => $data['totalAmount'],
                'shipping_fee' => $data['shippingFee'],
                'status'      => $data['status'] ?? 'en_attente',
                'receipt_url' => $data['receiptUrl'] ?? null,
            ]);

            return response()->json($this->toFrontend($order), 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Données invalides.', 'errors' => $e->errors()], 422);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ─── Show ──────────────────────────────────────────────────────────────────

    /**
     * GET /api/orders/{ref}   (ref = ORD-xxxxxxxxx)
     */
    public function show(string $ref): JsonResponse
    {
        $order = Order::where('order_ref', $ref)->firstOrFail();
        return response()->json($this->toFrontend($order));
    }

    // ─── Update status ─────────────────────────────────────────────────────────

    /**
     * PATCH /api/orders/{ref}/status
     * Body: { "status": "paye" }
     */
    public function updateStatus(Request $request, string $ref): JsonResponse
    {
        try {
            $data  = $request->validate(['status' => 'required|in:en_attente,paye,livre']);
            $order = Order::where('order_ref', $ref)->firstOrFail();
            $order->update(['status' => $data['status']]);
            return response()->json($this->toFrontend($order->refresh()));
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ─── Update delivery step ──────────────────────────────────────────────────

    /**
     * PATCH /api/orders/{ref}/delivery-step
     * Body: { "step": 1|2|3 }
     *
     * Logique : valider = avancer, re-cliquer = annuler (revenir à step-1).
     */
    public function updateDeliveryStep(Request $request, string $ref): JsonResponse
    {
        try {
            $data  = $request->validate(['step' => 'required|integer|in:1,2,3']);
            $step  = (int) $data['step'];
            $order = Order::where('order_ref', $ref)->firstOrFail();

            $current = (int) ($order->delivery_step ?? 0);
            $now     = now();

            $updates = [];

            if ($current >= $step) {
                // Annulation : on revient en arrière
                if ($step === 1) {
                    $updates = [
                        'delivery_step'      => null,
                        'status'             => 'en_attente',
                        'step1_validated_at' => null,
                        'step2_validated_at' => null,
                        'step3_validated_at' => null,
                    ];
                } elseif ($step === 2) {
                    $updates = [
                        'delivery_step'      => 1,
                        'status'             => $order->status === 'livre' ? 'paye' : $order->status,
                        'step2_validated_at' => null,
                        'step3_validated_at' => null,
                    ];
                } else {
                    $updates = [
                        'delivery_step'      => 2,
                        'status'             => $order->status === 'livre' ? 'paye' : $order->status,
                        'step3_validated_at' => null,
                    ];
                }
            } else {
                // Validation : on avance
                if ($step === 1) {
                    $updates = [
                        'delivery_step'      => 1,
                        'status'             => $order->status === 'en_attente' ? 'paye' : $order->status,
                        'step1_validated_at' => $now,
                    ];
                } elseif ($step === 2 && $current >= 1) {
                    $updates = [
                        'delivery_step'      => 2,
                        'step2_validated_at' => $now,
                    ];
                } elseif ($step === 3 && $current >= 2) {
                    $updates = [
                        'delivery_step'      => 3,
                        'status'             => 'livre',
                        'step3_validated_at' => $now,
                    ];
                } else {
                    // étape verrouillée — pas de changement
                    return response()->json($this->toFrontend($order));
                }
            }

            $order->update($updates);
            return response()->json($this->toFrontend($order->refresh()));

        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ─── Update receipt ────────────────────────────────────────────────────────

    /**
     * PATCH /api/orders/{ref}/receipt
     * Body: { "receiptUrl": "https://..." }
     */
    public function updateReceipt(Request $request, string $ref): JsonResponse
    {
        try {
            $data  = $request->validate(['receiptUrl' => 'required|string']);
            $order = Order::where('order_ref', $ref)->firstOrFail();
            $order->update([
                'receipt_url' => $data['receiptUrl'],
                'status'      => 'paye',
            ]);
            return response()->json($this->toFrontend($order->refresh()));
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // ─── Destroy ───────────────────────────────────────────────────────────────

    /**
     * DELETE /api/orders/{ref}
     */
    public function destroy(string $ref): JsonResponse
    {
        Order::where('order_ref', $ref)->firstOrFail()->delete();
        return response()->json(null, 204);
    }
}
