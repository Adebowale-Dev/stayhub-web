'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { porterAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserCheck, 
  Search, 
  CheckCircle2, 
  Clock,
  AlertTriangle,
  Building2,
  DoorOpen,
  Mail,
  Phone,
  User,
  Calendar
} from 'lucide-react';

interface PendingStudent {
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
  checkInStatus?: 'checked-in' | 'pending' | 'not-checked-in';
  department?: string;
  level?: string;
  reservationDate?: string;
}

export default function PorterCheckInPage() {
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [releasingExpired, setReleasingExpired] = useState(false);

  useEffect(() => {
    // Debug: Check current user data
    const checkAuth = async () => {
      try {
        const profile = await porterAPI.getDashboard();
        console.log('Porter profile:', profile.data);
      } catch (error) {
        console.error('Failed to get profile:', error);
      }
    };
    checkAuth();
    
    loadPendingStudents();
  }, []);

  const loadPendingStudents = async () => {
    setLoading(true);
    try {
      const response = await porterAPI.getStudents();
      console.log('Students API response:', response.data);
      const allStudents = response.data.data || response.data || [];
      // Filter only pending students
      const pending = allStudents.filter((s: PendingStudent) => s.checkInStatus === 'pending');
      setPendingStudents(pending);
    } catch (error: unknown) {
      console.error('Failed to load pending students:', error);
      const axiosError = error as { response?: { status?: number; data?: { message?: string; firstLogin?: boolean } } };
      
      // Log full error details
      console.error('Error status:', axiosError.response?.status);
      console.error('Error data:', axiosError.response?.data);
      
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
      loadPendingStudents();
    } catch (error) {
      console.error('Failed to check in student:', error);
      alert('Failed to check in student. Please try again.');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleReleaseExpired = async () => {
    if (!confirm('Are you sure you want to release all expired reservations? This action cannot be undone.')) {
      return;
    }

    setReleasingExpired(true);
    try {
      await porterAPI.releaseExpired();
      alert('Expired reservations released successfully!');
      loadPendingStudents();
    } catch (error) {
      console.error('Failed to release expired reservations:', error);
      alert('Failed to release expired reservations. Please try again.');
    } finally {
      setReleasingExpired(false);
    }
  };

  const filteredStudents = pendingStudents.filter((student) => {
    const matchesSearch = 
      (student.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (student.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (student.matricNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['porter']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading pending check-ins...</p>
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
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Student Check-In
              </h2>
              <p className="text-muted-foreground mt-1">
                Process pending student check-ins for your hostel
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleReleaseExpired}
              disabled={releasingExpired}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {releasingExpired ? 'Releasing...' : 'Release Expired'}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending Check-Ins</CardDescription>
                <CardTitle className="text-3xl">{pendingStudents.length}</CardTitle>
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
                <CardDescription>Today&apos;s Check-Ins</CardDescription>
                <CardTitle className="text-3xl">0</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Completed today</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Filtered Results</CardDescription>
                <CardTitle className="text-3xl">{filteredStudents.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>Matching search</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Alert */}
          {pendingStudents.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {pendingStudents.length} student{pendingStudents.length !== 1 ? 's' : ''} waiting to be checked in. 
                Process their check-ins to allow them access to the hostel.
              </AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or matric number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pending Students Grid */}
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'No students match your search criteria.'
                      : 'There are no pending check-ins at the moment.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((student) => (
                <Card key={student._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{student.name}</CardTitle>
                          {student.matricNumber && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {student.matricNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{student.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Room Assignment */}
                    {student.roomAssignment && (
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
                        <div className="flex items-center gap-2 mb-2">
                          <DoorOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-sm">Room Assignment</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>Room {student.roomAssignment.room.roomNumber}</p>
                          {student.roomAssignment.bunkNumber && (
                            <p className="text-muted-foreground">Bunk {student.roomAssignment.bunkNumber}</p>
                          )}
                          {student.roomAssignment.room.block && (
                            <p className="text-muted-foreground">{student.roomAssignment.room.block}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Department Info */}
                    {student.department && (
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{student.department}</p>
                        {student.level && (
                          <p className="text-muted-foreground">{student.level} Level</p>
                        )}
                      </div>
                    )}

                    {/* Reservation Date */}
                    {student.reservationDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Reserved: {new Date(student.reservationDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Check-In Button */}
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => handleCheckIn(student._id)}
                      disabled={checkingIn === student._id}
                    >
                      <UserCheck className="h-4 w-4" />
                      {checkingIn === student._id ? 'Checking In...' : 'Check In Student'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
