<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ContactMail;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'username' => 'required',
            'phone' => 'required',
            'email' => 'required|email',
            'subject' => 'required',
            'message' => 'required',
        ]);

        // Map frontend fields to mailable expected fields
        $data = [
            'name' => $validatedData['username'],
            'phone' => $validatedData['phone'],
            'email' => $validatedData['email'],
            'subject' => $validatedData['subject'],
            'message' => $validatedData['message'],
        ];

        try {
            Mail::to('jhunbertscl@gmail.com')->send(new ContactMail($data));
            return response()->json(['message' => 'Message sent successfully!'], 200);
        } catch (\Exception $e) {
            Log::error('Contact form mail error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to send message: ' . $e->getMessage()], 500);
        }
    }
}
