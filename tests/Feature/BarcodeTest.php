<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use App\Services\Ean13;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BarcodeTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $this->business = Business::factory()->create(['user_id' => $this->owner->id]);
    }

    public function test_check_digit_matches_known_vectors(): void
    {
        // 5901234123457 (standard test code) -> check digit 7
        $this->assertSame(7, Ean13::computeCheckDigit('590123412345'));
        $this->assertTrue(Ean13::isValid('5901234123457'));
        $this->assertFalse(Ean13::isValid('5901234123458'));
    }

    public function test_generated_gtin_is_13_digits_with_valid_check_under_tz_prefix(): void
    {
        $code = Ean13::forProduct(1, 90);

        $this->assertSame(13, strlen($code));
        $this->assertStringStartsWith('620', $code);
        $this->assertTrue(Ean13::isValid($code));
        // Deterministic and unique per business + product.
        $this->assertSame($code, Ean13::forProduct(1, 90));
        $this->assertNotSame($code, Ean13::forProduct(1, 91));
        $this->assertNotSame($code, Ean13::forProduct(2, 90));
    }

    public function test_endpoint_returns_valid_ean13_svg(): void
    {
        $product = Product::factory()->create(['business_id' => $this->business->id, 'name' => 'Test Bars']);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/products/{$product->id}/barcode");

        $response->assertOk();

        $payload = $response->json();
        $this->assertIsString($payload['barcode']);
        $this->assertIsString($payload['svg']);
        $this->assertSame(13, strlen($payload['barcode']));
        $this->assertTrue(Ean13::isValid($payload['barcode']));
        $this->assertStringContainsString('<svg', $payload['svg']);
        $this->assertStringNotContainsString('Test Bars', $payload['svg']);
        $textOnly = trim(strip_tags($payload['svg']));
        $this->assertMatchesRegularExpression('/^[\d\s]+$/', $textOnly);

        // Same product always yields the same barcode.
        $again = $this->actingAs($this->owner)->getJson("/api/products/{$product->id}/barcode");
        $this->assertSame($payload['barcode'], $again->json('barcode'));
    }

    public function test_manual_barcode_field_is_honoured_when_valid(): void
    {
        $product = Product::factory()->create([
            'business_id' => $this->business->id,
            'barcode' => '590123412345',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/products/{$product->id}/barcode");

        $response->assertOk();
        // 12-digit manual value gets its check digit appended.
        $this->assertSame('5901234123457', $response->json('barcode'));
    }

    public function test_unrelated_user_is_rejected(): void
    {
        $product = Product::factory()->create(['business_id' => $this->business->id]);
        $outsider = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);

        $this->actingAs($outsider)
            ->getJson("/api/products/{$product->id}/barcode")
            ->assertForbidden();
    }
}