<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    public function __construct(private TwoFactorCodeService $codeService)
    {
    }

    /**
     * Report whether the current user has 2FA active and which method.
     */
    public function status(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'enabled' => $user->hasTwoFactorEnabled(),
            'method' => $user->hasTwoFactorEnabled() ? $user->twoFactorMethod() : null,
        ]);
    }

    /**
     * Begin enrollment with the chosen method (authenticator app or email).
     * Generates recovery codes and either a TOTP secret/QR or emails a code.
     */
    public function enable(Request $request)
    {
        $request->validate([
            'method' => 'required|in:totp,email',
        ]);

        $user = $request->user();
        $method = $request->input('method');
        $recoveryCodes = $this->generateRecoveryCodes();

        $user->two_factor_method = $method;
        $user->two_factor_recovery_codes = json_encode($recoveryCodes);
        $user->two_factor_confirmed_at = null; // not active until confirmed

        if ($method === 'email') {
            $user->two_factor_secret = null;
            $user->save();

            $sent = $this->codeService->sendEmailCode($user);

            return response()->json([
                'method' => 'email',
                'email' => $this->maskEmail($user->email),
                'mail_sent' => $sent,
                'recovery_codes' => $recoveryCodes,
            ]);
        }

        // TOTP (authenticator app)
        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();
        $user->two_factor_secret = $secret;
        $user->save();

        $otpauthUrl = $google2fa->getQRCodeUrl(
            config('app.name', 'Legal Arch AIU'),
            $user->email,
            $secret
        );

        return response()->json([
            'method' => 'totp',
            'secret' => $secret,
            'otpauth_url' => $otpauthUrl,
            'qr_svg' => $this->qrCodeSvg($otpauthUrl),
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Resend the email code during setup (email method only).
     */
    public function resendSetupCode(Request $request)
    {
        $user = $request->user();

        if ($user->two_factor_method !== 'email') {
            return response()->json([
                'message' => 'No email verification is in progress.'
            ], 422);
        }

        $sent = $this->codeService->sendEmailCode($user);

        return response()->json([
            'mail_sent' => $sent,
            'message' => $sent ? 'A new code has been sent.' : 'Could not send the code.',
        ], $sent ? 200 : 500);
    }

    /**
     * Confirm enrollment by verifying a code against the pending secret.
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = $request->user();

        if (empty($user->two_factor_method)) {
            return response()->json([
                'message' => 'Two-factor setup has not been started.'
            ], 422);
        }

        if ($user->two_factor_method === 'email') {
            $verified = $this->codeService->verifyEmailCode($user, $request->input('code'));
        } else {
            if (empty($user->two_factor_secret)) {
                return response()->json([
                    'message' => 'Two-factor setup has not been started.'
                ], 422);
            }
            $verified = (new Google2FA())->verifyKey($user->two_factor_secret, $request->input('code'));
        }

        if (!$verified) {
            return response()->json([
                'message' => 'The provided code is invalid or has expired.'
            ], 422);
        }

        $user->two_factor_confirmed_at = now();
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication enabled.',
        ]);
    }

    /**
     * Disable 2FA after confirming the user's current password.
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'message' => 'The password is incorrect.'
            ], 422);
        }

        $user->two_factor_secret = null;
        $user->two_factor_recovery_codes = null;
        $user->two_factor_confirmed_at = null;
        $user->two_factor_method = null;
        $user->two_factor_email_code = null;
        $user->two_factor_email_expires_at = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication disabled.',
        ]);
    }

    /**
     * Mask an email for display, e.g. j****n@gmail.com.
     */
    private function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');

        if (strlen($name) <= 2) {
            $maskedName = substr($name, 0, 1) . '***';
        } else {
            $maskedName = substr($name, 0, 1) . str_repeat('*', max(1, strlen($name) - 2)) . substr($name, -1);
        }

        return $domain ? "{$maskedName}@{$domain}" : $maskedName;
    }

    /**
     * Generate a fresh set of one-time recovery codes.
     *
     * @return array<int, string>
     */
    private function generateRecoveryCodes(): array
    {
        return collect(range(1, 8))
            ->map(fn () => Str::upper(Str::random(5) . '-' . Str::random(5)))
            ->all();
    }

    /**
     * Render an otpauth URL as an inline SVG QR code (data URI).
     */
    private function qrCodeSvg(string $otpauthUrl): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(220),
            new SvgImageBackEnd()
        );

        $svg = (new Writer($renderer))->writeString($otpauthUrl);

        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }
}
