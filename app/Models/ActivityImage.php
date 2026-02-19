<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityImage extends Model
{
    protected $fillable = [
        'path',
        'original_filename',
        'file_type',
        'file_size',
        'activity_id',
        'is_used',
    ];

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }
}
