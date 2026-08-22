import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import LoadingScreen from '../src/components/LoadingScreen';
import { useAuthStore } from '../src/store/authStore';

const ROLE_ROUTES = {
  customer: '/(customer)',
  transporter: '/(transporter)',
  employee: '/(employee)',
  business_owner: '/(owner)',
  admin: '/(admin)',
} as const;

export default function RoleRouter() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    const route =
      (user && ROLE_ROUTES[user.role as keyof typeof ROLE_ROUTES]) ||
      '/(customer)';
    router.replace(route);
  }, [isAuthenticated, isLoading, user, router]);

  return <LoadingScreen />;
}
