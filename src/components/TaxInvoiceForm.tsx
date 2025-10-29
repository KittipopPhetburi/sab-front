import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Plus, Trash2, Printer } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { customerService } from '../services/customerService';
import type { Customer } from '../services/customerService';
import { productService } from '../services/productService';
import type { Product } from '../services/productService';
import { toast } from 'sonner';




interface InvoiceItem {
  id: string;
  productId?: number;
  description: string;
  amount: number;
}

interface TaxInvoiceFormProps {
  documentType: 'invoice' | 'receipt' | 'quotation' | 'purchase_order';
  onSave: (data: any) => void;
  onCancel: () => void;
  editData?: any;
 
}



// เอกสารต้นฉบับที่สามารถเลือกได้
const sourceDocuments = [
  {
    id: '1',
    code: 'QT250001',
    name: 'ใบเสนอราคา - บริษัท ABC จำกัด',
    customer: 'บริษัท ABC จำกัด',
  },
  {
    id: '2',
    code: 'PO250002',
    name: 'ใบสั่งซื้อ - บริษัท XYZ จำกัด',
    customer: 'บริษัท XYZ จำกัด',
  },
  {
    id: '3',
    code: 'INV250010',
    name: 'ใบแจ้งหนี้ - ร้าน DEF การค้า',
    customer: 'ร้าน DEF การค้า',
  },
];

