<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActivityIndexRequest;
use App\Http\Resources\ActivityResource;
use App\HttpResponses;
use App\Models\Activity;

class ActivityController extends Controller
{
    use HttpResponses;
    public function __invoke(ActivityIndexRequest $request)
    {
        $galleries = Activity::query()
            ->where('visibility', 'PUBLIC')
            ->when($request->year, function ($query, $year) {
                $query->whereYear('created_at', $year);
            })
            ->with(['images'])
            ->withCount('images')
            ->search($request->search)
            ->sort($request->sort_by, $request->direction)
            ->paginate($request->per_page)
            ->withQueryString();

        return $this->successWithPagination(
            ActivityResource::collection($galleries),
            $galleries,
            'Activities retrieved successfully'
        );
    }
}
