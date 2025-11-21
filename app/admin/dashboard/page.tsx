'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CreditCard, Building2, DoorOpen, CheckCircle, Clock, UserCheck, ArrowRight, FileText } from 'lucide-react';
import useAdminStore from '@/store/useAdminStore';
import { adminAPI } from '@/services/api';

export default function AdminDashboard() {
    const router = useRouter();
    const { dashboardStats, statsLoading, setDashboardStats, setStatsLoading } = useAdminStore();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setStatsLoading(true);
                const response = await adminAPI.getDashboard();
                setDashboardStats(response.data.data);
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchDashboardData();
    }, [setDashboardStats, setStatsLoading]);

    if (statsLoading) {
        return (
            <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Admin Dashboard
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Welcome back! Here&apos;s an overview of the system.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <CardDescription>Total Students</CardDescription>
                                <CardTitle className="text-2xl">{dashboardStats?.totalStudents || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Registered students</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription>Students Paid</CardDescription>
                                <CardTitle className="text-2xl">{dashboardStats?.studentsPaid || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CreditCard className="h-4 w-4" />
                                    <span>Payment completed</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription>Total Hostels</CardDescription>
                                <CardTitle className="text-2xl">{dashboardStats?.totalHostels || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    <span>Active hostels</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription>Total Rooms</CardDescription>
                                <CardTitle className="text-2xl">{dashboardStats?.totalRooms || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <DoorOpen className="h-4 w-4" />
                                    <span>Available rooms</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <CardDescription>Occupied Rooms</CardDescription>
                                <CardTitle className="text-2xl">{dashboardStats?.occupiedRooms || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Currently occupied</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription>Available Rooms</CardDescription>
                                <CardTitle className="text-2xl">{dashboardStats?.availableRooms || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Ready for booking</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription>Pending Payments</CardDescription>
                                <CardTitle className="text-2xl">{dashboardStats?.studentsPending || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Awaiting payment</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardDescription>Total Porters</CardDescription>
                                <CardTitle className="text-2xl">{dashboardStats?.totalPorters || 0}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <UserCheck className="h-4 w-4" />
                                    <span>Approved porters</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Common administrative tasks</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={() => router.push('/admin/dashboard/students')}
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage Students
                                </Button>
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={() => router.push('/admin/colleges')}
                                >
                                    <Building2 className="mr-2 h-4 w-4" />
                                    Manage Colleges
                                </Button>
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={() => router.push('/admin/dashboard/hostels')}
                                >
                                    <Building2 className="mr-2 h-4 w-4" />
                                    Manage Hostels
                                </Button>
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={() => router.push('/admin/porters')}
                                >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Manage Porters
                                </Button>
                                <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={() => router.push('/admin/reports')}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Reports
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Overview</CardTitle>
                                <CardDescription>Student payment status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Total Students</span>
                                        <span className="text-sm text-muted-foreground">
                                            {dashboardStats?.totalStudents || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Paid</span>
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                            {dashboardStats?.studentsPaid || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Pending</span>
                                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                            {dashboardStats?.studentsPending || 0}
                                        </span>
                                    </div>
                                    <Button
                                        className="w-full mt-4"
                                        onClick={() => router.push('/admin/payments')}
                                    >
                                        View All Payments
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
