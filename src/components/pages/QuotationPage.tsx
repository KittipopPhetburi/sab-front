import { useState, useEffect } from "react";
import axios from "axios";
import type { UserRole } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Plus,
  Trash2,
  Eye,
  Edit,
  Search,
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Settings,
} from "lucide-react";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Label } from "../ui/label";
import { toast } from "sonner";
import TaxInvoiceForm from "../TaxInvoiceForm";
import {
  companySettingService,
  type CompanySetting,
} from "../../services/companySettingService";

import ThaiBahtText from "thai-baht-text";
import { customerService } from "../../services/customerService";

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
  customer_branch_name?: string;
  reference_doc?: string;
  shipping_address?: string;
  shipping_phone?: string;
  seller_name?: string; // เพิ่มชื่อผู้ขาย
  items?: Array<{
    id: string;
    description: string;
    amount: number;
    productId?: number;
    qty?: number; // จำนวน
    unit?: string; // หน่วย
    price?: number; // ราคาต่อหน่วย
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
  status: "ร่าง" | "รออนุมัติ" | "อนุมัติแล้ว" | "ยกเลิก";
  doc_type?: "original" | "copy"; // ประเภทเอกสาร: ต้นฉบับ หรือ สำเนา
  description?: string;
  valid_until?: string;
  created_at?: string;
  updated_at?: string;
}

