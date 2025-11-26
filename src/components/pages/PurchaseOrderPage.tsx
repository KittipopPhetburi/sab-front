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
  Eye,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Truck,
  Printer,
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

interface PurchaseOrderPageProps {
  userRole: UserRole;
}

interface PurchaseOrder {
  buyer_name: string;
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
  branch_name?: string;
  items: string | Array<{
    id: string;
    description: string;
    qty?: number;
    unit?: string;
    price?: number;
    amount: number;
    productId?: number;
  }>;
  notes?: string;
  discount: number;
  vat_rate: number;
  subtotal: number;
  discount_amount: number;
  after_discount: number;
  vat: number;
  grand_total: number;
  status: "ร่าง" | "รอจัดส่ง" | "จัดส่งแล้ว" | "ยกเลิก";
  expected_delivery_date?: string;
  created_at?: string;
  updated_at?: string;
  doc_type?: "original" | "copy"; // เพิ่ม doc_type
}

export default function PurchaseOrderPage({
  userRole,
}: PurchaseOrderPageProps) {
  const API_URL = "http://127.0.0.1:8000/api/purchase-orders";
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [companySetting, setCompanySetting] = useState<CompanySetting | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDocType, setFilterDocType] = useState<
    "all" | "original" | "copy"
  >("all");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<PurchaseOrder | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseOrder | null>(null);

  const canEdit = userRole === "admin" || userRole === "account";
  const canDelete = userRole === "admin" || userRole === "account";

  // Fetch data from API
  useEffect(() => {
    fetchPurchaseOrders();
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

  const getBranchNameBySupplierCode = (supplierCode?: string) => {
    if (!supplierCode || !customers.length) return "-";
    const customer = customers.find((c) => c.code === supplierCode);
    return customer?.branch_name || "-";
  };

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get(API_URL);
      console.log("PurchaseOrder API response:", response.data);

      // Handle both array and {data: [...]} response formats
      let records: PurchaseOrder[] = [];
      if (Array.isArray(response.data)) {
        records = response.data;
      } else if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        records = Array.isArray(response.data.data) ? response.data.data : [];
      }

      setData(records);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setData([]);
    }
  };

  // Calculate status counts
  const statusCounts = {
    ร่าง: data.filter((item) => item.status === "ร่าง").length,
    รอจัดส่ง: data.filter((item) => item.status === "รอจัดส่ง").length,
    จัดส่งแล้ว: data.filter((item) => item.status === "จัดส่งแล้ว").length,
    ยกเลิก: data.filter((item) => item.status === "ยกเลิก").length,
  };

  const handleFormSave = async (data: any) => {
    toast.success("บันทึกใบสั่งซื้อสำเร็จ");
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
      toast.error("คุณไม่มีสิทธิ์แก้ไขข้อมูล");
      return;
    }

    // โหลดข้อมูลจาก API
    try {
      const response = await axios.get(`${API_URL}/${item.id}`);
      setEditData(response.data);
      setShowForm(true);
    } catch (error: any) {
      console.error("Error loading purchase order:", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    }
  };

  const handleView = (item: PurchaseOrder) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: PurchaseOrder) => {
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
      toast.success(`ลบใบสั่งซื้อ ${selectedItem.po_number} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchPurchaseOrders();
    } catch (error: any) {
      console.error("Error deleting purchase order:", error);
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการลบใบสั่งซื้อ"
      );
    }
  };

  const handleStatusChange = async (
    item: PurchaseOrder,
    newStatus: "ร่าง" | "รอจัดส่ง" | "จัดส่งแล้ว" | "ยกเลิก"
  ) => {
    if (!canEdit) {
      toast.error("คุณไม่มีสิทธิ์เปลี่ยนสถานะ");
      return;
    }

    try {
      // ใช้ API endpoint แยกสำหรับอัปเดทสถานะ
      await axios.patch(`${API_URL}/${item.id}/status`, { status: newStatus });
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      fetchPurchaseOrders();
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
      รอจัดส่ง: "secondary",
      จัดส่งแล้ว: "default",
      ยกเลิก: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;
    const matchesDocType =
      filterDocType === "all" ||
      (filterDocType === "original" &&
        (!item.doc_type || item.doc_type === "original")) ||
      (filterDocType === "copy" && item.doc_type === "copy");
    return matchesSearch && matchesStatus && matchesDocType;
  });

  const handlePrint = (item: PurchaseOrder, isCopy: boolean = false) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("กรุณาอนุญาตให้เปิดหน้าต่างใหม่");
      return;
    }

    // Parse items from JSON string if it's a string
    const parsedItems =
      typeof item.items === "string"
        ? JSON.parse(item.items)
        : item.items || [];

    // Resolve logo URL from company settings with fallback
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

    interface PurchaseOrderItem {
      id: string;
      description: string;
      amount: number;
      qty?: number;
      unit?: string;
      price?: number;
    }

    interface PageItem {
      pageNum: number;
      items: PurchaseOrderItem[];
      isLastPage: boolean;
    }

    // Split items into pages (18 items per page)
    const itemsPerPage = 14;
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
        <title>ใบสั่งซื้อ ${item.po_number}</title>
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
            background: #ffc007;
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
            padding-left: 0;
          }

          .header-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-right: 30px;
            gap: 8px;
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

          .doc-title {
            text-align: center;
            font-weight: 700;
            margin-top: 45px;
            color: #ffc007;
            font-size: 28px;
          }

          .doc-title2 {
            font-weight: 700;
            color: #0d0d0d;
            font-size: 28px;
          }

          .company-name {
            font-size: 14px;
            font-weight: 700;
            color: #000;
          }

          /* keep phone+email on single line for header */
          .company-contact { white-space: nowrap; display:inline-block; }

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
            text-align: center !important;
          }
          
          .items tbody tr.item-row td:nth-child(2) {
            text-align: left !important;
          }
          
          .items tbody tr.item-row td:nth-child(5),
          .items tbody tr.item-row td:nth-child(6) {
            text-align: right !important;
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

          @media print {
            .page-container::before {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
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
                <img src="${logoUrl}" alt="Logo" style="height:60px; margin-bottom:6px;" />
                <div class="company-name">${
                  companySetting?.company_name || "บริษัท"
                } ${
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
                  <div class="doc-title">ใบสั่งซื้อ<br/>
                    <div class="doc-title2">Purchase</div>
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
                  ผู้จำหน่าย : ${item.supplier_name || "-"}<br/>
                  ที่อยู่ : ${item.supplier_address || "-"}<br/>
                  โทร : ${item.supplier_phone || "-"} อีเมล : ${
                  item.supplier_email || "-"
                }<br/>
                  เลขประจำตัวผู้เสียภาษี : ${
                    item.supplier_tax_id || "-"
                  } สาขา ${getBranchNameBySupplierCode(item.supplier_code)}
                </td>
                  <td style="width:35%" class="info-right">
                    <div class="info-box">
                      <span class=" k">เลขที่</span><span class="sep">:</span><span class="v">&nbsp;${
                        item.po_number
                      }</span>
                      <span class="k">วันที่</span><span class="sep">:</span><span class="v">&nbsp;${new Date(
                        item.date
                      ).toLocaleDateString("th-TH")}</span>
                      <span class="k">อ้างอิง</span><span class="sep">:</span><span class="v">&nbsp;${
                        item.reference_doc || "-"
                      }</span>
                      <span class="k">ผู้จัดซื้อ</span><span class="sep">:</span><span class="v">&nbsp;${
                        item.buyer_name || "-"
                      }</span>
                    </div>
                  </td>
              </tr>
            </table>
          `
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
              ${page.items
                .map(
                  (i, idx) => `
                <tr class="item-row">
                  <td>${
                    i.id.startsWith("empty-")
                      ? ""
                      : (page.pageNum - 1) * itemsPerPage + idx + 1
                  }</td>
                  <td>${
                    i.id.startsWith("empty-") ? "" : i.description || "-"
                  }</td>
                  <td>${i.id.startsWith("empty-") ? "" : i.qty || 1}</td>
                  <td>${i.id.startsWith("empty-") ? "" : i.unit || "-"}</td>
                  <td>${
                    i.id.startsWith("empty-")
                      ? ""
                      : Number(i.price || 0).toLocaleString()
                  }</td>
                  <td>${
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
                    ${item.subtotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}<br/>
                    ${item.discount_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}<br/>
                    ${item.after_discount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}<br/>
                    ${item.vat.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td colspan="3" style="text-align: left;">
                    จำนวนเงินเป็นตัวอักษร (${ThaiBahtText(item.grand_total)})
                  </td>
                  <td colspan="2" style="text-align: right; padding-right: 5px;">
                    จำนวนเงินรวมทั้งสิ้น
                  </td>
                  <td colspan="1" style="text-align: right; padding-right: 5px;">
                    ${item.grand_total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
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
            <table class="footer" style="width: 100%;">
              <tbody>
                <tr class="sig-row">
                  <td style="width: 40%; text-align: left; padding-left: 70px;">
                    <div class="sig-title"></div></br>
                    ลงชื่อ..........................................ผู้ขอซื้อ</br>
                    (...................................................)</br>
                    วันที่อนุมัติ......./................./...........
                  </td>
                  <td style="width: 60%; text-align: left; padding-left: 80px;">
                    <div class="sig-title">ในนามบริษัท ไอ ที บี ที คอร์ปอเรชั่น จำกัด</br></div>
                    ลงชื่อ..........................................ผู้อนุมัติสั่งซื้อ</br>
                    (...................................................)</br>
                    วันที่อนุมัติ......./................./...........
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
        editData={editData as unknown as Record<string, unknown> | undefined}
      />
    );
  }

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
          onClick={() => setFilterStatus("รอจัดส่ง")}
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
          onClick={() => setFilterStatus("จัดส่งแล้ว")}
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
              <CardTitle>รายการใบสั่งซื้อ</CardTitle>
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
                setEditData(null);
                setShowForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบสั่งซื้อ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="     ค้นหาเลขที่เอกสาร, ผู้จำหน่าย..."
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
                <TableHead>ผู้จำหน่าย</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.po_number}
                    {item.doc_type === "copy" && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs bg-gray-100"
                      >
                        สำเนา
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.po_number}</TableCell>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString("th-TH")}
                  </TableCell>
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
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "ร่าง")}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          ร่าง
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "รอจัดส่ง")}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          รอจัดส่ง
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "จัดส่งแล้ว")}
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          จัดส่งแล้ว
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
                          const isCopy = item.doc_type === "copy";
                          handlePrint(item, isCopy);
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
            <DialogTitle>รายละเอียดใบสั่งซื้อ</DialogTitle>
            <DialogDescription>
              เลขที่ {selectedItem?.po_number}
            </DialogDescription>
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
                  <p className="mt-1">
                    {new Date(selectedItem.date).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ผู้จำหน่าย</Label>
                <p className="mt-1">{selectedItem.supplier_name}</p>
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
              คุณแน่ใจหรือไม่ว่าต้องการลบใบสั่งซื้อ {selectedItem?.po_number}?
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
