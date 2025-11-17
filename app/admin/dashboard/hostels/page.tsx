"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Building2,
  Search,
  AlertCircle,
  CheckCircle,
  Users,
  DoorOpen,
  Download,
  Upload,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AddHostelDialog } from "@/components/AddHostelDialog";
import { EditHostelDialog } from "@/components/EditHostelDialog";
import { adminAPI } from "@/services/api";

interface Hostel {
  _id: string;
  name: string;
  code?: string; // Optional since backend doesn't always return it
  location?: string; // Optional since backend doesn't always return it
  level?: number; // Backend uses 'level' instead of 'allowedLevels'
  gender: "male" | "female" | "mixed";
  allowedLevels?: number[]; // Optional for backwards compatibility
  isActive: boolean;
  occupiedRooms?: number;
  availableRooms?: number;
  totalRooms?: number;
  description?: string;
  porter?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  occupancyStats?: {
    totalRooms: number;
    porterCount: number;
  };
}

function HostelsPageContent() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [hostelToEdit, setHostelToEdit] = useState<Hostel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hostelToDelete, setHostelToDelete] = useState<Hostel | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadHostels();
  }, []);

  const loadHostels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getHostels();
      console.log("Backend response:", response.data);
      const hostelsData = response.data.data || response.data.hostels || response.data;
      console.log("Hostels data:", hostelsData);
      if (hostelsData.length > 0) {
        console.log("First hostel fields:", Object.keys(hostelsData[0]));
        console.log("First hostel full data:", hostelsData[0]);
      }
      setHostels(Array.isArray(hostelsData) ? hostelsData : []);
    } catch (err) {
      console.error("Failed to load hostels:", err);
      setError("Failed to load hostels. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredHostels = hostels.filter((hostel) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = hostel.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Gender filter
    if (genderFilter !== "all" && hostel.gender !== genderFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active" && !hostel.isActive) return false;
      if (statusFilter === "inactive" && hostel.isActive) return false;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: hostels.length,
    active: hostels.filter((h) => h.isActive).length,
    inactive: hostels.filter((h) => !h.isActive).length,
    male: hostels.filter((h) => h.gender === "male").length,
    female: hostels.filter((h) => h.gender === "female").length,
    totalRooms: hostels.reduce((sum, h) => sum + (h.totalRooms || 0), 0),
    totalPorters: hostels.reduce((sum, h) => sum + ((h.porter ? 1 : 0) || h.occupancyStats?.porterCount || 0), 0),
  };

  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case "male":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "female":
        return "bg-pink-500/10 text-pink-600 border-pink-500/20";
      case "mixed":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
    setStatusFilter("all");
  };

  const handleAddSuccess = async () => {
    await loadHostels();
  };

  const handleEditClick = (hostel: Hostel) => {
    setHostelToEdit(hostel);
    setEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    await loadHostels();
  };

  const handleDeleteClick = (hostel: Hostel) => {
    setHostelToDelete(hostel);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!hostelToDelete) return;

    setDeleting(true);
    try {
      console.log("Deleting hostel:", hostelToDelete);
      console.log("Hostel ID:", hostelToDelete._id);
      console.log("Delete URL will be:", `/admin/hostels/${hostelToDelete._id}`);
      
      // Try to verify the hostel exists first
      try {
        const checkResponse = await adminAPI.getHostels();
        console.log("Get hostels response:", checkResponse.data);
        const hostelsList = checkResponse.data.hostels || checkResponse.data.data || checkResponse.data;
        const exists = Array.isArray(hostelsList) ? hostelsList.some((h: Hostel) => h._id === hostelToDelete._id) : false;
        console.log("Hostel exists in list:", exists);
      } catch (e) {
        console.log("Could not verify hostel existence:", e);
      }
      
      const response = await adminAPI.deleteHostel(hostelToDelete._id);
      console.log("Delete response:", response.data);
      await loadHostels();
      setDeleteDialogOpen(false);
      setHostelToDelete(null);
    } catch (error) {
      console.error("Failed to delete hostel:", error);
      
      // Log full error details
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number;
            statusText?: string;
            data?: unknown;
          };
          config?: {
            url?: string;
            method?: string;
            baseURL?: string;
          }
        };
        console.error("Base URL:", axiosError.config?.baseURL);
        console.error("Request URL:", axiosError.config?.url);
        console.error("Full URL:", `${axiosError.config?.baseURL}${axiosError.config?.url}`);
        console.error("Request method:", axiosError.config?.method);
        console.error("Response status:", axiosError.response?.status);
        console.error("Response statusText:", axiosError.response?.statusText);
        console.error("Response data:", axiosError.response?.data);
      }
      
      let errorMessage = "Failed to delete hostel. Please try again.";
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
        errorMessage = axiosError.response?.data?.message || 
                      axiosError.response?.data?.error || 
                      errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">{/* Header */}
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground">Hostels Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all hostels and their accommodations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadHostels}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Implement export */}}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Implement bulk upload */}}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                size="sm"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Hostel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.male}</p>
                <p className="text-xs text-muted-foreground">Male</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.female}</p>
                <p className="text-xs text-muted-foreground">Female</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <DoorOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalRooms}</p>
                <p className="text-xs text-muted-foreground">Rooms</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalPorters}</p>
                <p className="text-xs text-muted-foreground">Porters</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 border shadow-none">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>
              {(searchQuery || genderFilter !== "all" || statusFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Gender Filter */}
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male Only</SelectItem>
                  <SelectItem value="female">Female Only</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Hostels Table */}
        <Card className="border shadow-none">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading hostels...</p>
              </div>
            ) : filteredHostels.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No hostels found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || genderFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters to see more results"
                    : "Get started by adding your first hostel"}
                </p>
                {!searchQuery && genderFilter === "all" && statusFilter === "all" && (
                  <Button onClick={() => setAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Hostel
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12 font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="text-center font-semibold">Gender</TableHead>
                      <TableHead className="text-center font-semibold hidden md:table-cell">Level</TableHead>
                      <TableHead className="text-center font-semibold hidden lg:table-cell">Total Rooms</TableHead>
                      <TableHead className="text-center font-semibold hidden xl:table-cell">Porters</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHostels.map((hostel, index) => {
                      return (
                        <TableRow key={hostel._id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{hostel.name}</span>
                              {hostel.description && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {hostel.description}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium capitalize ${getGenderBadgeColor(
                                hostel.gender
                              )}`}
                            >
                              {hostel.gender}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <Badge variant="secondary" className="text-xs font-semibold">
                              {hostel.level}L
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center hidden lg:table-cell">
                            <div className="flex items-center justify-center gap-1">
                              <DoorOpen className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-semibold">{hostel.totalRooms}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center hidden xl:table-cell">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{hostel.occupancyStats?.porterCount || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={hostel.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {hostel.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleEditClick(hostel)}
                                aria-label="Edit Hostel"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDeleteClick(hostel)}
                                aria-label="Delete Hostel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Results Summary */}
                <div className="px-4 py-3 border-t bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filteredHostels.length}</span> of{" "}
                    <span className="font-medium text-foreground">{hostels.length}</span> hostels
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Add Hostel Modal */}
      <AddHostelDialog
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={handleAddSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Delete Hostel
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{hostelToDelete?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Hostel Dialog */}
      <EditHostelDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        hostel={hostelToEdit}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

export default function HostelsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <HostelsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
