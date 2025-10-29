# วิธีใช้งาน Company Settings Context

## 1. ใช้ข้อมูลบริษัทในหน้าต่างๆ

### Import Context
```typescript
import { useCompanySettings } from '../../contexts/CompanySettingsContext';
```

### ตัวอย่างการใช้งานในหน้า Invoice, Receipt, หรือเอกสารอื่นๆ

```typescript
export default function InvoicePage() {
  const { getVatRate, getCompanyInfo, settings } = useCompanySettings();

  // ดึงอัตรา VAT สำหรับคำนวณ
  const vatRate = getVatRate(); // จะได้ 7 หรือค่าที่ตั้งไว้

  // ดึงข้อมูลบริษัทเพื่อแสดงในเอกสาร
  const companyInfo = getCompanyInfo();
  // companyInfo.name = "บริษัท ตัวอย่าง จำกัด"
  // companyInfo.branch = "สำนักงานใหญ่"
  // companyInfo.taxId = "0123456789012"
  // companyInfo.address = "123 ถนนตัวอย่าง..."
  // companyInfo.phone = "02-123-4567"
  // companyInfo.email = "info@example.com"

  // ตัวอย่างการคำนวณภาษี
  const calculateTotal = (subtotal: number) => {
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  };

  return (
    <div>
      <h1>ใบกำกับภาษี</h1>

      {/* แสดงข้อมูลบริษัท */}
      <div>
        <p>{companyInfo.name}</p>
        <p>{companyInfo.branch}</p>
        <p>เลขประจำตัวผู้เสียภาษี: {companyInfo.taxId}</p>
        <p>{companyInfo.address}</p>
        <p>โทร: {companyInfo.phone}</p>
        <p>Email: {companyInfo.email}</p>
      </div>

      {/* คำนวณยอดรวมพร้อม VAT */}
      <div>
        <p>ยอดรวมก่อน VAT: {subtotal.toFixed(2)}</p>
        <p>VAT {vatRate}%: {vatAmount.toFixed(2)}</p>
        <p>ยอดรวมทั้งสิ้น: {total.toFixed(2)}</p>
      </div>
    </div>
  );
}
```

## 2. ตัวอย่างการใช้ในฟอร์มเพิ่มเอกสาร

```typescript
export default function CreateInvoiceForm() {
  const { getVatRate } = useCompanySettings();
  const [subtotal, setSubtotal] = useState(0);
  const [vatRate] = useState(getVatRate()); // ดึงค่า VAT จาก settings

  // คำนวณอัตโนมัติเมื่อ subtotal เปลี่ยน
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  return (
    <form>
      <Input
        label="ยอดรวมก่อน VAT"
        type="number"
        value={subtotal}
        onChange={(e) => setSubtotal(Number(e.target.value))}
      />

      <div>
        <p>VAT {vatRate}%: {vatAmount.toFixed(2)} บาท</p>
        <p>ยอดรวมทั้งสิ้น: {total.toFixed(2)} บาท</p>
      </div>
    </form>
  );
}
```

## 3. ตัวอย่างการใช้ในการพิมพ์เอกสาร

```typescript
const handlePrint = (invoiceData: Invoice) => {
  const { getCompanyInfo, getVatRate } = useCompanySettings();
  const company = getCompanyInfo();
  const vatRate = getVatRate();

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ใบกำกับภาษี - ${invoiceData.doc_number}</title>
      <style>
        body { font-family: 'Sarabun', sans-serif; }
        .header { text-align: center; }
        .company-info { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>ใบกำกับภาษี</h2>
        <h3>${company.name}</h3>
      </div>

      <div class="company-info">
        <p>${company.branch}</p>
        <p>เลขประจำตัวผู้เสียภาษี: ${company.taxId}</p>
        <p>${company.address}</p>
        <p>โทร: ${company.phone} | Email: ${company.email}</p>
      </div>

      <table>
        <tr>
          <td>ยอดรวมก่อน VAT</td>
          <td>${invoiceData.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>VAT ${vatRate}%</td>
          <td>${(invoiceData.subtotal * (vatRate / 100)).toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>ยอดรวมทั้งสิ้น</strong></td>
          <td><strong>${invoiceData.total.toFixed(2)}</strong></td>
        </tr>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};
```

## 4. เช็คสถานะการโหลด

```typescript
export default function SomePage() {
  const { settings, loading } = useCompanySettings();

  if (loading) {
    return <div>กำลังโหลดข้อมูล...</div>;
  }

  if (!settings) {
    return <div>ไม่พบข้อมูลการตั้งค่า</div>;
  }

  return (
    <div>
      {/* แสดงข้อมูล */}
    </div>
  );
}
```

## 5. รีเฟรชข้อมูล Settings (ถ้าจำเป็น)

```typescript
export default function SomePage() {
  const { refreshSettings } = useCompanySettings();

  const handleRefresh = async () => {
    await refreshSettings();
    toast.success('รีเฟรชข้อมูลสำเร็จ');
  };

  return (
    <Button onClick={handleRefresh}>รีเฟรชข้อมูล</Button>
  );
}
```

## สรุป

### ฟังก์ชันที่มีใน Context:
- `settings` - ข้อมูล settings ทั้งหมด (CompanySetting object)
- `loading` - สถานะการโหลดข้อมูล (boolean)
- `getVatRate()` - ดึงอัตรา VAT (return number เช่น 7)
- `getCompanyInfo()` - ดึงข้อมูลบริษัท (return object)
- `refreshSettings()` - รีเฟรชข้อมูลจาก API

### การใช้งานหลักๆ:
1. **ใบกำกับภาษี/ใบเสร็จ** - ใช้ `getVatRate()` คำนวณภาษี + `getCompanyInfo()` แสดงข้อมูลบริษัท
2. **ใบเสนอราคา** - ใช้ `getVatRate()` คำนวณราคา + แสดงข้อมูลบริษัท
3. **ใบสั่งซื้อ** - แสดงข้อมูลบริษัทผู้ออกเอกสาร
4. **การพิมพ์เอกสาร** - ใช้ข้อมูลบริษัทและ VAT Rate ในเอกสารพิมพ์
5. **หน้าแดชบอร์ด** - แสดงชื่อบริษัทและข้อมูลติดต่อ
