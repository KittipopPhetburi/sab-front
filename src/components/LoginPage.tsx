import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onShowRegister: () => void; // ✅ เพิ่มบรรทัดนี้
}




export default function LoginPage({ onLogin, onShowRegister }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch("http://127.0.0.1:8000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      toast.success(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับคุณ ${data.user.fullname}`);
      onLogin({
        id: data.user.id,
        username: data.user.username,
        name: data.user.fullname,
        role: data.user.role,
      });
    } else {
      toast.error(data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  } catch (error) {
    console.error("Error:", error);
    toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  }
};
  

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md mx-4 bg-white border border-gray-200 shadow-md p-8 rounded-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <CardTitle>ระบบ SAP</CardTitle>
          <CardDescription>กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                type="text"
                placeholder="กรอกชื่อผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">เข้าสู่ระบบ</Button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            ยังไม่มีบัญชี?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onShowRegister(); // ✅ เรียกฟังก์ชันจาก App
              }}
              className="text-blue-600 hover:underline"
            >
              สมัครสมาชิก
            </a>
          </p>

          
        </CardContent>
      </Card>
    </div>
  );
}
