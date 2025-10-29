// Mock data for Customers
export interface Customer {
  id: string;
  code: string;
  name: string;
  type: 'ลูกค้า' | 'คู่ค้า' | 'ทั้งคู่ค้าและลูกค้า';
  branchName?: string;
  taxId?: string;
  contactPerson?: string;
  contact: string;
  email: string;
  address?: string;
  status: 'active' | 'inactive';
}

// Mock data for Products
export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
}

export const mockCustomers: Customer[] = [
  {
    id: '1',
    code: 'CUST-001',
    name: 'บริษัท ABC จำกัด',
    type: 'ลูกค้า',
    branchName: 'สำนักงานใหญ่',
    taxId: '0105558123456',
    contactPerson: 'คุณสมชาย ใจดี',
    contact: '02-123-4567',
    email: 'contact@abc.com',
    address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    status: 'active',
  },
  {
    id: '2',
    code: 'SUPP-001',
    name: 'บริษัท XYZ จำกัด',
    type: 'คู่ค้า',
    branchName: 'สำนักงานใหญ่',
    taxId: '0105559234567',
    contactPerson: 'คุณสมหญิง รักดี',
    contact: '02-234-5678',
    email: 'info@xyz.com',
    address: '456 ถนนพระราม 4 กรุงเทพฯ 10330',
    status: 'active',
  },
  {
    id: '3',
    code: 'BOTH-001',
    name: 'ร้าน DEF การค้า',
    type: 'ทั้งคู่ค้าและลูกค้า',
    contactPerson: 'คุณสมศรี มีสุข',
    contact: '089-123-4567',
    email: 'def@gmail.com',
    address: '789 ถนนรัชดาภิเษก กรุงเทพฯ 10400',
    status: 'active',
  },
  {
    id: '4',
    code: 'CUST-002',
    name: 'หจก. เทคโนโลยี 2000',
    type: 'ลูกค้า',
    branchName: 'สำนักงานใหญ่',
    taxId: '0105560345678',
    contactPerson: 'คุณวิชัย สมบูรณ์',
    contact: '02-345-6789',
    email: 'info@tech2000.com',
    address: '111 ถนนเพชรบุรี กรุงเทพฯ 10400',
    status: 'active',
  },
  {
    id: '5',
    code: 'CUST-003',
    name: 'บริษัท สมาร์ท โซลูชั่น จำกัด',
    type: 'ลูกค้า',
    contactPerson: 'คุณสุดา เก่งการ',
    contact: '081-234-5678',
    email: 'contact@smartsolution.co.th',
    address: '222 ถนนพระราม 9 กรุงเทพฯ 10310',
    status: 'active',
  },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    code: 'PROD-001',
    name: 'คอมพิวเตอร์โน้ตบุ๊ค Dell Latitude 5420 Intel Core i5-1145G7 RAM 8GB SSD 256GB 14 นิ้ว FHD Windows 11 Pro พร้อมกระเป๋าและเมาส์',
    category: 'อุปกรณ์คอมพิวเตอร์',
    unit: 'เครื่อง',
    price: 25000,
    stock: 15,
  },
  {
    id: '2',
    code: 'PROD-002',
    name: 'เมาส์ไร้สาย Logitech M185 เซ็นเซอร์ออปติคอล 1000 DPI แบตเตอรี่ใช้งานได้ 12 เดือน รองรับ Windows และ Mac',
    category: 'อุปกรณ์คอมพิวเตอร์',
    unit: 'ชิ้น',
    price: 350,
    stock: 50,
  },
  {
    id: '3',
    code: 'PROD-003',
    name: 'คีย์บอร์ด Mechanical Keychron K2 Wireless Bluetooth 5.1 Hot-Swappable RGB Backlight Gateron Brown Switch 75% Layout for Mac and Windows',
    category: 'อุปกรณ์คอมพิวเตอร์',
    unit: 'ชิ้น',
    price: 3500,
    stock: 20,
  },
  {
    id: '4',
    code: 'PROD-004',
    name: 'จอคอมพิวเตอร์ LG 27 นิ้ว 4K UHD (3840x2160) IPS Panel HDR10 AMD FreeSync 60Hz HDMI DisplayPort ปรับความสูงได้',
    category: 'อุปกรณ์คอมพิวเตอร์',
    unit: 'เครื่อง',
    price: 12000,
    stock: 10,
  },
  {
    id: '5',
    code: 'PROD-005',
    name: 'เครื่องพิมพ์เลเซอร์ Brother HL-L2375DW ขาวดำ ความเร็ว 34 หน้า/นาที พิมพ์2หน้าอัตโนมัติ WiFi Network USB 250 แผ่น รับประกัน 3 ปี',
    category: 'อุปกรณ์สำนักงาน',
    unit: 'เครื่อง',
    price: 5500,
    stock: 8,
  },
  {
    id: '6',
    code: 'PROD-006',
    name: 'กระดาษถ่อยเอกสาร A4 80 แกรม ขนาด 210x297 มม. บรรจุ 500 แผ่น/รีม สีขาว ความขาว 102-104% มาตรฐาน ISO 9706',
    category: 'เครื่องเขียน',
    unit: 'รีม',
    price: 120,
    stock: 100,
  },
  {
    id: '7',
    code: 'PROD-007',
    name: 'ปากกาลูกลื่น หมึกน้ำมัน ขนาดหัว 0.7 มม. สีน้ำเงิน ด้ามพลาสติกโปร่งใส เขียนลื่น หมึกไหลสม่ำเสมอ ใช้งานทนทาน',
    category: 'เครื่องเขียน',
    unit: 'ด้าม',
    price: 10,
    stock: 500,
  },
  {
    id: '8',
    code: 'PROD-008',
    name: 'แฟ้มสันกว้าง 3 นิ้ว พลาสติก PVC คุณภาพดี มีช่องสอดบัตร ความจุ 600 แผ่น พร้อมที่หนีบกระดาษ คละสี',
    category: 'เครื่องเขียน',
    unit: 'เล่ม',
    price: 45,
    stock: 150,
  },
  {
    id: '9',
    code: 'SRV-001',
    name: 'บริการออกแบบและติดตั้งระบบเครือข่าย LAN/WLAN สำหรับองค์กร รวมอุปกรณ์ Switch Router Access Point สาย UTP และทดสอบระบบ รับประกัน 1 ปี',
    category: 'บริการ',
    unit: 'งาน',
    price: 15000,
    stock: 999,
  },
  {
    id: '10',
    code: 'SRV-002',
    name: 'บริการบำรุงรักษาและซ่อมแซมเครื่องคอมพิวเตอร์ รายเดือน ตรวจเช็คฮาร์ดแวร์ ล้างทำความสะอาด อัพเดทซอฟต์แวร์ สแกนไวรัส แก้ปัญหาเบื้องต้น',
    category: 'บริการ',
    unit: 'เดือน',
    price: 2500,
    stock: 999,
  },
  {
    id: '11',
    code: 'PROD-009',
    name: 'ชุดกล้องวงจรปิด IP Camera 4K Ultra HD 8MP POE กันน้ำ IP67 Night Vision 30m Motion Detection Cloud Storage Mobile App รองรับ Onvif พร้อมอุปกรณ์ติดตั้ง',
    category: 'อุปกรณ์รักษาความปลอดภัย',
    unit: 'ชุด',
    price: 8500,
    stock: 12,
  },
  {
    id: '12',
    code: 'PROD-010',
    name: 'เครื่องสำรองไฟ UPS 2000VA/1200W Offline มีจอ LCD แสดงสถานะ AVR ป้องกันไฟกระชาก 4 เต้าเสียบ แบตเตอรี่ใช้งาน 3-5 ปี พร้อมซอฟต์แวร์ควบคุม',
    category: 'อุปกรณ์ไฟฟ้า',
    unit: 'เครื่อง',
    price: 4500,
    stock: 18,
  },
];
