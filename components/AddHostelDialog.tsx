"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Building2 } from "lucide-react";
import { adminAPI } from "@/services/api";

interface AddHostelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddHostelDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddHostelDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    totalRooms: "",
    gender: "male" as "male" | "female" | "mixed",
    allowedLevels: [] as number[],
    description: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const allLevels = [100, 200, 300, 400, 500];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Hostel name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Hostel code is required";
    } else if (formData.code.length < 2) {
      newErrors.code = "Code must be at least 2 characters";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    
    if (!formData.totalRooms || Number(formData.totalRooms) <= 0) {
      newErrors.totalRooms = "Total rooms must be at least 1";
    }

    if (formData.allowedLevels.length === 0) {
      newErrors.allowedLevels = "Select at least one level";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        location: formData.location.trim(),
        totalRooms: Number(formData.totalRooms),
        gender: formData.gender,
        level: formData.allowedLevels.length > 0 ? formData.allowedLevels[0] : 100, // Backend expects single level field
        isActive: formData.isActive,
        ...(formData.description.trim() && { description: formData.description.trim() }),
      };
      
      console.log("Creating hostel with payload:", payload);
      const response = await adminAPI.createHostel(payload);
      console.log("Hostel created successfully:", response.data);

      // Reset form
      setFormData({
        name: "",
        code: "",
        location: "",
        totalRooms: "",
        gender: "male",
        allowedLevels: [],
        description: "",
        isActive: true,
      });
      setErrors({});
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      console.error("Failed to create hostel:", error);
      
      // Extract error message from API response
      let errorMessage = "Failed to create hostel. Please try again.";
      
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { 
          response?: { 
            data?: { 
              message?: string; 
              error?: string;
              errors?: Record<string, string> | unknown[];
            } 
          } 
        };
        
        // Log full error response for debugging
        console.error("Backend error response:", axiosError.response?.data);
        
        // Log errors if present
        if (axiosError.response?.data?.errors) {
          console.error("Backend errors:", axiosError.response.data.errors);
        }
        
        errorMessage = axiosError.response?.data?.message || 
                      axiosError.response?.data?.error || 
                      errorMessage;
                      
        // If there are field-specific errors, show them
        if (axiosError.response?.data?.errors) {
          const fieldErrors = axiosError.response.data.errors;
          
          // Handle array of error messages
          if (Array.isArray(fieldErrors)) {
            errorMessage = fieldErrors.map((err: unknown) => 
              typeof err === 'string' ? err : (err as Record<string, unknown>).message || (err as Record<string, unknown>).msg || JSON.stringify(err)
            ).join(", ");
          } else if (typeof fieldErrors === 'object') {
            // Handle object of field: message pairs
            errorMessage = Object.entries(fieldErrors)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(", ");
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: "",
        code: "",
        location: "",
        totalRooms: "",
        gender: "male",
        allowedLevels: [],
        description: "",
        isActive: true,
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  const toggleLevel = (level: number) => {
    // Backend only accepts levels 100-500, so warn if selecting 600
    if (level === 600) {
      console.warn("Note: Backend does not support 600L. It will be filtered out.");
    }
    setFormData((prev) => ({
      ...prev,
      allowedLevels: prev.allowedLevels.includes(level)
        ? prev.allowedLevels.filter((l) => l !== level)
        : [...prev.allowedLevels, level].sort((a, b) => a - b),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Add New Hostel
          </DialogTitle>
          <DialogDescription>
            Create a new hostel. Code will be automatically converted to uppercase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Error Message */}
            {errors.submit && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hostel Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Hostel Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., John Hostel"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  className={errors.name ? "border-destructive" : ""}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Hostel Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  Hostel Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="e.g., JH"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    });
                    if (errors.code) setErrors({ ...errors, code: "" });
                  }}
                  className={errors.code ? "border-destructive" : ""}
                  disabled={loading}
                  maxLength={10}
                />
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Main Campus"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    if (errors.location) setErrors({ ...errors, location: "" });
                  }}
                  className={errors.location ? "border-destructive" : ""}
                  disabled={loading}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location}</p>
                )}
              </div>

              {/* Total Rooms */}
              <div className="space-y-2">
                <Label htmlFor="totalRooms" className="text-sm font-medium">
                  Total Rooms <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="totalRooms"
                  type="number"
                  placeholder="e.g., 50"
                  value={formData.totalRooms}
                  onChange={(e) => {
                    setFormData({ ...formData, totalRooms: e.target.value });
                    if (errors.totalRooms) setErrors({ ...errors, totalRooms: "" });
                  }}
                  className={errors.totalRooms ? "border-destructive" : ""}
                  disabled={loading}
                  min="1"
                />
                {errors.totalRooms && (
                  <p className="text-xs text-destructive">{errors.totalRooms}</p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-medium">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value: "male" | "female" | "mixed") =>
                  setFormData({ ...formData, gender: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Allowed Levels */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Allowed Levels <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 p-4 border rounded-lg bg-muted/20">
                {allLevels.map((level) => (
                  <div
                    key={level}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`level-${level}`}
                      checked={formData.allowedLevels.includes(level)}
                      onCheckedChange={() => {
                        toggleLevel(level);
                        if (errors.allowedLevels)
                          setErrors({ ...errors, allowedLevels: "" });
                      }}
                      disabled={loading}
                    />
                    <label
                      htmlFor={`level-${level}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {level}L
                    </label>
                  </div>
                ))}
              </div>
              {errors.allowedLevels && (
                <p className="text-xs text-destructive">{errors.allowedLevels}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Optional description or notes about the hostel"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
                disabled={loading}
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Active (Hostel is available for reservations)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Hostel"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
