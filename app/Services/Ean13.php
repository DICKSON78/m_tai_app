<?php

namespace App\Services;

class Ean13
{
    // GS1 country prefix for Tanzania.
    public const GS1_PREFIX = '620';

    private const L = [
        0 => '0001101',
        1 => '0011001',
        2 => '0010011',
        3 => '0111101',
        4 => '0100011',
        5 => '0110001',
        6 => '0101111',
        7 => '0111011',
        8 => '0110111',
        9 => '0001011',
    ];

    private const G = [
        0 => '0100111',
        1 => '0110011',
        2 => '0011011',
        3 => '0100001',
        4 => '0011101',
        5 => '0111001',
        6 => '0000101',
        7 => '0010001',
        8 => '0001001',
        9 => '0010111',
    ];

    private const R = [
        1 => '1110010',
        2 => '1100110',
        3 => '1101100',
        4 => '1000010',
        5 => '1011100',
        6 => '1001110',
        7 => '1010000',
        8 => '1000100',
        9 => '1001000',
        0 => '1110100',
    ];

    // Parity pattern chosen by the leading digit for the six left-hand digits.
    private const PARITY = [
        0 => 'LLLLLL',
        1 => 'LLGLGG',
        2 => 'LLGGLG',
        3 => 'LLGGGL',
        4 => 'LGLLGG',
        5 => 'LGGLLG',
        6 => 'LGGGLL',
        7 => 'LGLGLG',
        8 => 'LGLLLG',
        9 => 'LGLGLL',
    ];

    public static function computeCheckDigit(string $twelveDigits): int
    {
        $sum = 0;
        $length = strlen($twelveDigits);

        for ($i = 0; $i < $length; $i++) {
            $weight = ($i % 2 === 0) ? 1 : 3;
            $sum += (int) $twelveDigits[$i] * $weight;
        }

        return (10 - ($sum % 10)) % 10;
    }

    public static function isValid(string $barcode): bool
    {
        if (! preg_match('/^\d{13}$/', $barcode)) {
            return false;
        }

        return self::computeCheckDigit(substr($barcode, 0, 12)) === (int) $barcode[12];
    }

    /**
     * Build a stable, unique GTIN-13 from a business and product id.
     */
    public static function forProduct(int $businessId, int $productId): string
    {
        $base = self::GS1_PREFIX
            . str_pad($businessId, 3, '0', STR_PAD_LEFT)
            . str_pad($productId, 6, '0', STR_PAD_LEFT);

        return $base . self::computeCheckDigit($base);
    }

    /**
     * Render a scannable EAN-13 barcode as an inline SVG string.
     */
    public static function toSvg(string $gtin13, string $label = ''): string
    {
        if (! self::isValid($gtin13)) {
            throw new \InvalidArgumentException('Invalid EAN-13 code: '.$gtin13);
        }

        $modules = self::encode($gtin13);
        $unitWidth = 2;
        $barHeight = 62;
        $quietZones = 9;
        $width = ($quietZones * 2 + strlen($modules)) * $unitWidth;
        $svgHeight = $barHeight + ($label !== '' ? 56 : 22);

        $bars = self::bars($modules, $quietZones, $unitWidth, $barHeight);

        $text = self::digits($gtin13, $quietZones, $unitWidth, $barHeight);
        if ($label !== '') {
            $text .= '<text x="'.($width / 2).'" y="'.($barHeight + 16).'"'
                .' text-anchor="middle" font-family="monospace" font-size="10" fill="#000">'
                .htmlspecialchars($label, ENT_QUOTES).'</text>';
        }

        return '<svg xmlns="http://www.w3.org/2000/svg" width="'.$width.'" height="'.$svgHeight.'" viewBox="0 0 '.$width.' '.$svgHeight.'" role="img" aria-label="EAN-13 '.htmlspecialchars($gtin13, ENT_QUOTES).'">'
            .$bars.$text
            .'</svg>';
    }

    private static function encode(string $gtin13): string
    {
        $first = (int) $gtin13[0];
        $left = substr($gtin13, 1, 6);
        $right = substr($gtin13, 7, 6);
        $parity = self::PARITY[$first];

        $leftBars = '';
        for ($i = 0; $i < 6; $i++) {
            $digit = (int) $left[$i];
            $set = $parity[$i] === 'L' ? self::L : self::G;
            $leftBars .= $set[$digit];
        }

        $rightBars = '';
        for ($i = 0; $i < 6; $i++) {
            $rightBars .= self::R[(int) $right[$i]];
        }

        return '101'.$leftBars.'01010'.$rightBars.'101';
    }

    private static function bars(string $modules, int $quietZones, int $unitWidth, int $barHeight): string
    {
        $svg = '';
        $length = strlen($modules);
        $runStart = null;

        for ($i = 0; $i <= $length; $i++) {
            $isBar = $i < $length && $modules[$i] === '1';
            if ($isBar && $runStart === null) {
                $runStart = $i;
            }
            if ((! $isBar || $i === $length) && $runStart !== null) {
                $x = ($quietZones + $runStart) * $unitWidth;
                $w = ($i - $runStart) * $unitWidth;
                $svg .= '<rect x="'.$x.'" y="0" width="'.$w.'" height="'.$barHeight.'" fill="#000"/>';
                $runStart = null;
            }
        }

        return $svg;
    }

    private static function digits(string $gtin13, int $quietZones, int $unitWidth, int $barHeight): string
    {
        $first = $gtin13[0];
        $left = substr($gtin13, 1, 6);
        $right = substr($gtin13, 7, 6);
        $y = $barHeight + 14;

        $text = '';
        $x = ($quietZones) * $unitWidth;
        $text .= '<text x="'.$x.'" y="'.$y.'" font-family="monospace" font-size="12" fill="#000">'.$first.'</text>';

        $x = ($quietZones + 3) * $unitWidth;
        $text .= '<text x="'.$x.'" y="'.$y.'" letter-spacing="1" font-family="monospace" font-size="12" fill="#000">'.$left.'</text>';

        $x = ($quietZones + 50) * $unitWidth;
        $text .= '<text x="'.$x.'" y="'.$y.'" letter-spacing="1" font-family="monospace" font-size="12" fill="#000">'.$right.'</text>';

        return $text;
    }
}