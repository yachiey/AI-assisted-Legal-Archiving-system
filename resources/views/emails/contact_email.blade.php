<!DOCTYPE html>
<html>
<head>
    <title>New Contact Message</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 10px;">New Inquiry from Website</h2>
        
        <p><strong>Name:</strong> {{ $data['name'] }}</p>
        <p><strong>Email:</strong> {{ $data['email'] }}</p>
        <p><strong>Phone:</strong> {{ $data['phone'] }}</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <h3 style="color: #555;">Subject: {{ $data['subject'] }}</h3>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2e7d32; margin-top: 10px;">
            <p style="margin: 0; white-space: pre-wrap;">{{ $data['message'] }}</p>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
            This email was sent from the contact form on the Legal Arch AIU website.
        </p>
    </div>
</body>
</html>
