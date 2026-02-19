<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Pagination Settings
    |--------------------------------------------------------------------------
    |
    | These values define the default pagination behavior across the application.
    |
    */

    'default_per_page' => env('PAGINATION_PER_PAGE', 10),
    'max_per_page' => env('PAGINATION_MAX_PER_PAGE', 100),
    'min_per_page' => env('PAGINATION_MIN_PER_PAGE', 1),

    /*
    |--------------------------------------------------------------------------
    | Default Sorting Settings
    |--------------------------------------------------------------------------
    |
    | These values define the default sorting behavior across the application.
    |
    */

    'default_sort_direction' => env('SORT_DIRECTION', 'asc'),

    /*
    |--------------------------------------------------------------------------
    | Resource-Specific Defaults
    |--------------------------------------------------------------------------
    |
    | Override defaults for specific resources if needed.
    |
    */

    'resources' => [
        'projects' => [
            'per_page' => 10,
            'sort_by' => 'created_at',
            'sort_direction' => 'desc',
        ],

        'technologies' => [
            'per_page' => 10,
            'sort_by' => 'name',
            'sort_direction' => 'asc',
        ],
        'activities' => [
            'per_page' => 10,
            'sort_by' => 'created_at',
            'sort_direction' => 'desc',
        ]
    ],
];
