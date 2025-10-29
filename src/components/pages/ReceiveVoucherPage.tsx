import { useState, useEffect } from 'react';
import axios from 'axios';
import type { UserRole } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import ReceiveVoucherForm from '../ReceiveVoucherForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Edit, Trash2, Eye, Search, Hourglass, Calendar, CheckCircle2, XCircle, Printer, ChevronDown, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface ReceiveVoucherPageProps {
  userRole: UserRole;
}

interface ReceiveVoucher {
  id: number;
  voucher_no: string;
  date: string;
  payer: string;
  description?: string;
  amount: number;
  status: 'รอรับ' | 'รออนุมัติ' | 'รับแล้ว' | 'ยกเลิก';
  receive_method?: string;
  withholding_tax_no?: string;
  withholding_tax_amount?: number;
  receive_date?: string;
}

const API_URL = 'http://127.0.0.1:8000/api/receive-vouchers';

export default function ReceiveVoucherPage({ userRole }: ReceiveVoucherPageProps) {
  const [data, setData] = useState<ReceiveVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReceiveVoucher | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin' || userRole === 'account';

  // Fetch data from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts
  const statusCounts = {
    รอรับ: data.filter((item) => item.status === 'รอรับ').length,
    รออนุมัติ: data.filter((item) => item.status === 'รออนุมัติ').length,
    รับแล้ว: data.filter((item) => item.status === 'รับแล้ว').length,
    ยกเลิก: data.filter((item) => item.status === 'ยกเลิก').length,
  };

  const handleEdit = (item: ReceiveVoucher) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleView = (item: ReceiveVoucher) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: ReceiveVoucher) => {
    if (!canDelete) {
      toast.error('คุณไม่มีสิทธิ์ลบข้อมูล');
      return;
    }
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await axios.delete(`${API_URL}/${selectedItem.id}`);
      toast.success(`ลบใบสำคัญรับเงิน ${selectedItem.voucher_no} สำเร็จ`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      toast.error('เกิดข้อผิดพลาดในการลบใบสำคัญรับเงิน');
    }
  };

  const handlePrint = (item: ReceiveVoucher) => {
    toast.success(`กำลังพิมพ์ใบสำคัญรับเงิน ${item.voucher_no}`);
    window.print();
  };

  const handleStatusChange = async (item: ReceiveVoucher, newStatus: 'รอรับ' | 'รออนุมัติ' | 'รับแล้ว' | 'ยกเลิก') => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะ');
      return;
    }

    try {
      const payload = {
        voucher_no: item.voucher_no,
        date: item.date,
        payer: item.payer,
        amount: item.amount,
        description: item.description || undefined,
        status: newStatus,
        receive_method: item.receive_method || undefined,
        withholding_tax_no: item.withholding_tax_no || undefined,
        withholding_tax_amount: item.withholding_tax_amount || undefined,
        receive_date: item.receive_date || undefined,
      };

      await axios.put(`${API_URL}/${item.id}`, payload);
      toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };


  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'รอรับ': 'outline',
      'รออนุมัติ': 'secondary',
      'รับแล้ว': 'default',
      'ยกเลิก': 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.voucher_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.payer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="bg-gradient-to-br from-violet-400 to-violet-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('รอรับ')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.รอรับ}</p>
                <p className="text-sm opacity-90">รอรับ</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Hourglass className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('รออนุมัติ')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.รออนุมัติ}</p>
                <p className="text-sm opacity-90">รออนุมัติ</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-teal-400 to-teal-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('รับแล้ว')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.รับแล้ว}</p>
                <p className="text-sm opacity-90">รับแล้ว</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-rose-400 to-rose-500 text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus('ยกเลิก')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl mb-1">{statusCounts.ยกเลิก}</p>
                <p className="text-sm opacity-90">ยกเลิก</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
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
              <CardTitle>รายการใบสำคัญรับเงิน</CardTitle>
              {filterStatus !== 'all' && (
                <p className="text-sm text-gray-500 mt-1">
                  กรองตาม: {filterStatus}{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    แสดงทั้งหมด
                  </Button>
                </p>
              )}
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างใบสำคัญรับเงิน
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="ค้นหาเลขที่เอกสาร, ผู้จ่ายเงิน..."
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
                <TableHead>ผู้จ่ายเงิน</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>วิธีรับเงิน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span>กำลังโหลดข้อมูล...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.voucher_no}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell>{item.payer}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      ฿{item.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{item.receive_method}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleStatusChange(item, 'รอรับ')}>
                            <Hourglass className="w-4 h-4 mr-2" />
                            รอรับ
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(item, 'รออนุมัติ')}>
                            <Clock className="w-4 h-4 mr-2" />
                            รออนุมัติ
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(item, 'รับแล้ว')}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            รับแล้ว
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(item, 'ยกเลิก')}>
                            <XCircle className="w-4 h-4 mr-2" />
                            ยกเลิก
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(item)} title="ดูรายละเอียด">
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Form */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/50">
          <div className="w-full max-w-6xl my-8">
            <ReceiveVoucherForm
              onSave={() => {
                setIsAddDialogOpen(false);
                fetchData();
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
            <ReceiveVoucherForm
              isEditMode={true}
              editData={selectedItem}
              onSave={() => {
                setIsEditDialogOpen(false);
                setSelectedItem(null);
                fetchData();
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
            <DialogTitle>รายละเอียดใบสำคัญรับเงิน</DialogTitle>
            <DialogDescription>เลขที่ {selectedItem?.voucher_no}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">เลขที่เอกสาร</Label>
                  <p className="mt-1">{selectedItem.voucher_no}</p>
                </div>
                <div>
                  <Label className="text-gray-500">วันที่</Label>
                  <p className="mt-1">{new Date(selectedItem.date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">ผู้จ่ายเงิน</Label>
                <p className="mt-1">{selectedItem.payer}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">จำนวนเงิน</Label>
                  <p className="mt-1">฿{selectedItem.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">วิธีรับเงิน</Label>
                  <p className="mt-1">{selectedItem.receive_method}</p>
                </div>
              </div>
              {(selectedItem.withholding_tax_no || selectedItem.withholding_tax_amount) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">เลขที่ใบหัก ณ ที่จ่าย</Label>
                    <p className="mt-1">{selectedItem.withholding_tax_no || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">ยอดเงินหัก ณ ที่จ่าย</Label>
                    <p className="mt-1">
                      {selectedItem.withholding_tax_amount
                        ? `฿${selectedItem.withholding_tax_amount.toLocaleString()}`
                        : '-'}
                    </p>
                  </div>
                </div>
              )}
              {selectedItem.receive_date && (
                <div>
                  <Label className="text-gray-500">วันที่รับชำระเงิน</Label>
                  <p className="mt-1">
                    {new Date(selectedItem.receive_date).toLocaleDateString('th-TH')}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบใบสำคัญรับเงิน {selectedItem?.voucher_no}?
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
