<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds the current physical-tracking state to documents so listing and the
     * cabinet sidebar can show borrow status without scanning the history table.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('tracking_status')->default('in_storage')->after('physical_location'); // in_storage | checked_out
            $table->string('checked_out_to')->nullable()->after('tracking_status');
            $table->timestamp('checked_out_at')->nullable()->after('checked_out_to');
            $table->date('tracking_due_date')->nullable()->after('checked_out_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['tracking_status', 'checked_out_to', 'checked_out_at', 'tracking_due_date']);
        });
    }
};
