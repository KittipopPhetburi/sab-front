import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WithholdingTax } from '../services/withholdingTaxService';

export const generateWithholdingTaxPDF = (data: WithholdingTax) => {
  // Create PDF in A4 size
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 20;

  // Add Thai font support (basic)
  doc.setFont('helvetica');

  // ===== HEADER =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('หนังสือรับรองการหักภาษี ณ ที่จ่าย', pageWidth / 2, currentY, { align: 'center' });

  currentY += 8;
  doc.setFontSize(14);
  doc.text('ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร', pageWidth / 2, currentY, { align: 'center' });

  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  // ===== DOCUMENT INFO =====
  doc.text(`เลขที่เอกสาร: ${data.doc_number}`, 20, currentY);
  doc.text(`วันที่: ${new Date(data.doc_date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`, pageWidth - 20, currentY, { align: 'right' });

  currentY += 8;
  doc.text(`ลำดับที่: ${data.sequence_number}`, 20, currentY);

  currentY += 12;

  // ===== SECTION 1: PAYER INFO (ผู้จ่ายเงิน) =====
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(15, currentY - 5, pageWidth - 30, 8, 'F');
  doc.text('ส่วนที่ 1: ข้อมูลผู้จ่ายเงิน', 20, currentY);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`เลขประจำตัวผู้เสียภาษี: ${formatTaxId(data.payer_tax_id)}`, 20, currentY);

  currentY += 8;
  doc.text(`ชื่อ-สกุล/ชื่อบริษัท: ${data.payer_name}`, 20, currentY);

  currentY += 15;

  // ===== SECTION 2: RECIPIENT INFO (ผู้รับเงิน) =====
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(15, currentY - 5, pageWidth - 30, 8, 'F');
  doc.text('ส่วนที่ 2: ข้อมูลผู้รับเงิน', 20, currentY);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`เลขประจำตัวผู้เสียภาษี: ${formatTaxId(data.recipient_tax_id)}`, 20, currentY);

  currentY += 8;
  doc.text(`ชื่อ-สกุล/ชื่อบริษัท: ${data.recipient_name}`, 20, currentY);

  currentY += 8;
  const addressLines = splitText(doc, `ที่อยู่: ${data.recipient_address}`, pageWidth - 40);
  addressLines.forEach((line, index) => {
    doc.text(line, 20, currentY + (index * 6));
  });
  currentY += (addressLines.length * 6);

  currentY += 8;
  const recipientTypeMap: Record<string, string> = {
    'individual': 'บุคคลธรรมดา',
    'juristic': 'นิติบุคคล',
    'partnership': 'ห้างหุ้นส่วน',
    'other': 'อื่นๆ'
  };
  doc.text(`ประเภทผู้รับเงิน: ${recipientTypeMap[data.recipient_type] || data.recipient_type}`, 20, currentY);

  currentY += 15;

  // ===== SECTION 3: INCOME ITEMS (รายการเงินได้) =====
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(15, currentY - 5, pageWidth - 30, 8, 'F');
  doc.text('ส่วนที่ 3: ประเภทเงินได้พึงประเมินที่จ่าย', 20, currentY);

  currentY += 10;

  // Create table for income items
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.type,
    item.description,
    new Date(item.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
    `${item.tax_rate}%`,
    formatCurrency(item.amount),
    formatCurrency(item.tax_amount),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['ลำดับ', 'ประเภท', 'รายการ', 'วันที่จ่าย', 'อัตราภาษี', 'จำนวนเงิน (บาท)', 'ภาษีหัก ณ ที่จ่าย (บาท)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 50 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable?.finalY || currentY;
  currentY += 10;

  // ===== SUMMARY =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  // Draw summary box
  const boxX = pageWidth - 80;
  const boxY = currentY;
  const boxWidth = 65;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);

  // Total Amount
  doc.rect(boxX, boxY, boxWidth, 10);
  doc.text('รวมเงินที่จ่าย:', boxX + 2, boxY + 7);
  doc.text(formatCurrency(data.total_amount), boxX + boxWidth - 2, boxY + 7, { align: 'right' });

  // Total Tax
  doc.setFillColor(240, 248, 255);
  doc.rect(boxX, boxY + 10, boxWidth, 10, 'FD');
  doc.text('รวมภาษีหัก ณ ที่จ่าย:', boxX + 2, boxY + 17);
  doc.text(formatCurrency(data.total_tax), boxX + boxWidth - 2, boxY + 17, { align: 'right' });

  currentY += 35;

  // ===== NOTES =====
  if (data.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('หมายเหตุ:', 20, currentY);
    currentY += 6;
    const notesLines = splitText(doc, data.notes, pageWidth - 40);
    notesLines.forEach((line, index) => {
      doc.text(line, 20, currentY + (index * 6));
    });
    currentY += (notesLines.length * 6) + 10;
  }

  // ===== SIGNATURE SECTION =====
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 15;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Signature boxes
  const sigY = currentY;

  // Left signature (ผู้จ่ายเงิน)
  doc.text('ลงชื่อ ________________________', 30, sigY);
  doc.text('ผู้จ่ายเงิน', 30, sigY + 15);
  doc.text(`(${data.payer_name})`, 30, sigY + 20);
  doc.text(`วันที่ ____________________`, 30, sigY + 30);

  // Right signature (ผู้รับเงิน)
  const rightX = pageWidth - 100;
  doc.text('ลงชื่อ ________________________', rightX, sigY);
  doc.text('ผู้รับเงิน', rightX, sigY + 15);
  doc.text(`(${data.recipient_name})`, rightX, sigY + 20);
  doc.text(`วันที่ ____________________`, rightX, sigY + 30);

  // ===== FOOTER =====
  currentY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`สถานะ: ${data.status}`, 20, currentY);
  doc.text(`สร้างโดย: ${data.created_by}`, pageWidth / 2, currentY, { align: 'center' });
  if (data.created_at) {
    doc.text(
      `สร้างเมื่อ: ${new Date(data.created_at).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      pageWidth - 20,
      currentY,
      { align: 'right' }
    );
  }

  // Save PDF
  doc.save(`WHT_${data.doc_number}.pdf`);
};

// Helper functions
const formatTaxId = (taxId: string): string => {
  // Format: X-XXXX-XXXXX-XX-X
  if (taxId.length === 13) {
    return `${taxId.substring(0, 1)}-${taxId.substring(1, 5)}-${taxId.substring(5, 10)}-${taxId.substring(10, 12)}-${taxId.substring(12, 13)}`;
  }
  return taxId;
};

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const splitText = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const textWidth = doc.getTextWidth(testLine);

    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};
