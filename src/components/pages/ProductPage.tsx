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
import { productService } from '../../services/productService';
import type { Product, Category } from '../../services/productService';

interface ProductPageProps {
  userRole: UserRole;
}

export default function ProductPage({ userRole }: ProductPageProps) {
  const [data, setData] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '',
    category_id: '',
    quantity: '',
    unit: '',
    purchase_price: '',
    sale_price: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const products = await productService.getAll();
      setData(products);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
    }
  };

  const fetchCategories = async () => {
    try {
      const categoryList = await productService.getCategories();
      console.log('Loaded categories:', categoryList);
      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('ไม่สามารถโหลดหมวดหมู่ได้');
    }
  };

  const handleAdd = async () => {
    if (!formData.code || !formData.name) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    try {
      const productData = {
        code: formData.code,
        name: formData.name,
        type: formData.type || null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        unit: formData.unit || null,
        purchase_price: Number(formData.purchase_price) || 0,
        sale_price: Number(formData.sale_price) || 0,
        description: formData.description || null,
        status: formData.status,
      };

      await productService.create(productData);

      toast.success('เพิ่มสินค้า/บริการสำเร็จ');
      setIsAddDialogOpen(false);
      setFormData({
        code: '',
        name: '',
        type: '',
        category_id: '',
        quantity: '',
        unit: '',
        purchase_price: '',
        sale_price: '',
        description: '',
        status: 'active',
      });
      await fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ไม่สามารถเพิ่มสินค้าได้';
      toast.error(errorMessage);
    }
  };


  const handleEdit = (item: Product) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type || '',
      category_id: item.category_id ? String(item.category_id) : '',
      quantity: item.quantity !== null ? String(item.quantity) : '',
      unit: item.unit || '',
      purchase_price: String(item.purchase_price),
      sale_price: String(item.sale_price),
      description: item.description || '',
      status: item.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    try {
      const productData = {
        code: formData.code,
        name: formData.name,
        type: formData.type || null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        unit: formData.unit || null,
        purchase_price: Number(formData.purchase_price) || 0,
        sale_price: Number(formData.sale_price) || 0,
        description: formData.description || null,
        status: formData.status,
      };

      await productService.update(selectedItem.id, productData);

      toast.success('แก้ไขข้อมูลสำเร็จ');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      await fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ไม่สามารถแก้ไขสินค้าได้';
      toast.error(errorMessage);
    }
  };

  const handleView = (item: Product) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: Product) => {
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
      await productService.delete(selectedItem.id);
      toast.success(`ลบ ${selectedItem.name} สำเร็จ`);
      await fetchProducts();
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ไม่สามารถลบสินค้าได้';
      toast.error(errorMessage);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    }
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
      (item.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>สินค้าและบริการ</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มสินค้า/บริการ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="ค้นหารหัส, ชื่อสินค้า/บริการ..."
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
                <TableHead>ชื่อสินค้า/บริการ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead>หน่วยนับ</TableHead>
                <TableHead className="text-right">ราคาซื้อ</TableHead>
                <TableHead className="text-right">ราคาขาย</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.type || '-'}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell className="text-right">
                    {item.quantity !== null ? (
                      <span className={item.quantity === 0 ? 'text-red-500' : ''}>{item.quantity}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{item.unit || '-'}</TableCell>
                  <TableCell className="text-right">฿{(item.purchase_price || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">฿{(item.sale_price || 0).toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} disabled={!canEdit}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)} disabled={!canDelete}>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่มสินค้า/บริการใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลสินค้า/บริการ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>รหัสสินค้า</Label>
                <Input
                  placeholder="PRD-XXX"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ชื่อสินค้า/บริการ</Label>
                <Input
                  placeholder="ชื่อสินค้า"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ประเภท</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="สินค้า">สินค้า</SelectItem>
                    <SelectItem value="บริการ">บริการ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>หมวดหมู่</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>จำนวน</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>หน่วยนับ</Label>
                <Input
                  placeholder="ชิ้น, กล่อง, ชุด..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ราคาซื้อ (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ราคาขาย (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Input
                placeholder="รายละเอียดสินค้า/บริการ..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">ใช้งาน</SelectItem>
                  <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleAdd}>บันทึก</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขสินค้า/บริการ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูล {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>รหัสสินค้า</Label>
                <Input
                  placeholder="PRD-XXX"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ชื่อสินค้า/บริการ</Label>
                <Input
                  placeholder="ชื่อสินค้า"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ประเภท</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="สินค้า">สินค้า</SelectItem>
                    <SelectItem value="บริการ">บริการ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>หมวดหมู่</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>จำนวน</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>หน่วยนับ</Label>
                <Input
                  placeholder="ชิ้น, กล่อง, ชุด..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ราคาซื้อ (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ราคาขาย (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Input
                placeholder="รายละเอียดสินค้า/บริการ..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">ใช้งาน</SelectItem>
                  <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>ยกเลิก</Button>
              <Button onClick={handleUpdate}>บันทึกการเปลี่ยนแปลง</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดสินค้า/บริการ</DialogTitle>
            <DialogDescription>{selectedItem?.code}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">รหัสสินค้า</Label>
                  <p className="mt-1">{selectedItem.code}</p>
                </div>
                <div>
                  <Label className="text-gray-500">ชื่อสินค้า/บริการ</Label>
                  <p className="mt-1">{selectedItem.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">ประเภท</Label>
                  <p className="mt-1">{selectedItem.type || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">หมวดหมู่</Label>
                  <p className="mt-1">{selectedItem.category || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">จำนวน</Label>
                  <p className="mt-1">{selectedItem.quantity !== null ? selectedItem.quantity : '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">หน่วยนับ</Label>
                  <p className="mt-1">{selectedItem.unit || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">ราคาซื้อ</Label>
                  <p className="mt-1">฿{(selectedItem.purchase_price || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">ราคาขาย</Label>
                  <p className="mt-1">฿{(selectedItem.sale_price || 0).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">รายละเอียด</Label>
                <p className="mt-1">{selectedItem.description || '-'}</p>
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

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า/บริการ “{selectedItem?.name}”?  
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
