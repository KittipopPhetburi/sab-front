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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Plus, Trash2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { customerService } from "../services/customerService";
import type { Customer } from "../services/customerService";
import { productService } from "../services/productService";
import type { Product } from "../services/productService";
import { toast } from "sonner";

interface InvoiceItem {
  id: string;
  productId?: number;
  description: string;
  qty?: number;
  unit?: string;
  price?: number;
  amount: number;
}

interface TaxInvoiceFormProps {
  documentType: "invoice" | "receipt" | "quotation" | "purchase_order";
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  editData?: Record<string, unknown>;
}

// เอกสารต้นฉบับที่สามารถเลือกได้
const sourceDocuments = [
  {
    id: "1",
    code: "QT250001",
    name: "ใบเสนอราคา - บริษัท ABC จำกัด",
    customer: "บริษัท ABC จำกัด",
  },
  {
    id: "2",
    code: "PO250002",
    name: "ใบสั่งซื้อ - บริษัท XYZ จำกัด",
    customer: "บริษัท XYZ จำกัด",
  },
  {
    id: "3",
    code: "INV250010",
    name: "ใบแจ้งหนี้ - ร้าน DEF การค้า",
    customer: "ร้าน DEF การค้า",
  },
];

export default function TaxInvoiceForm({
  documentType,
  onSave,
  onCancel,
  editData,
}: TaxInvoiceFormProps) {
  const today = new Date().toISOString().split("T")[0];

  // สร้างเลขเอกสาร (format helper)
  type DocNumberFormat = "plain" | "braces" | "dash";

  // Generate a document number using prefix + year + 4-digit sequence
  // format: 'plain' => INV20250001
  //         'braces' => INV{2025}{0001}
  //         'dash' => INV-2025-0001
  const generateDocNumber = (
    prefix: string,
    lastDocNumber = 0,
    format: DocNumberFormat = "plain"
  ) => {
    const currentYear = new Date().getFullYear().toString(); // ปีปัจจุบัน เช่น 2025
    const seq = (lastDocNumber + 1).toString().padStart(4, "0");

    if (format === "braces") return `${prefix}{${currentYear}}{${seq}}`;
    if (format === "dash") return `${prefix}-${currentYear}-${seq}`;
    return `${prefix}${currentYear}${seq}`;
  };

  const [docNumber, setDocNumber] = useState(() => {
    if (editData) {
      return (
        (editData.invoice_no as string) ||
        (editData.quotation_number as string) ||
        (editData.po_number as string) ||
        (editData.receipt_no as string) ||
        ""
      );
    }
    let prefix = "INV";
    if (documentType === "invoice") prefix = "INV";
    else if (documentType === "quotation") prefix = "QT";
    else if (documentType === "purchase_order") prefix = "PO";
    else if (documentType === "receipt") prefix = "REC";
    else prefix = "PV";
    return generateDocNumber(prefix);
  });
  const [docDate, setDocDate] = useState(today);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedDocument, setSelectedDocument] = useState("");
  const [openCustomer, setOpenCustomer] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState(
    "1. การชำระเงินภายในเวลาที่กำหนด 7 วัน ตั้งแต่วันที่ได้รับสินค้า\n2. การส่งมอบสินค้าต้องเป็นไปตามเงื่อนไขที่ระบุไว้ในใบสั่งซื้อนี้เท่านั้น คลาง POSTER ONLY การขนส่ง\n3. ค่าบริการจัดส่งคิดตามระยะทางจริงรวมภาษีมูลค่าเพิ่ม"
  );
  const [discount, setDiscount] = useState(0);
  const [vatRate, setVatRate] = useState(7);

  // ประเภทเอกสาร: ต้นฉบับ หรือ สำเนา
  const [docCopyType, setDocCopyType] = useState<"original" | "copy">(
    "original"
  );

  // ข้อมูลการจัดส่ง
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");

  // พนักงานขาย
  const [salesperson, setSalesperson] = useState("");
  const [customerBranchName, setCustomerBranchName] = useState("");

  // วันที่ชำระเงิน
  const [paymentDate, setPaymentDate] = useState(today);

  // การคิดภาษี
  const [taxType, setTaxType] = useState<"excluding" | "including" | "none">(
    "excluding"
  );

  // โหลดข้อมูลลูกค้า สินค้า และเลขเอกสารถัดไปจากฐานข้อมูล
  useEffect(() => {
    // ถ้ามีการแก้ไข ไม่ต้องดึงเลขใหม่
    if (editData) return;

    let mounted = true;
    const fetchNextDocNumber = async () => {
      try {
        // กำหนด API URL และ prefix ตาม documentType
        let apiUrl = "";
        let prefix = "";

        if (documentType === "invoice") {
          apiUrl = "http://127.0.0.1:8000/api/invoices";
          prefix = "INV";
        } else if (documentType === "quotation") {
          apiUrl = "http://127.0.0.1:8000/api/quotations";
          prefix = "QT";
        } else if (documentType === "purchase_order") {
          apiUrl = "http://127.0.0.1:8000/api/purchase-orders";
          prefix = "PO";
        } else if (documentType === "receipt") {
          apiUrl = "http://127.0.0.1:8000/api/receipts";
          prefix = "REC";
        }

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch");

        const allDocuments = await response.json();
        const year = new Date().getFullYear().toString();

        // รูปแบบเลขเอกสาร: PREFIX{year}{4-digit}
        const regex = new RegExp(`^${prefix}${year}(\\d{4})$`);
        let maxSeq = 0;

        const dataArray = Array.isArray(allDocuments)
          ? allDocuments
          : allDocuments.data || [];

        dataArray.forEach((doc: Record<string, unknown>) => {
          // ตรวจสอบตามฟิลด์ เลขที่เอกสารต่างๆ
          const docNum =
            doc.invoice_no ||
            doc.quotation_number ||
            doc.po_number ||
            doc.receipt_no;
          if (typeof docNum === "string") {
            const m = docNum.match(regex);
            if (m) {
              const num = parseInt(m[1], 10);
              if (!isNaN(num) && num > maxSeq) maxSeq = num;
            }
          }
        });

        if (mounted) {
          const nextNumber = generateDocNumber(prefix, maxSeq); // default 'plain' format
          setDocNumber(nextNumber);
        }
      } catch (error) {
        console.error("Error fetching document number:", error);
        if (mounted) {
          let prefix = "TINV";
          if (documentType === "quotation") prefix = "QT";
          else if (documentType === "purchase_order") prefix = "PO";
          else if (documentType === "receipt") prefix = "REC";
          setDocNumber(generateDocNumber(prefix, 0));
        }
      }
    };

    fetchNextDocNumber();
    return () => {
      mounted = false;
    };
  }, [documentType, editData]);

  // อัปเดตเลขเอกสารตามประเภท (ต้นฉบับ/สำเนา)
  // หากกำลังแก้ไขข้อมูล (editData) ให้เก็บเลขเดิมไว้ ไม่เปลี่ยนอัตโนมัติ
  useEffect(() => {
    if (editData) return;
    if (docCopyType === "copy") {
      // สำเนา: เพิ่ม -1 ต่อท้าย
      setDocNumber((prev) => {
        if (prev.endsWith("-1")) return prev; // ถ้ามี -1 แล้ว ไม่ต้องเพิ่ม
        return `${prev}-1`;
      });
    } else {
      // ต้นฉบับ: ลบ -1 ถ้ามี
      setDocNumber((prev) => prev.replace(/-1$/, ""));
    }
  }, [docCopyType]);

  // โหลดข้อมูลลูกค้าและสินค้า
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerList, productList] = await Promise.all([
          customerService.getActiveCustomers(),
          productService.getAll(),
        ]);
        setCustomers(customerList);
        setProducts(productList);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      }
    };
    loadData();
  }, []);

  // โหลดข้อมูลจาก editData เมื่อมีการแก้ไข
  useEffect(() => {
    if (editData && customers.length > 0) {
      // หาลูกค้าจาก customer_code, supplier_code หรือชื่อ (เพื่อรองรับ receipt)
      const customerCode =
        (editData.customer_code as string) ||
        (editData.supplier_code as string);
      const customerName =
        (editData.customer_name as string) || (editData.customer as string);
      const customer = customers.find(
        (c) =>
          c.code === customerCode || (customerName && c.name === customerName)
      );
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerBranchName(customer.branch_name || "");
      } else if (customerName) {
        // สร้าง fallback customer object แบบปลอม (cast เพื่อผ่าน type)
        const fakeCustomer = {
          id: -1,
          code: "",
          name: String(customerName),
          type: "" as any,
          branch_name: "",
          tax_id: (editData as any).customer_tax_id || "",
          contact_person: "",
          phone: (editData as any).customer_phone || "",
          email: (editData as any).customer_email || "",
          address: (editData as any).customer_address || "",
          note: "",
          account_name: "",
          bank_account: "",
          bank_name: "",
          status: "active" as any,
          created_at: "",
          updated_at: "",
        } as unknown as Customer;
        setSelectedCustomer(fakeCustomer as any);
        setCustomerBranchName(fakeCustomer.branch_name || "");
      }

      // โหลดข้อมูลอื่นๆ
      if (editData.shipping_address)
        setShippingAddress(editData.shipping_address as string);
      if (editData.shipping_phone)
        setShippingPhone(editData.shipping_phone as string);
      if (editData.notes) setNotes(editData.notes as string);
      if (editData.discount !== undefined)
        setDiscount(editData.discount as number);
      if (editData.vat_rate !== undefined)
        setVatRate(editData.vat_rate as number);
      const refDoc =
        (editData.reference_doc as string) ||
        (editData.invoice_ref as string) ||
        (editData.reference_doc as string);
      if (refDoc) setSelectedDocument(refDoc);
      if ((editData as any).seller_name)
        setSalesperson((editData as any).seller_name as string); // โหลดชื่อผู้ขาย
      if ((editData as any).salesperson)
        setSalesperson((editData as any).salesperson as string); // รองรับอีกชื่อฟิลด์
      if (editData.doc_type)
        setDocCopyType(editData.doc_type as "original" | "copy"); // โหลดประเภทเอกสาร

      // โหลด items
      if (editData.items) {
        try {
          const parsedItems =
            typeof editData.items === "string"
              ? JSON.parse(editData.items)
              : editData.items;
          setItems(parsedItems);
        } catch (error) {
          console.error("Error parsing items:", error);
        }
      }
      // สำหรับใบเสร็จ: เรียกใช้ editData.amount เพื่อเติมรายการให้แสดงยอด
      if (
        documentType === "receipt" &&
        (editData as any).amount !== undefined
      ) {
        setItems([
          {
            id: Date.now().toString(),
            description:
              (editData as any).description ||
              (editData as any).invoice_ref ||
              "",
            amount: Number((editData as any).amount) || 0,
          },
        ]);
      }
    }
  }, [editData, customers]);

  // โหลด fields ที่ไม่ขึ้นกับลูกค้า เช่น วันที่ เอกสาร และวันที่ชำระเงิน
  useEffect(() => {
    if (!editData) return;

    // เลขที่เอกสาร: ถ้ามี ให้ใช้ค่าเดิม (guarded earlier too)
    const existingDocNumber =
      (editData as any).invoice_no ||
      (editData as any).quotation_number ||
      (editData as any).po_number ||
      (editData as any).receipt_no;
    if (existingDocNumber) setDocNumber(String(existingDocNumber));

    // วันที่เอกสาร
    const existingDate =
      (editData as any).invoice_date ||
      (editData as any).date ||
      (editData as any).receipt_date;
    if (existingDate) setDocDate(String(existingDate).split("T")[0]);

    // วันที่ชำระเงิน / due date
    const existingPayment =
      (editData as any).payment_date || (editData as any).due_date;
    if (existingPayment) setPaymentDate(String(existingPayment).split("T")[0]);

    // VAT / และการคิดภาษี ถ้ามี
    if ((editData as any).vat_rate !== undefined)
      setVatRate(Number((editData as any).vat_rate));

    // โหลด items จาก editData (อาจเป็น string JSON หรือ array)
    if ((editData as any).items) {
      try {
        let parsedItems: InvoiceItem[] = [];
        const itemsData = (editData as any).items;
        
        if (typeof itemsData === 'string') {
          // Parse JSON string
          parsedItems = JSON.parse(itemsData);
        } else if (Array.isArray(itemsData)) {
          // Already an array
          parsedItems = itemsData;
        }
        
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          setItems(parsedItems);
        }
      } catch (error) {
        console.error("Failed to parse items from editData:", error);
      }
    }

    // โหลดส่วนลดถ้ามี
    if ((editData as any).discount !== undefined) {
      setDiscount(Number((editData as any).discount));
    }

    // หากลูกค้าไม่พบในรายการ (เช่น ข้อมูลใบเสร็จเก่า) ให้ตั้งค่า fallback customer โดยไม่ทำให้ type ผิด
    if (!customers?.length) return;
    // หากมีค่า customer (เป็นชื่อ) ให้ค้นหา customer ที่มีชื่อนั้น
    const customerName =
      (editData as any).customer || (editData as any).customer_name;
    if (customerName && customers.length > 0) {
      const found = customers.find(
        (c) =>
          c.name === customerName || c.code === (editData as any).customer_code
      );
      if (found) {
        setSelectedCustomer(found);
      } else if (customerName) {
        // สร้าง fallback customer object แบบปลอม (cast เพื่อผ่าน type)
        const fakeCustomer = {
          id: -1,
          code: "",
          name: String(customerName),
          type: "" as any,
          branch_name: "",
          tax_id: (editData as any).customer_tax_id || "",
          contact_person: "",
          phone: (editData as any).customer_phone || "",
          email: (editData as any).customer_email || "",
          address: (editData as any).customer_address || "",
          note: "",
          account_name: "",
          bank_account: "",
          bank_name: "",
          status: "active" as any,
          created_at: "",
          updated_at: "",
        } as unknown as Customer;
        setSelectedCustomer(fakeCustomer as any);
      }
    }
  }, [editData, customers]);

  const getDocumentTitle = () => {
    if (documentType === "invoice") return "ใบแจ้งหนี้/ใบกำกับภาษี";
    if (documentType === "quotation") return "ใบเสนอราคา";
    if (documentType === "purchase_order") return "ใบสั่งซื้อ";
    return "ใบเสร็จรับเงิน/ใบกำกับภาษี";
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      qty: 1,
      unit: "",
      price: 0,
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
            qty: item.qty || 1,
            unit: product.unit || item.unit || "",
            price: Number(product.sale_price) || 0,
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

  const handleUpdateItem = (
    id: string,
    field: "description" | "amount" | "qty" | "unit" | "price",
    value: string | number
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Auto-calculate amount when qty or price changes
          if (field === "qty" || field === "price") {
            const qty = field === "qty" ? Number(value) : (item.qty || 1);
            const price = field === "price" ? Number(value) : (item.price || 0);
            updatedItem.amount = qty * price;
          }
          return updatedItem;
        }
        return item;
      })
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
      toast.error("กรุณาเลือกลูกค้า");
      return;
    }

    // สำหรับใบเสร็จ ไม่จำเป็นต้องมีรายการ
    if (documentType !== "receipt" && items.length === 0) {
      toast.error("กรุณาเพิ่มรายการสินค้า");
      return;
    }

    // เลือก API endpoint ตาม documentType
    let apiUrl: string = "";
    if (documentType === "invoice") {
      apiUrl = "http://127.0.0.1:8000/api/invoices";
    } else if (documentType === "quotation") {
      apiUrl = "http://127.0.0.1:8000/api/quotations";
    } else if (documentType === "purchase_order") {
      apiUrl = "http://127.0.0.1:8000/api/purchase-orders";
    } else if (documentType === "receipt") {
      apiUrl = "http://127.0.0.1:8000/api/receipts";
    }

    // สร้าง payload ตาม API ที่จะเรียก
    let payload;
    if (documentType === "invoice") {
      // payload สำหรับ invoices API
      payload = {
        invoice_no: docNumber,
        invoice_date: docDate,
        customer_code: selectedCustomer.code,
        customer_name: selectedCustomer.name,
        customer_address: selectedCustomer.address,
        customer_tax_id: selectedCustomer.tax_id,
        customer_branch_name:
          customerBranchName || selectedCustomer.branch_name,
        customer_phone: selectedCustomer.phone,
        customer_email: selectedCustomer.email,
        reference_doc: selectedDocument,
        shipping_address: shippingAddress,
        shipping_phone: shippingPhone,
        seller_name: salesperson,
        salesperson: salesperson,

        items: JSON.stringify(items), // แปลงเป็น JSON string
        notes,
        discount,
        vat_rate: vatRate,
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscountAmount(),
        after_discount: calculateAfterDiscount(),
        vat: calculateVat(),
        grand_total: calculateGrandTotal(),
        status: "draft",
        due_date: null,
        doc_type: docCopyType, // เพิ่มประเภทเอกสาร (original/copy)
      };
    } else if (documentType === "quotation") {
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
        seller_name: salesperson,
        salesperson: salesperson,
        branch_name: selectedCustomer.branch_name,
        customer_branch_name:
          customerBranchName || selectedCustomer.branch_name,
        items: JSON.stringify(items), // แปลงเป็น JSON string
        notes,
        discount,
        vat_rate: vatRate,
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscountAmount(),
        after_discount: calculateAfterDiscount(),
        vat: calculateVat(),
        grand_total: calculateGrandTotal(),
        status: "ร่าง",
        valid_until: null,
        doc_type: docCopyType, // เพิ่มประเภทเอกสาร (original/copy)
      };
    } else if (documentType === "purchase_order") {
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
        supplier_branch_name:
          customerBranchName || selectedCustomer.branch_name,
        reference_doc: selectedDocument,
        shipping_address: shippingAddress,
        shipping_phone: shippingPhone,
        buyer_name: salesperson,
        items: JSON.stringify(items), // แปลงเป็น JSON string
        notes,
        discount,
        vat_rate: vatRate,
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscountAmount(),
        after_discount: calculateAfterDiscount(),
        vat: calculateVat(),
        grand_total: calculateGrandTotal(),
        status: "ร่าง",
        expected_delivery_date: null,
        doc_type: docCopyType, // เพิ่มประเภทเอกสาร (original/copy)
      };
    } else if (documentType === "receipt") {
      // ✅ payload สำหรับ receipts API ให้โครงเหมือน quotation
      payload = {
        // ต่างจาก quotation แค่ชื่อเลขที่เอกสาร
        receipt_no: docNumber,
        date: docDate,

        // ข้อมูลลูกค้า (backend expects 'customer' not 'customer_name')
        customer: selectedCustomer.name, // ✅ Fixed: use 'customer' field
        customer_code: selectedCustomer.code,
        customer_address: selectedCustomer.address,
        customer_tax_id: selectedCustomer.tax_id,
        customer_phone: selectedCustomer.phone,
        customer_email: selectedCustomer.email,

        // เอกสารอ้างอิง / การจัดส่ง / ผู้ขาย (เหมือน quotation)
        invoice_ref: selectedDocument, // ✅ Fixed: use 'invoice_ref' not 'reference_doc'
        shipping_address: shippingAddress,
        shipping_phone: shippingPhone,
        seller_name: salesperson,
        salesperson: salesperson,
        branch_name: selectedCustomer.branch_name,
        customer_branch_name:
          customerBranchName || selectedCustomer.branch_name,

        // รายการ + ยอดคำนวณ (เหมือน quotation)
        items: JSON.stringify(items),
        notes,
        discount,
        vat_rate: vatRate,
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscountAmount(),
        after_discount: calculateAfterDiscount(),
        vat: calculateVat(),
        grand_total: calculateGrandTotal(),

        // ถ้า table receipts มี field amount อยู่แล้ว ก็ให้เก็บยอดรวมซ้ำอีกช่อง
        amount: calculateGrandTotal(),

        status: "ร่าง",
        // ถ้าใบเสร็จไม่มี valid_until ก็ไม่ต้องใส่
        doc_type: docCopyType,
      };
    } else {
      // กันกรณีหลุด type เฉย ๆ
      payload = {};
    }

    try {
      console.log("=== TaxInvoiceForm Save Debug ===");
      console.log("Sending to API:", apiUrl);
      console.log("Document Type:", documentType);
      console.log("Selected Customer:", selectedCustomer);
      console.log("Payload:", payload);

      // If editData exists, call update endpoint (PUT) instead of POST to create
      const isEditing = !!editData;
      const endpoint = isEditing ? `${apiUrl}/${(editData as any).id}` : apiUrl;
      console.log("Endpoint:", endpoint);
      console.log("Method:", isEditing ? "PUT" : "POST");

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // ตรวจสอบว่า response เป็น JSON หรือไม่
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Response is not JSON:", text.substring(0, 200));
        toast.error("เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาตรวจสอบ console");
        return;
      }

      const result = await response.json();
      console.log("Response data:", result);

      if (response.ok) {
        let docTypeName = "ใบเสร็จรับเงิน";
        if (documentType === "invoice") docTypeName = "ใบแจ้งหนี้";
        else if (documentType === "quotation") docTypeName = "ใบเสนอราคา";
        toast.success(`บันทึก${docTypeName}สำเร็จ`);
        onSave(payload);
      } else {
        console.error("API Error:", result);
        if (result.errors) {
          // Laravel validation errors
          const errorMessages = Object.values(result.errors).flat().join(", ");
          toast.error("ข้อผิดพลาด: " + errorMessages);
        } else {
          toast.error(
            "เกิดข้อผิดพลาด: " + (result.message || "ไม่สามารถบันทึกได้")
          );
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: " + error);
    }
  };

  const activeCustomers = customers.filter(
    (c: Customer) => c.status === "active"
  );

  // Apply grayscale when docCopyType is 'copy' - but NOT on images
  // Using CSS class instead of inline style so we can exempt images
  const containerClass = docCopyType === "copy" ? "copy-grayscale" : "";

  return (
    <div className={`min-h-screen p-6 space-y-6 bg-gray-50 ${containerClass}`}>
      <style>{`
        .copy-grayscale {
          filter: grayscale(100%);
          -webkit-filter: grayscale(100%);
        }
        .copy-grayscale img {
          filter: none !important;
          -webkit-filter: none !important;
        }
      `}</style>
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
              <Input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ประเภทเอกสาร</Label>
              <Select
                value={docCopyType}
                onValueChange={(value: "original" | "copy") =>
                  setDocCopyType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">ต้นฉบับ</SelectItem>
                  <SelectItem value="copy">สำเนา</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>วันที่เริ่มต้น</Label>
              <Input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
              />
            </div>
          </div>

          {/* Source Document Selection */}
          <div className="space-y-2">
            <Label>เลือกเอกสาร</Label>
            <Select
              value={selectedDocument}
              onValueChange={setSelectedDocument}
            >
              <SelectTrigger className="w-full justify-between h-auto min-h-[40px]" showIcon={false}>
                <SelectValue placeholder="เลือกเอกสารต้นทาง..." />
              </SelectTrigger>
              <SelectContent className="w-[600px] popup-card text-popover-foreground overflow-visible p-2">
                {sourceDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id} showIndicator={false}>
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
                        <span className="text-blue-600">
                          {selectedCustomer.code}
                        </span>
                        <span>-</span>
                        <span>{selectedCustomer.name}</span>
                      </div>
                      {selectedCustomer.address && (
                        <div className="mt-1 text-sm text-gray-500">
                          {selectedCustomer.address}
                        </div>
                      )}
                    </div>
                  ) : (
                    "เลือกลูกค้า..."
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] popup-card text-popover-foreground overflow-visible p-2">
                <Command className="bg-transparent shadow-none rounded-none m-0 p-2">
                  <CommandInput placeholder="ค้นหาลูกค้า..." className="bg-transparent rounded-md border px-2" />
                  <CommandList>
                    <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                    <CommandGroup>
                      {activeCustomers.map((customer: Customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.code} ${customer.name}`}
                          onSelect={() => {
                            setSelectedCustomer(customer);
                            setShippingAddress(customer.address || "");
                            setShippingPhone(customer.phone || "");
                            setOpenCustomer(false);
                          }}
                          className="flex flex-col items-start py-3"
                        >
                          <div className="flex gap-2">
                            <span className="text-blue-600">
                              {customer.code}
                            </span>
                            <span>-</span>
                            <span>{customer.name}</span>
                          </div>
                          {customer.address && (
                            <div className="mt-1 text-sm text-gray-500">
                              {customer.address}
                            </div>
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
                <div>{selectedCustomer.type || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">เบอร์โทร</div>
                <div>{selectedCustomer.phone || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">
                  เลขประจำตัวผู้เสียภาษี
                </div>
                <div>{selectedCustomer.tax_id || "-"}</div>
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
                    <TableHead className="w-[80px] text-center">
                      ลำดับ (NO)
                    </TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead className="w-[100px] text-center">
                      จำนวน (Qty)
                    </TableHead>
                    <TableHead className="w-[100px] text-center">
                      หน่วย (Unit)
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      ราคา/หน่วย
                    </TableHead>
                    <TableHead className="w-[150px] text-right">
                      ราคารวม (จำนวนเงิน)
                    </TableHead>
                    <TableHead className="w-[100px] text-right">
                      รายการลบ (ใบสำคัญถอน)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-gray-400"
                      >
                        ไม่มีรายการ
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="space-y-2">
                          <Select
                            value={item.productId?.toString()}
                            onValueChange={(value) => {
                              const product = products.find(
                                (p) => p.id === parseInt(value)
                              );
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
                                <SelectItem
                                  key={product.id}
                                  value={product.id.toString()}
                                >
                                  {product.name} - ฿
                                  {Number(
                                    product.sale_price
                                  ).toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="หรือพิมพ์รายละเอียดเอง..."
                            className="border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.qty ?? 1}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "qty",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="text-center"
                            placeholder="1"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.unit || ""}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "unit",
                                e.target.value
                              )
                            }
                            className="text-center"
                            placeholder="หน่วย"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.price ?? 0}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="text-right"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
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
                            className="text-right"
                            placeholder="0.00"
                            readOnly
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
              <Input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>วันที่ชำระเงิน</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>การคิดภาษี</Label>
              <Select
                value={taxType}
                onValueChange={(value: "excluding" | "including" | "none") =>
                  setTaxType(value)
                }
              >
                <SelectTrigger className="w-full justify-between h-auto min-h-[40px]" showIcon={false}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[240px] popup-card text-popover-foreground overflow-visible p-2">
                  <SelectItem value="excluding" showIndicator={false}>Excluding Vat</SelectItem>
                  <SelectItem value="including" showIndicator={false}>Including Vat</SelectItem>
                  <SelectItem value="none" showIndicator={false}>None Vat</SelectItem>
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
                    onChange={(e) =>
                      setDiscount(parseFloat(e.target.value) || 0)
                    }
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
            <Button
              onClick={handleSave}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              บันทึก
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="text-red-500 border-red-500"
            >
              ยกเลิก
            </Button>
          </div>
        </CardContent >
      </Card >
    </div >
  );
}
