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
import Header from '../../src/components/Header';
import EmptyState from '../../src/components/EmptyState';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

interface AppNotification {
  id: number | string;
  title?: string;
  message?: string;
  type?: string;
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
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function notificationIcon(type?: string): keyof typeof MaterialIcons.glyphMap {
  const t = (type || '').toLowerCase();
  if (t.includes('order')) return 'receipt-long';
  if (t.includes('stock') || t.includes('inventory')) return 'inventory-2';
  if (t.includes('payment') || t.includes('finance')) return 'payments';
  if (t.includes('user') || t.includes('customer')) return 'person';
  return 'notifications';
}

export default function OwnerNotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(extractCount(res.data));
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(extractList(res.data));
      setError(null);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Could not load notifications.'
      );
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    void fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchNotifications();
    void fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handlePress = useCallback(
    async (item: AppNotification) => {
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
    },
    []
  );

  const handleMarkAllRead = useCallback(async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => (n.id ? { ...n, is_read: true } : n)));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll, unreadCount]);

  const handleDelete = useCallback(async (item: AppNotification) => {
    try {
      await api.delete(`/notifications/${item.id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      if (!item.is_read) setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      // ignore
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
      {notifications.length > 0 && unreadCount > 0 ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markingAll}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.markAllButton}
          >
            <MaterialIcons name="done-all" size={16} color={COLORS.primaryDark} />
            <Text style={styles.markAllText}>{markingAll ? 'Marking…' : 'Mark all as read'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {notifications.length === 0 && !error ? (
        <EmptyState
          icon={<MaterialIcons name="notifications-none" size={32} color={COLORS.gray[400]} />}
          title="No notifications"
          subtitle="You're all caught up."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => {
            const unread = !item.is_read;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePress(item)}
                style={[styles.card, unread && styles.cardUnread]}
              >
                <View style={styles.iconWrap}>
                  <MaterialIcons
                    name={notificationIcon(item.type)}
                    size={20}
                    color={COLORS.primaryDark}
                  />
                </View>
                <View style={styles.info}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.title || 'Notification'}
                    </Text>
                    {unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                  {item.message ? (
                    <Text style={styles.message} numberOfLines={2}>
                      {item.message}
                    </Text>
                  ) : null}
                  <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.deleteButton}
                >
                  <MaterialIcons name="close" size={18} color={COLORS.gray[400]} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  actionRow: {
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
  },
  markAllText: {
    color: COLORS.primaryDark,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  deleteButton: {
    padding: 2,
  },
  cardUnread: {
    backgroundColor: COLORS.teal[50],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  message: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  time: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.regular,
    color: COLORS.gray[400],
    marginTop: 2,
  },
});
