import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
// removed unused Table imports
import { Plus, Trash2, ArrowLeft, Save, Search, Users, X } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { customerService } from "../services/customerService";
import { companySettingService } from "../services/companySettingService";
import { withholdingTaxService } from "../services/withholdingTaxService";
import type { Customer } from "../services/customerService";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";

interface TaxIncomeItem {
  id: string;
  type: string;
  description: string;
  date: string;
  taxRate: number;
  amount: number;
  taxAmount: number;
}

interface WithholdingTaxFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

// ประเภทเงินได้พึงประเมินที่จ่าย
const incomeTypes = [
  {
    code: "1. ",
    description: "เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40(1)",
    defaultRate: 0,
  },
  {
    code: "2. ",
    description: "ค่าธรรมเนียม ค่านายหน้า ค่าโฆษณา ฯลฯ ตามมาตรา 40(2)",
    defaultRate: 3,
  },
  {
    code: "3. ",
    description: "ค่าแห่งลิขสิทธิ์ ค่าจ้างทำของ ค่าบริการ ฯลฯ ตามมาตรา 40(3)",
    defaultRate: 3,
  },
  {
    code: "4. (ก) ",
    description: "ดอกเบี้ย เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40(4)(ก)",
    defaultRate: 1,
  },
  {
    code: "4. (ข) ",
    description: "เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40(4)(ข)",
    defaultRate: 10,
  },
  {
    code: "4. (ข)(1) ",
    description: "ผู้ได้รับเงินปันผลได้รับเครดิตภาษี โดยหัก ณ ที่จ่าย 10%",
    defaultRate: 10,
  },
  {
    code: "4. (ข)(2) ",
    description: "ผู้ได้รับเงินปันผลได้รับเครดิตภาษีร้อยละของเงินปันผลที่จ่าย",
    defaultRate: 0,
  },
  {
    code: "4. (ข)(3) ",
    description: "กรณีอื่นๆ (ระบุ)",
    defaultRate: 10,
  },
  {
    code: "5. ",
    description: "การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย อื่นๆ",
    defaultRate: 5,
  },
  {
    code: "6. ",
    description: "อื่นๆ (ระบุ)",
    defaultRate: 1,
  },
];

