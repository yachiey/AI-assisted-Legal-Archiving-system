<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Links a document to a managed physical location. The free-text
     * `physical_location` is kept in sync as the location's full path
     * for display/search compatibility.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedBigInteger('location_id')->nullable()->after('physical_location');
            $table->index('location_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['location_id']);
            $table->dropColumn('location_id');
        });
    }
};
