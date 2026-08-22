import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '../api/client';

let activeInstances = 0;
let registeredToken: string | null = null;

export default function usePushNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const tokenRef = useRef<string | null>(null);

  const registerWithBackend = useCallback(async (token: string) => {
    try {
      await api.post('/push/subscribe', {
        token,
        platform: Platform.OS,
        device_name: Device.deviceName || Device.modelName || `${Platform.OS} device`,
      });
    } catch {
      // Backend registration is best-effort; retried on next launch.
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: true },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      setPushToken(tokenData.data);
      tokenRef.current = tokenData.data;
      if (tokenData.data !== registeredToken) {
        await registerWithBackend(tokenData.data);
        registeredToken = tokenData.data;
      }
      return tokenData.data;
    } catch {
      return null;
    }
  }, [registerWithBackend]);

  useEffect(() => {
    activeInstances += 1;
    requestPermission();

    const subscription = Notifications.addNotificationReceivedListener((received) => {
      setNotification(received);
    });

    return () => {
      subscription.remove();
      activeInstances -= 1;
      if (activeInstances === 0 && tokenRef.current) {
        api.post('/push/unsubscribe', { token: tokenRef.current }).catch(() => {});
      }
    };
  }, [requestPermission]);

  return { pushToken, notification, requestPermission };
}
