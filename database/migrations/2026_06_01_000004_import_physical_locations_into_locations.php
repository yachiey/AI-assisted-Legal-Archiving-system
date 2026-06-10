<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Seed the new locations tree from existing free-text physical_location
     * values (each distinct value becomes a top-level cabinet) and link
     * documents to the created location nodes.
     */
    public function up(): void
    {
        $names = DB::table('documents')
            ->whereNotNull('physical_location')
            ->where('physical_location', '!=', '')
            ->distinct()
            ->pluck('physical_location');

        foreach ($names as $name) {
            $name = trim($name);
            if ($name === '') {
                continue;
            }

            $existing = DB::table('locations')
                ->whereNull('parent_id')
                ->where('name', $name)
                ->first();

            $locationId = $existing
                ? $existing->id
                : DB::table('locations')->insertGetId([
                    'name'       => $name,
                    'parent_id'  => null,
                    'path'       => $name,
                    'created_by' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            DB::table('documents')
                ->where('physical_location', $name)
                ->update(['location_id' => $locationId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('documents')->update(['location_id' => null]);
        DB::table('locations')->delete();
    }
};
