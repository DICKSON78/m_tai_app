import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../src/api/client';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

interface Announcement {
  id: number;
  title: string;
  body: string;
  created_at?: string;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function normalizeAnnouncements(payload: unknown): Announcement[] {
  if (!payload) return [];
  const body = payload as Record<string, any>;
  const raw = body.data?.data ?? body.data ?? body;
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    id: item.id,
    title: item.title ?? '',
    body: item.body ?? '',
    created_at: item.created_at ?? item.createdAt,
  }));
}

export default function AdminAnnouncementsScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const requestSeqRef = useRef(0);

  const fetchAnnouncements = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;
    try {
      const res = await api.get('/admin/announcements');
      if (requestId !== requestSeqRef.current) return;
      setAnnouncements(normalizeAnnouncements(res.data));
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load announcements.'
      );
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = useCallback(async () => {
    const trimmedTitle = newTitle.trim();
    const trimmedBody = newBody.trim();
    if (!trimmedTitle || !trimmedBody) {
      Alert.alert('Missing fields', 'Both title and body are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/announcements', { title: trimmedTitle, body: trimmedBody });
      setModalVisible(false);
      setNewTitle('');
      setNewBody('');
      fetchAnnouncements();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || err?.message || 'Failed to create announcement.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [newTitle, newBody, fetchAnnouncements]);

  const handleDelete = useCallback(
    (item: Announcement) => {
      Alert.alert(
        'Delete Announcement',
        `Delete "${item.title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setDeletingId(item.id);
              try {
                await api.delete(`/admin/announcements/${item.id}`);
                setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
              } catch (err: any) {
                Alert.alert(
                  'Error',
                  err?.response?.data?.message || 'Failed to delete announcement.'
                );
              } finally {
                setDeletingId(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Announcement }) => (
      <Card style={styles.announcementCard}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            disabled={deletingId === item.id}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {deletingId === item.id ? (
              <Text style={[styles.deleteBtn, styles.deleteDisabled]}>…</Text>
            ) : (
              <MaterialIcons name="close" size={18} color={COLORS.red[500]} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.cardBody} numberOfLines={3}>
          {item.body}
        </Text>
        {item.created_at ? (
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        ) : null}
      </Card>
    ),
    [deletingId, handleDelete]
  );

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Announcements"
        subtitle={
          announcements.length > 0
            ? `${announcements.length} announcement${announcements.length === 1 ? '' : 's'}`
            : undefined
        }
        rightAction={
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.headerCreate}>+ Create</Text>
          </TouchableOpacity>
        }
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={announcements}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon={<MaterialIcons name="campaign" size={32} color={COLORS.gray[400]} />}
              title="No announcements"
              subtitle="Create an announcement to broadcast to all users."
              style={styles.empty}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Announcement</Text>
            <TouchableOpacity onPress={handleCreate} disabled={submitting}>
              <Text style={[styles.modalSend, submitting && styles.modalSendDisabled]}>
                {submitting ? 'Sending…' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.modalBody}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={COLORS.gray[400]}
              value={newTitle}
              onChangeText={setNewTitle}
              maxLength={200}
            />
            <View style={styles.inputDivider} />
            <TextInput
              style={[styles.input, styles.bodyInput]}
              placeholder="Write your announcement…"
              placeholderTextColor={COLORS.gray[400]}
              value={newBody}
              onChangeText={setNewBody}
              multiline
              textAlignVertical="top"
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorBanner: {
    backgroundColor: COLORS.red[100],
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  errorText: {
    flex: 1,
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
  },
  errorRetry: {
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  announcementCard: {
    gap: SPACING.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  deleteBtn: {
    fontSize: FONTS.size.lg,
    color: COLORS.red[500],
    fontFamily: FONTS.semibold,
    padding: 4,
  },
  deleteDisabled: {
    opacity: 0.4,
  },
  cardBody: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  cardDate: {
    fontSize: FONTS.size.xs,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },
  headerCreate: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
  /* Modal */
  modalSafe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  modalCancel: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  modalTitle: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  modalSend: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  modalSendDisabled: {
    opacity: 0.5,
  },
  modalBody: {
    flex: 1,
    padding: SPACING.md,
  },
  input: {
    fontSize: FONTS.size.lg,
    color: COLORS.text,
    paddingVertical: SPACING.sm + 2,
  },
  bodyInput: {
    flex: 1,
    fontSize: FONTS.size.md,
    lineHeight: 22,
  },
  inputDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
  },
});
