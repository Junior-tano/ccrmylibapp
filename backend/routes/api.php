<?php

use App\Http\Controllers\Api\EbookController;
use App\Http\Controllers\Api\EbookOrderController;
use App\Http\Controllers\Api\HeroSlideController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PhysicalBookController;
use App\Http\Controllers\Api\PodcastController;
use App\Http\Controllers\Api\ReceiptUploadController;
use App\Http\Controllers\Api\UpcomingProgramController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\VideoController;
use Illuminate\Support\Facades\Route;

// ─── Upload routes ────────────────────────────────────────────────────────────
Route::post('uploads/images',   [UploadController::class, 'image']);
Route::post('uploads/audio',    [UploadController::class, 'audio']);
Route::post('uploads/receipts', [ReceiptUploadController::class, 'store']);

// ─── Content resource routes ──────────────────────────────────────────────────
Route::apiResource('podcasts',     PodcastController::class);
Route::apiResource('videos',       VideoController::class);
Route::apiResource('ebooks',       EbookController::class);
Route::apiResource('physical-books', PhysicalBookController::class);
Route::apiResource('programs',     UpcomingProgramController::class);
Route::apiResource('hero-slides',  HeroSlideController::class);

// ─── Physical Orders ──────────────────────────────────────────────────────────
Route::get('orders',                         [OrderController::class, 'index']);
Route::post('orders',                        [OrderController::class, 'store']);
Route::get('orders/{ref}',                   [OrderController::class, 'show']);
Route::delete('orders/{ref}',                [OrderController::class, 'destroy']);
Route::patch('orders/{ref}/status',          [OrderController::class, 'updateStatus']);
Route::patch('orders/{ref}/delivery-step',   [OrderController::class, 'updateDeliveryStep']);
Route::patch('orders/{ref}/receipt',         [OrderController::class, 'updateReceipt']);

// ─── Ebook Orders ─────────────────────────────────────────────────────────────
Route::get('ebook-orders',                   [EbookOrderController::class, 'index']);
Route::post('ebook-orders',                  [EbookOrderController::class, 'store']);
Route::get('ebook-orders/{ref}',             [EbookOrderController::class, 'show']);
Route::delete('ebook-orders/{ref}',          [EbookOrderController::class, 'destroy']);
Route::patch('ebook-orders/{ref}/status',    [EbookOrderController::class, 'updateStatus']);
Route::patch('ebook-orders/{ref}/receipt',   [EbookOrderController::class, 'updateReceipt']);
