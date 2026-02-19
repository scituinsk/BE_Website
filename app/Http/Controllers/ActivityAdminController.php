<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActivityIndexRequest;
use App\Http\Requests\CreateActivityRequest;
use App\Http\Resources\ActivityImagesResource;
use App\Http\Resources\ActivityResource;
use App\HttpResponses;
use App\Models\Activity;
use App\Models\ActivityImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ActivityAdminController extends Controller
{
    use HttpResponses;

    public function index(ActivityIndexRequest $request)
    {
        $this->authorize('viewAny', Activity::class);

        $activity = Activity::query()->withCount('images')
            ->search($request->search)
            ->sort($request->sort_by, $request->sort_dir)
            ->paginate($request->per_page)
            ->withQueryString();

        return $this->successWithPagination(
            ActivityResource::collection($activity),
            $activity,
            'Activity retrieved successfully'
        );
    }

    public function show($id)
    {
        $activity = Activity::with('images')->where('id', $id)->first();

        if (!$activity) {
            return $this->error('Activity not found', 404);
        }

        $this->authorize('view', $activity);

        return $this->success(new ActivityResource($activity), 'Activity retrieved successfully');
    }

    public function store(CreateActivityRequest $request)
    {
        $this->authorize('create', Activity::class);

        $data = $request->validated();

        $activity = Activity::create([
            'name' => $data['name'],
            'description' => $data['description'],
        ]);

        return $this->success(new ActivityResource($activity), 'Activity created successfully');
    }

    public function destroy($id)
    {
        $activity = Activity::find($id);

        if (!$activity) {
            return $this->error('Activity not found', 404);
        }

        $this->authorize('delete', $activity);

        $activity->delete();

        return $this->success(null, 'Activity deleted successfully');
    }

    public function uploadImage(Request $request, $activityId)
    {
        $validatedData = $request->validate([
            'image' => 'required|image|max:5120', // max 5MB
        ]);

        $activity = Activity::find($activityId);

        if (!$activity) {
            return $this->error('Activity not found', 404);
        }

        $this->authorize('update', $activity);

        $original_filename = $request->file('image')->getClientOriginalName();
        $file_type = $request->file('image')->extension();
        $file_size = $request->file('image')->getSize();

        $fileName = Str::ulid() . '.' . $file_type;

        $imagePath = Storage::putFileAs('activity-image', $validatedData['image'], $fileName);

        $record = ActivityImage::create([
            'path' => $imagePath,
            'original_filename' => $original_filename,
            'file_type' => $file_type,
            'file_size' => $file_size,
            'activity_id' => $activity->id,
            'is_used' => true,
        ]);

        return $this->success(new ActivityImagesResource($record), 'Image uploaded successfully');
    }

    public function destroyImage($activityId, $imageId)
    {
        $activity = Activity::find($activityId);

        if (!$activity) {
            return $this->error('Activity not found', 404);
        }

        $this->authorize('update', $activity);

        $image = ActivityImage::where('id', $imageId)->where('activity_id', $activityId)->first();

        if (!$image) {
            return $this->error('Image not found', 404);
        }

        Storage::delete($image->path);
        $image->delete();

        return $this->success(null, 'Image deleted successfully');
    }
}