export default function WithholdingTaxForm({
  initialData,
  onSave,
  onCancel,
}: WithholdingTaxFormProps) {
  const today = new Date().toISOString().split("T")[0];

  // สร้างเลขเอกสาร (format helper)
  const generateDocNumber = (lastDocNumber = 0) => {
    const currentYear = new Date().getFullYear().toString(); // ปีปัจจุบัน เช่น 2025
    return `WHT${currentYear}${(lastDocNumber + 1)
      .toString()
      .padStart(4, "0")}`;
  };

  // ตั้งค่าเลขเอกสารตอนเริ่มต้น
  const [docNumber, setDocNumber] = useState(
    initialData?.docNumber || generateDocNumber() // ถ้ามี initialData จะใช้เลขเอกสารที่มี ถ้าไม่มีใช้ฟังก์ชัน generateDocNumber
  );

  const [deductionMode, setDeductionMode] = useState<
    "" | "wht" | "always" | "once" | "other"
  >("");
  const [deductionOther, setDeductionOther] = useState("");
  const [deductionFormat, setDeductionFormat] = useState<
    "" | "1" | "2" | "3" | "4" | "5" | "6" | "7"
  >("");

  const [company_name, setCompanyName] = useState(
    initialData?.companyName || ""
  );

  const [company_address, setCompanyAddress] = useState(
    initialData?.companyAddress || ""
  );

  const [companyTaxId, setCompanyTaxId] = useState(
    initialData?.companyTaxId || ""
  );

  const [docDate, setDocDate] = useState(initialData?.docDate || today);
  const [sequenceNumber, setSequenceNumber] = useState(
    initialData?.sequenceNumber || "1"
  );
  const [deductionOrder, setDeductionOrder] = useState(
    initialData?.deductionOrder || ""
  );

  // Payer info

  // Recipient info
  const [recipientTaxId, setRecipientTaxId] = useState(
    initialData?.recipientTaxId || ""
  );
  const [recipientName, setRecipientName] = useState(
    initialData?.recipientName || ""
  );
  const [recipientAddress, setRecipientAddress] = useState(
    initialData?.recipientAddress || ""
  );
  const [representativeTaxId, setRepresentativeTaxId] = useState(
    initialData?.representativeTaxId || ""
  );
  const [representativeName, setRepresentativeName] = useState(
    initialData?.representativeName || ""
  );
  const [representativeAddress, setRepresentativeAddress] = useState(
    initialData?.representativeAddress || ""
  );

  const [recipientType, setRecipientType] = useState<
    "individual" | "juristic" | "partnership" | "other"
  >(initialData?.recipientType || "juristic");
  const [companyType, setCompanyType] = useState<
    "1" | "2" | "3" | "4" | "5" | "other"
  >(initialData?.companyType || "2");
  const [items, setItems] = useState<TaxIncomeItem[]>(initialData?.items || []);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [openCustomer, setOpenCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // โหลดข้อมูลลูกค้าจากฐานข้อมูล
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customerList = await customerService.getActiveCustomers();
        setCustomers(customerList);
      } catch (error) {
        console.error("Error loading customers:", error);
        toast.error("ไม่สามารถโหลดข้อมูลลูกค้าได้");
      }
    };
    loadCustomers();
  }, []);

  // โหลดข้อมูลบริษัทจากตาราง company_settings เพื่อเติมชื่อบริษัท/เลขผู้เสียภาษี/ที่อยู่ อัตโนมัติ
  useEffect(() => {
    // ถ้าเป็นการแก้ไข (มี initialData) ไม่ต้อง override ค่าที่มีอยู่
    if (initialData) return;

    let mounted = true;
    const loadCompanySettings = async () => {
      try {
        const setting = await companySettingService.get();
        if (!mounted) return;
        // mapping ให้ตรงกับ schema ของ companySettingService
        setCompanyName(setting.company_name || "");
        setCompanyAddress(setting.address || "");
        setCompanyTaxId(setting.tax_id || "");
      } catch (error) {
        console.error("Error loading company settings:", error);
        // ไม่ต้องเด้ง error ผู้ใช้ในกรณีนี้ เพื่อไม่ให้รบกวนการทำงาน
      }
    };
    loadCompanySettings();
    return () => {
      mounted = false;
    };
  }, [initialData]);

  useEffect(() => {
    // ถ้ามีการเปลี่ยนแปลง initialData หรือฟอร์มใหม่ รีเซ็ตเลขเอกสาร
    // หากไม่มี initialData ให้เรียก API เพื่อหาค่าเลขเอกสารล่าสุดของปีนี้แล้วกำหนดเลขใหม่
    if (initialData) return;

    let mounted = true;
    const fetchNextDocNumber = async () => {
      try {
        const all = await withholdingTaxService.getAll();
        const year = new Date().getFullYear().toString();
        // รูปแบบเลขเอกสาร: WHT{year}{4-digit}
        const regex = new RegExp(`^WHT${year}(\\d{4})$`);
        let maxSeq = 0;
        all.forEach((d: any) => {
          if (typeof d.doc_number === "string") {
            const m = d.doc_number.match(regex);
            if (m) {
              const num = parseInt(m[1], 10);
              if (!isNaN(num) && num > maxSeq) maxSeq = num;
            }
          }
          // fallback: if doc_date is in same year, try sequence_number field
          if (maxSeq === 0 && d.doc_date) {
            try {
              const docYear = new Date(d.doc_date).getFullYear().toString();
              if (docYear === year && d.sequence_number) {
                const seq = parseInt(String(d.sequence_number), 10);
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        });

        if (mounted) {
          setDocNumber(generateDocNumber(maxSeq));
        }
      } catch (error) {
        console.error(
          "Error fetching withholding taxes for doc number generation:",
          error
        );
        if (mounted) {
          setDocNumber(generateDocNumber(0));
        }
      }
    };

    fetchNextDocNumber();

    return () => {
      mounted = false;
    };
  }, [initialData]); // ทำงานเมื่อ initialData เปลี่ยน

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setRecipientName(customer.name);
    setRecipientTaxId(customer.tax_id || "");
    setRecipientAddress(customer.address || "");
    // ตั้งเป็นนิติบุคคลโดยปริยายเมื่อเลือกลูกค้าจากระบบ
    setRecipientType("juristic");
    setOpenCustomer(false);
    toast.success(`เลือกลูกค้า: ${customer.name}`);
  };

  const handleAddItem = () => {
    const newItem: TaxIncomeItem = {
      id: Date.now().toString(),
      type: "40(2)",
      description: incomeTypes[1].description,
      date: today,
      taxRate: incomeTypes[1].defaultRate,
      amount: 0,
      taxAmount: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (
    id: string,
    field: keyof TaxIncomeItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // If income type changed, update description and default rate
          if (field === "type") {
            const incomeType = incomeTypes.find((t) => t.code === value);
            if (incomeType) {
              updatedItem.description = incomeType.description;
              updatedItem.taxRate = incomeType.defaultRate;
            }
          }

          // Auto-calculate tax amount
          if (field === "amount" || field === "taxRate") {
            updatedItem.taxAmount =
              (updatedItem.amount * updatedItem.taxRate) / 100;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientTaxId || !recipientName) {
      toast.error("กรุณากรอกข้อมูลผู้รับเงิน");
      return;
    }

    if (items.length === 0) {
      toast.error("กรุณาเพิ่มรายการอย่างน้อย 1 รายการ");
      return;
    }

    onSave({
      docNumber,
      docDate,
      company_name,
      sequenceNumber,
      deductionOrder,
      company_address,
      companyTaxId,
      representativeTaxId,
      representativeName,
      representativeAddress,
      recipientTaxId,
      recipientName,
      recipientAddress,
      recipientType,
      companyType: recipientType === "juristic" ? companyType : undefined,
      deductionMode,
      deductionOther,
      deductionFormat,
      items,
      totalAmount: subtotal,
      totalTax,
      notes,
      customer: selectedCustomer,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button type="button" variant="ghost" onClick={onCancel}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  กลับ
                </Button>
                <div>
                  <h1>สร้างหัก ณ ที่จ่าย</h1>
                  <p className="text-sm text-gray-500">
                    กรอกข้อมูลเอกสารหักภาษี ณ ที่จ่าย
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  บันทึก
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Document Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4">ข้อมูลเอกสาร</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="docNumber">เลขที่เอกสาร</Label>
                  <Input
                    id="docNumber"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sequenceNumber">ลำดับที่</Label>
                  <Input
                    id="sequenceNumber"
                    value={sequenceNumber}
                    onChange={(e) => setSequenceNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="docDate">วันที่</Label>
                  <Input
                    id="docDate"
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payer Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4">ข้อมูลผู้จ่ายเงิน</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyTaxId">
                    เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)
                  </Label>
                  <Input
                    id="companyTaxId"
                    value={companyTaxId}
                    readOnly
                    className="bg-gray-100 cursor-text focus-visible:ring-0"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">ชื่อ-สกุล/ชื่อบริษัท</Label>
                  <Input
                    id="companyName"
                    value={company_name}
                    readOnly
                    className="bg-gray-100 cursor-text focus-visible:ring-0"
                  />
                </div>

                <div>
                  <Label htmlFor="companyAddress">ที่อยู่</Label>
                  <Textarea
                    id="companyAddress"
                    value={company_address}
                    readOnly
                    className="bg-gray-100 cursor-text focus-visible:ring-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* ผู้กระทำแทน Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4">ข้อมูลผู้กระทำแทน</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="representativeTaxId">
                    เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)
                  </Label>
                  <Input
                    id="representativeTaxId"
                    value={representativeTaxId}
                    onChange={(e) => setRepresentativeTaxId(e.target.value)}
                    maxLength={13}
                    placeholder="0-0000-00000-00-0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="representativeName">
                    ชื่อ-สกุล/ชื่อบริษัท
                  </Label>
                  <Input
                    id="representativeName"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="representativeAddress">ที่อยู่</Label>
                  <Textarea
                    id="representativeAddress"
                    value={representativeAddress}
                    onChange={(e) => setRepresentativeAddress(e.target.value)}
                    rows={2}
                    placeholder="ที่อยู่ผู้รับเงิน"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipient Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2>ข้อมูลผู้ถูกหักภาษี</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenCustomer(true)}
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  เลือกจากลูกค้าในระบบ
                </Button>
              </div>

              {selectedCustomer && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">
                        {selectedCustomer.name}
                      </p>
                      <p className="text-sm text-blue-600">
                        รหัส: {selectedCustomer.code}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setRecipientName("");
                      setRecipientTaxId("");
                      setRecipientAddress("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipientTaxId">
                      เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)
                    </Label>
                    <Input
                      id="recipientTaxId"
                      value={recipientTaxId}
                      onChange={(e) => setRecipientTaxId(e.target.value)}
                      maxLength={13}
                      placeholder="0-0000-00000-00-0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientName">ชื่อ-สกุล/ชื่อบริษัท</Label>
                    <Input
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recipientAddress">ที่อยู่</Label>
                  <Textarea
                    id="recipientAddress"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    rows={2}
                    placeholder="ที่อยู่ผู้รับเงิน"
                  />
                </div>

                {/* Recipient Type */}
                <div>
                  <Label className="mb-3 block">ประเภทผู้รับเงิน</Label>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-individual"
                        checked={recipientType === "individual"}
                        onCheckedChange={(checked) => {
                          if (checked) setRecipientType("individual");
                        }}
                      />
                      <label
                        htmlFor="type-individual"
                        className="text-sm cursor-pointer"
                      >
                        บุคคลธรรมดา
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-juristic"
                        checked={recipientType === "juristic"}
                        onCheckedChange={(checked) => {
                          if (checked) setRecipientType("juristic");
                        }}
                      />
                      <label
                        htmlFor="type-juristic"
                        className="text-sm cursor-pointer"
                      >
                        นิติบุคคล
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-partnership"
                        checked={recipientType === "partnership"}
                        onCheckedChange={(checked) => {
                          if (checked) setRecipientType("partnership");
                        }}
                      />
                      <label
                        htmlFor="type-partnership"
                        className="text-sm cursor-pointer"
                      >
                        ห้างหุ้นส่วน/คณะบุคคล
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-other"
                        checked={recipientType === "other"}
                        onCheckedChange={(checked) => {
                          if (checked) setRecipientType("other");
                        }}
                      />
                      <label
                        htmlFor="type-other"
                        className="text-sm cursor-pointer"
                      >
                        อื่นๆ
                      </label>
                    </div>
                  </div>
                </div>

                {/* Company Type (if juristic) */}
                {recipientType === "juristic" && (
                  <div>
                    <Label className="mb-3 block">ประเภทบริษัท</Label>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="company-1"
                          checked={companyType === "1"}
                          onCheckedChange={(checked) => {
                            if (checked) setCompanyType("1");
                          }}
                        />
                        <label
                          htmlFor="company-1"
                          className="text-sm cursor-pointer"
                        >
                          1. บุคคลธรรมดา
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="company-2"
                          checked={companyType === "2"}
                          onCheckedChange={(checked) => {
                            if (checked) setCompanyType("2");
                          }}
                        />
                        <label
                          htmlFor="company-2"
                          className="text-sm cursor-pointer"
                        >
                          2. บริษัทจำกัด
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="company-3"
                          checked={companyType === "3"}
                          onCheckedChange={(checked) => {
                            if (checked) setCompanyType("3");
                          }}
                        />
                        <label
                          htmlFor="company-3"
                          className="text-sm cursor-pointer"
                        >
                          3. ห้างหุ้นส่วนสามัญ
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="company-4"
                          checked={companyType === "4"}
                          onCheckedChange={(checked) => {
                            if (checked) setCompanyType("4");
                          }}
                        />
                        <label
                          htmlFor="company-4"
                          className="text-sm cursor-pointer"
                        >
                          4. ห้างหุ้นส่วนจำกัด
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="company-5"
                          checked={companyType === "5"}
                          onCheckedChange={(checked) => {
                            if (checked) setCompanyType("5");
                          }}
                        />
                        <label
                          htmlFor="company-5"
                          className="text-sm cursor-pointer"
                        >
                          5. กิจการร่วมค้า
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="company-other"
                          checked={companyType === "other"}
                          onCheckedChange={(checked) => {
                            if (checked) setCompanyType("other");
                          }}
                        />
                        <label
                          htmlFor="company-other"
                          className="text-sm cursor-pointer"
                        >
                          อื่นๆ
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deduction Format */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <Label htmlFor="deductionOrder">ลำดับที่</Label>
                <Input
                  id="deductionOrder"
                  value={deductionOrder}
                  onChange={(e) => setDeductionOrder(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="font-medium">รูปแบบการหัก</div>

                {/* แสดงเป็นรายการเรียงลง พร้อมระยะห่างเหมือนบล็อกบน */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deductionFormat"
                      value="1"
                      checked={deductionFormat === "1"}
                      onChange={(e) =>
                        setDeductionFormat(e.target.value as any)
                      }
                    />
                    <span>(1) ภ.ง.ด.1ก.</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deductionFormat"
                      value="2"
                      checked={deductionFormat === "2"}
                      onChange={(e) =>
                        setDeductionFormat(e.target.value as any)
                      }
                    />
                    <span>(2) ภ.ง.ด.1ก. พิเศษ</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deductionFormat"
                      value="3"
                      checked={deductionFormat === "3"}
                      onChange={(e) =>
                        setDeductionFormat(e.target.value as any)
                      }
                    />
                    <span>(3) ภ.ง.ด.2</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deductionFormat"
                      value="4"
                      checked={deductionFormat === "4"}
                      onChange={(e) =>
                        setDeductionFormat(e.target.value as any)
                      }
                    />
                    <span>(4) ภ.ง.ด.3</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deductionFormat"
                      value="5"
                      checked={deductionFormat === "5"}
                      onChange={(e) =>
                        setDeductionFormat(e.target.value as any)
                      }
                    />
                    <span>(5) ภ.ง.ด.2ก.</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deductionFormat"
                      value="6"
                      checked={deductionFormat === "6"}
                      onChange={(e) =>
                        setDeductionFormat(e.target.value as any)
                      }
                    />
                    <span>(6) ภ.ง.ด.3ก.</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deductionFormat"
                      value="7"
                      checked={deductionFormat === "7"}
                      onChange={(e) =>
                        setDeductionFormat(e.target.value as any)
                      }
                    />
                    <span>(7) ภ.ง.ด.53</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Income Types Reference */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4">
                ประเภทเงินได้พึงประเมินที่จ่าย
                (ประกอบการสร้างหนังสือรับรองการหักภาษี)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomeTypes.map((type) => (
                  <div
                    key={type.code}
                    className="border rounded-lg p-3 bg-gray-50 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <Badge
                          variant="outline"
                          className="font-mono bg-blue-100 text-blue-700 border-blue-300"
                        >
                          {type.code.trim()}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {type.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          อัตราภาษีเริ่มต้น: {type.defaultRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Income Items */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2>รายการเงินได้ที่จ่าย</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มรายการ
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500 mb-4">ไม่มีรายการ</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddItem}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มรายการ
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm">รายการที่ {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label>ประเภทเงินได้</Label>
                          <Select
                            value={item.type}
                            onValueChange={(value) =>
                              handleUpdateItem(item.id, "type", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {incomeTypes.map((type) => (
                                <SelectItem key={type.code} value={type.code}>
                                  {type.code} - {type.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>วันเดือนปีที่จ่าย</Label>
                          <Input
                            type="date"
                            value={item.date}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "date", e.target.value)
                            }
                          />
                        </div>

                        <div>
                          <Label>อัตราภาษี (%)</Label>
                          <Input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "taxRate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <Label>จำนวนเงินที่จ่าย (บาท)</Label>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "amount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <Label>ภาษีที่หักไว้ (บาท)</Label>
                          <Input
                            type="number"
                            value={item.taxAmount.toFixed(2)}
                            readOnly
                            className="bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="font-medium">รูปแบบการหัก</div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deduction"
                      value="wht"
                      checked={deductionMode === "wht"}
                      onChange={(e) => setDeductionMode(e.target.value as any)}
                    />
                    <span>หักภาษี ณ ที่จ่าย</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deduction"
                      value="always"
                      checked={deductionMode === "always"}
                      onChange={(e) => setDeductionMode(e.target.value as any)}
                    />
                    <span>ออกภาษีให้ตลอดไป</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deduction"
                      value="once"
                      checked={deductionMode === "once"}
                      onChange={(e) => setDeductionMode(e.target.value as any)}
                    />
                    <span>ออกภาษีให้ครั้งเดียว</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deduction"
                      value="other"
                      checked={deductionMode === "other"}
                      onChange={(e) => setDeductionMode(e.target.value as any)}
                    />
                    <span>อื่นๆ</span>

                    {deductionMode === "other" && (
                      <input
                        className="ml-2 flex-1 border-0 border-b border-dotted outline-none"
                        placeholder="ระบุ"
                        value={deductionOther}
                        onChange={(e) => setDeductionOther(e.target.value)}
                      />
                    )}
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4">เงื่อนไขและข้อตกลง</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">หมายเหตุ</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          รวมจำนวนเงินที่จ่าย
                        </span>
                        <span>
                          {subtotal.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          บาท
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>ภาษีหัก ณ ที่จ่าย</span>
                        <span>
                          {totalTax.toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          บาท
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-3">
                        <span>รวมสุทธิ</span>
                        <span>
                          {(subtotal - totalTax).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          บาท
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Customer Selection Dialog */}
      <Dialog open={openCustomer} onOpenChange={setOpenCustomer}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  เลือกลูกค้า/หน่วยงาน
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  เลือกลูกค้าหรือหน่วยงานเพื่อกรอกข้อมูลผู้รับเงินอัตโนมัติ
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="ค้นหาด้วยรหัสหรือชื่อลูกค้า..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base border-2 focus:border-blue-500"
              />
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto border-2 rounded-lg bg-gray-50">
              {customers.filter(
                (c: Customer) =>
                  c.name
                    .toLowerCase()
                    .includes(customerSearchTerm.toLowerCase()) ||
                  c.code
                    .toLowerCase()
                    .includes(customerSearchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                  <Search className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-lg">ไม่พบข้อมูลลูกค้า</p>
                  <p className="text-sm">ลองค้นหาด้วยคำอื่น</p>
                </div>
              ) : (
                <div className="grid gap-2 p-2">
                  {customers
                    .filter(
                      (c: Customer) =>
                        c.name
                          .toLowerCase()
                          .includes(customerSearchTerm.toLowerCase()) ||
                        c.code
                          .toLowerCase()
                          .includes(customerSearchTerm.toLowerCase())
                    )
                    .map((customer: Customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="group bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-lg hover:scale-[1.02]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-300"
                              >
                                {customer.code}
                              </Badge>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {customer.name}
                              </h3>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {customer.type}
                                </Badge>
                              </div>

                              {customer.phone && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400">📞</span>
                                  <span>{customer.phone}</span>
                                </div>
                              )}

                              {customer.tax_id && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400">🆔</span>
                                  <span>{customer.tax_id}</span>
                                </div>
                              )}
                            </div>

                            {customer.address && (
                              <div className="text-sm text-gray-500 line-clamp-1">
                                <span className="text-gray-400">📍</span>{" "}
                                {customer.address}
                              </div>
                            )}
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCustomer(customer);
                            }}
                          >
                            เลือก
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between px-2 py-2 bg-blue-50 rounded-lg text-sm">
              <span className="text-gray-600">
                พบ{" "}
                {
                  customers.filter(
                    (c: Customer) =>
                      c.name
                        .toLowerCase()
                        .includes(customerSearchTerm.toLowerCase()) ||
                      c.code
                        .toLowerCase()
                        .includes(customerSearchTerm.toLowerCase())
                  ).length
                }{" "}
                รายการ
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenCustomer(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ปิด
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
