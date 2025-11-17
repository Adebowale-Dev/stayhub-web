import { create } from 'zustand';

interface College {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  departments?: Department[];
}

interface Department {
  _id: string;
  name: string;
  code: string;
  college: string | College;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  matricNo: string;
  email: string;
  level: 100 | 200 | 300 | 400 | 500;
  college: string | College;
  department: string | Department;
  paymentStatus?: string;
  reservationStatus?: string;
}

interface Hostel {
  _id: string;
  name: string;
  code: string;
  location: string;
  capacity: number;
  allowedLevels: number[];
  gender: 'male' | 'female' | 'mixed';
  occupiedRooms?: number;
  availableRooms?: number;
}

interface Room {
  _id: string;
  hostel: string | Hostel;
  roomNumber: string;
  capacity: number;
  floor?: number;
  occupied?: number;
  available?: number;
}

interface Porter {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  hostel?: string | Hostel;
  approved: boolean;
}

interface Payment {
  _id: string;
  student: string | Student;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  reference?: string;
  createdAt: string;
}

interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
}

interface DashboardStats {
  totalStudents: number;
  studentsPaid: number;
  studentsPending: number;
  totalHostels: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalPorters: number;
}

interface AdminStore {
  // Dashboard Stats
  dashboardStats: DashboardStats | null;
  statsLoading: boolean;
  
  // Colleges
  colleges: College[];
  collegesLoading: boolean;
  selectedCollege: College | null;
  
  // Departments
  departments: Department[];
  departmentsLoading: boolean;
  selectedDepartment: Department | null;
  
  // Students
  students: Student[];
  studentsLoading: boolean;
  selectedStudent: Student | null;
  totalStudents: number;
  
  // Hostels
  hostels: Hostel[];
  hostelsLoading: boolean;
  selectedHostel: Hostel | null;
  
  // Rooms
  rooms: Room[];
  roomsLoading: boolean;
  selectedRoom: Room | null;
  
  // Porters
  porters: Porter[];
  portersLoading: boolean;
  selectedPorter: Porter | null;
  
  // Payments
  payments: Payment[];
  paymentsLoading: boolean;
  paymentStats: PaymentStats | null;
  
  // Actions - Dashboard
  setDashboardStats: (stats: DashboardStats) => void;
  setStatsLoading: (loading: boolean) => void;
  
  // Actions - Colleges
  setColleges: (colleges: College[]) => void;
  setCollegesLoading: (loading: boolean) => void;
  setSelectedCollege: (college: College | null) => void;
  addCollege: (college: College) => void;
  updateCollege: (id: string, updates: Partial<College>) => void;
  removeCollege: (id: string) => void;
  
  // Actions - Departments
  setDepartments: (departments: Department[]) => void;
  setDepartmentsLoading: (loading: boolean) => void;
  setSelectedDepartment: (department: Department | null) => void;
  addDepartment: (department: Department) => void;
  
  // Actions - Students
  setStudents: (students: Student[]) => void;
  setStudentsLoading: (loading: boolean) => void;
  setSelectedStudent: (student: Student | null) => void;
  setTotalStudents: (total: number) => void;
  addStudent: (student: Student) => void;
  
  // Actions - Hostels
  setHostels: (hostels: Hostel[]) => void;
  setHostelsLoading: (loading: boolean) => void;
  setSelectedHostel: (hostel: Hostel | null) => void;
  addHostel: (hostel: Hostel) => void;
  updateHostel: (id: string, updates: Partial<Hostel>) => void;
  
  // Actions - Rooms
  setRooms: (rooms: Room[]) => void;
  setRoomsLoading: (loading: boolean) => void;
  setSelectedRoom: (room: Room | null) => void;
  addRoom: (room: Room) => void;
  
  // Actions - Porters
  setPorters: (porters: Porter[]) => void;
  setPortersLoading: (loading: boolean) => void;
  setSelectedPorter: (porter: Porter | null) => void;
  approvePorter: (porterId: string) => void;
  
  // Actions - Payments
  setPayments: (payments: Payment[]) => void;
  setPaymentsLoading: (loading: boolean) => void;
  setPaymentStats: (stats: PaymentStats) => void;
  
