import { useState, useEffect } from 'react';
import axios from 'axios';
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
import { Plus, Edit, Trash2, Eye, Search, FileText, Clock, CheckCircle2, XCircle, ChevronDown, Truck, Printer } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
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
import { toast } from 'sonner';
import TaxInvoiceForm from '../TaxInvoiceForm';

interface PurchaseOrderPageProps {
  userRole: UserRole;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  date: string;
  supplier_code?: string;
  supplier_name: string;
  supplier_address?: string;
  supplier_tax_id?: string;
  supplier_phone?: string;
  supplier_email?: string;
  reference_doc?: string;
  shipping_address?: string;
  shipping_phone?: string;
  items: string;
  notes?: string;
  discount: number;
  vat_rate: number;
  subtotal: number;
  discount_amount: number;
  after_discount: number;
  vat: number;
  grand_total: number;
  status: 'ร่าง' | 'รอจัดส่ง' | 'จัดส่งแล้ว' | 'ยกเลิก';
  expected_delivery_date?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PurchaseOrderPage({ userRole }: PurchaseOrderPageProps) {
  const API_URL = 'http://127.0.0.1:8000/api/purchase-orders';
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<PurchaseOrder | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseOrder | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // Fetch data from API
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === 'ร่าง').length,
    รอจัดส่ง: data.filter((item) => item.status === 'รอจัดส่ง').length,
    จัดส่งแล้ว: data.filter((item) => item.status === 'จัดส่งแล้ว').length,
    ยกเลิก: data.filter((item) => item.status === 'ยกเลิก').length,
  };

  const handleFormSave = async (data: any) => {
    toast.success('บันทึกใบสั่งซื้อสำเร็จ');
    setShowForm(false);
    setEditData(null);
    fetchPurchaseOrders();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditData(null);
  };

  const handleEdit = async (item: PurchaseOrder) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }

    // โหลดข้อมูลจาก API
    try {
      const response = await axios.get(`${API_URL}/${item.id}`);
      setEditData(response.data);
      setShowForm(true);
    } catch (error: any) {
      console.error('Error loading purchase order:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  const handleView = (item: PurchaseOrder) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: PurchaseOrder) => {
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
      await axios.delete(`${API_URL}/${selectedItem.id}`);
      toast.success(`ลบใบสั่งซื้อ ${selectedItem.po_number} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchPurchaseOrders();
    } catch (error: any) {
      console.error('Error deleting purchase order:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบใบสั่งซื้อ');
    }
  };

  const handleStatusChange = async (item: PurchaseOrder, newStatus: 'ร่าง' | 'รอจัดส่ง' | 'จัดส่งแล้ว' | 'ยกเลิก') => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะ');
      return;
    }

    try {
      // ใช้ API endpoint แยกสำหรับอัปเดทสถานะ
      await axios.patch(`${API_URL}/${item.id}/status`, { status: newStatus });
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      fetchPurchaseOrders();
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'ร่าง': 'outline',
      'รอจัดส่ง': 'secondary',
      'จัดส่งแล้ว': 'default',
      'ยกเลิก': 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handlePrint = (item: PurchaseOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('กรุณาอนุญาตให้เปิดหน้าต่างใหม่');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบสั่งซื้อ ${item.po_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@400;600;700&display=swap');

          body {
            font-family: 'Anuphan', sans-serif;
            margin: 40px;
            color: #000;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .info {
            margin-bottom: 30px;
          }
          .info-row {
            margin: 8px 0;
            font-size: 16px;
          }
          .info-label {
            font-weight: 600;
            display: inline-block;
            width: 120px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #000;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: 600;
          }
          .text-right {
            text-align: right;
          }
          @media print {
            body {
              margin: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ใบสั่งซื้อ</h1>
        </div>
        <div class="info">
          <div class="info-row"><span class="info-label">เลขที่:</span> ${item.po_number}</div>
          <div class="info-row"><span class="info-label">วันที่:</span> ${new Date(item.date).toLocaleDateString('th-TH')}</div>
          <div class="info-row"><span class="info-label">ผู้จำหน่าย:</span> ${item.supplier_name}</div>
          <div class="info-row"><span class="info-label">สถานะ:</span> ${item.status}</div>
          ${item.notes ? `<div class="info-row"><span class="info-label">รายละเอียด:</span> ${item.notes}</div>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>รายการ</th>
              <th class="text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>รวมทั้งสิ้น</td>
              <td class="text-right">฿${item.grand_total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success(`เตรียมพิมพ์ ${item.po_number}`);
  };

  // แสดง Form ถ้า showForm = true
  if (showForm) {
    return (
      <TaxInvoiceForm
        documentType="purchase_order"
        onSave={handleFormSave}
        onCancel={handleFormCancel}
        editData={editData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('ร่าง')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.ร่าง}</p>
                <p className="text-sm opacity-90">ร่าง</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-orange-400 to-orange-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('รอจัดส่ง')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.รอจัดส่ง}</p>
                <p className="text-sm opacity-90">รอจัดส่ง</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-green-400 to-green-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('จัดส่งแล้ว')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.จัดส่งแล้ว}</p>
                <p className="text-sm opacity-90">จัดส่งแล้ว</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-slate-400 to-slate-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('ยกเลิก')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.ยกเลิก}</p>
                <p className="text-sm opacity-90">ยกเลิก</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <XCircle className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการใบสั่งซื้อ</CardTitle>
              {filterStatus !== 'all' && (
                <p className="text-sm text-gray-500 mt-1">
                  กรองตาม: {filterStatus}{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    แสดงทั้งหมด
                  </Button>
                </p>
              )}
            </div>
            <Button onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบสั่งซื้อ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ค้นหาเลขที่เอกสาร, ผู้จำหน่าย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่เอกสาร</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้จำหน่าย</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.po_number}</TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>{item.supplier_name}</TableCell>
                  <TableCell className="text-right">
                    ฿{item.grand_total.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          disabled={!canEdit}
                        >
                          {getStatusBadge(item.status)}
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'ร่าง')}>
                          <FileText className="w-4 h-4 mr-2" />
                          ร่าง
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'รอจัดส่ง')}>
                          <Clock className="w-4 h-4 mr-2" />
                          รอจัดส่ง
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'จัดส่งแล้ว')}>
                          <Truck className="w-4 h-4 mr-2" />
                          จัดส่งแล้ว
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'ยกเลิก')}>
                          <XCircle className="w-4 h-4 mr-2" />
                          ยกเลิก
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrint(item)}>
                        <Printer className="w-4 h-4" />
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


      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดใบสั่งซื้อ</DialogTitle>
            <DialogDescription>เลขที่ {selectedItem?.po_number}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">เลขที่เอกสาร</Label>
                  <p className="mt-1">{selectedItem.po_number}</p>
                </div>
                <div>
                  <Label className="text-gray-500">วันที่</Label>
                  <p className="mt-1">{new Date(selectedItem.date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ผู้จำหน่าย</Label>
                <p className="mt-1">{selectedItem.supplier_name}</p>
              </div>
              <div>
                <Label className="text-gray-500">จำนวนเงิน</Label>
                <p className="mt-1">฿{selectedItem.grand_total.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
              </div>
              {selectedItem.notes && (
                <div>
                  <Label className="text-gray-500">รายละเอียด</Label>
                  <p className="mt-1">{selectedItem.notes}</p>
                </div>
              )}
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
              คุณแน่ใจหรือไม่ว่าต้องการลบใบสั่งซื้อ {selectedItem?.po_number}?
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
