import { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage'; 
import ReceiptDetailPage from './components/pages/ReceiptDetailPage'; // ✅ เพิ่มเข้ามา
import MainLayout from './components/MainLayout';
import InvoiceDetailPage from './components/pages/InvoiceDetailPage';
import { Toaster } from './components/ui/sonner';
import { CompanySettingsProvider } from './contexts/CompanySettingsContext';

export type UserRole = 'admin' | 'account' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

// Standalone wrapper for invoice detail route
function InvoiceDetailStandalone() {
  const { invoiceId } = useParams();
  
  const invoiceData = localStorage.getItem(`invoice-detail-${invoiceId}`);
  
  if (!invoiceData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>ไม่พบข้อมูลใบแจ้งหนี้</h2>
        <button onClick={() => window.close()}>ปิดหน้าต่าง</button>
      </div>
    );
  }
  
  const invoice = JSON.parse(invoiceData);
  
  return (
    <InvoiceDetailPage 
      invoice={invoice} 
      onClose={() => window.close()} 
    />
  );
}

function ReceiptDetailStandalone() {
  const { receiptId } = useParams();
  
  const receiptData = localStorage.getItem(`receipt-detail${receiptId}`);
  
  if (!receiptData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>ไม่พบข้อมูลใบเสร็จ</h2>
        <button onClick={() => window.close()}>ปิดหน้าต่าง</button>
      </div>
    );
  }
  
  const receipt = JSON.parse(receiptData);
  
  return (
    <ReceiptDetailPage 
      receipt={receipt} 
      onClose={() => window.close()} 
    />
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false); // ✅ state สำหรับสลับหน้า

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <BrowserRouter>
      <CompanySettingsProvider>
        <Routes>
          {/* Public route for invoice detail - can be opened in new tab */}
          <Route 
            path="/invoice/detail/:invoiceId" 
            element={<InvoiceDetailStandalone />} 
          />
          <Route 
            path="/receipt/detail/:receiptId" 
            element={<ReceiptDetailStandalone />} 
          />

          {/* Protected routes */}
          <Route path="/*" element={
            currentUser ? (
              <>
                <MainLayout user={currentUser} onLogout={handleLogout} />
                <Toaster />
              </>
            ) : (
              <>
                {showRegister ? (
                  <RegisterPage onBackToLogin={() => setShowRegister(false)} />
                ) : (
                  <LoginPage onLogin={handleLogin} onShowRegister={() => setShowRegister(true)} />
                )}
                <Toaster />
              </>
            )
          } />
        </Routes>
      </CompanySettingsProvider>
    </BrowserRouter>
  );
}

export default App;
