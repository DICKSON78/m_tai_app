<?php

use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\TransporterController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\BarcodeController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\CreditSaleController;
use App\Http\Controllers\Api\ImportGoodController;
use App\Http\Controllers\Api\InvestmentController;
use App\Http\Controllers\Api\FinanceAccountController;
use App\Http\Controllers\Api\FinanceJournalController;
use App\Http\Controllers\Api\FinanceInvoiceController;
use App\Http\Controllers\Api\FinanceBillController;
use App\Http\Controllers\Api\FinanceBankController;
use App\Http\Controllers\Api\FinanceReportController;
use App\Http\Controllers\Api\FinanceBudgetController;
use App\Http\Controllers\Api\FinanceTaxController;
use App\Http\Controllers\Api\GeneralLedgerController;
use App\Http\Controllers\Api\CostCenterController;
use App\Http\Controllers\Api\FixedAssetController;
use App\Http\Controllers\Api\CurrencyController;
use App\Http\Controllers\Api\FiscalPeriodController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\PurchaseReceptionController;
use App\Http\Controllers\Api\SupplierInvoiceController;
use App\Http\Controllers\Api\SupplierPaymentController;
use App\Http\Controllers\Api\HrEmployeeController;
use App\Http\Controllers\Api\HrAttendanceController;
use App\Http\Controllers\Api\HrLeaveController;
use App\Http\Controllers\Api\HrPayrollController;
use App\Http\Controllers\Api\HrPerformanceController;
use App\Http\Controllers\Api\HrTrainingController;
use App\Http\Controllers\Api\HrRecruitmentController;
use App\Http\Controllers\Api\HrBenefitController;
use App\Http\Controllers\Api\HrDepartmentController;
use Illuminate\Support\Facades\Route;

// Public API routes
Route::post('/register/customer', [AuthApiController::class, 'registerCustomer']);
Route::post('/register/seller', [AuthApiController::class, 'registerSeller']);
Route::post('/login', [AuthApiController::class, 'login']);
Route::post('/forgot-password', [AuthApiController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthApiController::class, 'resetPassword']);

