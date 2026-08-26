<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $email, public string $token, public string $appName = 'M-TAI') {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "{$this->appName} - Password Reset");
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml()
        );
    }

    private function buildHtml(): string
    {
        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00D4AA;">{$this->appName} - Password Reset</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{$this->getResetUrl()}" style="background: #00D4AA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            </p>
            <p style="color: #666; font-size: 14px;">This link expires in 60 minutes. If you didn't request this, ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">© {$this->appName}. All rights reserved.</p>
        </body>
        </html>
        HTML;
    }

    private function getResetUrl(): string
    {
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
        return "{$frontendUrl}/reset-password?token={$this->token}&email=" . urlencode($this->email);
    }
}
