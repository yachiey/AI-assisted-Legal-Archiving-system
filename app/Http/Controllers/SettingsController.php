<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * Admin Settings - lets an admin set the Groq API keys through the UI.
 *
 * The keys are written back into the project .env file under their existing
 * variable names, so every existing env('GROQ_API_KEY') / os.getenv(...) call
 * keeps working unchanged. We do NOT change how the keys are read.
 */
class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Settings/index', [
            'groqApiKey' => [
                'configured' => !empty(env('GROQ_API_KEY')),
                'preview'    => $this->maskKey(env('GROQ_API_KEY')),
            ],
            'groqOcrApiKey' => [
                'configured' => !empty(env('GROQ_OCR_API_KEY')),
                'preview'    => $this->maskKey(env('GROQ_OCR_API_KEY')),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'groq_api_key'     => ['nullable', 'string', 'min:20', 'max:255'],
            'groq_ocr_api_key' => ['nullable', 'string', 'min:20', 'max:255'],
        ]);

        $map = [
            'GROQ_API_KEY'     => $validated['groq_api_key'] ?? null,
            'GROQ_OCR_API_KEY' => $validated['groq_ocr_api_key'] ?? null,
        ];

        $updated = [];

        try {
            foreach ($map as $envName => $value) {
                $value = is_string($value) ? trim($value) : $value;
                if ($value === null || $value === '') {
                    continue; // only touch fields the admin actually filled in
                }
                $this->setEnvValue($envName, $value);
                $updated[] = $envName;
            }
        } catch (\Throwable $e) {
            Log::error('Failed to update .env from Settings', ['error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Could not write to the .env file: ' . $e->getMessage());
        }

        if (empty($updated)) {
            return redirect()->back()->with('error', 'No API key was provided.');
        }

        // Clear cached config so a cached config can't shadow the new values.
        try {
            Artisan::call('config:clear');
        } catch (\Throwable $e) {
            Log::warning('config:clear failed after Settings update', ['error' => $e->getMessage()]);
        }

        return redirect()->back()->with(
            'success',
            'API key(s) saved. Restart the AI service for document auto-fill / OCR to use the new key(s).'
        );
    }

    /**
     * Write (or append) a KEY=value line in the project .env file.
     * Line-anchored so GROQ_API_KEY does not match GROQ_API_KEY2.
     */
    private function setEnvValue(string $name, string $value): void
    {
        $path = base_path('.env');

        if (!is_file($path) || !is_writable($path)) {
            throw new \RuntimeException('.env is missing or not writable.');
        }

        $contents = file_get_contents($path);
        $line     = $name . '=' . $value; // Groq keys are [A-Za-z0-9_], no quoting needed
        $pattern  = '/^' . preg_quote($name, '/') . '=.*$/m';

        if (preg_match($pattern, $contents)) {
            $contents = preg_replace($pattern, $line, $contents);
        } else {
            $contents = rtrim($contents, "\r\n") . PHP_EOL . $line . PHP_EOL;
        }

        if (file_put_contents($path, $contents) === false) {
            throw new \RuntimeException('Failed writing to .env.');
        }
    }

    /**
     * Mask a key for display: keep the last 4 chars only.
     */
    private function maskKey(?string $key): ?string
    {
        if (empty($key)) {
            return null;
        }

        $last = substr($key, -4);

        return 'gsk_…' . $last;
    }
}
