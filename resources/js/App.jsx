import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TooltipProvider } from './components/ui/tooltip';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';

// Public pages (Phermex-style)
import PublicNavbar from './mtai-public/components/Navbar';
import PublicFooter from './mtai-public/components/Footer';
import PublicHomePage from './mtai-public/pages/HomePage';
import PublicAboutPage from './mtai-public/pages/AboutPage';
import PublicProductsPage from './mtai-public/pages/ProductsPage';
import PublicFAQPage from './mtai-public/pages/FAQPage';
import PublicContactPage from './mtai-public/pages/ContactPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterTypePage from './pages/auth/RegisterTypePage';
import RegisterCustomerPage from './pages/auth/RegisterCustomerPage';
import RegisterSellerPage from './pages/auth/RegisterSellerPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard pages
import AdminDashboard from './pages/admin/AdminDashboard';
import OwnerDashboard from './pages/dashboards/OwnerDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import TransporterDashboard from './pages/dashboards/TransporterDashboard';

// Owner pages
import BusinessListPage from './pages/owner/BusinessListPage';
import BusinessFormPage from './pages/owner/BusinessFormPage';
import BusinessDetailPage from './pages/owner/BusinessDetailPage';
import ProductListPage from './pages/owner/ProductListPage';
import ProductFormPage from './pages/owner/ProductFormPage';
import ProductDetailPage from './pages/owner/ProductDetailPage';
import CategoryListPage from './pages/owner/CategoryListPage';
import OwnerOrderListPage from './pages/owner/OrderListPage';
import OwnerOrderDetailPage from './pages/owner/OrderDetailPage';
import StockPage from './pages/owner/StockPage';
import ReportPage from './pages/owner/ReportPage';
import ExpensePage from './pages/owner/ExpensePage';
import CustomerListPage from './pages/owner/CustomerListPage';
import EmployeeListPage from './pages/owner/EmployeeListPage';
import LoanListPage from './pages/owner/LoanListPage';
import OwnerDeliveryListPage from './pages/owner/DeliveryListPage';
import TransporterDeliveryListPage from './pages/transporter/DeliveryListPage';
import SettingsPage from './pages/owner/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationListPage from './pages/owner/NotificationListPage';
import CouponListPage from './pages/owner/CouponListPage';
import CreditSalesPage from './pages/owner/CreditSalesPage';
import ImportGoodsPage from './pages/owner/ImportGoodsPage';
import InvestmentPage from './pages/owner/InvestmentPage';
import BarcodePage from './pages/owner/BarcodePage';
import ExportPage from './pages/owner/ExportPage';
import ReceiptPage from './pages/owner/ReceiptPage';
import ProjectListPage from './pages/owner/ProjectListPage';

// Admin pages
import AdminShopsPage from './pages/admin/AdminShopsPage';
import AdminShopShowPage from './pages/admin/AdminShopShowPage';
import AdminShopFormPage from './pages/admin/AdminShopFormPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserShowPage from './pages/admin/AdminUserShowPage';
import AdminUserFormPage from './pages/admin/AdminUserFormPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminAnnouncementShowPage from './pages/admin/AdminAnnouncementShowPage';
import AdminAnnouncementFormPage from './pages/admin/AdminAnnouncementFormPage';
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage';
import AdminSubscriptionShowPage from './pages/admin/AdminSubscriptionShowPage';
import AdminSubscriptionFormPage from './pages/admin/AdminSubscriptionFormPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderShowPage from './pages/admin/AdminOrderShowPage';
import AdminOrderFormPage from './pages/admin/AdminOrderFormPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminFinancePage from './pages/admin/AdminFinancePage';
import AdminHRPage from './pages/admin/AdminHRPage';
import AdminDeliveriesPage from './pages/admin/AdminDeliveriesPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Finance pages
import ChartOfAccountsPage from './pages/finance/ChartOfAccountsPage';
import JournalEntriesPage from './pages/finance/JournalEntriesPage';
import InvoicesPage from './pages/finance/InvoicesPage';
import BillsPage from './pages/finance/BillsPage';
import BankAccountsPage from './pages/finance/BankAccountsPage';
import FinanceReportsPage from './pages/finance/FinanceReportsPage';
import BudgetsPage from './pages/finance/BudgetsPage';
import TaxSettingsPage from './pages/finance/TaxSettingsPage';
import GeneralLedgerPage from './pages/finance/GeneralLedgerPage';
import CostCentersPage from './pages/finance/CostCentersPage';
import FixedAssetsPage from './pages/finance/FixedAssetsPage';
import FiscalPeriodsPage from './pages/finance/FiscalPeriodsPage';
import CurrencyPage from './pages/finance/CurrencyPage';

