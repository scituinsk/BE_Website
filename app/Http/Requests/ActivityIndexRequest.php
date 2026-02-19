<?php

namespace App\Http\Requests;

class ActivityIndexRequest extends BaseIndexRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function sortableColumns(): array
    {
        return ['name', 'launch_year', 'created_at'];
    }

    public function rules(): array
    {
        $baseRules = parent::rules();

        return array_merge($baseRules, [
            'year' => ['sometimes', 'integer', 'min:1900', 'max:' . date('Y')],
        ]);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'sort_by'  => $this->sort_by ?? config('pagination.resources.activities.sort_by'),
            'sort_dir' => $this->sort_dir ?? config('pagination.resources.activities.sort_direction'),
            'per_page' => $this->per_page ?? config('pagination.resources.activities.per_page'),
        ]);
    }
}
