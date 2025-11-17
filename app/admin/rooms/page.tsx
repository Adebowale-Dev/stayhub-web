"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  DoorOpen,
  Search,
  AlertCircle,
  CheckCircle,
  Users,
  Building2,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  Bed,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { adminAPI } from "@/services/api";
import { AddRoomDialog } from "@/components/AddRoomDialog";
import { EditRoomDialog } from "@/components/EditRoomDialog";

interface Hostel {
  _id: string;
  name: string;
  gender: "male" | "female" | "mixed";
  totalRooms?: number;
  level?: number;
}

interface Room {
  _id: string;
  roomNumber: string;
  hostel: {
    _id: string;
    name: string;
    gender?: "male" | "female" | "mixed";
  };
  capacity: number;
  currentOccupants: number;
  level: number;
  status?: string; // e.g., 'available', 'occupied'
  isActive: boolean;
  totalBunks?: number;
  availableSpaces?: number;
  students?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    matricNumber: string;
  }>;
}

interface HostelWithRooms {
  hostel: Hostel;
  rooms: Room[];
  stats: {
    total: number;
    male: number;
    female: number;
    mixed: number;
    available: number;
    occupied: number;
    totalCapacity: number;
    currentOccupancy: number;
  };
}

function RoomsPageContent() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both hostels and rooms
      const [hostelsResponse, roomsResponse] = await Promise.all([
        adminAPI.getHostels(),
        adminAPI.getRooms(),
      ]);
      
      console.log("Hostels API response:", hostelsResponse.data);
      console.log("Rooms API response:", roomsResponse.data);
      
      const hostelsData = hostelsResponse.data.data || hostelsResponse.data;
      const roomsData = roomsResponse.data.data || roomsResponse.data;
      
      console.log("Parsed rooms data:", roomsData);
      if (roomsData.length > 0) {
        console.log("First room structure:", roomsData[0]);
        console.log("All room keys:", Object.keys(roomsData[0]));
        console.log("Room fields:", {
          gender: roomsData[0].gender,
          floor: roomsData[0].floor,
          level: roomsData[0].level,
          currentOccupants: roomsData[0].currentOccupants,
          capacity: roomsData[0].capacity,
          roomType: roomsData[0].roomType,
          isAvailable: roomsData[0].isAvailable
        });
      }
      
      setHostels(Array.isArray(hostelsData) ? hostelsData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Group rooms by hostel
  const groupedData: HostelWithRooms[] = hostels.map((hostel) => {
    const hostelRooms = rooms.filter((room) => room.hostel?._id === hostel._id);
    
    return {
      hostel,
      rooms: hostelRooms,
      stats: {
        total: hostelRooms.length,
        male: hostelRooms.filter((r) => r.hostel?.gender === "male").length,
        female: hostelRooms.filter((r) => r.hostel?.gender === "female").length,
        mixed: hostelRooms.filter((r) => r.hostel?.gender === "mixed").length,
        available: hostelRooms.filter((r) => (r.availableSpaces ?? 0) > 0).length,
        occupied: hostelRooms.filter((r) => (r.currentOccupants ?? 0) > 0).length,
        totalCapacity: hostelRooms.reduce((sum, r) => sum + (r.capacity || 0), 0),
        currentOccupancy: hostelRooms.reduce((sum, r) => sum + (r.currentOccupants || 0), 0),
      },
    };
  });

  // Calculate global statistics
  const globalStats = {
    totalHostels: hostels.length,
    totalRooms: rooms.length,
    available: rooms.filter((r) => (r.availableSpaces ?? 0) > 0).length,
    occupied: rooms.filter((r) => (r.currentOccupants ?? 0) > 0).length,
    male: rooms.filter((r) => r.hostel?.gender === "male").length,
    female: rooms.filter((r) => r.hostel?.gender === "female").length,
    mixed: rooms.filter((r) => r.hostel?.gender === "mixed").length,
    totalCapacity: rooms.reduce((sum, r) => sum + (r.capacity || 0), 0),
    currentOccupancy: rooms.reduce((sum, r) => sum + (r.currentOccupants || 0), 0),
  };

  // Filter grouped data
  const filteredGroupedData = groupedData
    .filter((group) => {
      const matchesSearch =
        group.hostel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.rooms.some((room) =>
          room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesGender =
        genderFilter === "all" || group.hostel.gender === genderFilter;

      return matchesSearch && matchesGender;
    })
    .filter((group) => group.rooms.length > 0 || searchQuery === "");

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

  const getOccupancyColor = (room: Room) => {
    const currentOcc = room.currentOccupants || 0;
    const capacity = room.capacity || 1;
    const percentage = capacity > 0 ? (currentOcc / capacity) * 100 : 0;
    
    if (percentage >= 100) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    if (percentage > 0) return "text-blue-600";
    return "text-green-600";
  };

  const clearFilters = () => {
    setSearchQuery("");
    setGenderFilter("all");
  };

  const handleEditClick = (room: Room) => {
    setRoomToEdit(room);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    loadData();
  };

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;

    setDeleting(true);
    try {
      await adminAPI.deleteRoom(roomToDelete._id);
      await loadData();
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
      alert(`Room ${roomToDelete.roomNumber} deleted successfully`);
    } catch (err) {
      console.error("Error deleting room:", err);
      
      // Check if it's a 404 error (endpoint not implemented)
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 404) {
          alert("❌ Room deletion is not yet supported by the backend.\n\nThe backend needs to implement: DELETE /api/admin/rooms/:id\n\nPlease contact the backend team.");
          setDeleteDialogOpen(false);
          return;
        }
      }
      
      const errorMessage = "Failed to delete room. Please try again.";
      alert(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground">Rooms Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all rooms and their occupancy
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
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
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{globalStats.totalRooms}</p>
                <p className="text-xs text-muted-foreground">Total Rooms</p>
              </div>
              <DoorOpen className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{globalStats.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-600">{globalStats.occupied}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{globalStats.male}</p>
                <p className="text-xs text-muted-foreground">Male</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-pink-600">{globalStats.female}</p>
                <p className="text-xs text-muted-foreground">Female</p>
              </div>
              <Users className="w-8 h-8 text-pink-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{globalStats.totalCapacity}</p>
                <p className="text-xs text-muted-foreground">Capacity</p>
              </div>
              <Bed className="w-8 h-8 text-purple-500 opacity-80" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {globalStats.totalCapacity > 0
                    ? Math.round((globalStats.currentOccupancy / globalStats.totalCapacity) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Occupancy</p>
              </div>
              <Building2 className="w-8 h-8 text-orange-500 opacity-80" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by room number or hostel name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full md:w-36">
                  <Users className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || genderFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Grouped Hostels View */}
        <Card>
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading rooms...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {!loading && !error && hostels.length === 0 && (
              <div className="p-12 text-center">
                <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Hostels Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create hostels first before adding rooms
                </p>
              </div>
            )}

            {!loading && !error && filteredGroupedData.length === 0 && hostels.length > 0 && (
              <div className="p-12 text-center">
                <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Hostels Match Your Filters</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            )}

            {!loading && !error && filteredGroupedData.length > 0 && (
              <Accordion type="multiple" className="w-full">
                {filteredGroupedData.map((group) => (
                  <AccordionItem key={group.hostel._id} value={group.hostel._id}>
                    <AccordionTrigger className="px-4 py-4 hover:bg-muted/50 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-primary" />
                          <div className="text-left">
                            <h3 className="font-semibold text-base">{group.hostel.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={`text-xs capitalize ${getGenderBadgeColor(group.hostel.gender)}`}
                              >
                                {group.hostel.gender}
                              </Badge>
                              {group.hostel.level && (
                                <Badge variant="secondary" className="text-xs">
                                  {group.hostel.level}L
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-bold text-lg">{group.stats.total}</p>
                            <p className="text-xs text-muted-foreground">Total Rooms</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-lg text-blue-600">{group.stats.male}</p>
                            <p className="text-xs text-muted-foreground">Male</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-lg text-pink-600">{group.stats.female}</p>
                            <p className="text-xs text-muted-foreground">Female</p>
                          </div>
                          {group.stats.mixed > 0 && (
                            <div className="text-center">
                              <p className="font-bold text-lg text-purple-600">{group.stats.mixed}</p>
                              <p className="text-xs text-muted-foreground">Mixed</p>
                            </div>
                          )}
                          <div className="text-center">
                            <p className="font-bold text-lg text-green-600">{group.stats.available}</p>
                            <p className="text-xs text-muted-foreground">Available</p>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {group.rooms.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <DoorOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No rooms in this hostel yet</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Room Number</TableHead>
                              <TableHead className="text-center">Level</TableHead>
                              <TableHead className="text-center">Occupancy</TableHead>
                              <TableHead className="text-center">Spaces Left</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.rooms.map((room, index) => (
                              <TableRow key={room._id} className="hover:bg-muted/20">
                                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                <TableCell className="font-semibold">
                                  <div className="flex items-center gap-2">
                                    <DoorOpen className="w-4 h-4 text-muted-foreground" />
                                    {room.roomNumber}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className="text-xs">
                                    {room.level}L
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`text-sm font-bold ${getOccupancyColor(room)}`}>
                                      {room.currentOccupants || 0}/{room.capacity || 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {room.capacity > 0
                                        ? `${Math.round(((room.currentOccupants || 0) / room.capacity) * 100)}%`
                                        : "0%"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="text-sm font-semibold text-green-600">
                                    {room.availableSpaces ?? (room.capacity - (room.currentOccupants || 0))}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge 
                                    variant={room.status === 'available' || (room.availableSpaces ?? 0) > 0 ? "default" : "secondary"} 
                                    className="text-xs capitalize"
                                  >
                                    {room.status || ((room.availableSpaces ?? 0) > 0 ? 'Available' : 'Full')}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                      onClick={() => handleEditClick(room)}
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => handleDeleteClick(room)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </Card>
      </div>

      {/* Add Room Dialog */}
      <AddRoomDialog
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={loadData}
      />

      {/* Edit Room Dialog */}
      <EditRoomDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        room={roomToEdit}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <EditRoomDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        room={roomToEdit}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Delete Room
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete room <span className="font-semibold">{roomToDelete?.roomNumber}</span>?
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
    </div>
  );
}

export default function RoomsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <RoomsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