export default function TaxInvoiceForm({
  documentType,
  onSave,
  onCancel,
  editData,
}: TaxInvoiceFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [docNumber, setDocNumber] = useState(() => {
    if (editData) {
      return editData.invoice_no || editData.quotation_number || editData.po_number || editData.receipt_no || '';
    }
    let prefix = 'TINV';
    if (documentType === 'invoice') prefix = 'TINV';
    else if (documentType === 'quotation') prefix = 'QT';
    else if (documentType === 'purchase_order') prefix = 'PO';
    else prefix = 'REC';
    return `${prefix}${Date.now().toString().slice(-6)}`;
  });
  const [docDate, setDocDate] = useState(today);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [openCustomer, setOpenCustomer] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('1. การชำระเงินภายในเวลาที่กำหนด 7 วัน ตั้งแต่วันที่ได้รับสินค้า\n2. การส่งมอบสินค้าต้องเป็นไปตามเงื่อนไขที่ระบุไว้ในใบสั่งซื้อนี้เท่านั้น คลาง POSTER ONLY การขนส่ง\n3. ค่าบริการจัดส่งคิดตามระยะทางจริงรวมภาษีมูลค่าเพิ่ม');
  const [discount, setDiscount] = useState(0);
  const [vatRate, setVatRate] = useState(7);

  // ข้อมูลการจัดส่ง
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  // พนักงานขาย
  const [salesperson, setSalesperson] = useState('');

  // วันที่ชำระเงิน
  const [paymentDate, setPaymentDate] = useState(today);

  // การคิดภาษี
  const [taxType, setTaxType] = useState<'excluding' | 'including' | 'none'>('excluding');

  // โหลดข้อมูลลูกค้าและสินค้าจากฐานข้อมูล
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerList, productList] = await Promise.all([
          customerService.getActiveCustomers(),
          productService.getAll()
        ]);
        setCustomers(customerList);
        setProducts(productList);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      }
    };
    loadData();
  }, []);

  // โหลดข้อมูลจาก editData เมื่อมีการแก้ไข
  useEffect(() => {
    if (editData && customers.length > 0) {
      // หาลูกค้าจาก customer_code หรือ supplier_code
      const customerCode = editData.customer_code || editData.supplier_code;
      const customer = customers.find(c => c.code === customerCode);
      if (customer) {
        setSelectedCustomer(customer);
      }

      // โหลดข้อมูลอื่นๆ
      if (editData.shipping_address) setShippingAddress(editData.shipping_address);
      if (editData.shipping_phone) setShippingPhone(editData.shipping_phone);
      if (editData.notes) setNotes(editData.notes);
      if (editData.discount !== undefined) setDiscount(editData.discount);
      if (editData.vat_rate !== undefined) setVatRate(editData.vat_rate);
      if (editData.reference_doc) setSelectedDocument(editData.reference_doc);

      // โหลด items
      if (editData.items) {
        try {
          const parsedItems = typeof editData.items === 'string'
            ? JSON.parse(editData.items)
            : editData.items;
          setItems(parsedItems);
        } catch (error) {
          console.error('Error parsing items:', error);
        }
      }
    }
  }, [editData, customers]);

  const getDocumentTitle = () => {
    if (documentType === 'invoice') return 'ใบแจ้งหนี้/ใบกำกับภาษี';
    if (documentType === 'quotation') return 'ใบเสนอราคา';
    if (documentType === 'purchase_order') return 'ใบสั่งซื้อ';
    return 'ใบเสร็จรับเงิน/ใบกำกับภาษี';
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const handleSelectProduct = (itemId: string, product: Product) => {
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId: product.id,
              description: product.name,
              amount: Number(product.sale_price) || 0, // แก้เป็น sale_price
            }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'description' | 'amount', value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateDiscountAmount = () => {
    return (calculateSubtotal() * discount) / 100;
  };

  const calculateAfterDiscount = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const calculateVat = () => {
    return (calculateAfterDiscount() * vatRate) / 100;
  };

  const calculateGrandTotal = () => {
    return calculateAfterDiscount() + calculateVat();
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast.error('กรุณาเลือกลูกค้า');
      return;
    }

    if (items.length === 0) {
      toast.error('กรุณาเพิ่มรายการสินค้า');
      return;
    }

    // เลือก API endpoint ตาม documentType
    let apiUrl: string;
    if (documentType === 'invoice') {
      apiUrl = 'http://127.0.0.1:8000/api/invoices';
    } else if (documentType === 'quotation') {
      apiUrl = 'http://127.0.0.1:8000/api/quotations';
    } else if (documentType === 'purchase_order') {
      apiUrl = 'http://127.0.0.1:8000/api/purchase-orders';
    } else {
      apiUrl = 'http://127.0.0.1:8000/api/receipts';
    }

    // สร้าง payload ตาม API ที่จะเรียก
    let payload;
    if (documentType === 'invoice') {
      // payload สำหรับ invoices API
      payload = {
        invoice_no: docNumber,
        invoice_date: docDate,
        customer_code: selectedCustomer.code,
        customer_name: selectedCustomer.name,
        customer_address: selectedCustomer.address,
        customer_tax_id: selectedCustomer.tax_id,
        customer_phone: selectedCustomer.phone,
        customer_email: selectedCustomer.email,
        reference_doc: selectedDocument,
        shipping_address: shippingAddress,
        shipping_phone: shippingPhone,
        items: JSON.stringify(items), // แปลงเป็น JSON string
        notes,
        discount,
        vat_rate: vatRate,
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscountAmount(),
        after_discount: calculateAfterDiscount(),
        vat: calculateVat(),
        grand_total: calculateGrandTotal(),
        status: 'draft',
        due_date: null,
      };
    } else if (documentType === 'quotation') {
      // payload สำหรับ quotations API
      payload = {
        quotation_number: docNumber,
        date: docDate,
        customer_code: selectedCustomer.code,
        customer_name: selectedCustomer.name,
        customer_address: selectedCustomer.address,
        customer_tax_id: selectedCustomer.tax_id,
        customer_phone: selectedCustomer.phone,
        customer_email: selectedCustomer.email,
        reference_doc: selectedDocument,
        shipping_address: shippingAddress,
        shipping_phone: shippingPhone,
        items: JSON.stringify(items), // แปลงเป็น JSON string
        notes,
        discount,
        vat_rate: vatRate,
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscountAmount(),
        after_discount: calculateAfterDiscount(),
        vat: calculateVat(),
        grand_total: calculateGrandTotal(),
        status: 'ร่าง',
        valid_until: null,
      };
    } else if (documentType === 'purchase_order') {
      // payload สำหรับ purchase_orders API (ใช้ supplier แทน customer)
      payload = {
        po_number: docNumber,
        date: docDate,
        supplier_code: selectedCustomer.code,
        supplier_name: selectedCustomer.name,
        supplier_address: selectedCustomer.address,
        supplier_tax_id: selectedCustomer.tax_id,
        supplier_phone: selectedCustomer.phone,
        supplier_email: selectedCustomer.email,
        reference_doc: selectedDocument,
        shipping_address: shippingAddress,
        shipping_phone: shippingPhone,
        items: JSON.stringify(items), // แปลงเป็น JSON string
        notes,
        discount,
        vat_rate: vatRate,
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscountAmount(),
        after_discount: calculateAfterDiscount(),
        vat: calculateVat(),
        grand_total: calculateGrandTotal(),
        status: 'ร่าง',
        expected_delivery_date: null,
      };
    } else {
      // payload สำหรับ receipts API
      payload = {
        receipt_no: docNumber,
        date: docDate,
        customer: selectedCustomer.name,
        invoice_ref: selectedDocument || '-',
        amount: calculateGrandTotal(),
        status: 'ร่าง',
        description: notes || undefined,
      };
    }

    try {
      console.log('Sending to API:', apiUrl);
      console.log('Payload:', payload);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // ตรวจสอบว่า response เป็น JSON หรือไม่
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Response is not JSON:', text.substring(0, 200));
        toast.error('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาตรวจสอบ console');
        return;
      }

      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        let docTypeName = 'ใบเสร็จรับเงิน';
        if (documentType === 'invoice') docTypeName = 'ใบแจ้งหนี้';
        else if (documentType === 'quotation') docTypeName = 'ใบเสนอราคา';
        toast.success(`บันทึก${docTypeName}สำเร็จ`);
        onSave(payload);
      } else {
        console.error('API Error:', result);
        if (result.errors) {
          // Laravel validation errors
          const errorMessages = Object.values(result.errors).flat().join(', ');
          toast.error('ข้อผิดพลาด: ' + errorMessages);
        } else {
          toast.error('เกิดข้อผิดพลาด: ' + (result.message || 'ไม่สามารถบันทึกได้'));
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + error);
    }
  };

  const activeCustomers = customers.filter((c: Customer) => c.status === 'active');

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">{getDocumentTitle()}</h2>
        <Button variant="outline" className="text-cyan-500 border-cyan-500">
          NEW DELIVERY
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Document Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>เลขที่เอกสาร</Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>แท้น</Label>
              <Select defaultValue="แท้น">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="แท้น">แท้น</SelectItem>
                  <SelectItem value="สำเนา">สำเนา</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>วันที่เริ่มต้น</Label>
              <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
            </div>
          </div>

          {/* Source Document Selection */}
          <div className="space-y-2">
            <Label>เลือกเอกสาร</Label>
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกเอกสารต้นทาง..." />
              </SelectTrigger>
              <SelectContent>
                {sourceDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.code} - {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>เลือกลูกค้า</Label>
            <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCustomer}
                  className="w-full justify-between h-auto min-h-[40px]"
                >
                  {selectedCustomer ? (
                    <div className="w-full text-left">
                      <div className="flex gap-2">
                        <span className="text-blue-600">{selectedCustomer.code}</span>
                        <span>-</span>
                        <span>{selectedCustomer.name}</span>
                      </div>
                      {selectedCustomer.address && (
                        <div className="mt-1 text-sm text-gray-500">{selectedCustomer.address}</div>
                      )}
                    </div>
                  ) : (
                    'เลือกลูกค้า...'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0">
                <Command>
                  <CommandInput placeholder="ค้นหาลูกค้า..." />
                  <CommandList>
                    <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                    <CommandGroup>
                      {activeCustomers.map((customer: Customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.code} ${customer.name}`}
                          onSelect={() => {
                            setSelectedCustomer(customer);
                            setShippingAddress(customer.address || '');
                            setShippingPhone(customer.phone || '');
                            setOpenCustomer(false);
                          }}
                          className="flex flex-col items-start py-3"
                        >
                          <div className="flex gap-2">
                            <span className="text-blue-600">{customer.code}</span>
                            <span>-</span>
                            <span>{customer.name}</span>
                          </div>
                          {customer.address && (
                            <div className="mt-1 text-sm text-gray-500">{customer.address}</div>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Customer Details */}
          {selectedCustomer && (
            <div className="grid grid-cols-4 gap-4 p-4 rounded-lg bg-blue-50">
              <div className="space-y-1">
                <div className="text-sm text-gray-600">ชื่อลูกค้า</div>
                <div>{selectedCustomer.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">ประเภท</div>
                <div>{selectedCustomer.type || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">เบอร์โทร</div>
                <div>{selectedCustomer.phone || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี</div>
                <div>{selectedCustomer.tax_id || '-'}</div>
              </div>
            </div>
          )}

          {/* Shipping Information */}
          <div className="space-y-4">
            <Label className="text-base">ข้อมูลการจัดส่งสินค้า</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ที่อยู่</Label>
                <Textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="ที่อยู่จัดส่ง..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>เบอร์โทร</Label>
                <Input
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="เบอร์โทรศัพท์..."
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>รายการ</Label>
              <Button onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </div>

            <div className="overflow-hidden border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="w-[80px] text-center">ลำดับ (SRNO)</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead className="w-[150px] text-right">ราคารวม (จำนวนเงิน)</TableHead>
                    <TableHead className="w-[100px] text-right">รายการลบ (ใบสำคัญถอน)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-gray-400">
                        ไม่มีรายการ
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Select
                              value={item.productId?.toString()}
                              onValueChange={(value) => {
                                const product = products.find(p => p.id === parseInt(value));
                                if (product) {
                                  handleSelectProduct(item.id, product);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกสินค้า/บริการ..." />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - ฿{Number(product.sale_price).toLocaleString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'description', e.target.value)
                              }
                              placeholder="หรือพิมพ์รายละเอียดเอง..."
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'amount', parseFloat(e.target.value) || 0)
                            }
                            className="text-right"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>วันที่เอกสาร</Label>
              <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>วันที่ชำระเงิน</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>การคิดภาษี</Label>
              <Select value={taxType} onValueChange={(value: 'excluding' | 'including' | 'none') => setTaxType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excluding">Excluding Vat</SelectItem>
                  <SelectItem value="including">Including Vat</SelectItem>
                  <SelectItem value="none">None Vat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>พนักงานขาย</Label>
              <Input
                value={salesperson}
                onChange={(e) => setSalesperson(e.target.value)}
                placeholder="ชื่อพนักงานขาย..."
              />
            </div>
          </div>

          {/* Notes and Summary */}
          <div className="grid grid-cols-2 gap-6">
            {/* Notes */}
            <div className="space-y-2">
              <Label>โน๊ต</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                placeholder="เงื่อนไขและข้อกำหนด..."
              />
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>ยอด</span>
                <span>{calculateSubtotal().toLocaleString()} บาท</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>ส่วนลด</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 text-right"
                    min="0"
                    max="100"
                  />
                  <span>%</span>
                  <span className="min-w-[100px] text-right">
                    {calculateDiscountAmount().toLocaleString()} บาท
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>กำไรขั้นต้น %</span>
                <span>0.00</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span>ยอดรวมก่อนภาษีมูลค่าเพิ่ม</span>
                  <span>{calculateAfterDiscount().toLocaleString()} บาท</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>ภาษีมูลค่าเพิ่ม {vatRate}%</span>
                <span>{calculateVat().toLocaleString()} บาท</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-lg">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span className="text-cyan-600">
                    {calculateGrandTotal().toLocaleString()} บาท
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-start gap-2 pt-4 border-t">
            <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600">
              บันทึก
            </Button>
            <Button variant="outline" onClick={onCancel} className="text-red-500 border-red-500">
              ยกเลิก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
