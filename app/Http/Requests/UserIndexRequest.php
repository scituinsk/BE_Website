<?php

namespace App\Http\Requests;

class UserIndexRequest extends BaseIndexRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function sortableColumns(): array
    {
        return ['title', 'launch_year', 'created_at'];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'sort_by'  => $this->sort_by ?? config('pagination.resources.projects.sort_by'),
            'sort_dir' => $this->sort_dir ?? config('pagination.resources.projects.sort_direction'),
            'per_page' => $this->per_page ?? config('pagination.resources.projects.per_page'),
        ]);
    }
}
