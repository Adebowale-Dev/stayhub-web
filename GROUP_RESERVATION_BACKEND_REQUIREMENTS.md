# Group Reservation Backend Requirements

## Overview
The frontend now supports group reservations, allowing students to reserve a room together with their friends. This document outlines the backend changes required to support this feature.

## Frontend Implementation Summary

### What the Frontend Sends
When a student makes a group reservation, the frontend sends:

```typescript
{
  roomId: "room_id_here",
  hostelId: "hostel_id_here",
  friends: ["CSC/2020/001", "CSC/2020/002", "CSC/2020/003"], // Array of matric numbers
  isGroupReservation: true
}
```

For individual reservations (no friends), it sends the original format:
```typescript
{
  roomId: "room_id_here",
  hostelId: "hostel_id_here"
}
```

## Required Backend Endpoints

### 1. Friend Validation Endpoint (NEW)
**Endpoint:** `GET /api/student/validate-friend/:matricNo`

**Purpose:** Validate if a student can be added to a group reservation

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "student_id",
    "firstName": "John",
    "lastName": "Doe",
    "matricNo": "CSC/2020/001",
    "gender": "male",
    "hasReservation": false
  }
}
```

**Validation Rules:**
1. ✅ Student exists in database
2. ✅ Student has no existing reservation
3. ✅ Student gender matches room gender
4. ✅ Student is not the current user
5. ✅ Student has completed payment (optional, but recommended)

**Error Cases:**
- `404`: Student not found
- `400`: Student already has reservation
- `400`: Gender mismatch with room
- `400`: Cannot add yourself to group

### 2. Reserve Room Endpoint (MODIFIED)
**Endpoint:** `POST /api/student/reserve`

**Current Implementation:** Handles single student reservation

**Required Changes:**

#### Accept Additional Fields:
```typescript
interface ReservationRequest {
  roomId: string;
  hostelId: string;
  friends?: string[]; // Array of matric numbers
  isGroupReservation?: boolean;
}
```

#### Logic Flow:

```javascript
// 1. Get authenticated student
const currentStudent = req.user;

// 2. Validate room and hostel
const room = await Room.findById(roomId).populate('hostel');
if (!room) return res.status(404).json({ message: 'Room not found' });

