import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Download, Printer, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
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
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { mockCustomers } from '../mockData';
import WithholdingTaxForm from '../WithholdingTaxForm';
import { withholdingTaxService } from '../../services/withholdingTaxService';
import type { WithholdingTax as ApiWithholdingTax } from '../../services/withholdingTaxService';
import { generateWithholdingTaxPDF } from '../../utils/pdfGenerator';

interface WithholdingTaxPageProps {
  userRole: 'admin' | 'account' | 'user';
}

interface FormDocumentData {
  docNumber: string;
  docDate: string;
  sequenceNumber: string;
  payerTaxId: string;
  payerName: string;
  recipientTaxId: string;
  recipientName: string;
  recipientAddress: string;
  recipientType: 'individual' | 'juristic' | 'partnership' | 'other';
  companyType?: '1' | '2' | '3' | '4' | '5' | 'other';
  items: Array<{
    type: string;
    description: string;
    date: string;
    taxRate: number;
    amount: number;
    taxAmount: number;
  }>;
  totalAmount: number;
  totalTax: number;
  notes?: string;
}

export default function WithholdingTaxPage({ userRole }: WithholdingTaxPageProps) {
  const [data, setData] = useState<ApiWithholdingTax[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApiWithholdingTax | null>(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await withholdingTaxService.getAll();
      setData(result);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === 'ร่าง').length,
    รออนุมัติ: data.filter((item) => item.status === 'รออนุมัติ').length,
    อนุมัติแล้ว: data.filter((item) => item.status === 'อนุมัติแล้ว').length,
    ยกเลิก: data.filter((item) => item.status === 'ยกเลิก').length,
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.doc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setShowDocumentForm(true);
  };

  const handleView = (item: ApiWithholdingTax) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleDeleteClick = (item: ApiWithholdingTax) => {
    if (!canDelete) {
      toast.error('คุณไม่มีสิทธิ์ลบข้อมูล');
      return;
    }
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedItem && selectedItem.id) {
      try {
        await withholdingTaxService.delete(selectedItem.id);
        toast.success(`ลบหัก ณ ที่จ่าย ${selectedItem.doc_number} สำเร็จ`);
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
        loadData(); // Reload data
      } catch (error) {
        console.error('Error deleting:', error);
        toast.error('ไม่สามารถลบข้อมูลได้');
      }
    }
  };

  const handleStatusChange = async (
    item: ApiWithholdingTax,
    newStatus: 'ร่าง' | 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก'
  ) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะ');
      return;
    }

    if (!item.id) {
      toast.error('ไม่พบ ID ของรายการ');
      return;
    }

    try {
      await withholdingTaxService.updateStatus(item.id, newStatus, item);
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  const handleDownload = (item: ApiWithholdingTax) => {
    try {
      generateWithholdingTaxPDF(item);
      toast.success(`ดาวน์โหลด ${item.doc_number} สำเร็จ`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('ไม่สามารถสร้าง PDF ได้');
    }
  };

  const handlePrint = (item: ApiWithholdingTax) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('กรุณาอนุญาตให้เปิดหน้าต่างใหม่');
      return;
    }

    const recipientTypeMap: Record<string, string> = {
      'individual': 'บุคคลธรรมดา',
      'juristic': 'นิติบุคคล',
      'partnership': 'ห้างหุ้นส่วน',
      'other': 'อื่นๆ'
    };

    const formatTaxId = (taxId: string): string => {
      if (taxId.length === 13) {
        return `${taxId.substring(0, 1)}-${taxId.substring(1, 5)}-${taxId.substring(5, 10)}-${taxId.substring(10, 12)}-${taxId.substring(12, 13)}`;
      }
      return taxId;
    };

    const itemsRows = item.items.map((itm, index) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td class="text-center">${itm.type}</td>
        <td>${itm.description}</td>
        <td class="text-center">${new Date(itm.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
        <td class="text-center">${itm.tax_rate}%</td>
        <td class="text-right">${itm.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">${itm.tax_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>หนังสือรับรองการหักภาษี ณ ที่จ่าย - ${item.doc_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Sarabun', sans-serif;
            margin: 0;
            padding: 30px;
            color: #000;
            font-size: 14px;
            line-height: 1.6;
          }

          .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }

          .header h1 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .header p {
            font-size: 16px;
            font-weight: 600;
          }

          .doc-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
          }

          .section {
            margin-bottom: 25px;
          }

          .section-title {
            background-color: #e9ecef;
            padding: 8px 12px;
            font-weight: 700;
            font-size: 15px;
            border-left: 4px solid #0066cc;
            margin-bottom: 12px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding: 0 12px;
          }

          .info-item {
            margin-bottom: 8px;
          }

          .info-label {
            font-weight: 600;
            color: #495057;
            margin-right: 8px;
          }

          .info-value {
            color: #000;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th, td {
            border: 1px solid #000;
            padding: 10px;
            text-align: left;
          }

          th {
            background-color: #0066cc;
            color: white;
            font-weight: 600;
            text-align: center;
          }

          .text-center {
            text-align: center;
          }

          .text-right {
            text-align: right;
          }

          .summary-box {
            float: right;
            width: 350px;
            margin-top: 20px;
            border: 2px solid #000;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            border-bottom: 1px solid #dee2e6;
          }

          .summary-row:last-child {
            border-bottom: none;
            background-color: #e3f2fd;
            font-weight: 700;
            font-size: 16px;
          }

          .signature-section {
            clear: both;
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 30px;
          }

          .signature-box {
            width: 45%;
            text-align: center;
          }

          .signature-line {
            border-top: 1px dotted #000;
            margin: 60px 20px 10px 20px;
          }

          .notes {
            margin-top: 20px;
            padding: 12px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
          }

          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
          }

          @media print {
            body {
              padding: 15px;
            }
            .summary-box {
              page-break-inside: avoid;
            }
            .signature-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>หนังสือรับรองการหักภาษี ณ ที่จ่าย</h1>
          <p>ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</p>
        </div>

        <div class="doc-info">
          <div><strong>เลขที่เอกสาร:</strong> ${item.doc_number}</div>
          <div><strong>วันที่:</strong> ${new Date(item.doc_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div><strong>ลำดับที่:</strong> ${item.sequence_number}</div>
        </div>

        <!-- ส่วนที่ 1: ผู้จ่ายเงิน -->
        <div class="section">
          <div class="section-title">ส่วนที่ 1: ข้อมูลผู้จ่ายเงิน</div>
          <div style="padding: 0 12px;">
            <div class="info-item">
              <span class="info-label">เลขประจำตัวผู้เสียภาษี:</span>
              <span class="info-value">${formatTaxId(item.payer_tax_id)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ชื่อ-สกุล/ชื่อบริษัท:</span>
              <span class="info-value">${item.payer_name}</span>
            </div>
          </div>
        </div>

        <!-- ส่วนที่ 2: ผู้รับเงิน -->
        <div class="section">
          <div class="section-title">ส่วนที่ 2: ข้อมูลผู้รับเงิน</div>
          <div style="padding: 0 12px;">
            <div class="info-item">
              <span class="info-label">เลขประจำตัวผู้เสียภาษี:</span>
              <span class="info-value">${formatTaxId(item.recipient_tax_id)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ชื่อ-สกุล/ชื่อบริษัท:</span>
              <span class="info-value">${item.recipient_name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ที่อยู่:</span>
              <span class="info-value">${item.recipient_address}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ประเภทผู้รับเงิน:</span>
              <span class="info-value">${recipientTypeMap[item.recipient_type] || item.recipient_type}</span>
            </div>
          </div>
        </div>

        <!-- ส่วนที่ 3: รายการเงินได้ -->
        <div class="section">
          <div class="section-title">ส่วนที่ 3: ประเภทเงินได้พึงประเมินที่จ่าย</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">ลำดับ</th>
                <th style="width: 80px;">ประเภท</th>
                <th>รายการ</th>
                <th style="width: 100px;">วันที่จ่าย</th>
                <th style="width: 80px;">อัตราภาษี</th>
                <th style="width: 120px;">จำนวนเงิน (บาท)</th>
                <th style="width: 120px;">ภาษีหัก ณ ที่จ่าย (บาท)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <!-- สรุปยอด -->
        <div class="summary-box">
          <div class="summary-row">
            <span>รวมเงินที่จ่าย:</span>
            <span>${item.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
          </div>
          <div class="summary-row">
            <span>รวมภาษีหัก ณ ที่จ่าย:</span>
            <span>${item.total_tax.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
          </div>
        </div>

        ${item.notes ? `
        <div class="notes" style="clear: both; margin-top: 80px;">
          <strong>หมายเหตุ:</strong><br>
          ${item.notes}
        </div>
        ` : '<div style="clear: both;"></div>'}

        <!-- ลายเซ็น -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div style="margin-top: 10px;">ผู้จ่ายเงิน</div>
            <div style="margin-top: 5px;">(${item.payer_name})</div>
            <div style="margin-top: 10px;">วันที่ ____________________</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div style="margin-top: 10px;">ผู้รับเงิน</div>
            <div style="margin-top: 5px;">(${item.recipient_name})</div>
            <div style="margin-top: 10px;">วันที่ ____________________</div>
          </div>
        </div>

        <div class="footer">
          <p>สถานะ: ${item.status} | สร้างโดย: ${item.created_by} ${item.created_at ? `| สร้างเมื่อ: ${new Date(item.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success(`เตรียมพิมพ์ ${item.doc_number}`);
  };

  const handleSaveDocument = async (documentData: FormDocumentData) => {
    try {
      // Convert form data to API format
      const apiData = {
        doc_number: documentData.docNumber,
        doc_date: documentData.docDate,
        sequence_number: documentData.sequenceNumber,
        payer_tax_id: documentData.payerTaxId,
        payer_name: documentData.payerName,
        recipient_tax_id: documentData.recipientTaxId,
        recipient_name: documentData.recipientName,
        recipient_address: documentData.recipientAddress,
        recipient_type: documentData.recipientType,
        company_type: documentData.companyType,
        items: documentData.items.map((item) => ({
          type: item.type,
          description: item.description,
          date: item.date,
          tax_rate: item.taxRate,
          amount: item.amount,
          tax_amount: item.taxAmount,
        })),
        total_amount: documentData.totalAmount,
        total_tax: documentData.totalTax,
        status: 'ร่าง' as const,
        created_by: 'admin', // You should get this from auth context
        notes: documentData.notes,
      };

      await withholdingTaxService.create(apiData);
      toast.success('สร้างหัก ณ ที่จ่ายสำเร็จ');
      setShowDocumentForm(false);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error creating withholding tax:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'ไม่สามารถสร้างหัก ณ ที่จ่ายได้';
      toast.error(errorMessage);
    }
  };

  const handleCancelDocument = () => {
    setShowDocumentForm(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ร่าง: 'outline',
      รออนุมัติ: 'secondary',
      อนุมัติแล้ว: 'default',
      ยกเลิก: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (showDocumentForm) {
    return (
      <WithholdingTaxForm
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
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-sky-400 to-sky-500 hover:shadow-lg"
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
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-amber-400 to-amber-500 hover:shadow-lg"
          onClick={() => setFilterStatus('รออนุมัติ')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.รออนุมัติ}</p>
                <p className="text-sm opacity-90">รออนุมัติ</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-emerald-400 to-emerald-500 hover:shadow-lg"
          onClick={() => setFilterStatus('อนุมัติแล้ว')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.อนุมัติแล้ว}</p>
                <p className="text-sm opacity-90">อนุมัติแล้ว</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-red-400 to-red-500 hover:shadow-lg"
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
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="mb-1 text-blue-600">รายการหัก ณ ที่จ่าย</h2>
              {filterStatus !== 'all' && (
                <p className="text-sm text-gray-500">
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
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              สร้างเอกสาร
            </Button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="ค้นหาด้วยเลขที่เอกสาร หรือชื่อผู้รับเงิน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่เอกสาร</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ผู้รับเงิน</TableHead>
                  <TableHead className="text-right">จำนวนเงินที่จ่าย</TableHead>
                  <TableHead className="text-right">ภาษีหัก ณ ที่จ่าย</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.doc_number}</TableCell>
                      <TableCell>
                        {new Date(item.doc_date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{item.recipient_name}</TableCell>
                      <TableCell className="text-right">
                        {item.total_amount.toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.total_tax.toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="focus:outline-none">
                              {getStatusBadge(item.status)}
                            </button>
                          </DropdownMenuTrigger>
                          {canEdit && (
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item, 'ร่าง')}
                              >
                                ร่าง
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item, 'รออนุมัติ')}
                              >
                                รออนุมัติ
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item, 'อนุมัติแล้ว')}
                              >
                                อนุมัติแล้ว
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item, 'ยกเลิก')}
                              >
                                ยกเลิก
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          )}
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(item)}
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint(item)}
                            title="พิมพ์"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className=" w-[1500px] h-[99.5vh] flex flex-col p-0 gap-0 m-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>รายละเอียดหัก ณ ที่จ่าย</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              <div className="space-y-6">
              {/* Document Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-600">เลขที่เอกสาร</Label>
                  <p>{selectedItem.doc_number}</p>
                </div>
                <div>
                  <Label className="text-gray-600">วันที่</Label>
                  <p>
                    {new Date(selectedItem.doc_date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">ลำดับที่</Label>
                  <p>{selectedItem.sequence_number}</p>
                </div>
              </div>

              {/* Payer Info */}
              <div className="pt-4 border-t">
                <h3 className="mb-3">ข้อมูลผู้จ่ายเงิน</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">เลขประจำตัวผู้เสียภาษี</Label>
                    <p>{selectedItem.payer_tax_id}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">ชื่อ-สกุล/ชื่อบริษัท</Label>
                    <p>{selectedItem.payer_name}</p>
                  </div>
                </div>
              </div>

              {/* Recipient Info */}
              <div className="pt-4 border-t">
                <h3 className="mb-3">ข้อมูลผู้รับเงิน</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">เลขประจำตัวผู้เสียภาษี</Label>
                    <p>{selectedItem.recipient_tax_id}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">ชื่อ-สกุล/ชื่อบริษัท</Label>
                    <p>{selectedItem.recipient_name}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-600">ที่อยู่</Label>
                    <p>{selectedItem.recipient_address}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">ประเภทผู้รับเงิน</Label>
                    <p>
                      {selectedItem.recipient_type === 'individual' && 'บุคคลธรรมดา'}
                      {selectedItem.recipient_type === 'juristic' && 'นิติบุคคล'}
                      {selectedItem.recipient_type === 'partnership' && 'ห้างหุ้นส่วน'}
                      {selectedItem.recipient_type === 'other' && 'อื่นๆ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Income Items */}
              <div className="pt-4 border-t">
                <h3 className="mb-3">ประเภทเงินได้พึงประเมินที่จ่าย</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>รายการ</TableHead>
                      <TableHead>วันที่จ่าย</TableHead>
                      <TableHead className="text-right">อัตราภาษี</TableHead>
                      <TableHead className="text-right">จำนวนเงินที่จ่าย</TableHead>
                      <TableHead className="text-right">ภาษีหัก ณ ที่จ่าย</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItem.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.type}</TableCell>
                        <TableCell className="max-w-xs truncate" title={item.description}>
                          {item.description}
                        </TableCell>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">{item.tax_rate}%</TableCell>
                        <TableCell className="text-right">
                          {item.amount.toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.tax_amount.toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="pt-4 border-t">
                <div className="flex justify-end">
                  <div className="space-y-2 w-96">
                    <div className="flex justify-between">
                      <span className="text-gray-600">รวมเงินที่จ่าย:</span>
                      <span>
                        {selectedItem.total_amount.toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        บาท
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span>รวมภาษีหัก ณ ที่จ่าย:</span>
                      <span>
                        {selectedItem.total_tax.toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        บาท
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedItem.notes && (
                <div className="pt-4 border-t">
                  <Label className="text-gray-600">หมายเหตุ</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedItem.notes}</p>
                </div>
              )}

              <div className="pt-4 text-sm text-gray-500 border-t">
                <p>สร้างโดย: {selectedItem.created_by}</p>
                {selectedItem.created_at && (
                  <p>
                    สร้างเมื่อ:{' '}
                    {new Date(selectedItem.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
              </div>
            </div>
          )}
          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบหัก ณ ที่จ่าย {selectedItem?.doc_number} ใช่หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
