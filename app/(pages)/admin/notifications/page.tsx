"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  relatedModel?: string;
  relatedId?: string;
}

type FilterType = "all" | "unread" | "booking" | "viewing" | "room" | "system";

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  Bell:     () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Check:    () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>,
  CheckAll: () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1.5 12.5L5.57 17 9 13.5M6 12l4-4M11.5 17l8.5-8.5"/></svg>,
  Trash:    () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Calendar: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  Home:     () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>,
  Eye:      () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  Info:     () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

// ─── Notification type metadata ───────────────────────────────────────────────

function getNotificationMeta(type: string): {
  icon: React.ReactNode;
  accent: string;
  bg: string;
  category: FilterType;
} {
  if (type?.includes("booking")) return { icon: <Icons.Calendar />, accent: "text-blue-600",   bg: "bg-blue-50",   category: "booking" };
  if (type?.includes("viewing")) return { icon: <Icons.Eye />,      accent: "text-violet-600", bg: "bg-violet-50", category: "viewing" };
  if (type?.includes("room"))    return { icon: <Icons.Home />,     accent: "text-emerald-600",bg: "bg-emerald-50",category: "room"    };
  return                                { icon: <Icons.Info />,     accent: "text-slate-500",  bg: "bg-slate-100", category: "system"  };
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: "all",     label: "All"       },
  { key: "unread",  label: "Unread"    },
  { key: "booking", label: "Bookings"  },
  { key: "viewing", label: "Viewings"  },
  { key: "room",    label: "Rooms"     },
  { key: "system",  label: "System"    },
];

// ─── Fallback demo data (used when API not yet built) ─────────────────────────

const DEMO_NOTIFICATIONS: Notification[] = [
  { _id: "1", type: "new_booking",      title: "New booking request",        body: "John Kamau requested to book Studio A from 1 Jul – 31 Jul.",            read: false, createdAt: new Date(Date.now() - 5*60000).toISOString() },
  { _id: "2", type: "booking_confirmed",title: "Booking confirmed",           body: "Grace Akinyi's booking for Room 4B has been confirmed.",                read: false, createdAt: new Date(Date.now() - 40*60000).toISOString() },
  { _id: "3", type: "new_viewing",      title: "New viewing request",         body: "Peter Omondi wants to view Apartment 2C on 5 Jul at 10:00 AM.",         read: false, createdAt: new Date(Date.now() - 2*3600000).toISOString() },
  { _id: "4", type: "booking_cancelled",title: "Booking cancelled",           body: "Faith Njeri cancelled her booking for Room 1A. Reason: Budget constraints.", read: true, createdAt: new Date(Date.now() - 5*3600000).toISOString() },
  { _id: "5", type: "room_maintenance", title: "Room marked for maintenance", body: "Room 3D has been flagged as Under Maintenance by the caretaker.",       read: true, createdAt: new Date(Date.now() - 24*3600000).toISOString() },
  { _id: "6", type: "viewing_approved", title: "Viewing approved",            body: "The viewing for Studio B on 3 Jul has been approved and assigned to Mary.", read: true, createdAt: new Date(Date.now() - 2*86400000).toISOString() },
  { _id: "7", type: "system",           title: "System backup completed",     body: "Nightly database backup completed successfully at 02:00 AM.",            read: true, createdAt: new Date(Date.now() - 3*86400000).toISOString() },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data ?? DEMO_NOTIFICATIONS);
      } else {
        // API not built yet — use demo data so the page is useful immediately
        setNotifications(DEMO_NOTIFICATIONS);
      }
    } catch {
      setNotifications(DEMO_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch { /* silent — optimistic update already applied */ }
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      showToast("All notifications marked as read.");
    } catch { /* silent */ }
  }

  async function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n._id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch { /* silent */ }
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = notifications.filter(n => {
    if (filter === "all")    return true;
    if (filter === "unread") return !n.read;
    return getNotificationMeta(n.type).category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            <Icons.CheckAll /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
        {FILTER_TABS.map(tab => {
          const count = tab.key === "all"
            ? notifications.length
            : tab.key === "unread"
            ? unreadCount
            : notifications.filter(n => getNotificationMeta(n.type).category === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                filter === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-48" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-24" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Icons.Bell />
            </div>
            <p className="text-slate-600 font-semibold">No notifications here</p>
            <p className="text-slate-400 text-sm mt-1">
              {filter === "unread" ? "Nothing unread — you're all caught up!" : "No notifications in this category yet."}
            </p>
          </div>
        ) : (
          filtered.map(n => {
            const meta = getNotificationMeta(n.type);
            return (
              <div
                key={n._id}
                className={`relative bg-white rounded-2xl border shadow-sm p-5 flex gap-4 transition group ${
                  n.read ? "border-slate-100" : "border-blue-200 bg-blue-50/30"
                }`}
              >
                {/* Unread dot */}
                {!n.read && (
                  <span className="absolute top-5 right-5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}

                {/* Icon */}
                <div className={`w-10 h-10 ${meta.bg} rounded-xl flex items-center justify-center ${meta.accent} flex-shrink-0 mt-0.5`}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${n.read ? "text-slate-700" : "text-slate-900"}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-2">{timeAgo(n.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n._id)}
                      title="Mark as read"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Icons.Check />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n._id)}
                    title="Delete"
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Note about API */}
      {!loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800">
          <span className="font-semibold">Note:</span> Showing demo data until <code className="bg-amber-100 px-1 rounded text-xs">/api/notifications</code> is built.
          Wire up <code className="bg-amber-100 px-1 rounded text-xs">POST /api/notifications</code> from your booking/viewing/room API handlers to populate real notifications.
        </div>
      )}
    </div>
  );
}