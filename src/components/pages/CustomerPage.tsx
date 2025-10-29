import { useState, useEffect } from 'react';
import type { UserRole } from '../../types';
import { customerService } from '../../services/customerService';
import type { Customer as ApiCustomer } from '../../services/customerService';
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
import { Plus, Edit, Trash2, Eye, Search, Building, Users, Handshake, UserCheck, UserX } from 'lucide-react';
import { Badge } from '../ui/badge';
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
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';

interface CustomerPageProps {
  userRole: UserRole;
}

export default function CustomerPage({ userRole }: CustomerPageProps) {
  const [data, setData] = useState<ApiCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApiCustomer | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ลูกค้า' as 'ลูกค้า' | 'คู่ค้า' | 'ทั้งคู่ค้าและลูกค้า',
    branchName: '',
    taxId: '',
    contactPerson: '',
    contact: '',
    email: '',
    address: '',
    note: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    status: true,
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const customers = await customerService.getAll();
      setData(customers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('ไม่สามารถโหลดข้อมูลลูกค้าได้');
    }
  };

  const generateNextCode = () => {
    if (data.length === 0) {
      return 'CUS-0001';
    }

    // หารหัสที่มี CUS- เท่านั้น
    const cusCodes = data
      .filter(c => c.code.startsWith('CUS-'))
      .map(c => {
        const num = parseInt(c.code.replace('CUS-', ''));
        return isNaN(num) ? 0 : num;
      });

    const maxNum = cusCodes.length > 0 ? Math.max(...cusCodes) : 0;
    const nextNum = maxNum + 1;
    return `CUS-${String(nextNum).padStart(4, '0')}`;
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('กรุณากรอกชื่อลูกค้า/คู่ค้า');
    }

    if (!formData.type) {
      errors.push('กรุณาเลือกประเภท (ลูกค้า/คู่ค้า/ทั้งคู่)');
    }

    if (!formData.contact.trim()) {
      errors.push('กรุณากรอกเบอร์โทรศัพท์');
    } else if (!/^[0-9]{9,10}$/.test(formData.contact.replace(/-/g, ''))) {
      errors.push('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('รูปแบบอีเมลไม่ถูกต้อง');
    }

    if (formData.taxId && formData.taxId.trim()) {
      const taxIdClean = formData.taxId.replace(/-/g, '');
      if (!/^[0-9]{13}$/.test(taxIdClean)) {
        errors.push('เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง (ต้องเป็นตัวเลข 13 หลัก)');
      }
    }

    if (!formData.address.trim()) {
      errors.push('กรุณากรอกที่อยู่');
    }

    return errors;
  };

  const handleAdd = async () => {
    try {
      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error));
        return;
      }

      // Ensure we have a code
      const codeToUse = formData.code || generateNextCode();

      await customerService.create({
        code: codeToUse,
        name: formData.name,
        type: formData.type,
        branch_name: formData.branchName,
        tax_id: formData.taxId,
        contact_person: formData.contactPerson,
        phone: formData.contact,
        email: formData.email,
        address: formData.address,
        note: formData.note,
        account_name: formData.accountName,
        bank_account: formData.accountNumber,
        bank_name: formData.bankName,
        status: formData.status ? 'active' : 'inactive',
      });
      toast.success('เพิ่มลูกค้า/คู่ค้าสำเร็จ');
      setIsAddDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error(error);
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response;
        const errorMessage = response?.data?.message || 'ไม่สามารถเพิ่มลูกค้าได้';
        const errorDetails = response?.data?.errors;

        if (errorDetails) {
          Object.values(errorDetails).flat().forEach((msg) => toast.error(msg));
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('ไม่สามารถเพิ่มลูกค้าได้');
      }
    }
  };

  const handleEdit = (item: ApiCustomer) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type as 'ลูกค้า' | 'คู่ค้า' | 'ทั้งคู่ค้าและลูกค้า',
      branchName: item.branch_name || '',
      taxId: item.tax_id || '',
      contactPerson: item.contact_person || '',
      contact: item.phone,
      email: item.email,
      address: item.address || '',
      note: item.note || '',
      accountName: item.account_name || '',
      accountNumber: item.bank_account || '',
      bankName: item.bank_name || '',
      status: item.status === 'active',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    try {
      await customerService.update(selectedItem.id, {
        code: formData.code,
        name: formData.name,
        type: formData.type as 'ลูกค้า' | 'คู่ค้า' | 'ทั้งคู่ค้าและลูกค้า',
        branch_name: formData.branchName,
        tax_id: formData.taxId,
        contact_person: formData.contactPerson,
        phone: formData.contact,
        email: formData.email,
        address: formData.address,
        note: formData.note,
        account_name: formData.accountName,
        bank_account: formData.accountNumber,
        bank_name: formData.bankName,
        status: formData.status ? 'active' : 'inactive',
      });
      toast.success('อัปเดตลูกค้าสำเร็จ');
      setIsEditDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error(error);
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response;
        const errorMessage = response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้';
        const errorDetails = response?.data?.errors;

        if (errorDetails) {
          Object.values(errorDetails).flat().forEach((msg) => toast.error(msg));
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('ไม่สามารถอัปเดตข้อมูลได้');
      }
    }
  };

  const handleView = (item: ApiCustomer) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: ApiCustomer) => {
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
      await customerService.delete(selectedItem.id);
      toast.success(`ลบลูกค้า/คู่ค้า ${selectedItem.name} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถลบลูกค้าได้');
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'ลูกค้า': 'default',
      'คู่ค้า': 'secondary',
      'ทั้งคู่ค้าและลูกค้า': 'outline',
    };
    return <Badge variant={variants[type]}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary'> = {
      active: 'default',
      inactive: 'secondary',
    };
    return <Badge variant={variants[status]}>{status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}</Badge>;
  };

  const filteredData = data.filter(
    (item) =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    ลูกค้า: data.filter((item) => item.type === 'ลูกค้า').length,
    คู่ค้า: data.filter((item) => item.type === 'คู่ค้า').length,
    ทั้งคู่ค้าและลูกค้า: data.filter((item) => item.type === 'ทั้งคู่ค้าและลูกค้า').length,
    ไม่ใช้งาน: data.filter((item) => item.status === 'inactive').length,
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="text-white border-none bg-cyan-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">ลูกค้า</p>
                <p className="mt-2 text-3xl">{stats.ลูกค้า}</p>
              </div>
              <Users className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="text-white border-none bg-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">คู่ค้า</p>
                <p className="mt-2 text-3xl">{stats.คู่ค้า}</p>
              </div>
              <Handshake className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="text-white border-none bg-sky-400">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">ทั้งคู่ค้าและลูกค้า</p>
                <p className="mt-2 text-3xl">{stats.ทั้งคู่ค้าและลูกค้า}</p>
              </div>
              <UserCheck className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="text-white border-none bg-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">ไม่ใช้งาน</p>
                <p className="mt-2 text-3xl">{stats.ไม่ใช้งาน}</p>
              </div>
              <UserX className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ลูกค้า/คู่ค้า</CardTitle>
            <Button onClick={() => {
              const nextCode = generateNextCode();
              setFormData({
                code: nextCode,
                name: '',
                type: 'ลูกค้า',
                taxId: '',
                branchName: '',
                contact: '',
                email: '',
                address: '',
                contactPerson: '',
                note: '',
                accountName: '',
                accountNumber: '',
                bankName: '',
                status: true,
              });
              setIsAddDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มลูกค้า/คู่ค้า
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="ค้นหารหัส, ชื่อ, เบอร์โทร, อีเมล, เลขผู้เสียภาษี..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ผู้ติดต่อ</TableHead>
                <TableHead>เบอร์ติดต่อ</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell>{item.contact_person || '-'}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.email}</TableCell>
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่มลูกค้า/คู่ค้าใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลลูกค้า/คู่ค้า</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>รหัส</Label>
                <Input
                  placeholder="CUS-0001"
                  value={formData.code}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>ประเภท</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'ลูกค้า' | 'คู่ค้า' | 'ทั้งสองอย่าง') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ลูกค้า">ลูกค้า</SelectItem>
                    <SelectItem value="คู่ค้า">คู่ค้า</SelectItem>
                    <SelectItem value="ทั้งสองอย่าง">ทั้งสองอย่าง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ชื่อ</Label>
              <Input
                placeholder="ชื่อบริษัทหรือร้าน"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อสาขา (ถ้ามี)</Label>
                <Input
                  placeholder="เช่น สำนักงานใหญ่"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>เลขประจำตัวผู้เสียภาษี (ถ้ามี)</Label>
                <Input
                  placeholder="0105558123456"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อผู้ติดต่อ (ถ้ามี)</Label>
                <Input
                  placeholder="คุณสมชาย"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>เบอร์ติดต่อ</Label>
                <Input
                  placeholder="02-XXX-XXXX"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
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
              <Label>ที่อยู่ (ถ้ามี)</Label>
              <Textarea
                placeholder="ที่อยู่เต็ม"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>หมายเหตุ (ถ้ามี)</Label>
              <Textarea
                placeholder="หมายเหตุเพิ่มเติม"
                rows={2}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="mb-3">ข้อมูลบัญชีธนาคาร (ถ้ามี)</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ชื่อบัญชี</Label>
                    <Input
                      placeholder="ชื่อบัญชี"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>เลขบัญชี</Label>
                    <Input
                      placeholder="XXX-XXX-XXXX"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ชื่อธนาคาร</Label>
                  <Input
                    placeholder="ธนาคาร..."
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="status-add"
                  checked={formData.status}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked as boolean })}
                />
                <Label htmlFor="status-add" className="cursor-pointer">ใช้งาน</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleAdd}>บันทึก</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขลูกค้า/คู่ค้า</DialogTitle>
            <DialogDescription>แก้ไขข้อมูล {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>รหัส</Label>
                <Input
                  placeholder="CUST-XXX, SUPP-XXX หรือ BOTH-XXX"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ประเภท</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'ลูกค้า' | 'คู่ค้า' | 'ทั้งคู่ค้าและลูกค้า') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ลูกค้า">ลูกค้า</SelectItem>
                    <SelectItem value="คู่ค้า">คู่ค้า</SelectItem>
                    <SelectItem value="ทั้งคู่ค้าและลูกค้า">ทั้งคู่ค้าและลูกค้า</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ชื่อ</Label>
              <Input
                placeholder="ชื่อบริษัทหรือร้าน"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อสาขา (ถ้ามี)</Label>
                <Input
                  placeholder="เช่น สำนักงานใหญ่"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>เลขประจำตัวผู้เสียภาษี (ถ้ามี)</Label>
                <Input
                  placeholder="0105558123456"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อผู้ติดต่อ (ถ้ามี)</Label>
                <Input
                  placeholder="คุณสมชาย"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>เบอร์ติดต่อ</Label>
                <Input
                  placeholder="02-XXX-XXXX"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
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
              <Label>ที่อยู่ (ถ้ามี)</Label>
              <Textarea
                placeholder="ที่อยู่เต็ม"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>หมายเหตุ (ถ้ามี)</Label>
              <Textarea
                placeholder="หมายเหตุเพิ่มเติม"
                rows={2}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="mb-3">ข้อมูลบัญชีธนาคาร (ถ้ามี)</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ชื่อบัญชี</Label>
                    <Input
                      placeholder="ชื่อบัญชี"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>เลขบัญชี</Label>
                    <Input
                      placeholder="XXX-XXX-XXXX"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ชื่อธนาคาร</Label>
                  <Input
                    placeholder="ธนาคาร..."
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="status-edit"
                  checked={formData.status}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked as boolean })}
                />
                <Label htmlFor="status-edit" className="cursor-pointer">ใช้งาน</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleUpdate}>บันทึกการเปลี่ยนแปลง</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดลูกค้า/คู่ค้า</DialogTitle>
            <DialogDescription>{selectedItem?.code}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">รหัส</Label>
                  <p className="mt-1">{selectedItem.code}</p>
                </div>
                <div>
                  <Label className="text-gray-500">ประเภท</Label>
                  <div className="mt-1">{getTypeBadge(selectedItem.type)}</div>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">ชื่อ</Label>
                <p className="mt-1">{selectedItem.name}</p>
              </div>

              {selectedItem.branch_name && (
                <div>
                  <Label className="text-gray-500">ชื่อสาขา</Label>
                  <p className="mt-1">{selectedItem.branch_name}</p>
                </div>
              )}

            {selectedItem?.tax_id && (
  <div>
    <Label className="text-gray-500">เลขประจำตัวผู้เสียภาษี</Label>
    <p className="mt-1">{selectedItem?.tax_id}</p>
  </div>
)}

<div className="grid grid-cols-2 gap-4">
  {selectedItem?.contact_person && (
    <div>
      <Label className="text-gray-500">ชื่อผู้ติดต่อ</Label>
      <p className="mt-1">{selectedItem?.contact_person}</p>
    </div>
  )}
  <div>
    <Label className="text-gray-500">เบอร์ติดต่อ</Label>
    <p className="mt-1">{selectedItem?.phone}</p>
  </div>
</div>

<div>
  <Label className="text-gray-500">อีเมล</Label>
  <p className="mt-1">{selectedItem?.email}</p>
</div>

{selectedItem?.address && (
  <div>
    <Label className="text-gray-500">ที่อยู่</Label>
    <p className="mt-1">{selectedItem?.address}</p>
  </div>
)}

{selectedItem?.note && (
  <div>
    <Label className="text-gray-500">หมายเหตุ</Label>
    <p className="mt-1">{selectedItem?.note}</p>
  </div>
)}


              {(selectedItem.account_name || selectedItem.bank_account || selectedItem.bank_name) && (
                <div className="pt-4 border-t">
                  <h3 className="mb-3">ข้อมูลบัญชีธนาคาร</h3>
                  {selectedItem.account_name && (
                    <div className="mb-2">
                      <Label className="text-gray-500">ชื่อบัญชี</Label>
                      <p className="mt-1">{selectedItem.account_name}</p>
                    </div>
                  )}
                  {selectedItem.bank_account && (
                    <div className="mb-2">
                      <Label className="text-gray-500">เลขบัญชี</Label>
                      <p className="mt-1">{selectedItem.bank_account}</p>
                    </div>
                  )}
                  {selectedItem.bank_name && (
                    <div>
                      <Label className="text-gray-500">ชื่อธนาคาร</Label>
                      <p className="mt-1">{selectedItem.bank_name}</p>
                    </div>
                  )}
                </div>
              )}

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้า/คู่ค้า &quot;{selectedItem?.name}&quot;?
              การดำเนินการนี้ไม่สามารถยกเลิกได้
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
