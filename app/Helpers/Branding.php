<?php

namespace App\Helpers;

class Branding
{
    protected static ?string $logoDataUriCache = null;

    public static function logoPngPath(): ?string
    {
        foreach ([
            base_path('public/img/mtai-logo.png'),
            base_path('public/images/mtai-logo.png'),
            base_path('storage/app/public/mtai-logo.png'),
        ] as $path) {
            if (is_file($path)) {
                return $path;
            }
        }
        return null;
    }

    public static function logoDataUri(): string
    {
        if (static::$logoDataUriCache !== null) {
            return static::$logoDataUriCache;
        }

        $path = static::logoPngPath();
        $data = $path
            ? base64_encode(file_get_contents($path) ?: '')
            : '';

        if ($data === '') {
            $data = static::fallbackLogoBase64();
        }

        static::$logoDataUriCache = $data;
        return $data;
    }

    public static function logoImgHtml(int $height = 120, string $side = 'center'): string
    {
        $src = 'data:image/png;base64,' . static::logoDataUri();

        $style = '';
        if ($side === 'left') {
            $style = "height:{$height}px;vertical-align:middle;";
        } elseif ($side === 'right') {
            $style = "height:{$height}px;vertical-align:middle;float:right;";
        } else {
            $style = "height:{$height}px;vertical-align:middle;";
        }

        return '<img src="' . $src . '" alt="M-TAI" style="' . $style . '" />';
    }

    protected static function fallbackLogoBase64(): string
    {
        return 'iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAPUlEQVRoge3PAQ0AAADCoPdPbQ8HESgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8GQYrAAHrhBfLAAAAAElFTkSuQmCC';
    }
}
