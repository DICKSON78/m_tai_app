import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { Bell, CheckCircle, CheckCheck, Trash2, Package, DollarSign, Filter, RotateCcw } from 'lucide-react';

const NOTIFICATION_ICONS = {
    order: <Package size={18} />,
    system: <CheckCircle size={18} />,
    stock: <Package size={18} />,
    payment: <DollarSign size={18} />,
};

const BG_BY_TYPE = {
    order: 'bg-[#00D4AA]/10 text-[#00D4AA]',
    system: 'bg-[#00D4AA]/10 text-[#00B894]',
    stock: 'bg-orange-100 text-orange-600',
    payment: 'bg-purple-100 text-purple-600',
};

const DEFAULT_BG = 'bg-gray-100 text-gray-600';

export default function NotificationListPage() {
    document.title = 'Notifications - M-TAI';
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [processingIds, setProcessingIds] = useState(new Set());

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 20 };
            if (activeTab === 'unread') params.read = 0;
            const res = await api.get('/notifications', { params });
            setNotifications(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch (error) { console.error('Failed to fetch notifications:', error); setNotifications([]); } finally { setLoading(false); }
    }, [activeTab, currentPage]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
    useEffect(() => { setCurrentPage(1); }, [activeTab]);

    const markAsRead = async (id) => {
        if (processingIds.has(id)) return;
        setProcessingIds(prev => new Set(prev).add(id));
        try { await api.put(`/notifications/${id}/read`); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString(), is_read: true } : n)); } catch (error) { console.error('Failed to mark notification as read:', error); alert(error?.response?.data?.message || 'Failed to mark as read.'); } finally { setProcessingIds(prev => { const next = new Set(prev); next.delete(id); return next; }); }
    };

    const markAllRead = async () => {
        if (processingIds.has('*all*')) return;
        setProcessingIds(prev => new Set(prev).add('*all*'));
        try { await api.put('/notifications/read-all'); setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString(), is_read: true }))); } catch (error) { console.error('Failed to mark all as read:', error); alert(error?.response?.data?.message || 'Failed to mark all as read.'); } finally { setProcessingIds(prev => { const next = new Set(prev); next.delete('*all*'); return next; }); }
    };

    const handleDelete = async (id) => {
        if (processingIds.has(id)) return;
        setProcessingIds(prev => new Set(prev).add(id));
        try { await api.delete(`/notifications/${id}`); setNotifications(prev => prev.filter(n => n.id !== id)); } catch (error) { console.error('Failed to delete notification:', error); alert(error?.response?.data?.message || 'Failed to delete notification.'); } finally { setProcessingIds(prev => { const next = new Set(prev); next.delete(id); return next; }); }
    };

    const getTimeAgo = (date) => {
        const diff = Math.floor((new Date() - new Date(date)) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.read_at && !n.is_read).length;

    return (
        <div className="space-y-0">
            <div className="flex items-center justify-end mb-6">
                <button disabled={unreadCount === 0 || processingIds.has('*all*')} onClick={markAllRead} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30 disabled:opacity-50">
                    <CheckCheck size={14} /> Mark All Read
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4">
                    <Filter size={14} className="text-[#00D4AA] mr-2" /> Search Resources
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-3">
                        {[{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread', count: unreadCount }].map((tab) => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.key ? 'bg-[#00D4AA] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {tab.label}
                                {tab.count > 0 && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{tab.count}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : notifications.length === 0 ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center"><Bell size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No data available</p></div>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {notifications.map((notif) => {
                            const isRead = notif.type === 'read' || !!notif.read_at || !!notif.is_read;
                            const icon = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.system;
                            const bg = BG_BY_TYPE[notif.type] || DEFAULT_BG;
                            return (
                                <div key={notif.id} onClick={() => !isRead && markAsRead(notif.id)} className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition cursor-pointer ${!isRead ? 'border-l-4 border-l-[#00D4AA]' : ''}`}>
                                    <div className="flex items-start p-4">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
                                        <div className="flex-1 ml-3 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-semibold text-gray-800 truncate">{notif.title}</span>
                                                {!isRead && <span className="w-2 h-2 rounded-full bg-[#00D4AA] flex-shrink-0" />}
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                                            <span className="text-xs text-gray-400 mt-1 block">{getTimeAgo(notif.created_at)}</span>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }} className="flex-shrink-0 ml-2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6">
                        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                    </div>
                </>
            )}
        </div>
    );
}
