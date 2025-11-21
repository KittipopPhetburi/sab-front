import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Printer,
  Mail,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import TaxInvoiceForm from "../TaxInvoiceForm";
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
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import InvoiceDetailPage from "./InvoiceDetailPage";
import {
  companySettingService,
  type CompanySetting,
} from "../../services/companySettingService";
import { customerService } from "../../services/customerService";

interface InvoicePageProps {
  userRole: UserRole;
}

interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  customer_code?: string;
  customer_branch_name?: string;
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
  status: "draft" | "pending" | "paid" | "cancelled";
  due_date?: string;
  created_at: string;
  updated_at: string;
  salesperson?: string;
  seller_name?: string;
  doc_type?: "original" | "copy"; // เพิ่ม doc_type
}

export default function InvoicePage({ userRole }: InvoicePageProps) {
  const [companySetting, setCompanySetting] = useState<CompanySetting | null>(
    null
  );
  const API_URL = "http://127.0.0.1:8000/api/invoices"; // เปลี่ยนเป็น invoices API แยกจาก receipts แล้ว
  const [data, setData] = useState<Invoice[]>([]);
  // customers list removed (not used); branch shown via invoice.customer_branch_name

  // Helper to resolve logo URL from settings
  const API_ORIGIN = "http://127.0.0.1:8000";
  const resolveLogoUrl = (raw?: string | null): string => {
    if (!raw || raw.trim() === "") return `${window.location.origin}/logo.png`;
    const val = raw.trim();
    if (val.startsWith("data:")) return val;
    if (val.startsWith("http://") || val.startsWith("https://")) return val;
    if (val.startsWith("/")) return `${API_ORIGIN}${val}`;
    return `${API_ORIGIN}/${val}`;
  };

  useEffect(() => {
    fetchData();
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const setting = await companySettingService.get();
      setCompanySetting(setting);
    } catch (error) {
      console.error("Error loading company settings:", error);
    }
  };

  // (Removed) customers fetching & helper — branch now comes from invoice.customer_branch_name

  const fetchData = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const json = await res.json();
        console.log("Invoice API response:", json);

        // Handle both array and {data: [...]} response formats
        let records: Invoice[] = [];
        if (Array.isArray(json)) {
          records = json;
        } else if (json && typeof json === "object" && "data" in json) {
          records = Array.isArray(json.data) ? json.data : [];
        }

        // Fetch customers once and merge branch into invoices when missing
        try {
          const customers = await customerService.getAll();
          const customersByCode = new Map(customers.map((c) => [c.code, c]));
          records = records.map((r) => {
            if (!r.customer_branch_name) {
              // Prefer matching by customer_code if available, else fallback to name
              const byCode = r.customer_code
                ? customersByCode.get(r.customer_code)
                : undefined;
              const byName = customers.find((c) => c.name === r.customer_name);
              const matched = byCode || byName;
              if (matched?.branch_name)
                (r as any).customer_branch_name = matched.branch_name;
            }
            return r;
          });
        } catch (err) {
          console.debug(
            "Failed to fetch customers to merge branch names:",
            err
          );
        }

        setData(records);
      } else {
        toast.error("โหลดข้อมูลไม่สำเร็จ");
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("เชื่อมต่อ API ไม่สำเร็จ");
      setData([]);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDocType, setFilterDocType] = useState<
    "all" | "original" | "copy"
  >("all"); // เพิ่ม filter doc_type
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Invoice | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showDetailPage, setShowDetailPage] = useState(false);
  const [formData, setFormData] = useState({
    customer_branch_name: "",
    customer: "",
    date: "",
    amount: "",
    description: "",
  });

  const canEdit = userRole === "admin" || userRole === "account";
  const canDelete = userRole === "admin" || userRole === "account";

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === "draft").length,
    รอชำระ: data.filter((item) => item.status === "pending").length,
    ชำระแล้ว: data.filter((item) => item.status === "paid").length,
    ยกเลิก: data.filter((item) => item.status === "cancelled").length,
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
        setFormData({
          customer_branch_name: "",
          customer: "",
          date: "",
          amount: "",
          description: "",
        });
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
      toast.error("คุณไม่มีสิทธิ์แก้ไขข้อมูล");
      return;
    }
    // Set the selected item and open the full-screen TaxInvoiceForm for editing
    setSelectedItem(item);
    setShowDocumentForm(true);
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

  const handleView = async (item: Invoice) => {
    // If invoice lacks branch name, attempt to find it from customer list for a better UX
    let out = item;
    if (!item.customer_branch_name) {
      try {
        const customers = await customerService.getAll();
        const byCode = item.customer_code
          ? customers.find((c) => c.code === item.customer_code)
          : undefined;
        const byName = customers.find((c) => c.name === item.customer_name);
        const matched = byCode || byName;
        if (matched?.branch_name) {
          out = {
            ...item,
            customer_branch_name: matched.branch_name,
          } as Invoice;
        }
      } catch (err) {
        // ignore and just show as-is
      }
    }
    setSelectedItem(out);
    setIsViewDialogOpen(true);
  };

  // Manual copy branch method has been removed.

  // Print function with doc_type support
  const handlePrintWithType = (
    item: Invoice,
    printType: "original" | "copy"
  ) => {
    const isCopy = item.doc_type === "copy" || printType === "copy";
    // Call the existing handlePrint function with the isCopy flag
    handlePrint(item, isCopy);
  };

  const handleDeleteClick = (item: Invoice) => {
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

  const handleStatusChange = async (
    item: Invoice,
    newStatus: "draft" | "pending" | "paid" | "cancelled"
  ) => {
    if (!canEdit) {
      toast.error("คุณไม่มีสิทธิ์เปลี่ยนสถานะ");
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
          data.map((d) => (d.id === item.id ? { ...d, status: newStatus } : d))
        );
        const statusText =
          newStatus === "draft"
            ? "ร่าง"
            : newStatus === "pending"
            ? "รอชำระ"
            : newStatus === "paid"
            ? "ชำระแล้ว"
            : "ยกเลิก";
        toast.success(`เปลี่ยนสถานะเป็น "${statusText}" สำเร็จ`);
      } else {
        const errorData = await res.json();
        console.error("API Error:", errorData);
        toast.error("เปลี่ยนสถานะไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      draft: "outline",
      pending: "secondary",
      paid: "default",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      draft: "ร่าง",
      pending: "รอชำระ",
      paid: "ชำระแล้ว",
      cancelled: "ยกเลิก",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;
    const matchesDocType =
      filterDocType === "all" ||
      (filterDocType === "original" &&
        (!item.doc_type || item.doc_type === "original")) ||
      (filterDocType === "copy" && item.doc_type === "copy");

    return matchesSearch && matchesStatus && matchesDocType;
  });

  const handleSaveDocument = () => {
    // ข้อมูลถูกบันทึกผ่าน API ใน TaxInvoiceForm แล้ว
    // แค่ refresh ข้อมูล
    fetchData();
    setShowDocumentForm(false);
    setSelectedItem(null);
  };

  const handleCancelDocument = () => {
    setShowDocumentForm(false);
    setSelectedItem(null);
  };

  const handleEmailClick = (item: Invoice) => {
    setSelectedItem(item);
    setEmailAddress("");
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedItem) return;

    if (!emailAddress || !emailAddress.includes("@")) {
      toast.error("กรุณากรอกอีเมลที่ถูกต้อง");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${selectedItem.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddress }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(result.message || "ส่งอีเมลสำเร็จ");
        setIsEmailDialogOpen(false);
        setEmailAddress("");
        setSelectedItem(null);
      } else {
        toast.error(result.message || "ส่งอีเมลไม่สำเร็จ");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ API");
    }
  };

  // Unified HTML generator for invoice display and printing
  const generateInvoiceHTML = (
    item: Invoice,
    options: {
      mode: "view" | "print";
      isCopy?: boolean;
    }
  ) => {
    const { mode, isCopy = false } = options;
    const parsedItems =
      typeof item.items === "string"
        ? JSON.parse(item.items)
        : item.items || [];
    const logoUrl = resolveLogoUrl(companySetting?.logo);

    interface InvoiceItem {
      id: string;
      description: string;
      amount: number;
      qty?: number;
      unit?: string;
      price?: number;
    }

    interface PageItem {
      pageNum: number;
      items: InvoiceItem[];
      isLastPage: boolean;
    }

    // Split items into pages (13 items per page)
    const itemsPerPage = 13;
    const totalPages = Math.max(
      1,
      Math.ceil(parsedItems.length / itemsPerPage)
    );
    const pages: PageItem[] = [];

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const startIdx = pageNum * itemsPerPage;
      const endIdx = Math.min(startIdx + itemsPerPage, parsedItems.length);
      const pageItems = parsedItems.slice(startIdx, endIdx);
      const isLastPage = pageNum === totalPages - 1;

      // Fill remaining rows with empty items
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

    return `
   <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8" />
        <title>${mode === "view" ? "รายละเอียด" : ""}ใบแจ้งหนี้ ${
      item.invoice_no
    }</title>
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
            background-color: ${mode === "view" ? "white" : "#f0f0f0"};
          }

          body {
            font-family: 'Anuphan', sans-serif;
            font-size: 14px;
            color: #000;
            ${
              mode === "print"
                ? "display: flex; flex-direction: column; align-items: center; padding: 20px 0;"
                : "padding: 20px;"
            }
          }

          .page-container {
            position: relative;
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            ${
              mode === "print"
                ? "margin: 20px auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1);"
                : "margin: 0 auto;"
            }
          }

          @media print {
            body {
              padding: 0;
              background: none;
            }
            .page-container {
              margin: 0;
              box-shadow: none;
              min-height: auto;
            }
            .page-container:not(:last-child) {
              page-break-after: always;
            }
            .print-button {
              display: none;
            }
          }

          ${
            mode === "view"
              ? `
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .print-button:hover {
            background: #2563eb;
          }
          `
              : ""
          }

          .page-container::before {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 32px;
            height: 310px;
            background: ${isCopy ? "#808080" : "#ff0000ff"};
            z-index: 10;
          }

          ${
            isCopy
              ? `
          .page-container * {
            filter: grayscale(100%);
            -webkit-filter: grayscale(100%);
          }
          .page-container .logo-img {
            filter: none !important;
            -webkit-filter: none !important;
          }
          .doc-title {
            color: #000 !important;
          }
          `
              : ""
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          table.header td {
            padding: 2px;
            vertical-align: top;
          }

          .logo-img {
            height: 60px;
            margin-bottom: 6px;
          }

          .company-name {
            font-size: 14px;
            font-weight: 700;
            color: #000;
          }

          .header-right-cell {
            padding-left: 0;
          }

          .header-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-right: 10px;
            gap: 2px;
          }

          .doc-title, .doc-title2, .doc-title3 {
            white-space: nowrap;
            word-break: keep-all;
            line-height: 1.1;
          }

          .doc-title {
            text-align: center;
            font-weight: 700;
            margin-right: 12px;
            margin-top: 60px;
            color: #ff0000ff;
            font-size: 22px;

          }

          .doc-title2 {
            font-weight: 700;
            color: #0d0d0d;
            font-size: 22px;
          }

          .doc-title3 {
            text-align: center;
            font-weight: 200;
            margin-right: 72px;
            margin-top: 0;
            color: #000000ff;
            font-size: 18px;
          }

          .info-box {
            display: grid;
            grid-template-columns: auto auto 1fr;
            gap: 5px 8px;
          }

          .info {
            border: 1px solid #000;
            margin-top: 5px;
            font-size: 14px;
          }

          .info td {
            padding: 6px 8px;
            vertical-align: top;
          }

          .info-right {
            border: 1px solid #000;
            margin-top: 5px;
            font-size: 14px;
          }

          .items {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-top: 10px;
          }

          .items thead th {
            border: 1px solid #000;
            padding: 8px 5px;
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
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

          .items tfoot.summary-footer td {
            border: 1px solid #000;
            padding: 6px 8px;
          }

          .text-right { text-align: right; }
          .text-center { text-align: center; }

          .footer {
            text-align: center;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 40px;
            width: 100%;
          }
          .footer td {
            border: none;
            padding: 10px;
            vertical-align: top;
          }
          .sig-row td {
            line-height: 1.8;
          }

          @media print {
            .page-container::before {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${
          mode === "view"
            ? '<button class="print-button" onclick="window.print()">🖨️ พิมพ์</button>'
            : ""
        }
        
        ${pages
          .map(
            (page) => `
        <div class="page-container">
          <table class="header">
            <tr>
              <td>
                <img src="${logoUrl}" alt="Logo" style="height:60px; margin-bottom:6px;" />
                <div class="company-name">${
                  companySetting?.company_name || "บริษัท"
                } ${
              companySetting?.branch_name
                ? `(${companySetting.branch_name})`
                : ""
            }</div>
                ${companySetting?.address || ""}<br/>
                เลขประจำตัวผู้เสียภาษี ${companySetting?.tax_id || "-"} ${
              item.customer_branch_name ? `(${item.customer_branch_name})` : ""
            }<br/> 
                โทร : ${companySetting?.phone || "-"} Email : <a href="${
              companySetting?.email || ""
            }">${companySetting?.email || "-"} </a>
              </td>
              <td class="header-right-cell">
                <div class="header-right">
                  <div class="doc-title">${
                    mode === "view" ? "รายละเอียด" : ""
                  }ใบส่งสินค้า/ใบแจ้งหนี้</div>
                  <div class="doc-title2">Delivery Note/Invoice</div>
                  <div class="doc-title3">${isCopy ? "สำเนา" : "ต้นฉบับ"}</div>
                </div>
              </td>
            </tr>
          </table>

          ${
            page.pageNum === 1
              ? `
            <table class="info">
              <tr>
                <td style="width:64% class="info-left">
                  ลูกค้า : ${item.customer_name || "-"}<br/>
                  ที่อยู่ : ${item.customer_address || "-"}<br/>
                  โทร : ${item.customer_phone || "-"} อีเมล : ${
                  item.customer_email || "-"
                }<br/>
                  เลขประจำตัวผู้เสียภาษี : ${
                    item.customer_tax_id || "-"
                  } สาขา ${item.customer_branch_name || ""}<br/>
                </td>
                <td style="width:35.5%" class="info-right">
                  <div class="info-box">
                    <span class="k">เลขที่</span><span class="sep">:</span><span class="v">&nbsp;${
                      item.invoice_no
                    }</span>
                    <span class="k">วันที่</span><span class="sep">:</span><span class="v">&nbsp;${new Date(
                      item.invoice_date
                    ).toLocaleDateString("th-TH")}</span>
                    <span class="k">อ้างอิงเอกสาร</span><span class="sep">:</span><span class="v">&nbsp;${
                      item.reference_doc || "-"
                    }</span>
                    <span class="k">เลขที่โครงการ</span><span class="sep">:</span><span class="v">&nbsp;</span>
                  </div>
                </td>
              </tr>
            </table>
          `
              : ""
          }

          <table class="items">
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
              ${page.items
                .map(
                  (i, idx) => `
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
                </tr>
              `
                )
                .join("")}
            </tbody>
            ${
              page.isLastPage
                ? `
              <tfoot class="summary-footer">
                <tr>
                  <td colspan="3" style="text-align: left; border-right: none;">
                    <b>หมายเหตุ :</b> ${item.notes || ""}
                  </td>
                  <td colspan="2" style="text-align: right; padding-right: 5px;">
                    รวมเป็นเงิน<br/>
                    ส่วนลด<br/>
                    ราคาหลังหักส่วนลด<br/>
                    ภาษีมูลค่าเพิ่ม VAT 7%
                  </td>
                  <td colspan="1" style="text-align: right; padding-right: 5px;">
                    <b>${item.subtotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}</b><br/>
                    <b>${item.discount_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}</b><br/>
                    <b>${item.after_discount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}</b><br/>
                    <b>${item.vat.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}</b>
                  </td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: left;">
                    <b>จำนวนเงินเป็นตัวอักษร (..................................................)</b>
                  </td>
                  <td colspan="2" style="text-align: right; padding-right: 5px;">
                    <b>จำนวนเงินรวมทั้งสิ้น</b>
                  </td>
                  <td colspan="1" style="text-align: right; padding-right: 5px;">
                    <b>${item.grand_total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}</b>
                  </td>
                </tr>
              </tfoot>
            `
                : ""
            }
          </table>

          ${
            page.isLastPage
              ? `
            <table class="footer">
              <tbody>
                <tr class="sig-row">
                  <td style="width: 40%; text-align: left; padding-left: 60px;">
                    ได้รับสินค้า/บริการเรียบร้อยครบถ้วน<br/>
                    ลงชื่อ..........................................ลูกค้า<br/>
                    (..................................................)<br/>
                    วันที่........../................./...........
                  </td>
                  <td style="width: 60%; text-align: left; padding-left: 80px;">
                    ในนามบริษัท ${companySetting?.company_name || "บริษัท"}<br/>
                    ลงชื่อ..........................................ผู้ส่งสินค้า<br/>
                    (..................................................)<br/>
                    วันที่........../................./...........
                  </td>
                </tr>
              </tbody>
            </table>
          `
              : ""
          }
        </div>
        `
          )
          .join("")}
      </body>
      </html>
    `;
  };

  const handlePrint = (item: Invoice, isCopy: boolean = false) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("กรุณาอนุญาตให้เปิดหน้าต่างใหม่");
      return;
    }

    const htmlContent = generateInvoiceHTML(item, { mode: "print", isCopy });

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    toast.success(`เตรียมพิมพ์ ${item.invoice_no}`);
  };

  if (showDetailPage && selectedItem) {
    return (
      <InvoiceDetailPage
        invoice={selectedItem}
        onClose={() => {
          setShowDetailPage(false);
          setSelectedItem(null);
        }}
      />
    );
  }

  if (showDocumentForm) {
    return (
      <TaxInvoiceForm
        documentType="invoice"
        onSave={handleSaveDocument}
        onCancel={handleCancelDocument}
        editData={
          selectedItem as unknown as Record<string, unknown> | undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-blue-400 to-blue-500 hover:shadow-lg"
          onClick={() => setFilterStatus("draft")}
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
          onClick={() => setFilterStatus("pending")}
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
          onClick={() => setFilterStatus("paid")}
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
          onClick={() => setFilterStatus("cancelled")}
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
              {filterStatus !== "all" && (
                <p className="mt-1 text-sm text-gray-500">
                  กรองตาม: {filterStatus}{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
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
                setShowDocumentForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบแจ้งหนี้
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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
                <TableHead>สาขา</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.invoice_no}
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
                    {new Date(item.invoice_date).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell>{item.customer_name}</TableCell>
                  <TableCell>{item.customer_branch_name || "-"}</TableCell>
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
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "draft")}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          ร่าง
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "pending")}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          รอชำระ
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "paid")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          ชำระแล้ว
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "cancelled")}
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
                          setSelectedItem(item);
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
                        onClick={() => handleEmailClick(item)}
                        title="ส่งอีเมล"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(item)}
                        disabled={!canDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Save invoice data to localStorage
                          localStorage.setItem(
                            `invoice-detail-${item.id}`,
                            JSON.stringify(item)
                          );
                          // Open in new tab
                          window.open(`/invoice/detail/${item.id}`, "_blank");
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
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
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ลูกค้า</Label>
                <Input
                  placeholder="ชื่อลูกค้า"
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
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
            <DialogDescription>
              แก้ไขข้อมูลใบแจ้งหนี้ {selectedItem?.invoice_no}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันที่</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ลูกค้า</Label>
                <Input
                  placeholder="ชื่อลูกค้า"
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
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
            <DialogDescription>
              เลขที่ {selectedItem?.invoice_no}
            </DialogDescription>
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
                  <p className="mt-1">
                    {new Date(selectedItem.invoice_date).toLocaleDateString(
                      "th-TH"
                    )}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ลูกค้า</Label>
                <div className="mt-1">
                  <div>{selectedItem.customer_name}</div>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">จำนวนเงิน</Label>
                <p className="mt-1">
                  ฿{selectedItem.grand_total.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedItem.status)}
                </div>
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
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
            <AlertDialogAction onClick={handleConfirmDelete}>
              ลบ
            </AlertDialogAction>
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
                  if (e.key === "Enter") {
                    handleSendEmail();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEmailDialogOpen(false)}
              >
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
