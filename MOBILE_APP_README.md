# StayHub Student Mobile App - Development Guide

## Overview

This guide will help you create a mobile application for the StayHub student portal using **React Native** with **Expo**. The mobile app will connect to your existing backend API and provide students with hostel management features on their mobile devices.

---

## 🎯 Features to Implement

### Core Features
- ✅ Student Authentication (Login/Logout)
- ✅ Dashboard with student info and stats
- ✅ Browse Available Hostels
- ✅ View Hostel Rooms & Availability
- ✅ Room Reservation (Single & Group)
- ✅ Payment Processing (Paystack Integration)
- ✅ Payment Code Verification
- ✅ View Current Reservation Details
- ✅ Profile Management
- ✅ Push Notifications (for payment reminders, reservation updates)

### Optional Features
- Settings & Preferences
- Chat Support
- QR Code for Check-in
- Document Upload (for verification)

---

## 🛠️ Technology Stack

### Recommended: React Native + Expo (Easiest)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand (same as web app)
- **API Client**: Axios
- **Navigation**: React Navigation
- **UI Library**: React Native Paper or NativeBase
- **Payment**: Paystack React Native SDK

### Alternative: Flutter (If you prefer Dart)
- **Framework**: Flutter
- **Language**: Dart
- **State Management**: Provider or Riverpod
- **API Client**: Dio
- **Payment**: Paystack Flutter

---

## 📋 Prerequisites

Before starting, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **pnpm**
3. **Expo CLI**: `npm install -g expo-cli`
4. **Expo Go App** (on your phone for testing)
5. **Android Studio** (for Android development)
6. **Xcode** (for iOS development - Mac only)

---

## 🚀 Quick Start with Expo

### Step 1: Create New Expo Project

```bash
# Create new project
npx create-expo-app stayhub-mobile --template blank-typescript

# Navigate to project
cd stayhub-mobile

# Install dependencies
npm install
```

### Step 2: Install Required Packages

```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# UI Components
npm install react-native-paper react-native-vector-icons
npm install @expo/vector-icons

# State Management
npm install zustand

# API & Storage
npm install axios @react-native-async-storage/async-storage

# Payment
npm install react-native-paystack-webview

# Forms
npm install react-hook-form

# Additional utilities
npm install expo-status-bar expo-constants
```

### Step 3: Project Structure

Create the following folder structure:

```
stayhub-mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   ├── (student)/
│   │   ├── dashboard.tsx
│   │   ├── hostels.tsx
│   │   ├── rooms/[id].tsx
│   │   ├── reservation.tsx
│   │   ├── payment.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── HostelCard.tsx
│   ├── RoomCard.tsx
│   └── ReservationCard.tsx
├── services/
│   └── api.ts
├── store/
│   └── authStore.ts
├── constants/
│   └── config.ts
├── types/
│   └── index.ts
└── App.tsx
```

---

## 📝 Implementation Guide

### 1. Configure API Connection

**File: `constants/config.ts`**

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api', // Change for production
  TIMEOUT: 120000,
};

// For testing on physical device, use your computer's IP:
// BASE_URL: 'http://192.168.1.100:5000/api'
```

### 2. Create API Service

**File: `services/api.ts`**

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { matricNumber: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getHostels: () => api.get('/student/hostels'),
  getRooms: (hostelId: string) => api.get(`/student/hostels/${hostelId}/rooms`),
  reserveRoom: (data: any) => api.post('/student/reservations', data),
  getReservation: () => api.get('/student/reservation'),
};

export const paymentAPI = {
  getAmount: () => api.get('/student/payment/amount'),
  initialize: (amount: number) => api.post('/student/payment/initialize', { amount }),
  getStatus: () => api.get('/student/payment/status'),
  verifyWithCode: (paymentCode: string) =>
    api.post('/student/payment/verify-code', { paymentCode }),
};

export default api;
```

### 3. Create Auth Store

**File: `store/authStore.ts`**

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  matricNumber: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: async (user, token) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadAuth: async () => {
    const token = await AsyncStorage.getItem('token');
    const userString = await AsyncStorage.getItem('user');
    if (token && userString) {
      const user = JSON.parse(userString);
      set({ user, token, isAuthenticated: true });
    }
  },
}));
```

### 4. Create Login Screen

**File: `app/(auth)/login.tsx`**

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async () => {
    if (!matricNumber || !password) {
      Alert.alert('Error', 'Please enter matric number and password');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ matricNumber, password });
      const { token, user } = response.data;
      
      await setAuth(user, token);
      
      Alert.alert('Success', 'Login successful!');
      router.replace('/(student)/dashboard');
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            StayHub Student Portal
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Login to access your hostel services
          </Text>

          <TextInput
            label="Matric Number"
            value={matricNumber}
            onChangeText={setMatricNumber}
            mode="outlined"
            style={styles.input}
            autoCapitalize="characters"
            disabled={loading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Login
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotButton}
          >
            Forgot Password?
          </Button>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  forgotButton: {
    marginTop: 8,
  },
});
```

### 5. Create Dashboard Screen

