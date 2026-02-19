<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\HttpResponses;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

use App\Http\Requests\UserIndexRequest;

class UserController extends Controller
{
    use HttpResponses;

    public function index(UserIndexRequest $request)
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->search($request->search)
            ->sort($request->sort_by, $request->sort_dir)
            ->paginate($request->per_page)
            ->withQueryString();
        return $this->successWithPagination(UserResource::collection($users), $users, "Users retrieved successfully");
    }

    public function update(UpdateUserRequest $request)
    {
        $validated = $request->validated();

        $user = User::find($validated['userId']);

        if (!$user) {
            return $this->error(null, 'User not found', 404);
        }

        $this->authorize('update', $user);

        $user->name = $validated['name'] ?? $user->name;
        $user->email = $validated['email'] ?? $user->email;

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return $this->success(new UserResource($user), 'User updated successfully');
    }

    public function store(CreateUserRequest $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validated();

        if (User::where('email', $validated['email'])->exists()) {
            return $this->error('Email already exists', 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'ADMIN',
        ]);

        return $this->success(new UserResource($user), 'User created successfully', 201);
    }

    public function destroy(Request $request, $userId)
    {
        $user = User::whereKey($userId)->first();

        if (!$user) {
            return $this->error('User not found', 404);
        }

        $this->authorize('delete', $user);

        $user->delete();

        return $this->success(null, 'User deleted successfully');
    }
}
