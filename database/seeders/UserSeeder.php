<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

use Faker\Factory as Faker;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = config('auth.super_admin_email');
        $avatarHash = md5(strtolower(trim($email)));
        $avatarUrl = "https://www.gravatar.com/avatar/{$avatarHash}?d=retro&s=300";

        $initialUsers = [
            [
                'name' => config('auth.super_admin_name', 'Super Admin'),
                'email' => $email,
                'password' => Hash::make(config('auth.super_admin_password')),
                'avatar' => $avatarUrl,
                'role' => 'SUPER_ADMIN',
            ],
        ];
        foreach ($initialUsers as $userData) {
            User::create($userData);
        }
    }
}