export default function QuotationPage({ userRole }: QuotationPageProps) {
  const API_URL = "http://127.0.0.1:8000/api/quotations";
  const [data, setData] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [companySetting, setCompanySetting] = useState<CompanySetting | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Quotation | null>(null);
  const [filterDocType, setFilterDocType] = useState<
    "all" | "original" | "copy"
  >("all");

  const canEdit = userRole === "admin" || userRole === "account";
  const canDelete = userRole === "admin" || userRole === "account";

  // Fetch data from API
  useEffect(() => {
    fetchQuotations();
    loadCompanySettings();
    fetchCustomers();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const setting = await companySettingService.get();
      setCompanySetting(setting);
    } catch (error) {
      console.error("Error loading company settings:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const allCustomers = await customerService.getAll();
      setCustomers(allCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const getBranchNameByCustomer = (customerCode?: string) => {
    if (!customerCode || !customers.length) return "-";
    const customer = customers.find((c) => c.code === customerCode);
    return customer?.branch_name || "-";
  };

  const fetchQuotations = async () => {
    try {
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === "ร่าง").length,
    รออนุมัติ: data.filter((item) => item.status === "รออนุมัติ").length,
    อนุมัติแล้ว: data.filter((item) => item.status === "อนุมัติแล้ว").length,
    ยกเลิก: data.filter((item) => item.status === "ยกเลิก").length,
  };

  const handleSaveQuotation = () => {
    // TaxInvoiceForm บันทึกข้อมูลให้เองแล้ว ไม่ต้องบันทึกซ้ำ
    setShowQuotationForm(false);
    setSelectedItem(null);
    fetchQuotations();
  };

  const handleView = (item: Quotation) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleCancelQuotationForm = () => {
    setShowQuotationForm(false);
    setSelectedItem(null);
  };
  const handleEdit = (item: Quotation) => {
    setSelectedItem(item);
    setShowQuotationForm(true);
  };

  const handleDeleteClick = (item: Quotation) => {
    if (!canDelete) {
      toast.error("คุณไม่มีสิทธิ์ลบข้อมูล");
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
      console.error("Error deleting quotation:", error);
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการลบใบเสนอราคา"
      );
    }
  };

  const handleStatusChange = async (
    item: Quotation,
    newStatus: "ร่าง" | "รออนุมัติ" | "อนุมัติแล้ว" | "ยกเลิก"
  ) => {
    if (!canEdit) {
      toast.error("คุณไม่มีสิทธิ์เปลี่ยนสถานะ");
      return;
    }

    try {
      // ใช้ API endpoint แยกสำหรับอัปเดทสถานะ
      await axios.patch(`${API_URL}/${item.id}/status`, { status: newStatus });
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      fetchQuotations();
    } catch (error: any) {
      console.error("Error changing status:", error);
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ร่าง: "outline",
      รออนุมัติ: "secondary",
      อนุมัติแล้ว: "default",
      ยกเลิก: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customer_name || item.customer || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;
    const matchesDocType =
      filterDocType === "all" ||
      (filterDocType === "original" &&
        (!item.doc_type || item.doc_type === "original")) ||
      (filterDocType === "copy" && item.doc_type === "copy");
    return matchesSearch && matchesStatus && matchesDocType;
  });

  // ถ้ากำลังแสดงฟอร์ม ให้แสดงฟอร์มเต็มหน้าจอแทนที่หน้ารายการ
  if (showQuotationForm) {
    return (
      <TaxInvoiceForm
        documentType="quotation"
        onSave={handleSaveQuotation}
        onCancel={handleCancelQuotationForm}
        editData={
          selectedItem as unknown as Record<string, unknown> | undefined
        }
      />
    );
  }

  // Build logo URL from company settings (supports http(s), data URI, or server-relative paths)
  const API_ORIGIN = "http://127.0.0.1:8000";
  const resolveLogoUrl = (raw?: string | null): string => {
    if (!raw || raw.trim() === "") return `${window.location.origin}/logo.png`;
    const val = raw.trim();
    if (val.startsWith("data:")) return val;
    if (val.startsWith("http://") || val.startsWith("https://")) return val;
    if (val.startsWith("/")) return `${API_ORIGIN}${val}`; // e.g. /storage/logo.png
    return `${API_ORIGIN}/${val}`; // e.g. storage/logo.png
  };
  const logoUrl = resolveLogoUrl(companySetting?.logo);

  const handlePrintWithType = (
    item: Quotation,
    printType: "original" | "copy"
  ) => {
    // ถ้ามี doc_type ในฐานข้อมูลให้ใช้จากฐานข้อมูล ถ้าไม่มีให้ใช้ที่เลือก
    const isCopy = item.doc_type === "copy" || printType === "copy";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("กรุณาอนุญาตให้เปิดหน้าต่างใหม่");
      return;
    }

    // ป้องกัน error: แปลงค่าตัวเลขทั้งหมดให้แน่ใจว่าเป็น number
    const subtotal = Number(item.subtotal || 0);
    const discount_amount = Number(item.discount_amount || 0);
    const after_discount = Number(item.after_discount || 0);
    const vat = Number(item.vat || 0);
    const grand_total = Number(item.grand_total || 0);

    interface QuotationItem {
      id: string;
      description: string;
      amount: number;
      productId?: number;
      qty?: number;
      unit?: string;
      price?: number;
    }

    interface PageItem {
      pageNum: number;
      items: QuotationItem[];
      isLastPage: boolean;
    }

    interface QuotationItem {
      id: string;
      description: string;
      amount: number;
      productId?: number;
      qty?: number;
      unit?: string;
      price?: number;
    }

    interface PageItem {
      pageNum: number;
      items: QuotationItem[];
      isLastPage: boolean;
    }

    // Split items into pages (18 items per page)
    const itemsPerPage = 16;
    const items = item.items || [];
    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage)); // At least 1 page
    const pages: PageItem[] = [];

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const startIdx = pageNum * itemsPerPage;
      const endIdx = Math.min(startIdx + itemsPerPage, items.length);
      const pageItems = items.slice(startIdx, endIdx);
      const isLastPage = pageNum === totalPages - 1;

      // Fill remaining rows with empty items to maintain consistent table size
      const emptyRows = itemsPerPage - pageItems.length;
      const filledPageItems = [...pageItems];
      for (let i = 0; i < emptyRows; i++) {
        filledPageItems.push({
          id: `empty-${i}`,
          description: " ",
          amount: 0,
          qty: undefined,
          unit: " ",
          price: undefined,
        });
      }

      pages.push({
        pageNum: pageNum + 1,
        items: filledPageItems,
        isLastPage,
      });
    }

    const htmlContent = `
  <!DOCTYPE html>
  <html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>ใบเสนอราคา ${item.quotation_number}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@400;600;700&display=swap');

      @page {
        size: A4;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
        background-color: #f0f0f0;
      }

      body {
        font-family: 'Anuphan', sans-serif;
        font-size: 14px;
        color: #000;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 0;
      }

      .page-container {
        position: relative;
        width: 210mm;
        min-height: 297mm;
        padding: 15mm 15mm;
        margin: 20px auto;
        background: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }

      @media print {
        .page-container {
          page-break-after: always;
          margin: 0;
        }
        .page-container:last-child {
          page-break-after: avoid;
        }
      }

      /* แถบสีน้ำเงินด้านขวา */
      .page-container::before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 32px;
        height: 310px;
        background: #285c91;
        z-index: 10;
      }

      /* Grayscale for copy */
      ${
        isCopy
          ? `
      .page-container::before {
        background: #808080 !important;
      }
      .doc-title {
        color: #000 !important;
      }
      body {
        filter: grayscale(100%);
        -webkit-filter: grayscale(100%);
      }
      /* Exempt images (logo) from grayscale */
      img {
        filter: none !important;
        -webkit-filter: none !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      `
          : ""
      }

      @media print {
        html, body {
          background-color: white;
          display: block;
          margin: 0;
          padding: 0;
        }
        .page-container {
          width: 210mm;
          min-height: 297mm;
          height: auto;
          padding: 15mm 15mm;
          margin: 0;
          box-shadow: none;
          page-break-before: always;
        }
        .page-container:first-child {
          page-break-before: avoid;
        }
        .page-container:last-child {
          page-break-after: avoid;
        }
        .page-container::before {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

    ////
    table.header {
    width: 100%;
    border-collapse: collapse;
  }

  table.header td {
    padding: 2px;
    vertical-align: top;
  }
.header-right-cell {
  padding-left: 0;
}
  /* ช่องขวาทั้งก้อน */
  .header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;    /* ชิดขวา */
    margin-right: 5px;
    gap: 8px;
  }

  /* แบ่งด้านในเป็น 2 ช่อง: ข้อความ + รูป */
  .header-right-inner {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: flex-end;
  }

          .info-box {
            display: grid;
            grid-template-columns: auto auto 1fr;
            gap: 5px 8px; /*ช่องแรกแถว ช่องสองคอลัม */
          }
          .info td.info-right > .info-box{
            display: grid;
            grid-template-columns: max-content .7ch 1fr; 
            column-gap: 6px;      
            row-gap: 6px;        
            align-items: baseline;
            line-height: 1.25;    
            }
          .info-box .k{ white-space:nowrap; }
          .info-box .sep{ text-align:center; }
          .info-box .v{ min-width:0 }
  .contact-img img {
    width: 70px;           /* ปรับขนาดรูปตามต้องการ */
    height: 70px;
    object-fit: contain;
  }
    /////


      th, td {
        border: 1px solid #000;
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
        font-size: 14px;
        font-weight: 700;
        color: #000;
      }
      .doc-title {
        text-align: center;
        font-weight: 700;
        margin-top: 45px;
        color: #578fc5;
        font-size: 28px;
      }
      .doc-title2 {
        font-weight: 700;
        color: #0d0d0d;
        font-size: 28px;
      }

      .info {
        border: 1px solid #000;
        margin-top: 5px;
        font-size: 14px;

      }
      .info td { padding: 6px 8px; vertical-align: top; }

      .info-right { 
      border: 1px solid #000;
      margin-top: 5px;
      font-size: 14px;
      }

      .items {
        width: 100%;
        border-collapse: collapse;
        font-family: 'Anuphan', sans-serif;
        font-size: 10pt;
      }

      .items thead th {
        border: 1px solid #000;
        padding: 8px 5px;
        background-color: #f2f2f2;
        text-align: center;
        height: 30px;
      }

      .items tbody tr.item-row td {
        border-left: 0.5px solid #000;
        border-right: 0.5px solid #000;
        border-bottom: none;
        padding: 6px 10px;
        vertical-align: middle;
        word-wrap: break-word;
        word-break: break-word;
        white-space: normal;
        height: 30px;
        line-height: 1.2;
      }

      .items tbody tr td[colspan="6"] {
        font-style: italic;
        color: #666;
        padding: 20px 0;
        text-align: center;
      }


      .items tfoot.summary-footer td {
        border: 1px solid #000;
        padding: 6px 8px;
      }
      .summary {
        width: 45%;
        float: left;
        border-collapse: collapse;
        margin-top: 6px;
      }
      .summary td {
        border: 1px solid #000;
        padding: 6px;
      }
      .summary td.label { font-weight: 600; }
      .summary td.value { text-align: right; }

      .note {
        border: 1px solid #000;
        padding: 6px 10px;
        margin-top: 10px;
        font-size: 13px;
      }

      .footer {
            text-align: center;
            border-collapse: collapse;
            font-size: 13px;
            position: absolute;
           
            left: 50%;
            transform: translateX(-50%);
            width: calc(100% - 30mm);
          }
          .footer td { 
            border: none; 
            padding: 6px; 
            vertical-align: top;
          }
          .sig-row td {
            padding-top: 30px;
            line-height: 2;
          }
          .sig-title {
            margin-bottom: 8px;
          }

    </style>
  </head>
  <body>
  ${pages
    .map(
      (page) => `
  <div class="page-container">

   <table class="header">
  <tr>
    <td>
      <!-- ฝั่งซ้ายตามเดิม -->
      <img src="${logoUrl}" alt="Logo" style="height:60px; margin-bottom:6px;" color="#000"/>
      <div class="company-name">${companySetting?.company_name || "บริษัท"} ${
        companySetting?.branch_name ? `(${companySetting.branch_name})` : ""
      }</div>
      ${companySetting?.address || ""}<br/>
      เลขประจำตัวผู้เสียภาษี ${companySetting?.tax_id || "-"} <br/> 
โทร : ${companySetting?.phone || "-"} Email : <a href="${
        companySetting?.email || ""
      }">${companySetting?.email || "-"} </a>
              </td>

    <td class="header-right-cell">
  <div class="header-right">
    <div class="doc-title">ใบเสนอราคา <br/>  
    <div class="doc-title2">Quotation</div>
      <div class="doc-title3" style="font-size: 14px; color: #000; font-weight: 400; margin-top: 5px;">${
        isCopy ? "สำเนา" : "ต้นฉบับ"
      }</div>
  </div>
  </div>
    </td>
  
  </tr>
  </table>

    ${
      page.pageNum === 1
        ? `
      <table class="info">
      <tr>  
        <td style="width:64%" class="info-left">
          ลูกค้า : ${item.customer_name || "-"}<br/>
          ที่อยู่ : ${item.customer_address || "-"}<br/>
          โทร : ${item.customer_phone || "-"} อีเมล์ : ${
            item.customer_email || "-"
          }<br/>
          เลขประจำตัวผู้เสียภาษี : ${
            item.customer_tax_id || "-"
          } สาขา ${getBranchNameByCustomer(item.customer_code)}
        </td>        
        <td style="width:35%" class="info-right">
                  <div class="info-box">
                        <span class="k">เลขที่</span><span class="sep">:</span><span class="v">&nbsp;${
                          item.quotation_number
                        }</span>
                        <span class="k">วันที่</span><span class="sep">:</span><span class="v">&nbsp;${new Date(
                          item.date
                        ).toLocaleDateString("th-TH")}</span>
                        <span class="k">อ้างอิง</span><span class="sep">:</span><span class="v">&nbsp;${
                          item.status || "-"
                        }</span>
                        <span class="k">ผู้ขาย</span><span class="sep">:</span><span class="v">&nbsp;${
                          item.seller_name || "-"
                        }</span>
                        </div>
        </td>
      </tr>
    </table>`
        : ""
    }

    <table class="items" style="margin-top:10px;">
      <thead>
        <tr>
          <th style="width:40px;">ที่</th>
          <th>รายละเอียด</th>
          <th style="width:50px;">จำนวน</th>
          <th style="width:50px;">หน่วย</th>
          <th style="width:160px;">ราคาต่อหน่วย(บาท)</th>
          <th style="width:80px;">ยอดรวม(บาท)</th>
        </tr>
      </thead>
      <tbody>
        ${
          page.items.length > 0
            ? page.items
                .map(
                  (i, idx: number) => `
              <tr class="item-row">
                <td class="text-center">${
                  i.id.startsWith("empty-")
                    ? ""
                    : (page.pageNum - 1) * itemsPerPage + idx + 1
                }</td>
                <td style="max-width: 300px;">${
                  i.id.startsWith("empty-") ? "" : i.description || "-"
                }</td>
                <td class="text-center">${
                  i.id.startsWith("empty-") ? "" : i.qty || 1
                }</td>
                <td class="text-center">${
                  i.id.startsWith("empty-") ? "" : i.unit || "-"
                }</td>
                <td class="text-right">${
                  i.id.startsWith("empty-")
                    ? ""
                    : Number(i.price || 0).toLocaleString()
                }</td>
                <td class="text-right">${
                  i.id.startsWith("empty-")
                    ? ""
                    : Number(i.amount || 0).toLocaleString()
                }</td>
              </tr>`
                )
                .join("")
            : `<tr class="item-row"><td colspan="6" style="text-align: center;">- ไม่มีรายการสินค้า -</td></tr>`
        }
        ${
          !page.isLastPage
            ? `<tr class="item-row">
            <td colspan="6" style="border-bottom: 1px solid #000; padding: 0; height: 1px;"></td>
          </tr>`
            : ""
        }
      </tbody>
${
  page.isLastPage
    ? `<tfoot class="summary-footer">
        <tr>
            <td colspan="3" style="text-align: left; border-right: none;"> 
                <b>หมายเหตุ :</b></br>${item.notes || ""}
            </td>
    
            <td colspan="2" style="text-align: right; padding-right: 5px;">
                รวมเป็นเงิน<br/>
                ส่วนลด<br/>
                ราคาหลังหักส่วนลด<br/>
                ภาษีมูลค่าเพิ่ม VAT 7%
            </td>
            <td colspan="1" style="text-align: right; padding-right: 5px;">
             ${subtotal.toLocaleString(undefined, {
               minimumFractionDigits: 2,
             })} 
             ${discount_amount.toLocaleString(undefined, {
               minimumFractionDigits: 2,
             })} 
             ${after_discount.toLocaleString(undefined, {
               minimumFractionDigits: 2,
             })} 
             ${vat.toLocaleString(undefined, {
               minimumFractionDigits: 2,
             })} 
                
            </td>
        </tr>
    
        <tr>
            <td colspan="3" style="text-align: left;">
                จำนวนเงินเป็นตัวอักษร (${ThaiBahtText(grand_total)})
            </td> 
    
            <td colspan="2" style="text-align: right; padding-right: 5px;">
                จำนวนเงินรวมทั้งสิ้น
            </td>
            <td colspan="1" style="text-align: right; padding-right: 5px;">
            ${grand_total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })} 

            </td>
        </tr>
    </tfoot>`
    : ""
}
         
</table>
${
  page.isLastPage
    ? `<table class="footer" style="width: 100%;">
    <tbody>
        <tr class="sig-row">
            <td style="width: 50%; text-align: left; padding-left: 70px;">
                ลงชื่อ..........................................อนุมัติสั่งซื้อ<br/>
                (..................................................)<br/>
                วันที่อนุมัติ......./................./...........
            </td>
            
            <td style="width: 50%; text-align: left; padding-left: 40px;">
                ลงชื่อ..........................................ผู้เสนอราคา<br/>
                (..................................................)<br/>
                วันที่เสนอราคา......./................./........... 
                </td>
        </tr>
    </tbody>
</table>`
    : ""
}
  </div>
  `
    )
    .join("")}
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
          onClick={() => setFilterStatus("ร่าง")}
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
          onClick={() => setFilterStatus("รออนุมัติ")}
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
          onClick={() => setFilterStatus("อนุมัติแล้ว")}
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
          onClick={() => setFilterStatus("ยกเลิก")}
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
              {filterStatus !== "all" && (
                <p className="text-sm text-gray-500 mt-1">
                  กรองตาม: {filterStatus}{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => setFilterStatus("all")}
                  >
                    แสดงทั้งหมด
                  </Button>
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                setSelectedItem(null);
                setShowQuotationForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบเสนอราคา
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="     ค้นหาเลขที่เอกสาร, ลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                ประเภทเอกสาร:
              </label>
              <select
                value={filterDocType}
                onChange={(e) =>
                  setFilterDocType(
                    e.target.value as "all" | "original" | "copy"
                  )
                }
                className="h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
              >
                <option value="all">ทั้งหมด</option>
                <option value="original">ต้นฉบับ</option>
                <option value="copy">สำเนา</option>
              </select>
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
                  <TableCell>
                    {item.quotation_number}
                    {item.doc_type === "copy" && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs bg-gray-100"
                      >
                        สำเนา
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell>
                    {item.customer_name || item.customer || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    ฿
                    {Number(
                      item.grand_total || item.amount || 0
                    ).toLocaleString()}
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
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "ร่าง")}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          ร่าง
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "รออนุมัติ")}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          รออนุมัติ
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(item, "อนุมัติแล้ว")
                          }
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          อนุมัติแล้ว
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "ยกเลิก")}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          ยกเลิก
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(item)}
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        disabled={!canEdit}
                        title="แก้ไขเอกสาร"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const isCopy = item.doc_type === "copy";
                          handlePrintWithType(
                            item,
                            isCopy ? "copy" : "original"
                          );
                        }}
                        title={
                          item.doc_type === "copy"
                            ? "พิมพ์สำเนา (ขาวดำ)"
                            : "พิมพ์ต้นฉบับ (สี)"
                        }
                      >
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
            <DialogDescription>
              เลขที่ {selectedItem?.quotation_number}
            </DialogDescription>
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
                  <p className="mt-1">
                    {new Date(selectedItem.date).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ลูกค้า</Label>
                <p className="mt-1">
                  {selectedItem.customer_name || selectedItem.customer || "-"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">จำนวนเงิน</Label>
                  <p className="mt-1">
                    ฿
                    {(
                      selectedItem.grand_total ||
                      selectedItem.amount ||
                      0
                    ).toLocaleString()}
                  </p>
                </div>
                {selectedItem.valid_until && (
                  <div>
                    <Label className="text-gray-500">ใช้ได้ถึงวันที่</Label>
                    <p className="mt-1">
                      {new Date(selectedItem.valid_until).toLocaleDateString(
                        "th-TH"
                      )}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedItem.status)}
                </div>
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบใบเสนอราคา{" "}
              {selectedItem?.quotation_number}?
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
