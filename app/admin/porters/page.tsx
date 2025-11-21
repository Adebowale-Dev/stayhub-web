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
import { UserCheck, Search, CheckCircle, Clock, Building2, Mail, Phone } from 'lucide-react';

interface Porter {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  hostel?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Hostel {
  _id: string;
  name: string;
  gender: 'male' | 'female' | 'mixed';
  porter?: {
    _id: string;
    name: string;
  };
}

export default function PortersPage() {
  const [porters, setPorters] = useState<Porter[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedPorter, setSelectedPorter] = useState<Porter | null>(null);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [portersResponse, hostelsResponse] = await Promise.all([
        adminAPI.getPorters(),
        adminAPI.getHostels(),
      ]);
      
      setPorters(portersResponse.data.data || portersResponse.data || []);
      setHostels(hostelsResponse.data.data || hostelsResponse.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (porter: Porter) => {
    setSelectedPorter(porter);
    setSelectedHostelId('');
    setApproveDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPorter || !selectedHostelId) {
      alert('Please select a hostel');
      return;
    }

    setApproving(true);
    try {
      await adminAPI.approvePorter(selectedPorter._id, selectedHostelId);
      alert('Porter approved successfully!');
      setApproveDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to approve porter:', error);
      alert('Failed to approve porter. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const filteredPorters = porters.filter((porter) => {
    const matchesSearch = 
      (porter.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (porter.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || porter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: porters.length,
    pending: porters.filter(p => p.status === 'pending').length,
    approved: porters.filter(p => p.status === 'approved').length,
  };

  // Get available hostels (without assigned porter)
  const availableHostels = hostels.filter(h => !h.porter);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading porters...</p>
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
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Porter Management
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage porter applications and hostel assignments
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Porters</CardDescription>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCheck className="h-4 w-4" />
                  <span>All porter applications</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending Approval</CardDescription>
                <CardTitle className="text-2xl">{stats.pending}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Awaiting approval</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Approved Porters</CardDescription>
                <CardTitle className="text-2xl">{stats.approved}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Active porters</span>
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
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value as 'all' | 'pending' | 'approved')}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Porters Table */}
          <Card>
            <CardHeader>
              <CardTitle>Porters</CardTitle>
              <CardDescription>
                {filteredPorters.length} porter{filteredPorters.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPorters.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No porters found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Assigned Hostel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPorters.map((porter, index) => (
                        <TableRow key={porter._id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{porter.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{porter.email}</span>
                              </div>
                              {porter.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{porter.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {porter.hostel ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>{porter.hostel.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {porter.status === 'pending' && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                Pending
                              </Badge>
                            )}
                            {porter.status === 'approved' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Approved
                              </Badge>
                            )}
                            {porter.status === 'rejected' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(porter.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {porter.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveClick(porter)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            )}
                            {porter.status === 'approved' && porter.hostel && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
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

        {/* Approve Porter Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Porter</DialogTitle>
              <DialogDescription>
                Assign {selectedPorter?.name} to a hostel
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Porter Details</label>
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <p className="font-medium">{selectedPorter?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPorter?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Hostel</label>
                <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHostels.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No available hostels (all have assigned porters)
                      </div>
                    ) : (
                      availableHostels.map((hostel) => (
                        <SelectItem key={hostel._id} value={hostel._id}>
                          {hostel.name} ({hostel.gender})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only hostels without assigned porters are shown
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setApproveDialogOpen(false)}
                className="flex-1"
                disabled={approving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                className="flex-1"
                disabled={!selectedHostelId || approving}
              >
                {approving ? 'Approving...' : 'Approve & Assign'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
