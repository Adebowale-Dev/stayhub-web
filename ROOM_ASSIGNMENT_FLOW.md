# Room Assignment Flow - StayHub

## Overview
This document explains how room assignment works in the StayHub system, from student reservation to porter check-in.

---

## Current Flow (As Designed)

### Step 1: Student Makes Reservation
**Location:** `/student/hostels/[id]/rooms` (Browse Hostels → View Rooms)

1. Student browses available hostels
2. Student views rooms in a specific hostel
3. Student clicks "Reserve Room" on an available room
4. System creates a reservation with:
   - Student ID
   - Hostel ID
   - Room ID
   - Status: `pending` or `confirmed`
   - Reserved date

**Backend API:** `POST /api/student/reserve`

**Payload:**
```json
{
  "roomId": "6925e49326cce7bf7d359727",
  "hostelId": "6925e49326cce7bf7d359725"
}
```

---

### Step 2: Porter Views Pending Students
**Location:** `/porter/checkin` or `/porter/students`

Porter can see students who have made reservations in their assigned hostel.

**Backend API:** `GET /api/porter/students`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "student123",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "matricNo": "CSC/2020/001",
      "phone": "+234...",
      "department": { "name": "Computer Science" },
      "level": 300,
      "reservation": {
        "_id": "res123",
        "status": "confirmed", // or "pending"
        "room": {
          "_id": "room123",
          "roomNumber": "101",
          "floor": 1
        },
        "bunk": {
          "_id": "bunk123",
          "bunkNumber": 1,
          "position": "upper"
        },
        "reservedAt": "2025-11-27T10:00:00Z"
      },
      "checkInStatus": "pending" // or "checked-in"
    }
  ]
}
```

---

### Step 3: Porter Checks In Student
**Location:** `/porter/checkin`

1. Porter sees list of students with status `pending`
2. Porter clicks "Check In Student" button
3. System updates student's check-in status
4. Room occupancy is updated

**Backend API:** `POST /api/porter/checkin/:studentId`

**What Should Happen:**
- Student `checkInStatus` changes from `pending` to `checked-in`
- Reservation `status` changes to `checked-in`
- Room `currentOccupants` increases by 1
- Room `availableSpaces` decreases by 1
- Student gets access to hostel facilities

---

## Room Assignment Methods

### Method 1: Automatic Assignment (Current)
When student reserves a room:
- Room is automatically assigned via reservation
- Student chooses specific room from available list
- No manual porter assignment needed

### Method 2: Manual Assignment (To Be Implemented)
Porter assigns room after student arrives:
1. Student pays for accommodation
2. Student appears in porter's "Unassigned Students" list
3. Porter manually assigns available room
4. Student receives room assignment notification

---

## Current Issues to Fix

### Issue 1: Porter Not Seeing Students
**Problem:** After student reserves room, porter doesn't see them in check-in list

**Possible Causes:**
1. Backend not returning students with reservations to porter
2. Field name mismatch (`checkInStatus` vs `status`)
3. Porter assigned to different hostel than student's reservation
4. Reservation status not set correctly

**Solution:**
- Check backend endpoint: `GET /api/porter/students`
- Ensure it returns students from porter's assigned hostel
- Include reservation details in response
- Set correct `checkInStatus` field

### Issue 2: Field Mapping
**Problem:** Frontend expects specific field names that backend might not provide

**Frontend Expects:**
```typescript
{
  name: string,              // Could be firstName + lastName
  matricNumber: string,      // Could be matricNo
  checkInStatus: string,     // Could be reservation.status
  roomAssignment: {          // Could be reservation object
    room: { roomNumber, _id },
    bunkNumber: number
  }
}
```

**Solution:** Frontend now maps multiple possible field structures

---

## Backend Requirements

### 1. Reservation Creation
```javascript
// POST /api/student/reserve
{
  studentId: req.user._id,
  hostelId: req.body.hostelId,
  roomId: req.body.roomId,
  status: "pending" or "confirmed",
  reservedAt: new Date(),
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
}
```

### 2. Porter Students Endpoint
```javascript
// GET /api/porter/students
// Should return students who have reservations in porter's assigned hostel

const porter = await Porter.findById(req.user._id).populate('hostel');
const students = await Student.find()
  .populate({
    path: 'reservation',
    match: { hostel: porter.hostel._id },
    populate: ['room', 'bunk', 'hostel']
  })
  .populate('department')
  .where('reservation').ne(null);
```

### 3. Check-In Endpoint
```javascript
// POST /api/porter/checkin/:studentId
const student = await Student.findById(studentId).populate('reservation');

// Update reservation status
student.reservation.status = 'checked-in';
student.reservation.checkedInAt = new Date();

// Update room occupancy
const room = await Room.findById(student.reservation.room);
room.currentOccupants += 1;
room.availableSpaces -= 1;

await student.reservation.save();
await room.save();
```

---

## Testing Checklist

- [ ] Student can view available rooms
- [ ] Student can reserve a room
- [ ] Reservation is created in database
- [ ] Porter sees student in check-in list
- [ ] Porter can check in student
- [ ] Room occupancy updates after check-in
- [ ] Student can view their reservation
- [ ] Multiple students can reserve rooms in same hostel

---

## Next Features to Implement

1. **Bunk Selection**
   - Show available bunks when reserving room
   - Let student choose upper/lower bunk
   - Track individual bunk assignments

2. **Group Reservations**
   - Allow students to reserve as a group
   - Ensure group members get same room
   - Handle group invitations/confirmations

3. **Reservation Expiry**
   - Auto-cancel unpaid reservations after 48 hours
   - Porter can manually release expired reservations
   - Send notifications before expiry

4. **Manual Room Assignment**
   - Porter can assign/reassign rooms
   - Handle room swaps/transfers
   - Bulk room assignment for multiple students

---

## Troubleshooting

### Students Not Appearing in Porter List

1. **Check Console Logs:**
   - Open browser console
   - Go to porter students or check-in page
   - Look for "Students API Response" logs
   - Check if students array is empty

2. **Verify Backend Response:**
   - Use Postman/Thunder Client
   - Call `GET /api/porter/students`
   - Check response structure
   - Verify student data includes reservation

3. **Check Database:**
   - Verify student has reservation
   - Verify reservation points to correct hostel
   - Verify porter is assigned to same hostel
   - Check reservation status field

4. **Field Mapping:**
   - Console logs will show field names
   - Update frontend mapping if needed
   - Check for `firstName/lastName` vs `name`
   - Check for `matricNo` vs `matricNumber`

---

## Contact & Support

For issues with room assignment:
1. Check browser console logs
2. Share the logged data structure
3. Verify backend API responses
4. Check database records
