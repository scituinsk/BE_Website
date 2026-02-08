<?php

namespace App\Providers;

use App\Models\Project;
use App\Models\User;
use App\Policies\ProjectPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (!config('auth.super_admin_email')) {
            throw new RuntimeException(
                'SUPER_ADMIN_EMAIL is not set in environment'
            );
        }

        if (!config('auth.super_admin_password')) {
            throw new RuntimeException(
                'SUPER_ADMIN_PASSWORD is not set in environment'
            );
        }


        /**
         * Register Policies
         */
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Project::class, ProjectPolicy::class);

        /**
         * Beforre Laravel Gate checks any policy, this callback will be executed first.
         * So, if the user is super admin, they will be granted all permissions.
         */
        Gate::before(function (?User $user, string $ability) {
            if ($user && $user->isSuperAdmin()) {
                return true;
            }

            // Return null to continue to policy check
            return null;
        });
    }
}