  // Clear all data (on logout)
  clearAdminData: () => void;
}

const useAdminStore = create<AdminStore>((set) => ({
  // Initial state - Dashboard
  dashboardStats: null,
  statsLoading: false,
  
  // Initial state - Colleges
  colleges: [],
  collegesLoading: false,
  selectedCollege: null,
  
  // Initial state - Departments
  departments: [],
  departmentsLoading: false,
  selectedDepartment: null,
  
  // Initial state - Students
  students: [],
  studentsLoading: false,
  selectedStudent: null,
  totalStudents: 0,
  
  // Initial state - Hostels
  hostels: [],
  hostelsLoading: false,
  selectedHostel: null,
  
  // Initial state - Rooms
  rooms: [],
  roomsLoading: false,
  selectedRoom: null,
  
  // Initial state - Porters
  porters: [],
  portersLoading: false,
  selectedPorter: null,
  
  // Initial state - Payments
  payments: [],
  paymentsLoading: false,
  paymentStats: null,
  
  // Actions - Dashboard
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setStatsLoading: (loading) => set({ statsLoading: loading }),
  
  // Actions - Colleges
  setColleges: (colleges) => set({ colleges }),
  setCollegesLoading: (loading) => set({ collegesLoading: loading }),
  setSelectedCollege: (college) => set({ selectedCollege: college }),
  addCollege: (college) => set((state) => ({ 
    colleges: [...state.colleges, college] 
  })),
  updateCollege: (id, updates) => set((state) => ({
    colleges: state.colleges.map(c => c._id === id ? { ...c, ...updates } : c)
  })),
  removeCollege: (id) => set((state) => ({
    colleges: state.colleges.filter(c => c._id !== id)
  })),
  
  // Actions - Departments
  setDepartments: (departments) => set({ departments }),
  setDepartmentsLoading: (loading) => set({ departmentsLoading: loading }),
  setSelectedDepartment: (department) => set({ selectedDepartment: department }),
  addDepartment: (department) => set((state) => ({ 
    departments: [...state.departments, department] 
  })),
  
  // Actions - Students
  setStudents: (students) => set({ students }),
  setStudentsLoading: (loading) => set({ studentsLoading: loading }),
  setSelectedStudent: (student) => set({ selectedStudent: student }),
  setTotalStudents: (total) => set({ totalStudents: total }),
  addStudent: (student) => set((state) => ({ 
    students: [...state.students, student],
    totalStudents: state.totalStudents + 1
  })),
  
  // Actions - Hostels
  setHostels: (hostels) => set({ hostels }),
  setHostelsLoading: (loading) => set({ hostelsLoading: loading }),
  setSelectedHostel: (hostel) => set({ selectedHostel: hostel }),
  addHostel: (hostel) => set((state) => ({ 
    hostels: [...state.hostels, hostel] 
  })),
  updateHostel: (id, updates) => set((state) => ({
    hostels: state.hostels.map(h => h._id === id ? { ...h, ...updates } : h)
  })),
  
  // Actions - Rooms
  setRooms: (rooms) => set({ rooms }),
  setRoomsLoading: (loading) => set({ roomsLoading: loading }),
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  addRoom: (room) => set((state) => ({ 
    rooms: [...state.rooms, room] 
  })),
  
  // Actions - Porters
  setPorters: (porters) => set({ porters }),
  setPortersLoading: (loading) => set({ portersLoading: loading }),
  setSelectedPorter: (porter) => set({ selectedPorter: porter }),
  approvePorter: (porterId) => set((state) => ({
    porters: state.porters.map(p => 
      p._id === porterId ? { ...p, approved: true } : p
    )
  })),
  
  // Actions - Payments
  setPayments: (payments) => set({ payments }),
  setPaymentsLoading: (loading) => set({ paymentsLoading: loading }),
  setPaymentStats: (stats) => set({ paymentStats: stats }),
  
  // Clear all data (on logout)
  clearAdminData: () => set({
    dashboardStats: null,
    colleges: [],
    departments: [],
    students: [],
    hostels: [],
    rooms: [],
    porters: [],
    payments: [],
    paymentStats: null,
  }),
}));

export default useAdminStore;