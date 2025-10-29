import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

interface RegisterPageProps {
  onBackToLogin: () => void;
}

export default function RegisterPage({ onBackToLogin }: RegisterPageProps) {
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
 

  // ✅ ฟังก์ชันส่งข้อมูลสมัครสมาชิกไป Backend Laravel
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      const axios = (await import('axios')).default;
      const response = await axios.post("http://127.0.0.1:8000/api/register", {
        username,
        fullname,
        email,
        password,
      });

      if (response.data.status === "success") {
        toast.success("สมัครสมาชิกสำเร็จ!");
        console.log("สมัครสมาชิกสำเร็จ:", response.data);
        onBackToLogin(); // ✅ กลับหน้า Login
      } else {
        toast.error(response.data.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      }
    } catch (error: any) {
      console.error("Error:", error);
      if (error.response) {
        toast.error(error.response.data.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      } else if (error.request) {
        toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      } else {
        toast.error("เกิดข้อผิดพลาด: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md mx-4 bg-white border border-gray-200 shadow-md p-8 rounded-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <CardTitle>สมัครสมาชิก</CardTitle>
          <CardDescription>กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีใหม่</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
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
              <Label htmlFor="fullname">ชื่อ-นามสกุล</Label>
              <Input
                id="fullname"
                type="text"
                placeholder="กรอกชื่อ-นามสกุล"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="กรอกอีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

          
           

            <Button type="submit" className="w-full mt-4">
              สมัครสมาชิก
            </Button>
          </form>

          {/* 🔹 ปุ่มกลับไปหน้า Login */}
          <p className="text-sm text-center text-gray-500 mt-4">
            มีบัญชีอยู่แล้ว?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onBackToLogin();
              }}
              className="text-blue-600 hover:underline"
            >
              เข้าสู่ระบบ
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
