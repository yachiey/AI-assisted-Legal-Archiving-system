<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Stores the physical movement / borrow history for documents.
     * Each row is a single tracking event (moved, checked out, checked in).
     */
    public function up(): void
    {
        Schema::create('document_trackings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doc_id');
            $table->string('action'); // moved | checked_out | checked_in
            $table->string('from_location')->nullable();
            $table->string('to_location')->nullable();
            $table->string('borrower')->nullable();
            $table->date('due_date')->nullable();
            $table->text('note')->nullable();
            $table->unsignedBigInteger('performed_by')->nullable();
            $table->timestamps();

            $table->foreign('doc_id')->references('doc_id')->on('documents')->onDelete('cascade');
            $table->index(['doc_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_trackings');
    }
};
