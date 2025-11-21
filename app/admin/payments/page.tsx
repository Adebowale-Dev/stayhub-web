'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Search, CheckCircle, Clock, X, TrendingUp } from 'lucide-react';

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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [amountDialogOpen, setAmountDialogOpen] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [updatingAmount, setUpdatingAmount] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Try to load payments
      let paymentsData: Payment[] = [];
      try {
        const paymentsResponse = await adminAPI.getPayments();
        paymentsData = paymentsResponse.data.data || paymentsResponse.data || [];
        setPayments(paymentsData);
      } catch (paymentError) {
        console.error('Failed to load payments:', paymentError);
        // Continue even if payments fail
      }
      
      // Try to load stats separately
      try {
        const statsResponse = await adminAPI.getPaymentStats();
        const statsData = statsResponse.data.data || statsResponse.data || {};
        setStats(statsData);
      } catch (statsError) {
        console.error('Failed to load payment stats:', statsError);
        console.log('Using fallback stats calculation from payment data');
        // Stats will remain null, fallback calculation will be used
      }
      
      // Try to get current payment amount from dedicated endpoint
      try {
        const amountResponse = await adminAPI.getPaymentAmount();
        const amount = amountResponse.data.data?.amount || amountResponse.data?.amount;
        if (amount) {
          setCurrentAmount(amount);
        }
      } catch {
        console.log('Payment amount endpoint not available, using fallback');
        // Fallback: Get current payment amount from first payment
        if (paymentsData.length > 0) {
          setCurrentAmount(paymentsData[0].amount || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load payments data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAmount = async () => {
    const amount = parseFloat(newAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setUpdatingAmount(true);
    try {
      console.log('Updating payment amount to:', amount);
      const response = await adminAPI.setPaymentAmount(amount);
      console.log('Payment amount update response:', response);
      
      // Verify the amount was saved by fetching it back
      try {
        const verifyResponse = await adminAPI.getPaymentAmount();
        const savedAmount = verifyResponse.data.data?.amount || verifyResponse.data?.amount;
        console.log('Verified saved amount:', savedAmount);
        
        if (savedAmount) {
          setCurrentAmount(savedAmount);
        } else {
          setCurrentAmount(amount);
        }
      } catch {
        // If verification fails, just use the amount we sent
        setCurrentAmount(amount);
      }
      
      alert('Payment amount updated successfully!');
      setAmountDialogOpen(false);
      setNewAmount('');
      
      // Reload payment data to ensure everything is in sync
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to update amount:', err);
      
      const error = err as { response?: { data?: { message?: string; error?: string; status?: number } }; message?: string };
      console.error('Error response:', error?.response?.data);
      
      // Check if it's a 404 (endpoint not implemented)
      if (error?.response?.data?.status === 404) {
        alert('⚠️ Payment amount configuration is not yet implemented in the backend.\n\nPlease ask the backend developer to implement:\nPOST /api/admin/payment/set-amount\nGET /api/admin/payment/amount');
      } else {
        const errorMessage = error?.response?.data?.message || 
                            error?.response?.data?.error || 
                            error?.message || 
                            'Failed to update payment amount. Please try again.';
        
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setUpdatingAmount(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      (payment.student?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (payment.student?.matricNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (payment.student?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (payment.reference?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const displayStats = {
    totalRevenue: stats?.totalRevenue || payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    totalPaid: stats?.totalPaid || payments.filter(p => p.status === 'completed').length,
    totalPending: stats?.totalPending || payments.filter(p => p.status === 'pending').length,
    totalFailed: stats?.totalFailed || payments.filter(p => p.status === 'failed').length,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Payment Management
              </h2>
              <p className="text-muted-foreground mt-1">
                Track student payments and manage payment settings
              </p>
            </div>
            <Button onClick={() => setAmountDialogOpen(true)}>
              Set Payment Amount
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-2xl">
                  ₦{displayStats.totalRevenue.toLocaleString()}
                </CardTitle>
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
                <CardDescription>Completed Payments</CardDescription>
                <CardTitle className="text-2xl">{displayStats.totalPaid}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Successfully paid</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending Payments</CardDescription>
                <CardTitle className="text-2xl">{displayStats.totalPending}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Awaiting payment</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Failed Payments</CardDescription>
                <CardTitle className="text-2xl">{displayStats.totalFailed}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span>Payment failed</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Payment Amount */}
          {currentAmount > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Payment Amount</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ₦{currentAmount.toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setAmountDialogOpen(true)}>
                    Update Amount
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, matric number, email, or reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>
                {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No payments found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Matric Number</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment, index) => (
                        <TableRow key={payment._id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.student?.name || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">{payment.student?.email || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {payment.student?.matricNumber || 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₦{payment.amount.toLocaleString()}
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
                          <TableCell>
                            {payment.status === 'pending' && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            {payment.status === 'completed' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                            {payment.status === 'failed' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <X className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.paymentDate 
                              ? new Date(payment.paymentDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : new Date(payment.createdAt).toLocaleDateString()
                            }
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

        {/* Set Payment Amount Dialog */}
        <Dialog open={amountDialogOpen} onOpenChange={setAmountDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Payment Amount</DialogTitle>
              <DialogDescription>
                Update the hostel accommodation fee for students
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {currentAmount > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Amount</p>
                  <p className="text-xl font-bold">₦{currentAmount.toLocaleString()}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">New Payment Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="Enter amount (e.g., 50000)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground">
                  This amount will automatically update for all students who haven&apos;t paid yet
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setAmountDialogOpen(false)}
                className="flex-1"
                disabled={updatingAmount}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAmount}
                className="flex-1"
                disabled={!newAmount || updatingAmount}
              >
                {updatingAmount ? 'Updating...' : 'Update Amount'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
