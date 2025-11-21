import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Download,
  Printer,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
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
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
// mockCustomers not needed here; remove unused import
import WithholdingTaxForm from "../WithholdingTaxForm";
import { withholdingTaxService } from "../../services/withholdingTaxService";
import type { WithholdingTax as ApiWithholdingTax } from "../../services/withholdingTaxService";
import { generateWithholdingTaxPDF } from "../../utils/pdfGenerator";
import ThaiBahtText from "thai-baht-text";
import {
  companySettingService,
  type CompanySetting,
} from "../../services/companySettingService";

interface WithholdingTaxPageProps {
  userRole: "admin" | "account" | "user";
}

interface FormDocumentData {
  docNumber: string;
  docDate: string;
  sequenceNumber: string;
  deductionOrder?: string;
  // Payer from legacy form fields
  payerTaxId?: string;
  payerName?: string;
  payerAddress?: string;
  // Payer from company settings (new form fields)
  companyTaxId?: string;
  company_name?: string;
  company_address?: string;
  representativeTaxId?: string;
  representativeName?: string;
  representativeAddress?: string;
  recipientTaxId: string;
  recipientName: string;
  recipientAddress: string;
  recipientType: "individual" | "juristic" | "partnership" | "other";
  companyType?: "1" | "2" | "3" | "4" | "5" | "other";
  deductionMode?: "" | "wht" | "always" | "once" | "other";
  deductionOther?: string;
  deductionFormat?: "" | "1" | "2" | "3" | "4" | "5" | "6" | "7";
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

export default function WithholdingTaxPage({
  userRole,
}: WithholdingTaxPageProps) {
  const [data, setData] = useState<ApiWithholdingTax[]>([]);
  const [companySetting, setCompanySetting] = useState<CompanySetting | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApiWithholdingTax | null>(
    null
  );
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const canEdit = userRole === "admin" || userRole === "account";
  const canDelete = userRole === "admin" || userRole === "account";

  // Load data from API
  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await withholdingTaxService.getAll();
      setData(result);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === "ร่าง").length,
    รออนุมัติ: data.filter((item) => item.status === "รออนุมัติ").length,
    อนุมัติแล้ว: data.filter((item) => item.status === "อนุมัติแล้ว").length,
    ยกเลิก: data.filter((item) => item.status === "ยกเลิก").length,
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.doc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setShowDocumentForm(true);
  };

  const handleView = (item: ApiWithholdingTax) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleDeleteClick = (item: ApiWithholdingTax) => {
    if (!canDelete) {
      toast.error("คุณไม่มีสิทธิ์ลบข้อมูล");
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
        console.error("Error deleting:", error);
        toast.error("ไม่สามารถลบข้อมูลได้");
      }
    }
  };

  const handleStatusChange = async (
    item: ApiWithholdingTax,
    newStatus: "ร่าง" | "รออนุมัติ" | "อนุมัติแล้ว" | "ยกเลิก"
  ) => {
    if (!canEdit) {
      toast.error("คุณไม่มีสิทธิ์เปลี่ยนสถานะ");
      return;
    }

    if (!item.id) {
      toast.error("ไม่พบ ID ของรายการ");
      return;
    }

    try {
      await withholdingTaxService.updateStatus(item.id, newStatus, item);
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      loadData(); // Reload data
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  const handleDownload = (item: ApiWithholdingTax) => {
    try {
      generateWithholdingTaxPDF(item);
      toast.success(`ดาวน์โหลด ${item.doc_number} สำเร็จ`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("ไม่สามารถสร้าง PDF ได้");
    }
  };

  const handlePrint = (item: ApiWithholdingTax) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("กรุณาอนุญาตให้เปิดหน้าต่างใหม่");
      return;
    }

    // recipientTypeMap not used in this inline print flow

    const formatTaxId = (taxId: string): string => {
      if (taxId.length === 13) {
        return `${taxId.substring(0, 1)}-${taxId.substring(
          1,
          5
        )}-${taxId.substring(5, 10)}-${taxId.substring(
          10,
          12
        )}-${taxId.substring(12, 13)}`;
      }
      return taxId;
    };

    // หา item จากประเภท (code) เช่น '1. ', '2. ', '3. ', '4. (ก)', '4. (ข)', '5.', '6.'
    const getItemByType = (code: string) =>
      item.items.find((i) => i.type.startsWith(code));

    // map ให้แต่ละบรรทัด
    const row1 = getItemByType("1.");
    const row2 = getItemByType("2.");
    const row3 = getItemByType("3.");
    const row4a = getItemByType("4. (ก)");
    const row4b = getItemByType("4. (ข)");
    const row4b1 = getItemByType("4. (ข)1");
    const row4b2 = getItemByType("4. (ข)2");
    const row4b3 = getItemByType("4. (ข)3");
    const row5 = getItemByType("5.");
    const row6 = getItemByType("6.");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>หนังสือรับรองการหักภาษี ณ ที่จ่าย - ${item.doc_number}</title>
        <!-- =====================  CSS  ===================== -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');

/* --- ขนาดหน้า A4 แบบตายตัว --- */
@page { size: A4; margin: 0; }
html, body{
  margin:0; padding:0;
  background:#f0f0f0;
  font-family:'Sarabun', sans-serif;
  font-size:10px; line-height:1.4; color:#000;
  display:flex; justify-content:center; align-items:flex-start;
  padding-top:20px;
}

/* --- กระดาษ --- */
.page-container{
  width:210mm; height:297mm;
  background:#fff;
  padding:6mm 8mm;
  box-sizing:border-box;
  display:flex; flex-direction:column;
  padding:40px;
}

/* --- ส่วนหัว --- */
.header{ text-align:center; margin-bottom:8px; }
.header h3{ margin:0; font-size:18px; font-weight:700; }
.header p{ margin:0; font-size:12px; }
.header-right {
  display: flex;
  justify-content: flex-end; /* ชิดขวา */
  align-items: baseline;
  gap: 6px;
  margin-top: 6px;
  font-size: 13px;
}
.header-right .dot-line.short {
  min-width: 60px;      /* ปรับความยาวช่องตามต้องการ */
}


/* กล่องที่ 1 */
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.right {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 6px;
}

.line{
  display:flex;
  align-items:baseline;
  gap:8px;
  width:96%;
}

/* กล่องเส้นจุดให้กินพื้นที่ที่เหลือทั้งหมด */
.dot-line.full{
  position:relative;
  flex:1;                 /* ← ดันให้ยาวจนสุดขอบกล่อง */
  min-height:1.2em;       /* ให้มีความสูงพอสำหรับเส้น */
}

/* วาดเส้นจุดตลอดความกว้าง .dot-line */
.dot-line.full::after{
  content:"";
  position:absolute;
  left:0; right:0;
  bottom:0;               /* เส้นอยู่ใต้สุด */
  border-bottom:1px dotted #000; /* เส้นจุด */
}

/* ข้อความที่อยู่เหนือเส้น (ยกขึ้น 2px และกันทับเส้น) */
.dot-line .value{
  position:relative;
  display:inline-block;
  padding:0 4px;          /* เว้นขอบซ้าย/ขวาให้ดูสบายตา */
  background:#fff;        /* กลบเส้นใต้ข้อความ */
  transform:translateY(-2px); /* ยกตัวอักษรขึ้น 2px */
  line-height:1.2;
}

/* เส้นจุดใต้ตัวเลข */
.dot-line {
  display: inline-block;
  position: relative;
  padding: 0 4px;
  line-height: 1.2;
}

/* เส้นจุดจริง */
.dot-line::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px; /* 🔹 เส้นอยู่ต่ำกว่าข้อความเล็กน้อย */
  border-bottom: 1px dotted #000;
}

/* ยกข้อความตัวแปรขึ้น 2px จากเส้น */
.dot-line {
  top: -2px;
}

/* ขนาดความยาวเส้น */
.dot-line.wide {
  min-width: 120px; /* ปรับได้ตามต้องการ */
}



/* บรรทัดซ้าย-ขวา (เช่น เล่มที่ / เลขที่) */
.flex-between{ display:flex; align-items:baseline; gap:12px; }
.flex-between .left{ white-space:nowrap; }
.flex-between .right{ margin-left:auto; white-space:nowrap; }

/* --- กล่องหัวข้อ/ส่วนข้อมูล --- */
.section{
  border:1px solid #000;
  margin-bottom:8px;
  padding:4px 8px;
  font-size:13px;
}

/* บรรทัดข้อมูลแบบ Label + ค่า (อินเดนท์ซ้าย ~20px) */
.line{
  display:flex; align-items:baseline; gap:8px;
  margin-left:20px; margin-top:2px;
}

/* คำอธิบายย่อยใต้บรรทัด */
.subtext{
  font-size:11px; color:#555; margin-left:20px; margin-top:2px;
}

/* --- เส้นจุด (leader) แบบ “ไม่ลอย” และยืดจนสุดบรรทัด --- */
/* ใช้กับกรณี “ข้อความ + เส้นจุด” เช่น เลขผู้เสียภาษี, ชื่อ, ที่อยู่ */
.value{
  position:relative; flex:1;
  min-height:1.2em;           /* ให้มีพื้นที่วางเส้นแน่นอน */
  padding:0 4px 2px 4px;      /* เผื่อขอบเล็กน้อย */
}
.value::after{
  content:"";
  position:absolute; left:0; right:0;      /* ยาวเต็มบรรทัดที่เหลือ */
  bottom:0.15em;                            /* ชิด baseline สวย ๆ */           /* เส้นจุดไม่ลอย */
}
/* ใส่ข้อความทับบนเส้น (ถ้ามีค่าแสดง) */
.value .text{
  position:relative; z-index:1;
  background:#fff; padding:0 2px;
  /* ถ้าต้องการให้เส้นต่อหลังข้อความ: เว้น padding ด้านขวาน้อย ๆ */
}

.attach-frame{
  border: 1px solid #000;
  padding: 8px 10px;
}

/* แถวหลักเป็น 3 คอลัมน์แบบยืดหยุ่น */
.attach-row{
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

/* คอลัมน์: ลำดับที่ + เส้นจุด */
.col-no{
  width: 150px;             /* ปรับได้ตามเลย์เอาต์ */
  display: flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}

/* คอลัมน์: ใบแนบ (คำหัว) */
.col-label{
  width: 60px;              /* ปรับได้ */
  line-height: 1.6;
  white-space: nowrap;
}

/* คอลัมน์: ตัวเลือก checkbox */
.col-options{
  flex: 1;                  /* กินพื้นที่ที่เหลือ */
  line-height: 1.8;
}

/* เวอร์ชันสั้น/ยาว สำหรับพื้นที่เฉพาะจุด */
.value.short{ max-width:60mm; }
.value.wide{ max-width:100mm; }
.value.full{ flex:1; }          /* ค่า default อยู่แล้ว */

/* แถบหัวบรรทัดซ้าย-ขวาใน section (เช่น “ผู้มีหน้าที่หักภาษี … | เลขผู้เสียภาษี …”) */
.head{
  display:flex; align-items:baseline; gap:8px;
}
.head .left{ white-space:nowrap; }
.head .right{
  margin-left:auto; display:flex; align-items:baseline; gap:6px; white-space:nowrap;
}

/* --- ตารางเงินได้ (Thai WHT Form) --- */
.table-withholding{
  border-collapse:collapse;
  margin:8px 0;
  font-size:11px;
  line-height:1.2;
  border:1px solid #000;
}

.table-withholding thead tr{
  background:#fff;
}

.table-withholding td{
  padding:6px 8px;
  vertical-align:middle;
  text-align:left;
}

.table-withholding td.border-right{
  border-right:1px solid #000;
}

.table-withholding td.border-bottom{
  border-bottom:1px solid #000;
}

.table-withholding td.border-left{
  border-left:1px solid #000;
}

.table-withholding td.text-center{
  text-align:center;
}

.table-withholding td.text-right{
  text-align:right;
  padding-right:10px;
}

/* --- ตารางแบบฟอร์ม (โครงสร้าง div) --- */
.table-section{
  margin-top:12px;
  border:1px solid #000;
  border-radius:3px;
  overflow:hidden;
  box-shadow:0 2px 4px rgba(0,0,0,0.1);
}

/* โครงกริด 4 คอลัมน์เหมือนเดิม */
.table-header, .table-row{
  display:grid;
  grid-template-columns: 1fr 80px 110px 110px; /* type | date | amount | tax */
}

/* แถวหัว */
.table-header{
  font-weight:700;
  border-bottom:2px solid #000;
}

/* เซลล์: ไม่มีเส้นหรือสีระหว่างคอลัมน์ */
.th, .td{
  padding:8px 8px;
  min-height:28px;
  display:flex; align-items:center;
  border:0;
  font-size:12px;
}

.th{
  font-weight:700;
  justify-content:center;
  text-align:center;
}

/* คอลัมน์แรกไม่ต้องมีเส้นซ้าย */
.th:first-child, .td:first-child{
  border-left:0;
}

/* คอลัมน์สุดท้ายไม่ต้องมีเส้นขวา */
.th:last-child, .td:last-child{
  border-right:0;
}

/* จัดแนวข้อความตามเดิม */
.td.left{ justify-content:flex-start; text-align:left; }
.td.center{ justify-content:center; text-align:center; }
.td.right{ justify-content:flex-end; text-align:right; padding-right:10px; }
.th.left{ justify-content:flex-start; }
.th.center{ justify-content:center; }
.th.right{ justify-content:flex-end; padding-right:10px; }


/* ประเภทเงินที่ได้จ่าย */
.income-types {
  font-size: 11px;
  line-height: 1.6;
  text-align: left;
  margin: 0;
  padding: 0;
  color: #000;
}

.income-types div {
  margin: 0;
  padding: 0;
  line-height: 1.5;
}

/* ย่อหน้ารายการย่อย */
.income-types .indent {
  padding-left: 18px;
  margin-left: 0;
}

.total-right{
  border-top:1px solid #000;
}

.text-right {
  text-align: right;
}

.total-text-right{
  display:flex;
  justify-content:flex-end;  /* ชิดขวาทั้งบรรทัด */
  align-items:center;
  gap:8px;
}

/* ถ้าต้องการให้กล่องเป็นพื้นสีเขียวแบบตัวอย่าง */
.box-total{
  display:inline-block;
  padding:2px 6px;
  background:#c3f3a2;
}


/* ส่วนท้ายตาราง (รวมยอด/ตัวอักษร) */
.table-footer{ 
  border-top:2px solid #000; 
  padding:8px 10px;
  background:#f5f5f5;
  font-weight:600;
}
.table-footer .sum-line{
  display:flex; align-items:baseline; gap:8px; margin-bottom:4px;
}
.table-footer .sum-line:last-child{
  margin-bottom:0;
}
.sum-value{
  display:inline-block; min-width:100px; text-align:right; font-weight:600;
}

/* --- ลายเซ็น --- */
.signature-section{
  margin-top: 10px;
}

.sign-frame{
  border:1px solid #000;
  padding:8px 16px;
  display:flex;           /* วาง sign-text กับ stamp-box เป็นแนวนอน */
  align-items:center;
}

.sign-text{
  flex:1;                 /* กินพื้นที่ที่เหลือ */
  text-align:center;      /* ข้อความลายเซ็นให้อยู่กลางกรอบ */
}

.stamp-box{
  width:60px;
  height:60px;
  border:1px solid #000;
  border-radius:50%;
  text-align:center;
  font-size:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  margin-left:auto;       /* ดันให้ไปชิดขวาสุด */
}


.copy-note{
  margin-top: 4px;
  font-size: 11px;
}

.sign-frame{
  flex: 1;
  border: 1px solid #000;
  padding: 20px 14px;
  text-align: center;
  font-size: 12px;
}

/* ฝั่งข้อความลายเซ็น */
.sign-text{
  flex:1;
  text-align:center;
}

/* วงกลมตราประทับขวา */
.stamp-box{
  width:60px;
  height:60px;
  border:1px solid #000;
  border-radius:50%;
  text-align:center;
  font-size:10px;
}

/* ข้อความ “ฉบับที่ 1 / 2 …” ใต้กรอบ */
.copy-note{
  margin-top:4px;
  font-size:11px;

}

/* --- โหมดพิมพ์ --- */
@media print {
  /* ให้เบราว์เซอร์พยายามพิมพ์สีตามจอ */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html, body{
    /* ไม่ต้องไปบังคับ background:#fff ถ้าอยากให้สีเดิมอยู่ */
    margin:0; padding:0;
  }

  .page-container{
    width:210mm;
    height:297mm;
    margin:0;
    box-shadow:none;
    /* จะใส่ background สีอะไรก็ได้ตามปกติ */
  }
}

}

</style>


<!-- =====================  HTML (DIV Version)  ===================== -->
<div class="page-container">
  <!-- ส่วนหัว -->
  <div class="header">
    <h3>หนังสือรับรองการหักภาษี ณ ที่จ่าย</h3>
    <p>ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</p>
    <div class="header-right">
      <span>เล่มที่</span><span class="dot-line short"> ${
        item.sequence_number
      } </span>
      <span style="margin-left:6px;">เลขที่</span><span class="dot-line short"> ${
        item.doc_number
      } </span>
    </div>
  </div>

  <!-- ผู้มีหน้าที่หักภาษี -->
  <div class="section">
    <div class="flex-between">
      <div class='left'>ผู้มีหน้าที่หักภาษี ณ ที่จ่าย:</div>
      <div class='right'>เลขประจำตัวผู้เสียภาษีอากร<span class="dot-line wide"> ${formatTaxId(
        item.payer_tax_id
      )} </span></div>
    </div>
    <div class="line">ชื่อ
    <span class="dot-line full"> 
    <span class="value"> ${item.payer_name} </span>
    </span>
    </div>
    <div class="subtext"><small> (ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท หรือ คณะบุคคล) </small></div>
    <div class="line">ที่อยู่
    <span class="dot-line full">
    <span class="value"> ${item.payer_address}</span>
    </span>
    </div>
    <div class="subtext"> <small> (ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด และ โทรศัพท์) </small></div>
  </div>

  <!-- กระทำแทน -->
  <div class="section">
    <div class="flex-between">
      <div>กระทำแทน:</div>
      <div>เลขประจำตัวผู้เสียภาษีอากร<span class="dot-line wide"> ${
        item.representative_tax_id
          ? formatTaxId(item.representative_tax_id)
          : ""
      } </span></div>
    </div>
    <div class="line">ชื่อ
    <span class="dot-line full">
    <span class="value"> ${item.representative_name || ""} </span>
    </span>
    </div>
    <div class="subtext">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท หรือ คณะบุคคล)</div>
    <div class="line">ที่อยู่
    <span class="dot-line full">
    <span class="value"> ${item.representative_address || ""} </span>
    </span>
    </div>
    <div class="subtext"><small> (ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด และ โทรศัพท์)  </small></div>
  </div>

  <!-- ผู้ถูกหักภาษี -->
  <div class="section">
    <div class="flex-between">
      <div class='left'>ผู้มีหน้าที่หักภาษี ณ ที่จ่าย:</div>
      <div class='right'>เลขประจำตัวผู้เสียภาษีอากร<span class="dot-line wide"> ${formatTaxId(
        item.recipient_tax_id
      )} </span></div>
    </div>
    <div class="line">ชื่อ
    <span class="dot-line full"> 
    <span class="value"> ${item.recipient_name} </span>
    </span>
    </div>
    <div class="subtext">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท หรือ คณะบุคคล)</div>
    <div class="line">ที่อยู่
    <span class="dot-line full">
    <span class="value"> ${item.recipient_address} </span>
    </span>
    </div>
    <div class="subtext"><small>(ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด และ โทรศัพท์) </small></div>
  </div>

  <!-- กล่องใบแนบ (มีกรอบ) -->
