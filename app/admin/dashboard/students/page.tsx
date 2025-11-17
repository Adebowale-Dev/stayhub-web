"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  Building2,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { EditStudentDialog } from "@/components/EditStudentDialog";
import { DeleteDepartmentDialog } from "@/components/DeleteDepartmentDialog";
import { adminAPI } from "@/services/api";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  matricNo: string;
  email: string;
  level: number;
  paymentStatus: string;
  reservationStatus?: string;
  isActive: boolean;
  college?: {
    _id: string;
    name: string;
    code: string;
  };
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  assignedHostel?: {
    _id: string;
    name: string;
    code: string;
  };
  assignedRoom?: {
    _id: string;
    roomNumber: string;
  };
}

function StudentsPageContent() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [collegeFilter, setCollegeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
    matricNo: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getStudents();
      setStudents(response.data.data || []);
    } catch (err) {
      console.error("Failed to load students:", err);
      setError("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        student.matricNo.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.college?.name.toLowerCase().includes(query) ||
        student.department?.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Level filter
    if (levelFilter !== "all" && student.level.toString() !== levelFilter) {
      return false;
    }

    // Payment filter
    if (paymentFilter !== "all" && student.paymentStatus !== paymentFilter) {
      return false;
    }

    // College filter
    if (collegeFilter !== "all" && student.college?._id !== collegeFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active" && !student.isActive) return false;
      if (statusFilter === "inactive" && student.isActive) return false;
    }

    return true;
  });

  // Get unique colleges for filter
  const colleges = Array.from(
    new Map(
      students
        .filter((s) => s.college)
        .map((s) => [s.college!._id, s.college!])
    ).values()
  );

  // Calculate statistics
  const stats = {
    total: students.length,
    active: students.filter((s) => s.isActive).length,
    inactive: students.filter((s) => !s.isActive).length,
    paid: students.filter((s) => s.paymentStatus === "paid").length,
    pending: students.filter((s) => s.paymentStatus === "pending").length,
    assigned: students.filter((s) => s.assignedHostel && s.assignedRoom).length,
    unassigned: students.filter((s) => !s.assignedHostel || !s.assignedRoom).length,
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const handleEditClick = (student: Student) => {
    setStudentToEdit(student);
    setEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    await loadStudents();
  };

  const handleDeleteClick = (id: string, firstName: string, lastName: string, matricNo: string) => {
    setStudentToDelete({ id, name: `${firstName} ${lastName}`, matricNo });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      // Call delete API - you'll need to add this to your store or API
      await adminAPI.deleteStudent(studentToDelete.id);
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      await loadStudents();
    } catch (err) {
      console.error("Failed to delete student:", err);
      setError("Failed to delete student. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLevelFilter("all");
    setPaymentFilter("all");
    setCollegeFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground">Students Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all students across colleges and departments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadStudents}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Implement export */}}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Implement bulk upload */}}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/admin/dashboard/students/create")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.paid}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.assigned}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.unassigned}</p>
                <p className="text-xs text-muted-foreground">Unassigned</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 border shadow-none">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>
              {(searchQuery || levelFilter !== "all" || paymentFilter !== "all" || 
                collegeFilter !== "all" || statusFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, matric no, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Level Filter */}
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="100">100 Level</SelectItem>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                  <SelectItem value="500">500 Level</SelectItem>
                  <SelectItem value="600">600 Level</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Filter */}
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* College Filter - Second Row if needed */}
            {colleges.length > 0 && (
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="All Colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map((college) => (
                    <SelectItem key={college._id} value={college._id}>
                      {college.code} - {college.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Students Table */}
        <Card className="border shadow-none">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No students found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || levelFilter !== "all" || paymentFilter !== "all" || 
                   collegeFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters to see more results"
                    : "Get started by adding your first student"}
                </p>
                {!searchQuery && levelFilter === "all" && paymentFilter === "all" && 
                 collegeFilter === "all" && statusFilter === "all" && (
                  <Button onClick={() => router.push("/admin/dashboard/students/create")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Student
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12 font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Matric No</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Email</TableHead>
                      <TableHead className="font-semibold">College</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">Department</TableHead>
                      <TableHead className="text-center font-semibold">Level</TableHead>
                      <TableHead className="text-center font-semibold">Payment</TableHead>
                      <TableHead className="text-center font-semibold hidden xl:table-cell">Hostel</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => (
                      <TableRow key={student._id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-primary">
                            {student.matricNo}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              {student.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                          {student.email}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">{student.college?.code}</span>
                            <span className="text-xs text-muted-foreground lg:hidden">
                              {student.department?.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm hidden lg:table-cell">
                          {student.department?.code}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs font-semibold">
                            {student.level}L
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${getPaymentStatusColor(
                              student.paymentStatus
                            )}`}
                          >
                            {student.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-center hidden xl:table-cell">
                          {student.assignedHostel ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{student.assignedHostel.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Room {student.assignedRoom?.roomNumber || "-"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={student.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {student.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-600"
                              onClick={() => {/* TODO: View details */}}
                              aria-label="View Student"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleEditClick(student)}
                              aria-label="Edit Student"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() =>
                                handleDeleteClick(
                                  student._id,
                                  student.firstName,
                                  student.lastName,
                                  student.matricNo
                                )
                              }
                              aria-label="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Results Summary */}
                <div className="px-4 py-3 border-t bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filteredStudents.length}</span> of{" "}
                    <span className="font-medium text-foreground">{students.length}</span> students
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Student Modal */}
      <EditStudentDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        student={studentToEdit}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Student Modal */}
      <DeleteDepartmentDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        departmentName={studentToDelete?.name}
        departmentCode={studentToDelete?.matricNo}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <StudentsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
