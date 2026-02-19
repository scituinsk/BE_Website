<?php

namespace App\Http\Requests;

class TechnologyIndexRequest extends BaseIndexRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function sortableColumns(): array
    {
        return ['name', 'created_at'];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'sort_by'  => $this->sort_by ?? config('pagination.resources.technologies.sort_by'),
            'sort_dir' => $this->sort_dir ?? config('pagination.resources.technologies.sort_direction'),
            'per_page' => $this->per_page ?? config('pagination.resources.technologies.per_page'),
        ]);
    }
}