<div class="attach-frame">
  <div class="attach-row">
    <!-- คอลัมน์ซ้าย: ลำดับที่ + เส้นจุด -->
    <div class="col-no">
      <span>ลำดับที่</span>
      <span class="dot-line short"> ${item.deduction_order || "1"} </span>
    </div>

    <!-- คอลัมน์กลาง: คำว่า ใบแนบ -->
    <div class="col-label">ใบแนบ</div>

    <!-- คอลัมน์ขวา: รายการ checkbox -->
    <div class="col-options">
      <label class="ck"><input type="checkbox" disabled ${
        item.deduction_format === "1" ? "checked" : ""
      } /> (1) ภ.ง.ด.1ก.</label><span class="sp"></span>
      <label class="ck"><input type="checkbox" disabled ${
        item.deduction_format === "2" ? "checked" : ""
      } /> (2) ภ.ง.ด.1ก. พิเศษ</label><span class="sp"></span>
      <label class="ck"><input type="checkbox" disabled ${
        item.deduction_format === "3" ? "checked" : ""
      } /> (3) ภ.ง.ด.2</label><span class="sp"></span>
      <label class="ck"><input type="checkbox" disabled ${
        item.deduction_format === "4" ? "checked" : ""
      } /> (4) ภ.ง.ด.3</label>
      <br/>
      <label class="ck"><input type="checkbox" disabled ${
        item.deduction_format === "5" ? "checked" : ""
      } /> (5) ภ.ง.ด.2ก.</label><span class="sp"></span>
      <label class="ck"><input type="checkbox" disabled ${
        item.deduction_format === "6" ? "checked" : ""
      } /> (6) ภ.ง.ด.3ก.</label><span class="sp wide"></span>
      <label class="ck"><input type="checkbox" disabled ${
        item.deduction_format === "7" ? "checked" : ""
      } /> (7) ภ.ง.ด.53</label>
    </div>
  </div>
