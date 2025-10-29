import { useState, useEffect } from "react";
import type { User, UserRole } from '../../types';
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
import { Plus, Edit, Trash2, Eye, Search, FileText, Clock, CheckCircle2, XCircle, ArrowLeft, ChevronDown, DollarSign, Printer, Mail } from 'lucide-react';
import { Badge } from '../ui/badge';
import TaxInvoiceForm from '../TaxInvoiceForm';
import { mockCustomers } from '../mockData';
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

interface InvoicePageProps {
  userRole: UserRole;
}

interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  customer_code?: string;
  customer_name: string;
  customer_address?: string;
  customer_tax_id?: string;
  customer_phone?: string;
  customer_email?: string;
  reference_doc?: string;
  shipping_address?: string;
  shipping_phone?: string;
  items: any[];
  notes?: string;
  discount: number;
  vat_rate: number;
  subtotal: number;
  discount_amount: number;
  after_discount: number;
  vat: number;
  grand_total: number;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  due_date?: string;
  created_at: string;
  updated_at: string;
}




export default function InvoicePage({ userRole }: InvoicePageProps) {
  const API_URL = "http://127.0.0.1:8000/api/invoices"; // เปลี่ยนเป็น invoices API แยกจาก receipts แล้ว
  const [data, setData] = useState<Invoice[]>([]);

useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      const json = await res.json();
      // ไม่ต้องกรอง document_type อีกต่อไปเพราะตาราง invoices แยกแล้ว
      setData(json);
    } else {
      toast.error("โหลดข้อมูลไม่สำเร็จ");
    }
  } catch (err) {
    console.error(err);
    toast.error("เชื่อมต่อ API ไม่สำเร็จ");
  }
};
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Invoice | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    date: '',
    amount: '',
    description: '',
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === 'draft').length,
    รอชำระ: data.filter((item) => item.status === 'pending').length,
    ชำระแล้ว: data.filter((item) => item.status === 'paid').length,
    ยกเลิก: data.filter((item) => item.status === 'cancelled').length,
  };

  const handleAdd = async () => {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receipt_no: `INV-${Date.now()}`,
        date: formData.date,
        customer: formData.customer,
        amount: Number(formData.amount),
        description: formData.description,
        status: "ร่าง",
      }),
    });

    if (res.ok) {
      toast.success("สร้างใบแจ้งหนี้สำเร็จ");
      setIsAddDialogOpen(false);
      setFormData({ customer: "", date: "", amount: "", description: "" });
      fetchData();
    } else {
      toast.error("บันทึกไม่สำเร็จ");
    }
  } catch (error) {
    console.error(error);
    toast.error("ไม่สามารถเชื่อม API ได้");
  }
};


  const handleEdit = (item: Invoice) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setFormData({
      customer: item.customer_name,
      date: item.invoice_date,
      amount: String(item.grand_total),
      description: item.notes || '',
    });
    setIsEditDialogOpen(true);
  };

