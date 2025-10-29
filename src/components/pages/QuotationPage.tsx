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
import { Plus, Trash2, Eye, Search, Printer, FileText, Clock, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
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

interface QuotationPageProps {
  userRole: UserRole;
}

interface Quotation {
  id: number;
  quotation_number: string;
  date: string;
  customer?: string;
  customer_code?: string;
  customer_name?: string;
  customer_address?: string;
  customer_tax_id?: string;
  customer_phone?: string;
  customer_email?: string;
  reference_doc?: string;
  shipping_address?: string;
  shipping_phone?: string;
  items?: Array<{
    id: string;
    description: string;
    amount: number;
    productId?: number;
  }>;
  notes?: string;
  discount?: number;
  vat_rate?: number;
  subtotal?: number;
  discount_amount?: number;
  after_discount?: number;
  vat?: number;
  grand_total?: number;
  amount?: number;
  status: 'ร่าง' | 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก';
  description?: string;
  valid_until?: string;
  created_at?: string;
  updated_at?: string;
}

export default function QuotationPage({ userRole }: QuotationPageProps) {
  const API_URL = 'http://127.0.0.1:8000/api/quotations';
  const [data, setData] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Quotation | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // Fetch data from API
  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === 'ร่าง').length,
    รออนุมัติ: data.filter((item) => item.status === 'รออนุมัติ').length,
    อนุมัติแล้ว: data.filter((item) => item.status === 'อนุมัติแล้ว').length,
    ยกเลิก: data.filter((item) => item.status === 'ยกเลิก').length,
  };

  const handleSaveQuotation = () => {
    // TaxInvoiceForm บันทึกข้อมูลให้เองแล้ว ไม่ต้องบันทึกซ้ำ
    setShowQuotationForm(false);
    fetchQuotations();
  };

  const handleView = (item: Quotation) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };
  const handleEdit = (item: Quotation) => {
  setSelectedItem(item);
  setShowQuotationForm(true);
};

  const handleDeleteClick = (item: Quotation) => {
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
      toast.success(`ลบใบเสนอราคา ${selectedItem.quotation_number} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchQuotations();
    } catch (error: any) {
      console.error('Error deleting quotation:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบใบเสนอราคา');
    }
  };

  const handleStatusChange = async (item: Quotation, newStatus: 'ร่าง' | 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก') => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะ');
      return;
    }

    try {
      // ใช้ API endpoint แยกสำหรับอัปเดทสถานะ
      await axios.patch(`${API_URL}/${item.id}/status`, { status: newStatus });
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      fetchQuotations();
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'ร่าง': 'outline',
      'รออนุมัติ': 'secondary',
      'อนุมัติแล้ว': 'default',
      'ยกเลิก': 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customer_name || item.customer || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ถ้ากำลังแสดงฟอร์ม ให้แสดงฟอร์มเต็มหน้าจอแทนที่หน้ารายการ
  if (showQuotationForm) {
    return (
      <TaxInvoiceForm
        documentType="quotation"
        onSave={handleSaveQuotation}
        onCancel={() => setShowQuotationForm(false)}
        editData={selectedItem}
      />
    );
  }

  const handlePrint = (item: Quotation) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('กรุณาอนุญาตให้เปิดหน้าต่างใหม่');
    return;
  }

  // ป้องกัน error: แปลงค่าตัวเลขทั้งหมดให้แน่ใจว่าเป็น number
  const subtotal = parseFloat(item.subtotal || 0);
  const discount_amount = parseFloat(item.discount_amount || 0);
  const after_discount = parseFloat(item.after_discount || 0);
  const vat = parseFloat(item.vat || 0);
  const grand_total = parseFloat(item.grand_total || 0);

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>ใบเสนอราคา ${item.quotation_number}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@400;600;700&display=swap');
      body {
        font-family: 'Anuphan', sans-serif;
        font-size: 14px;
        color: #000;
        margin: 25px 40px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1.2px solid #000;
        padding: 6px 8px;
      }
      th {
        background: #f2f2f2;
        text-align: center;
        font-weight: 600;
      }
      .no-border td { border: none; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }

      .header td { border: none; vertical-align: top; }
      .company-name {
        font-size: 16px;
        font-weight: 700;
        color: #007bff;
      }
      .doc-title {
        text-align: right;
        font-weight: 700;
        color: #007bff;
        font-size: 22px;
      }
      .doc-sub {
        color: #007bff;
        font-size: 14px;
      }

      .info {
        border: 1.2px solid #000;
        margin-top: 5px;
        font-size: 14px;
      }
      .info td { padding: 6px 8px; vertical-align: top; }

      .items th, .items td {
        border: 1.2px solid #000;
        line-height: 1.3;
      }

      .summary {
        width: 45%;
        float: right;
        border-collapse: collapse;
        margin-top: 6px;
      }
      .summary td {
        border: 1.2px solid #000;
        padding: 6px;
      }
      .summary td.label { font-weight: 600; }
      .summary td.value { text-align: right; }

      .note {
        border: 1.2px solid #000;
        padding: 6px 10px;
        margin-top: 10px;
        font-size: 13px;
      }

      .footer {
        width: 100%;
        text-align: center;
        border-collapse: collapse;
        margin-top: 15px;
        font-size: 13px;
      }
      .footer td { border: none; padding: 6px; }
      .sig-space { height: 50px; }
    </style>
  </head>
  <body>
    <table class="header">
      <tr>
        <td>
          <div class="company-name">บริษัท ไอ ที บี ที คอร์ปอเรชั่น จำกัด (สำนักงานใหญ่)</div>
          170/273 หมู่ที่ 1 ตำบลบางรักพัฒนา อำเภอบางบัวทอง จังหวัดนนทบุรี 12000<br/>
          โทร. 02-1014461 อีเมล: service@itbtthai.com<br/>
          เลขประจำตัวผู้เสียภาษี 0135561023453
        </td>
        <td class="doc-title">
          ใบเสนอราคา<br/>
          <span class="doc-sub">Quotation</span>
        </td>
      </tr>
    </table>

    <table class="info">
      <tr>
        <td style="width:50%">
          ลูกค้า: ${item.customer_name || '-'}<br/>
          ที่อยู่: ${item.customer_address || '-'}<br/>
          โทร: ${item.customer_phone || '-'}<br/>
          อีเมล: ${item.customer_email || '-'}<br/>
          เลขประจำตัวผู้เสียภาษี: ${item.customer_tax_id || '-'}
        </td>
        <td style="width:50%">
          เลขที่: ${item.quotation_number}<br/>
          วันที่: ${new Date(item.date).toLocaleDateString('th-TH')}<br/>
          สถานะ: ${item.status || '-'}<br/>
          ผู้ขาย: ${item.seller_name || '-'}
        </td>
      </tr>
    </table>

    <table class="items" style="margin-top:5px;">
      <thead>
        <tr>
          <th style="width:40px;">ที่</th>
          <th>รายละเอียด</th>
          <th style="width:70px;">จำนวน</th>
          <th style="width:70px;">หน่วย</th>
          <th style="width:100px;">ราคาต่อหน่วย(บาท)</th>
          <th style="width:100px;">ยอดรวม(บาท)</th>
        </tr>
      </thead>
      <tbody>
        ${
          (item.items && item.items.length > 0)
            ? item.items.map((i, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${i.description || '-'}</td>
                <td class="text-center">${i.qty || 1}</td>
                <td class="text-center">${i.unit || '-'}</td>
                <td class="text-right">${Number(i.price || 0).toLocaleString()}</td>
                <td class="text-right">${Number(i.amount || 0).toLocaleString()}</td>
              </tr>`).join('')
            : `<tr><td colspan="6" class="text-center">- ไม่มีรายการสินค้า -</td></tr>`
        }
      </tbody>
    </table>

    <table class="summary">
      <tr><td class="label">รวมเป็นเงิน</td><td class="value">${subtotal.toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>
      <tr><td class="label">ส่วนลด</td><td class="value">${discount_amount.toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>
      <tr><td class="label">ราคาหลังหักส่วนลด</td><td class="value">${after_discount.toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>
      <tr><td class="label">ภาษีมูลค่าเพิ่ม 7%</td><td class="value">${vat.toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>
      <tr><td class="label"><strong>จำนวนเงินรวมทั้งสิ้น</strong></td><td class="value"><strong>${grand_total.toLocaleString(undefined,{minimumFractionDigits:2})}</strong></td></tr>
    </table>

    <div style="clear:both;"></div>

    <div class="note">
      <strong>หมายเหตุ:</strong><br/>
      1. การชำระเงินภายใน 7 วันหลังได้รับสินค้า<br/>
      2. การส่งมอบสินค้าสามารถเปลี่ยนแปลงได้ตามความพร้อมของบริษัท<br/>
      3. ราคานี้ยังไม่รวมค่าขนส่ง (ถ้ามี)
    </div>

    <table class="footer">
      <tr>
        <td colspan="3" style="text-align:left;">จำนวนเงินเป็นตัวอักษร (.............................................................)</td>
      </tr>
      <tr class="sig-space">
        <td>ลงชื่อ..........................................<br/>อนุมัติสั่งซื้อ<br/>(..........................................)</td>
        <td>ตราประทับ<br/>(ถ้ามี)</td>
        <td>ลงชื่อ..........................................<br/>ผู้เสนอราคา<br/>(..........................................)</td>
      </tr>
    </table>
  </body>
  </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
  toast.success(`เตรียมพิมพ์ ${item.quotation_number}`);
};


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
          onClick={() => setFilterStatus('รออนุมัติ')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.รออนุมัติ}</p>
                <p className="text-sm opacity-90">รออนุมัติ</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-green-400 to-green-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('อนุมัติแล้ว')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.อนุมัติแล้ว}</p>
                <p className="text-sm opacity-90">อนุมัติแล้ว</p>
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
              <CardTitle>รายการใบเสนอราคา</CardTitle>
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
            <Button onClick={() => setShowQuotationForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบเสนอราคา
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                  <TableCell>{item.quotation_number}</TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>{item.customer_name || item.customer || '-'}</TableCell>
                  <TableCell className="text-right">
                    ฿{(item.grand_total || item.amount || 0).toLocaleString()}
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
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'รออนุมัติ')}>
                          <Clock className="w-4 h-4 mr-2" />
                          รออนุมัติ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(item, 'อนุมัติแล้ว')}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          อนุมัติแล้ว
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
                      <Button
  variant="ghost"
  size="icon"
  onClick={() => handleEdit(item)}
  disabled={!canEdit}
