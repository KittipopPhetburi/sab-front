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
import { Plus, Edit, Trash2, Eye, Search, Download, FileText, Clock, CheckCircle2, XCircle, ChevronDown, Printer } from 'lucide-react';
import { Badge } from '../ui/badge';
import TaxInvoiceForm from '../TaxInvoiceForm';
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
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

interface ReceiptPageProps {
  userRole: UserRole;
}

interface Receipt {
  id: number;
  receipt_no: string;
  date: string;
  customer: string;
  invoice_ref: string; // แก้ชื่อ field ให้ตรงกับ backend
  amount: number;
  status: 'ร่าง' | 'รอออก' | 'ออกแล้ว' | 'ยกเลิก';
  description?: string;
}

const API_URL = 'http://127.0.0.1:8000/api/receipts';

const generateReceiptNumber = (count: number) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `RC-${year}${month}-${String(count + 1).padStart(3, '0')}`;
};

export default function ReceiptPage({ userRole }: ReceiptPageProps) {
  const [data, setData] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Receipt | null>(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    date: '',
    invoiceNo: '',
    amount: '',
    description: '',
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // Fetch data from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === 'ร่าง').length,
    รอออก: data.filter((item) => item.status === 'รอออก').length,
    ออกแล้ว: data.filter((item) => item.status === 'ออกแล้ว').length,
    ยกเลิก: data.filter((item) => item.status === 'ยกเลิก').length,
  };

  const handleAdd = async () => {
    try {
      const receiptNo = generateReceiptNumber(data.length);
      const payload = {
        receipt_no: receiptNo,
        date: formData.date,
        customer: formData.customer,
        invoice_ref: formData.invoiceNo, // แก้ไขชื่อ field ให้ตรงกับ backend
        amount: Number(formData.amount),
        status: 'ร่าง' as const,
        description: formData.description || undefined,
      };

      await axios.post(API_URL, payload);
      toast.success('สร้างใบเสร็จสำเร็จ');
      setIsAddDialogOpen(false);
      setFormData({ customer: '', date: '', invoiceNo: '', amount: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding receipt:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างใบเสร็จ');
    }
  };

  const handleEdit = (item: Receipt) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setFormData({
      customer: item.customer,
      date: item.date,
      invoiceNo: item.invoice_ref, // แก้ไขให้ใช้ invoice_ref
      amount: String(item.amount),
      description: item.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    try {
      const payload = {
        receipt_no: selectedItem.receipt_no,
        date: formData.date,
        customer: formData.customer,
        invoice_ref: formData.invoiceNo, // แก้ไขชื่อ field ให้ตรงกับ backend
        amount: Number(formData.amount),
        status: selectedItem.status,
        description: formData.description || undefined,
      };

      await axios.put(`${API_URL}/${selectedItem.id}`, payload);
      toast.success('แก้ไขใบเสร็จสำเร็จ');
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setFormData({ customer: '', date: '', invoiceNo: '', amount: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error updating receipt:', error);
      toast.error('เกิดข้อผิดพลาดในการแก้ไขใบเสร็จ');
    }
  };

  const handleView = (item: Receipt) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: Receipt) => {
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
      toast.success(`ลบใบเสร็จ ${selectedItem.receipt_no} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast.error('เกิดข้อผิดพลาดในการลบใบเสร็จ');
    }
  };

  const handlePrint = (item: Receipt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('กรุณาอนุญาตให้เปิดหน้าต่างใหม่');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบเสร็จรับเงิน/ใบกำกับภาษี ${item.receipt_no}</title>
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
            width: 140px;
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
          <h1>ใบเสร็จรับเงิน/ใบกำกับภาษี</h1>
        </div>
        <div class="info">
          <div class="info-row"><span class="info-label">เลขที่:</span> ${item.receipt_no}</div>
          <div class="info-row"><span class="info-label">วันที่:</span> ${new Date(item.date).toLocaleDateString('th-TH')}</div>
          <div class="info-row"><span class="info-label">ลูกค้า:</span> ${item.customer}</div>
          <div class="info-row"><span class="info-label">อ้างอิงใบแจ้งหนี้:</span> ${item.invoice_ref}</div>
          <div class="info-row"><span class="info-label">สถานะ:</span> ${item.status}</div>
          ${item.description ? `<div class="info-row"><span class="info-label">รายละเอียด:</span> ${item.description}</div>` : ''}
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
              <td class="text-right">฿${item.amount.toLocaleString()}</td>
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
    toast.success(`เตรียมพิมพ์ ${item.receipt_no}`);
  };

  const handleStatusChange = async (item: Receipt, newStatus: 'ร่าง' | 'รอออก' | 'ออกแล้ว' | 'ยกเลิก') => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะ');
      return;
    }

    try {
      const payload = {
        receipt_no: item.receipt_no,
        date: item.date,
        customer: item.customer,
        invoice_ref: item.invoiceNo, // แก้ไขชื่อ field ให้ตรงกับ backend
        amount: item.amount,
        status: newStatus,
        description: item.description || undefined,
      };

      await axios.put(`${API_URL}/${item.id}`, payload);
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'ร่าง': { variant: 'outline' },
      'รอออก': { variant: 'secondary' },
      'ออกแล้ว': { variant: 'default' },
      'ยกเลิก': { variant: 'destructive' },
    };
    return <Badge variant={variants[status].variant}>{status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoice_ref.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSaveDocument = () => {
    // TaxInvoiceForm บันทึกข้อมูลให้เองแล้ว ไม่ต้องบันทึกซ้ำ
    // แค่ปิด form และ refresh ข้อมูล
    setShowDocumentForm(false);
    fetchData();
  };

  const handleCancelDocument = () => {
    setShowDocumentForm(false);
  };

  if (showDocumentForm) {
    return (
      <TaxInvoiceForm
        documentType="receipt"
        onSave={handleSaveDocument}
        onCancel={handleCancelDocument}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-purple-400 to-purple-500 hover:shadow-lg"
          onClick={() => setFilterStatus('ร่าง')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.ร่าง}</p>
                <p className="text-sm opacity-90">ร่าง</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <FileText className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-pink-400 to-pink-500 hover:shadow-lg"
          onClick={() => setFilterStatus('รอออก')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.รอออก}</p>
                <p className="text-sm opacity-90">รอออก</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-lime-400 to-lime-500 hover:shadow-lg"
          onClick={() => setFilterStatus('ออกแล้ว')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.ออกแล้ว}</p>
                <p className="text-sm opacity-90">ออกแล้ว</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-stone-400 to-stone-500 hover:shadow-lg"
          onClick={() => setFilterStatus('ยกเลิก')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.ยกเลิก}</p>
                <p className="text-sm opacity-90">ยกเลิก</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
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
              <CardTitle>รายการใบเสร็จรับเงิน/ใบกำกับภาษี</CardTitle>
              {filterStatus !== 'all' && (
                <p className="mt-1 text-sm text-gray-500">
                  กรองตาม: {filterStatus}{' '}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    แสดงทั้งหมด
                  </Button>
                </p>
              )}
            </div>
            <Button onClick={() => setShowDocumentForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบเสร็จ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="ค้นหาเลขที่เอกสาร, ลูกค้า..."
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
                <TableHead>ลูกค้า</TableHead>
                <TableHead>อ้างอิงใบแจ้งหนี้</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span>กำลังโหลดข้อมูล...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.receipt_no}</TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>{item.customer}</TableCell>
                  <TableCell>{item.invoice_ref}</TableCell>
                  <TableCell className="text-right">
                    ฿{item.amount.toLocaleString()}
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
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'รอออก')}>
                          <Clock className="w-4 h-4 mr-2" />
                          รอออก
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'ออกแล้ว')}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          ออกแล้ว
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้างใบเสร็จใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลใบเสร็จรับเงิน/ใบกำกับภาษี</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันที่</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ลูกค้า</Label>
                <Input
                  placeholder="ชื่อลูกค้า"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>อ้างอิงใบแจ้งหนี้</Label>
                <Input
                  placeholder="INV-YYYY-XXX"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>จำนวนเงิน</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขใบเสร็จ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลใบเสร็จ {selectedItem?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันที่</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ลูกค้า</Label>
                <Input
                  placeholder="ชื่อลูกค้า"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>อ้างอิงใบแจ้งหนี้</Label>
                <Input
                  placeholder="INV-YYYY-XXX"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>จำนวนเงิน</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดใบเสร็จ</DialogTitle>
            <DialogDescription>เลขที่ {selectedItem?.receipt_no}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">เลขที่เอกสาร</Label>
                  <p className="mt-1">{selectedItem.receipt_no}</p>
                </div>
                <div>
                  <Label className="text-gray-500">วันที่</Label>
                  <p className="mt-1">{new Date(selectedItem.date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ลูกค้า</Label>
                <p className="mt-1">{selectedItem.customer}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">อ้างอิงใบแจ้งหนี้</Label>
                  <p className="mt-1">{selectedItem.invoice_ref}</p>
                </div>
                <div>
                  <Label className="text-gray-500">จำนวนเงิน</Label>
                  <p className="mt-1">฿{selectedItem.amount.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
              </div>
              {selectedItem.description && (
                <div>
                  <Label className="text-gray-500">รายละเอียด</Label>
                  <p className="mt-1">{selectedItem.description}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handlePrint(selectedItem)}>
                  <Download className="w-4 h-4 mr-2" />
                  ดาวน์โหลด PDF
                </Button>
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
              คุณแน่ใจหรือไม่ว่าต้องการลบใบเสร็จ {selectedItem?.receipt_no}?
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
