<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Hierarchical physical storage locations (Cabinet > Tray > Partition, any depth).
     */
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('path')->nullable(); // denormalized full path e.g. "Cabinet B > Mid Tray > Partition 1"
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('locations')->onDelete('cascade');
            $table->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
