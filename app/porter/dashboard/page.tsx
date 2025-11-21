'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { porterAPI } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Home,
  UserCheck,
  UserX,
  AlertCircle,
  TrendingUp,
  Calendar,
  Shield
} from 'lucide-react';

interface PorterDashboardData {
  totalStudents?: number;
  checkedIn?: number;
  pendingCheckIn?: number;
  hostelName?: string;
  hostelCapacity?: number;
  todayCheckIns?: number;
  recentActivity?: Array<{
    _id: string;
    studentName: string;
    action: string;
    timestamp: string;
  }>;
}

export default function PorterDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<PorterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await porterAPI.getDashboard();
      setDashboardData(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['porter']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const checkInPercentage = dashboardData?.totalStudents 
    ? Math.round((dashboardData.checkedIn || 0) / dashboardData.totalStudents * 100)
    : 0;

  const occupancyPercentage = dashboardData?.hostelCapacity
    ? Math.round((dashboardData.totalStudents || 0) / dashboardData.hostelCapacity * 100)
    : 0;

  return (
    <ProtectedRoute allowedRoles={['porter']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Porter Dashboard
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {dashboardData?.hostelName || 'Hostel'} - Manage student check-ins and operations
            </p>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Students */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium">Total Students</CardDescription>
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white">
                    {dashboardData?.totalStudents || 0}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Home className="h-3 w-3" />
                    <span>Assigned to hostel</span>
                  </div>
                  {dashboardData?.hostelCapacity && (
                    <Badge variant="outline" className="text-xs">
                      {occupancyPercentage}% Occupancy
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Checked In */}
            <Card className="border-2 hover:shadow-lg transition-shadow border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-green-700 dark:text-green-400">Checked In</CardDescription>
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <CardTitle className="text-4xl font-bold text-green-700 dark:text-green-400">
                    {dashboardData?.checkedIn || 0}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                    <UserCheck className="h-3 w-3" />
                    <span>Successfully checked in</span>
                  </div>
                  {dashboardData?.totalStudents && (
                    <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                      {checkInPercentage}% Complete
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Check-in */}
            <Card className="border-2 hover:shadow-lg transition-shadow border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Pending</CardDescription>
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <CardTitle className="text-4xl font-bold text-yellow-700 dark:text-yellow-400">
                    {dashboardData?.pendingCheckIn || 0}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                    <UserX className="h-3 w-3" />
                    <span>Awaiting check-in</span>
                  </div>
                  {dashboardData?.pendingCheckIn && dashboardData.pendingCheckIn > 0 && (
                    <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">
                      Action Required
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Check-ins */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium">Today&apos;s Check-ins</CardDescription>
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white">
                    {dashboardData?.todayCheckIns || 0}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>Checked in today</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Manage your daily porter operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button 
                  className="h-24 flex flex-col gap-2 text-base"
                  onClick={() => router.push('/porter/checkin')}
                >
                  <UserCheck className="h-6 w-6" />
                  <span>Check-in Student</span>
                </Button>
                <Button 
                  variant="outline"
                  className="h-24 flex flex-col gap-2 text-base"
                  onClick={() => router.push('/porter/students')}
                >
                  <Users className="h-6 w-6" />
                  <span>View All Students</span>
                </Button>
                <Button 
                  variant="outline"
                  className="h-24 flex flex-col gap-2 text-base"
                  onClick={() => router.push('/porter/pending')}
                >
                  <Clock className="h-6 w-6" />
                  <span>Pending Check-ins</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest check-ins and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentActivity.map((activity) => (
                    <div 
                      key={activity._id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{activity.studentName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{activity.action}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Porter Responsibilities
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    As a porter, you are responsible for checking in students, maintaining hostel records, 
                    and ensuring smooth daily operations. For any issues or emergencies, contact the hostel administrator immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
