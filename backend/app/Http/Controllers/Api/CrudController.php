<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

abstract class CrudController extends Controller
{
    protected string $modelClass;

    protected array $rules = [];

    public function index(): JsonResponse
    {
        return response()->json(
            $this->modelClass::query()->latest()->get()->map(fn (Model $model) => $this->toFrontend($model))
        );
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data  = $request->validate($this->rules);
            $model = $this->modelClass::query()->create($this->toDatabase($data));

            return response()->json($this->toFrontend($model), 201);

        } catch (ValidationException $exception) {
            // CORRECTION : retourner les erreurs de validation en 422
            // (au lieu de les laisser remonter comme erreur 500 non gérée)
            return response()->json([
                'message' => 'Données invalides. Vérifiez les champs du formulaire.',
                'errors'  => $exception->errors(),
            ], 422);

        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Erreur base de données. Vérifiez que les migrations ont été exécutées et que MySQL est connecté.',
                'error'   => $exception->getMessage(),
            ], 500);

        } catch (Throwable $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        $model = $this->modelClass::query()->findOrFail($id);

        return response()->json($this->toFrontend($model));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $model = $this->modelClass::query()->findOrFail($id);
            $data  = $request->validate($this->partialRules());
            $model->update($this->toDatabase($data));

            return response()->json($this->toFrontend($model->refresh()));

        } catch (ValidationException $exception) {
            // CORRECTION : même traitement que store()
            return response()->json([
                'message' => 'Données invalides. Vérifiez les champs du formulaire.',
                'errors'  => $exception->errors(),
            ], 422);

        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Erreur base de données. Vérifiez que les migrations ont été exécutées et que MySQL est connecté.',
                'error'   => $exception->getMessage(),
            ], 500);

        } catch (Throwable $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $this->modelClass::query()->findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    /**
     * Convertit les clés camelCase du frontend en snake_case pour la base
     * de données. Ex: isActive → is_active, buttonText → button_text.
     */
    protected function toDatabase(array $data): array
    {
        $databaseData = [];

        foreach ($data as $key => $value) {
            $databaseData[Str::snake($key)] = $value;
        }

        return $databaseData;
    }

    /**
     * Convertit les clés snake_case du modèle en camelCase pour le frontend,
     * et s'assure que l'id est toujours renvoyé en string.
     */
    protected function toFrontend(Model $model): array
    {
        $data         = $model->toArray();
        $frontendData = [];

        foreach ($data as $key => $value) {
            if (in_array($key, ['created_at', 'updated_at'], true)) {
                continue;
            }

            $frontendData[Str::camel($key)] = $value;
        }

        $frontendData['id'] = (string) $model->getKey();

        return $frontendData;
    }

    protected function partialRules(): array
    {
        return collect($this->rules)
            ->map(fn (string|array $rule) => $this->makeRuleNullable($rule))
            ->all();
    }

    protected function makeRuleNullable(string|array $rule): string|array
    {
        if (is_array($rule)) {
            return array_values(array_filter($rule, fn (string $value) => $value !== 'required'));
        }

        return str_replace('required', 'sometimes', $rule);
    }
}