const handleUpdate = async () => {
  if (!selectedItem) return;

  try {
    const res = await fetch(`${API_URL}/${selectedItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: formData.date,
        customer: formData.customer,
        amount: Number(formData.amount),
        description: formData.description,
        status: selectedItem.status,
      }),
    });

    if (res.ok) {
      toast.success("แก้ไขใบแจ้งหนี้สำเร็จ");
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    } else {
      toast.error("แก้ไขไม่สำเร็จ");
    }
  } catch (error) {
    console.error(error);
    toast.error("ไม่สามารถเชื่อม API ได้");
  }
};


  const handleView = (item: Invoice) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: Invoice) => {
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
    const res = await fetch(`${API_URL}/${selectedItem.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success(`ลบใบแจ้งหนี้ ${selectedItem.id} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    } else {
      toast.error("ลบไม่สำเร็จ");
    }
  } catch (error) {
    console.error(error);
    toast.error("เชื่อมต่อ API ไม่สำเร็จ");
  }
};


  const handleStatusChange = async (item: Invoice, newStatus: 'draft' | 'pending' | 'paid' | 'cancelled') => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะ');
      return;
    }

    try {
      // ใช้ API endpoint แยกสำหรับอัปเดทสถานะ
      const res = await fetch(`${API_URL}/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setData(
          data.map((d) =>
            d.id === item.id ? { ...d, status: newStatus } : d
          )
        );
        const statusText = newStatus === 'draft' ? 'ร่าง' : newStatus === 'pending' ? 'รอชำระ' : newStatus === 'paid' ? 'ชำระแล้ว' : 'ยกเลิก';
        toast.success(`เปลี่ยนสถานะเป็น "${statusText}" สำเร็จ`);
      } else {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        toast.error("เปลี่ยนสถานะไม่สำเร็จ");
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'draft': 'outline',
      'pending': 'secondary',
      'paid': 'default',
      'cancelled': 'destructive',
    };
    const labels: Record<string, string> = {
      'draft': 'ร่าง',
      'pending': 'รอชำระ',
      'paid': 'ชำระแล้ว',
      'cancelled': 'ยกเลิก',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSaveDocument = () => {
    // ข้อมูลถูกบันทึกผ่าน API ใน TaxInvoiceForm แล้ว
    // แค่ refresh ข้อมูล
    fetchData();
    setShowDocumentForm(false);
  };

  const handleCancelDocument = () => {
    setShowDocumentForm(false);
  };

  const handleEmailClick = (item: Invoice) => {
    setSelectedItem(item);
    setEmailAddress('');
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedItem) return;

    if (!emailAddress || !emailAddress.includes('@')) {
      toast.error('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${selectedItem.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || 'ส่งอีเมลสำเร็จ');
        setIsEmailDialogOpen(false);
        setEmailAddress('');
        setSelectedItem(null);
      } else {
        toast.error(result.message || 'ส่งอีเมลไม่สำเร็จ');
      }
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ API');
    }
  };

  const handlePrint = (item: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('กรุณาอนุญาตให้เปิดหน้าต่างใหม่');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ใบแจ้งหนี้ ${item.id}</title>
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
          <h1>ใบแจ้งหนี้</h1>
        </div>
        <div class="info">
          <div class="info-row"><span class="info-label">เลขที่:</span> ${item.invoice_no}</div>
          <div class="info-row"><span class="info-label">วันที่:</span> ${new Date(item.invoice_date).toLocaleDateString('th-TH')}</div>
          <div class="info-row"><span class="info-label">ลูกค้า:</span> ${item.customer_name}</div>
          <div class="info-row"><span class="info-label">สถานะ:</span> ${item.status === 'draft' ? 'ร่าง' : item.status === 'pending' ? 'รอชำระ' : item.status === 'paid' ? 'ชำระแล้ว' : 'ยกเลิก'}</div>
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
    toast.success(`เตรียมพิมพ์ ${item.id}`);
  };

  if (showDocumentForm) {
    return (
      <TaxInvoiceForm
        documentType="invoice"
        customers={mockCustomers}
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
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-blue-400 to-blue-500 hover:shadow-lg"
          onClick={() => setFilterStatus('draft')}
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
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-yellow-400 to-yellow-500 hover:shadow-lg"
          onClick={() => setFilterStatus('pending')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.รอชำระ}</p>
                <p className="text-sm opacity-90">รอชำระ</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-green-400 to-green-500 hover:shadow-lg"
          onClick={() => setFilterStatus('paid')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.ชำระแล้ว}</p>
                <p className="text-sm opacity-90">ชำระแล้ว</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-gray-400 to-gray-500 hover:shadow-lg"
          onClick={() => setFilterStatus('cancelled')}
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
              <CardTitle>รายการใบแจ้งหนี้</CardTitle>
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
              สร้างใบแจ้งหนี้
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
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.invoice_no}</TableCell>
                  <TableCell>{new Date(item.invoice_date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>{item.customer_name}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'draft')}>
                          <FileText className="w-4 h-4 mr-2" />
                          ร่าง
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'pending')}>
                          <Clock className="w-4 h-4 mr-2" />
                          รอชำระ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'paid')}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          ชำระแล้ว
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'cancelled')}>
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
                      <Button variant="ghost" size="icon" onClick={() => handleEmailClick(item)} title="ส่งอีเมล">
                        <Mail className="w-4 h-4" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้างใบแจ้งหนี้ใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลใบแจ้งหนี้</DialogDescription>
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
            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
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
            <DialogTitle>แก้ไขใบแจ้งหนี้</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลใบแจ้งหนี้ {selectedItem?.invoice_no}</DialogDescription>
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
            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
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
            <DialogTitle>รายละเอียดใบแจ้งหนี้</DialogTitle>
            <DialogDescription>เลขที่ {selectedItem?.invoice_no}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">เลขที่เอกสาร</Label>
                  <p className="mt-1">{selectedItem.invoice_no}</p>
                </div>
                <div>
                  <Label className="text-gray-500">วันที่</Label>
                  <p className="mt-1">{new Date(selectedItem.invoice_date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ลูกค้า</Label>
                <p className="mt-1">{selectedItem.customer_name}</p>
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
              คุณแน่ใจหรือไม่ว่าต้องการลบใบแจ้งหนี้ {selectedItem?.invoice_no}?
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ส่งใบแจ้งหนี้ทางอีเมล</DialogTitle>
            <DialogDescription>
              ส่งใบแจ้งหนี้ {selectedItem?.invoice_no} ไปยังอีเมลที่ระบุ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ที่อยู่อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendEmail();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSendEmail}>
                <Mail className="w-4 h-4 mr-2" />
                ส่งอีเมล
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
