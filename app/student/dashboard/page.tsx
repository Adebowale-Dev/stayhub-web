'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentAPI } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Ticket, CreditCard, Building2, Home, FileText, Settings, CheckCircle2, Clock, AlertCircle, MapPin, Users, Bed } from 'lucide-react';

interface Reservation {
  _id: string;
  hostel: {
    name: string;
    location: string;
  };
  room: {
    roomNumber: string;
    floor: number;
  };
  status: string;
}

interface Payment {
  _id: string;
  amount: number;
  status: string;
  reference?: string;
  paymentDate?: string;
}

interface StudentDashboardData {
  hasReservation?: boolean;
  hasPaid?: boolean;
  availableHostels?: number;
  reservation?: Reservation;
  payment?: Payment;
  student?: {
    name: string;
    matricNumber: string;
    email: string;
    college?: string;
    department?: string;
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await studentAPI.getDashboard();
      setDashboardData(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getCompletionProgress = () => {
    let completed = 0;
    const total = 2; // Payment and Reservation
    
    if (dashboardData?.hasPaid) completed++;
    if (dashboardData?.hasReservation) completed++;
    
    return (completed / total) * 100;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const completionProgress = getCompletionProgress();

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome back, {dashboardData?.student?.name?.split(' ')[0] || 'Student'}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {dashboardData?.student?.matricNumber && `${dashboardData.student.matricNumber} • `}
                {dashboardData?.student?.department || 'Manage your hostel accommodation'}
              </p>
            </div>
            <ActionDropdown
              title="Quick Actions"
              actions={[
                {
                  label: 'Browse Hostels',
                  icon: Home,
                  onClick: () => router.push('/student/hostels'),
                },
                {
                  label: 'View Reservation',
                  icon: FileText,
                  onClick: () => router.push('/student/reservation'),
                  separator: true,
                },
                {
                  label: 'Settings',
                  icon: Settings,
                  onClick: () => router.push('/student/settings'),
                },
              ]}
            />
          </div>

          {/* Progress Overview */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Setup Progress</CardTitle>
                  <CardDescription>Complete your accommodation setup</CardDescription>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completionProgress}%
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={completionProgress} className="h-3" />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    dashboardData?.hasPaid 
                      ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {dashboardData?.hasPaid ? <CheckCircle2 className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Payment</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {dashboardData?.hasPaid ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    dashboardData?.hasReservation 
                      ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {dashboardData?.hasReservation ? <CheckCircle2 className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Reservation</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {dashboardData?.hasReservation ? 'Active' : 'Not started'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Reservation Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>Reservation Status</CardDescription>
                  <Ticket className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">
                    {dashboardData?.hasReservation ? 'Active' : 'No Reservation'}
                  </CardTitle>
                  {dashboardData?.reservation && (
                    <Badge variant="outline" className={getStatusColor(dashboardData.reservation.status)}>
                      {getStatusIcon(dashboardData.reservation.status)}
                      <span className="ml-1 capitalize">{dashboardData.reservation.status}</span>
                    </Badge>
                  )}
                </div>
                {dashboardData?.reservation ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Building2 className="h-4 w-4" />
                      <span>{dashboardData.reservation.hostel.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Bed className="h-4 w-4" />
                      <span>Room {dashboardData.reservation.room.roomNumber}, Floor {dashboardData.reservation.room.floor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{dashboardData.reservation.hostel.location}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Browse available hostels to make a reservation
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Payment Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>Payment Status</CardDescription>
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">
                    {dashboardData?.hasPaid ? 'Paid' : 'Pending'}
                  </CardTitle>
                  {dashboardData?.payment && (
                    <Badge variant="outline" className={getStatusColor(dashboardData.payment.status)}>
                      {getStatusIcon(dashboardData.payment.status)}
                      <span className="ml-1 capitalize">{dashboardData.payment.status}</span>
                    </Badge>
                  )}
                </div>
                {dashboardData?.payment ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₦{dashboardData.payment.amount.toLocaleString()}
                      </span>
                    </div>
                    {dashboardData.payment.reference && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Reference:</span>
                        <span className="font-mono text-xs text-gray-900 dark:text-white">
                          {dashboardData.payment.reference}
                        </span>
                      </div>
                    )}
                    {dashboardData.payment.paymentDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Date:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(dashboardData.payment.paymentDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Payment required to proceed
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Available Hostels Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>Available Hostels</CardDescription>
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardTitle className="text-2xl">
                  {dashboardData?.availableHostels || 0}
                </CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Home className="h-4 w-4" />
                    <span>Hostels ready for booking</span>
                  </div>
                  {dashboardData?.availableHostels && dashboardData.availableHostels > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => router.push('/student/hostels')}
                    >
                      Browse Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {!dashboardData?.hasPaid && (
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => router.push('/student/payment')}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Make Payment
              </Button>
            )}
            {!dashboardData?.hasReservation && dashboardData?.hasPaid && (
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => router.push('/student/hostels')}
              >
                <Home className="mr-2 h-5 w-5" />
                Browse Hostels
              </Button>
            )}
            {dashboardData?.hasReservation && (
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/student/reservation')}
              >
                <FileText className="mr-2 h-5 w-5" />
                View Reservation Details
              </Button>
            )}
          </div>

          {/* Next Steps Card */}
          {(!dashboardData?.hasPaid || !dashboardData?.hasReservation) && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!dashboardData?.hasPaid && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/30">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Complete Payment</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pay your accommodation fee to unlock hostel selection
                        </p>
                      </div>
                    </div>
                  )}
                  {!dashboardData?.hasReservation && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/30">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {dashboardData?.hasPaid ? '1' : '2'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Select Your Hostel</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {dashboardData?.hasPaid 
                            ? 'Browse available hostels and make your reservation' 
                            : 'Available after payment completion'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
