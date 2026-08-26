<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $userName,
        public string $title,
        public string $message,
        public string $appName = 'M-TAI',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "{$this->appName} - {$this->title}");
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml()
        );
    }

    private function buildHtml(): string
    {
        $title = htmlspecialchars($this->title, ENT_QUOTES, 'UTF-8');
        $message = nl2br(htmlspecialchars($this->message, ENT_QUOTES, 'UTF-8'));
        $userName = htmlspecialchars($this->userName, ENT_QUOTES, 'UTF-8');

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #00D4AA;">{$this->appName} - {$title}</h2>
            <p>Hello {$userName},</p>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0; line-height: 1.6;">
                {$message}
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">© {$this->appName}. All rights reserved.</p>
        </body>
        </html>
        HTML;
    }
}
