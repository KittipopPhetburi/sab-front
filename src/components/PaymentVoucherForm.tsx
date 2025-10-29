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
import { Plus, Trash2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { customerService } from '../services/customerService';
import type { Customer } from '../services/customerService';
import { productService } from '../services/productService';
import type { Product } from '../services/productService';
import { toast } from 'sonner';

interface VoucherItem {
  id: string;
  productId?: number;
  description: string;
  amount: number;
}

interface PaymentVoucherFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  editData?: any;
  isEditMode?: boolean;
}

export default function PaymentVoucherForm({
  onSave,
  onCancel,
  editData,
  isEditMode = false,
}: PaymentVoucherFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [voucherNo, setVoucherNo] = useState(() => {
    return `PV${Date.now().toString().slice(-6)}`;
  });
  const [voucherDate, setVoucherDate] = useState(today);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<VoucherItem[]>([]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [vatRate, setVatRate] = useState(7);

  // ข้อมูลเพิ่มเติม
  const [paymentMethod, setPaymentMethod] = useState('โอนเงิน');
  const [paymentDate, setPaymentDate] = useState(today);
  const [taxType, setTaxType] = useState<'excluding' | 'including' | 'none'>('excluding');
  const [salesperson, setSalesperson] = useState('');
  const [withholdingTaxNo, setWithholdingTaxNo] = useState('');
  const [withholdingTaxAmount, setWithholdingTaxAmount] = useState(0);

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

        // โหลดข้อมูลสำหรับ edit mode
        if (isEditMode && editData) {
          setVoucherNo(editData.voucher_no || '');
          setVoucherDate(editData.date || today);
          setPaymentMethod(editData.payment_method || 'โอนเงิน');
          setPaymentDate(editData.payment_date || today);
          setTaxType(editData.tax_type || 'excluding');
          setSalesperson(editData.salesperson || '');
          setWithholdingTaxNo(editData.withholding_tax_no || '');
          setWithholdingTaxAmount(Number(editData.withholding_tax_amount) || 0);
          setNotes(editData.notes || '');
          setDiscount(Number(editData.discount) || 0);
          setVatRate(Number(editData.vat_rate) || 7);

          // ตั้งค่าผู้รับเงิน
          if (editData.payee_id) {
            const customer = customerList.find(c => c.id === editData.payee_id);
            if (customer) {
              setSelectedCustomer(customer);
            }
          }

          // ตั้งค่ารายการสินค้า
          if (editData.items) {
            try {
              // แปลง JSON string กลับเป็น array
              const itemsArray = typeof editData.items === 'string'
                ? JSON.parse(editData.items)
                : editData.items;

              if (Array.isArray(itemsArray) && itemsArray.length > 0) {
                setItems(itemsArray.map((item: any) => ({
                  id: item.id?.toString() || Date.now().toString(),
                  productId: item.productId || item.product_id,
                  description: item.description || '',
                  amount: Number(item.amount) || 0,
                })));
              }
            } catch (error) {
              console.error('Error parsing items:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      }
    };
    loadData();
  }, [isEditMode, editData, today]);

  const handleAddItem = () => {
    const newItem: VoucherItem = {
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
              amount: Number(product.sale_price) || 0,
            }
          : item
      )
    );
  };

  const handleItemChange = (itemId: string, field: keyof VoucherItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          // Convert amount to number
          if (field === 'amount') {
            return { ...item, [field]: Number(value) || 0 };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
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
    return calculateAfterDiscount() + calculateVat() - Number(withholdingTaxAmount || 0);
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast.error('กรุณาเลือกผู้รับเงิน');
      return;
    }

    if (items.length === 0) {
      toast.error('กรุณาเพิ่มรายการ');
      return;
    }

    const data = {
      voucher_no: voucherNo,
      date: voucherDate,
      payee: selectedCustomer.name,
      payee_id: selectedCustomer.id,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      tax_type: taxType,
      salesperson,
      withholding_tax_no: withholdingTaxNo || null,
      withholding_tax_amount: withholdingTaxAmount,
      items: JSON.stringify(items), // แปลง array เป็น JSON string
      notes,
      discount,
      vat_rate: vatRate,
      subtotal: calculateSubtotal(),
      discount_amount: calculateDiscountAmount(),
      after_discount: calculateAfterDiscount(),
      vat: calculateVat(),
      grand_total: calculateGrandTotal(),
      amount: calculateGrandTotal(),
      status: isEditMode && editData?.status ? editData.status : 'รอจ่าย',
    };

    try {
      const url = isEditMode && editData?.id
        ? `http://127.0.0.1:8000/api/payment-vouchers/${editData.id}`
        : 'http://127.0.0.1:8000/api/payment-vouchers';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', errorData);
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'save'} payment voucher`);
      }

      toast.success(isEditMode ? 'แก้ไขใบสำคัญจ่ายเงินสำเร็จ' : 'บันทึกใบสำคัญจ่ายเงินสำเร็จ');
      onSave(data);
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'saving'} payment voucher:`, error);
      console.error('Data being sent:', data);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="pb-4 border-b">
            <h2 className="text-2xl font-bold text-red-600">
              {isEditMode ? 'แก้ไขใบสำคัญจ่ายเงิน' : 'สร้างใบสำคัญจ่ายเงินใหม่'}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditMode ? 'แก้ไขข้อมูลใบสำคัญจ่ายเงิน' : 'กรอกข้อมูลใบสำคัญจ่ายเงิน'}
            </p>
          </div>

          {/* Document Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>เลขที่เอกสาร</Label>
              <Input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>วันที่เอกสาร</Label>
              <Input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>วิธีการจ่ายเงิน</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="โอนเงิน">โอนเงิน</SelectItem>
                  <SelectItem value="เงินสด">เงินสด</SelectItem>
                  <SelectItem value="เช็ค">เช็ค</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>ผู้รับเงิน/คู่ค้า</Label>
            <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCustomer}
                  className="justify-between w-full"
                >
                  {selectedCustomer ? selectedCustomer.name : 'เลือกผู้รับเงิน...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0">
                <Command>
                  <CommandInput placeholder="ค้นหาผู้รับเงิน..." />
                  <CommandList>
                    <CommandEmpty>ไม่พบผู้รับเงิน</CommandEmpty>
                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.name}
                          onSelect={() => {
                            setSelectedCustomer(customer);
                            setOpenCustomer(false);
                          }}
                        >
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">
                              {customer.code} | {customer.phone || '-'}
                            </div>
                          </div>
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
            <div className="p-4 space-y-2 border rounded-lg bg-gray-50">
              <div className="space-y-1">
                <div className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี</div>
                <div>{selectedCustomer.tax_id || '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">ที่อยู่</div>
                <div>{selectedCustomer.address || '-'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">เบอร์โทร</div>
                  <div>{selectedCustomer.phone || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">อีเมล</div>
                  <div>{selectedCustomer.email || '-'}</div>
                </div>
              </div>
            </div>
          )}

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
                    <TableHead className="w-[80px] text-center">#</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="w-[150px] text-right">จำนวนเงิน</TableHead>
                    <TableHead className="w-[100px] text-center">ลบ</TableHead>
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
                            <Textarea
                              value={item.description}
                              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                              placeholder="รายละเอียด..."
                              rows={2}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.amount || ''}
                            onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                            className="text-right"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
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
              <Label>วันที่จ่ายเงิน</Label>
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
              <Label>เลขที่หัก ณ ที่จ่าย</Label>
              <Input
                value={withholdingTaxNo}
                onChange={(e) => setWithholdingTaxNo(e.target.value)}
                placeholder="เลขที่หักภาษี..."
              />
            </div>
            <div className="space-y-2">
              <Label>จำนวนเงินหัก ณ ที่จ่าย</Label>
              <Input
                type="number"
                value={withholdingTaxAmount}
                onChange={(e) => setWithholdingTaxAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>พนักงานที่ทำรายการ</Label>
            <Input
              value={salesperson}
              onChange={(e) => setSalesperson(e.target.value)}
              placeholder="ชื่อพนักงาน..."
            />
          </div>

          {/* Notes and Summary */}
          <div className="grid grid-cols-2 gap-6">
            {/* Notes */}
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                placeholder="หมายเหตุ..."
              />
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>ยอดรวม</span>
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
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span>ยอดรวมหลังหักส่วนลด</span>
                  <span>{calculateAfterDiscount().toLocaleString()} บาท</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>ภาษีมูลค่าเพิ่ม {vatRate}%</span>
                <span>{calculateVat().toLocaleString()} บาท</span>
              </div>
              <div className="flex items-center justify-between text-red-600">
                <span>หัก ณ ที่จ่าย</span>
                <span>-{Number(withholdingTaxAmount || 0).toLocaleString()} บาท</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>ยอดรวมสุทธิ</span>
                  <span className="text-red-600">
                    {calculateGrandTotal().toLocaleString()} บาท
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-start gap-2 pt-4 border-t">
            <Button onClick={handleSave} className="bg-red-500 hover:bg-red-600">
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