// HR pages
import EmployeeDirectoryPage from './pages/hr/EmployeeDirectoryPage';
import AttendancePage from './pages/hr/AttendancePage';
import LeaveManagementPage from './pages/hr/LeaveManagementPage';
import PayrollPage from './pages/hr/PayrollPage';
import PerformancePage from './pages/hr/PerformancePage';
import RecruitmentPage from './pages/hr/RecruitmentPage';
import TrainingPage from './pages/hr/TrainingPage';
import BenefitsPage from './pages/hr/BenefitsPage';

// Purchase pages
import SuppliersPage from './pages/purchases/SuppliersPage';
import PurchaseOrdersPage from './pages/purchases/PurchaseOrdersPage';
import SupplierPaymentsPage from './pages/purchases/SupplierPaymentsPage';
import PurchaseReceptionsPage from './pages/purchases/PurchaseReceptionsPage';
import SupplierInvoicesPage from './pages/purchases/SupplierInvoicesPage';
import PurchaseReturnsPage from './pages/purchases/PurchaseReturnsPage';
import SupplierPriceListsPage from './pages/purchases/SupplierPriceListsPage';

// Finance standalone pages
import BankReconciliationPage from './pages/finance/BankReconciliationPage';

// CRM, Manufacturing, Warehouse pages
import CrmPage from './pages/owner/CrmPage';
import ManufacturingPage from './pages/owner/ManufacturingPage';
import WarehousePage from './pages/owner/WarehousePage';

// Employee pages
import EmployeeCustomersPage from './pages/employee/EmployeeCustomersPage';
import EmployeeInventoryPage from './pages/employee/EmployeeInventoryPage';
import EmployeeExpensesPage from './pages/employee/EmployeeExpensesPage';
import EmployeeDeliveriesPage from './pages/employee/EmployeeDeliveriesPage';

// Customer pages
import ShopSearchPage from './pages/customer/ShopSearchPage';
import ShopDetailPage from './pages/customer/ShopDetailPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import CustomerOrderDetailPage from './pages/customer/OrderDetailPage';
import CustomerDeliveriesPage from './pages/customer/CustomerDeliveriesPage';
import WishlistPage from './pages/customer/WishlistPage';
import ReviewFormPage from './pages/customer/ReviewFormPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

    return <DashboardLayout>{children}</DashboardLayout>;
}

function GuestRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (user) {
        const dashboards = {
            admin: '/admin/dashboard',
            business_owner: '/owner/dashboard',
            employee: '/employee/dashboard',
            customer: '/customer/dashboard',
            transporter: '/transporter/dashboard',
        };
        return <Navigate to={dashboards[user.role] || '/'} />;
    }

    return children;
}

function PublicLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <PublicNavbar />
            <main className="flex-1 pt-[72px]">{children}</main>
            <PublicFooter />
        </div>
    );
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Phermex-style routes */}
            <Route path="/" element={<PublicLayout><PublicHomePage /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><PublicAboutPage /></PublicLayout>} />
            <Route path="/products" element={<PublicLayout><PublicProductsPage /></PublicLayout>} />
            <Route path="/faq" element={<PublicLayout><PublicFAQPage /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><PublicContactPage /></PublicLayout>} />

            {/* Auth routes */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterTypePage /></GuestRoute>} />
            <Route path="/register/customer" element={<GuestRoute><RegisterCustomerPage /></GuestRoute>} />
            <Route path="/register/seller" element={<GuestRoute><RegisterSellerPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

            <Route
                path="/admin/dashboard"
                element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>}
            />
            <Route path="/admin/shops" element={<ProtectedRoute roles={['admin']}><AdminShopsPage /></ProtectedRoute>} />
            <Route path="/admin/shops/new" element={<ProtectedRoute roles={['admin']}><AdminShopFormPage /></ProtectedRoute>} />
            <Route path="/admin/shops/:id" element={<ProtectedRoute roles={['admin']}><AdminShopShowPage /></ProtectedRoute>} />
            <Route path="/admin/shops/:id/edit" element={<ProtectedRoute roles={['admin']}><AdminShopFormPage /></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/customers/new" element={<ProtectedRoute roles={['admin']}><AdminUserFormPage /></ProtectedRoute>} />
            <Route path="/admin/customers/:id" element={<ProtectedRoute roles={['admin']}><AdminUserShowPage /></ProtectedRoute>} />
            <Route path="/admin/customers/:id/edit" element={<ProtectedRoute roles={['admin']}><AdminUserFormPage /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute roles={['admin']}><AdminAnnouncementsPage /></ProtectedRoute>} />
            <Route path="/admin/announcements/new" element={<ProtectedRoute roles={['admin']}><AdminAnnouncementFormPage /></ProtectedRoute>} />
            <Route path="/admin/announcements/:id" element={<ProtectedRoute roles={['admin']}><AdminAnnouncementShowPage /></ProtectedRoute>} />
            <Route path="/admin/announcements/:id/edit" element={<ProtectedRoute roles={['admin']}><AdminAnnouncementFormPage /></ProtectedRoute>} />
            <Route path="/admin/subscriptions" element={<ProtectedRoute roles={['admin']}><AdminSubscriptionsPage /></ProtectedRoute>} />
            <Route path="/admin/subscriptions/new" element={<ProtectedRoute roles={['admin']}><AdminSubscriptionFormPage /></ProtectedRoute>} />
            <Route path="/admin/subscriptions/:id" element={<ProtectedRoute roles={['admin']}><AdminSubscriptionShowPage /></ProtectedRoute>} />
            <Route path="/admin/subscriptions/:id/edit" element={<ProtectedRoute roles={['admin']}><AdminSubscriptionFormPage /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrdersPage /></ProtectedRoute>} />
            <Route path="/admin/orders/:id" element={<ProtectedRoute roles={['admin']}><AdminOrderShowPage /></ProtectedRoute>} />
            <Route path="/admin/orders/:id/edit" element={<ProtectedRoute roles={['admin']}><AdminOrderFormPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReportsPage /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AdminAuditLogsPage /></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute roles={['admin']}><AdminFinancePage /></ProtectedRoute>} />
            <Route path="/admin/hr" element={<ProtectedRoute roles={['admin']}><AdminHRPage /></ProtectedRoute>} />
            <Route path="/admin/deliveries" element={<ProtectedRoute roles={['admin']}><AdminDeliveriesPage /></ProtectedRoute>} />
            <Route path="/admin/promotions" element={<ProtectedRoute roles={['admin']}><AdminPromotionsPage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute roles={['admin']}><ProfilePage /></ProtectedRoute>} />
            <Route
                path="/owner/dashboard"
                element={<ProtectedRoute roles={['business_owner']}><OwnerDashboard /></ProtectedRoute>}
            />
            {/* Owner - Business Routes */}
            <Route path="/owner/businesses" element={<ProtectedRoute roles={['business_owner']}><BusinessListPage /></ProtectedRoute>} />
            <Route path="/owner/businesses/new" element={<ProtectedRoute roles={['business_owner']}><BusinessFormPage /></ProtectedRoute>} />
            <Route path="/owner/businesses/:id" element={<ProtectedRoute roles={['business_owner']}><BusinessDetailPage /></ProtectedRoute>} />
            <Route path="/owner/businesses/:id/edit" element={<ProtectedRoute roles={['business_owner']}><BusinessFormPage /></ProtectedRoute>} />

            {/* Owner - Product Routes */}
            <Route path="/owner/products" element={<ProtectedRoute roles={['business_owner']}><ProductListPage /></ProtectedRoute>} />
            <Route path="/owner/products/new" element={<ProtectedRoute roles={['business_owner']}><ProductFormPage /></ProtectedRoute>} />
            <Route path="/owner/products/:id" element={<ProtectedRoute roles={['business_owner']}><ProductDetailPage /></ProtectedRoute>} />
            <Route path="/owner/products/:id/edit" element={<ProtectedRoute roles={['business_owner']}><ProductFormPage /></ProtectedRoute>} />

            {/* Owner - Category Routes */}
            <Route path="/owner/categories" element={<ProtectedRoute roles={['business_owner']}><CategoryListPage /></ProtectedRoute>} />

            {/* Owner - Order Routes */}
            <Route path="/owner/orders" element={<ProtectedRoute roles={['business_owner']}><OwnerOrderListPage /></ProtectedRoute>} />
            <Route path="/owner/orders/:id" element={<ProtectedRoute roles={['business_owner']}><OwnerOrderDetailPage /></ProtectedRoute>} />

            {/* Owner - Phase 4 Routes */}
            <Route path="/owner/inventory" element={<ProtectedRoute roles={['business_owner']}><StockPage /></ProtectedRoute>} />
            <Route path="/owner/reports" element={<ProtectedRoute roles={['business_owner']}><ReportPage /></ProtectedRoute>} />
            <Route path="/owner/expenses" element={<ProtectedRoute roles={['business_owner']}><ExpensePage /></ProtectedRoute>} />

            {/* Owner - Phase 5 Routes */}
            <Route path="/owner/customers" element={<ProtectedRoute roles={['business_owner']}><CustomerListPage /></ProtectedRoute>} />
            <Route path="/owner/employees" element={<ProtectedRoute roles={['business_owner']}><EmployeeListPage /></ProtectedRoute>} />
            <Route path="/owner/loans" element={<ProtectedRoute roles={['business_owner']}><LoanListPage /></ProtectedRoute>} />

            {/* Owner - Phase 6 Routes */}
            <Route path="/owner/deliveries" element={<ProtectedRoute roles={['business_owner']}><OwnerDeliveryListPage /></ProtectedRoute>} />

            {/* Owner - Phase 7 Routes */}
            <Route path="/owner/credit-sales" element={<ProtectedRoute roles={['business_owner']}><CreditSalesPage /></ProtectedRoute>} />
            <Route path="/owner/imports" element={<ProtectedRoute roles={['business_owner']}><ImportGoodsPage /></ProtectedRoute>} />
            <Route path="/owner/investments" element={<ProtectedRoute roles={['business_owner']}><InvestmentPage /></ProtectedRoute>} />
            <Route path="/owner/settings" element={<ProtectedRoute roles={['business_owner']}><SettingsPage /></ProtectedRoute>} />
            <Route path="/owner/notifications" element={<ProtectedRoute roles={['business_owner']}><NotificationListPage /></ProtectedRoute>} />
            <Route path="/owner/coupons" element={<ProtectedRoute roles={['business_owner']}><CouponListPage /></ProtectedRoute>} />
            <Route path="/owner/projects" element={<ProtectedRoute roles={['business_owner']}><ProjectListPage /></ProtectedRoute>}
            />
            <Route path="/owner/profile" element={<ProtectedRoute roles={['business_owner']}><ProfilePage /></ProtectedRoute>} />

            {/* Owner - Tools Routes */}
            <Route path="/owner/barcodes" element={<ProtectedRoute roles={['business_owner']}><BarcodePage /></ProtectedRoute>} />
            <Route path="/owner/export" element={<ProtectedRoute roles={['business_owner']}><ExportPage /></ProtectedRoute>} />
            <Route path="/owner/receipts" element={<ProtectedRoute roles={['business_owner']}><ReceiptPage /></ProtectedRoute>} />

            {/* Owner - Finance Routes */}
            <Route path="/owner/finance/accounts" element={<ProtectedRoute roles={['business_owner', 'admin']}><ChartOfAccountsPage /></ProtectedRoute>} />
            <Route path="/owner/finance/journal" element={<ProtectedRoute roles={['business_owner', 'admin']}><JournalEntriesPage /></ProtectedRoute>} />
            <Route path="/owner/finance/invoices" element={<ProtectedRoute roles={['business_owner', 'admin']}><InvoicesPage /></ProtectedRoute>} />
            <Route path="/owner/finance/bills" element={<ProtectedRoute roles={['business_owner', 'admin']}><BillsPage /></ProtectedRoute>} />
            <Route path="/owner/finance/bank-accounts" element={<ProtectedRoute roles={['business_owner', 'admin']}><BankAccountsPage /></ProtectedRoute>} />
            <Route path="/owner/finance/bank-reconciliations" element={<ProtectedRoute roles={['business_owner', 'admin']}><BankReconciliationPage /></ProtectedRoute>} />
            <Route path="/owner/finance/reports" element={<ProtectedRoute roles={['business_owner', 'admin']}><FinanceReportsPage /></ProtectedRoute>} />
            <Route path="/owner/finance/budgets" element={<ProtectedRoute roles={['business_owner', 'admin']}><BudgetsPage /></ProtectedRoute>} />
            <Route path="/owner/finance/tax-settings" element={<ProtectedRoute roles={['business_owner', 'admin']}><TaxSettingsPage /></ProtectedRoute>} />
            <Route path="/owner/finance/general-ledger" element={<ProtectedRoute roles={['business_owner', 'admin']}><GeneralLedgerPage /></ProtectedRoute>} />
            <Route path="/owner/finance/cost-centers" element={<ProtectedRoute roles={['business_owner', 'admin']}><CostCentersPage /></ProtectedRoute>} />
            <Route path="/owner/finance/fixed-assets" element={<ProtectedRoute roles={['business_owner', 'admin']}><FixedAssetsPage /></ProtectedRoute>} />
            <Route path="/owner/finance/fiscal-periods" element={<ProtectedRoute roles={['business_owner', 'admin']}><FiscalPeriodsPage /></ProtectedRoute>} />
            <Route path="/owner/finance/currencies" element={<ProtectedRoute roles={['business_owner', 'admin']}><CurrencyPage /></ProtectedRoute>} />

            {/* Owner - HR Routes */}
            <Route path="/owner/hr/employees" element={<ProtectedRoute roles={['business_owner', 'admin']}><EmployeeDirectoryPage /></ProtectedRoute>} />
            <Route path="/owner/hr/attendance" element={<ProtectedRoute roles={['business_owner', 'admin']}><AttendancePage /></ProtectedRoute>} />
            <Route path="/owner/hr/leave" element={<ProtectedRoute roles={['business_owner', 'admin']}><LeaveManagementPage /></ProtectedRoute>} />
            <Route path="/owner/hr/payroll" element={<ProtectedRoute roles={['business_owner', 'admin']}><PayrollPage /></ProtectedRoute>} />
            <Route path="/owner/hr/performance" element={<ProtectedRoute roles={['business_owner', 'admin']}><PerformancePage /></ProtectedRoute>} />
            <Route path="/owner/hr/recruitment" element={<ProtectedRoute roles={['business_owner', 'admin']}><RecruitmentPage /></ProtectedRoute>} />
            <Route path="/owner/hr/training" element={<ProtectedRoute roles={['business_owner', 'admin']}><TrainingPage /></ProtectedRoute>} />
            <Route path="/owner/hr/benefits" element={<ProtectedRoute roles={['business_owner', 'admin']}><BenefitsPage /></ProtectedRoute>} />

            {/* Owner - CRM, Manufacturing, Warehouse Routes */}
            <Route path="/owner/crm" element={<ProtectedRoute roles={['business_owner', 'admin']}><CrmPage /></ProtectedRoute>} />
            <Route path="/owner/manufacturing" element={<ProtectedRoute roles={['business_owner', 'admin']}><ManufacturingPage /></ProtectedRoute>} />
            <Route path="/owner/warehouses" element={<ProtectedRoute roles={['business_owner', 'admin']}><WarehousePage /></ProtectedRoute>} />

            {/* Owner - Purchase Routes */}
            <Route path="/owner/purchases/suppliers" element={<ProtectedRoute roles={['business_owner', 'admin']}><SuppliersPage /></ProtectedRoute>} />
            <Route path="/owner/purchases/orders" element={<ProtectedRoute roles={['business_owner', 'admin']}><PurchaseOrdersPage /></ProtectedRoute>} />
            <Route path="/owner/purchases/payments" element={<ProtectedRoute roles={['business_owner', 'admin']}><SupplierPaymentsPage /></ProtectedRoute>} />
            <Route path="/owner/purchases/receptions" element={<ProtectedRoute roles={['business_owner', 'admin']}><PurchaseReceptionsPage /></ProtectedRoute>} />
            <Route path="/owner/purchases/invoices" element={<ProtectedRoute roles={['business_owner', 'admin']}><SupplierInvoicesPage /></ProtectedRoute>} />
            <Route path="/owner/purchases/returns" element={<ProtectedRoute roles={['business_owner', 'admin']}><PurchaseReturnsPage /></ProtectedRoute>} />
            <Route path="/owner/purchases/price-lists" element={<ProtectedRoute roles={['business_owner', 'admin']}><SupplierPriceListsPage /></ProtectedRoute>} />

            {/* Employee Routes */}
            <Route
                path="/employee/dashboard"
                element={<ProtectedRoute roles={['employee']}><EmployeeDashboard /></ProtectedRoute>}
            />
            <Route path="/employee/customers" element={<ProtectedRoute roles={['employee']}><EmployeeCustomersPage /></ProtectedRoute>} />
            <Route path="/employee/inventory" element={<ProtectedRoute roles={['employee']}><EmployeeInventoryPage /></ProtectedRoute>} />
            <Route path="/employee/expenses" element={<ProtectedRoute roles={['employee']}><EmployeeExpensesPage /></ProtectedRoute>} />
            <Route path="/employee/deliveries" element={<ProtectedRoute roles={['employee']}><EmployeeDeliveriesPage /></ProtectedRoute>} />
            <Route path="/employee/profile" element={<ProtectedRoute roles={['employee']}><ProfilePage /></ProtectedRoute>} />

            {/* Customer Routes */}
            <Route path="/customer/dashboard" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/customer/shops" element={<ProtectedRoute roles={['customer']}><ShopSearchPage /></ProtectedRoute>} />
            <Route path="/customer/shops/:id" element={<ProtectedRoute roles={['customer']}><ShopDetailPage /></ProtectedRoute>} />
            <Route path="/customer/cart" element={<ProtectedRoute roles={['customer']}><CartPage /></ProtectedRoute>} />
            <Route path="/customer/checkout" element={<ProtectedRoute roles={['customer']}><CheckoutPage /></ProtectedRoute>} />
            <Route path="/customer/orders" element={<ProtectedRoute roles={['customer']}><OrderHistoryPage /></ProtectedRoute>} />
            <Route path="/customer/orders/:id" element={<ProtectedRoute roles={['customer']}><CustomerOrderDetailPage /></ProtectedRoute>} />
            <Route path="/customer/deliveries" element={<ProtectedRoute roles={['customer']}><CustomerDeliveriesPage /></ProtectedRoute>} />
            <Route path="/customer/wishlist" element={<ProtectedRoute roles={['customer']}><WishlistPage /></ProtectedRoute>} />
            <Route path="/customer/reviews/:productId" element={<ProtectedRoute roles={['customer']}><ReviewFormPage /></ProtectedRoute>} />
            <Route path="/customer/profile" element={<ProtectedRoute roles={['customer']}><ProfilePage /></ProtectedRoute>} />

            {/* Transporter Routes */}
            <Route
                path="/transporter/dashboard"
                element={<ProtectedRoute roles={['transporter']}><TransporterDashboard /></ProtectedRoute>}
            />
            <Route path="/transporter/deliveries" element={<ProtectedRoute roles={['transporter']}><TransporterDeliveryListPage /></ProtectedRoute>} />
            <Route path="/transporter/profile" element={<ProtectedRoute roles={['transporter']}><ProfilePage /></ProtectedRoute>} />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default function App() {
    return (
        <TooltipProvider>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </TooltipProvider>
    );
}
