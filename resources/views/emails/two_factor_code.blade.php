<!DOCTYPE html>
<html>
<head>
    <title>Your verification code</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 10px;">Verification Code</h2>

        <p>Hello {{ $name }},</p>
        <p>Use the code below to complete your sign-in. It expires in <strong>10 minutes</strong>.</p>

        <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #2e7d32; margin: 20px 0; text-align: center;">
            <span style="font-size: 34px; font-weight: bold; letter-spacing: 10px; color: #2e7d32;">{{ $code }}</span>
        </div>

        <p style="font-size: 14px; color: #555;">
            If you didn't try to sign in, you can safely ignore this email &mdash; your account is still secure.
        </p>

        <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
            This is an automated message from the Legal Arch AIU portal. Please do not reply.
        </p>
    </div>
</body>
</html>
