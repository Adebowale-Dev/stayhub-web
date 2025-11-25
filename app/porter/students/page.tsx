'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { porterAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Building2,
  DoorOpen,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  matricNumber?: string;
  roomAssignment?: {
    room: {
      _id: string;
      roomNumber: string;
      block?: string;
    };
    bunkNumber?: number;
  };
  checkInStatus: 'checked-in' | 'pending' | 'not-checked-in';
  checkInDate?: string;
  department?: string;
  level?: string;
}

export default function PorterStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'pending' | 'not-checked-in'>('all');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await porterAPI.getStudents();
      setStudents(response.data.data || response.data || []);
    } catch (error: unknown) {
      console.error('Failed to load students:', error);
      const axiosError = error as { response?: { status?: number; data?: { message?: string; firstLogin?: boolean } } };
      
      // Check if it's a first login requirement
      if (axiosError.response?.data?.firstLogin) {
        alert('You must change your password before accessing this page. Redirecting to settings...');
        window.location.href = '/porter/settings';
        return;
      }
      
      if (axiosError.response?.status === 403) {
        const errorMessage = axiosError.response?.data?.message || 'Access denied: Your porter account does not have a hostel assigned yet. Please contact the administrator to assign a hostel to your account.';
        alert(errorMessage);
      } else {
        const errorMessage = axiosError.response?.data?.message || 'Failed to load students. Please try again.';
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (studentId: string) => {
    setCheckingIn(studentId);
    try {
      await porterAPI.checkInStudent(studentId);
      alert('Student checked in successfully!');
      loadStudents();
    } catch (error) {
      console.error('Failed to check in student:', error);
      alert('Failed to check in student. Please try again.');
    } finally {
      setCheckingIn(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      (student.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (student.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (student.matricNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || student.checkInStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: students.length,
    checkedIn: students.filter(s => s.checkInStatus === 'checked-in').length,
    pending: students.filter(s => s.checkInStatus === 'pending').length,
    notCheckedIn: students.filter(s => s.checkInStatus === 'not-checked-in').length,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['porter']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['porter']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Hostel Students
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage students in your assigned hostel
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>All students</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Checked In</CardDescription>
                <CardTitle className="text-2xl">{stats.checkedIn}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending</CardDescription>
                <CardTitle className="text-2xl">{stats.pending}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Awaiting check-in</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Not Checked In</CardDescription>
                <CardTitle className="text-2xl">{stats.notCheckedIn}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span>Not started</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or matric number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="not-checked-in">Not Checked In</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Room Assignment</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, index) => (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              {student.matricNumber && (
                                <p className="text-xs text-muted-foreground">{student.matricNumber}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{student.email}</span>
                              </div>
                              {student.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{student.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.roomAssignment ? (
                              <div className="flex items-center gap-2">
                                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Room {student.roomAssignment.room.roomNumber}</p>
                                  {student.roomAssignment.bunkNumber && (
                                    <p className="text-xs text-muted-foreground">Bunk {student.roomAssignment.bunkNumber}</p>
                                  )}
                                  {student.roomAssignment.room.block && (
                                    <p className="text-xs text-muted-foreground">{student.roomAssignment.room.block}</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.department ? (
                              <div>
                                <p className="text-sm">{student.department}</p>
                                {student.level && (
                                  <p className="text-xs text-muted-foreground">{student.level} Level</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.checkInStatus === 'checked-in' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Checked In
                              </Badge>
                            )}
                            {student.checkInStatus === 'pending' && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            {student.checkInStatus === 'not-checked-in' && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Not Checked In
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.checkInDate 
                              ? new Date(student.checkInDate).toLocaleDateString()
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            {student.checkInStatus === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleCheckIn(student._id)}
                                disabled={checkingIn === student._id}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                {checkingIn === student._id ? 'Checking In...' : 'Check In'}
                              </Button>
                            )}
                            {student.checkInStatus === 'checked-in' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