**File: `app/(student)/dashboard.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Button, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { studentAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function DashboardScreen() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const loadDashboard = async () => {
    try {
      const response = await studentAPI.getDashboard();
      setDashboard(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Info Card */}
      <Card style={styles.card}>
        <Card.Content style={styles.userInfo}>
          <Avatar.Text
            size={64}
            label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
          />
          <View style={styles.userDetails}>
            <Text variant="headlineSmall">
              {user?.firstName} {user?.lastName}
            </Text>
            <Text variant="bodyMedium" style={styles.matricNumber}>
              {user?.matricNumber}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          mode="contained"
          icon="home"
          onPress={() => router.push('/(student)/hostels')}
          style={styles.actionButton}
        >
          Browse Hostels
        </Button>
        <Button
          mode="contained"
          icon="receipt"
          onPress={() => router.push('/(student)/payment')}
          style={styles.actionButton}
        >
          Payment
        </Button>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.statLabel}>
              Payment Status
            </Text>
            <Text
              variant="headlineSmall"
              style={dashboard?.paymentStatus === 'paid' ? styles.paid : styles.pending}
            >
              {dashboard?.paymentStatus || 'Pending'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.statLabel}>
              Reservation
            </Text>
            <Text variant="headlineSmall">
              {dashboard?.hasReservation ? 'Active' : 'None'}
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userDetails: {
    flex: 1,
  },
  matricNumber: {
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    color: '#666',
    marginBottom: 8,
  },
  paid: {
    color: '#4caf50',
  },
  pending: {
    color: '#ff9800',
  },
});
```

### 6. Configure App Navigation

**File: `app/_layout.tsx`**

```typescript
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
```

---

## 🎨 UI Components to Create

### Key Components:
1. **HostelCard** - Display hostel info with image, gender badge
2. **RoomCard** - Show room number, occupancy, availability
3. **ReservationCard** - Display current reservation details
4. **PaymentCard** - Show payment status and amount
5. **LoadingSpinner** - Custom loading indicator
6. **EmptyState** - For empty lists/no data

---

## 💳 Payment Integration (Paystack)

**File: `app/(student)/payment.tsx`**

```typescript
import React, { useState } from 'react';
import { View } from 'react-native';
import { Paystack } from 'react-native-paystack-webview';
import { Button } from 'react-native-paper';
import { paymentAPI } from '../../services/api';

export default function PaymentScreen() {
  const [paystackKey] = useState('YOUR_PAYSTACK_PUBLIC_KEY');
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState('');

  const initializePayment = async () => {
    try {
      const response = await paymentAPI.initialize(50000); // Amount in kobo
      setAmount(response.data.amount);
      setReference(response.data.reference);
    } catch (error) {
      console.error('Failed to initialize payment:', error);
    }
  };

  return (
    <View>
      <Paystack
        paystackKey={paystackKey}
        amount={amount}
        billingEmail="student@example.com"
        activityIndicatorColor="green"
        onCancel={() => console.log('Payment cancelled')}
        onSuccess={(res) => {
          // Verify payment with backend
          console.log('Payment successful:', res);
        }}
        autoStart={false}
      />
      <Button onPress={initializePayment}>Make Payment</Button>
    </View>
  );
}
```

---

## 📱 Testing

### Test on Physical Device

1. **Install Expo Go** app from Play Store/App Store
2. **Run development server**:
   ```bash
   npm start
   ```
3. **Scan QR code** with Expo Go app
4. **Test all features** on your device

### Test on Emulator

**Android:**
```bash
npm run android
```

**iOS (Mac only):**
```bash
npm run ios
```

---

## 🚀 Building for Production

### Build APK (Android)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

### Build IPA (iOS)

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

---

## 🔧 Environment Variables

Create **`.env`** file:

```env
API_BASE_URL=https://your-backend.com/api
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

---

## 📚 Additional Resources

- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **React Native Paper**: https://callstack.github.io/react-native-paper
- **Paystack React Native**: https://github.com/just1and0/React-Native-Paystack-WebView

---

## ✅ Feature Checklist

- [ ] Authentication (Login/Logout)
- [ ] Dashboard with stats
- [ ] Browse hostels list
- [ ] View rooms for selected hostel
- [ ] Room reservation (single student)
- [ ] Group reservation with friends
- [ ] Payment initialization
- [ ] Paystack payment integration
- [ ] Payment code verification
- [ ] View current reservation
- [ ] Profile management
- [ ] Push notifications setup
- [ ] Error handling & loading states
- [ ] Offline support (AsyncStorage)
- [ ] Pull-to-refresh functionality

---

## 🎯 Next Steps

1. **Set up the project** using the commands above
2. **Implement authentication** first (login/logout)
3. **Build core features** (dashboard, hostels, rooms)
4. **Add payment integration** with Paystack
5. **Test thoroughly** on physical devices
6. **Add push notifications** for updates
7. **Build and deploy** to Play Store/App Store

---

## 💡 Tips

- **Use Expo for faster development** - No need for Android Studio/Xcode initially
- **Test on real devices** - Emulators don't always show real performance
- **Handle offline scenarios** - Store critical data locally
- **Add loading states everywhere** - Mobile connections can be slow
- **Use React Native Paper** - Pre-built components save time
- **Implement pull-to-refresh** - Users expect this on mobile
- **Add proper error messages** - Network errors are common on mobile

---

## 🐛 Common Issues & Solutions

**Issue: Can't connect to backend on physical device**
- Solution: Use your computer's IP address instead of `localhost`
- Example: `http://192.168.1.100:5000/api`

**Issue: CORS errors**
- Solution: Configure backend to allow mobile app origin

**Issue: Images not loading**
- Solution: Use absolute URLs for images

**Issue: Build fails**
- Solution: Check Expo version compatibility, update dependencies

---

## 📞 Support

For questions or issues:
- Check Expo documentation
- Visit React Native community forums
- Review existing web app code for API patterns

---

**Good luck building your StayHub mobile app! 🚀**
