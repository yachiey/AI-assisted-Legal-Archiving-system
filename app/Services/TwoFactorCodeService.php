<?php

namespace App\Services;

use App\Mail\TwoFactorCodeMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TwoFactorCodeService
{
    /**
     * How long an emailed code stays valid, in minutes.
     */
    public const EXPIRY_MINUTES = 10;

    /**
     * Generate a fresh 6-digit code, store it (hashed) with an expiry,
     * and email it to the user. Returns false if the mail send failed.
     */
    public function sendEmailCode(User $user): bool
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->two_factor_email_code = Hash::make($code);
        $user->two_factor_email_expires_at = now()->addMinutes(self::EXPIRY_MINUTES);
        $user->save();

        try {
            Mail::to($user->email)->send(
                new TwoFactorCodeMail($code, $user->firstname ?: $user->email)
            );

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send two-factor email code', [
                'user_id' => $user->getKey(),
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Verify a submitted code against the stored hash + expiry.
     * Consumes (clears) the code on success.
     */
    public function verifyEmailCode(User $user, string $code): bool
    {
        if (empty($user->two_factor_email_code) || is_null($user->two_factor_email_expires_at)) {
            return false;
        }

        if (now()->greaterThan($user->two_factor_email_expires_at)) {
            return false;
        }

        if (!Hash::check(trim($code), $user->two_factor_email_code)) {
            return false;
        }

        $user->two_factor_email_code = null;
        $user->two_factor_email_expires_at = null;
        $user->save();

        return true;
    }
}
