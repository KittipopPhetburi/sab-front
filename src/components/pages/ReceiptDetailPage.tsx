import { Button } from "../ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import {} from "react";
import "../../styles/receipt-detail.css";
import ThaiBahtText from "thai-baht-text";

const formatAmount = (value: number) =>
  value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface ReceiptDetailPageProps {
  receipt: Receipt;
  onClose: () => void;
}

interface Receipt {
  id: number;
  receipt_no: string;
  date: string;
  customer: string;
  customer_address?: string;
  customer_tax_id?: string;
  customer_phone?: string;
  customer_email?: string;
  invoice_ref: string;
  amount: number;
  status: "ร่าง" | "รอออก" | "ออกแล้ว" | "ยกเลิก";
  buyer_name?: string;
  seller_name?: string;
  salesperson?: string;
  customer_branch_name?: string;
  description?: string;
  doc_type?: "original" | "copy";
  items?:
    | string
    | Array<{
        id: string;
        description: string;
        qty?: number;
        unit?: string;
        price?: number;
        amount: number;
      }>;
  subtotal?: number;
  discount?: number;
  discount_amount?: number;
  after_discount?: number;
  vat_rate?: number;
  vat?: number;
  grand_total?: number;
}

export default function ReceiptDetailPage({
  receipt,
  onClose,
}: ReceiptDetailPageProps) {
  const handlePrint = () => {
    window.print();
  };

  const receiptDateFormatted = new Date(receipt.date).toLocaleDateString(
    "th-TH"
  );

  // Parse items from receipt data
  let receiptItems: Array<{
    id: string;
    description: string;
    qty?: number;
    unit?: string;
    price?: number;
    amount: number;
  }> = [];

  try {
    if (receipt.items && typeof receipt.items === "string") {
      receiptItems = JSON.parse(receipt.items);
    } else if (Array.isArray(receipt.items)) {
      receiptItems = receipt.items;
    }
  } catch (e) {
    console.error("Failed to parse receipt items:", e);
  }

  // Use calculated values from receipt or fallback to amount
  const subtotal = receipt.subtotal ?? receipt.amount;
  const discountAmount = receipt.discount_amount ?? 0;
  const afterDiscount = receipt.after_discount ?? subtotal - discountAmount;
  const vatAmount = receipt.vat ?? 0;
  const grandTotal = receipt.grand_total ?? receipt.amount;

  return (
    <div className="receipt-detail">
      {/* Action Buttons - Hidden when printing */}
      <div className="receipt-toolbar">
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
        <div className="receipt-document">
          <div className="receipt-document-content">
            {/* ===== HEADER SECTION ===== */}
            <div className="pos-title-thai">ใบเสร็จรับเงิน/ใบกำกับภาษี</div>
            <div className="pos-title-english">TAX INVOICE/RECEIPT</div>

            {/* ===== CUSTOMER INFO SECTION ===== */}
            <div className="pos-customer-name">
              <strong>{receipt.customer || "-"}</strong>
            </div>

            <div className="pos-receipt-no">{receipt.receipt_no}</div>
            <div className="pos-receipt-date">{receiptDateFormatted}</div>

            {/* กล่องรวมข้อมูลลูกค้า */}
            <div className="pos-customer-block">
              <p className="pos-customer-line">
                ที่อยู่: {receipt.customer_address || "-"}
              </p>
              <p className="pos-customer-line">
                โทร: {receipt.customer_phone || "-"}
              </p>
              <p className="pos-customer-line">
                อีเมล: {receipt.customer_email || "-"}
              </p>
              <p className="pos-customer-line">
                เลขประจำตัวผู้เสียภาษี: {receipt.customer_tax_id || "-"} สาขา{" "}
                {receipt.customer_branch_name
                  ? `${receipt.customer_branch_name}`
                  : ""}
              </p>
            </div>

            {/* ===== RIGHT SIDE INFO ===== */}
            <div className="pos-date-block">
              <p className="pos-date-line">
                วันที่ออกใบกำกับ: {receiptDateFormatted}
              </p>
              <p className="pos-date-line">
                เอกสารอ้างอิง: {receipt.invoice_ref || "-"}
              </p>
              <p className="pos-date-line">
                พนักงานขาย: {receipt.seller_name || "-"}
              </p>
            </div>

            {/* ===== ITEMS TABLE ===== */}
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
                {receiptItems.length > 0 ? (
                  receiptItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="col-no receipt-text-center">{index + 1}</td>
                      <td className="col-desc">{item.description}</td>
                      <td className="col-qty receipt-text-center">{item.qty || 1}</td>
                      <td className="col-unit receipt-text-center">{item.unit || "-"}</td>
                      <td className="col-price receipt-text-right">
                        {formatAmount(item.price || 0)}
                      </td>
                      <td className="col-amount receipt-text-right">
                        {formatAmount(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="col-no receipt-text-center">1</td>
                    <td className="col-desc">
                      {receipt.description ||
                        `รับชำระเงินตามใบแจ้งหนี้เลขที่ ${
                          receipt.invoice_ref || "-"
                        }`}
                    </td>
                    <td className="col-qty receipt-text-center">1</td>
                    <td className="col-unit receipt-text-center">-</td>
                    <td className="col-price receipt-text-right">
                      {formatAmount(receipt.amount)}
                    </td>
                    <td className="col-amount receipt-text-right">
                      {formatAmount(receipt.amount)}
                    </td>
                  </tr>
                )}
                
                {/* Empty rows for spacing */}
                {Array.from({ length: 12 }, (_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="col-no receipt-text-center"></td>
                    <td className="col-desc">&nbsp;</td>
                    <td className="col-qty receipt-text-center"></td>
                    <td className="col-unit receipt-text-center"></td>
                    <td className="col-price receipt-text-right"></td>
                    <td className="col-amount receipt-text-right"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ===== POSITIONED TOTALS ===== */}
            <div className="pos-eoe">
              <b>ผิด ตก ยกเว้น E & O.E.</b>
            </div>

            <div className="pos-totals">
              <div className="pos-total-row">
                <div className="pos-total-label">รวมเป็นเงิน</div>
                <div className="pos-total-value">
                  {formatAmount(subtotal)}
                </div>
              </div>

              <div className="pos-total-row">
                <div className="pos-total-label">ส่วนลด</div>
                <div className="pos-total-value">{formatAmount(discountAmount)}</div>
              </div>

              <div className="pos-total-row">
                <div className="pos-total-label">ราคาหลังหักส่วนลด</div>
                <div className="pos-total-value">
                  {formatAmount(afterDiscount)}
                </div>
              </div>

              <div className="pos-total-row">
                <div className="pos-total-label">ภาษีมูลค่าเพิ่ม VAT 7%</div>
                <div className="pos-total-value">{formatAmount(vatAmount)}</div>
              </div>
            </div>

            {/* Grand total split into two elements */}
            <div className="pos-grand-label">รวมราคาทั้งสิ้น</div>
            <div className="pos-grand-value">
              {formatAmount(grandTotal)}
            </div>

            {/* Grand total in words */}
            <div className="pos-grand-text">
              <strong>({ThaiBahtText(grandTotal)})</strong>
            </div>

            {/* ===== FOOTER SECTION =====
            <div className="pos-notes">
              <div style={{ fontWeight: "bold", marginBottom: "0.3cm" }}>
                หมายเหตุ:
              </div>
              <div className="notes-list">
                <p>1. กรณีเอกสารไม่ถูกต้อง กรุณาแจ้งเป็นลายลักษณ์อักษรภายใน 7 วัน</p>
                <p>2. กรณีชำระเงินล่าช้ากว่ากำหนด บริษัทฯจะคิดดอกเบี้ย</p>
                <p>ในอัตราร้อยละ 2% ต่อเดือน</p>
                <p>3. หากชำระด้วยเช็คโปรดขีดคร่อม และสั่งจ่ายชื่อบริษัทฯ</p>
                <p>และขีดคร่อมค่าว่า "A/C PAYEE ONLY" เท่านั้น</p>
              </div>
            </div> */}

            {/* Signature Box 1 */}
            <div className="pos-signature-1">
              <div style={{ marginBottom: "1cm" }}>ผู้รับสินค้า/บริการ</div>
            </div>

            {/* Signature Box 2 */}
            <div className="pos-signature-2">
              <div style={{ marginBottom: "1cm" }}>ผู้ส่งสินค้า/ผู้วางบิล</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
