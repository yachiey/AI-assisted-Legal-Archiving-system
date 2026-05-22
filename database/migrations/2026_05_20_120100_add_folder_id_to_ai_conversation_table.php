<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_conversation', function (Blueprint $table) {
            $table->unsignedBigInteger('folder_id')->nullable()->after('starred');
            $table->index('folder_id');
            $table->foreign('folder_id')->references('folder_id')->on('ai_folders')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('ai_conversation', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropIndex(['folder_id']);
            $table->dropColumn('folder_id');
        });
    }
};
