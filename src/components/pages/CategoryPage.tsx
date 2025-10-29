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
import { Plus, Edit, Trash2, Eye, Search, FolderTree } from 'lucide-react';
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
import { toast } from 'sonner';
import { categoryService } from '../../services/categoryService';
import type { Category as ApiCategory } from '../../services/categoryService';

interface CategoryPageProps {
  userRole: UserRole;
}

export default function CategoryPage({ userRole }: CategoryPageProps) {
  const [data, setData] = useState<ApiCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApiCategory | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'สินค้า' as 'สินค้า' | 'บริการ',
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // โหลดข้อมูลหมวดหมู่จาก Laravel
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categories = await categoryService.getAll();
      setData(categories);
    } catch (error) {
      console.error('โหลดข้อมูลไม่สำเร็จ:', error);
      toast.error('เชื่อมต่อ API ไม่ได้');
    }
  };

  // เพิ่มหมวดหมู่
  const handleAdd = async () => {
    if (!formData.code || !formData.name) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    try {
      await categoryService.create(formData);
      toast.success('เพิ่มหมวดหมู่สำเร็จ');
      setIsAddDialogOpen(false);
      setFormData({ code: '', name: '', type: 'สินค้า' });
      await fetchCategories();
    } catch (error) {
      console.error('API Error:', error);
      toast.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  // เปิดหน้าแก้ไข
  const handleEdit = (item: ApiCategory) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type,
    });
    setIsEditDialogOpen(true);
  };

  // อัปเดตข้อมูล
  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      await categoryService.update(selectedItem.id, formData);
      toast.success('แก้ไขหมวดหมู่สำเร็จ');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setFormData({ code: '', name: '', type: 'สินค้า' });
      await fetchCategories();
    } catch (error) {
      console.error('API Error:', error);
      toast.error('เชื่อมต่อ API ไม่ได้');
    }
  };

  // ดูรายละเอียด
  const handleView = (item: ApiCategory) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  // เตรียมลบ
  const handleDeleteClick = (item: ApiCategory) => {
    if (!canDelete) {
      toast.error('คุณไม่มีสิทธิ์ลบข้อมูล');
      return;
    }
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  // ยืนยันลบ
  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await categoryService.delete(selectedItem.id);
      toast.success(`ลบหมวดหมู่ ${selectedItem.name} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      await fetchCategories();
    } catch (error) {
      console.error('API Error:', error);
      toast.error('เชื่อมต่อ API ไม่ได้');
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary'> = {
      'สินค้า': 'default',
      'บริการ': 'secondary',
    };
    return <Badge variant={variants[type]}>{type}</Badge>;
  };

  const filteredData = data.filter(
    (item) =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>หมวดหมู่สินค้า/บริการ</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มหมวดหมู่
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="ค้นหารหัส, ชื่อหมวดหมู่..."
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
                <TableHead>ชื่อหมวดหมู่</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead className="text-right">จำนวนสินค้า/บริการ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-gray-500" />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell>{item.products_count ?? 0} รายการ</TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลหมวดหมู่สินค้า/บริการ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>รหัสหมวดหมู่</Label>
              <Input
                placeholder="CAT-XXX"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ชื่อหมวดหมู่</Label>
              <Input
                placeholder="ชื่อหมวดหมู่"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select value={formData.type} onValueChange={(value: 'สินค้า' | 'บริการ') => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="สินค้า">สินค้า</SelectItem>
                  <SelectItem value="บริการ">บริการ</SelectItem>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>แก้ไขหมวดหมู่</DialogTitle>
            <DialogDescription>แก้ไขข้อมูล {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>รหัสหมวดหมู่</Label>
              <Input
                placeholder="CAT-XXX"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ชื่อหมวดหมู่</Label>
              <Input
                placeholder="ชื่อหมวดหมู่"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select value={formData.type} onValueChange={(value: 'สินค้า' | 'บริการ') => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="สินค้า">สินค้า</SelectItem>
                  <SelectItem value="บริการ">บริการ</SelectItem>
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>รายละเอียดหมวดหมู่</DialogTitle>
            <DialogDescription>{selectedItem?.code}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">รหัสหมวดหมู่</Label>
                <p className="mt-1">{selectedItem.code}</p>
              </div>
              <div>
                <Label className="text-gray-500">ชื่อหมวดหมู่</Label>
                <p className="mt-1">{selectedItem.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">ประเภท</Label>
                <div className="mt-1">{getTypeBadge(selectedItem.type)}</div>
              </div>
              <div>
                <Label className="text-gray-500">จำนวนสินค้า/บริการ</Label>
                <p className="mt-1">{selectedItem.products_count ?? 0} รายการ</p>
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
              คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "{selectedItem?.name}"? การดำเนินการนี้ไม่สามารถยกเลิกได้
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
