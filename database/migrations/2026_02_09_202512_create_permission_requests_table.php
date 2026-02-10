<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permission_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->json('permissions'); // {can_view: true, can_upload: true, etc.}
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'denied'])->default('pending');
            $table->unsignedBigInteger('admin_id')->nullable(); // Admin who processed the request
            $table->text('admin_response')->nullable(); // Optional response from admin
            $table->timestamps();

            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('admin_id')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_requests');
    }
};
