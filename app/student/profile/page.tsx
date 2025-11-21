'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { authAPI } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2,
  GraduationCap,
  CreditCard,
  Home,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  matricNumber: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  college?: {
    _id: string;
    name: string;
  };
  department?: {
    _id: string;
    name: string;
  };
  level?: string;
  gender?: string;
  paymentStatus?: string;
  reservationStatus?: string;
  createdAt: string;
}

export default function StudentProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<StudentProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const profileData = response.data.data || response.data;
      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEditedProfile({ ...profile });
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedProfile({ ...profile });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement update profile API call
      // await authAPI.updateProfile(editedProfile);
      
      // For now, just update local state
      setProfile({ ...profile, ...editedProfile } as StudentProfile);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof StudentProfile, value: string) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const colors = {
      completed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      failed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
      confirmed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    };

    const icons = {
      completed: CheckCircle2,
      confirmed: CheckCircle2,
      pending: AlertCircle,
      failed: AlertCircle,
      cancelled: AlertCircle,
    };

    const color = colors[status as keyof typeof colors] || colors.pending;
    const Icon = icons[status as keyof typeof icons] || AlertCircle;

    return (
      <Badge variant="outline" className={color}>
        <Icon className="h-3 w-3 mr-1" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/student/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  My Profile
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View your personal and academic information
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/student/settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Profile Header Card */}
          {/* <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800"> */}
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-lg rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <User className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-3 mb-3">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {profile?.name}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {getStatusBadge(profile?.paymentStatus)}
                      {getStatusBadge(profile?.reservationStatus)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <GraduationCap className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Matric:</span>
                      <span>{profile?.matricNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Email:</span>
                      <span className="truncate">{profile?.email}</span>
                    </div>
                    {profile?.phoneNumber && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Phone:</span>
                        <span>{profile.phoneNumber}</span>
                      </div>
                    )}
                    {profile?.level && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Level:</span>
                        <span>{profile.level}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          {/* </Card> */}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input 
                    value={editing ? (editedProfile.name || '') : (profile?.name || '')} 
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!editing} 
                    className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input 
                    value={editing ? (editedProfile.email || '') : (profile?.email || '')} 
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!editing} 
                    className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input 
                    value={editing ? (editedProfile.phoneNumber || '') : (profile?.phoneNumber || 'Not provided')} 
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    disabled={!editing} 
                    className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''} 
                    placeholder={editing ? 'Enter phone number' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input 
                    type={editing ? 'date' : 'text'}
                    value={editing 
                      ? (editedProfile.dateOfBirth ? new Date(editedProfile.dateOfBirth).toISOString().split('T')[0] : '') 
                      : (profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided')
                    }
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!editing} 
                    className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <User className="h-4 w-4" />
                    Gender
                  </Label>
                  {editing ? (
                    <select 
                      value={editedProfile.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      aria-label="Select gender"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <Input 
                      value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not provided'} 
                      disabled 
                      className="bg-gray-50 dark:bg-gray-900" 
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input 
                    value={editing ? (editedProfile.address || '') : (profile?.address || 'Not provided')} 
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!editing} 
                    className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''} 
                    placeholder={editing ? 'Enter your address' : ''}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Academic Information
                </CardTitle>
                <CardDescription>
                  Your college and department details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <GraduationCap className="h-4 w-4" />
                    Matriculation Number
                  </Label>
                  <Input value={profile?.matricNumber || ''} disabled className="bg-gray-50 dark:bg-gray-900" />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Building2 className="h-4 w-4" />
                    College
                  </Label>
                  <Input 
                    value={profile?.college?.name || 'Not assigned'} 
                    disabled 
                    className="bg-gray-50 dark:bg-gray-900" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <GraduationCap className="h-4 w-4" />
                    Department
                  </Label>
                  <Input 
                    value={profile?.department?.name || 'Not assigned'} 
                    disabled 
                    className="bg-gray-50 dark:bg-gray-900" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <GraduationCap className="h-4 w-4" />
                    Level
                  </Label>
                  <Input 
                    value={profile?.level || 'Not provided'} 
                    disabled 
                    className="bg-gray-50 dark:bg-gray-900" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <Calendar className="h-4 w-4" />
                    Account Created
                  </Label>
                  <Input 
                    value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'} 
                    disabled 
                    className="bg-gray-50 dark:bg-gray-900" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accommodation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Accommodation Status
              </CardTitle>
              <CardDescription>
                Your payment and reservation status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-lg border bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      Payment Status
                    </Label>
                    {getStatusBadge(profile?.paymentStatus)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile?.paymentStatus === 'completed' 
                      ? 'Your payment has been verified and confirmed' 
                      : 'Complete payment to proceed with hostel selection'}
                  </p>
                </div>

                <div className="p-6 rounded-lg border bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
                      <Home className="h-5 w-5 text-blue-500" />
                      Reservation Status
                    </Label>
                    {getStatusBadge(profile?.reservationStatus)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {profile?.reservationStatus === 'confirmed' 
                      ? 'Your hostel reservation is confirmed' 
                      : 'No active reservation yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can update your personal information using the &quot;Edit Profile&quot; button above. 
              For password and security settings, visit the <button onClick={() => router.push('/student/settings')} className="font-medium underline">Settings page</button>.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
