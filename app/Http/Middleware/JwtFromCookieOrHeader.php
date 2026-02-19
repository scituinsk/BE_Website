<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class JwtFromCookieOrHeader
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {

        $token = null;

        // Try to get token from Authorization header first (Priority 1)
        $authHeader = $request->header('Authorization', '');
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        }

        // If no token in header, try to get from cookie (Priority 2)
        if (!$token) {
            $token = $request->cookie('accessToken')
                ?? $request->cookies->get('accessToken')
                ?? $_COOKIE['accessToken'] ?? null;
        }

        // If no token found, continue without authentication
        if (!$token) {
            return $next($request);
        }

        try {
            // Set the token manually
            JWTAuth::setToken($token);

            // Try to authenticate user with the token
            $user = JWTAuth::authenticate();

            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            // Set authenticated user in request
            $request->setUserResolver(function () use ($user) {
                return $user;
            });
        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            return response()->json(['message' => 'Token expired'], 401);
        } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
            return response()->json(['message' => 'Token invalid'], 401);
        } catch (\Tymon\JWTAuth\Exceptions\JWTException $e) {
            return response()->json(['message' => 'Token error: ' . $e->getMessage()], 401);
        }

        return $next($request);
    }
}
