import { useState, useEffect } from 'react';
import type { UserRole } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Edit, Trash2, Eye, Search, Briefcase, Clock, CheckCircle, XCircle, Shield } from 'lucide-react';
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
import { customerService } from '../../services/customerService';
import type { Customer } from '../../services/customerService';
import { projectService } from '../../services/projectService';
import type { Project as ApiProject } from '../../services/projectService';

interface ProjectPageProps {
  userRole: UserRole;
}

export default function ProjectPage({ userRole }: ProjectPageProps) {
  const [data, setData] = useState<ApiProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCustomerSelectDialogOpen, setIsCustomerSelectDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ApiProject | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    customerName: '',
    projectName: '',
    amount: 0,
    installments: 0,
    guarantee: 0,
    startDate: '',
    endDate: '',
    description: '',
  });

  const canEdit = userRole === 'admin' || userRole === 'account';
  const canDelete = userRole === 'admin';

  // โหลดข้อมูลโครงการจากฐานข้อมูล
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projects = await projectService.getAll();
        setData(projects);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast.error('ไม่สามารถโหลดข้อมูลโครงการได้');
      }
    };
    loadProjects();
  }, []);

  // โหลดข้อมูลโครงการอีกครั้ง
  const fetchProjects = async () => {
    try {
      const projects = await projectService.getAll();
      setData(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโครงการได้');
    }
  };

  // โหลดข้อมูลลูกค้า
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customerList = await customerService.getActiveCustomers();
        setCustomers(customerList);
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };
    loadCustomers();
  }, []);

  const handleSelectCustomer = (customer: Customer) => {
    setFormData({ ...formData, customerName: customer.name });
    setSelectedCustomerId(customer.id);
    setIsCustomerSelectDialogOpen(false);
  };

  const handleAdd = async () => {
    try {
      // Validate required fields
      if (!formData.code || !selectedCustomerId || !formData.projectName || formData.amount <= 0 || formData.installments <= 0 || !formData.startDate) {
        toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return;
      }

      // Create project data
      const projectData = {
        code: formData.code,
        customer_id: selectedCustomerId,
        name: formData.projectName,
        amount: formData.amount,
        installments: formData.installments,
        guarantee: formData.guarantee || 0,
        start_date: formData.startDate,
        end_date: formData.endDate || undefined,
        description: formData.description || undefined,
        status: 'กำลังดำเนินงาน',
      };

      // Call API to create project
      await projectService.create(projectData);

      // Refresh project list
      await fetchProjects();

      // Reset form and close dialog
      setFormData({
        code: '',
        customerName: '',
        projectName: '',
        amount: 0,
        installments: 0,
        guarantee: 0,
        startDate: '',
        endDate: '',
        description: '',
      });
      setSelectedCustomerId(null);
      setIsAddDialogOpen(false);

      toast.success('เพิ่มโครงการสำเร็จ');
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ไม่สามารถเพิ่มโครงการได้';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (item: ApiProject) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }
    setSelectedItem(item);
    setSelectedCustomerId(item.customer_id);
    setFormData({
      code: item.code,
      customerName: item.customer,
      projectName: item.name,
      amount: item.amount,
      installments: item.installments,
      guarantee: item.guarantee,
      startDate: item.start_date,
      endDate: item.end_date || '',
      description: item.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (!selectedItem) return;

      // Validate required fields
      if (!formData.code || !selectedCustomerId || !formData.projectName || formData.amount <= 0 || formData.installments <= 0 || !formData.startDate) {
        toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return;
      }

      // Update project data
      const projectData = {
        code: formData.code,
        customer_id: selectedCustomerId,
        name: formData.projectName,
        amount: formData.amount,
        installments: formData.installments,
        guarantee: formData.guarantee || 0,
        start_date: formData.startDate,
        end_date: formData.endDate || undefined,
        description: formData.description || undefined,
        status: selectedItem.status,
      };

      // Call API to update project
      await projectService.update(selectedItem.id, projectData);

      // Refresh project list
      await fetchProjects();

      setIsEditDialogOpen(false);
      toast.success('แก้ไขโครงการสำเร็จ');
    } catch (error) {
      console.error('Error updating project:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ไม่สามารถแก้ไขโครงการได้';
      toast.error(errorMessage);
    }
  };

  const handleView = (item: ApiProject) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (item: ApiProject) => {
    if (!canDelete) {
      toast.error('คุณไม่มีสิทธิ์ลบข้อมูล');
      return;
    }
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedItem) return;

      // Call API to delete project
      await projectService.delete(selectedItem.id);

      // Refresh project list
      await fetchProjects();

      setIsDeleteDialogOpen(false);
      toast.success(`ลบโครงการ ${selectedItem.name} สำเร็จ`);
    } catch (error) {
      console.error('Error deleting project:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ไม่สามารถลบโครงการได้';
      toast.error(errorMessage);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (project: ApiProject, newStatus: string) => {
    if (!canEdit) {
      toast.error('คุณไม่มีสิทธิ์แก้ไขข้อมูล');
      return;
    }

    try {
      await projectService.update(project.id, {
        code: project.code,
        customer_id: project.customer_id,
        name: project.name,
        amount: project.amount,
        installments: project.installments,
        guarantee: project.guarantee,
        start_date: project.start_date,
        end_date: project.end_date || undefined,
        description: project.description || undefined,
        status: newStatus,
      });

      // Refresh project list
      await fetchProjects();

      toast.success(`อัพเดทสถานะโครงการเป็น "${newStatus}" สำเร็จ`);
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'ไม่สามารถอัพเดทสถานะได้';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'กำลังดำเนินงาน': 'default',
      'จบโครงการแล้ว': 'secondary',
      'ยกเลิก': 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const filteredData = data.filter(
    (item) =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // คำนวณสถิติ
  const inProgressCount = data.filter((p) => p.status === 'กำลังดำเนินงาน').length;
  const completedCount = data.filter((p) => p.status === 'จบโครงการแล้ว').length;
  const cancelledCount = data.filter((p) => p.status === 'ยกเลิก').length;
  const totalGuarantee = data.reduce((sum, p) => sum + (p.guarantee || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* กำลังดำเนินงาน */}
        <Card className="bg-gradient-to-br from-amber-400 to-amber-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{inProgressCount}</div>
                <div className="text-sm mt-1">กำลังดำเนินงาน</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* จบโครงการแล้ว */}
        <Card className="bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{completedCount}</div>
                <div className="text-sm mt-1">จบโครงการแล้ว</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ยกเลิก */}
        <Card className="bg-gradient-to-br from-red-400 to-red-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{cancelledCount}</div>
                <div className="text-sm mt-1">ยกเลิก</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* หลักประกันสัญญารวม */}
        <Card className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  ฿{totalGuarantee >= 1000000
                    ? (totalGuarantee / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
                    : totalGuarantee.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm mt-1">หลักประกันสัญญารวม</div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการโครงการ</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มโครงการ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <Input
                placeholder="ค้นหาเลขที่สัญญา ชื่อโครงการ ชื่อลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่สัญญา</TableHead>
                <TableHead>ชื่อโครงการ</TableHead>
                <TableHead>ชื่อหน่วยงาน</TableHead>
                <TableHead className="text-right">งบงวด</TableHead>
                <TableHead className="text-center">งวดงวดงาน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.customer}</TableCell>
                  <TableCell className="text-right">
                    {item.budget.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-center">{item.progress}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="cursor-pointer" disabled={!canEdit}>
                          {getStatusBadge(item.status)}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, 'กำลังดำเนินงาน')}
                          className="flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span>กำลังดำเนินงาน</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, 'จบโครงการแล้ว')}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>จบโครงการแล้ว</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(item, 'ยกเลิก')}
                          className="flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span>ยกเลิก</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        disabled={!canEdit}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(item)}
                        disabled={!canDelete}
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่มโครงการใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลโครงการ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>เลขที่สัญญา</Label>
              <Input
                placeholder="CON-2025-XXX"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>ชื่อหน่วยงาน</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="ชื่อหน่วยงาน"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCustomerSelectDialogOpen(true)}
                >
                  เลือก
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ชื่อโครงการ</Label>
              <Input
                placeholder="ชื่อโครงการ"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>จำนวนเงิน (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>จำนวนงวดงาน</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>หลักประกันสัญญา (บาท)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.guarantee}
                onChange={(e) => setFormData({ ...formData, guarantee: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันที่เริ่มโครงการ</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>วันที่สิ้นสุดโครงการ (ถ้ามี)</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>รายละเอียดโครงการ</Label>
              <Textarea
                placeholder="กรอกรายละเอียดโครงการ..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleAdd}>บันทึก</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขโครงการ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูล {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>เลขที่สัญญา</Label>
              <Input
                placeholder="CON-2025-XXX"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>ชื่อหน่วยงาน</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="ชื่อหน่วยงาน"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCustomerSelectDialogOpen(true)}
                >
                  เลือก
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ชื่อโครงการ</Label>
              <Input
                placeholder="ชื่อโครงการ"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>จำนวนเงิน (บาท)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>จำนวนงวดงาน</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>หลักประกันสัญญา (บาท)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.guarantee}
                onChange={(e) => setFormData({ ...formData, guarantee: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันที่เริ่มโครงการ</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>วันที่สิ้นสุดโครงการ (ถ้ามี)</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>รายละเอียดโครงการ</Label>
              <Textarea
                placeholder="กรอกรายละเอียดโครงการ..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleUpdate}>บันทึกการเปลี่ยนแปลง</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>รายละเอียดโครงการ</DialogTitle>
            <DialogDescription>{selectedItem?.code}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">เลขที่สัญญา</Label>
                <p className="mt-1">{selectedItem.code}</p>
              </div>
              <div>
                <Label className="text-gray-500">ชื่อโครงการ</Label>
                <p className="mt-1">{selectedItem.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">ลูกค้า/หน่วยงาน</Label>
                <p className="mt-1">{selectedItem.customer}</p>
              </div>
              <div>
                <Label className="text-gray-500">งบประมาณ</Label>
                <p className="mt-1">
                  {selectedItem.budget.toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  บาท
                </p>
              </div>
              <div>
                <Label className="text-gray-500">งวดงาน</Label>
                <p className="mt-1">{selectedItem.progress} งวด</p>
              </div>
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsViewDialogOpen(false)}>ปิด</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Selection Dialog */}
      <Dialog open={isCustomerSelectDialogOpen} onOpenChange={setIsCustomerSelectDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">เลือกลูกค้า/หน่วยงาน</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  เลือกลูกค้าหรือหน่วยงานสำหรับโครงการนี้
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
              {customers
                .filter((c) =>
                  c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                  c.code.toLowerCase().includes(customerSearchTerm.toLowerCase())
                )
                .length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                  <Search className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-lg">ไม่พบข้อมูลลูกค้า</p>
                  <p className="text-sm">ลองค้นหาด้วยคำอื่น</p>
                </div>
              ) : (
                <div className="grid gap-2 p-2">
                  {customers
                    .filter((c) =>
                      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                      c.code.toLowerCase().includes(customerSearchTerm.toLowerCase())
                    )
                    .map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="group bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-lg hover:scale-[1.02]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-300">
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

                              {customer.email && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400">✉️</span>
                                  <span>{customer.email}</span>
                                </div>
                              )}
                            </div>

                            {customer.address && (
                              <div className="text-sm text-gray-500 line-clamp-1">
                                <span className="text-gray-400">📍</span> {customer.address}
                              </div>
                            )}
                          </div>

                          <Button
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
                พบ {customers.filter((c) =>
                  c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                  c.code.toLowerCase().includes(customerSearchTerm.toLowerCase())
                ).length} รายการ
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCustomerSelectDialogOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ปิด
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบโครงการ "{selectedItem?.name}"? การดำเนินการนี้ไม่สามารถยกเลิกได้
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
