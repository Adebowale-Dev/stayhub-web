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
import { Label } from '@/components/ui/label';
import { UserCheck, Search, Building2, Mail, Phone, UserPlus } from 'lucide-react';

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
  assignedHostel?: {
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedPorter, setSelectedPorter] = useState<Porter | null>(null);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [creating, setCreating] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [newPorter, setNewPorter] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    hostelId: '',
  });

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

  const handleCreatePorter = async () => {
    if (!newPorter.name || !newPorter.email || !newPorter.password) {
      alert('Please fill in all required fields (Name, Email, Password)');
      return;
    }

    setCreating(true);
    try {
      // Split name into firstName and lastName
      const nameParts = newPorter.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

      await adminAPI.createPorter({
        firstName,
        lastName,
        email: newPorter.email,
        password: newPorter.password,
        phoneNumber: newPorter.phoneNumber,
        hostelId: newPorter.hostelId || undefined,
      });
      alert('Porter created successfully!');
      setCreateDialogOpen(false);
      setNewPorter({ name: '', email: '', password: '', phoneNumber: '', hostelId: '' });
      loadData();
    } catch (error: unknown) {
      console.error('Failed to create porter:', error);
      const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
      const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Failed to create porter';
      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleReassignClick = (porter: Porter) => {
    setSelectedPorter(porter);
    setSelectedHostelId(porter.assignedHostel?._id || porter.hostel?._id || '');
    setReassignDialogOpen(true);
  };

  const handleReassignHostel = async () => {
    if (!selectedPorter || !selectedHostelId) {
      alert('Please select a hostel');
      return;
    }

    setReassigning(true);
    try {
      await adminAPI.reassignHostel(selectedPorter._id, selectedHostelId);
      alert('Hostel assigned successfully!');
      setReassignDialogOpen(false);
      setSelectedPorter(null);
      setSelectedHostelId('');
      loadData();
    } catch (error: unknown) {
      console.error('Failed to assign hostel:', error);
      const axiosError = error as { response?: { data?: { message?: string; error?: string }; status?: number } };
      const errorMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Failed to assign hostel';
      alert(`Error: ${errorMessage}`);
    } finally {
      setReassigning(false);
    }
  };

  const filteredPorters = porters.filter((porter) => {
    const matchesSearch = 
      (porter.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (porter.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const stats = {
    total: porters.length,
    withHostels: porters.filter(p => p.assignedHostel || p.hostel).length,
    withoutHostels: porters.filter(p => !p.assignedHostel && !p.hostel).length,
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
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Porter Management
              </h2>
              <p className="text-muted-foreground mt-1">
                Create porter accounts and manage hostel assignments
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Create Porter
            </Button>
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
                  <span>All porters</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>With Assigned Hostels</CardDescription>
                <CardTitle className="text-2xl">{stats.withHostels}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Assigned to hostels</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Without Hostels</CardDescription>
                <CardTitle className="text-2xl">{stats.withoutHostels}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>Awaiting assignment</span>
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
                        <TableHead>Created</TableHead>
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
                            {(porter.assignedHostel || porter.hostel) ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>{porter.assignedHostel?.name || porter.hostel?.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(porter.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {(porter.assignedHostel || porter.hostel) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReassignClick(porter)}
                                >
                                  <Building2 className="h-4 w-4 mr-2" />
                                  Reassign
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleReassignClick(porter)}
                                >
                                  <Building2 className="h-4 w-4 mr-2" />
                                  Assign Hostel
                                </Button>
                              )}
                            </div>
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

        {/* Create Porter Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Porter</DialogTitle>
              <DialogDescription>
                Create a porter account and optionally assign to a hostel
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="porter-name">Name *</Label>
                <Input
                  id="porter-name"
                  placeholder="Enter porter name"
                  value={newPorter.name}
                  onChange={(e) => setNewPorter({ ...newPorter, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="porter-email">Email *</Label>
                <Input
                  id="porter-email"
                  type="email"
                  placeholder="Enter email address"
                  value={newPorter.email}
                  onChange={(e) => setNewPorter({ ...newPorter, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="porter-password">Password *</Label>
                <Input
                  id="porter-password"
                  type="password"
                  placeholder="Enter password"
                  value={newPorter.password}
                  onChange={(e) => setNewPorter({ ...newPorter, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="porter-phone">Phone Number</Label>
                <Input
                  id="porter-phone"
                  placeholder="Enter phone number (optional)"
                  value={newPorter.phoneNumber}
                  onChange={(e) => setNewPorter({ ...newPorter, phoneNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="porter-hostel">Assign to Hostel (Optional)</Label>
                <Select value={newPorter.hostelId || undefined} onValueChange={(value) => setNewPorter({ ...newPorter, hostelId: value })}>
                  <SelectTrigger id="porter-hostel">
                    <SelectValue placeholder="No hostel (assign later)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHostels.map((hostel) => (
                      <SelectItem key={hostel._id} value={hostel._id}>
                        {hostel.name} ({hostel.gender})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You can assign a hostel now or do it later
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewPorter({ name: '', email: '', password: '', phoneNumber: '', hostelId: '' });
                }}
                className="flex-1"
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePorter}
                className="flex-1"
                disabled={!newPorter.name || !newPorter.email || !newPorter.password || creating}
              >
                {creating ? 'Creating...' : 'Create Porter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reassign Hostel Dialog */}
        <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Hostel</DialogTitle>
              <DialogDescription>
                Assign a hostel to {selectedPorter?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Porter Details</label>
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <p className="font-medium">{selectedPorter?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPorter?.email}</p>
                  {selectedPorter?.hostel && (
                    <p className="text-sm text-muted-foreground">
                      Current: <span className="font-medium">{selectedPorter.hostel.name}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reassign-hostel">Select Hostel</Label>
                <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                  <SelectTrigger id="reassign-hostel">
                    <SelectValue placeholder="Select a hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPorter?.hostel && (
                      <SelectItem value={selectedPorter.hostel._id}>
                        {selectedPorter.hostel.name} (Current)
                      </SelectItem>
                    )}
                    {availableHostels.map((hostel) => (
                      <SelectItem key={hostel._id} value={hostel._id}>
                        {hostel.name} ({hostel.gender})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a hostel for this porter
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setReassignDialogOpen(false);
                  setSelectedPorter(null);
                  setSelectedHostelId('');
                }}
                className="flex-1"
                disabled={reassigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassignHostel}
                className="flex-1"
                disabled={!selectedHostelId || reassigning}
              >
                {reassigning ? 'Assigning...' : 'Assign Hostel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
