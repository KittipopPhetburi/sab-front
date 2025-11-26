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
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  Search,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Printer,
} from "lucide-react";
import { Badge } from "../ui/badge";
import TaxInvoiceForm from "../TaxInvoiceForm";
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
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import {
  companySettingService,
  type CompanySetting,
} from "../../services/companySettingService";
import { customerService } from "../../services/customerService";
import ThaiBahtText from "thai-baht-text";


interface ReceiptPageProps {
  userRole: UserRole;
}

interface Receipt {
  id: number;
  receipt_no: string;
  date: string;
  customer: string;
  customer_code?: string;
  customer_address?: string;
  customer_tax_id?: string;
  customer_phone?: string;
  customer_email?: string;
  invoice_ref: string; // แก้ชื่อ field ให้ตรงกับ backend
  amount: number;
  status: "ร่าง" | "รอออก" | "ออกแล้ว" | "ยกเลิก";
  description?: string;
  doc_type?: "original" | "copy"; // เพิ่ม doc_type
  seller_name?: string;
  salesperson?: string;
  customer_branch_name?: string;
  discount?: number;
  vat_rate?: number;
  subtotal?: number;
  discount_amount?: number;
  after_discount?: number;
  vat?: number;
  grand_total?: number;
}

const API_URL = "http://127.0.0.1:8000/api/receipts";

const generateReceiptNumber = (count: number) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `RC-${year}${month}-${String(count + 1).padStart(3, "0")}`;
};

