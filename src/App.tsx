import { useState } from 'react';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage'; // ✅ เพิ่มเข้ามา
import MainLayout from './components/MainLayout';
import { Toaster } from './components/ui/sonner';
import { CompanySettingsProvider } from './contexts/CompanySettingsContext';

export type UserRole = 'admin' | 'account' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
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

  // 🔄 ถ้ามี user -> แสดงหน้า MainLayout
  if (currentUser) {
    return (
      <CompanySettingsProvider>
        <MainLayout user={currentUser} onLogout={handleLogout} />
        <Toaster />
      </CompanySettingsProvider>
    );
  }

  // 🔄 ถ้ายังไม่มี user -> แสดงหน้า Login หรือ Register ตาม state
  return (
    <>
      {showRegister ? (
        <RegisterPage onBackToLogin={() => setShowRegister(false)} />
      ) : (
        <LoginPage onLogin={handleLogin} onShowRegister={() => setShowRegister(true)} />
      )}
      <Toaster />
    </>
  );
}

export default App;
