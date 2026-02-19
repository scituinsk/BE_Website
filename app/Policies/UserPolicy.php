<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        /**
         * Only super admin can view all users
         */
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        /**
         * Super admin can view any user
         * Users can view their own profile
         */
        return $user->isSuperAdmin() || $user->id === $model->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        /**
         * Only super admin can create users
         */
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        /**
         * Only super admin can update users (including themselves and other admins)
         */
        return $user->isSuperAdmin() || $user->id === $model->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $actor, User $target): bool
    {
        /**
         * Only super admin can delete users and cannot delete other super admins
         */
        if ($target->isSuperAdmin()) {
            return false;
        }

        return $actor->isSuperAdmin();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        /**
         * Only super admin can restore users
         */
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        /**
         * Only super admin can permanently delete users
         */
        return $user->isSuperAdmin();
    }
}