export default function ReceiptPage({ userRole }: ReceiptPageProps) {
  const [data, setData] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [companySetting, setCompanySetting] = useState<CompanySetting | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDocType, setFilterDocType] = useState<
    "all" | "original" | "copy"
  >("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Receipt | null>(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [formData, setFormData] = useState({
    customer: "",
    customer_code: "",
    customer_address: "",
    customer_branch_name: "",
    customer_tax_id: "",
    seller_name: "",
    customer_phone: "",
    customer_email: "",
    date: "",
    invoiceNo: "",
    amount: "",
    description: "",
    
  });

  const canEdit = userRole === "admin" || userRole === "account";
  const canDelete = userRole === "admin" || userRole === "account";

  // Normalize customer names for tolerant matching (remove punctuation, collapse spaces)
  const normalize = (s?: string) =>
    (s || "")
      .toLowerCase()
      .trim()
      .replace(/[^0-9a-z\u0E00-\u0E7Fa-z]+/g, "");

  // Fetch data from API
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      console.log("Receipt API response:", response.data);
      console.log(
        "Response type:",
        typeof response.data,
        Array.isArray(response.data)
      );

      // Handle both array and {data: [...]} response formats
      let records: Receipt[] = [];
      if (Array.isArray(response.data)) {
        records = response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        records = Array.isArray(response.data.data) ? response.data.data : [];
      }

      console.log("Final records to set:", records);
      // Merge branch_name from customers for records that lack it (client-side best-effort)
      try {
        const customers = await customerService.getAll();
        const customersMapByCode = new Map(customers.map((c) => [c.code, c]));
        const customersMapByTax = new Map(customers.map((c) => [c.tax_id, c]));
        records = records.map((r) => {
          if (!r.customer_branch_name) {
            const byCode = r.customer_code
              ? customersMapByCode.get(r.customer_code)
              : undefined;
            const byTax = r.customer_tax_id
              ? customersMapByTax.get(r.customer_tax_id)
              : undefined;
            // name match tolerant
            const byName = customers.find(
              (c) => normalize(c.name) === normalize(r.customer)
            );
            const matched = byCode || byTax || byName;
            if (matched?.branch_name)
              (r as any).customer_branch_name = matched.branch_name;
          }
          return r;
        });
      } catch (err) {
        console.debug(
          "Failed to fetch customers for receipt branch merge:",
          err
        );
      }
      setData(records);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === "ร่าง").length,
    รอออก: data.filter((item) => item.status === "รอออก").length,
    ออกแล้ว: data.filter((item) => item.status === "ออกแล้ว").length,
    ยกเลิก: data.filter((item) => item.status === "ยกเลิก").length,
  };

  const handleAdd = async () => {
    try {
      const receiptNo = generateReceiptNumber(data.length);
      // Try to derive branch name from active customers when form doesn't provide it
      const customers = await customerService
        .getActiveCustomers()
        .catch((err) => {
          console.error("Error fetching customers for branch lookup:", err);
          return [] as any[];
        });
      const nInput = normalize(formData.customer);
      const matched =
        customers.find((c) => normalize(c.name) === nInput) ||
        customers.find((c) => normalize(c.name).includes(nInput)) ||
        customers.find((c) => nInput.includes(normalize(c.name)));
      const branchName = matched?.branch_name;
      const payload = {
        receipt_no: receiptNo,
        date: formData.date,
        customer: formData.customer,
        customer_code: formData.customer_code || "",
        customer_address: formData.customer_address || undefined,
        customer_tax_id: formData.customer_tax_id || undefined,
        customer_phone: formData.customer_phone || undefined,
        customer_branch_name:
          formData.customer_branch_name || branchName || undefined,
        seller_name:
          (companySetting as any)?.seller ||
          companySetting?.company_name ||
          undefined,
        salesperson:
          (companySetting as any)?.seller ||
          companySetting?.company_name ||
          undefined,
        customer_email: formData.customer_email || undefined,
        invoice_ref: formData.invoiceNo, // แก้ไขชื่อ field ให้ตรงกับ backend
        amount: Number(formData.amount),
        status: "ร่าง" as const,
        description: formData.description || undefined,
      };

      console.log("Receipt create payload:", payload);
      const createResp = await axios.post(API_URL, payload);
      console.log("Create response:", createResp.data);
      toast.success("สร้างใบเสร็จสำเร็จ");
      setIsAddDialogOpen(false);
      setFormData({
        customer: "",
        seller_name: "",
        customer_code: "",
        customer_address: "",
        customer_branch_name: "",
        customer_tax_id: "",
        customer_phone: "",
        customer_email: "",
        date: "",
        invoiceNo: "",
        amount: "",
        description: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error adding receipt:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างใบเสร็จ");
    }
  };

  const handleEdit = (item: Receipt) => {
    if (!canEdit) {
      toast.error("คุณไม่มีสิทธิ์แก้ไขข้อมูล");
      return;
    }

    // Set selected item and open TaxInvoiceForm to edit the receipt in the same format
    setSelectedItem(item);
    setShowDocumentForm(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    try {
      // Derive branch name from customer list if not provided in form
      const customers = await customerService
        .getActiveCustomers()
        .catch((err) => {
          console.error("Error fetching customers for branch lookup:", err);
          return [] as any[];
        });
      const nInput = normalize(formData.customer);
      const matched =
        customers.find((c) => normalize(c.name) === nInput) ||
        customers.find((c) => normalize(c.name).includes(nInput)) ||
        customers.find((c) => nInput.includes(normalize(c.name)));
      const branchName = matched?.branch_name;
      const payload = {
        receipt_no: selectedItem.receipt_no,
        date: formData.date,
        customer: formData.customer,
        customer_code: selectedItem.customer_code || "",
        customer_address: formData.customer_address || undefined,
        customer_tax_id: formData.customer_tax_id || undefined,
        customer_branch_name:
          formData.customer_branch_name || branchName || undefined,
        seller_name:
          (companySetting as any)?.seller ||
          companySetting?.company_name ||
          undefined,
        salesperson:
          (companySetting as any)?.seller ||
          companySetting?.company_name ||
          undefined,
        customer_phone: formData.customer_phone || undefined,
        customer_email: formData.customer_email || undefined,
        invoice_ref: formData.invoiceNo, // แก้ไขชื่อ field ให้ตรงกับ backend
        amount: Number(formData.amount),
        status: selectedItem.status,
        description: formData.description || undefined,
      };

      console.log("Receipt update payload:", payload);
      const updateResp = await axios.put(
        `${API_URL}/${selectedItem.id}`,
        payload
      );
      console.log("Update response:", updateResp.data);
      toast.success("แก้ไขใบเสร็จสำเร็จ");
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setFormData({
        customer: "",
        seller_name: "",
        customer_code: "",
        customer_address: "",
        customer_tax_id: "",
        customer_phone: "",
        customer_email: "",
        date: "",
        invoiceNo: "",
        amount: "",
        description: "",
        customer_branch_name: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error updating receipt:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขใบเสร็จ");
    }
  };

  

  const handleView = async (item: Receipt) => {
    let out = item;
    if (!item.customer_branch_name) {
      try {
        const customers = await customerService.getAll();
        const byCode = item.customer_code
          ? customers.find((c) => c.code === item.customer_code)
          : undefined;
        const byTax = item.customer_tax_id
          ? customers.find((c) => c.tax_id === item.customer_tax_id)
          : undefined;
        const byName = customers.find(
          (c) => normalize(c.name) === normalize(item.customer)
        );
        const matched = byCode || byTax || byName;
        if (matched?.branch_name)
          out = {
            ...item,
            customer_branch_name: matched.branch_name,
          } as Receipt;
      } catch (err) {
        // ignore and show as-is
        console.debug("Failed to fetch customer for detail branch lookup", err);
      }
    }
    setSelectedItem(out);
    setIsViewDialogOpen(true);
  };

  // Print function with doc_type support
  const handlePrintWithType = (
    item: Receipt,
    printType: "original" | "copy"
  ) => {
    const isCopy = item.doc_type === "copy" || printType === "copy";

    // Call the existing handlePrint function with the isCopy flag
    handlePrint(item, isCopy);
  };

  const handleDeleteClick = (item: Receipt) => {
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
      toast.success(`ลบใบเสร็จ ${selectedItem.receipt_no} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error("เกิดข้อผิดพลาดในการลบใบเสร็จ");
    }
  };

  const handlePrint = async (item: Receipt, isCopy: boolean = false) => {
    // If branch missing on the item, try to derive it at print-time from customer list
    if (!item.customer_branch_name) {
      try {
        const customers = await customerService.getActiveCustomers();
        const nInput = normalize(item.customer);
        const matched =
          customers.find((c) => normalize(c.name) === nInput) ||
          customers.find((c) => normalize(c.name).includes(nInput)) ||
          customers.find((c) => nInput.includes(normalize(c.name)));
        if (matched?.branch_name) {
          // mutate local copy only (do not attempt to persist here)
          (item as any).customer_branch_name = matched.branch_name;
        }
      } catch (err) {
        console.error("Error deriving branch for print:", err);
      }
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("กรุณาอนุญาตให้เปิดหน้าต่างใหม่");
      return;
    }

    // Helper to resolve logo URL from settings
    const API_ORIGIN = "http://127.0.0.1:8000";
    const resolveLogoUrl = (raw?: string | null): string => {
      if (!raw || raw.trim() === "")
        return `${window.location.origin}/logo.png`;
      const val = raw.trim();
      if (val.startsWith("data:")) return val;
      if (val.startsWith("http://") || val.startsWith("https://")) return val;
      if (val.startsWith("/")) return `${API_ORIGIN}${val}`;
      return `${API_ORIGIN}/${val}`;
    };

    const logoUrl = resolveLogoUrl(companySetting?.logo);

// ดึงค่าจาก payload receipt (มี fallback เผื่อใบเก่าเก็บแค่ amount)
const grandTotal = Number(
  item.grand_total ?? item.amount ?? 0
);
const subtotal = Number(item.subtotal ?? grandTotal);
const discountAmount = Number(item.discount_amount ?? 0);
const afterDiscount = Number(
  item.after_discount ?? subtotal - discountAmount
);
const vatRate = Number(item.vat_rate ?? 7);
const vatAmount = Number(
  item.vat ?? (afterDiscount * vatRate) / 100
);

    

    // Clean description - remove if corrupted or use default
    const cleanDescription = (desc: string | undefined) => {
      if (!desc)
        return `รับชำระเงินตามใบแจ้งหนี้เลขที่ ${item.invoice_ref || "-"}`;
      // Check if description looks corrupted (too many repeating special chars)
      if (
        desc.includes("การชำ ระเงิน") ||
        desc.match(/[ที่รที่กำหนดวันวั]{20,}/)
      ) {
        return `รับชำระเงินตามใบแจ้งหนี้เลขที่ ${item.invoice_ref || "-"}`;
      }
      return desc;
    };
    const ROWS_ON_A4 = 10;

    const htmlContent = `
  <!DOCTYPE html>
  <html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>ใบเสร็จรับเงิน/ใบกำกับภาษี ${item.receipt_no}</title>
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

      /* แถบสีเขียวด้านขวา */
      .page-container::before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 32px;
        height: 320px;
        background: #4CAF50;
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
      .info-box {
         display: grid;
            grid-template-columns: auto auto 1fr;
            gap: 5px 8px;
      }
      .info td > .info-box{
  display: grid;
  grid-template-columns: max-content 12px 1fr; /* ป้ายกำกับ | โคลอน | ค่า */
  column-gap: 8px;
  row-gap: 6px;
  align-items: baseline;      /* เรียงเส้นฐานให้สวย */
  height: 100%;               /* สูงเท่า td */
  padding: 6px 8px;           /* ระยะขอบในกรอบ */
  box-sizing: border-box;
}

/* สไตล์ให้เหมือนรูป */
.info-box .k{       /* ตัวหนาเฉพาะป้ายกำกับ */
  white-space: nowrap;
}

.info-box .sep{ 
text-align: center;
 }

}
.info-box .v{
  min-width: 0;
}

      table {
        width: 100%;
        border-collapse: collapse;
      }

      table.header {
        width: 100%;
        border-collapse: collapse;
      }

      table.header td {
        padding: 2px;
        vertical-align: top;
      }

      .header-right-cell {
        padding-top: 70px;
        padding-left: 70px;
      }

      .header-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin-right: 2px;
        gap: 8px;
      }

      

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

      /* keep phone+email on single line for header */
      .company-contact { white-space: nowrap; display:inline-block; }
      .doc-title {
        text-align: center;
        font-weight: 700;
        margin-top: 70px;
        color: #4CAF50;
        white-space: nowrap;
        font-size: 20px;
        line-height: 1.2;
      }
      .doc-title2 {
        text-align: center;
        font-weight: 700;
        color: #000;
        font-size: 18px;
      }
      .doc-title3 {
        text-align: center;
        font-size: 14px;
        color: #000;
        font-weight: 400;
        margin-top: 5px;
      }

      .info {
        margin-top: 5px;
        font-size: 14px;
      }
      .info td { 
      padding: 6px 8px;
      vertical-align: top;
      border: 1px solid #000;
      box-sizing: border-box;
      }
      /* keep phone+email in info block on same line */
      .info-contact { white-space: nowrap; display: inline-block; gap: 8px; }
      .info td.info-right{
        padding: 7px 5px;  
        vertical-align: left;
      }
      .info td.info-right > .info-box{
        display: grid;
        grid-template-columns: max-content .7ch 1fr; 
        column-gap: 6px;      
        row-gap: 6px;        
        align-items: baseline;
        line-height: 1.25;    
        }

      .items {
        width: 100%;
        border-collapse: collapse;
        font-family: 'Anuphan', sans-serif;
        font-size: 10pt;
      }

      .items thead th {
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        border-left: 1px solid #000;
        border-right: 1px solid #000;
        padding: 8px 5px;
        background-color: #f2f2f2;
        text-align: center;
        font-weight: bold;
        height: 30px;
      }

      .items tbody tr td {
        border-left: 1px solid #000;
        border-right: 1px solid #000;
        border-bottom: none;
        border-top: none;
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

      ./* กล่องหมายเหตุ/การชำระเงิน */
.note-box{
  border: 1px solid #000;
  padding: 6px 8px;
  margin-top: 6px;
  page-break-inside: avoid;
}

/* ช่องสรุปตัวเลขด้านขวา */
.sum-labels { text-align:right; padding-right:5px; vertical-align:top; }
.sum-values { text-align:right; padding-right:5px; vertical-align:top; }

/* แถว Total ให้มีเส้นบนชัด */
.total-row td { border-top:1px solid #000; }

/* กล่องหมายเหตุ/การชำระเงิน ให้ตัว td เป็นกรอบเลย */
.note-td{
  border:1px solid #000 !important;
  padding:6px 8px !important;
  page-break-inside: avoid;
}

/* บรรทัดในกล่อง */
.note-row{ display:flex; flex-wrap:nowrap; align-items:baseline; gap:8px; line-height:1.35; margin:2px 0; }

.note-row{
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 8px;
  line-height: 1.35;
  margin: 2px 0;
}

/* ช่องติ๊กแบบกล่อง */
.chk{
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.chk .box{
  width: 10px; height: 10px;
  border: 1px solid #000;
  display: inline-block;
}
/* คำ+จุดอยู่บรรทัดเดียวกัน */
.line{
  display:flex;
  align-items:baseline;
  gap:0;
}

/* ช่องเส้นจุด – คุมความถี่/ขนาดได้ และไม่เพิ่มความสูงบรรทัด */
/* เส้นจุด: ไม่เพิ่มความสูงแถว และคุมขนาด/ความถี่ได้ */
.dot{
  /* ปรับได้ทันทีทั้งจอและ print */
  --size: 2.4px;   /* ขนาดจุด: ใหญ่ขึ้นนิดเดียว */
  --gap:  3.6px;   /* ระยะห่าง: ถี่น้อยลง */
  --offset: .20em; /* ระดับเส้นเทียบ baseline (จูนได้ .16–.24em) */

  position: relative;
  flex: 1 1 auto;
  height: 0;          /* ไม่ดันแถว */
  line-height: 0;
  font-size: 0;       /* กันผล rounding แปลกๆ */
}

.dot::after{
  content: "";
  position: absolute;
  left: 0; right: 0;
  bottom: var(--offset);
  height: var(--size);
  background:
    radial-gradient(circle,
      currentColor calc(var(--size)/2),
      transparent  calc(var(--size)/2 + .1px))
    left center / calc(var(--size) + var(--gap)) var(--size) repeat-x;
  pointer-events: none;
}

/* Print: ปรับเฉพาะตำแหน่ง baseline เล็กน้อยถ้าต้องการ */
@media print{
  .dot{ --offset: .18em; }
}


    </style>
  </head>
  <body>
  <div class="page-container">

   <table class="header">
  <tr>
    <td>
        <img src="${logoUrl}" alt="Logo" style="height:60px; margin-bottom:6px;" />
        <div class="company-name">${companySetting?.company_name || "บริษัท"} ${
      companySetting?.branch_name ? `(${companySetting.branch_name})` : ""
    }</div>
        ${companySetting?.address || ""}<br/>
        เลขประจำตัวผู้เสียภาษี ${companySetting?.tax_id || "-"} <br/> 
        <span class="company-contact">โทร : ${
          companySetting?.phone || "-"
        } Email : <a href="${companySetting?.email || ""}">${
      companySetting?.email || "-"
    } </a></span>
    </td>
    <td class="header-right-cell">
      <div class="header-right">
          <div class="doc-title">ใบกำกับภาษี/ใบเสร็จรับเงิน<br/>  
            <div class="doc-title2">Tax Invoice/receipt</div>
            <div class="doc-title3">${isCopy ? "สำเนา" : "ต้นฉบับ"}</div>
      </div>
    </td>
  </tr>
  </table>

    <table class="info">
      <tr>
        <td style="width:64%">
          ชื่อลูกค้า : ${item.customer || "-"}<br/>
          ที่อยู่ : ${item.customer_address || "-"}<br/>
          <span class="info-contact">
            โทรศัพท์ : ${item.customer_phone || "-"}
            อีเมล :  ${item.customer_email || "-"}
          </span><br/>
          เลขประจำตัวผู้เสียภาษี : ${item.customer_tax_id || "-"} ${
      item.customer_branch_name ? `${item.customer_branch_name}` : ""
    }
        </td>        
   <td class="info-right">
  <div class="info-box">
    <span class="k">เลขที่</span><span class="sep">:</span><span class="v">${
      item.receipt_no
    }</span>
    <span class="k">วันที่</span><span class="sep">:</span><span class="v">${new Date(
      item.date
    ).toLocaleDateString("th-TH")}</span>
    <span class="k">อ้างอิงเอกสาร</span><span class="sep">:</span><span class="v">${
      item.invoice_ref || ""
    }</span>
    <span class="k">พนักงานขาย</span><span class="sep">:</span><span class="v">${
      item.seller_name || ""
    }</span>
  </div>
</td>


      </tr>
    </table>

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
        ${Array.from(
          { length: ROWS_ON_A4 },
          (_, i) => `
        <tr>
          <td class="text-center">${i === 0 ? "1" : ""}</td>
          <td style="max-width: 300px;">${
            i === 0 ? cleanDescription(item.description) : ""
          }</td>
          <td class="text-center">${i === 0 ? "1" : ""}</td>
          <td class="text-center">${i === 0 ? "" : ""}</td>
          <td class="text-right">${
            i === 0
              ? subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })
              : ""
          }</td>
          <td class="text-right">${
            i === 0
              ? subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })
              : ""
          }</td>
        </tr>`
        ).join("")}
      </tbody>
      <tfoot class="summary-footer">
  <!-- แถวเดียว: ซ้าย = หมายเหตุ/การชำระเงิน, ขวา = สรุปตัวเลข -->
  <tr class="sum-note-row">
    <td colspan="4" class="note-td" style="vertical-align:top;">
      <div class="note-row">
        <strong>หมายเหตุ :</strong>
        <span>กรณีเอกสารไม่ถูกต้อง ให้แจ้งเป็นลายลักษณ์อักษรภายใน 7 วัน</span>
      </div>
      <div class="note-row">
        <strong>การชำระเงิน :</strong>
        <span class="chk"><span class="box"></span> เงินสด</span>
        <span class="chk"><span class="box"></span> โอนเงินเข้าบัญชีธนาคาร</span>
      </div>
    <div class="line">
  <span class="chk"><span class="box"></span> เช็ค</span>
  <span>ธนาคาร</span><span class="dot"></span>
  <span>จำนวนเงิน</span><span class="dot"></span>
</div>

<div class="line">
  <span>เลขที่เช็ค</span><span class="dot"></span>
  <span>วันที่สั่งจ่าย</span><span class="dot"></span>
</div>
    </td>

    <td class="sum-labels">
      รวมเป็นเงิน<br/>
      ส่วนลด<br/>
      ราคาหลังหักส่วนลด<br/>
      ภาษีมูลค่าเพิ่ม VAT 7%
    </td>
    <td class="sum-values">
      <!-- ใส่ตัวเลขจริงของคุณตรงนี้ ถ้าต้องการ -->
  ${subtotal.toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}<br/>
  ${discountAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}<br/>
  ${afterDiscount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}<br/>
  ${vatAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}
</td>

              

    </td>
  </tr>

  <!-- แถวสุดท้าย: จำนวนเงินเป็นตัวอักษร + จำนวนเงินรวมทั้งสิ้น -->
<tr class="total-row">
  <td colspan="4" style="padding:6px 8px;">
  <div class="line">
    <span>จำนวนเงินเป็นตัวอักษร (${ThaiBahtText(grandTotal)})</span>
  </div>
</td>
  <td class="sum-labels">จำนวนเงินรวมทั้งสิ้น</td>
  <td class="sum-values">${grandTotal.toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}</td>
</tr>


</tfoot>

    </table>

    <table class="footer" style="width: 100%;">
      <tbody>
        <tr class="sig-row">
          <td style="width: 50%; text-align: center;">
            ได้รับสินค้า/บริการเรียบร้อยครบถ้วน<br/><br/>
            ลงชื่อ..........................................ผู้รับ<br/>
            (..................................................)<br/>
            วันที่............./................./..............
          </td>
          <td style="width: 50%; text-align: center;">
            ในนามบริษัท ไอ ที บี ที คอร์ปอเรชั่น จำกัด<br/><br/>
            ลงชื่อ..........................................ผู้รับเงิน<br/>
            (..................................................)<br/>
            วันที่............./................./..............
          </td>
        </tr>
      </tbody>
    </table>

  </div>
  </body>
  </html>
  `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
    toast.success(`เตรียมพิมพ์ ${item.receipt_no}`);
  };

  const handleStatusChange = async (
    item: Receipt,
    newStatus: "ร่าง" | "รอออก" | "ออกแล้ว" | "ยกเลิก"
  ) => {
    if (!canEdit) {
      toast.error("คุณไม่มีสิทธิ์เปลี่ยนสถานะ");
      return;
    }

    try {
      const payload = {
        receipt_no: item.receipt_no,
        date: item.date,
        customer: item.customer,
        invoice_ref: item.invoice_ref, // แก้ไขชื่อ field ให้ตรงกับ backend
        amount: item.amount,
        status: newStatus,
        description: item.description || undefined,
      };

      await axios.put(`${API_URL}/${item.id}`, payload);
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      ร่าง: { variant: "outline" },
      รอออก: { variant: "secondary" },
      ออกแล้ว: { variant: "default" },
      ยกเลิก: { variant: "destructive" },
    };
    return <Badge variant={variants[status].variant}>{status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoice_ref.toLowerCase().includes(searchTerm.toLowerCase());
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
    // TaxInvoiceForm บันทึกข้อมูลให้เองแล้ว ไม่ต้องบันทึกซ้ำ
    // แค่ปิด form และ refresh ข้อมูล
    setShowDocumentForm(false);
    setSelectedItem(null);
    fetchData();
  };

  const handleCancelDocument = () => {
    setShowDocumentForm(false);
    setSelectedItem(null);
  };

  if (showDocumentForm) {
    return (
      <TaxInvoiceForm
        documentType="receipt"
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
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-purple-400 to-purple-500 hover:shadow-lg"
          onClick={() => setFilterStatus("ร่าง")}
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
          onClick={() => setFilterStatus("รอออก")}
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
          onClick={() => setFilterStatus("ออกแล้ว")}
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
          onClick={() => setFilterStatus("ยกเลิก")}
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
              สร้างใบเสร็จ
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
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.receipt_no}
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
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "ร่าง")}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            ร่าง
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "รอออก")}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            รอออก
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(item, "ออกแล้ว")}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            ออกแล้ว
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
                          onClick={() => handleDeleteClick(item)}
                          disabled={!canDelete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // Save receipt data to localStorage — enrich with seller fallback
                            const saved = {
                              ...item,
                              salesperson:
                                item.salesperson ||
                                item.seller_name ||
                                (companySetting as any)?.seller ||
                                undefined,
                              seller_name:
                                item.seller_name ||
                                item.salesperson ||
                                (companySetting as any)?.seller ||
                                undefined,
                            };
                            localStorage.setItem(
                              `receipt-detail${item.id}`,
                              JSON.stringify(saved)
                            );
                            // Open in new tab
                            window.open(`/receipt/detail/${item.id}`, "_blank");
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
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
            <DialogDescription>
              กรอกข้อมูลใบเสร็จรับเงิน/ใบกำกับภาษี
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
              <Label>ที่อยู่ลูกค้า</Label>
              <Textarea
                placeholder="ที่อยู่"
                rows={2}
                value={formData.customer_address}
                onChange={(e) =>
                  setFormData({ ...formData, customer_address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  placeholder="0-0000-00000-00-0"
                  value={formData.customer_tax_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_tax_id: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>โทรศัพท์</Label>
                <Input
                  placeholder="เบอร์โทร"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>อ้างอิงใบแจ้งหนี้</Label>
                <Input
                  placeholder="INV-YYYY-XXX"
                  value={formData.invoiceNo}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNo: e.target.value })
                  }
                />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>พนักงานขาย</Label>
                <Input
                  placeholder="ชื่อพนักงานขาย"
                  value={formData.seller_name}
                  onChange={(e) =>
                    setFormData({ ...formData, seller_name: e.target.value })
                  }
                />
              </div>
              <div />
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
            <DialogTitle>แก้ไขใบเสร็จ</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลใบเสร็จ {selectedItem?.id}
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
              <Label>ที่อยู่ลูกค้า</Label>
              <Textarea
                placeholder="ที่อยู่"
                rows={2}
                value={formData.customer_address}
                onChange={(e) =>
                  setFormData({ ...formData, customer_address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  placeholder="0-0000-00000-00-0"
                  value={formData.customer_tax_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_tax_id: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>โทรศัพท์</Label>
                <Input
                  placeholder="เบอร์โทร"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>อ้างอิงใบแจ้งหนี้</Label>
                <Input
                  placeholder="INV-YYYY-XXX"
                  value={formData.invoiceNo}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNo: e.target.value })
                  }
                />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>พนักงานขาย</Label>
                <Input
                  placeholder="ชื่อพนักงานขาย"
                  value={formData.seller_name}
                  onChange={(e) =>
                    setFormData({ ...formData, seller_name: e.target.value })
                  }
                />
              </div>
              <div />
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
            <DialogTitle>รายละเอียดใบเสร็จ</DialogTitle>
            <DialogDescription>
              เลขที่ {selectedItem?.receipt_no}
            </DialogDescription>
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
                  <p className="mt-1">
                    {new Date(selectedItem.date).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ลูกค้า</Label>
                <p className="mt-1">{selectedItem.customer}</p>
              </div>
              <div>
                <Label className="text-gray-500">พนักงานขาย</Label>
                <p className="mt-1">
                  {selectedItem.salesperson ||
                    selectedItem.seller_name ||
                    (companySetting as any)?.seller ||
                    "-"}
                </p>
              </div>
              {selectedItem.customer_address && (
                <div>
                  <Label className="text-gray-500">ที่อยู่</Label>
                  <p className="mt-1">{selectedItem.customer_address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">อ้างอิงใบแจ้งหนี้</Label>
                  <p className="mt-1">{selectedItem.invoice_ref}</p>
                </div>
                <div>
                  <Label className="text-gray-500">จำนวนเงิน</Label>
                  <p className="mt-1">
                    ฿{selectedItem.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedItem.status)}
                </div>
              </div>
              {selectedItem.invoice_ref && (
                <div>
                  <Label className="text-gray-500">รายละเอียด</Label>
                  <p className="mt-1">{selectedItem.invoice_ref}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePrint(selectedItem, false)}
                >
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
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
            <AlertDialogAction onClick={handleConfirmDelete}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
