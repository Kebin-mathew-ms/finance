import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, Info, AlertTriangle, Eye, ShieldAlert, Sparkles } from 'lucide-react';
import apiClient from '../../api/client';
import { formatDate } from '../../utils/formatters';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readFilter, setReadFilter] = useState(''); // '' (all), 'false' (unread), 'true' (read)

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = `/notifications?page=${page}&size=10`;
      if (readFilter) {
        url += `&is_read=${readFilter}`;
      }
      
      const res = await apiClient.get(url);
      setNotifications(res.data.items || []);
      setTotalCount(res.data.total_count || 0);
      setPages(res.data.pages || 1);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Error fetching notifications list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, readFilter]);

  const handleMarkRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await apiClient.put(`/notifications/${notif.notification_id}`);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      if (notifications.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const renderRow = (notif) => {
    // Choose icon and color depending on alert type
    const icons = {
      SUCCESS: <CheckCircle className="h-5 w-5 text-accent-emerald shrink-0" />,
      WARNING: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
      ERROR: <ShieldAlert className="h-5 w-5 text-accent-rose shrink-0" />,
      INFORMATION: <Info className="h-5 w-5 text-accent-cyan shrink-0" />
    };

    return (
      <tr key={notif.notification_id} className={`transition duration-150 ${notif.is_read ? 'opacity-60 hover:bg-white/1' : 'bg-white/2 hover:bg-white/4 font-semibold'}`}>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {icons[notif.notification_type] || <Sparkles className="h-5 w-5 text-accent-indigo" />}
        </td>
        <td className="px-6 py-4 text-sm text-zinc-100 max-w-sm">
          <div className="font-bold text-zinc-200">{notif.title}</div>
          <div className="text-xs text-zinc-400 mt-1 leading-relaxed">{notif.message}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500">
          {new Date(notif.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 flex items-center space-x-2">
          {!notif.is_read && (
            <button
              onClick={() => handleMarkRead(notif)}
              className="px-2.5 py-1 rounded text-xs font-semibold border border-zinc-800 text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white transition duration-150"
            >
              Mark Read
            </button>
          )}
          <button
            onClick={() => handleDelete(notif.notification_id)}
            className="p-1.5 rounded-lg border border-zinc-800 text-accent-rose bg-zinc-900/60 hover:bg-accent-rose/10 transition duration-150"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Title block */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
          System Alerts & Notifications
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Review budget warnings, goal milestones, and payment status updates</p>
      </div>

      {/* Top Banner metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Unread Alerts</span>
          <p className="text-3xl font-extrabold text-accent-rose mt-2">{unreadCount}</p>
        </Card>
        
        <Card className="sm:col-span-2 flex flex-col justify-center">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Filters</span>
          <div className="flex gap-2">
            <Button 
              variant={readFilter === '' ? 'primary' : 'outline'} 
              className="text-xs px-3 py-1.5"
              onClick={() => { setReadFilter(''); setPage(1); }}
            >
              All
            </Button>
            <Button 
              variant={readFilter === 'false' ? 'primary' : 'outline'} 
              className="text-xs px-3 py-1.5"
              onClick={() => { setReadFilter('false'); setPage(1); }}
            >
              Unread ({unreadCount})
            </Button>
            <Button 
              variant={readFilter === 'true' ? 'primary' : 'outline'} 
              className="text-xs px-3 py-1.5"
              onClick={() => { setReadFilter('true'); setPage(1); }}
            >
              Read
            </Button>
          </div>
        </Card>
      </div>

      {/* Notifications Ledger */}
      <Card title={`Alert Logs (${totalCount})`}>
        <Table
          headers={["Type", "Alert Details", "Date", "Actions"]}
          items={notifications}
          renderRow={renderRow}
          page={page}
          pages={pages}
          onPageChange={setPage}
          totalCount={totalCount}
          loading={loading}
          emptyMessage="No notifications logged."
        />
      </Card>
    </div>
  );
};

export default NotificationList;
