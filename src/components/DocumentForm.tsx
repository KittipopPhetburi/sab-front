import { useState } from 'react';
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
import { mockCustomers, mockProducts } from './mockData';
import type { Customer, Product } from './mockData';



interface DocumentItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

interface DocumentFormProps {
  documentType: 'quotation' | 'purchase' | 'invoice';
  customers: Customer[];
  products: Product[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function DocumentForm({
  documentType,
  customers = mockCustomers,
  products = mockProducts,
  onSave,
  onCancel,
}: DocumentFormProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const [docNumber, setDocNumber] = useState(() => {
    const prefix = documentType === 'quotation' ? 'QT' : documentType === 'purchase' ? 'PO' : 'INV';
    return `${prefix}${Date.now().toString().slice(-6)}`;
  });
  const [docDate, setDocDate] = useState(today);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [currency, setCurrency] = useState('THB');
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [vatRate, setVatRate] = useState(7);
  const [openProductPopover, setOpenProductPopover] = useState<string | null>(null);

  const getDocumentTitle = () => {
    switch (documentType) {
      case 'quotation':
        return 'ใบเสนอราคา';
      case 'purchase':
        return 'ใบสั่งซื้อ';
      case 'invoice':
        return 'ใบแจ้งหนี้';
      default:
        return 'เอกสาร';
    }
  };

  const handleAddItem = () => {
    const newItem: DocumentItem = {
      id: Date.now().toString(),
      productId: '',
      productCode: '',
      productName: '',
      unit: 'ชิ้น',
      quantity: 1,
      pricePerUnit: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSelectProduct = (itemId: string, product: Product) => {
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId: product.id,
              productCode: product.code,
              productName: product.name,
              unit: product.unit,
              pricePerUnit: product.price,
              total: item.quantity * product.price,
            }
          : item
      )
    );
    setOpenProductPopover(null);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              total: quantity * item.pricePerUnit,
            }
          : item
      )
    );
  };

  const handleUpdatePrice = (id: string, price: number) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              pricePerUnit: price,
              total: item.quantity * price,
            }
          : item
      )
    );
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
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

  const handleSave = () => {
    const data = {
      docNumber,
      docDate,
      customer: selectedCustomer,
      currency,
      items,
      notes,
      discount,
      vatRate,
      subtotal: calculateSubtotal(),
      discountAmount: calculateDiscountAmount(),
      afterDiscount: calculateAfterDiscount(),
      vat: calculateVat(),
      grandTotal: calculateGrandTotal(),
    };
    onSave(data);
  };

  const activeCustomers = customers.filter((c) => c.status === 'active');

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
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
              <Label>สกุลเงิน</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THB">THB - ฿</SelectItem>
                  <SelectItem value="USD">USD - $</SelectItem>
                  <SelectItem value="EUR">EUR - €</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>วันที่</Label>
              <Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>เลือกลูกค้า/คู่ค้า</Label>
            <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCustomer}
                  className="w-full justify-between h-auto min-h-[40px]"
                >
                  {selectedCustomer ? (
                    <div className="text-left w-full">
                      <div className="flex gap-2">
                        <span className="text-blue-600">{selectedCustomer.code}</span>
                        <span>-</span>
                        <span>{selectedCustomer.name}</span>
                      </div>
                      {selectedCustomer.address && (
                        <div className="text-sm text-gray-500 mt-1">{selectedCustomer.address}</div>
                      )}
                    </div>
                  ) : (
                    'เลือกลูกค้า/คู่ค้า'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0">
                <Command>
                  <CommandInput placeholder="ค้นหาลูกค้า/คู่ค้า..." />
                  <CommandList>
                    <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                    <CommandGroup>
                      {activeCustomers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.code} ${customer.name}`}
                          onSelect={() => {
                            setSelectedCustomer(customer);
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
                            <div className="text-sm text-gray-500 mt-1">{customer.address}</div>
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
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">รหัสลูกค้า</div>
                <div>{selectedCustomer.code}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">ใบส่งสินค้าจาก</div>
                <div>{selectedCustomer.branchName || '-'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">แปรรูปลูกค้าจาก</div>
                <div>
                  {selectedCustomer.name}
                  {selectedCustomer.branchName && ` (${selectedCustomer.branchName})`}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">หน่วยนับภาษี</div>
                <div>{selectedCustomer.taxId || '-'}</div>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>รายการสินค้า</Label>
              <Button onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="w-[60px] text-center">ลำดับ (SRNO)</TableHead>
                    <TableHead className="min-w-[300px]">รายการ</TableHead>
                    <TableHead className="w-[150px]">รหัสสินค้า</TableHead>
                    <TableHead className="w-[120px]">หน่วยนับ</TableHead>
                    <TableHead className="w-[120px]">ราคาต่อหน่วย</TableHead>
                    <TableHead className="w-[100px]">จำนวนสินค้า</TableHead>
                    <TableHead className="w-[120px] text-right">ราคา</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                        ไม่มีรายการสินค้า
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>
                          <Popover
                            open={openProductPopover === item.id}
                            onOpenChange={(open) =>
                              setOpenProductPopover(open ? item.id : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                              >
                                {item.productName || 'เลือกสินค้า...'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="ค้นหาสินค้า..." />
                                <CommandList>
                                  <CommandEmpty>ไม่พบสินค้า</CommandEmpty>
                                  <CommandGroup>
                                    {products.map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        value={`${product.code} ${product.name}`}
                                        onSelect={() =>
                                          handleSelectProduct(item.id, product)
                                        }
                                      >
                                        <div>
                                          <div>
                                            {product.code} - {product.name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            ราคา: {product.price.toLocaleString()} บาท
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>{item.productCode}</TableCell>
                        <TableCell>
                          <Input
                            value={item.unit}
                            readOnly
                            className="bg-gray-50"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) =>
                              handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(item.id, parseFloat(e.target.value) || 0)
                            }
                            min="1"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {item.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
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

          {/* Notes and Summary */}
          <div className="grid grid-cols-2 gap-6">
            {/* Notes */}
            <div className="space-y-2">
              <Label>เงื่อนไขและข้อกำหนด</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="1. การชำระเงินภายในเวลาที่กำหนด 7 วัน ตั้งแต่วันที่ได้รับสินค้า &#10;2. การส่งมอบสินค้าต้องเป็นไปตามเงื่อนไขที่ระบุไว้ในใบสั่งซื้อนี้เท่านั้น คลาง POSTER ONLY การขนส่ง&#10;3. ค่าบริการจัดส่งคิดตามระยะทางจริงรวมภาษีมูลค่าเพิ่ม"
                rows={6}
              />
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>ยอด</span>
                <span>{calculateSubtotal().toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between items-center gap-4">
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
              <div className="flex justify-between items-center">
                <span>กำไรขั้นต้น %</span>
                <span>0.00</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span>ราคาหลังหักส่วนลด</span>
                  <span>{calculateAfterDiscount().toLocaleString()} บาท</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>ภาษีมูลค่าเพิ่ม {vatRate}%</span>
                <span>{calculateVat().toLocaleString()} บาท</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-lg">
                  <span>ราคารวมภาษีมูลค่าเพิ่ม</span>
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
