import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

interface NotificationData {
  type?: 'order_update' | 'delivery_update';
  order_id?: number | string;
  delivery_id?: number | string;
  [key: string]: unknown;
}

let configured = false;

export function configureNotificationHandler() {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? {},
      sound: 'default',
    },
    trigger: null,
  });
}

export function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as NotificationData | undefined;
  if (!data?.type) return;

  switch (data.type) {
    case 'order_update': {
      if (data.order_id != null) {
        router.push({
          pathname: '/(customer)/order-detail',
          params: { id: String(data.order_id) },
        });
      }
      break;
    }
    case 'delivery_update': {
      if (data.delivery_id != null) {
        router.push({
          pathname: '/(transporter)/delivery-detail',
          params: { id: String(data.delivery_id) },
        });
      }
      break;
    }
    default:
      break;
  }
}
