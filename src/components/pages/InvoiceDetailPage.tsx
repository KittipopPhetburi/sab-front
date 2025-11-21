import { Button } from "../ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import {
  companySettingService,
  type CompanySetting,
} from "../../services/companySettingService";
// Removed imports for customerService/apiClient/toast since we no longer copy branch here
// Note: removed customerService import to avoid auto-fetching branch
import "../../styles/invoice-detail.css";
import ThaiBahtText from "thai-baht-text";
const formatAmount = (value: number) =>
  value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface InvoiceDetailPageProps {
  invoice: Invoice;
  onClose: () => void;
}

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  qty?: number;
  unit?: string;
  price?: number;
}

interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  customer_name: string;
  customer_address?: string;
  customer_branch_name?: string;
  seller_name?: string;
  customer_tax_id?: string;
  customer_phone?: string;
  customer_email?: string;
  reference_doc?: string;
  salesperson?: string;
  items: InvoiceItem[];
  notes?: string;
  subtotal: number;
  discount_amount: number;
  after_discount: number;
  vat: number;
  grand_total: number;
  doc_type?: "original" | "copy";
}

export default function InvoiceDetailPage({
  invoice,
  onClose,
}: InvoiceDetailPageProps) {
  const [companySetting, setCompanySetting] = useState<CompanySetting | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const setting = await companySettingService.get();
        if (!mounted) return;
        setCompanySetting(setting);
      } catch (err) {
        console.debug("Failed to load companySetting (silent):", err);
      }
    };
    load();

    // We intentionally do not auto-fetch or set a fallback branch; the
    // invoice should show the `customer_branch_name` supplied by the backend.
    return () => {
      mounted = false;
    };
  }, [invoice]);

  // Do not maintain local copy — invoice is authoritative and will be updated by parent.
  const handlePrint = () => {
    window.print();
  };

  // const isCopy = invoice.doc_type === "copy"; // unused

  // Fill empty rows to maintain consistent table size (13 items like handleOpenDetail)
  const itemsPerPage = 13;
  const filledItems = [...invoice.items];
  const emptyRows = Math.max(0, itemsPerPage - invoice.items.length);
  for (let i = 0; i < emptyRows; i++) {
    filledItems.push({
      id: `empty-${i}`,
      description: " ",
      amount: 0,
      qty: undefined,
      unit: " ",
      price: undefined,
    });
  }

  const invoiceDateFormatted = new Date(
    invoice.invoice_date
  ).toLocaleDateString("th-TH");

  // Branch is taken from the editable `branchValue` state (prefilled from invoice)

  return (
    <div className="invoice-detail">
      {/* Action Buttons - Hidden when printing (ผ่าน CSS) */}
      <div className="invoice-toolbar">
        <div className="toolbar-content">
          <Button variant="outline" onClick={onClose} className="toolbar-btn">
            <ArrowLeft className="w-4 h-4" /> กลับ
          </Button>
          <div>
            <Button onClick={handlePrint} className="toolbar-btn primary">
              <Printer className="w-4 h-4" /> พิมพ์
            </Button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="doc-wrap">
        <div className="invoice-document">
          <div className="invoice-document-content">
            {/* ===== HEADER SECTION ===== */}
            {/* Title Thai - Adjust in CSS: .pos-title-thai */}
            <div className="pos-title-thai">ใบส่งสินค้า/ใบแจ้งหนี้</div>

            {/* Title English - Adjust in CSS: .pos-title-english */}
            <div className="pos-title-english">DELIVERY ORDER/INVOICE</div>

            {/* ===== CUSTOMER INFO SECTION ===== */}
            {/* Customer Name - Adjust in CSS: .pos-customer-name */}
            <div className="pos-customer-name">
              <strong>{invoice.customer_name || "-"}</strong>
            </div>

            {/* Invoice No - Adjust in CSS: .pos-invoice-no */}
            <div className="pos-invoice-no">{invoice.invoice_no}</div>

            {/* Invoice Date - Adjust in CSS: .pos-invoice-date */}
            <div className="pos-invoice-date">{invoiceDateFormatted}</div>

            {/* กล่องรวมข้อมูลลูกค้า - ใช้ .pos-customer-block */}
            <div className="pos-customer-block">
              <p className="pos-customer-line">
                ที่อยู่: {invoice.customer_address || "-"}
              </p>
              <p className="pos-customer-line">
                โทร: {invoice.customer_phone || "-"}
              </p>
              <p className="pos-customer-line">
                อีเมล: {invoice.customer_email || "-"}
              </p>
              <p className="pos-customer-line">
                เลขประจำตัวผู้เสียภาษี: {invoice.customer_tax_id || "-"} สาขา{" "}
                {invoice.customer_branch_name
                  ? `${invoice.customer_branch_name}`
                  : ""}
              </p>
            </div>

            {/* ===== RIGHT SIDE INFO ===== */}
            {/* วันที่ออกใบกำกับ - Adjust in CSS: .pos-issue-date */}
            <div className="pos-date-block">
              <p className="pos-date-line">
                วันที่ออกใบกำกับ: {invoiceDateFormatted}
              </p>

              {/* เอกสารอ้างอิง - Adjust in CSS: .pos-reference-doc */}
              <p className="pos-date-line">
                เอกสารอ้างอิง: {invoice.reference_doc || invoice.invoice_no}
              </p>

              {/* พนักงานขาย - Adjust in CSS: .pos-salesperson */}
              <p className="pos-date-line">
                พนักงานขาย:{" "}
                {invoice.seller_name ||
                  invoice.salesperson ||
                  (invoice as any).seller ||
                  (companySetting as any)?.seller ||
                  "-"}
              </p>
            </div>

            {/* ===== ITEMS TABLE ===== */}
            {/* Table - Adjust in CSS: .pos-items-table */}
            <table className="pos-items-table">
              <thead>
                <tr>
                  <th className="col-no">ลำดับ</th>
                  <th className="col-desc">รายละเอียด</th>
                  <th className="col-qty">จำนวน</th>
                  <th className="col-unit">หน่วย</th>
                  <th className="col-price">ราคา/หน่วย</th>
                  <th className="col-amount">จำนวนเงิน(บาท)</th>
                </tr>
              </thead>
              <tbody>
                {filledItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="col-no invoice-text-center">
                      {item.id.startsWith("empty-") ? "" : idx + 1}
                    </td>
                    <td className="col-desc">
                      {item.id.startsWith("empty-")
                        ? "\u00A0"
                        : item.description || "-"}
                    </td>
                    <td className="col-qty invoice-text-center">
                      {item.id.startsWith("empty-") ? "" : item.qty || 1}
                    </td>
                    <td className="col-unit invoice-text-center">
                      {item.id.startsWith("empty-") ? "" : item.unit || "งวด"}
                    </td>
                    <td className="col-price invoice-text-right">
                      {item.id.startsWith("empty-")
                        ? ""
                        : Number(item.amount || 0).toLocaleString()}
                    </td>
                    <td
                      className="col-amount invoice-text-right"
                      style={{ paddingRight: "0.3cm" }}
                    >
                      {item.id.startsWith("empty-")
                        ? ""
                        : Number(item.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ===== POSITIONED TOTALS (move in CSS) ===== */}
            <div className="pos-eoe">
              <b>ผิด ตก ยกเว้น E & O.E.</b>
            </div>

            <div className="pos-totals">
              <div className="pos-total-row">
                <div className="pos-total-label">รวมเป็นเงิน</div>
                <div className="pos-total-value">
                  {formatAmount(invoice.subtotal)}
                </div>
              </div>

              <div className="pos-total-row">
                <div className="pos-total-label">ส่วนลด</div>
                <div className="pos-total-value">
                  {formatAmount(invoice.discount_amount)}
                </div>
              </div>

              <div className="pos-total-row">
                <div className="pos-total-label">ราคาหลังหักส่วนลด</div>
                <div className="pos-total-value">
                  {formatAmount(invoice.after_discount)}
                </div>
              </div>

              <div className="pos-total-row">
                <div className="pos-total-label">ภาษีมูลค่าเพิ่ม VAT 7%</div>
                <div className="pos-total-value">
                  {formatAmount(invoice.vat)}
                </div>
              </div>
            </div>

            {/* Grand total container - easier to position as a group */}
            <div className="pos-grand-container">
              <div className="pos-grand-label">รวมราคาทั้งสิ้น</div>
              <div className="pos-grand-value">
                {formatAmount(invoice.grand_total)}
              </div>
            </div>

            {/* Grand total in words (ไทยเป็นข้อความ) */}
            <div className="pos-grand-text">
              <strong>({ThaiBahtText(invoice.grand_total)})</strong>
            </div>

            {/* ===== FOOTER SECTION ===== */}
            {/* หมายเหตุ (Notes) - Adjust in CSS: .pos-notes */}
            <div className="pos-notes">
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "0.3cm",
                  fontSize: "14px",
                }}
              >
                หมายเหตุ:
              </div>
              <div className="notes-list">
                <p>
                  1.กรณีเอกสารไม่ถูกต้อง กรุณาแจ้งเป็นลายลักษณ์อักษรภายใน 7 วัน
                </p>
                <p>2.กรณีชำระเงินล่าช้ากว่ากำหนด บริษัทฯจะคิดดอกเบี้ย</p>
                <p>ในอัตราร้อยละ 2% ต่อเดือน</p>
                <p>3.หากชำระด้วยเช็คโปรดขีดคร่อม และสั่งจ่ายชื่อบริษัทฯ</p>
                <p>และขีดคร่อมค่าว่า "A/C PAYEE ONLY" เท่านั้น</p>
              </div>
            </div>

            {/* Signature Box 1 - Adjust in CSS: .pos-signature-1 */}
            <div className="pos-signature-1">
              <div style={{ marginBottom: "1cm" }}>ผู้รับสินค้า/บริการ</div>
            </div>

            {/* Signature Box 2 - Adjust in CSS: .pos-signature-2 */}
            <div className="pos-signature-2">
              <div style={{ marginBottom: "1cm" }}>ผู้ส่งสินค้า/ผู้วางบิล</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
