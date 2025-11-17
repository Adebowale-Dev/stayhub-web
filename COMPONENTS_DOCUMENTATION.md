# College Management Reusable Components

This document describes the reusable UI components created for the college management pages.

## Component Overview

All components are located in `components/colleges/` and can be imported from `@/components/colleges`.

### 1. **CollegeCard**
A card component that displays college information in a grid layout.

**Location:** `components/colleges/CollegeCard.tsx`

**Props:**
```typescript
interface CollegeCardProps {
  college: {
    _id: string;
    code: string;
    name: string;
    isActive: boolean;
    deanName?: string;
    deanEmail?: string;
    departments?: Department[];
  };
  studentCount?: number;
  isSuperAdmin?: boolean;
  onDelete?: (id: string, name: string, code: string) => void;
}
```

**Usage:**
```tsx
<CollegeCard
  college={college}
  studentCount={150}
  isSuperAdmin={true}
  onDelete={handleDeleteClick}
/>
```

**Features:**
- College code and name with Building2 icon
- Active/Inactive status badge
- Department count and student count stats
- Dean information (if available)
- Action buttons: View (always), Edit & Delete (superadmin only)
- Hover effects with shadow and border color change
- Responsive design with proper truncation

---

### 2. **StatCard**
A statistics display card with icon, value, and label.

**Location:** `components/colleges/StatCard.tsx`

**Props:**
```typescript
interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  value: number | string;
  label: string;
  onClick?: () => void;
}
```

**Usage:**
```tsx
<StatCard
  icon={GraduationCap}
  iconColor="text-green-600"
  iconBgColor="bg-green-500/10"
  value={25}
  label="Departments"
/>

<StatCard
  icon={Users}
  iconColor="text-blue-600"
  iconBgColor="bg-blue-500/10"
  value={1500}
  label="Total Students"
  onClick={() => router.push('/students')}
/>
```

**Features:**
- Customizable icon with color and background
- Large value display (text-xl font-semibold)
- Small label text (text-xs)
- Optional onClick handler
- Hover effects when clickable
- Consistent padding and spacing

---

### 3. **DeanInfoCard**
A card displaying dean information.

**Location:** `components/colleges/DeanInfoCard.tsx`

**Props:**
```typescript
interface DeanInfoCardProps {
  deanName: string;
  deanEmail?: string;
}
```

**Usage:**
```tsx
<DeanInfoCard
  deanName="Dr. John Smith"
  deanEmail="john.smith@university.edu"
/>
```

**Features:**
- "Dean" label in muted text
- Dean name in semibold
- Optional email in muted text
- Consistent card styling with other StatCards

---

### 4. **PageHeader**
A sticky header component for detail pages.

**Location:** `components/colleges/PageHeader.tsx`

**Props:**
```typescript
interface PageHeaderProps {
  icon?: LucideIcon;
  code?: string;
  title: string;
  isActive?: boolean;
  backUrl: string;
  backLabel?: string;
  actionButton?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
}
```

**Usage:**
```tsx
<PageHeader
  code="CS"
  title="Computer Science"
  isActive={true}
  backUrl="/admin/colleges"
  backLabel="Back"
  actionButton={{
    label: "Add Department",
    icon: Plus,
    onClick: () => router.push('/create'),
  }}
/>
```

**Features:**
- Sticky positioning with backdrop blur
- Back button with customizable label
- Icon, code, and title display
- Active/Inactive status badge
- Optional action button
- Responsive design (text size changes on mobile)
- Truncation for long titles

---

### 5. **EmptyState**
A centered empty state component with icon, title, description, and optional action button.

**Location:** `components/colleges/EmptyState.tsx`

**Props:**
```typescript
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
}
```

**Usage:**
```tsx
<EmptyState
  icon={GraduationCap}
  title="No departments yet"
  description="Get started by creating the first department for this college"
  actionButton={{
    label: "Add First Department",
    icon: Plus,
    onClick: () => router.push('/create'),
  }}
/>
```

**Features:**
- Large icon with opacity for visual softness
- Clear title and description
- Optional call-to-action button
- Centered layout with proper spacing
- Consistent with design system

---

### 6. **LoadingState**
A centered loading spinner with message.

**Location:** `components/colleges/LoadingState.tsx`

**Props:**
```typescript
interface LoadingStateProps {
  message?: string;
}
```

**Usage:**
```tsx
<LoadingState message="Loading colleges..." />
<LoadingState /> // Uses default "Loading..." message
```

**Features:**
- Centered spinner animation
- Customizable message
- Consistent sizing (w-6 h-6)
- Small text (text-xs)
- Muted foreground color

---

### 7. **ErrorState**
An error display component with message and optional back button.

**Location:** `components/colleges/ErrorState.tsx`

**Props:**
```typescript
interface ErrorStateProps {
  message: string;
  onBack?: () => void;
  backLabel?: string;
}
```

**Usage:**
```tsx
<ErrorState
  message="College not found"
  onBack={() => router.push('/admin/colleges')}
  backLabel="Back to Colleges"
/>

<ErrorState message="Failed to load data" />
```

