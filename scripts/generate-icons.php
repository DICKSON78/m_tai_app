<?php

$iconDir = __DIR__ . '/../public/icons';
$sizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (!is_dir($iconDir)) {
    mkdir($iconDir, 0755, true);
}

foreach ($sizes as $size) {
    $filename = $iconDir . "/icon-{$size}x{$size}.png";
    if (file_exists($filename)) {
        echo "Exists: {$filename}\n";
        continue;
    }

    $img = imagecreatetruecolor($size, $size);

    $bg1 = imagecolorallocate($img, 0, 212, 170);
    $bg2 = imagecolorallocate($img, 0, 184, 148);

    imagefilledrectangle($img, 0, 0, $size, $size, $bg1);

    $white = imagecolorallocate($img, 255, 255, 255);
    $whiteAlpha = imagecolorallocatealpha($img, 255, 255, 255, 30);

    $radius = (int)($size * 0.21);

    imagefilledrectangle($img, $radius, 0, $size - $radius, $size, $bg1);
    imagefilledrectangle($img, 0, $radius, $size, $size - $radius, $bg1);
    imagefilledellipse($img, $radius, $radius, $radius * 2, $radius * 2, $bg1);
    imagefilledellipse($img, $size - $radius, $radius, $radius * 2, $radius * 2, $bg1);
    imagefilledellipse($img, $radius, $size - $radius, $radius * 2, $radius * 2, $bg1);
    imagefilledellipse($img, $size - $radius, $size - $radius, $radius * 2, $radius * 2, $bg1);

    $fontSize = (int)($size * 0.47);
    $fontFile = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
    if (!file_exists($fontFile)) {
        $fontFile = '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf';
    }

    if (file_exists($fontFile)) {
        $bbox = imagettfbbox($fontSize, 0, $fontFile, 'M');
        $textWidth = $bbox[2] - $bbox[0];
        $textHeight = $bbox[1] - $bbox[7];
        $x = ($size - $textWidth) / 2;
        $y = ($size + $textHeight) / 2 - $fontSize * 0.1;
        imagettftext($img, $fontSize, 0, $x, $y, $white, $fontFile, 'M');

        $subSize = (int)($size * 0.1);
        $bbox2 = imagettfbbox($subSize, 0, $fontFile, 'M-TAI');
        $subWidth = $bbox2[2] - $bbox2[0];
        $subX = ($size - $subWidth) / 2;
        $subY = $y + $fontSize * 0.6;
        $whiteFaded = imagecolorallocatealpha($img, 255, 255, 255, 30);
        imagettftext($img, $subSize, 0, $subX, $subY, $whiteFaded, $fontFile, 'M-TAI');
    }

    imagepng($img, $filename);
    imagedestroy($img);
    echo "Generated: {$filename}\n";
}

echo "Done!\n";
