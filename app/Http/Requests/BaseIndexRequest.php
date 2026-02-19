<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class BaseIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    abstract protected function sortableColumns(): array;

    public function rules(): array
    {
        $sortable = implode(',', $this->sortableColumns());

        return [
            'search'   => ['nullable', 'string', 'max:100'],

            'sort_by'  => [
                'nullable',
                'string',
                'in:' . $sortable
            ],

            'sort_dir' => ['nullable', 'string', 'in:asc,desc'],

            'page'     => ['nullable', 'integer', 'min:' . config('pagination.min_per_page')],
            'per_page' => ['nullable', 'integer', 'min:' . config('pagination.min_per_page'), 'max:' . config('pagination.max_per_page')],
        ];
    }
}
