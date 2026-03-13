'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentAPI } from '@/services/api';
import useAuthStore from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2,
  MapPin,
  Bed,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Home,
  ArrowRight,
  Info
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Reservation {
  _id?: string;
  student?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    matricNo?: string;
  };
  hostel?: {
    _id?: string;
    name?: string;
    code?: string;
    location?: string;
    gender?: string;
    level?: number;
    allowedLevels?: number[];
    totalRooms?: number;
    roomsCount?: number;
  };
  room?: {
    _id?: string;
    roomNumber?: string;
    floor?: number;
    capacity?: number;
    currentOccupants?: number;
    occupants?: number;
  };
  bunk?: {
    _id?: string;
    bunkNumber?: string | number;
    number?: string | number;
    position?: string;
  };
  // Alternate field names some backends use
  assignedHostel?: any;
  assignedRoom?: any;
  assignedBunk?: any;
  status?: 'pending' | 'confirmed' | 'checked-in' | 'checked_in' | 'cancelled' | 'expired';
  reservationStatus?: string;
  reservedAt?: string;
  expiresAt?: string;
  checkedInAt?: string;
  createdAt?: string;
  updatedAt?: string;
  roommates?: any[];
}

export default function ReservationPage() {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch reservation data first
      const reservationResponse = await studentAPI.getReservation();
      
      const reservationData = reservationResponse.data.data || reservationResponse.data;

      // Backend returns { reservationStatus: "none" } when no reservation exists
      if (!reservationData || reservationData.reservationStatus === 'none' || reservationData.reservationStatus === 'no-reservation') {
        setReservation(null);
        setError('No reservation found');
        setLoading(false);
        return;
      }

      // Longer delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then fetch dashboard data
      const dashboardResponse = await studentAPI.getDashboard();
      const dashboardData = dashboardResponse.data.data || dashboardResponse.data;
      const profile = dashboardData?.profile || dashboardData?.student;
      
      setStudentProfile(profile);
      
      // Resolve hostel/room/bunk from ALL possible backend field names
      const rawHostel =
        reservationData.hostel ||
        reservationData.assignedHostel ||
        reservationData.hostelDetails ||
        reservationData.hostelInfo;

      const rawRoom =
        reservationData.room ||
        reservationData.assignedRoom ||
        reservationData.roomDetails ||
        reservationData.roomInfo;

      const rawBunk =
        reservationData.bunk ||
        reservationData.assignedBunk ||
        reservationData.bunkDetails ||
        reservationData.bunkInfo;

      const mappedReservation = {
        ...reservationData,
        status: reservationData.reservationStatus || reservationData.status,
        reservedAt:
          reservationData.reservedAt ||
          reservationData.createdAt ||
          reservationData.reservationDate ||
          reservationData.dateReserved ||
          reservationData.date ||
          reservationData.updatedAt ||
          null,
        expiresAt:
          reservationData.expiresAt ||
          reservationData.expiredAt ||
          reservationData.expiry ||
          reservationData.expiryDate ||
          reservationData.reservationExpiry ||
          reservationData.validUntil ||
          reservationData.deadline ||
          null,
        checkedInAt:
          reservationData.checkedInAt ||
          reservationData.checkInDate ||
          reservationData.checkedIn ||
          null,
        student: reservationData.student || {
          firstName: profile?.firstName,
          lastName:  profile?.lastName,
          matricNo:  profile?.matricNumber || profile?.matricNo,
        },
        hostel: rawHostel ? {
          _id:       rawHostel._id,
          name:      rawHostel.name,
          code:      rawHostel.code,
          location:  rawHostel.location,
          gender:    rawHostel.gender,
          // backend may use level (number) OR allowedLevels (array)
          level:     rawHostel.level ?? rawHostel.allowedLevels?.[0],
          totalRooms: rawHostel.totalRooms ?? rawHostel.roomsCount,
        } : null,
        room: rawRoom ? {
          _id:              rawRoom._id,
          roomNumber:       rawRoom.roomNumber,
          floor:            rawRoom.floor,
          capacity:         rawRoom.capacity ?? 0,
          // currentOccupants now correctly counts reserved + occupied bunks
          currentOccupants: rawRoom.currentOccupants ?? (rawRoom.availableSpaces != null ? (rawRoom.capacity - rawRoom.availableSpaces) : 0),
        } : null,
        bunk: rawBunk ? {
          _id:        rawBunk._id,
          bunkNumber: rawBunk.bunkNumber ?? rawBunk.number,
          position:   rawBunk.position,
        } : null,
      };

      setReservation(mappedReservation);
    } catch (err: any) {
      console.error('Failed to fetch reservation:', err);
      console.error('Error response:', err.response?.data);
      
      // Handle rate limiting with retry
      if (err.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchStudentData(retryCount + 1);
      }
      
      if (err.response?.status === 404) {
        setError('No reservation found');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please refresh the page in a moment.');
      } else {
        setError('Failed to load reservation details');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // Handle underscore format from backend (e.g., 'checked_in')
    const normalizedStatus = status?.toLowerCase().replace('_', '-');
    
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any, label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      confirmed: { variant: 'default', icon: CheckCircle2, label: 'Confirmed' },
      'checked-in': { variant: 'default', icon: CheckCircle2, label: 'Checked In' },
      cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
      expired: { variant: 'outline', icon: AlertCircle, label: 'Expired' },
    };

    const config = statusConfig[normalizedStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading your reservation...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              My Reservation
            </h2>
            <p className="text-muted-foreground mt-1">
              View and manage your hostel room reservation
            </p>
          </div>

          {/* No Reservation State */}
          {!reservation && !loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Home className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Active Reservation</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {error === 'No reservation found' 
                      ? "You haven't reserved a room yet. Browse available hostels to make a reservation."
                      : error || "Start by browsing available hostels and selecting a room."}
                  </p>
                  <Button onClick={() => router.push('/student/hostels')}>
                    Browse Hostels
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reservation Details */}
          {reservation && (
            <>
              {/* Status Alert */}
              {reservation.status === 'pending' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your reservation is pending confirmation. Please ensure your payment has been made.
                  </AlertDescription>
                </Alert>
              )}

              {reservation.status === 'expired' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your reservation has expired. Please make a new reservation.
                  </AlertDescription>
                </Alert>
              )}

              {/* Reservation Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Reservation Status</CardTitle>
                      <CardDescription>Current status of your room reservation</CardDescription>
                    </div>
                    {getStatusBadge(reservation.status ?? 'pending')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Reserved On</p>
                      <p className="font-medium">
                        {reservation.reservedAt
                          ? formatDate(reservation.reservedAt)
                          : 'Date not provided by server'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Expires On</p>
                      <p className="font-medium">
                        {reservation.expiresAt
                          ? formatDate(reservation.expiresAt)
                          : 'Date not provided by server'}
                      </p>
                    </div>
                    {reservation.checkedInAt && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Checked In</p>
                        <p className="font-medium">{formatDate(reservation.checkedInAt)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Hostel Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Hostel Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Hostel Name</p>
                        <p className="text-lg font-semibold">
                          {reservation.hostel?.name || 'Not Available'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Level</p>
                        <p className="font-medium">
                          {reservation.hostel?.level
                            ? `${reservation.hostel.level} Level`
                            : reservation.hostel?.allowedLevels?.length
                              ? reservation.hostel.allowedLevels.map(l => `${l}L`).join(', ')
                              : 'Not Available'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Rooms
                        </p>
                        <p className="font-medium">
                          {reservation.hostel?.totalRooms ?? 'Not Available'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <Badge variant="outline" className="capitalize">
                          {reservation.hostel?.gender || 'Not Available'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Room Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    Room Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Room Number</p>
                        <p className="text-2xl font-bold">{reservation.room?.roomNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Floor</p>
                        <p className="font-medium">Floor {reservation.room?.floor || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Capacity
                        </p>
                        <p className="font-medium">{reservation.room?.capacity || 0} students</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Current Occupants</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{reservation.room?.currentOccupants || 0} / {reservation.room?.capacity || 0}</p>
                          <Badge variant={(reservation.room?.currentOccupants || 0) < (reservation.room?.capacity || 0) ? 'default' : 'secondary'}>
                            {(reservation.room?.currentOccupants || 0) < (reservation.room?.capacity || 0) ? 'Available' : 'Full'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {reservation.bunk && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-4">
                        <h4 className="font-semibold">Bunk Assignment</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Bunk Number</p>
                            <p className="font-medium">Bunk {reservation.bunk?.bunkNumber || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Position</p>
                            <Badge variant="outline" className="capitalize">
                              {reservation.bunk?.position || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Student Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">
                        {reservation.student?.firstName && reservation.student?.lastName 
                          ? `${reservation.student.firstName} ${reservation.student.lastName}`
                          : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not Available'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Matric Number</p>
                      <p className="font-medium">
                        {reservation.student?.matricNo || user?.matricNumber || user?.matricNo || 'Not Available'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
                {reservation.status === 'confirmed' && (
                  <Button onClick={() => router.push('/student/hostels')}>
                    View Hostel Details
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
