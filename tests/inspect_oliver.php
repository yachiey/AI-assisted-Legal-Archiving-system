<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Document;

$doc = Document::where('title', 'LIKE', '%OLIVER D. FUENTEVILLA%')->first();

if (!$doc) {
    echo "Document not found.\n";
    exit;
}

echo "Title: {$doc->title}\n";
echo "Extracted Text Preview:\n";
echo substr($doc->extracted_text, 0, 500) . "\n\n";

if ($doc->embeddings->isNotEmpty()) {
    echo "Embedding Chunk Preview:\n";
    echo $doc->embeddings->first()->chunk_text . "\n";
} else {
    echo "No embeddings found.\n";
}
