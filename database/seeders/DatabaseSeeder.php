<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Business;
use App\Models\BusinessCapital;
use App\Models\Category;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\CreditSale;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\HrDepartment;
use App\Models\HrEmployee;
use App\Models\Attendance;
use App\Models\LeaveType;
use App\Models\LeaveRequest;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\CostCenter;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Currency;
use App\Models\ExchangeRate;
use App\Models\FiscalYear;
use App\Models\FiscalPeriod;
use App\Models\FixedAsset;
use App\Models\DepreciationEntry;
use App\Models\TaxRate;
use App\Models\Subscription;
use App\Models\UserNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    private int $bid;
    private int $ownerId;
    private int $adminId;
    private int $processedById;

    public function run(): void
    {
        $this->seedUsers();
        $this->seedCurrencies();
        $this->seedChartOfAccounts();
        $this->seedCostCenters();
        $this->seedFiscalPeriods();
        $this->seedCategories();
        $this->seedProducts();
        $this->seedCustomers();
        $this->seedEmployees();
        $this->seedHrModule();
        $this->seedSuppliers();
        $this->seedPurchaseOrders();
        $this->seedOrders();
        $this->seedExpenses();
        $this->seedCreditSales();
        $this->seedLoans();
        $this->seedInvoices();
        $this->seedBills();
        $this->seedBankAccounts();
        $this->seedFixedAssets();
        $this->seedJournalEntries();
        $this->seedSubscriptions();
        $this->seedNotifications();
    }

    private function seedUsers(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@m-tai.com'],
            [
                'name' => 'Msimamizi',
                'phone' => '0700000000',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'user_code' => 'ADMIN-000001',
                'is_active' => true,
                'is_verified' => true,
            ]
        );
        $this->adminId = $admin->id;

        $owner = User::firstOrCreate(
            ['email' => 'juma@m-tai.com'],
            [
                'name' => 'Juma Mwangani',
                'phone' => '0712345678',
                'password' => Hash::make('password'),
                'role' => 'business_owner',
                'user_code' => 'CTVK-000001',
                'location' => 'Kariakoo, Ilala',
                'street' => 'Kenyatta Road',
                'is_active' => true,
                'is_verified' => true,
            ]
        );
        $this->ownerId = $owner->id;

        User::firstOrCreate(
            ['email' => 'amina@m-tai.com'],
            [
                'name' => 'Amina Juma',
                'phone' => '0787654321',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'user_code' => 'CTVK-000002',
                'is_active' => true,
                'is_verified' => true,
            ]
        );

        $business = Business::firstOrCreate(
            ['user_id' => $owner->id],
            [
                'business_name' => 'Juma Supermarket',
                'business_code' => 'Ilala-00001',
                'business_type' => 'Supermarket',
                'business_category' => 'Groceries & Retail',
                'region' => 'Dar es Salaam',
                'district' => 'Ilala',
                'ward' => 'Kariakoo',
                'street' => 'Mkunguni Street',
                'road' => 'Bandar Rd',
                'payment_code' => 'JUMA-001',
                'bank_account_number' => '0123456789012',
                'opening_capital' => 50000000,
                'status' => 'active',
                'is_published' => true,
                'working_days' => ['monday','tuesday','wednesday','thursday','friday','saturday'],
                'working_hours' => ['open' => '07:00', 'close' => '21:00'],
            ]
        );
        $this->bid = $business->id;
        $this->processedById = $owner->id;

        BusinessCapital::firstOrCreate(
            ['business_id' => $this->bid],
            [
                'capital_amount' => 50000000,
                'source' => 'personal_savings',
                'designation' => 'Initial capital for supermarket setup including inventory, fixtures and first month rent',
                'registration_date' => '2024-01-15',
            ]
        );
    }

    private function seedCurrencies(): void
    {
        Currency::firstOrCreate(['code' => 'TZS'], [
            'name' => 'Tanzanian Shilling',
            'symbol' => 'TZS',
            'decimal_places' => 0,
            'is_base' => true,
            'is_active' => true,
        ]);
        Currency::firstOrCreate(['code' => 'USD'], [
            'name' => 'US Dollar',
            'symbol' => '$',
            'decimal_places' => 2,
            'is_base' => false,
            'is_active' => true,
        ]);
        Currency::firstOrCreate(['code' => 'KES'], [
            'name' => 'Kenyan Shilling',
            'symbol' => 'KES',
            'decimal_places' => 2,
            'is_base' => false,
            'is_active' => true,
        ]);

        ExchangeRate::firstOrCreate(
            ['business_id' => $this->bid, 'from_currency' => 'USD', 'to_currency' => 'TZS', 'effective_date' => '2026-01-01'],
            ['rate' => 2515.00000000, 'is_active' => true]
        );
        ExchangeRate::firstOrCreate(
            ['business_id' => $this->bid, 'from_currency' => 'KES', 'to_currency' => 'TZS', 'effective_date' => '2026-01-01'],
            ['rate' => 19.50000000, 'is_active' => true]
        );
    }

    private function seedChartOfAccounts(): void
    {
        $accounts = [
            ['code' => '1000', 'name' => 'Assets', 'type' => 'asset', 'sub_type' => null, 'is_system' => true],
            ['code' => '1100', 'name' => 'Current Assets', 'type' => 'asset', 'sub_type' => 'current_asset', 'parent_code' => '1000', 'is_system' => true],
            ['code' => '1110', 'name' => 'Cash and Cash Equivalents', 'type' => 'asset', 'sub_type' => 'cash', 'parent_code' => '1100'],
            ['code' => '1111', 'name' => 'Petty Cash', 'type' => 'asset', 'sub_type' => 'cash', 'parent_code' => '1110', 'opening_balance' => 500000],
            ['code' => '1120', 'name' => 'Bank Accounts', 'type' => 'asset', 'sub_type' => 'bank', 'parent_code' => '1100', 'is_bank_account' => true, 'opening_balance' => 12500000],
            ['code' => '1130', 'name' => 'Accounts Receivable', 'type' => 'asset', 'sub_type' => 'receivable', 'parent_code' => '1100', 'opening_balance' => 3200000],
            ['code' => '1200', 'name' => 'Inventory', 'type' => 'asset', 'sub_type' => 'inventory', 'parent_code' => '1000', 'opening_balance' => 18500000],
            ['code' => '1300', 'name' => 'Fixed Assets', 'type' => 'asset', 'sub_type' => 'fixed_asset', 'parent_code' => '1000'],
            ['code' => '1310', 'name' => 'Property & Equipment', 'type' => 'asset', 'sub_type' => 'fixed_asset', 'parent_code' => '1300', 'opening_balance' => 35000000],
            ['code' => '1320', 'name' => 'Accumulated Depreciation', 'type' => 'asset', 'sub_type' => 'contra_asset', 'parent_code' => '1300', 'opening_balance' => -5250000],

            ['code' => '2000', 'name' => 'Liabilities', 'type' => 'liability', 'sub_type' => null, 'is_system' => true],
            ['code' => '2100', 'name' => 'Current Liabilities', 'type' => 'liability', 'sub_type' => 'current_liability', 'parent_code' => '2000'],
            ['code' => '2110', 'name' => 'Accounts Payable', 'type' => 'liability', 'sub_type' => 'payable', 'parent_code' => '2100', 'opening_balance' => 4800000],
            ['code' => '2120', 'name' => 'Tax Payable (VAT)', 'type' => 'liability', 'sub_type' => 'tax', 'parent_code' => '2100', 'opening_balance' => 850000],
            ['code' => '2130', 'name' => 'Salaries Payable', 'type' => 'liability', 'sub_type' => 'payable', 'parent_code' => '2100'],
            ['code' => '2200', 'name' => 'Long-term Liabilities', 'type' => 'liability', 'sub_type' => 'long_term', 'parent_code' => '2000'],
            ['code' => '2210', 'name' => 'Bank Loans', 'type' => 'liability', 'sub_type' => 'loan', 'parent_code' => '2200', 'opening_balance' => 8000000],

            ['code' => '3000', 'name' => "Owner's Equity", 'type' => 'equity', 'sub_type' => 'equity', 'is_system' => true, 'opening_balance' => 50000000],
            ['code' => '3100', 'name' => 'Retained Earnings', 'type' => 'equity', 'sub_type' => 'retained_earnings', 'parent_code' => '3000', 'opening_balance' => 9350000],

            ['code' => '4000', 'name' => 'Revenue', 'type' => 'revenue', 'sub_type' => 'sales', 'is_system' => true],
            ['code' => '4100', 'name' => 'Sales Revenue', 'type' => 'revenue', 'sub_type' => 'sales', 'parent_code' => '4000'],
            ['code' => '4200', 'name' => 'Service Revenue', 'type' => 'revenue', 'sub_type' => 'service', 'parent_code' => '4000'],
            ['code' => '4300', 'name' => 'Other Income', 'type' => 'revenue', 'sub_type' => 'other', 'parent_code' => '4000'],

            ['code' => '5000', 'name' => 'Cost of Goods Sold', 'type' => 'expense', 'sub_type' => 'cogs', 'is_system' => true],
            ['code' => '5100', 'name' => 'Purchases', 'type' => 'expense', 'sub_type' => 'cogs', 'parent_code' => '5000'],
            ['code' => '5200', 'name' => 'Freight & Delivery', 'type' => 'expense', 'sub_type' => 'cogs', 'parent_code' => '5000'],

            ['code' => '6000', 'name' => 'Operating Expenses', 'type' => 'expense', 'sub_type' => 'operating', 'is_system' => true],
            ['code' => '6100', 'name' => 'Rent', 'type' => 'expense', 'sub_type' => 'rent', 'parent_code' => '6000'],
            ['code' => '6200', 'name' => 'Salaries & Wages', 'type' => 'expense', 'sub_type' => 'salary', 'parent_code' => '6000'],
            ['code' => '6300', 'name' => 'Utilities', 'type' => 'expense', 'sub_type' => 'utility', 'parent_code' => '6000'],
            ['code' => '6310', 'name' => 'Electricity', 'type' => 'expense', 'sub_type' => 'utility', 'parent_code' => '6300'],
            ['code' => '6320', 'name' => 'Water', 'type' => 'expense', 'sub_type' => 'utility', 'parent_code' => '6300'],
            ['code' => '6330', 'name' => 'Internet & Phone', 'type' => 'expense', 'sub_type' => 'utility', 'parent_code' => '6300'],
            ['code' => '6400', 'name' => 'Marketing & Advertising', 'type' => 'expense', 'sub_type' => 'marketing', 'parent_code' => '6000'],
            ['code' => '6500', 'name' => 'Office Supplies', 'type' => 'expense', 'sub_type' => 'supplies', 'parent_code' => '6000'],
            ['code' => '6600', 'name' => 'Maintenance & Repairs', 'type' => 'expense', 'sub_type' => 'maintenance', 'parent_code' => '6000'],
            ['code' => '6700', 'name' => 'Insurance', 'type' => 'expense', 'sub_type' => 'insurance', 'parent_code' => '6000'],
            ['code' => '6800', 'name' => 'Depreciation Expense', 'type' => 'expense', 'sub_type' => 'depreciation', 'parent_code' => '6000'],
            ['code' => '6900', 'name' => 'Transport & Delivery', 'type' => 'expense', 'sub_type' => 'transport', 'parent_code' => '6000'],
        ];

        $created = [];
        foreach ($accounts as $acc) {
            $parentId = null;
            if (isset($acc['parent_code']) && isset($created[$acc['parent_code']])) {
                $parentId = $created[$acc['parent_code']];
            }
            unset($acc['parent_code']);
            $record = Account::firstOrCreate(
                ['business_id' => $this->bid, 'code' => $acc['code']],
                array_merge($acc, [
                    'business_id' => $this->bid,
                    'parent_id' => $parentId,
                    'is_active' => true,
                    'currency' => 'TZS',
                    'sort_order' => (int)$acc['code'],
                    'opening_balance' => $acc['opening_balance'] ?? 0,
                ])
            );
            $created[$acc['code']] = $record->id;
        }
    }

    private function seedCostCenters(): void
    {
        $centers = [
            ['code' => 'CC-MAIN', 'name' => 'Main Store (Kariakoo)', 'budget_amount' => 20000000],
            ['code' => 'CC-DELIVERY', 'name' => 'Delivery Operations', 'budget_amount' => 3000000],
            ['code' => 'CC-ADMIN', 'name' => 'Administration', 'budget_amount' => 5000000],
            ['code' => 'CC-MARKETING', 'name' => 'Marketing & Promotions', 'budget_amount' => 2000000],
        ];
        foreach ($centers as $c) {
            CostCenter::firstOrCreate(
                ['business_id' => $this->bid, 'code' => $c['code']],
                ['business_id' => $this->bid, 'name' => $c['name'], 'budget_amount' => $c['budget_amount'], 'is_active' => true]
            );
        }
    }

    private function seedFiscalPeriods(): void
    {
        $fy = FiscalYear::firstOrCreate(
            ['business_id' => $this->bid, 'name' => 'FY 2026'],
            ['business_id' => $this->bid, 'start_date' => '2026-01-01', 'end_date' => '2026-12-31', 'is_closed' => false]
        );

        $months = [
            ['name' => 'Jan 2026', 'start' => '2026-01-01', 'end' => '2026-01-31', 'status' => 'closed'],
            ['name' => 'Feb 2026', 'start' => '2026-02-01', 'end' => '2026-02-28', 'status' => 'closed'],
            ['name' => 'Mar 2026', 'start' => '2026-03-01', 'end' => '2026-03-31', 'status' => 'closed'],
            ['name' => 'Apr 2026', 'start' => '2026-04-01', 'end' => '2026-04-30', 'status' => 'closed'],
            ['name' => 'May 2026', 'start' => '2026-05-01', 'end' => '2026-05-31', 'status' => 'closed'],
            ['name' => 'Jun 2026', 'start' => '2026-06-01', 'end' => '2026-06-30', 'status' => 'closed'],
            ['name' => 'Jul 2026', 'start' => '2026-07-01', 'end' => '2026-07-31', 'status' => 'open'],
        ];
        foreach ($months as $m) {
            FiscalPeriod::firstOrCreate(
                ['business_id' => $this->bid, 'name' => $m['name']],
                [
                    'business_id' => $this->bid,
                    'start_date' => $m['start'],
                    'end_date' => $m['end'],
                    'status' => $m['status'],
                ]
            );
        }
    }

    private function seedCategories(): void
    {
        $cats = [
            'Food & Beverages' => ['Maize & Cereals', 'Cooking Oil & Spices', 'Beverages', 'Snacks & Confectionery', 'Dairy Products', 'Meat & Fish', 'Fruits & Vegetables'],
            'Household & Cleaning' => ['Detergents', 'Kitchen Supplies', 'Bathroom Supplies', 'Pest Control'],
            'Personal Care' => ['Hair Care', 'Skin Care', 'Oral Care', 'Baby Care'],
            'Electronics & Appliances' => ['Mobile Accessories', 'Small Appliances', 'Batteries & Lighting'],
            'Stationery & Office' => ['School Supplies', 'Office Supplies', 'Printing & Paper'],
            'Building Materials' => ['Paint & Primers', 'Plumbing', 'Electrical Supplies'],
            'Agriculture & Garden' => ['Seeds & Seedlings', 'Fertilizers', 'Garden Tools'],
        ];

        foreach ($cats as $parent => $children) {
            $slug = Str::slug($parent);
            $p = Category::firstOrCreate(
                ['business_id' => $this->bid, 'slug' => $slug],
                ['business_id' => $this->bid, 'name' => $parent, 'slug' => $slug]
            );
            foreach ($children as $child) {
                $cslug = Str::slug($child);
                Category::firstOrCreate(
                    ['business_id' => $this->bid, 'slug' => $cslug],
                    ['business_id' => $this->bid, 'name' => $child, 'slug' => $cslug, 'parent_id' => $p->id]
                );
            }
        }
    }

    private function seedProducts(): void
    {
        $catMap = Category::where('business_id', $this->bid)->pluck('id', 'name')->toArray();

        $products = [
            // Food & Beverages
            ['name' => 'Mahindi ya Kusaga (1kg)', 'buying' => 1200, 'selling' => 1500, 'qty' => 200, 'cat' => 'Maize & Cereals', 'unit' => 'kg'],
            ['name' => 'Mchele - Kiambe (5kg)', 'buying' => 8500, 'selling' => 10500, 'qty' => 80, 'cat' => 'Maize & Cereals', 'unit' => 'bag'],
            ['name' => 'Mchele - Basmati (2kg)', 'buying' => 6000, 'selling' => 7500, 'qty' => 60, 'cat' => 'Maize & Cereals', 'unit' => 'bag'],
            ['name' => 'Unga wa Ngano (1kg)', 'buying' => 1800, 'selling' => 2200, 'qty' => 150, 'cat' => 'Maize & Cereals', 'unit' => 'kg'],
            ['name' => 'Makumbusho Pasta (500g)', 'buying' => 1500, 'selling' => 2000, 'qty' => 200, 'cat' => 'Maize & Cereals', 'unit' => 'pack'],
            ['name' => 'Chapati Flour (2kg)', 'buying' => 3200, 'selling' => 4000, 'qty' => 120, 'cat' => 'Maize & Cereals', 'unit' => 'pack'],

            ['name' => 'Mafuta ya Kula - Elika (1L)', 'buying' => 4500, 'selling' => 5500, 'qty' => 100, 'cat' => 'Cooking Oil & Spices', 'unit' => 'bottle'],
            ['name' => 'Mafuta ya Kula - Exeter (500ml)', 'buying' => 2800, 'selling' => 3500, 'qty' => 120, 'cat' => 'Cooking Oil & Spices', 'unit' => 'bottle'],
            ['name' => 'Curry Powder (100g)', 'buying' => 800, 'selling' => 1200, 'qty' => 200, 'cat' => 'Cooking Oil & Spices', 'unit' => 'pack'],
            ['name' => 'Pilipili Manga (50g)', 'buying' => 500, 'selling' => 800, 'qty' => 250, 'cat' => 'Cooking Oil & Spices', 'unit' => 'pack'],
            ['name' => 'Chumvi - Jodari (1kg)', 'buying' => 600, 'selling' => 1000, 'qty' => 300, 'cat' => 'Cooking Oil & Spices', 'unit' => 'pack'],

            ['name' => 'Coca-Cola (1.5L)', 'buying' => 1800, 'selling' => 2500, 'qty' => 150, 'cat' => 'Beverages', 'unit' => 'bottle'],
            ['name' => 'Fanta Orange (1.5L)', 'buying' => 1800, 'selling' => 2500, 'qty' => 100, 'cat' => 'Beverages', 'unit' => 'bottle'],
            ['name' => 'Duka Maziwa UHT (1L)', 'buying' => 1500, 'selling' => 2000, 'qty' => 200, 'cat' => 'Beverages', 'unit' => 'pack'],
            ['name' => 'Mtinda (500ml)', 'buying' => 800, 'selling' => 1200, 'qty' => 300, 'cat' => 'Beverages', 'unit' => 'bottle'],
            ['name' => 'Kahawa ya Nescafe (200g)', 'buying' => 12000, 'selling' => 15000, 'qty' => 40, 'cat' => 'Beverages', 'unit' => 'jar'],
            ['name' => 'Maji ya Bonite (1.5L)', 'buying' => 300, 'selling' => 500, 'qty' => 500, 'cat' => 'Beverages', 'unit' => 'bottle'],

            ['name' => 'Biskuti - Britannia (200g)', 'buying' => 1200, 'selling' => 1500, 'qty' => 150, 'cat' => 'Snacks & Confectionery', 'unit' => 'pack'],
            ['name' => 'Chocolate - Cadbury (100g)', 'buying' => 2500, 'selling' => 3500, 'qty' => 80, 'cat' => 'Snacks & Confectionery', 'unit' => 'bar'],
            ['name' => 'Chips Fiki (50g)', 'buying' => 500, 'selling' => 800, 'qty' => 300, 'cat' => 'Snacks & Confectionery', 'unit' => 'pack'],
            ['name' => 'Kashata (1 piece)', 'buying' => 200, 'selling' => 500, 'qty' => 200, 'cat' => 'Snacks & Confectionery', 'unit' => 'piece'],

            ['name' => 'Maziwa Freshi (500ml)', 'buying' => 1200, 'selling' => 1500, 'qty' => 100, 'cat' => 'Dairy Products', 'unit' => 'bottle'],
            ['name' => 'Yoghurt - Illo (200ml)', 'buying' => 800, 'selling' => 1200, 'qty' => 150, 'cat' => 'Dairy Products', 'unit' => 'bottle'],
            ['name' => 'Blue Band (500g)', 'buying' => 2500, 'selling' => 3200, 'qty' => 100, 'cat' => 'Dairy Products', 'unit' => 'tub'],

            ['name' => 'Nyama ya Ng\'ombe (1kg)', 'buying' => 12000, 'selling' => 15000, 'qty' => 30, 'cat' => 'Meat & Fish', 'unit' => 'kg'],
            ['name' => 'Samaki wa Mwanja (1kg)', 'buying' => 8000, 'selling' => 10000, 'qty' => 25, 'cat' => 'Meat & Fish', 'unit' => 'kg'],
            ['name' => 'Kuku mzima', 'buying' => 6000, 'selling' => 8500, 'qty' => 40, 'cat' => 'Meat & Fish', 'unit' => 'piece'],

            ['name' => 'Ndizi (1 bunch)', 'buying' => 1500, 'selling' => 2500, 'qty' => 50, 'cat' => 'Fruits & Vegetables', 'unit' => 'bunch'],
            ['name' => 'Embe (1kg)', 'buying' => 2000, 'selling' => 3000, 'qty' => 40, 'cat' => 'Fruits & Vegetables', 'unit' => 'kg'],
            ['name' => 'Kitunguu (1kg)', 'buying' => 1500, 'selling' => 2500, 'qty' => 60, 'cat' => 'Fruits & Vegetables', 'unit' => 'kg'],
            ['name' => 'Nyanya (1kg)', 'buying' => 1200, 'selling' => 2000, 'qty' => 80, 'cat' => 'Fruits & Vegetables', 'unit' => 'kg'],
            ['name' => 'Viazi (1kg)', 'buying' => 1000, 'selling' => 1500, 'qty' => 100, 'cat' => 'Fruits & Vegetables', 'unit' => 'kg'],

            // Household & Cleaning
            ['name' => 'Omo Detergent (500g)', 'buying' => 1500, 'selling' => 2000, 'qty' => 200, 'cat' => 'Detergents', 'unit' => 'pack'],
            ['name' => 'Superfoil Sabuni (500ml)', 'buying' => 2000, 'selling' => 2800, 'qty' => 150, 'cat' => 'Detergents', 'unit' => 'bottle'],
            ['name' => 'Vimto Soap Bar (3-pack)', 'buying' => 1800, 'selling' => 2500, 'qty' => 120, 'cat' => 'Detergents', 'unit' => 'pack'],
            ['name' => 'Toilet Cleaner Harpic (500ml)', 'buying' => 2500, 'selling' => 3500, 'qty' => 80, 'cat' => 'Bathroom Supplies', 'unit' => 'bottle'],
            ['name' => 'Mwiko wa Kiswahili (1pc)', 'buying' => 3000, 'selling' => 4500, 'qty' => 60, 'cat' => 'Kitchen Supplies', 'unit' => 'piece'],

            // Personal Care
            ['name' => 'Shampoo - Pantene (200ml)', 'buying' => 3500, 'selling' => 5000, 'qty' => 80, 'cat' => 'Hair Care', 'unit' => 'bottle'],
            ['name' => 'Vaseline Petroleum Jelly (100ml)', 'buying' => 1500, 'selling' => 2200, 'qty' => 100, 'cat' => 'Skin Care', 'unit' => 'jar'],
            ['name' => 'Colgate Toothpaste (100ml)', 'buying' => 1800, 'selling' => 2500, 'qty' => 150, 'cat' => 'Oral Care', 'unit' => 'tube'],
            ['name' => 'Pampers Diapers (M)', 'buying' => 8000, 'selling' => 11000, 'qty' => 50, 'cat' => 'Baby Care', 'unit' => 'pack'],

            // Electronics
            ['name' => 'Charger Cable USB-C (1m)', 'buying' => 2000, 'selling' => 4000, 'qty' => 100, 'cat' => 'Mobile Accessories', 'unit' => 'piece'],
            ['name' => 'Earphones In-Ear', 'buying' => 1500, 'selling' => 3500, 'qty' => 80, 'cat' => 'Mobile Accessories', 'unit' => 'piece'],
            ['name' => 'Batteries AA (4-pack)', 'buying' => 2000, 'selling' => 3000, 'qty' => 150, 'cat' => 'Batteries & Lighting', 'unit' => 'pack'],
            ['name' => 'LED Bulb 12W', 'buying' => 3000, 'selling' => 5000, 'qty' => 60, 'cat' => 'Batteries & Lighting', 'unit' => 'piece'],
            ['name' => 'Electric Kettle (1.5L)', 'buying' => 15000, 'selling' => 22000, 'qty' => 20, 'cat' => 'Small Appliances', 'unit' => 'piece'],

            // Stationery
            ['name' => 'Exercise Book 48p', 'buying' => 400, 'selling' => 800, 'qty' => 500, 'cat' => 'School Supplies', 'unit' => 'book'],
            ['name' => 'Bic Pens (10-pack)', 'buying' => 1000, 'selling' => 1500, 'qty' => 300, 'cat' => 'School Supplies', 'unit' => 'pack'],
            ['name' => 'A4 Paper - Star (500 sheets)', 'buying' => 8000, 'selling' => 11000, 'qty' => 50, 'cat' => 'Office Supplies', 'unit' => 'ream'],
            ['name' => 'Pencil HB (12-pack)', 'buying' => 800, 'selling' => 1200, 'qty' => 200, 'cat' => 'School Supplies', 'unit' => 'pack'],

            // Agriculture
            ['name' => 'Fertilizer NPK (5kg)', 'buying' => 8000, 'selling' => 12000, 'qty' => 40, 'cat' => 'Fertilizers', 'unit' => 'bag'],
            ['name' => 'Mbahasia (1kg)', 'buying' => 5000, 'selling' => 8000, 'qty' => 30, 'cat' => 'Seeds & Seedlings', 'unit' => 'pack'],
            ['name' => 'Jembe Standard', 'buying' => 6000, 'selling' => 9000, 'qty' => 25, 'cat' => 'Garden Tools', 'unit' => 'piece'],
        ];

        foreach ($products as $p) {
            $catId = $catMap[$p['cat']] ?? null;
            $slug = Str::slug($p['name']);
            Product::firstOrCreate(
                ['business_id' => $this->bid, 'slug' => $slug],
                [
                    'business_id' => $this->bid,
                    'category_id' => $catId,
                    'name' => $p['name'],
                    'slug' => $slug,
                    'buying_price' => $p['buying'],
                    'selling_price' => $p['selling'],
                    'wholesale_price' => $p['buying'] * 0.9,
                    'retail_price' => $p['selling'],
                    'quantity' => $p['qty'],
                    'unit' => $p['unit'],
                    'is_published' => true,
                    'is_draft' => false,
                    'description' => $p['name'] . ' - Quality product available at Juma Supermarket',
                ]
            );
        }
    }

    private function seedCustomers(): void
    {
        $customers = [
            ['full_name' => 'Hassan Mwinyi', 'phone' => '0754123456', 'location' => 'Kariakoo'],
            ['full_name' => 'Rehema Kimaro', 'phone' => '0767234567', 'location' => 'Buguruni'],
            ['full_name' => 'Abdul Rahman', 'phone' => '0745345678', 'location' => 'Kigogo'],
            ['full_name' => 'Fatima Omari', 'phone' => '0786456789', 'location' => 'Temeke'],
            ['full_name' => 'Ibrahim Mushi', 'phone' => '0713567890', 'location' => 'Manzese'],
            ['full_name' => 'Neema Kileo', 'phone' => '0778678901', 'location' => 'Mikocheni'],
            ['full_name' => 'Jabari Lwanga', 'phone' => '0724789012', 'location' => 'Sinza'],
            ['full_name' => 'Zainabu Issa', 'phone' => '0756890123', 'location' => 'Tabata'],
            ['full_name' => 'Omary Charles', 'phone' => '0789901234', 'location' => 'Upanga'],
            ['full_name' => 'Asha Mkwizu', 'phone' => '0745012345', 'location' => 'Ilala'],
            ['full_name' => 'Mwanahamisi Mwaipopo', 'phone' => '0761123456', 'location' => 'Kinondoni'],
            ['full_name' => 'Salum Bakari', 'phone' => '0732234567', 'location' => 'Magomeni'],
            ['full_name' => 'Amina Bakari', 'phone' => '0783345678', 'location' => 'Mwananyamala'],
            ['full_name' => 'Baraka Nguvumali', 'phone' => '0714456789', 'location' => 'Mburahati'],
            ['full_name' => 'Zawadi Mponzi', 'phone' => '0775567890', 'location' => 'Mikocheni B'],
            ['full_name' => 'Hamisi Juma', 'phone' => '0746678901', 'location' => 'Kigamboni'],
            ['full_name' => 'Safiya Athumani', 'phone' => '0787789012', 'location' => 'Vingunguti'],
            ['full_name' => 'Emmanuel Shirima', 'phone' => '0728890123', 'location' => 'Mabibo'],
            ['full_name' => 'Hawa Mkwase', 'phone' => '0759901234', 'location' => 'Makuburi'],
            ['full_name' => 'Issa Mwangula', 'phone' => '0731012345', 'location' => 'Kisiwani'],
        ];

        foreach ($customers as $i => $c) {
            Customer::firstOrCreate(
                ['business_id' => $this->bid, 'phone' => $c['phone']],
                [
                    'business_id' => $this->bid,
                    'customer_code' => 'CTM-' . str_pad($i + 1, 6, '0', STR_PAD_LEFT),
                    'full_name' => $c['full_name'],
                    'phone' => $c['phone'],
                    'location' => $c['location'],
                    'is_guest' => false,
                ]
            );
        }
    }

    private function seedEmployees(): void
    {
        $employees = [
            ['name' => 'Joseph Mwakasege', 'phone' => '0712111222', 'position' => 'cashier', 'salary' => 350000],
            ['name' => 'Mary Mathias', 'phone' => '0713333444', 'position' => 'storekeeper', 'salary' => 400000],
            ['name' => 'Peter Mwanza', 'phone' => '0714555666', 'position' => 'manager', 'salary' => 650000],
            ['name' => 'Esther Kimaro', 'phone' => '0715777888', 'position' => 'cashier', 'salary' => 350000],
            ['name' => 'Deogratius Mwamba', 'phone' => '0716999000', 'position' => 'delivery_officer', 'salary' => 300000],
        ];

        foreach ($employees as $e) {
            Employee::firstOrCreate(
                ['business_id' => $this->bid, 'phone' => $e['phone']],
                [
                    'business_id' => $this->bid,
                    'name' => $e['name'],
                    'phone' => $e['phone'],
                    'position' => $e['position'],
                    'salary' => $e['salary'],
                    'is_active' => true,
                ]
            );
        }
    }

    private function seedHrModule(): void
    {
        $depts = [
            ['name' => 'Sales & Customer Service', 'description' => 'Handles all customer interactions and sales operations'],
            ['name' => 'Warehouse & Inventory', 'description' => 'Manages stock, receiving, and storage'],
            ['name' => 'Finance & Accounting', 'description' => 'Handles bookkeeping, payments, and financial reporting'],
            ['name' => 'Delivery & Logistics', 'description' => 'Manages deliveries and transportation'],
            ['name' => 'Administration', 'description' => 'General management and HR functions'],
        ];

        $deptIds = [];
        foreach ($depts as $d) {
            $dept = HrDepartment::firstOrCreate(
                ['business_id' => $this->bid, 'name' => $d['name']],
                ['business_id' => $this->bid, 'description' => $d['description'], 'is_active' => true]
            );
            $deptIds[$d['name']] = $dept->id;
        }

        $hrEmps = [
            ['first_name' => 'Peter', 'last_name' => 'Mwanza', 'email' => 'peter@m-tai.com', 'phone' => '0712345001', 'position' => 'General Manager', 'dept' => 'Administration', 'salary' => 1200000, 'type' => 'full_time', 'hire' => '2024-02-01'],
            ['first_name' => 'Asha', 'last_name' => 'Abdul', 'email' => 'asha@m-tai.com', 'phone' => '0712345002', 'position' => 'Finance Manager', 'dept' => 'Finance & Accounting', 'salary' => 900000, 'type' => 'full_time', 'hire' => '2024-02-01'],
            ['first_name' => 'Joseph', 'last_name' => 'Mwakasege', 'email' => 'joseph@m-tai.com', 'phone' => '0712345003', 'position' => 'Senior Cashier', 'dept' => 'Sales & Customer Service', 'salary' => 450000, 'type' => 'full_time', 'hire' => '2024-03-15'],
            ['first_name' => 'Mary', 'last_name' => 'Mathias', 'email' => 'mary@m-tai.com', 'phone' => '0712345004', 'position' => 'Warehouse Supervisor', 'dept' => 'Warehouse & Inventory', 'salary' => 500000, 'type' => 'full_time', 'hire' => '2024-03-15'],
            ['first_name' => 'Esther', 'last_name' => 'Kimaro', 'email' => 'esther@m-tai.com', 'phone' => '0712345005', 'position' => 'Cashier', 'dept' => 'Sales & Customer Service', 'salary' => 350000, 'type' => 'full_time', 'hire' => '2024-06-01'],
            ['first_name' => 'Deogratius', 'last_name' => 'Mwamba', 'email' => 'deo@m-tai.com', 'phone' => '0712345006', 'position' => 'Delivery Supervisor', 'dept' => 'Delivery & Logistics', 'salary' => 400000, 'type' => 'full_time', 'hire' => '2024-04-01'],
            ['first_name' => 'Hamisi', 'last_name' => 'Komba', 'email' => 'hamisi@m-tai.com', 'phone' => '0712345007', 'position' => 'Store Assistant', 'dept' => 'Warehouse & Inventory', 'salary' => 300000, 'type' => 'full_time', 'hire' => '2024-07-01'],
            ['first_name' => 'Rehema', 'last_name' => 'Nkya', 'email' => 'rehema@m-tai.com', 'phone' => '0712345008', 'position' => 'Accountant', 'dept' => 'Finance & Accounting', 'salary' => 600000, 'type' => 'full_time', 'hire' => '2024-05-01'],
            ['first_name' => 'Baraka', 'last_name' => 'Fredrick', 'email' => 'baraka@m-tai.com', 'phone' => '0712345009', 'position' => 'Delivery Driver', 'dept' => 'Delivery & Logistics', 'salary' => 350000, 'type' => 'full_time', 'hire' => '2024-08-01'],
            ['first_name' => 'Zawadi', 'last_name' => 'Augustine', 'email' => 'zawadi@m-tai.com', 'phone' => '0712345010', 'position' => 'Sales Assistant', 'dept' => 'Sales & Customer Service', 'salary' => 300000, 'type' => 'part_time', 'hire' => '2025-01-15'],
        ];

        $empIds = [];
        foreach ($hrEmps as $e) {
            $emp = HrEmployee::firstOrCreate(
                ['business_id' => $this->bid, 'email' => $e['email']],
                [
                    'business_id' => $this->bid,
                    'department_id' => $deptIds[$e['dept']],
                    'employee_number' => 'EMP-' . str_pad(count($empIds) + 1, 4, '0', STR_PAD_LEFT),
                    'first_name' => $e['first_name'],
                    'last_name' => $e['last_name'],
                    'email' => $e['email'],
                    'phone' => $e['phone'],
                    'position' => $e['position'],
                    'employment_type' => $e['type'],
                    'hire_date' => $e['hire'],
                    'base_salary' => $e['salary'],
                    'salary_type' => 'monthly',
                    'bank_name' => 'CRDB Bank',
                    'bank_account_number' => '01' . str_pad(count($empIds) + 1, 10, '0', STR_PAD_LEFT),
                    'status' => 'active',
                ]
            );
            $empIds[] = $emp->id;
        }

        // Set department managers
        HrDepartment::where('business_id', $this->bid)->where('name', 'Administration')->update(['manager_id' => $empIds[0]]);
        HrDepartment::where('business_id', $this->bid)->where('name', 'Finance & Accounting')->update(['manager_id' => $empIds[1]]);
        HrDepartment::where('business_id', $this->bid)->where('name', 'Sales & Customer Service')->update(['manager_id' => $empIds[2]]);

        // Leave types
        $leaveTypes = [
            ['name' => 'Annual Leave', 'days' => 21, 'paid' => true],
            ['name' => 'Sick Leave', 'days' => 14, 'paid' => true],
            ['name' => 'Maternity Leave', 'days' => 84, 'paid' => true],
            ['name' => 'Paternity Leave', 'days' => 7, 'paid' => true],
            ['name' => 'Compassionate Leave', 'days' => 5, 'paid' => false],
        ];
        foreach ($leaveTypes as $lt) {
            LeaveType::firstOrCreate(
                ['business_id' => $this->bid, 'name' => $lt['name']],
                ['business_id' => $this->bid, 'days_per_year' => $lt['days'], 'is_paid' => $lt['paid'], 'is_active' => true]
            );
        }

        // Attendance for current month (July 2026)
        $statuses = ['present', 'present', 'present', 'present', 'late', 'present', 'present', 'half_day', 'present', 'present'];
        foreach ($empIds as $eid) {
            for ($day = 1; $day <= 25; $day++) {
                $date = "2026-07-" . str_pad($day, 2, '0', STR_PAD_LEFT);
                $dow = date('w', strtotime($date));
                if ($dow == 0 || $dow == 6) continue;

                $status = $statuses[array_rand($statuses)];
                $clockIn = $status === 'late' ? '08:30:00' : '07:50:00';
                $clockOut = $status === 'half_day' ? '13:00:00' : '17:00:00';
                $hours = $status === 'half_day' ? 5.0 : ($status === 'present' || $status === 'late' ? 8.0 + ($status === 'late' ? -0.5 : 0) : 0);

                Attendance::firstOrCreate(
                    ['employee_id' => $eid, 'date' => $date],
                    [
                        'clock_in' => $clockIn,
                        'clock_out' => $clockOut,
                        'hours_worked' => max($hours, 0),
                        'status' => $status,
                    ]
                );
            }
        }

        // Payroll for June 2026
        $payroll = Payroll::firstOrCreate(
            ['business_id' => $this->bid, 'name' => 'June 2026 Payroll'],
            [
                'business_id' => $this->bid,
                'period_start' => '2026-06-01',
                'period_end' => '2026-06-30',
                'payment_date' => '2026-07-05',
                'status' => 'paid',
                'total_gross' => 5100000,
                'total_deductions' => 765000,
                'total_net' => 4335000,
            ]
        );

        foreach ($empIds as $eid) {
            $emp = HrEmployee::find($eid);
            if (!$emp) continue;
            PayrollItem::firstOrCreate(
                ['payroll_id' => $payroll->id, 'employee_id' => $eid],
                [
                    'base_salary' => $emp->base_salary,
                    'allowances' => $emp->base_salary * 0.15,
                    'tax_deduction' => $emp->base_salary * 0.15,
                    'net_pay' => $emp->base_salary + ($emp->base_salary * 0.15) - ($emp->base_salary * 0.15),
                    'status' => 'paid',
                ]
            );
        }
    }

    private function seedSuppliers(): void
    {
        $suppliers = [
            ['name' => 'Tanzania Distilleries Ltd', 'contact' => 'Mr. Kimaro', 'phone' => '0222110000', 'city' => 'Dar es Salaam', 'credit' => 50000000, 'terms' => 'net_30'],
            ['name' => 'Bidco Africa Tanzania', 'contact' => 'Ms. Nyerere', 'phone' => '0222860000', 'city' => 'Dar es Salaam', 'credit' => 30000000, 'terms' => 'net_30'],
            ['name' => 'MURZAH Group', 'contact' => 'Mr. Murzah', 'phone' => '0222772000', 'city' => 'Dar es Salaam', 'credit' => 40000000, 'terms' => 'net_15'],
            ['name' => 'Kilombero Sugar Company', 'contact' => 'Mr. Mhagama', 'phone' => '0232602000', 'city' => 'Morogoro', 'credit' => 25000000, 'terms' => 'net_30'],
            ['name' => 'Tasco Distributors', 'contact' => 'Ms. Juma', 'phone' => '0222123456', 'city' => 'Dar es Salaam', 'credit' => 20000000, 'terms' => 'net_15'],
            ['name' => 'Coca-Cola Kwanza Ltd', 'contact' => 'Mr. Mwakasegela', 'phone' => '0222330000', 'city' => 'Dar es Salaam', 'credit' => 60000000, 'terms' => 'net_30'],
            ['name' => 'Brooke Bond (Unilever)', 'contact' => 'Ms. Omary', 'phone' => '0222775000', 'city' => 'Dar es Salaam', 'credit' => 35000000, 'terms' => 'net_30'],
            ['name' => 'TCC Ltd (Tanzania Cigarettes)', 'contact' => 'Mr. Lwakayamba', 'phone' => '0222780000', 'city' => 'Dar es Salaam', 'credit' => 15000000, 'terms' => 'net_15'],
        ];

        $supIds = [];
        foreach ($suppliers as $i => $s) {
            $sup = Supplier::firstOrCreate(
                ['business_id' => $this->bid, 'name' => $s['name']],
                [
                    'business_id' => $this->bid,
                    'code' => 'SUP-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'contact_person' => $s['contact'],
                    'email' => strtolower(str_replace(' ', '.', $s['contact'])) . '@' . strtolower(str_replace([' ', '(', ')', '-'], ['', '', '', ''], $s['name'])) . '.co.tz',
                    'phone' => $s['phone'],
                    'address' => 'Industrial Area',
                    'city' => $s['city'],
                    'country' => 'Tanzania',
                    'payment_terms' => $s['terms'],
                    'credit_limit' => $s['credit'],
                    'currency' => 'TZS',
                    'rating' => 4.0 + (mt_rand(0, 10) / 10),
                    'preferred_payment_method' => 'bank_transfer',
                    'is_active' => true,
                ]
            );
            $supIds[] = $sup->id;
        }
    }

    private function seedPurchaseOrders(): void
    {
        $supIds = Supplier::where('business_id', $this->bid)->pluck('id')->toArray();
        $prods = Product::where('business_id', $this->bid)->get();
        if (empty($supIds) || $prods->isEmpty()) return;

        $statuses = ['received', 'received', 'received', 'partially_received', 'confirmed', 'draft'];

        for ($i = 0; $i < 8; $i++) {
            $supId = $supIds[array_rand($supIds)];
            $status = $statuses[$i % count($statuses)];
            $orderDate = '2026-' . str_pad(max(1, 7 - $i), 2, '0', STR_PAD_LEFT) . '-' . str_pad(mt_rand(1, 28), 2, '0', STR_PAD_LEFT);

            $po = PurchaseOrder::firstOrCreate(
                ['business_id' => $this->bid, 'po_number' => 'PO-2026-' . str_pad($i + 1, 5, '0', STR_PAD_LEFT)],
                [
                    'business_id' => $this->bid,
                    'supplier_id' => $supId,
                    'po_number' => 'PO-2026-' . str_pad($i + 1, 5, '0', STR_PAD_LEFT),
                    'status' => $status,
                    'approval_status' => in_array($status, ['received', 'partially_received', 'confirmed']) ? 'approved' : 'pending',
                    'order_date' => $orderDate,
                    'expected_date' => date('Y-m-d', strtotime($orderDate . ' +7 days')),
                    'subtotal' => 0,
                    'total' => 0,
                    'amount_paid' => $status === 'received' ? mt_rand(500000, 2000000) : 0,
                    'payment_status' => $status === 'received' ? 'paid' : 'unpaid',
                    'created_by' => $this->processedById,
                ]
            );

            $subtotal = 0;
            $items = $prods->random(min(5, $prods->count()));
            foreach ($items as $prod) {
                $qty = mt_rand(10, 100);
                $unitPrice = $prod->buying_price;
                $lineTotal = $qty * $unitPrice;
                $received = $status === 'received' ? $qty : ($status === 'partially_received' ? (int)($qty * 0.6) : 0);

                PurchaseOrderItem::firstOrCreate(
                    ['purchase_order_id' => $po->id, 'product_id' => $prod->id],
                    [
                        'business_id' => $this->bid,
                        'purchase_order_id' => $po->id,
                        'product_id' => $prod->id,
                        'description' => $prod->name,
                        'quantity' => $qty,
                        'received_quantity' => $received,
                        'unit_price' => $unitPrice,
                        'subtotal' => $lineTotal,
                        'total' => $lineTotal,
                        'unit' => $prod->unit ?? 'piece',
                        'delivery_status' => $received >= $qty ? 'delivered' : 'pending',
                    ]
                );
                $subtotal += $lineTotal;
            }

            $tax = $subtotal * 0.18;
            $po->update(['subtotal' => $subtotal, 'tax_amount' => $tax, 'total' => $subtotal + $tax]);
        }
    }

    private function seedOrders(): void
    {
        $customers = Customer::where('business_id', $this->bid)->get();
        $prods = Product::where('business_id', $this->bid)->get();
        if ($customers->isEmpty() || $prods->isEmpty()) return;

        $statuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'pending', 'confirmed'];
        $payStatuses = ['paid', 'paid', 'paid', 'paid', 'partial', 'unpaid'];
        $payMethods = ['cash', 'mobile_money', 'mobile_money', 'bank_transfer', 'card'];

        for ($i = 0; $i < 50; $i++) {
            $cust = $customers->random();
            $status = $statuses[array_rand($statuses)];
            $payStatus = $payStatuses[array_rand($payStatuses)];
            $orderDate = '2026-' . str_pad(mt_rand(1, 7), 2, '0', STR_PAD_LEFT) . '-' . str_pad(mt_rand(1, 28), 2, '0', STR_PAD_LEFT);

            $subtotal = 0;
            $items = $prods->random(mt_rand(1, 6));
            $orderItems = [];
            foreach ($items as $prod) {
                $qty = mt_rand(1, 10);
                $lineTotal = $qty * $prod->selling_price;
                $orderItems[] = [
                    'product_id' => $prod->id,
                    'quantity' => $qty,
                    'unit_price' => $prod->selling_price,
                    'total_price' => $lineTotal,
                ];
                $subtotal += $lineTotal;
            }

            $discount = mt_rand(0, 1) ? $subtotal * 0.05 : 0;
            $tax = ($subtotal - $discount) * 0.18;
            $total = $subtotal - $discount + $tax;

            $order = Order::firstOrCreate(
                ['business_id' => $this->bid, 'transaction_code' => 'TXN-2026' . str_pad($i + 1, 5, '0', STR_PAD_LEFT)],
                [
                    'business_id' => $this->bid,
                    'customer_id' => $cust->id,
                    'transaction_code' => 'TXN-2026' . str_pad($i + 1, 5, '0', STR_PAD_LEFT),
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'total' => $total,
                    'status' => $status,
                    'payment_status' => $payStatus,
                    'processed_by' => $this->processedById,
                ]
            );

            foreach ($orderItems as $oi) {
                OrderItem::firstOrCreate(
                    ['order_id' => $order->id, 'product_id' => $oi['product_id']],
                    [
                        'order_id' => $order->id,
                        'product_id' => $oi['product_id'],
                        'quantity' => $oi['quantity'],
                        'unit_price' => $oi['unit_price'],
                        'total_price' => $oi['total_price'],
                    ]
                );
            }

            if ($payStatus !== 'unpaid') {
                Payment::firstOrCreate(
                    ['order_id' => $order->id],
                    [
                        'order_id' => $order->id,
                        'business_id' => $this->bid,
                        'amount' => $payStatus === 'paid' ? $total : $total * 0.5,
                        'method' => $payMethods[array_rand($payMethods)],
                        'reference_number' => 'REF-' . strtoupper(Str::random(8)),
                        'status' => 'confirmed',
                        'received_by' => $this->processedById,
                    ]
                );
            }
        }
    }

    private function seedExpenses(): void
    {
        $categories = ['rent', 'salaries', 'water', 'electricity', 'transport', 'maintenance', 'internet', 'security', 'other'];
        $descriptions = [
            'rent' => 'Kodi ya Mwezi Julai',
            'salaries' => 'Mishahara ya Wafanyakazi',
            'water' => 'Bili ya Maji - DAWASCO',
            'electricity' => 'Bili ya Umeme - TANESCO',
            'transport' => 'Gharama za Usafirishaji',
            'maintenance' => 'Matengenezo ya Duka',
            'internet' => 'Bili ya Internet - Vodacom',
            'security' => 'Usalama wa Duka',
            'other' => 'Gharama Nyingine',
        ];

        for ($m = 1; $m <= 7; $m++) {
            $month = str_pad($m, 2, '0', STR_PAD_LEFT);
            Expense::firstOrCreate(
                ['business_id' => $this->bid, 'category' => 'rent', 'date' => "2026-$month-01"],
                ['business_id' => $this->bid, 'category' => 'rent', 'description' => $descriptions['rent'], 'amount' => 1500000, 'type' => 'monthly', 'date' => "2026-$month-01", 'recorded_by' => $this->processedById]
            );
            Expense::firstOrCreate(
                ['business_id' => $this->bid, 'category' => 'salaries', 'date' => "2026-$month-05"],
                ['business_id' => $this->bid, 'category' => 'salaries', 'description' => $descriptions['salaries'], 'amount' => 5100000, 'type' => 'monthly', 'date' => "2026-$month-05", 'recorded_by' => $this->processedById]
            );
            Expense::firstOrCreate(
                ['business_id' => $this->bid, 'category' => 'water', 'date' => "2026-$month-10"],
                ['business_id' => $this->bid, 'category' => 'water', 'description' => $descriptions['water'], 'amount' => mt_rand(80000, 150000), 'type' => 'monthly', 'date' => "2026-$month-10", 'recorded_by' => $this->processedById]
            );
            Expense::firstOrCreate(
                ['business_id' => $this->bid, 'category' => 'electricity', 'date' => "2026-$month-12"],
                ['business_id' => $this->bid, 'category' => 'electricity', 'description' => $descriptions['electricity'], 'amount' => mt_rand(200000, 450000), 'type' => 'monthly', 'date' => "2026-$month-12", 'recorded_by' => $this->processedById]
            );
            Expense::firstOrCreate(
                ['business_id' => $this->bid, 'category' => 'security', 'date' => "2026-$month-01"],
                ['business_id' => $this->bid, 'category' => 'security', 'description' => $descriptions['security'], 'amount' => 300000, 'type' => 'monthly', 'date' => "2026-$month-01", 'recorded_by' => $this->processedById]
            );
            Expense::firstOrCreate(
                ['business_id' => $this->bid, 'category' => 'internet', 'date' => "2026-$month-01"],
                ['business_id' => $this->bid, 'category' => 'internet', 'description' => $descriptions['internet'], 'amount' => 150000, 'type' => 'monthly', 'date' => "2026-$month-01", 'recorded_by' => $this->processedById]
            );

            if (mt_rand(0, 1)) {
                Expense::firstOrCreate(
                    ['business_id' => $this->bid, 'category' => 'transport', 'date' => "2026-$month-" . str_pad(mt_rand(5, 25), 2, '0', STR_PAD_LEFT)],
                    ['business_id' => $this->bid, 'category' => 'transport', 'description' => 'Transport ya bidhaa kutoka market', 'amount' => mt_rand(50000, 200000), 'type' => 'daily', 'date' => "2026-$month-" . str_pad(mt_rand(5, 25), 2, '0', STR_PAD_LEFT), 'recorded_by' => $this->processedById]
                );
            }
            if (mt_rand(0, 1)) {
                Expense::firstOrCreate(
                    ['business_id' => $this->bid, 'category' => 'maintenance', 'date' => "2026-$month-" . str_pad(mt_rand(10, 20), 2, '0', STR_PAD_LEFT)],
                    ['business_id' => $this->bid, 'category' => 'maintenance', 'description' => 'Matengenezo ya fridge/display shelf', 'amount' => mt_rand(30000, 150000), 'type' => 'daily', 'date' => "2026-$month-" . str_pad(mt_rand(10, 20), 2, '0', STR_PAD_LEFT), 'recorded_by' => $this->processedById]
                );
            }
        }
    }

    private function seedCreditSales(): void
    {
        $credits = [
            ['name' => 'Hassan Mwinyi', 'phone' => '0754123456', 'product' => 'Mchele - Kiambe (5kg)', 'qty' => 10, 'amount' => 105000, 'paid' => 50000, 'status' => 'partial', 'days' => -15],
            ['name' => 'Rehema Kimaro', 'phone' => '0767234567', 'product' => 'Mafuta ya Kula - Elika (1L)', 'qty' => 20, 'amount' => 110000, 'paid' => 110000, 'status' => 'cleared', 'days' => -30],
            ['name' => 'Abdul Rahman', 'phone' => '0745345678', 'product' => 'Omo Detergent (500g)', 'qty' => 50, 'amount' => 100000, 'paid' => 30000, 'status' => 'pending', 'days' => -7],
            ['name' => 'Fatima Omari', 'phone' => '0786456789', 'product' => 'Nyama ya Ng\'ombe (1kg)', 'qty' => 5, 'amount' => 75000, 'paid' => 0, 'status' => 'overdue', 'days' => -45],
            ['name' => 'Ibrahim Mushi', 'phone' => '0713567890', 'product' => 'Coca-Cola (1.5L)', 'qty' => 30, 'amount' => 75000, 'paid' => 75000, 'status' => 'cleared', 'days' => -20],
            ['name' => 'Neema Kileo', 'phone' => '0778678901', 'product' => 'A4 Paper - Star (500 sheets)', 'qty' => 10, 'amount' => 110000, 'paid' => 60000, 'status' => 'partial', 'days' => -10],
            ['name' => 'Jabari Lwanga', 'phone' => '0724789012', 'product' => 'Pampers Diapers (M)', 'qty' => 5, 'amount' => 55000, 'paid' => 0, 'status' => 'pending', 'days' => -5],
            ['name' => 'Zainabu Issa', 'phone' => '0756890123', 'product' => 'Fertilizer NPK (5kg)', 'qty' => 3, 'amount' => 36000, 'paid' => 0, 'status' => 'overdue', 'days' => -60],
        ];

        foreach ($credits as $c) {
            CreditSale::firstOrCreate(
                ['business_id' => $this->bid, 'customer_phone' => $c['phone']],
                [
                    'business_id' => $this->bid,
                    'customer_name' => $c['name'],
                    'customer_phone' => $c['phone'],
                    'product_name' => $c['product'],
                    'quantity' => $c['qty'],
                    'amount' => $c['amount'],
                    'amount_paid' => $c['paid'],
                    'status' => $c['status'],
                    'due_date' => date('Y-m-d', strtotime($c['days'] . ' days')),
                    'notes' => 'Credit sale to ' . $c['name'],
                ]
            );
        }
    }

    private function seedLoans(): void
    {
        $custs = Customer::where('business_id', $this->bid)->take(4)->get();
        if ($custs->isEmpty()) return;

        $loanData = [
            ['amount' => 2000000, 'balance' => 800000, 'type' => 'go_pro_bank', 'rate' => 8.5, 'status' => 'active', 'days' => -90],
            ['amount' => 500000, 'balance' => 0, 'type' => 'mali_kauli', 'rate' => 5, 'status' => 'paid', 'days' => -60],
            ['amount' => 1000000, 'balance' => 750000, 'type' => 'amana_cash', 'rate' => 12, 'status' => 'active', 'days' => -30],
            ['amount' => 3000000, 'balance' => 2500000, 'type' => 'go_premiere_friendly', 'rate' => 10, 'status' => 'overdue', 'days' => -120],
        ];

        foreach ($custs as $i => $cust) {
            if (!isset($loanData[$i])) break;
            $ld = $loanData[$i];
            $loan = Loan::firstOrCreate(
                ['business_id' => $this->bid, 'customer_id' => $cust->id],
                [
                    'business_id' => $this->bid,
                    'customer_id' => $cust->id,
                    'loan_type' => $ld['type'],
                    'loan_amount' => $ld['amount'],
                    'loan_balance' => $ld['balance'],
                    'interest_rate' => $ld['rate'],
                    'status' => $ld['status'],
                    'start_date' => date('Y-m-d', strtotime($ld['days'] . ' days')),
                    'due_date' => date('Y-m-d', strtotime($ld['days'] . ' days +90 days')),
                    'repayment_plan' => 'Monthly installments of TZS ' . number_format($ld['amount'] / 6),
                ]
            );

            if ($ld['status'] === 'paid' || $ld['balance'] < $ld['amount']) {
                $paid = $ld['amount'] - $ld['balance'];
                $numPayments = max(1, (int)($paid / 100000));
                for ($p = 0; $p < $numPayments; $p++) {
                    $amount = min(100000, max(0, $paid - ($p * 100000)));
                    $payDate = date('Y-m-d', strtotime($ld['days'] . ' days +' . (($p + 1) * 14) . ' days'));
                    LoanPayment::firstOrCreate(
                        ['loan_id' => $loan->id, 'amount' => $amount],
                        [
                            'loan_id' => $loan->id,
                            'business_id' => $this->bid,
                            'amount' => $amount,
                            'notes' => 'Loan repayment #' . ($p + 1),
                            'recorded_by' => $this->processedById,
                            'created_at' => $payDate,
                            'updated_at' => $payDate,
                        ]
                    );
                }
            }
        }
    }

    private function seedInvoices(): void
    {
        $custs = Customer::where('business_id', $this->bid)->take(5)->get();
        $prods = Product::where('business_id', $this->bid)->take(10)->get();
        if ($custs->isEmpty() || $prods->isEmpty()) return;

        foreach ($custs as $i => $cust) {
            $subtotal = 0;
            $items = [];
            $itemsProd = $prods->random(mt_rand(2, 5));
            foreach ($itemsProd as $p) {
                $qty = mt_rand(2, 20);
                $amt = $qty * $p->selling_price;
                $items[] = ['description' => $p->name, 'qty' => $qty, 'price' => $p->selling_price, 'amount' => $amt];
                $subtotal += $amt;
            }
            $tax = $subtotal * 0.18;

            $inv = Invoice::firstOrCreate(
                ['business_id' => $this->bid, 'invoice_number' => 'INV-2026-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT)],
                [
                    'business_id' => $this->bid,
                    'customer_id' => $cust->id,
                    'invoice_number' => 'INV-2026-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'date' => '2026-' . str_pad(mt_rand(1, 6), 2, '0', STR_PAD_LEFT) . '-01',
                    'due_date' => '2026-' . str_pad(mt_rand(2, 7), 2, '0', STR_PAD_LEFT) . '-15',
                    'subtotal' => $subtotal,
                    'tax_amount' => $tax,
                    'total' => $subtotal + $tax,
                    'amount_paid' => $i < 3 ? $subtotal + $tax : ($i == 3 ? ($subtotal + $tax) * 0.5 : 0),
                    'status' => $i < 3 ? 'paid' : ($i == 3 ? 'partial' : 'overdue'),
                ]
            );

            foreach ($items as $it) {
                InvoiceItem::firstOrCreate(
                    ['invoice_id' => $inv->id, 'description' => $it['description']],
                    [
                        'invoice_id' => $inv->id,
                        'description' => $it['description'],
                        'quantity' => $it['qty'],
                        'unit_price' => $it['price'],
                        'amount' => $it['amount'],
                    ]
                );
            }
        }
    }

    private function seedBills(): void
    {
        $sups = Supplier::where('business_id', $this->bid)->take(4)->get();
        if ($sups->isEmpty()) return;

        foreach ($sups as $i => $sup) {
            $subtotal = mt_rand(500000, 5000000);
            $tax = $subtotal * 0.18;

            $bill = Bill::firstOrCreate(
                ['business_id' => $this->bid, 'bill_number' => 'BILL-2026-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT)],
                [
                    'business_id' => $this->bid,
                    'vendor_name' => $sup->name,
                    'bill_number' => 'BILL-2026-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'date' => '2026-' . str_pad(mt_rand(1, 6), 2, '0', STR_PAD_LEFT) . '-15',
                    'due_date' => '2026-' . str_pad(mt_rand(3, 7), 2, '0', STR_PAD_LEFT) . '-15',
                    'subtotal' => $subtotal,
                    'tax_amount' => $tax,
                    'total' => $subtotal + $tax,
                    'amount_paid' => $i < 2 ? $subtotal + $tax : 0,
                    'status' => $i < 2 ? 'paid' : 'received',
                ]
            );

            BillItem::firstOrCreate(
                ['bill_id' => $bill->id, 'description' => 'Bulk goods order from ' . $sup->name],
                [
                    'bill_id' => $bill->id,
                    'description' => 'Bulk goods order from ' . $sup->name,
                    'quantity' => mt_rand(50, 500),
                    'unit_price' => $subtotal / 100,
                    'amount' => $subtotal,
                ]
            );
        }
    }

    private function seedBankAccounts(): void
    {
        $bankAccId = Account::where('business_id', $this->bid)->where('code', '1120')->first()?->id;
        if (!$bankAccId) return;

        $bank = BankAccount::firstOrCreate(
            ['business_id' => $this->bid, 'account_number' => '0123456789012'],
            [
                'business_id' => $this->bid,
                'account_id' => $bankAccId,
                'bank_name' => 'CRDB Bank',
                'account_name' => 'Juma Supermarket Ltd',
                'account_number' => '0123456789012',
                'sort_code' => 'CRDBTZTZ',
                'balance' => 12500000,
                'is_active' => true,
            ]
        );

        $txns = [
            ['desc' => 'Opening Balance', 'credit' => 50000000, 'day' => 1],
            ['desc' => 'Sales - Cash Deposits', 'credit' => 8500000, 'day' => 5],
            ['desc' => 'Supplier Payment - Bidco Africa', 'debit' => 3200000, 'day' => 8],
            ['desc' => 'Sales - M-Pesa', 'credit' => 4200000, 'day' => 12],
            ['desc' => 'Rent Payment', 'debit' => 1500000, 'day' => 15],
            ['desc' => 'Supplier Payment - Coca-Cola', 'debit' => 6800000, 'day' => 18],
            ['desc' => 'Sales - Cash', 'credit' => 3100000, 'day' => 20],
            ['desc' => 'Salary Payments', 'debit' => 5100000, 'day' => 25],
            ['desc' => 'Sales - M-Pesa', 'credit' => 2900000, 'day' => 28],
        ];

        $balance = 0;
        foreach ($txns as $t) {
            $balance += ($t['credit'] ?? 0) - ($t['debit'] ?? 0);
            BankTransaction::firstOrCreate(
                ['bank_account_id' => $bank->id, 'date' => "2026-07-" . str_pad($t['day'], 2, '0', STR_PAD_LEFT)],
                [
                    'bank_account_id' => $bank->id,
                    'date' => "2026-07-" . str_pad($t['day'], 2, '0', STR_PAD_LEFT),
                    'description' => $t['desc'],
                    'debit' => $t['debit'] ?? 0,
                    'credit' => $t['credit'] ?? 0,
                    'balance_after' => $balance,
                ]
            );
        }
        $bank->update(['balance' => $balance]);
    }

    private function seedFixedAssets(): void
    {
        $assetAcc = Account::where('business_id', $this->bid)->where('code', '1310')->first()?->id;
        $depAcc = Account::where('business_id', $this->bid)->where('code', '1320')->first()?->id;
        if (!$assetAcc || !$depAcc) return;

        $assets = [
            ['code' => 'FA-001', 'name' => 'Display Refrigerator (3-door)', 'price' => 8500000, 'life' => 60, 'months_dep' => 18, 'purchase' => '2025-01-15'],
            ['code' => 'FA-002', 'name' => 'Cash Register - Casio', 'price' => 1200000, 'life' => 36, 'months_dep' => 18, 'purchase' => '2025-01-15'],
            ['code' => 'FA-003', 'name' => 'Metal Shelving Unit (4-tier)', 'price' => 2500000, 'life' => 84, 'months_dep' => 18, 'purchase' => '2025-01-15'],
            ['code' => 'FA-004', 'name' => 'Generator 15KVA', 'price' => 12000000, 'life' => 120, 'months_dep' => 18, 'purchase' => '2025-01-15'],
            ['code' => 'FA-005', 'name' => 'Delivery Bicycle', 'price' => 450000, 'life' => 36, 'months_dep' => 18, 'purchase' => '2025-03-01'],
            ['code' => 'FA-006', 'name' => 'Office Desk & Chair', 'price' => 1500000, 'life' => 60, 'months_dep' => 18, 'purchase' => '2025-01-15'],
            ['code' => 'FA-007', 'name' => 'Laptop - HP', 'price' => 1800000, 'life' => 36, 'months_dep' => 18, 'purchase' => '2025-06-01'],
        ];

        foreach ($assets as $a) {
            $monthly = ($a['price'] - $a['price'] * 0.1) / $a['life'];
            $accum = $monthly * $a['months_dep'];

            $asset = FixedAsset::firstOrCreate(
                ['business_id' => $this->bid, 'asset_code' => $a['code']],
                [
                    'business_id' => $this->bid,
                    'asset_code' => $a['code'],
                    'name' => $a['name'],
                    'description' => $a['name'] . ' for Juma Supermarket',
                    'category_account_id' => $assetAcc,
                    'depreciation_account_id' => $depAcc,
                    'purchase_date' => $a['purchase'],
                    'purchase_price' => $a['price'],
                    'salvage_value' => $a['price'] * 0.1,
                    'useful_life_months' => $a['life'],
                    'depreciation_method' => 'straight_line',
                    'accumulated_depreciation' => round($accum),
                    'current_value' => round($a['price'] - $accum),
                    'status' => 'active',
                    'location_id' => CostCenter::where('business_id', $this->bid)->where('code', 'CC-MAIN')->first()?->id,
                ]
            );

            for ($m = 1; $m <= min($a['months_dep'], 6); $m++) {
                $depDate = date('Y-m-d', strtotime($a['purchase'] . " +{$m} months"));
                if ($depDate > '2026-07-25') continue;
                DepreciationEntry::firstOrCreate(
                    ['business_id' => $this->bid, 'fixed_asset_id' => $asset->id, 'depreciation_date' => $depDate],
                    [
                        'business_id' => $this->bid,
                        'fixed_asset_id' => $asset->id,
                        'depreciation_date' => $depDate,
                        'amount' => round($monthly),
                        'accumulated_total' => round($monthly * $m),
                        'notes' => 'Monthly depreciation for ' . $a['name'],
                    ]
                );
            }
        }
    }

    private function seedJournalEntries(): void
    {
        $accts = Account::where('business_id', $this->bid)->pluck('id', 'code')->toArray();
        $fiscalPeriod = FiscalPeriod::where('business_id', $this->bid)->where('name', 'Jul 2026')->first();

        if (empty($accts)) return;

        $entries = [
            [
                'ref' => 'JE-2026-001', 'date' => '2026-07-01', 'desc' => 'Monthly rent expense accrual',
                'type' => 'general',
                'lines' => [
                    ['code' => '6100', 'debit' => 1500000, 'credit' => 0],
                    ['code' => '2110', 'debit' => 0, 'credit' => 1500000],
                ],
            ],
            [
                'ref' => 'JE-2026-002', 'date' => '2026-07-05', 'desc' => 'Salary payments June 2026',
                'type' => 'general',
                'lines' => [
                    ['code' => '6200', 'debit' => 5100000, 'credit' => 0],
                    ['code' => '1120', 'debit' => 0, 'credit' => 5100000],
                ],
            ],
            [
                'ref' => 'JE-2026-003', 'date' => '2026-07-10', 'desc' => 'Cash sales recording',
                'type' => 'sales',
                'lines' => [
                    ['code' => '1120', 'debit' => 4500000, 'credit' => 0],
                    ['code' => '4100', 'debit' => 0, 'credit' => 4500000],
                ],
            ],
            [
                'ref' => 'JE-2026-004', 'date' => '2026-07-12', 'desc' => 'Supplier payment - Bidco Africa',
                'type' => 'general',
                'lines' => [
                    ['code' => '2110', 'debit' => 3200000, 'credit' => 0],
                    ['code' => '1120', 'debit' => 0, 'credit' => 3200000],
                ],
            ],
            [
                'ref' => 'JE-2026-005', 'date' => '2026-07-15', 'desc' => 'Utility bills payment',
                'type' => 'general',
                'lines' => [
                    ['code' => '6310', 'debit' => 350000, 'credit' => 0],
                    ['code' => '6320', 'debit' => 120000, 'credit' => 0],
                    ['code' => '1120', 'debit' => 0, 'credit' => 470000],
                ],
            ],
            [
                'ref' => 'JE-2026-006', 'date' => '2026-07-18', 'desc' => 'Supplier payment - Coca-Cola Kwanza',
                'type' => 'general',
                'lines' => [
                    ['code' => '2110', 'debit' => 6800000, 'credit' => 0],
                    ['code' => '1120', 'debit' => 0, 'credit' => 6800000],
                ],
            ],
            [
                'ref' => 'JE-2026-007', 'date' => '2026-07-20', 'desc' => 'Sales revenue - week 3',
                'type' => 'sales',
                'lines' => [
                    ['code' => '1120', 'debit' => 6200000, 'credit' => 0],
                    ['code' => '4100', 'debit' => 0, 'credit' => 6200000],
                ],
            ],
            [
                'ref' => 'JE-2026-008', 'date' => '2026-07-25', 'desc' => 'Inventory purchase',
                'type' => 'general',
                'lines' => [
                    ['code' => '1200', 'debit' => 8500000, 'credit' => 0],
                    ['code' => '2110', 'debit' => 0, 'credit' => 8500000],
                ],
            ],
            [
                'ref' => 'JE-2026-009', 'date' => '2026-07-25', 'desc' => 'Depreciation - July 2026',
                'type' => 'general',
                'lines' => [
                    ['code' => '6800', 'debit' => 525000, 'credit' => 0],
                    ['code' => '1320', 'debit' => 0, 'credit' => 525000],
                ],
            ],
            [
                'ref' => 'JE-2026-010', 'date' => '2026-07-28', 'desc' => 'Credit sales recording',
                'type' => 'sales',
                'lines' => [
                    ['code' => '1130', 'debit' => 2100000, 'credit' => 0],
                    ['code' => '4100', 'debit' => 0, 'credit' => 2100000],
                ],
            ],
        ];

        foreach ($entries as $e) {
            $totalDebit = array_sum(array_column($e['lines'], 'debit'));
            $totalCredit = array_sum(array_column($e['lines'], 'credit'));

            $je = JournalEntry::firstOrCreate(
                ['business_id' => $this->bid, 'reference' => $e['ref']],
                [
                    'business_id' => $this->bid,
                    'fiscal_period_id' => $fiscalPeriod?->id,
                    'date' => $e['date'],
                    'reference' => $e['ref'],
                    'journal_type' => $e['type'],
                    'description' => $e['desc'],
                    'is_posted' => true,
                    'total_debit' => $totalDebit,
                    'total_credit' => $totalCredit,
                    'created_by' => $this->processedById,
                ]
            );

            foreach ($e['lines'] as $line) {
                $accountId = $accts[$line['code']] ?? null;
                if (!$accountId) continue;
                JournalEntryLine::firstOrCreate(
                    ['journal_entry_id' => $je->id, 'account_id' => $accountId],
                    [
                        'journal_entry_id' => $je->id,
                        'account_id' => $accountId,
                        'debit' => $line['debit'],
                        'credit' => $line['credit'],
                        'description' => $e['desc'],
                    ]
                );
            }
        }
    }

    private function seedSubscriptions(): void
    {
        Subscription::firstOrCreate(
            ['business_id' => $this->bid],
            [
                'business_id' => $this->bid,
                'user_id' => $this->ownerId,
                'plan' => 'yearly',
                'amount' => 200000,
                'status' => 'active',
                'start_date' => '2025-01-01',
                'end_date' => '2026-12-31',
            ]
        );
    }

    private function seedNotifications(): void
    {
        UserNotification::firstOrCreate(
            ['user_id' => $this->ownerId, 'title' => 'Karibu M-TAI!'],
            [
                'user_id' => $this->ownerId,
                'title' => 'Karibu M-TAI!',
                'message' => 'Karibu kwenye M-TAI ERP. System iko tayari kwa biashara yako.',
                'type' => 'info',
                'is_read' => true,
            ]
        );
        UserNotification::firstOrCreate(
            ['user_id' => $this->ownerId, 'title' => 'Order mpya imepokelewa'],
            [
                'user_id' => $this->ownerId,
                'title' => 'Order mpya imepokelewa',
                'message' => 'Order ya TZS 150,000 imethibitishwa na mteja Hassan Mwinyi.',
                'type' => 'order',
                'is_read' => false,
            ]
        );
        UserNotification::firstOrCreate(
            ['user_id' => $this->ownerId, 'title' => 'Stok iko chini'],
            [
                'user_id' => $this->ownerId,
                'title' => 'Stok iko chini',
                'message' => 'Bidhaa 5 zimefikia kiwango cha chini kabisa. Tafadhali fanya restock.',
                'type' => 'alert',
                'is_read' => false,
            ]
        );
    }
}
