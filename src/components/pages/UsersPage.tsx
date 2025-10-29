import { useState, useEffect } from 'react';
import type { UserRole } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { userService } from '../../services/userService';
import type { User as ApiUser } from '../../services/userService';

interface UsersPageProps {
  userRole: UserRole;
}

export default function UsersPage({ userRole }: UsersPageProps) {
  const [data, setData] = useState<ApiUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApiUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    role: 'user' as UserRole,
    password: '',
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // ✅ โหลดข้อมูลผู้ใช้งานจาก Laravel API
  const fetchUsers = async () => {
    try {
      const users = await userService.getAll();
      setData(users);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('โหลดข้อมูลผู้ใช้ล้มเหลว');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ เพิ่มผู้ใช้งานใหม่
  const handleAdd = async () => {
    try {
      await userService.create({
        username: formData.username,
        fullname: formData.fullname,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      toast.success('เพิ่มผู้ใช้งานสำเร็จ');
      setIsAddDialogOpen(false);

      // ล้างค่าในฟอร์ม
      setFormData({
        username: '',
        fullname: '',
        email: '',
        role: 'user',
        password: '',
      });

      // โหลดข้อมูลผู้ใช้ใหม่
      await fetchUsers();
    } catch (err) {
      console.error('เพิ่มผู้ใช้งานไม่สำเร็จ:', err);
      toast.error('ไม่สามารถเพิ่มผู้ใช้งานได้');
    }
  };

  // ✅ แก้ไขผู้ใช้งาน
  const handleEdit = (item: ApiUser) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setFormData({
      username: item.username,
      fullname: item.fullname,
      email: item.email,
      role: item.role,
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  // ✅ บันทึกการแก้ไข
  const handleUpdate = async () => {
    if (!selectedItem) return;

    try {
      await userService.update(selectedItem.id, {
        username: formData.username,
        fullname: formData.fullname,
        email: formData.email,
        role: formData.role,
        password: formData.password || undefined,
      });

      toast.success('แก้ไขผู้ใช้งานสำเร็จ');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      await fetchUsers();
    } catch (err) {
      console.error('แก้ไขผู้ใช้งานไม่สำเร็จ:', err);
      toast.error('ไม่สามารถอัปเดตข้อมูลได้');
    }
  };

  // ✅ ดูข้อมูลผู้ใช้
  const handleView = (item: ApiUser) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  // ✅ ลบผู้ใช้
  const handleDeleteClick = (item: ApiUser) => {
    if (!canDelete) {
      toast.error('คุณไม่มีสิทธิ์ลบข้อมูล');
      return;
    }
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await userService.delete(selectedItem.id);
      toast.success(`ลบผู้ใช้งาน ${selectedItem.fullname} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      await fetchUsers();
    } catch (err) {
      console.error('ลบผู้ใช้งานไม่สำเร็จ:', err);
      toast.error('ไม่สามารถลบข้อมูลได้');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const roleNames = {
      admin: 'ผู้ดูแลระบบ',
      account: 'เจ้าหน้าที่บัญชี',
      user: 'ผู้ใช้งาน',
    };
    return <Badge>{roleNames[role]}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary'> = {
      active: 'default',
      inactive: 'secondary',
    };
    return <Badge variant={variants[status]}>{status === 'active' ? 'ใช้งาน' : 'ระงับ'}</Badge>;
  };

  const filteredData = data.filter(
    (item) =>
      item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการผู้ใช้งาน</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มผู้ใช้งาน
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="ค้นหาชื่อผู้ใช้, อีเมล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้งาน</TableHead>
                <TableHead>ชื่อผู้ใช้</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="text-blue-600 bg-blue-100">
                          {item.fullname.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{item.fullname}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.username}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{getRoleBadge(item.role)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        disabled={!canEdit}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(item)}
                        disabled={!canDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Add User */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลผู้ใช้งาน</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อผู้ใช้</Label>
              <Input
                placeholder="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ชื่อ-นามสกุล</Label>
              <Input
                placeholder="ชื่อ นามสกุล"
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>รหัสผ่าน</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>บทบาท</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  <SelectItem value="account">เจ้าหน้าที่บัญชี</SelectItem>
                  <SelectItem value="user">ผู้ใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleAdd}>บันทึก</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit User */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>แก้ไขผู้ใช้งาน</DialogTitle>
            <DialogDescription>แก้ไขข้อมูล {selectedItem?.fullname}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อผู้ใช้</Label>
              <Input
                placeholder="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ชื่อ-นามสกุล</Label>
              <Input
                placeholder="ชื่อ นามสกุล"
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>รหัสผ่านใหม่ (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>บทบาท</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  <SelectItem value="account">เจ้าหน้าที่บัญชี</SelectItem>
                  <SelectItem value="user">ผู้ใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleUpdate}>บันทึกการเปลี่ยนแปลง</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: View User */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>รายละเอียดผู้ใช้งาน</DialogTitle>
            <DialogDescription>{selectedItem?.username}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-xl text-blue-600 bg-blue-100">
                    {selectedItem.fullname.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedItem.fullname}</p>
                  <p className="text-sm text-gray-500">@{selectedItem.username}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">อีเมล</Label>
                <p className="mt-1">{selectedItem.email}</p>
              </div>
              <div>
                <Label className="text-gray-500">บทบาท</Label>
                <div className="mt-1">{getRoleBadge(selectedItem.role)}</div>
              </div>
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsViewDialogOpen(false)}>ปิด</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirm Delete */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน “{selectedItem?.fullname}”? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