**Features:**
- Red destructive styling
- AlertCircle icon
- Error title and message
- Optional back button
- Consistent padding and spacing

---

## Design System Guidelines

All components follow these design principles:

### Sizing
- **Small icons:** `w-3.5 h-3.5` for buttons/stats
- **Medium icons:** `w-4 h-4` for headers/cards
- **Large icons:** `w-6 h-6` for loading states
- **Huge icons:** `w-10 h-10` for empty states

### Typography
- **Tiny text:** `text-xs` for labels, helper text, codes
- **Small text:** `text-sm` for body text, names
- **Base text:** `text-base` for section headers
- **Large text:** `text-lg` for page titles (desktop)
- **Huge text:** `text-xl` for stat values

### Spacing
- **Tight gap:** `gap-1` for icon buttons
- **Normal gap:** `gap-2` or `gap-2.5` for cards/stats
- **Loose gap:** `gap-3` for grid layouts
- **Card padding:** `p-3` for compact cards, `p-4` for standard cards

### Colors
- **Primary:** `text-primary`, `bg-primary` for brand elements
- **Muted:** `text-muted-foreground` for secondary text
- **Destructive:** `text-destructive`, `bg-destructive/10` for errors/delete
- **Success:** `text-green-600`, `bg-green-500/10` for active/positive
- **Info:** `text-blue-600`, `bg-blue-500/10` for informational

### Interactive Elements
- **Buttons:** `h-7` for compact, `h-8` for normal, `h-9` for prominent
- **Hover effects:** `hover:shadow-md`, `hover:border-primary/50`
- **Transitions:** `transition-all` for smooth animations

---

## Component Exports

All components are exported from `components/colleges/index.ts`:

```typescript
export { CollegeCard } from "./CollegeCard";
export { StatCard } from "./StatCard";
export { DeanInfoCard } from "./DeanInfoCard";
export { PageHeader } from "./PageHeader";
export { EmptyState } from "./EmptyState";
export { LoadingState } from "./LoadingState";
export { ErrorState } from "./ErrorState";
```

**Import syntax:**
```typescript
import { CollegeCard, StatCard, PageHeader } from "@/components/colleges";
```

---

## Usage Examples

### Colleges List Page
```tsx
import { CollegeCard, LoadingState } from "@/components/colleges";

// Loading state
{loading && <LoadingState message="Loading colleges..." />}

// Grid of cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
  {filteredColleges.map((college) => (
    <CollegeCard
      key={college._id}
      college={college}
      studentCount={getStudentCount(college._id)}
      isSuperAdmin={isSuperAdmin}
      onDelete={handleDeleteClick}
    />
  ))}
</div>
```

### College Detail Page
```tsx
import {
  PageHeader,
  StatCard,
  DeanInfoCard,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/colleges";

// Loading
{loading && <LoadingState message="Loading college details..." />}

// Error
{error && (
  <ErrorState
    message={error}
    onBack={() => router.push("/admin/colleges")}
    backLabel="Back to Colleges"
  />
)}

// Header
<PageHeader
  code={college.code}
  title={college.name}
  isActive={college.isActive}
  backUrl="/admin/colleges"
  actionButton={{
    label: "Add Department",
    icon: Plus,
    onClick: () => router.push('/create'),
  }}
/>

// Stats grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  <StatCard
    icon={GraduationCap}
    iconColor="text-green-600"
    iconBgColor="bg-green-500/10"
    value={departments.length}
    label="Departments"
  />
  
  <StatCard
    icon={Users}
    iconColor="text-blue-600"
    iconBgColor="bg-blue-500/10"
    value={totalStudents}
    label="Total Students"
  />
  
  {college.deanName && (
    <DeanInfoCard
      deanName={college.deanName}
      deanEmail={college.deanEmail}
    />
  )}
</div>

// Empty state
{departments.length === 0 && (
  <EmptyState
    icon={GraduationCap}
    title="No departments yet"
    description="Get started by creating the first department"
    actionButton={{
      label: "Add First Department",
      icon: Plus,
      onClick: () => router.push('/create'),
    }}
  />
)}
```

---

## Benefits

1. **Consistency:** All pages use the same visual design and spacing
2. **Maintainability:** Changes to design system can be made in one place
3. **Reusability:** Components can be used across different pages and features
4. **Type Safety:** Full TypeScript support with proper interfaces
5. **Accessibility:** Proper semantic HTML and ARIA labels
6. **Responsiveness:** Mobile-first design with responsive breakpoints
7. **Performance:** Lightweight components with minimal re-renders

---

## Future Enhancements

Potential improvements for these components:

1. **DepartmentCard:** Similar to CollegeCard for department listings
2. **StudentCard:** For student grid/list views
3. **FilterBar:** Reusable search and filter component
4. **DataTable:** Generic table component with sorting/filtering
5. **FormCard:** Standardized card for forms
6. **ConfirmDialog:** Generic confirmation dialog component
7. **Toast notifications:** For success/error feedback
8. **Skeleton loaders:** For better loading states

---

## Last Updated
November 14, 2025
