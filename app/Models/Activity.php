<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    public function images()
    {
        return $this->hasMany(ActivityImage::class);
    }

    /**
     * Search scope - Database agnostic
     */
    public function scopeSearch($query, ?string $search)
    {
        if (!$search) {
            return $query;
        }

        $searchTerm = '%' . strtolower($search) . '%';

        return $query->where(function ($q) use ($searchTerm) {
            $q->whereRaw('LOWER(name) LIKE ?', [$searchTerm])
                ->orWhereRaw('LOWER(description) LIKE ?', [$searchTerm]);
        });
    }

    /**
     * Sorting scope (whitelisted)
     */
    public function scopeSort($query, ?string $sortBy, ?string $direction)
    {
        $allowedSorts = ['created_at'];

        if (!in_array($sortBy, $allowedSorts)) {
            return $query;
        }

        $direction = strtolower($direction) === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sortBy, $direction);
    }
}
