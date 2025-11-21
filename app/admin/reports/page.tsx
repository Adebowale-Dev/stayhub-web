'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Users, 
  Building2, 
  CreditCard, 
  TrendingUp,
  DoorOpen,
  UserCheck,
  Calendar,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  studentsPaid: number;
  studentsPending: number;
  totalHostels: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalPorters: number;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  matricNumber: string;
  department?: { name: string; college: { name: string } };
  paymentStatus?: string;
  roomAllocation?: {
    hostel: { name: string };
    room: { roomNumber: string };
    bunkNumber?: number;
  };
  createdAt: string;
}

interface Hostel {
  _id: string;
  name: string;
  gender: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  capacity: number;
  currentOccupants: number;
}

interface Payment {
  _id: string;
  student: {
    _id: string;
    name: string;
    matricNumber: string;
    email: string;
  };
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  paymentDate?: string;
  createdAt: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalFailed: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes, hostelsRes, paymentsRes, paymentStatsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getStudents(),
        adminAPI.getHostels(),
        adminAPI.getPayments(),
        adminAPI.getPaymentStats(),
      ]);

      setStats(statsRes.data.data || statsRes.data);
      setStudents(studentsRes.data.data || studentsRes.data || []);
      setHostels(hostelsRes.data.data || hostelsRes.data || []);
      setPayments(paymentsRes.data.data || paymentsRes.data || []);
      setPaymentStats(paymentStatsRes.data.data || paymentStatsRes.data);
    } catch (error) {
      console.error('Failed to load reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: unknown[], filename: string, headers: string[]) => {
    setExporting(true);
    try {
      const csvContent = [
        headers.join(','),
        ...(data as Record<string, unknown>[]).map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle nested objects and escape commas
            const stringValue = typeof value === 'object' && value !== null
              ? JSON.stringify(value).replace(/,/g, ';')
              : String(value || '');
            return `"${stringValue.replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`✅ Report exported successfully as ${filename}.csv`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportStudentsReport = () => {
    const data = students.map(s => ({
      name: s.name,
      matricNumber: s.matricNumber,
      email: s.email,
      college: s.department?.college?.name || 'N/A',
      department: s.department?.name || 'N/A',
      paymentStatus: s.paymentStatus || 'pending',
      hostel: s.roomAllocation?.hostel?.name || 'Not Allocated',
      room: s.roomAllocation?.room?.roomNumber || 'N/A',
      bunk: s.roomAllocation?.bunkNumber || 'N/A',
      registeredDate: new Date(s.createdAt).toLocaleDateString(),
    }));
    
    exportToCSV(
      data,
      'students_report',
      ['name', 'matricNumber', 'email', 'college', 'department', 'paymentStatus', 'hostel', 'room', 'bunk', 'registeredDate']
    );
  };

  const exportHostelsReport = () => {
    const data = hostels.map(h => ({
      name: h.name,
      gender: h.gender,
      totalRooms: h.totalRooms,
      occupiedRooms: h.occupiedRooms,
      availableRooms: h.availableRooms,
      capacity: h.capacity,
      currentOccupants: h.currentOccupants,
      occupancyRate: h.capacity > 0 ? `${((h.currentOccupants / h.capacity) * 100).toFixed(1)}%` : '0%',
    }));
    
    exportToCSV(
      data,
      'hostels_report',
      ['name', 'gender', 'totalRooms', 'occupiedRooms', 'availableRooms', 'capacity', 'currentOccupants', 'occupancyRate']
    );
  };

  const exportPaymentsReport = () => {
    const data = payments.map(p => ({
      studentName: p.student?.name || 'N/A',
      matricNumber: p.student?.matricNumber || 'N/A',
      email: p.student?.email || 'N/A',
      amount: p.amount,
      status: p.status,
      reference: p.reference || 'N/A',
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A',
      createdDate: new Date(p.createdAt).toLocaleDateString(),
    }));
    
    exportToCSV(
      data,
      'payments_report',
      ['studentName', 'matricNumber', 'email', 'amount', 'status', 'reference', 'paymentDate', 'createdDate']
    );
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const studentsByPaymentStatus = {
    paid: students.filter(s => s.paymentStatus === 'completed').length,
    pending: students.filter(s => s.paymentStatus === 'pending').length,
    failed: students.filter(s => s.paymentStatus === 'failed').length,
  };

  const studentsByAllocation = {
    allocated: students.filter(s => s.roomAllocation).length,
    notAllocated: students.filter(s => !s.roomAllocation).length,
  };

  const totalRevenue = paymentStats?.totalRevenue || 
    payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  const occupancyRate = stats && stats.totalRooms > 0
    ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1)
    : '0';

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Reports & Analytics
              </h2>
              <p className="text-muted-foreground mt-1">
                Comprehensive system reports and data exports
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-2xl">{stats?.totalStudents || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Registered students</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-2xl">₦{totalRevenue.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>From completed payments</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Room Occupancy</CardDescription>
                <CardTitle className="text-2xl">{occupancyRate}%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DoorOpen className="h-4 w-4" />
                  <span>{stats?.occupiedRooms || 0} of {stats?.totalRooms || 0} rooms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Hostels</CardDescription>
                <CardTitle className="text-2xl">{stats?.totalHostels || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Active hostels</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Reports */}
          <Tabs defaultValue="students" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="students">
                <Users className="h-4 w-4 mr-2" />
                Students
              </TabsTrigger>
              <TabsTrigger value="hostels">
                <Building2 className="h-4 w-4 mr-2" />
                Hostels
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Students Report */}
            <TabsContent value="students" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Student Registration Report</h3>
                <Button onClick={exportStudentsReport} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Payment Completed</CardDescription>
                    <CardTitle className="text-2xl text-green-600">
                      {studentsByPaymentStatus.paid}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      {stats?.totalStudents ? 
                        `${((studentsByPaymentStatus.paid / stats.totalStudents) * 100).toFixed(1)}% of total`
                        : '0%'
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Payment Pending</CardDescription>
                    <CardTitle className="text-2xl text-orange-600">
                      {studentsByPaymentStatus.pending}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      {stats?.totalStudents ? 
                        `${((studentsByPaymentStatus.pending / stats.totalStudents) * 100).toFixed(1)}% of total`
                        : '0%'
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Room Allocated</CardDescription>
                    <CardTitle className="text-2xl text-blue-600">
                      {studentsByAllocation.allocated}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      {stats?.totalStudents ? 
                        `${((studentsByAllocation.allocated / stats.totalStudents) * 100).toFixed(1)}% allocated`
                        : '0%'
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Student Registrations</CardTitle>
                  <CardDescription>Latest 10 registered students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Matric Number</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Registered</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.slice(0, 10).map((student) => (
                          <TableRow key={student._id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {student.matricNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {student.department?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {student.paymentStatus === 'completed' ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Paid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {student.roomAllocation ? (
                                <span className="text-green-600">
                                  {student.roomAllocation.hostel.name} - Room {student.roomAllocation.room.roomNumber}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Not allocated</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(student.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hostels Report */}
            <TabsContent value="hostels" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Hostel Occupancy Report</h3>
                <Button onClick={exportHostelsReport} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Hostel Statistics</CardTitle>
                  <CardDescription>Detailed occupancy and capacity information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hostel Name</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Total Rooms</TableHead>
                          <TableHead>Occupied</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Occupants</TableHead>
                          <TableHead>Occupancy Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hostels.map((hostel) => {
                          const occupancyRate = hostel.capacity > 0 
                            ? ((hostel.currentOccupants / hostel.capacity) * 100).toFixed(1)
                            : '0';
                          const isHighOccupancy = parseFloat(occupancyRate) >= 80;
                          const isMediumOccupancy = parseFloat(occupancyRate) >= 50 && parseFloat(occupancyRate) < 80;

                          return (
                            <TableRow key={hostel._id}>
                              <TableCell className="font-medium">{hostel.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {hostel.gender === 'male' ? '♂ Male' : '♀ Female'}
                                </Badge>
                              </TableCell>
                              <TableCell>{hostel.totalRooms}</TableCell>
                              <TableCell className="text-orange-600 font-medium">
                                {hostel.occupiedRooms}
                              </TableCell>
                              <TableCell className="text-green-600 font-medium">
                                {hostel.availableRooms}
                              </TableCell>
                              <TableCell>{hostel.capacity}</TableCell>
                              <TableCell>{hostel.currentOccupants}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        isHighOccupancy 
                                          ? 'bg-red-500' 
                                          : isMediumOccupancy 
                                            ? 'bg-orange-500' 
                                            : 'bg-green-500'
                                      }`}
                                      style={{ width: `${occupancyRate}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium w-12 text-right">
                                    {occupancyRate}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Report */}
            <TabsContent value="payments" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Payment Transaction Report</h3>
                <Button onClick={exportPaymentsReport} disabled={exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-xl">₦{totalRevenue.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Completed</CardDescription>
                    <CardTitle className="text-xl text-green-600">
                      {paymentStats?.totalPaid || payments.filter(p => p.status === 'completed').length}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Pending</CardDescription>
                    <CardTitle className="text-xl text-orange-600">
                      {paymentStats?.totalPending || payments.filter(p => p.status === 'pending').length}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Failed</CardDescription>
                    <CardTitle className="text-xl text-red-600">
                      {paymentStats?.totalFailed || payments.filter(p => p.status === 'failed').length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest 15 payment records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Matric Number</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.slice(0, 15).map((payment) => (
                          <TableRow key={payment._id}>
                            <TableCell className="font-medium">
                              {payment.student?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.student?.matricNumber || 'N/A'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ₦{payment.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {payment.status === 'completed' && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Completed
                                </Badge>
                              )}
                              {payment.status === 'pending' && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  Pending
                                </Badge>
                              )}
                              {payment.status === 'failed' && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  Failed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {payment.reference ? (
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {payment.reference}
                                </code>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {payment.paymentDate 
                                ? new Date(payment.paymentDate).toLocaleDateString()
                                : new Date(payment.createdAt).toLocaleDateString()
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Report */}
            <TabsContent value="analytics" className="space-y-4">
              <h3 className="text-lg font-semibold">System Analytics</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Statistics</CardTitle>
                    <CardDescription>Breakdown by payment and allocation status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Payment Completed</span>
                        <span className="font-bold text-green-600">
                          {studentsByPaymentStatus.paid} ({stats?.totalStudents ? 
                            ((studentsByPaymentStatus.paid / stats.totalStudents) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ 
                            width: stats?.totalStudents 
                              ? `${(studentsByPaymentStatus.paid / stats.totalStudents) * 100}%` 
                              : '0%' 
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Payment Pending</span>
                        <span className="font-bold text-orange-600">
                          {studentsByPaymentStatus.pending} ({stats?.totalStudents ? 
                            ((studentsByPaymentStatus.pending / stats.totalStudents) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500"
                          style={{ 
                            width: stats?.totalStudents 
                              ? `${(studentsByPaymentStatus.pending / stats.totalStudents) * 100}%` 
                              : '0%' 
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Room Allocated</span>
                        <span className="font-bold text-blue-600">
                          {studentsByAllocation.allocated} ({stats?.totalStudents ? 
                            ((studentsByAllocation.allocated / stats.totalStudents) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ 
                            width: stats?.totalStudents 
                              ? `${(studentsByAllocation.allocated / stats.totalStudents) * 100}%` 
                              : '0%' 
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Room Statistics</CardTitle>
                    <CardDescription>Overall occupancy breakdown</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Occupied Rooms</span>
                        <span className="font-bold text-orange-600">
                          {stats?.occupiedRooms || 0} ({occupancyRate}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500"
                          style={{ width: `${occupancyRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Available Rooms</span>
                        <span className="font-bold text-green-600">
                          {stats?.availableRooms || 0} ({stats?.totalRooms ? 
                            ((stats.availableRooms / stats.totalRooms) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ 
                            width: stats?.totalRooms 
                              ? `${(stats.availableRooms / stats.totalRooms) * 100}%` 
                              : '0%' 
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Total Rooms</span>
                        <span className="font-bold">{stats?.totalRooms || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="font-medium">Total Hostels</span>
                        <span className="font-bold">{stats?.totalHostels || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats Summary</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Report Generated</span>
                      </div>
                      <p className="text-sm font-medium">
                        {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserCheck className="h-4 w-4" />
                        <span className="text-sm">Active Porters</span>
                      </div>
                      <p className="text-sm font-medium">
                        {stats?.totalPorters || 0} Porter{(stats?.totalPorters || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Payment Success Rate</span>
                      </div>
                      <p className="text-sm font-medium">
                        {payments.length > 0 
                          ? ((payments.filter(p => p.status === 'completed').length / payments.length) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
