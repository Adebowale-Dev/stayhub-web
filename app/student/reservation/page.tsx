'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { studentAPI } from '@/services/api';
import useAuthStore from '@/store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, MapPin, Bed, Users, Calendar, CheckCircle2, Clock, XCircle, AlertCircle, Home, ArrowRight, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
interface Reservation {
    _id?: string;
    student?: {
        _id?: string;
        firstName?: string;
        lastName?: string;
        matricNo?: string;
        matricNumber?: string;
    };
    reservedBy?: {
        _id?: string;
        firstName?: string;
        lastName?: string;
        matricNo?: string;
        matricNumber?: string;
        email?: string;
    } | null;
    hostel?: {
        _id?: string;
        name?: string;
        code?: string;
        location?: string;
        gender?: string;
        level?: number;
        allowedLevels?: number[];
        totalRooms?: number;
        roomsCount?: number;
    };
    room?: {
        _id?: string;
        roomNumber?: string;
        floor?: number;
        capacity?: number;
        currentOccupants?: number;
        occupants?: number;
    };
    bunk?: {
        _id?: string;
        bunkNumber?: string | number;
        number?: string | number;
        position?: string;
    };
    assignedHostel?: any;
    assignedRoom?: any;
    assignedBunk?: any;
    status?: 'pending' | 'temporary' | 'confirmed' | 'checked-in' | 'checked_in' | 'cancelled' | 'expired';
    reservationStatus?: string;
    approvalRequired?: boolean;
    inviteTracker?: Array<{
        student?: {
            _id?: string;
            firstName?: string;
            lastName?: string;
            matricNo?: string;
            matricNumber?: string;
            email?: string;
        } | null;
        status?: 'sent' | 'seen' | 'approved' | 'rejected' | 'expired';
        label?: string;
        action?: 'invited' | 'viewed' | 'approved' | 'rejected' | 'expired';
        lastUpdatedAt?: string | null;
        message?: string;
        requiresPaymentBeforeApproval?: boolean;
        emailMasked?: string | null;
    }>;
    reservedAt?: string;
    expiresAt?: string;
    checkedInAt?: string;
    createdAt?: string;
    updatedAt?: string;
    roommates?: any[];
}
interface InvitationHistoryEntry {
    _id?: string;
    action: 'invited' | 'viewed' | 'approved' | 'rejected' | 'expired';
    role: 'inviter' | 'invitee';
    notes?: string | null;
    createdAt?: string;
    hostelName?: string | null;
    roomNumber?: string | null;
    bunkNumber?: string | null;
    relatedStudent?: {
        _id?: string;
        firstName?: string;
        lastName?: string;
        matricNo?: string;
        matricNumber?: string;
    } | null;
    actor?: {
        _id?: string;
        firstName?: string;
        lastName?: string;
        matricNo?: string;
        matricNumber?: string;
    } | null;
}
function ReservationPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [invitationHistory, setInvitationHistory] = useState<InvitationHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studentProfile, setStudentProfile] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<string>('pending');
    const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
    const [actionFeedback, setActionFeedback] = useState<{
        type: 'success' | 'info';
        message: string;
    } | null>(null);
    const { user } = useAuthStore();
    const invitationActionRef = useRef<HTMLDivElement | null>(null);
    const historyRef = useRef<HTMLDivElement | null>(null);
    const focusSection = searchParams.get('focus');
    const openedFromEmail = searchParams.get('source') === 'email';
    useEffect(() => {
        fetchStudentData();
    }, []);
    useEffect(() => {
        if (loading) {
            return;
        }
        const target = focusSection === 'invitation'
            ? invitationActionRef.current
            : focusSection === 'history'
                ? historyRef.current
                : null;
        if (!target) {
            return;
        }
        const timer = window.setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
        return () => window.clearTimeout(timer);
    }, [focusSection, invitationHistory.length, loading, reservation?.status]);
    const loadInvitationHistory = async () => {
        const historyResponse = await studentAPI.getInvitationHistory().catch((historyError) => {
            console.error('Failed to load invitation history:', historyError);
            return null;
        });
        const historyData = historyResponse?.data?.data || historyResponse?.data || [];
        setInvitationHistory(Array.isArray(historyData) ? historyData : []);
    };
    const fetchStudentData = async (retryCount = 0) => {
        setLoading(true);
        setError(null);
        try {
            const historyPromise = loadInvitationHistory();
            const reservationResponse = await studentAPI.getReservation().catch(async (reservationError: any) => {
                if (reservationError?.response?.status === 404) {
                    setReservation(null);
                    setError('No reservation found');
                    await historyPromise;
                    return null;
                }
                throw reservationError;
            });
            if (!reservationResponse) {
                return;
            }
            const reservationData = reservationResponse.data.data || reservationResponse.data;
            if (!reservationData || reservationData.reservationStatus === 'none' || reservationData.reservationStatus === 'no-reservation') {
                setReservation(null);
                setError('No reservation found');
                await historyPromise;
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            const dashboardResponse = await studentAPI.getDashboard();
            const dashboardData = dashboardResponse.data.data || dashboardResponse.data;
            const profile = dashboardData?.profile || dashboardData?.student;
            await historyPromise;
            setStudentProfile(profile);
            setPaymentStatus(dashboardData?.paymentStatus || 'pending');
            const rawHostel = reservationData.hostel ||
                reservationData.assignedHostel ||
                reservationData.hostelDetails ||
                reservationData.hostelInfo;
            const rawRoom = reservationData.room ||
                reservationData.assignedRoom ||
                reservationData.roomDetails ||
                reservationData.roomInfo;
            const rawBunk = reservationData.bunk ||
                reservationData.assignedBunk ||
                reservationData.bunkDetails ||
                reservationData.bunkInfo;
            const mappedReservation = {
                ...reservationData,
                status: reservationData.reservationStatus || reservationData.status,
                reservedAt: reservationData.reservedAt ||
                    reservationData.createdAt ||
                    reservationData.reservationDate ||
                    reservationData.dateReserved ||
                    reservationData.date ||
                    reservationData.updatedAt ||
                    null,
                expiresAt: reservationData.expiresAt ||
                    reservationData.expiredAt ||
                    reservationData.expiry ||
                    reservationData.expiryDate ||
                    reservationData.reservationExpiry ||
                    reservationData.validUntil ||
                    reservationData.deadline ||
                    null,
                checkedInAt: reservationData.checkedInAt ||
                    reservationData.checkInDate ||
                    reservationData.checkedIn ||
                    null,
                student: reservationData.student || {
                    firstName: profile?.firstName,
                    lastName: profile?.lastName,
                    matricNo: profile?.matricNumber || profile?.matricNo,
                },
                hostel: rawHostel ? {
                    _id: rawHostel._id,
                    name: rawHostel.name,
                    code: rawHostel.code,
                    location: rawHostel.location,
                    gender: rawHostel.gender,
                    level: rawHostel.level ?? rawHostel.allowedLevels?.[0],
                    totalRooms: rawHostel.totalRooms ?? rawHostel.roomsCount,
                } : null,
                room: rawRoom ? {
                    _id: rawRoom._id,
                    roomNumber: rawRoom.roomNumber,
                    floor: rawRoom.floor,
                    capacity: rawRoom.capacity ?? 0,
                    currentOccupants: rawRoom.currentOccupants ?? (rawRoom.availableSpaces != null ? (rawRoom.capacity - rawRoom.availableSpaces) : 0),
                } : null,
                bunk: rawBunk ? {
                    _id: rawBunk._id,
                    bunkNumber: rawBunk.bunkNumber ?? rawBunk.number,
                    position: rawBunk.position,
                } : null,
                reservedBy: reservationData.reservedBy || null,
                approvalRequired: reservationData.approvalRequired ?? reservationData.reservationStatus === 'temporary',
            };
            setReservation(mappedReservation);
        }
        catch (err: any) {
            console.error('Failed to fetch reservation:', err);
            console.error('Error response:', err.response?.data);
            if (err.response?.status === 429 && retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchStudentData(retryCount + 1);
            }
            if (err.response?.status === 404) {
                await loadInvitationHistory();
                setError('No reservation found');
            }
            else if (err.response?.status === 429) {
                setError('Too many requests. Please refresh the page in a moment.');
            }
            else {
                setInvitationHistory([]);
                setError('Failed to load reservation details');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusBadge = (status: string) => {
        const normalizedStatus = status?.toLowerCase().replace('_', '-');
        const statusConfig: Record<string, {
            variant: 'default' | 'secondary' | 'destructive' | 'outline';
            icon: any;
            label: string;
        }> = {
            pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
            temporary: { variant: 'secondary', icon: Clock, label: 'Awaiting Approval' },
            confirmed: { variant: 'default', icon: CheckCircle2, label: 'Confirmed' },
            'checked-in': { variant: 'default', icon: CheckCircle2, label: 'Checked In' },
            cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
            expired: { variant: 'outline', icon: AlertCircle, label: 'Expired' },
        };
        const config = statusConfig[normalizedStatus] || statusConfig.pending;
        const Icon = config.icon;
        return (<Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3"/>
        {config.label}
      </Badge>);
    };
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const handleReservationAction = async (action: 'approve' | 'reject') => {
        if (action === 'reject' && typeof window !== 'undefined') {
            const shouldContinue = window.confirm('Rejecting this invitation will release the room space. Continue?');
            if (!shouldContinue) {
                return;
            }
        }
        try {
            setActionLoading(action);
            await studentAPI.respondToInvitation(action);
            await fetchStudentData();
            if (action === 'reject') {
                setReservation(null);
                setError('No reservation found');
                setActionFeedback({
                    type: 'info',
                    message: 'Invitation rejected. The room space has been released for another student.',
                });
            }
            else {
                setActionFeedback({
                    type: 'success',
                    message: 'Room approved successfully. Your bed space is now confirmed. Proceed to porter check-in when the check-in window opens. Your inviter has been notified.',
                });
            }
        }
        catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update the room invitation');
        }
        finally {
            setActionLoading(null);
        }
    };
    const getInvitationParticipantName = (person?: InvitationHistoryEntry['relatedStudent'] | InvitationHistoryEntry['actor'], fallback = 'A student') => {
        if (!person)
            return fallback;
        const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
        return fullName || person.matricNo || person.matricNumber || fallback;
    };
    const getInvitationLocation = (entry: InvitationHistoryEntry) => {
        if (entry.roomNumber && entry.hostelName) {
            return `Room ${entry.roomNumber}, ${entry.hostelName}`;
        }
        if (entry.roomNumber) {
            return `Room ${entry.roomNumber}`;
        }
        return entry.hostelName || 'Reserved room';
    };
    const getInvitationHistoryTone = (entry: InvitationHistoryEntry) => {
        if (entry.action === 'viewed') {
            return {
                icon: Info,
                badgeVariant: 'outline' as const,
                badgeLabel: 'Seen',
            };
        }
        if (entry.action === 'approved') {
            return {
                icon: CheckCircle2,
                badgeVariant: 'default' as const,
                badgeLabel: 'Approved',
            };
        }
        if (entry.action === 'rejected') {
            return {
                icon: XCircle,
                badgeVariant: 'destructive' as const,
                badgeLabel: 'Rejected',
            };
        }
        if (entry.action === 'expired') {
            return {
                icon: AlertCircle,
                badgeVariant: 'outline' as const,
                badgeLabel: 'Expired',
            };
        }
        return {
            icon: Clock,
            badgeVariant: 'secondary' as const,
            badgeLabel: 'Pending',
        };
    };
    const getInvitationHistoryTitle = (entry: InvitationHistoryEntry) => {
        const otherPerson = getInvitationParticipantName(entry.relatedStudent || entry.actor);
        if (entry.action === 'invited' && entry.role === 'inviter') {
            return `You invited ${otherPerson}`;
        }
        if (entry.action === 'invited' && entry.role === 'invitee') {
            return `${otherPerson} reserved a room for you`;
        }
        if (entry.action === 'viewed' && entry.role === 'inviter') {
            return `${otherPerson} opened your invitation`;
        }
        if (entry.action === 'viewed' && entry.role === 'invitee') {
            return 'You opened the reserved room invitation';
        }
        if (entry.action === 'approved' && entry.role === 'inviter') {
            return `${otherPerson} approved your invitation`;
        }
        if (entry.action === 'approved' && entry.role === 'invitee') {
            return 'You approved the reserved room';
        }
        if (entry.action === 'rejected' && entry.role === 'inviter') {
            return `${otherPerson} rejected your invitation`;
        }
        if (entry.action === 'rejected' && entry.role === 'invitee') {
            return 'You rejected the reserved room';
        }
        if (entry.action === 'expired' && entry.role === 'inviter') {
            return `${otherPerson}'s invitation expired`;
        }
        return 'Your room invitation expired';
    };
    const getInvitationHistoryDescription = (entry: InvitationHistoryEntry) => {
        const parts = [getInvitationLocation(entry)];
        if (entry.notes) {
            parts.push(entry.notes);
        }
        if (entry.bunkNumber) {
            parts.push(`Bunk ${entry.bunkNumber}`);
        }
        return parts.filter(Boolean).join(' - ');
    };
    const getInviteTrackerTone = (status?: 'sent' | 'seen' | 'approved' | 'rejected' | 'expired') => {
        if (status === 'seen') {
            return {
                icon: Info,
                badgeVariant: 'outline' as const,
                badgeLabel: 'Seen',
            };
        }
        if (status === 'approved') {
            return {
                icon: CheckCircle2,
                badgeVariant: 'default' as const,
                badgeLabel: 'Approved',
            };
        }
        if (status === 'rejected') {
            return {
                icon: XCircle,
                badgeVariant: 'destructive' as const,
                badgeLabel: 'Rejected',
            };
        }
        if (status === 'expired') {
            return {
                icon: AlertCircle,
                badgeVariant: 'outline' as const,
                badgeLabel: 'Expired',
            };
        }
        return {
            icon: Clock,
            badgeVariant: 'secondary' as const,
            badgeLabel: 'Sent',
        };
    };
    const renderInviteTrackerCard = () => {
        const tracker = reservation?.inviteTracker || [];
        if (tracker.length === 0) {
            return null;
        }
        return (<Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5"/>
          Friend Invite Tracker
        </CardTitle>
        <CardDescription>
          Follow each reserved friend from the moment the invite is sent until they approve, reject, or let it expire.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tracker.map((item, index) => {
                const tone = getInviteTrackerTone(item.status);
                const Icon = tone.icon;
                const studentName = getInvitationParticipantName(item.student, 'Invited friend');
                return (<div key={item.student?._id || `${item.status}-${index}`} className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-background p-2">
                    <Icon className="h-4 w-4 text-primary"/>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {(item.student?.matricNo || item.student?.matricNumber || 'Matric unavailable')}
                      {item.emailMasked ? ` - ${item.emailMasked}` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.message || 'Invite created and waiting for a response.'}
                    </p>
                    {item.lastUpdatedAt && (<p className="text-xs text-muted-foreground">
                        Updated {formatDate(item.lastUpdatedAt)}
                      </p>)}
                    {item.requiresPaymentBeforeApproval && item.status !== 'approved' && item.status !== 'rejected' && item.status !== 'expired' && (<p className="text-xs text-muted-foreground">
                        Payment is still pending for this friend, so approval can only happen after payment.
                      </p>)}
                  </div>
                </div>
                <Badge variant={tone.badgeVariant} className="w-fit">
                  {tone.badgeLabel}
                </Badge>
              </div>
            </div>);
            })}
      </CardContent>
    </Card>);
    };
    const renderInvitationHistoryCard = () => (<div ref={historyRef}>
      <Card className={focusSection === 'history' ? 'border-primary/60 ring-2 ring-primary/15' : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5"/>
            Invitation History
          </CardTitle>
          <CardDescription>
            Recent invitation updates for rooms you reserved or rooms reserved for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {invitationHistory.length === 0 ? (<p className="text-sm text-muted-foreground">
              Invitation activity will appear here after you invite a friend or respond to an invitation.
            </p>) : (invitationHistory.slice(0, 8).map((entry, index) => {
            const tone = getInvitationHistoryTone(entry);
            const Icon = tone.icon;
            return (<div key={entry._id || `${entry.action}-${entry.role}-${index}`} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-background p-2">
                        <Icon className="h-4 w-4 text-primary"/>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{getInvitationHistoryTitle(entry)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getInvitationHistoryDescription(entry)}
                        </p>
                        {entry.createdAt && (<p className="text-xs text-muted-foreground">
                            {formatDate(entry.createdAt)}
                          </p>)}
                      </div>
                    </div>
                    <Badge variant={tone.badgeVariant} className="w-fit">
                      {tone.badgeLabel}
                    </Badge>
                  </div>
                </div>);
        }))}
        </CardContent>
      </Card>
    </div>);
    const shouldShowHistoryCard = invitationHistory.length > 0 || focusSection === 'history';
    const isFriendReservedRoom = Boolean(reservation?.reservedBy?._id && reservation?.reservedBy?._id !== user?._id);
    if (loading) {
        return (<ProtectedRoute allowedRoles={['student']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading your reservation...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>);
    }
    return (<ProtectedRoute allowedRoles={['student']}>
      <DashboardLayout>
        <div className="space-y-6">
          
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              My Reservation
            </h2>
            <p className="text-muted-foreground mt-1">
              View and manage your hostel room reservation
            </p>
          </div>

          {openedFromEmail && (<Alert>
              <Info className="h-4 w-4"/>
              <AlertDescription>
                {focusSection === 'history'
                ? 'You opened this page from email. Your latest invitation history is highlighted below.'
                : 'You opened this page from email. Your invitation action section is highlighted below.'}
              </AlertDescription>
            </Alert>)}

          {actionFeedback && (<Alert variant={actionFeedback.type === 'success' ? 'default' : undefined}>
              <Info className="h-4 w-4"/>
              <AlertDescription>
                {actionFeedback.message}
              </AlertDescription>
            </Alert>)}

          
          {!reservation && !loading && (<>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Home className="h-8 w-8 text-muted-foreground"/>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Active Reservation</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {error === 'No reservation found'
                ? "You haven't reserved a room yet. Browse available hostels to make a reservation."
                : error || "Start by browsing available hostels and selecting a room."}
                    </p>
                    <Button onClick={() => router.push('/student/hostels')}>
                      Browse Hostels
                      <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {shouldShowHistoryCard && renderInvitationHistoryCard()}
            </>)}

          
          {reservation && (<>
              
              {reservation.status === 'pending' && (<Alert>
                  <Info className="h-4 w-4"/>
                  <AlertDescription>
                    Your reservation is pending confirmation. Please ensure your payment has been made.
                  </AlertDescription>
                </Alert>)}

              {reservation.status === 'temporary' && (<Alert>
                  <Info className="h-4 w-4"/>
                  <AlertDescription>
                    {(reservation.reservedBy?.firstName || reservation.reservedBy?.lastName)
                    ? `${reservation.reservedBy?.firstName || ''} ${reservation.reservedBy?.lastName || ''}`.trim()
                    : 'A friend'} reserved this room for you. Complete payment if needed, then approve it within 24 hours.
                  </AlertDescription>
                </Alert>)}

              {reservation.status === 'expired' && (<Alert variant="destructive">
                  <AlertCircle className="h-4 w-4"/>
                  <AlertDescription>
                    Your reservation has expired. Please make a new reservation.
                  </AlertDescription>
                </Alert>)}

              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Reservation Status</CardTitle>
                      <CardDescription>Current status of your room reservation</CardDescription>
                    </div>
                    {getStatusBadge(reservation.status ?? 'pending')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Reserved On</p>
                      <p className="font-medium">
                        {reservation.reservedAt
                ? formatDate(reservation.reservedAt)
                : 'Date not provided by server'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Expires On</p>
                      <p className="font-medium">
                        {reservation.expiresAt
                ? formatDate(reservation.expiresAt)
                : 'Date not provided by server'}
                      </p>
                    </div>
                    {reservation.checkedInAt && (<div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Checked In</p>
                        <p className="font-medium">{formatDate(reservation.checkedInAt)}</p>
                      </div>)}
                  </div>
                </CardContent>
              </Card>

              {reservation.status === 'confirmed' && isFriendReservedRoom && (<Card>
                  <CardHeader>
                    <CardTitle>What Happens Next</CardTitle>
                    <CardDescription>Your bed space is confirmed. Here is the next step before moving in.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                      <p className="font-medium text-foreground">1. Wait for check-in to open</p>
                      <p className="text-sm text-muted-foreground">StayHub will keep this room assigned to you. Check in when your hostel window opens.</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                      <p className="font-medium text-foreground">2. Go to the porter desk for your hostel</p>
                      <p className="text-sm text-muted-foreground">Tell the porter your matric number and that your room was approved in StayHub.</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                      <p className="font-medium text-foreground">3. Complete physical check-in</p>
                      <p className="text-sm text-muted-foreground">After porter verification, your status will move from confirmed reservation to checked-in.</p>
                    </div>
                  </CardContent>
                </Card>)}

              {renderInviteTrackerCard()}

              {reservation.status === 'temporary' && (<div ref={invitationActionRef}>
                  <Card className={focusSection === 'invitation' ? 'border-primary/60 ring-2 ring-primary/15' : undefined}>
                  <CardHeader>
                    <CardTitle>Invitation Action</CardTitle>
                    <CardDescription>Approve this room if you want to keep it, or reject it to release the space.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={() => handleReservationAction('approve')} disabled={actionLoading !== null || paymentStatus !== 'paid'}>
                      {actionLoading === 'approve' ? 'Approving...' : 'Approve Room'}
                    </Button>
                    <Button variant="outline" onClick={() => handleReservationAction('reject')} disabled={actionLoading !== null}>
                      {actionLoading === 'reject' ? 'Rejecting...' : 'Reject Invitation'}
                    </Button>
                  </CardContent>
                  {paymentStatus !== 'paid' && (<CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        Payment is still pending on your account. Complete payment first, then approve this invitation.
                      </p>
                    </CardContent>)}
                  </Card>
                </div>)}

              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5"/>
                    Hostel Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Hostel Name</p>
                        <p className="text-lg font-semibold">
                          {reservation.hostel?.name || 'Not Available'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Level</p>
                        <p className="font-medium">
                          {reservation.hostel?.level
                ? `${reservation.hostel.level} Level`
                : reservation.hostel?.allowedLevels?.length
                    ? reservation.hostel.allowedLevels.map(l => `${l}L`).join(', ')
                    : 'Not Available'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Rooms
                        </p>
                        <p className="font-medium">
                          {reservation.hostel?.totalRooms ?? 'Not Available'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <Badge variant="outline" className="capitalize">
                          {reservation.hostel?.gender || 'Not Available'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bed className="h-5 w-5"/>
                    Room Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Room Number</p>
                        <p className="text-2xl font-bold">{reservation.room?.roomNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Floor</p>
                        <p className="font-medium">Floor {reservation.room?.floor || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3"/>
                          Capacity
                        </p>
                        <p className="font-medium">{reservation.room?.capacity || 0} students</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Current Occupants</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{reservation.room?.currentOccupants || 0} / {reservation.room?.capacity || 0}</p>
                          <Badge variant={(reservation.room?.currentOccupants || 0) < (reservation.room?.capacity || 0) ? 'default' : 'secondary'}>
                            {(reservation.room?.currentOccupants || 0) < (reservation.room?.capacity || 0) ? 'Available' : 'Full'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {reservation.bunk && (<>
                      <Separator className="my-4"/>
                      <div className="space-y-4">
                        <h4 className="font-semibold">Bunk Assignment</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Bunk Number</p>
                            <p className="font-medium">Bunk {reservation.bunk?.bunkNumber || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Position</p>
                            <Badge variant="outline" className="capitalize">
                              {reservation.bunk?.position || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </>)}
                </CardContent>
              </Card>

              
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">
                        {reservation.student?.firstName && reservation.student?.lastName
                ? `${reservation.student.firstName} ${reservation.student.lastName}`
                : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not Available'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Matric Number</p>
                      <p className="font-medium">
                        {reservation.student?.matricNo || user?.matricNumber || user?.matricNo || 'Not Available'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                  <Home className="mr-2 h-4 w-4"/>
                  Back to Dashboard
                </Button>
                {reservation.status === 'confirmed' && (<Button onClick={() => router.push('/student/hostels')}>
                    View Hostel Details
                  </Button>)}
              </div>

              {shouldShowHistoryCard && renderInvitationHistoryCard()}
            </>)}
        </div>
      </DashboardLayout>
    </ProtectedRoute>);
}

export default function ReservationPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-4xl py-12 text-sm text-muted-foreground">Loading reservation page...</div>}>
            <ReservationPageContent />
        </Suspense>
    );
}