// Protected API routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthApiController::class, 'logout']);
    Route::get('/user', [AuthApiController::class, 'user']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Business Owner - Businesses
    Route::middleware('role:business_owner')->prefix('owner')->group(function () {
        Route::get('/dashboard', [DashboardApiController::class, 'ownerDashboard']);

        // Business CRUD
        Route::get('/businesses', [BusinessController::class, 'index']);
        Route::post('/businesses', [BusinessController::class, 'store']);
        Route::get('/businesses/{business}', [BusinessController::class, 'show']);
        Route::put('/businesses/{business}', [BusinessController::class, 'update']);
        Route::delete('/businesses/{business}', [BusinessController::class, 'destroy']);
        Route::post('/businesses/{business}/switch', [BusinessController::class, 'switch']);
        Route::get('/businesses/{business}/stats', [BusinessController::class, 'stats']);

        // Capital
        Route::get('/businesses/{business}/capitals', [BusinessController::class, 'getCapitals']);
        Route::post('/businesses/{business}/capitals', [BusinessController::class, 'addCapital']);

        // Products
        Route::get('/businesses/{business}/products', [ProductController::class, 'index']);
        Route::post('/businesses/{business}/products', [ProductController::class, 'store']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        Route::post('/products/{product}/publish', [ProductController::class, 'publish']);
        Route::post('/products/{product}/stock', [ProductController::class, 'stock']);

        // Categories
        Route::get('/businesses/{business}/categories', [CategoryController::class, 'index']);
        Route::post('/businesses/{business}/categories', [CategoryController::class, 'store']);
        Route::get('/categories/{category}', [CategoryController::class, 'show']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
        Route::get('/businesses/{business}/categories/tree', [CategoryController::class, 'tree']);

        // Stock Management
        Route::get('/businesses/{business}/stock', [StockController::class, 'index']);
        Route::get('/businesses/{business}/stock/alerts', [StockController::class, 'alerts']);
        Route::get('/businesses/{business}/stock/movements', [StockController::class, 'movements']);
        Route::get('/businesses/{business}/stock/fast-moving', [StockController::class, 'fastMoving']);
        Route::post('/businesses/{business}/stock', [StockController::class, 'recordMovement']);
        Route::get('/products/{product}/movements', [StockController::class, 'productMovements']);

        // Inventory Management
        Route::get('/businesses/{business}/inventory/stock', [InventoryController::class, 'index']);
        Route::get('/businesses/{business}/inventory/summary', [InventoryController::class, 'summary']);
        Route::get('/businesses/{business}/inventory/alerts', [InventoryController::class, 'alerts']);
        Route::get('/businesses/{business}/inventory/movements', [InventoryController::class, 'movements']);
        Route::post('/businesses/{business}/inventory/movements', [InventoryController::class, 'storeMovement']);
        Route::get('/businesses/{business}/inventory/batches', [InventoryController::class, 'batches']);
        Route::post('/businesses/{business}/inventory/batches', [InventoryController::class, 'storeBatch']);
        Route::get('/businesses/{business}/inventory/stock-counts', [InventoryController::class, 'stockCounts']);
        Route::post('/businesses/{business}/inventory/stock-counts', [InventoryController::class, 'storeStockCount']);
        Route::get('/businesses/{business}/inventory/stock-counts/{stockCount}', [InventoryController::class, 'showStockCount']);
        Route::put('/businesses/{business}/inventory/stock-counts/{stockCount}/items', [InventoryController::class, 'updateStockCountItems']);
        Route::post('/businesses/{business}/inventory/stock-counts/{stockCount}/approve', [InventoryController::class, 'approveStockCount']);

        // Expenses
        Route::get('/businesses/{business}/expenses', [ExpenseController::class, 'index']);
        Route::post('/businesses/{business}/expenses', [ExpenseController::class, 'store']);
        Route::get('/businesses/{business}/expenses/summary', [ExpenseController::class, 'summary']);
        Route::get('/expenses/{expense}', [ExpenseController::class, 'show']);
        Route::put('/expenses/{expense}', [ExpenseController::class, 'update']);
        Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);

        // Reports
        Route::get('/businesses/{business}/reports/sales', [ReportController::class, 'salesReport']);
        Route::get('/businesses/{business}/reports/profit', [ReportController::class, 'profitReport']);
        Route::get('/businesses/{business}/reports/expenses', [ReportController::class, 'expenseReport']);
        Route::get('/businesses/{business}/reports/inventory', [ReportController::class, 'inventoryReport']);
        Route::get('/businesses/{business}/reports/customers', [ReportController::class, 'customerReport']);
        Route::get('/businesses/{business}/reports/loans', [ReportController::class, 'loanReport']);
        Route::get('/businesses/{business}/reports/deliveries', [ReportController::class, 'deliveryReport']);

        // Customers
        Route::get('/businesses/{business}/customers', [CustomerController::class, 'index']);
        Route::post('/businesses/{business}/customers', [CustomerController::class, 'store']);
        Route::get('/businesses/{business}/customers/stats', [CustomerController::class, 'stats']);
        Route::get('/businesses/{business}/customers/{customer}', [CustomerController::class, 'show']);
        Route::put('/businesses/{business}/customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('/businesses/{business}/customers/{customer}', [CustomerController::class, 'destroy']);

        // Employees
        Route::get('/businesses/{business}/employees', [EmployeeController::class, 'index']);
        Route::post('/businesses/{business}/employees', [EmployeeController::class, 'store']);
        Route::get('/employees/roles', [EmployeeController::class, 'roles']);
        Route::get('/businesses/{business}/employees/{employee}', [EmployeeController::class, 'show']);
        Route::put('/businesses/{business}/employees/{employee}', [EmployeeController::class, 'update']);
        Route::delete('/businesses/{business}/employees/{employee}', [EmployeeController::class, 'destroy']);

        // Loans
        Route::get('/businesses/{business}/loans', [LoanController::class, 'index']);
        Route::post('/businesses/{business}/loans', [LoanController::class, 'store']);
        Route::get('/businesses/{business}/loans/summary', [LoanController::class, 'summary']);
        Route::get('/businesses/{business}/loans/{loan}', [LoanController::class, 'show']);
        Route::put('/businesses/{business}/loans/{loan}', [LoanController::class, 'update']);
        Route::post('/businesses/{business}/loans/{loan}/pay', [LoanController::class, 'pay']);

        // Credit Sales (Kopesha)
        Route::get('/businesses/{business}/credit-sales', [CreditSaleController::class, 'index']);
        Route::post('/businesses/{business}/credit-sales', [CreditSaleController::class, 'store']);
        Route::get('/businesses/{business}/credit-sales/{creditSale}', [CreditSaleController::class, 'show']);
        Route::put('/businesses/{business}/credit-sales/{creditSale}', [CreditSaleController::class, 'update']);
        Route::delete('/businesses/{business}/credit-sales/{creditSale}', [CreditSaleController::class, 'destroy']);
        Route::post('/businesses/{business}/credit-sales/{creditSale}/pay', [CreditSaleController::class, 'pay']);
        Route::post('/businesses/{business}/credit-sales/overdue', [CreditSaleController::class, 'markOverdue']);

        // Import Goods
        Route::get('/businesses/{business}/imports', [ImportGoodController::class, 'index']);
        Route::post('/businesses/{business}/imports', [ImportGoodController::class, 'store']);
        Route::get('/businesses/{business}/imports/{importGood}', [ImportGoodController::class, 'show']);
        Route::put('/businesses/{business}/imports/{importGood}', [ImportGoodController::class, 'update']);
        Route::delete('/businesses/{business}/imports/{importGood}', [ImportGoodController::class, 'destroy']);
        Route::put('/businesses/{business}/imports/{importGood}/status', [ImportGoodController::class, 'updateStatus']);

        // Investments & Savings
        Route::get('/businesses/{business}/investments', [InvestmentController::class, 'index']);
        Route::post('/businesses/{business}/investments', [InvestmentController::class, 'store']);
        Route::post('/businesses/{business}/investments/allocate', [InvestmentController::class, 'allocate']);
        Route::delete('/businesses/{business}/investments/{investment}', [InvestmentController::class, 'destroy']);

        // Deliveries - Business Owner
        Route::get('/businesses/{business}/deliveries', [DeliveryController::class, 'index']);
        Route::post('/businesses/{business}/deliveries', [DeliveryController::class, 'store']);
        Route::get('/businesses/{business}/deliveries/{delivery}', [DeliveryController::class, 'show']);
        Route::put('/businesses/{business}/deliveries/{delivery}', [DeliveryController::class, 'update']);
        Route::post('/businesses/{business}/deliveries/{delivery}/status', [DeliveryController::class, 'status']);
        Route::post('/businesses/{business}/deliveries/{delivery}/assign', [DeliveryController::class, 'assignTransporter']);

        // Business Settings
        Route::get('/businesses/{business}/settings', [SettingController::class, 'getSettings']);
        Route::put('/businesses/{business}/settings', [SettingController::class, 'updateSettings']);
    });

    // Admin
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [DashboardApiController::class, 'adminDashboard']);
        Route::get('/businesses', [AdminController::class, 'allBusinesses']);
        Route::get('/businesses/{business}', [AdminController::class, 'showBusiness']);
        Route::post('/businesses', [AdminController::class, 'storeBusiness']);
        Route::put('/businesses/{business}', [AdminController::class, 'updateBusiness']);
        Route::delete('/businesses/{business}', [AdminController::class, 'deleteBusiness']);
        Route::get('/users', [AdminController::class, 'allUsers']);
        Route::get('/users/{user}', [AdminController::class, 'showUser']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::get('/orders', [AdminController::class, 'allOrders']);
        Route::get('/orders/{order}', [AdminController::class, 'showOrder']);
        Route::put('/orders/{order}', [AdminController::class, 'updateOrder']);
        Route::delete('/orders/{order}', [AdminController::class, 'deleteOrder']);
        Route::get('/subscriptions', [AdminController::class, 'subscriptions']);
        Route::get('/subscriptions/{subscription}', [AdminController::class, 'showSubscription']);
        Route::post('/subscriptions', [AdminController::class, 'createSubscription']);
        Route::put('/subscriptions/{subscription}', [AdminController::class, 'updateSubscription']);
        Route::delete('/subscriptions/{subscription}', [AdminController::class, 'deleteSubscription']);
        Route::get('/announcements', [AdminController::class, 'announcements']);
        Route::get('/announcements/{announcement}', [AdminController::class, 'showAnnouncement']);
        Route::post('/announcements', [AdminController::class, 'createAnnouncement']);
        Route::put('/announcements/{announcement}', [AdminController::class, 'updateAnnouncement']);
        Route::delete('/announcements/{announcement}', [AdminController::class, 'deleteAnnouncement']);
        Route::get('/reports', [AdminController::class, 'reports']);
        Route::get('/finance', [AdminController::class, 'finance']);
        Route::get('/deliveries', [AdminController::class, 'deliveries']);
        Route::get('/coupons', [AdminController::class, 'allCoupons']);
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
    });

    // ==================== FINANCE MODULE (Business Owner + Admin) ====================
    Route::middleware('role:business_owner,admin')->prefix('owner/finance')->group(function () {
        // Chart of Accounts
        Route::get('/accounts', [FinanceAccountController::class, 'index']);
        Route::post('/accounts', [FinanceAccountController::class, 'store']);
        Route::get('/accounts/{account}', [FinanceAccountController::class, 'show']);
        Route::put('/accounts/{account}', [FinanceAccountController::class, 'update']);
        Route::delete('/accounts/{account}', [FinanceAccountController::class, 'destroy']);

        // Journal Entries
        Route::get('/journal', [FinanceJournalController::class, 'index']);
        Route::post('/journal', [FinanceJournalController::class, 'store']);
        Route::get('/journal/{journalEntry}', [FinanceJournalController::class, 'show']);
        Route::delete('/journal/{journalEntry}', [FinanceJournalController::class, 'destroy']);

        // Invoices (Accounts Receivable)
        Route::get('/invoices', [FinanceInvoiceController::class, 'index']);
        Route::post('/invoices', [FinanceInvoiceController::class, 'store']);
        Route::get('/invoices/{invoice}', [FinanceInvoiceController::class, 'show']);
        Route::put('/invoices/{invoice}', [FinanceInvoiceController::class, 'update']);
        Route::post('/invoices/{invoice}/pay', [FinanceInvoiceController::class, 'recordPayment']);
        Route::delete('/invoices/{invoice}', [FinanceInvoiceController::class, 'destroy']);

        // Bills (Accounts Payable)
        Route::get('/bills', [FinanceBillController::class, 'index']);
        Route::post('/bills', [FinanceBillController::class, 'store']);
        Route::get('/bills/{bill}', [FinanceBillController::class, 'show']);
        Route::put('/bills/{bill}', [FinanceBillController::class, 'update']);
        Route::post('/bills/{bill}/pay', [FinanceBillController::class, 'recordPayment']);
        Route::delete('/bills/{bill}', [FinanceBillController::class, 'destroy']);

        // Bank Accounts
        Route::get('/bank-accounts', [FinanceBankController::class, 'index']);
        Route::post('/bank-accounts', [FinanceBankController::class, 'store']);
        Route::get('/bank-accounts/{bankAccount}', [FinanceBankController::class, 'show']);
        Route::get('/bank-accounts/{bankAccount}/transactions', [FinanceBankController::class, 'transactions']);
        Route::post('/bank-accounts/{bankAccount}/transactions', [FinanceBankController::class, 'addTransaction']);
        Route::delete('/bank-accounts/{bankAccount}', [FinanceBankController::class, 'destroy']);

        // Financial Reports
        Route::get('/reports/profit-loss', [FinanceReportController::class, 'profitLoss']);
        Route::get('/reports/balance-sheet', [FinanceReportController::class, 'balanceSheet']);
        Route::get('/reports/cash-flow', [FinanceReportController::class, 'cashFlow']);
        Route::get('/reports/trial-balance', [FinanceReportController::class, 'trialBalance']);
        Route::get('/reports/aged-receivables', [FinanceReportController::class, 'agedReceivables']);
        Route::get('/reports/aged-payables', [FinanceReportController::class, 'agedPayables']);
        Route::get('/reports/budget-vs-actual', [FinanceReportController::class, 'budgetVsActual']);

        // Budgets
        Route::get('/budgets', [FinanceBudgetController::class, 'index']);
        Route::post('/budgets', [FinanceBudgetController::class, 'store']);
        Route::put('/budgets/{budget}', [FinanceBudgetController::class, 'update']);
        Route::delete('/budgets/{budget}', [FinanceBudgetController::class, 'destroy']);

        // Tax Rates
        Route::get('/tax-rates', [FinanceTaxController::class, 'index']);
        Route::post('/tax-rates', [FinanceTaxController::class, 'store']);
        Route::put('/tax-rates/{taxRate}', [FinanceTaxController::class, 'update']);
        Route::delete('/tax-rates/{taxRate}', [FinanceTaxController::class, 'destroy']);

        // General Ledger
        Route::get('/ledger', [GeneralLedgerController::class, 'index']);
        Route::get('/ledger/summary', [GeneralLedgerController::class, 'summary']);
        Route::get('/ledger/account/{account}', [GeneralLedgerController::class, 'accountLedger']);

        // Cost Centers
        Route::get('/cost-centers', [CostCenterController::class, 'index']);
        Route::post('/cost-centers', [CostCenterController::class, 'store']);
        Route::get('/cost-centers/{costCenter}', [CostCenterController::class, 'show']);
        Route::put('/cost-centers/{costCenter}', [CostCenterController::class, 'update']);
        Route::delete('/cost-centers/{costCenter}', [CostCenterController::class, 'destroy']);

        // Fixed Assets
        Route::get('/fixed-assets', [FixedAssetController::class, 'index']);
        Route::post('/fixed-assets', [FixedAssetController::class, 'store']);
        Route::get('/fixed-assets/summary', [FixedAssetController::class, 'summary']);
        Route::get('/fixed-assets/{fixedAsset}', [FixedAssetController::class, 'show']);
        Route::put('/fixed-assets/{fixedAsset}', [FixedAssetController::class, 'update']);
        Route::post('/fixed-assets/{fixedAsset}/depreciate', [FixedAssetController::class, 'depreciate']);
        Route::post('/fixed-assets/{fixedAsset}/dispose', [FixedAssetController::class, 'dispose']);

        // Currencies & Exchange Rates
        Route::get('/currencies', [CurrencyController::class, 'index']);
        Route::post('/currencies', [CurrencyController::class, 'store']);
        Route::get('/exchange-rates', [CurrencyController::class, 'exchangeRates']);
        Route::post('/exchange-rates', [CurrencyController::class, 'storeExchangeRate']);
        Route::post('/convert', [CurrencyController::class, 'convert']);

        // Fiscal Periods
        Route::get('/fiscal-periods', [FiscalPeriodController::class, 'index']);
        Route::post('/fiscal-periods', [FiscalPeriodController::class, 'store']);
        Route::get('/fiscal-periods/{fiscalPeriod}', [FiscalPeriodController::class, 'show']);
        Route::post('/fiscal-periods/{fiscalPeriod}/close', [FiscalPeriodController::class, 'close']);
        Route::delete('/fiscal-periods/{fiscalPeriod}', [FiscalPeriodController::class, 'destroy']);
    });

    // ==================== PURCHASE MODULE (Business Owner + Admin) ====================
    Route::middleware('role:business_owner,admin')->prefix('owner/purchases')->group(function () {
        // Suppliers
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::get('/suppliers/summary', [SupplierController::class, 'summary']);
        Route::get('/suppliers/{supplier}', [SupplierController::class, 'show']);
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
        Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);

        // Purchase Orders
        Route::get('/orders', [PurchaseOrderController::class, 'index']);
        Route::post('/orders', [PurchaseOrderController::class, 'store']);
        Route::get('/orders/summary', [PurchaseOrderController::class, 'summary']);
        Route::get('/orders/{purchaseOrder}', [PurchaseOrderController::class, 'show']);
        Route::put('/orders/{purchaseOrder}', [PurchaseOrderController::class, 'update']);
        Route::delete('/orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy']);
        Route::post('/orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve']);
        Route::post('/orders/{purchaseOrder}/confirm', [PurchaseOrderController::class, 'confirm']);
        Route::post('/orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel']);

        // Goods Received Notes (GRN)
        Route::get('/receptions', [PurchaseReceptionController::class, 'index']);
        Route::post('/receptions', [PurchaseReceptionController::class, 'store']);
        Route::get('/receptions/{purchaseReception}', [PurchaseReceptionController::class, 'show']);
        Route::post('/receptions/{purchaseReception}/confirm', [PurchaseReceptionController::class, 'confirm']);
        Route::delete('/receptions/{purchaseReception}', [PurchaseReceptionController::class, 'destroy']);

        // Supplier Invoices
        Route::get('/invoices', [SupplierInvoiceController::class, 'index']);
        Route::post('/invoices', [SupplierInvoiceController::class, 'store']);
        Route::get('/invoices/aging', [SupplierInvoiceController::class, 'aging']);
        Route::get('/invoices/{supplierInvoice}', [SupplierInvoiceController::class, 'show']);
        Route::put('/invoices/{supplierInvoice}', [SupplierInvoiceController::class, 'update']);
        Route::post('/invoices/{supplierInvoice}/validate', [SupplierInvoiceController::class, 'validate_']);
        Route::delete('/invoices/{supplierInvoice}', [SupplierInvoiceController::class, 'destroy']);

        // Supplier Payments
        Route::get('/payments', [SupplierPaymentController::class, 'index']);
        Route::post('/payments', [SupplierPaymentController::class, 'store']);
        Route::get('/payments/summary', [SupplierPaymentController::class, 'summary']);
        Route::get('/payments/{supplierPayment}', [SupplierPaymentController::class, 'show']);
        Route::post('/payments/{supplierPayment}/confirm', [SupplierPaymentController::class, 'confirm']);
        Route::post('/payments/{supplierPayment}/cancel', [SupplierPaymentController::class, 'cancel']);
        Route::delete('/payments/{supplierPayment}', [SupplierPaymentController::class, 'destroy']);
    });

    // ==================== HR MODULE (Business Owner + Admin) ====================
    Route::middleware('role:business_owner,admin')->prefix('owner/hr')->group(function () {
        // Departments
        Route::get('/departments', [HrDepartmentController::class, 'index']);
        Route::post('/departments', [HrDepartmentController::class, 'store']);
        Route::put('/departments/{hrDepartment}', [HrDepartmentController::class, 'update']);
        Route::delete('/departments/{hrDepartment}', [HrDepartmentController::class, 'destroy']);

        // Employees
        Route::get('/employees', [HrEmployeeController::class, 'index']);
        Route::post('/employees', [HrEmployeeController::class, 'store']);
        Route::get('/employees/summary', [HrEmployeeController::class, 'summary']);
        Route::get('/employees/{employee}', [HrEmployeeController::class, 'show']);
        Route::put('/employees/{employee}', [HrEmployeeController::class, 'update']);
        Route::delete('/employees/{employee}', [HrEmployeeController::class, 'destroy']);

        // Attendance
        Route::get('/attendance', [HrAttendanceController::class, 'index']);
        Route::post('/attendance', [HrAttendanceController::class, 'store']);
        Route::post('/attendance/clock-in', [HrAttendanceController::class, 'clockIn']);
        Route::post('/attendance/{attendance}/clock-out', [HrAttendanceController::class, 'clockOut']);
        Route::delete('/attendance/{attendance}', [HrAttendanceController::class, 'destroy']);

        // Leave Management
        Route::get('/leave-types', [HrLeaveController::class, 'types']);
        Route::post('/leave-types', [HrLeaveController::class, 'storeType']);
        Route::put('/leave-types/{leaveType}', [HrLeaveController::class, 'updateType']);
        Route::delete('/leave-types/{leaveType}', [HrLeaveController::class, 'destroyType']);
        Route::get('/leave-requests', [HrLeaveController::class, 'requests']);
        Route::post('/leave-requests', [HrLeaveController::class, 'storeRequest']);
        Route::post('/leave-requests/{leaveRequest}/approve', [HrLeaveController::class, 'approve']);
        Route::post('/leave-requests/{leaveRequest}/reject', [HrLeaveController::class, 'reject']);
        Route::delete('/leave-requests/{leaveRequest}', [HrLeaveController::class, 'destroy']);

        // Payroll
        Route::get('/payrolls', [HrPayrollController::class, 'index']);
        Route::post('/payrolls/generate', [HrPayrollController::class, 'generate']);
        Route::get('/payrolls/{payroll}', [HrPayrollController::class, 'show']);
        Route::post('/payrolls/{payroll}/process', [HrPayrollController::class, 'process']);
        Route::post('/payrolls/{payroll}/pay', [HrPayrollController::class, 'pay']);
        Route::put('/payrolls/items/{item}', [HrPayrollController::class, 'updateItem']);
        Route::delete('/payrolls/{payroll}', [HrPayrollController::class, 'destroy']);

        // Performance Reviews
        Route::get('/performance', [HrPerformanceController::class, 'index']);
        Route::post('/performance', [HrPerformanceController::class, 'store']);
        Route::get('/performance/{performanceReview}', [HrPerformanceController::class, 'show']);
        Route::put('/performance/{performanceReview}', [HrPerformanceController::class, 'update']);
        Route::delete('/performance/{performanceReview}', [HrPerformanceController::class, 'destroy']);

        // Training
        Route::get('/training', [HrTrainingController::class, 'index']);
        Route::post('/training', [HrTrainingController::class, 'store']);
        Route::get('/training/{trainingProgram}', [HrTrainingController::class, 'show']);
        Route::put('/training/{trainingProgram}', [HrTrainingController::class, 'update']);
        Route::post('/training/{trainingProgram}/enroll', [HrTrainingController::class, 'enroll']);
        Route::delete('/training/{trainingProgram}', [HrTrainingController::class, 'destroy']);

        // Recruitment
        Route::get('/jobs', [HrRecruitmentController::class, 'index']);
        Route::post('/jobs', [HrRecruitmentController::class, 'store']);
        Route::get('/jobs/{jobPosting}', [HrRecruitmentController::class, 'show']);
        Route::put('/jobs/{jobPosting}', [HrRecruitmentController::class, 'update']);
        Route::get('/jobs/{jobPosting}/applications', [HrRecruitmentController::class, 'applications']);
        Route::post('/jobs/{jobPosting}/applications', [HrRecruitmentController::class, 'storeApplication']);
        Route::put('/applications/{jobApplication}', [HrRecruitmentController::class, 'updateApplication']);
        Route::delete('/jobs/{jobPosting}', [HrRecruitmentController::class, 'destroy']);

        // Benefits
        Route::get('/benefits', [HrBenefitController::class, 'index']);
        Route::post('/benefits', [HrBenefitController::class, 'store']);
        Route::put('/benefits/{benefit}', [HrBenefitController::class, 'update']);
        Route::post('/benefits/{benefit}/assign', [HrBenefitController::class, 'assign']);
        Route::delete('/benefits/assignments/{employeeBenefit}', [HrBenefitController::class, 'unassign']);
        Route::delete('/benefits/{benefit}', [HrBenefitController::class, 'destroy']);
    });

    // Employee
    Route::middleware('role:employee')->prefix('employee')->group(function () {
        Route::get('/dashboard', [DashboardApiController::class, 'employeeDashboard']);
        Route::get('/inventory', [\App\Http\Controllers\Api\EmployeeDataController::class, 'inventory']);
        Route::get('/customers', [\App\Http\Controllers\Api\EmployeeDataController::class, 'customers']);
        Route::get('/deliveries', [\App\Http\Controllers\Api\EmployeeDataController::class, 'deliveries']);
        Route::get('/expenses', [\App\Http\Controllers\Api\EmployeeDataController::class, 'expenses']);
        Route::post('/expenses', [\App\Http\Controllers\Api\EmployeeDataController::class, 'storeExpense']);
    });

    // Customer
    Route::middleware('role:customer')->prefix('customer')->group(function () {
        Route::get('/dashboard', [DashboardApiController::class, 'customerDashboard']);
        Route::get('/orders', [OrderController::class, 'myOrders']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancelOrder']);
        Route::get('/orders/{order}/reorder', [OrderController::class, 'reorder']);
        Route::get('/deliveries', [DeliveryController::class, 'customerDeliveries']);
    });

    // Transporter
    Route::middleware('role:transporter')->prefix('transporter')->group(function () {
        Route::get('/dashboard', [DashboardApiController::class, 'transporterDashboard']);
        Route::get('/deliveries', [TransporterController::class, 'myDeliveries']);
        Route::post('/deliveries/{delivery}/status', [TransporterController::class, 'updateDeliveryStatus']);
        Route::get('/deliveries/available', [DeliveryController::class, 'available']);
        Route::get('/profile', [TransporterController::class, 'profile']);
        Route::put('/profile', [TransporterController::class, 'updateProfile']);
    });

    // Shop browsing (public to authenticated users)
    Route::get('/shops/search', [ShopController::class, 'searchShops']);
    Route::get('/shops/{business}', [ShopController::class, 'openShop']);
    Route::get('/shops/{business}/products', [ShopController::class, 'shopProducts']);
    Route::get('/shop/products/{product}', [ShopController::class, 'productDetail']);

    // Reviews (public read, authenticated write)
    Route::get('/products/{product}/reviews', [ReviewController::class, 'index']);
    Route::post('/products/{product}/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

    // Wishlist
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'add']);
    Route::delete('/wishlist/{wishlist}', [WishlistController::class, 'remove']);
    Route::get('/wishlist/check/{product}', [WishlistController::class, 'check']);

    // Coupons - Customer
    Route::post('/coupons/validate', [CouponController::class, 'validateCoupon']);

    // Coupons - Business Owner
    Route::middleware('role:business_owner')->prefix('owner')->group(function () {
        Route::get('/businesses/{business}/coupons', [CouponController::class, 'index']);
        Route::post('/businesses/{business}/coupons', [CouponController::class, 'store']);
        Route::get('/businesses/{business}/coupons/{coupon}', [CouponController::class, 'show']);
        Route::put('/businesses/{business}/coupons/{coupon}', [CouponController::class, 'update']);
        Route::delete('/businesses/{business}/coupons/{coupon}', [CouponController::class, 'destroy']);
    });

    // Audit Logs (admin only)
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::delete('/audit-logs/{auditLog}', [AuditLogController::class, 'destroy']);
    });

    // Cart
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'add']);
    Route::put('/cart/{key}', [CartController::class, 'update']);
    Route::delete('/cart/{key}', [CartController::class, 'remove']);
    Route::delete('/cart', [CartController::class, 'clear']);

    // Orders - Customer
    Route::post('/orders/checkout', [OrderController::class, 'checkout']);
    Route::get('/orders', [OrderController::class, 'myOrders']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);

    // Orders - Business Owner
    Route::middleware('role:business_owner')->group(function () {
        Route::get('/owner/orders', [OrderController::class, 'ownerOrders']);
        Route::post('/owner/orders/{order}/verify', [OrderController::class, 'verify']);
        Route::post('/owner/orders/{order}/status', [OrderController::class, 'updateStatus']);
    });

    // Orders - Employee
    Route::middleware('role:employee')->group(function () {
        Route::post('/employee/orders/{order}/verify', [OrderController::class, 'verify']);
        Route::post('/employee/orders/{order}/status', [OrderController::class, 'updateStatus']);
    });

    // Receipt
    Route::get('/orders/{order}/receipt', [ReceiptController::class, 'generate']);

    // Barcode
    Route::get('/products/{product}/barcode', [BarcodeController::class, 'generate']);
    Route::post('/barcodes/order', [BarcodeController::class, 'generateForOrder']);

    // Export
    Route::middleware('role:business_owner')->prefix('owner')->group(function () {
        Route::get('/businesses/{business}/export/products', [ExportController::class, 'products']);
        Route::get('/businesses/{business}/export/orders', [ExportController::class, 'orders']);
        Route::get('/businesses/{business}/export/expenses', [ExportController::class, 'expenses']);
    });
});
