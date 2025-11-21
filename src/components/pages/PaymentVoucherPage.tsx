import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import type { UserRole } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import PaymentVoucherForm from "../PaymentVoucherForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Hourglass,
  Calendar,
  CheckCircle2,
  XCircle,
  Printer,
  ChevronDown,
  FileText,
  Clock,
} from "lucide-react";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Label } from "../ui/label";
import { toast } from "sonner";

interface PaymentVoucherPageProps {
  userRole: UserRole;
}

interface PaymentVoucher {
  id: string;
  voucher_no?: string;
  date: string;
  payee: string;
  description: string;
  amount: number;
  status: "รอจ่าย" | "รออนุมัติ" | "จ่ายแล้ว" | "ยกเลิก";
  paymentMethod?: string;
  withholdingTaxNo?: string;
  withholdingTaxAmount?: number;
  paymentDate?: string;
}

export default function PaymentVoucherPage({
  userRole,
}: PaymentVoucherPageProps) {
  const API_URL = "http://127.0.0.1:8000/api/payment-vouchers";
  const [data, setData] = useState<PaymentVoucher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PaymentVoucher | null>(null);

  const canEdit = userRole === "admin" || userRole === "account";
  const canDelete = userRole === "admin" || userRole === "account";

  // Calculate status counts
  const statusCounts = {
    รอจ่าย: data.filter((item) => item.status === "รอจ่าย").length,
    รออนุมัติ: data.filter((item) => item.status === "รออนุมัติ").length,
    จ่ายแล้ว: data.filter((item) => item.status === "จ่ายแล้ว").length,
    ยกเลิก: data.filter((item) => item.status === "ยกเลิก").length,
  };

  const handleEdit = (item: PaymentVoucher) => {
    if (!canEdit) {
      toast.error("คุณไม่มีสิทธิ์แก้ไขข้อมูล");
      return;
    }
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleView = (item: PaymentVoucher) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: PaymentVoucher) => {
    if (!canDelete) {
      toast.error("คุณไม่มีสิทธิ์ลบข้อมูล");
      return;
    }
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await axios.delete(`${API_URL}/${selectedItem.id}`);
      toast.success(
        `ลบใบสำคัญจ่าย ${selectedItem.voucher_no || selectedItem.id} สำเร็จ`
      );
      setIsDeleteDialogOpen(false);
      fetchVouchers();
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถลบข้อมูลได้");
    }
  };

  const handlePrint = (item: PaymentVoucher) => {
    toast.success(`กำลังพิมพ์ใบสำคัญจ่ายเงิน ${item.voucher_no || item.id}`);
    // สามารถเพิ่มการสร้าง PDF หรือเปิดหน้าพิมพ์ได้ที่นี่
    window.print();
  };

  const handleStatusChange = async (
    item: PaymentVoucher,
    newStatus: "รอจ่าย" | "รออนุมัติ" | "จ่ายแล้ว" | "ยกเลิก"
  ) => {
    if (!canEdit) {
      toast.error("คุณไม่มีสิทธิ์เปลี่ยนสถานะ");
      return;
    }

    try {
      // ใช้ API endpoint แยกสำหรับอัปเดทสถานะ
      await axios.patch(`${API_URL}/${item.id}/status`, { status: newStatus });

      // อัปเดต state
      setData(
        data.map((d) => (d.id === item.id ? { ...d, status: newStatus } : d))
      );
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
    } catch (error: any) {
      console.error("Error changing status:", error);
      toast.error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      รอจ่าย: "outline",
      รออนุมัติ: "secondary",
      จ่ายแล้ว: "default",
      ยกเลิก: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredData = data.filter(
    (item) =>
      (item.voucher_no || item.id)
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchVouchers = async () => {
    try {
      const res = await axios.get(API_URL);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถโหลดข้อมูลใบสำคัญจ่ายได้");
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-sky-400 to-sky-500 hover:shadow-lg"
          onClick={() => setFilterStatus("รอจ่าย")}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.รอจ่าย}</p>
                <p className="text-sm opacity-90">รอจ่าย</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <Hourglass className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-emerald-400 to-emerald-500 hover:shadow-lg"
          onClick={() => setFilterStatus("รออนุมัติ")}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.รออนุมัติ}</p>
                <p className="text-sm opacity-90">รออนุมัติ</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-cyan-400 to-cyan-500 hover:shadow-lg"
          onClick={() => setFilterStatus("จ่ายแล้ว")}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.จ่ายแล้ว}</p>
                <p className="text-sm opacity-90">จ่ายแล้ว</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="text-white transition-shadow cursor-pointer bg-gradient-to-br from-amber-400 to-amber-500 hover:shadow-lg"
          onClick={() => setFilterStatus("ยกเลิก")}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-3xl">{statusCounts.ยกเลิก}</p>
                <p className="text-sm opacity-90">ยกเลิก</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <XCircle className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการใบสำคัญจ่ายเงิน</CardTitle>
              {filterStatus !== "all" && (
                <p className="mt-1 text-sm text-gray-500">
                  กรองตาม: {filterStatus}{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => setFilterStatus("all")}
                  >
                    แสดงทั้งหมด
                  </Button>
                </p>
              )}
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบสำคัญจ่ายเงิน
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="     ค้นหาเลขที่เอกสาร, ผู้รับเงิน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่เอกสาร</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้รับเงิน</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>วิธีชำระ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.voucher_no || item.id}</TableCell>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell>{item.payee}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">
                    ฿{item.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{item.paymentMethod}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          disabled={!canEdit}
                        >
                          {getStatusBadge(item.status)}
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "รอจ่าย")}
                        >
                          <Hourglass className="w-4 h-4 mr-2" />
                          รอจ่าย
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "รออนุมัติ")}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          รออนุมัติ
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "จ่ายแล้ว")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          จ่ายแล้ว
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, "ยกเลิก")}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          ยกเลิก
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(item)}
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        disabled={!canEdit}
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(item)}
                        disabled={!canDelete}
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Form */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/50">
          <div className="w-full max-w-6xl my-8">
            <PaymentVoucherForm
              onSave={() => {
                setIsAddDialogOpen(false);
                fetchVouchers();
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Form */}
      {isEditDialogOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/50">
          <div className="w-full max-w-6xl my-8">
            <PaymentVoucherForm
              isEditMode={true}
              editData={selectedItem}
              onSave={() => {
                setIsEditDialogOpen(false);
                setSelectedItem(null);
                fetchVouchers();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedItem(null);
              }}
            />
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดใบสำคัญจ่ายเงิน</DialogTitle>
            <DialogDescription>
              เลขที่ {selectedItem?.voucher_no || selectedItem?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">เลขที่เอกสาร</Label>
                  <p className="mt-1">
                    {selectedItem.voucher_no || selectedItem.id}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">วันที่</Label>
                  <p className="mt-1">
                    {new Date(selectedItem.date).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ผู้รับเงิน</Label>
                <p className="mt-1">{selectedItem.payee}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">จำนวนเงิน</Label>
                  <p className="mt-1">
                    ฿{selectedItem.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">วิธีชำระเงิน</Label>
                  <p className="mt-1">{selectedItem.paymentMethod}</p>
                </div>
              </div>
              {(selectedItem.withholdingTaxNo ||
                selectedItem.withholdingTaxAmount) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">
                      เลขที่ใบหัก ณ ที่จ่าย
                    </Label>
                    <p className="mt-1">
                      {selectedItem.withholdingTaxNo || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">
                      ยอดเงินหัก ณ ที่จ่าย
                    </Label>
                    <p className="mt-1">
                      {selectedItem.withholdingTaxAmount
                        ? `฿${selectedItem.withholdingTaxAmount.toLocaleString()}`
                        : "-"}
                    </p>
                  </div>
                </div>
              )}
              {selectedItem.paymentDate && (
                <div>
                  <Label className="text-gray-500">วันที่จ่ายเงิน</Label>
                  <p className="mt-1">
                    {new Date(selectedItem.paymentDate).toLocaleDateString(
                      "th-TH"
                    )}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedItem.status)}
                </div>
              </div>
              <div>
                <Label className="text-gray-500">รายละเอียด</Label>
                <p className="mt-1">{selectedItem.description}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePrint(selectedItem)}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  พิมพ์
                </Button>
                <Button onClick={() => setIsViewDialogOpen(false)}>ปิด</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบใบสำคัญจ่ายเงิน{" "}
              {selectedItem?.voucher_no || selectedItem?.id}?
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
