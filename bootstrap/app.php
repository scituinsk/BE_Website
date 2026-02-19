<?php

use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\JwtAuthRequired;
use App\Http\Middleware\JwtFromCookieOrHeader;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        apiPrefix: '/',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(ForceJsonResponse::class);

        // Register JWT middleware aliases
        $middleware->alias([
            'jwt.extract' => JwtFromCookieOrHeader::class,
            'jwt.required' => JwtAuthRequired::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e) {
            return response()->json([
                'statusCode' => 404,
                'message' => 'Resource not found.'
            ], 404);
        });

        $exceptions->render(function (Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e) {
            \Illuminate\Support\Facades\Log::error('AccessDeniedHttpException', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'previous' => $e->getPrevious() ? $e->getPrevious()->getMessage() : null,
            ]);

            return response()->json([
                'statusCode' => 403,
                'message' => 'This action is unauthorized.',
            ], 403);
        });
    })->create();
