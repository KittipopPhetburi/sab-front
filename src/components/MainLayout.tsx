import { useState } from 'react';
import type { User } from '../types';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  FileCheck,
  Receipt,
  Calculator,
  CreditCard,
  Wallet,
  Users,
  FolderTree,
  Package,
  Building,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import DashboardPage from './pages/DashboardPage';
import QuotationPage from './pages/QuotationPage';
import PurchaseOrderPage from './pages/PurchaseOrderPage';
import InvoicePage from './pages/InvoicePage';
import ReceiptPage from './pages/ReceiptPage';
import PaymentVoucherPage from './pages/PaymentVoucherPage';
import ReceiveVoucherPage from './pages/ReceiveVoucherPage';
import WithholdingTaxPage from './pages/WithholdingTaxPage';
import UsersPage from './pages/UsersPage';
import ProjectPage from './pages/ProjectPage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CustomerPage from './pages/CustomerPage';
import SettingsPage from './pages/SettingsPage';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
}

type PageType =
  | 'dashboard'
  | 'quotation'
  | 'purchase-order'
  | 'invoice'
  | 'receipt'
  | 'payment-voucher'
  | 'receive-voucher'
  | 'withholding-tax'
  | 'users'
  | 'project'
  | 'category'
  | 'product'
  | 'customer'
  | 'settings';

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    {
      title: 'การงานซื้อขาย',
      items: [
        { id: 'dashboard' as PageType, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'quotation' as PageType, label: 'เสนอราคา', icon: FileText },
        { id: 'purchase-order' as PageType, label: 'สั่งซื้อ', icon: ShoppingCart },
        { id: 'invoice' as PageType, label: 'แจ้งหนี้', icon: FileCheck },
        { id: 'receipt' as PageType, label: 'ใบเสร็จรับเงิน/ใบกำกับภาษี', icon: Receipt },
        { id: 'payment-voucher' as PageType, label: 'ใบสำคัญจ่ายเงิน', icon: CreditCard },
        { id: 'receive-voucher' as PageType, label: 'ใบสำคัญรับเงิน', icon: Wallet },
        { id: 'withholding-tax' as PageType, label: 'หัก ณ ที่จ่าย', icon: Calculator },
      ],
    },
    {
      title: 'ข้อมูลหลัก',
      items: [
        { id: 'users' as PageType, label: 'ผู้ใช้งาน', icon: Users },
        { id: 'project' as PageType, label: 'โครงการ', icon: Briefcase },
        { id: 'category' as PageType, label: 'หมวดหมู่สินค้า/บริการ', icon: FolderTree },
        { id: 'product' as PageType, label: 'สินค้าและบริการ', icon: Package },
        { id: 'customer' as PageType, label: 'ลูกค้า/คู่ค้า', icon: Building },
      ],
    },
  ];

  // Add settings menu item for admin only
  if (user.role === 'admin') {
    menuItems.push({
      title: 'ระบบ',
      items: [{ id: 'settings' as PageType, label: 'ตั้งค่าระบบ', icon: Settings }],
    });
  }

  const canAccess = (pageId: PageType) => {
    if (user.role === 'admin') return true;
    if (pageId === 'settings') return false;
    return true;
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage userRole={user.role} />;
      case 'quotation':
        return <QuotationPage userRole={user.role} />;
      case 'purchase-order':
        return <PurchaseOrderPage userRole={user.role} />;
      case 'invoice':
        return <InvoicePage userRole={user.role} />;
      case 'receipt':
        return <ReceiptPage userRole={user.role} />;
      case 'payment-voucher':
        return <PaymentVoucherPage userRole={user.role} />;
      case 'receive-voucher':
        return <ReceiveVoucherPage userRole={user.role} />;
      case 'withholding-tax':
        return <WithholdingTaxPage userRole={user.role} />;
      case 'users':
        return <UsersPage userRole={user.role} />;
      case 'project':
        return <ProjectPage userRole={user.role} />;
      case 'category':
        return <CategoryPage userRole={user.role} />;
      case 'product':
        return <ProductPage userRole={user.role} />;
      case 'customer':
        return <CustomerPage userRole={user.role} />;
      case 'settings':
        return <SettingsPage userRole={user.role} />;
      default:
        return <DashboardPage userRole={user.role} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">ระบบ SAP</h1>
                <p className="text-sm text-gray-500">Management System</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-6">
              {menuItems.map((section, idx) => (
                <div key={idx}>
                  <h3 className="px-3 mb-2 text-xs text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const accessible = canAccess(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => accessible && setCurrentPage(item.id)}
                          disabled={!accessible}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            currentPage === item.id
                              ? 'bg-blue-50 text-blue-600'
                              : accessible
                              ? 'text-gray-700 hover:bg-gray-100'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm">{item.label}</span>
                          {currentPage === item.id && (
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-gray-900">
                  {menuItems
                    .flatMap((s) => s.items)
                    .find((i) => i.id === currentPage)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500">จัดการข้อมูล{menuItems
                    .flatMap((s) => s.items)
                    .find((i) => i.id === currentPage)?.label || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'admin'
                    ? 'ผู้ดูแลระบบ'
                    : user.role === 'account'
                    ? 'เจ้าหน้าที่บัญชี'
                    : 'ผู้ใช้งาน'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">{renderPage()}</div>
      </main>
    </div>
  );
}
