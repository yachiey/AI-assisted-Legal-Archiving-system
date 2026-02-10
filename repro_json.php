<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$document = App\Models\Document::first();
$response = [
    'success' => true,
    'data' => [
        'doc_id' => $document->doc_id,
        'created_at' => $document->created_at, // This is a Carbon object
    ]
];
echo json_encode($response, JSON_PRETTY_PRINT);