>
  <FileText className="w-4 h-4" />
</Button>

                      <Button variant="ghost" size="icon" onClick={() => handlePrint(item)}>
                        <Printer className="w-4 h-4" />
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
            <DialogTitle>รายละเอียดใบเสนอราคา</DialogTitle>
            <DialogDescription>เลขที่ {selectedItem?.quotation_number}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">เลขที่เอกสาร</Label>
                  <p className="mt-1">{selectedItem.quotation_number}</p>
                </div>
                <div>
                  <Label className="text-gray-500">วันที่</Label>
                  <p className="mt-1">{new Date(selectedItem.date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ลูกค้า</Label>
                <p className="mt-1">{selectedItem.customer_name || selectedItem.customer || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">จำนวนเงิน</Label>
                  <p className="mt-1">฿{(selectedItem.grand_total || selectedItem.amount || 0).toLocaleString()}</p>
                </div>
                {selectedItem.valid_until && (
                  <div>
                    <Label className="text-gray-500">ใช้ได้ถึงวันที่</Label>
                    <p className="mt-1">{new Date(selectedItem.valid_until).toLocaleDateString('th-TH')}</p>
                  </div>
                )}
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
              คุณแน่ใจหรือไม่ว่าต้องการลบใบเสนอราคา {selectedItem?.quotation_number}?
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