// 3. Check if group reservation
if (isGroupReservation && friends && friends.length > 0) {
  // Group Reservation Logic
  
  // 3a. Find all friend students
  const friendStudents = await Student.find({ matricNo: { $in: friends } });
  
  // 3b. Validate all friends exist
  if (friendStudents.length !== friends.length) {
    return res.status(400).json({ 
      message: 'One or more students not found' 
    });
  }
  
  // 3c. Check all students are eligible
  for (const friend of friendStudents) {
    // Check for existing reservation
    const existingReservation = await Reservation.findOne({ 
      student: friend._id,
      status: { $in: ['confirmed', 'checked_in', 'pending'] }
    });
    
    if (existingReservation) {
      return res.status(400).json({ 
        message: `${friend.firstName} ${friend.lastName} already has a reservation` 
      });
    }
    
    // Check gender match
    if (friend.gender !== room.gender) {
      return res.status(400).json({ 
        message: `Gender mismatch for ${friend.firstName} ${friend.lastName}` 
      });
    }
    
    // Optional: Check payment status
    // if (!friend.paymentStatus || friend.paymentStatus !== 'paid') {
    //   return res.status(400).json({ 
    //     message: `${friend.firstName} ${friend.lastName} has not completed payment` 
    //   });
    // }
  }
  
  // 3d. Check room has enough space
  const totalStudents = 1 + friendStudents.length; // Current student + friends
  const availableSpaces = room.capacity - room.currentOccupants;
  
  if (totalStudents > availableSpaces) {
    return res.status(400).json({ 
      message: `Not enough space! Only ${availableSpaces} space(s) available` 
    });
  }
  
  // 4. Get available bunks
  const availableBunks = await Bunk.find({
    room: roomId,
    status: 'available'
  }).limit(totalStudents);
  
  if (availableBunks.length < totalStudents) {
    return res.status(400).json({ 
      message: 'Not enough available bunks' 
    });
  }
  
  // 5. Create reservations for all students
  const allStudents = [currentStudent._id, ...friendStudents.map(f => f._id)];
  const reservations = await Reservation.insertMany(
    allStudents.map((studentId, index) => ({
      student: studentId,
      room: roomId,
      hostel: hostelId,
      bunk: availableBunks[index]._id,
      status: 'confirmed',
      reservedAt: new Date(),
      groupReservation: true, // Flag for group reservation
      groupId: new ObjectId() // Same ID for all in group (optional)
    }))
  );
  
  // 6. Update bunks to reserved
  await Bunk.updateMany(
    { _id: { $in: availableBunks.map(b => b._id) } },
    { status: 'reserved' }
  );
  
  // 7. Update students with assigned room/bunk
  for (let i = 0; i < allStudents.length; i++) {
    await Student.findByIdAndUpdate(allStudents[i], {
      assignedRoom: roomId,
      assignedBunk: availableBunks[i]._id,
      assignedHostel: hostelId,
      reservationStatus: 'confirmed'
    });
  }
  
  // 8. Update room occupancy
  room.currentOccupants += totalStudents;
  await room.save();
  
  // 9. Send notifications to friends
  for (const friend of friendStudents) {
    // Send email/SMS notification
    // await sendEmail({
    //   to: friend.email,
    //   subject: 'Hostel Room Reserved',
    //   body: `${currentStudent.firstName} has added you to a group reservation for Room ${room.roomNumber}`
    // });
  }
  
  return res.status(201).json({
    success: true,
    message: `Room reserved successfully for ${totalStudents} students`,
    data: {
      reservations,
      room,
      students: allStudents.length
    }
  });
  
} else {
  // Single Student Reservation (existing logic)
  // ... your existing reservation code ...
}
```

## Database Schema Updates

### Student Schema (Add fields if not present)
```javascript
{
  // ... existing fields ...
  assignedRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  assignedBunk: { type: mongoose.Schema.Types.ObjectId, ref: 'Bunk' },
  assignedHostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
  reservationStatus: { 
    type: String, 
    enum: ['none', 'confirmed', 'checked_in', 'checked-in'], 
    default: 'none' 
  }
}
```

### Reservation Schema (Add optional fields)
```javascript
{
  // ... existing fields ...
  groupReservation: { type: Boolean, default: false },
  groupId: { type: mongoose.Schema.Types.ObjectId, required: false }, // Links group reservations
  reservedAt: { type: Date, default: Date.now }
}
```

## API Testing

### Test Case 1: Single Reservation (Existing)
```bash
POST /api/student/reserve
{
  "roomId": "room123",
  "hostelId": "hostel456"
}
```

### Test Case 2: Group Reservation (New)
```bash
POST /api/student/reserve
{
  "roomId": "room123",
  "hostelId": "hostel456",
  "friends": ["CSC/2020/001", "CSC/2020/002"],
  "isGroupReservation": true
}
```

### Test Case 3: Friend Validation (New)
```bash
GET /api/student/validate-friend/CSC/2020/001
```

## Error Handling

### Validation Errors
- Student not found: `404 - Student with matric number not found`
- Already reserved: `400 - Student already has a reservation`
- Gender mismatch: `400 - Student gender does not match room gender`
- Not enough space: `400 - Not enough space in room`
- Payment incomplete: `400 - Payment required before reservation`

### Success Response
```json
{
  "success": true,
  "message": "Room reserved successfully for 3 students",
  "data": {
    "reservations": [...],
    "room": {...},
    "students": 3
  }
}
```

## Frontend-Backend Integration Notes

### Current Frontend State
- ✅ UI for adding friends implemented
- ✅ Group reservation checkbox
- ✅ Friend list display with remove functionality
- ✅ Space validation (client-side)
- ✅ API call sends friends array
- ⚠️ Friend validation currently uses placeholder (needs backend endpoint)

### Backend Tasks (Priority Order)
1. **HIGH**: Modify `POST /api/student/reserve` to accept `friends` array
2. **HIGH**: Implement group reservation logic
3. **MEDIUM**: Create `GET /api/student/validate-friend/:matricNo` endpoint
4. **MEDIUM**: Add database fields for group tracking
5. **LOW**: Implement notification system for friends
6. **LOW**: Add cancellation logic for group reservations

## Notes for Implementation

1. **Transaction Safety**: Consider using MongoDB transactions for group reservations to ensure all students are reserved atomically.

2. **Rollback Strategy**: If any validation fails mid-reservation, roll back all changes.

3. **Notifications**: Implement email/SMS notifications to inform friends they've been added to a group reservation.

4. **Friend Acceptance** (Future Enhancement): Consider allowing friends to accept/reject invitations before finalizing.

5. **Payment Handling**: Decide if all students must pay individually or if group leader can pay for all.

6. **Cancellation Policy**: Define what happens if one student cancels from a group reservation.

## Frontend Behavior

### Placeholder Mode (Current)
Until backend is implemented, the frontend will:
- Show alert when adding friends indicating backend validation is needed
- Display friends with placeholder names
- Send friends array in API call
- Handle errors gracefully

### Production Mode (After Backend)
Once backend is ready:
- Remove placeholder logic in `validateAndAddFriend()`
- Call `GET /api/student/validate-friend/:matricNo`
- Display actual student names from backend
- Show real-time validation errors

## Questions for Backend Team

1. Should we require all friends to have paid before group reservation?
2. What happens if one friend cancels their reservation?
3. Should we auto-assign consecutive bunks or allow selection?
4. Do we need approval flow where friends confirm before finalizing?
5. Should group reservations have special privileges (e.g., can't be auto-assigned to different rooms)?

## Contact
For questions about this implementation, refer to:
- Frontend code: `app/student/hostels/[id]/rooms/page.tsx`
- API service: `services/api.ts` (studentAPI.reserveRoom)
