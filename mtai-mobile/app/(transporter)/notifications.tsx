import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../src/api/client';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

interface AppNotification {
  id: number | string;
  title?: string;
  message?: string;
  type?: string;
  link?: string | null;
  is_read?: boolean;
  created_at?: string;
}

function extractList(body: unknown): AppNotification[] {
  if (!body || typeof body !== 'object') return [];
  const data = (body as { data?: unknown }).data;
  if (Array.isArray(body)) return body as AppNotification[];
  if (Array.isArray(data)) return data as AppNotification[];
  if (Array.isArray((data as { data?: unknown } | undefined)?.data)) {
    return (data as { data: AppNotification[] }).data;
  }
  return [];
}

function extractCount(body: unknown): number {
  if (typeof body === 'number') return body;
  if (body && typeof body === 'object') {
    const source = body as Record<string, unknown>;
    const value = source.unread_count ?? source.count ?? source.total;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()}`;
}

export default function TransporterNotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [listRes, countRes] = await Promise.allSettled([
      api.get('/notifications'),
      api.get('/notifications/unread-count'),
    ]);
    if (listRes.status === 'fulfilled') {
      setNotifications(extractList(listRes.value.data));
      setError(null);
    } else {
      setError('Could not load notifications.');
    }
    if (countRes.status === 'fulfilled') {
      setUnreadCount(extractCount(countRes.value.data));
    }
    setInitialLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handlePress = useCallback(async (item: AppNotification) => {
    if (!item.is_read) {
      try {
        await api.put(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // ignore
      }
    }

    const link = item.link ?? '';
    const deliveryId = link.match(/[?&]id=(\d+)/)?.[1];
    if (link.includes('delivery-request') && deliveryId) {
      router.push({
        pathname: '/(transporter)/delivery-request',
        params: { id: deliveryId },
      });
    } else if (deliveryId) {
      router.push({
        pathname: '/(transporter)/delivery-detail',
        params: { id: deliveryId },
      });
    }
  }, []);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        onBack={() => router.back()}
      />
      {notifications.length === 0 && !error ? (
        <EmptyState
          icon={<MaterialIcons name="notifications-none" size={32} color={COLORS.gray[400]} />}
          title="No notifications"
          subtitle="New load offers will appear here."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void fetchData();
              }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void handlePress(item)}
              style={[styles.card, !item.is_read && styles.cardUnread]}
            >
              <View style={styles.iconWrap}>
                <MaterialIcons
                  name={item.type === 'delivery_update' ? 'local-shipping' : 'notifications'}
                  size={20}
                  color={COLORS.primaryDark}
                />
              </View>
              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title || 'Notification'}
                  </Text>
                  {!item.is_read ? <View style={styles.unreadDot} /> : null}
                </View>
                {item.message ? (
                  <Text style={styles.message} numberOfLines={3}>
                    {item.message}
                  </Text>
                ) : null}
                <Text style={styles.time}>{formatTime(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.md, gap: SPACING.sm, paddingTop: SPACING.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  cardUnread: { backgroundColor: COLORS.teal[50] },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: { flex: 1, color: COLORS.text, fontSize: FONTS.size.md, fontFamily: FONTS.bold },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  message: { color: COLORS.gray[700], fontSize: FONTS.size.sm, marginTop: 4, lineHeight: 18 },
  time: { color: COLORS.textLight, fontSize: FONTS.size.xs, marginTop: 6 },
  error: { color: COLORS.red[700], textAlign: 'center', padding: SPACING.md },
});
