'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentAPI } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Ticket, CreditCard, Building2, Home, FileText, Settings } from 'lucide-react';

interface StudentDashboardData {
  hasReservation?: boolean;
  hasPaid?: boolean;
  availableHostels?: number;
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

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Student Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your hostel accommodation and reservations</p>
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Reservation Status</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.hasReservation ? 'Active' : 'No Reservation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Ticket className="h-4 w-4" />
                  <span>{dashboardData?.hasReservation ? 'You have an active reservation' : 'Browse hostels to make a reservation'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Payment Status</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.hasPaid ? 'Paid' : 'Pending'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CreditCard className="h-4 w-4" />
                  <span>{dashboardData?.hasPaid ? 'Payment completed' : 'Payment required'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Available Hostels</CardDescription>
                <CardTitle className="text-2xl">
                  {dashboardData?.availableHostels || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  <span>Hostels ready for booking</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Button onClick={() => router.push('/student/hostels')}>Browse Hostels</Button>
            <Button variant="outline" onClick={() => router.push('/student/reservation')}>View Reservation</Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
