'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authAPI } from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Validation schema
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or matric number is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { setAuth, setLoading, setError, error, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    await performLogin(data, 0);
  };

  const performLogin = async (data: LoginFormData, retryCount: number) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Attempting login with:', { identifier: data.identifier });
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

      const response = await authAPI.login(data);
      
      console.log('Login response:', response.data);
      
      // Backend returns: { success, message, token, user: { id, email, firstName, lastName, role, firstLogin } }
      const { token, user } = response.data;

      // Normalize the user object to match our store interface
      const normalizedUser = {
        id: user.id || user._id,
        _id: user.id || user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        matricNo: user.matricNo,
        firstLogin: user.firstLogin,
      };

      // Store auth data (persists to localStorage)
      setAuth(normalizedUser, token);

      console.log('Auth set successfully, redirecting to:', useAuthStore.getState().getRedirectPath());

      // Redirect based on role
      const redirectPath = useAuthStore.getState().getRedirectPath();
      router.replace(redirectPath);
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      const error = err as { 
        response?: { 
          status?: number;
          data?: { message?: string; error?: string } 
        };
        code?: string;
        message?: string;
      };

      // Handle rate limiting with retry
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setError(`Too many requests. Retrying in ${delay / 1000} seconds...`);
        console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return performLogin(data, retryCount + 1);
      }

      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          setError('⚠️ Connection timeout. Please check if the backend server is running on port 5000.');
        } else if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
          setError('⚠️ Cannot connect to server. Please ensure the backend is running at http://localhost:5000');
        } else {
          setError('⚠️ Connection failed. Please check your internet connection and ensure the backend server is running.');
        }
        return;
      }

      // Handle specific HTTP errors
      if (error.response?.status === 429) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else if (error.response?.status === 401) {
        setError('Invalid email/matric number or password. Please check your credentials.');
      } else if (error.response?.status === 404) {
        setError('Login endpoint not found. Please ensure the backend is properly configured.');
      } else {
        const message = error.response?.data?.message || 
                       error.response?.data?.error || 
                       'Login failed. Please try again.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to StayHub</CardTitle>
        <CardDescription>Sign in with your email or matric number</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="identifier">Email or Matric Number</Label>
            <Input id="identifier" placeholder="admin@example.com or BU22CSC1005" {...register('identifier')} disabled={isLoading} />
            {errors.identifier && <p className="text-sm text-red-600 dark:text-red-400">{errors.identifier.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" {...register('password')} disabled={isLoading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={() => router.push('/forgot-password')} disabled={isLoading}>
          Forgot password?
        </Button>
      </CardFooter>
    </Card>
  );
}