</div>


  <!-- ตารางเงินได้ -->
  <table class="table-withholding">
    <thead>
      <tr>
        <td class="border-bottom border-right text-center">ประเภทเงินได้ที่จ่าย</td>
        <td class="border-bottom border-right text-center" style="width:70px;">ว/ด/ป<br/>ภาษีที่จ่าย</td>
        <td class="border-bottom border-right text-center" style="width:100px;">จำนวนเงินที่จ่าย</td>
        <td class="border-bottom text-center" style="width:100px;">ภาษีที่หัก<br/>และนำส่งไว้</td>
      </tr>
    </thead>
    <tbody> 
    
      <tr>
  <td class="border-right">1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยงฯ โบนัส ฯลฯ ตามมาตรา 40(1)</td>
  <td class="border-right text-center">
    ${
      row1
        ? new Date(row1.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row1
        ? row1.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row1
        ? row1.tax_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
</tr>

<tr>
  <td class="border-right">2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40(2)</td>
  <td class="border-right text-center">
    ${
      row2
        ? new Date(row2.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row2
        ? row2.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row2
        ? row2.tax_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
</tr>

<tr>
  <td class="border-right">3. ค่าแห่งลิขสิทธิ์ ค่าจ้างทำของ ค่าบริการ ฯลฯ ตามมาตรา 40(3)</td>
  <td class="border-right text-center">
    ${
      row3
        ? new Date(row3.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row3
        ? row3.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row3
        ? row3.tax_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
</tr>

<tr>
  <td class="border-right">4. (ก)ดอกเบี้ย เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40(4)(ก)</td>
  <td class="border-right text-center">
    ${
      row4a
        ? new Date(row4a.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row4a
        ? row4a.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row4a
        ? row4a.tax_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
</tr>

<tr>
  <td class="border-right">4. (ข)เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40(4)(ข)</td>
  <td class="border-right text-center">
    ${
      row4b
        ? new Date(row4b.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row4b
        ? row4b.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row4b
        ? row4b.tax_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
</tr>

<tr>
  <td class="border-right">4.1 (ข)ผู้ได้รับเงินปันผลได้รับเครดิตภาษี โดยหัก ณ ที่จ่าย 10%</td>
  <td class="border-right text-center">
    ${
      row4b1
        ? new Date(row4b1.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row4b1
        ? row4b1.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row4b1
        ? row4b1.tax_amount.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })
        : "-"
    }
  </td>
</tr>

<tr>
  <td class="border-right">4.2 (ข)ผู้ได้รับเงินปันผลได้รับเครดิตภาษีร้อยละของเงินปันผลที่จ่าย</td>
  <td class="border-right text-center">
    ${
      row4b2
        ? new Date(row4b2.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row4b2
        ? row4b2.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row4b2
        ? row4b2.tax_amount.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })
        : "-"
    }
  </td>
</tr>

<tr>
  <td class="border-right">4.3 (ข)กรณีอื่นๆ (ระบุ)</td>
  <td class="border-right text-center">
    ${
      row4b3
        ? new Date(row4b3.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row4b3
        ? row4b3.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row4b3
        ? row4b3.tax_amount.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })
        : "-"
    }
  </td>
</tr>

<tr>
  <td class="border-right">5. การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย อื่นๆ</td>
  <td class="border-right text-center">
    ${
      row5
        ? new Date(row5.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row5
        ? row5.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row5
        ? row5.tax_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
</tr>

<tr>
  <td class="border-right">6. อื่นๆ (ระบุ)</td>
  <td class="border-right text-center">
    ${
      row6
        ? new Date(row6.date).toLocaleDateString("th-TH", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })
        : "-"
    }
  </td>
  <td class="border-right text-right">
    ${
      row6
        ? row6.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
  <td class="text-right">
    ${
      row6
        ? row6.tax_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
        : "-"
    }
  </td>
</tr>
<tr>
    <td class="total-right text-right" colspan="2">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>
    <td class="total-right border-left border-bottom text-right">
        ${item.total_amount.toLocaleString("th-TH", {
          minimumFractionDigits: 2,
        })}
    </td>
    <td class="total-right border-left border-bottom text-right">
        ${item.total_tax.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
    </td>
</tr>
<tr>
  <td colspan="4" style="padding-top:10px;padding-bottom:10px;">
    <div class="total-text-right ">
      <span>รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)</span>
      <span class="box-total">
        ${ThaiBahtText(item.total_tax)} บาท
      </span>
    </div>
  </td>
</tr>

    </tbody>
  </table>

  <!-- รูปแบบการหัก -->
  <div class="section">
    <div class="line">รูปแบบการหัก
      <input type="checkbox" disabled ${
        item.deduction_mode === "wht" ? "checked" : ""
      }> หักภาษี ณ ที่จ่าย
      <input type="checkbox"  disabled ${
        item.deduction_mode === "always" ? "checked" : ""
      }> ออกภาษีให้ตลอดไป
      <input type="checkbox"  disabled ${
        item.deduction_mode === "once" ? "checked" : ""
      }> ออกภาษีให้ครั้งเดียว
      <input type="checkbox"  disabled ${
        item.deduction_mode === "other" ? "checked" : ""
      }> อื่นๆ <span class="dot-line short">${
      item.deduction_mode === "other" && item.deduction_other
        ? item.deduction_other
        : ""
    }</span>
    </div>
  </div>


  <!-- ลายเซ็น -->
  <div class="signature-section">
  <div class="sign-frame">
    <div class="sign-text">
      ขอรับรองว่า ข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ<br><br>
      ลงชื่อ<span class="dot-line wide"></span>ผู้มีหน้าที่หักภาษี ณ ที่จ่าย<br><br>
      <span class="dot-line wide"></span>วัน เดือน ปี ที่ออกหนังสือรับรอง
    </div>
    <div class="stamp-box">
      ตราประทับ<br>นิติบุคคล<br>(ถ้ามี)
    </div>
  </div>
</div>


  <!-- ข้อความฉบับที่ 1 / 2 -->
  <div class="copy-note">
    ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ไว้แนบพร้อมแบบฯ)<br>
    ฉบับที่ 2 (สำหรับผู้มีหน้าที่หักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)
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
        deduction_order: documentData.deductionOrder,
        payer_tax_id:
          documentData.companyTaxId ?? documentData.payerTaxId ?? "",
        payer_name: documentData.company_name ?? documentData.payerName ?? "",
        payer_address:
          documentData.company_address ?? documentData.payerAddress ?? "",
        representative_tax_id: documentData.representativeTaxId,
        representative_name: documentData.representativeName,
        representative_address: documentData.representativeAddress,
        recipient_tax_id: documentData.recipientTaxId,
        recipient_name: documentData.recipientName,
        recipient_address: documentData.recipientAddress,
        recipient_type: documentData.recipientType,
        company_type: documentData.companyType,
        deduction_mode: documentData.deductionMode,
        deduction_other: documentData.deductionOther,
        deduction_format: documentData.deductionFormat,
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
        status: "ร่าง" as const,
        created_by: "admin", // You should get this from auth context
        notes: documentData.notes,
      };

      await withholdingTaxService.create(apiData);
      toast.success("สร้างหัก ณ ที่จ่ายสำเร็จ");
      setShowDocumentForm(false);
      setSelectedItem(null);
      loadData(); // Reload data
    } catch (error) {
      console.error("Error creating withholding tax:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "ไม่สามารถสร้างหัก ณ ที่จ่ายได้";
      toast.error(errorMessage);
    }
  };

  const handleCancelDocument = () => {
    setShowDocumentForm(false);
    setSelectedItem(null);
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

  if (showDocumentForm) {
    return (
      <WithholdingTaxForm
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
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-amber-400 to-amber-500 hover:shadow-lg"
          onClick={() => setFilterStatus("รออนุมัติ")}
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
          onClick={() => setFilterStatus("อนุมัติแล้ว")}
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
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="mb-1 text-blue-600">รายการหัก ณ ที่จ่าย</h2>
              {filterStatus !== "all" && (
                <p className="text-sm text-gray-500">
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
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              สร้างเอกสาร
            </Button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="     ค้นหาด้วยเลขที่เอกสาร หรือชื่อผู้รับเงิน..."
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
                  <TableHead className="text-right">
                    ภาษีหัก ณ ที่จ่าย
                  </TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-gray-500"
                    >
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-gray-500"
                    >
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.doc_number}</TableCell>
                      <TableCell>
                        {new Date(item.doc_date).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{item.recipient_name}</TableCell>
                      <TableCell className="text-right">
                        {Number(item.total_amount).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(item.total_tax).toLocaleString("th-TH", {
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
                                onClick={() => handleStatusChange(item, "ร่าง")}
                              >
                                ร่าง
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(item, "รออนุมัติ")
                                }
                              >
                                รออนุมัติ
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(item, "อนุมัติแล้ว")
                                }
                              >
                                อนุมัติแล้ว
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(item, "ยกเลิก")
                                }
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item)}
                            title="ดาวน์โหลด"
                          >
                            <Download className="w-4 h-4" />
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
                      {new Date(selectedItem.doc_date).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
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
                      <Label className="text-gray-600">
                        เลขประจำตัวผู้เสียภาษี
                      </Label>
                      <p>{selectedItem.payer_tax_id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">
                        ชื่อ-สกุล/ชื่อบริษัท
                      </Label>
                      <p>{selectedItem.payer_name}</p>
                    </div>
                  </div>
                </div>

                {/* Recipient Info */}
                <div className="pt-4 border-t">
                  <h3 className="mb-3">ข้อมูลผู้รับเงิน</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">
                        เลขประจำตัวผู้เสียภาษี
                      </Label>
                      <p>{selectedItem.recipient_tax_id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">
                        ชื่อ-สกุล/ชื่อบริษัท
                      </Label>
                      <p>{selectedItem.recipient_name}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-600">ที่อยู่</Label>
                      <p>{selectedItem.recipient_address}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">ประเภทผู้รับเงิน</Label>
                      <p>
                        {selectedItem.recipient_type === "individual" &&
                          "บุคคลธรรมดา"}
                        {selectedItem.recipient_type === "juristic" &&
                          "นิติบุคคล"}
                        {selectedItem.recipient_type === "partnership" &&
                          "ห้างหุ้นส่วน"}
                        {selectedItem.recipient_type === "other" && "อื่นๆ"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deduction Info */}
                {(selectedItem.deduction_mode ||
                  selectedItem.deduction_format ||
                  selectedItem.deduction_order) && (
                  <div className="pt-4 border-t">
                    <h3 className="mb-3">ข้อมูลการหักภาษี</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedItem.deduction_order && (
                        <div>
                          <Label className="text-gray-600">
                            ลำดับที่ (ใบแนบ)
                          </Label>
                          <p>{selectedItem.deduction_order}</p>
                        </div>
                      )}
                      {selectedItem.deduction_mode && (
                        <div>
                          <Label className="text-gray-600">รูปแบบการหัก</Label>
                          <p>
                            {selectedItem.deduction_mode === "wht" &&
                              "หักภาษี ณ ที่จ่าย"}
                            {selectedItem.deduction_mode === "always" &&
                              "ออกภาษีให้ตลอดไป"}
                            {selectedItem.deduction_mode === "once" &&
                              "ออกภาษีให้ครั้งเดียว"}
                            {selectedItem.deduction_mode === "other" &&
                              `อื่นๆ ${
                                selectedItem.deduction_other
                                  ? `(${selectedItem.deduction_other})`
                                  : ""
                              }`}
                          </p>
                        </div>
                      )}
                      {selectedItem.deduction_format && (
                        <div>
                          <Label className="text-gray-600">
                            ประเภทแบบฟอร์ม
                          </Label>
                          <p>
                            {selectedItem.deduction_format === "1" &&
                              "(1) ภ.ง.ด.1ก."}
                            {selectedItem.deduction_format === "2" &&
                              "(2) ภ.ง.ด.1ก. พิเศษ"}
                            {selectedItem.deduction_format === "3" &&
                              "(3) ภ.ง.ด.2"}
                            {selectedItem.deduction_format === "4" &&
                              "(4) ภ.ง.ด.3"}
                            {selectedItem.deduction_format === "5" &&
                              "(5) ภ.ง.ด.2ก."}
                            {selectedItem.deduction_format === "6" &&
                              "(6) ภ.ง.ด.3ก."}
                            {selectedItem.deduction_format === "7" &&
                              "(7) ภ.ง.ด.53"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                        <TableHead className="text-right">
                          จำนวนเงินที่จ่าย
                        </TableHead>
                        <TableHead className="text-right">
                          ภาษีหัก ณ ที่จ่าย
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItem.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.type}</TableCell>
                          <TableCell
                            className="max-w-xs truncate"
                            title={item.description}
                          >
                            {item.description}
                          </TableCell>
                          <TableCell>
                            {new Date(item.date).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.tax_rate}%
                          </TableCell>
                          <TableCell className="text-right">
                            {item.amount.toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.tax_amount.toLocaleString("th-TH", {
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
                          {selectedItem.total_amount.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          บาท
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span>รวมภาษีหัก ณ ที่จ่าย:</span>
                        <span>
                          {selectedItem.total_tax.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          บาท
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedItem.notes && (
                  <div className="pt-4 border-t">
                    <Label className="text-gray-600">หมายเหตุ</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {selectedItem.notes}
                    </p>
                  </div>
                )}

                <div className="pt-4 text-sm text-gray-500 border-t">
                  <p>สร้างโดย: {selectedItem.created_by}</p>
                  {selectedItem.created_at && (
                    <p>
                      สร้างเมื่อ:{" "}
                      {new Date(selectedItem.created_at).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
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
