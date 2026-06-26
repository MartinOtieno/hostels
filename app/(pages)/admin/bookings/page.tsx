// room-booking/app/(pages)/admin/bookings/page.tsx

"use client";

import { useEffect, useState } from "react";

interface Booking {
  _id: string;
  room: { name: string; type: string };
  user: { name: string; email: string };
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (data.success) setBookings(data.data);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
  setUpdatingId(id);

  try {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update booking");
    }

    setSuccess(`Booking ${status} successfully!`);

    setBookings((prev) =>
      prev.map((b) =>
        b._id === id ? { ...b, status: status as Booking["status"] } : b
      )
    );

    setTimeout(() => setSuccess(""), 3000);
  } catch (err: any) {
    console.error(err);
    alert(err.message); // 🔥 now you’ll SEE errors
  } finally {
    setUpdatingId(null);
  }
};

  const filtered = activeTab === "all" ? bookings : bookings.filter((b) => b.status === activeTab);
  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">{bookings.length} total bookings</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 w-fit">
        {(["all", "pending", "confirmed", "cancelled"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={"px-4 py-2 rounded-lg text-sm font-medium transition capitalize " + (
              activeTab === tab ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab} <span className={"ml-1 px-1.5 py-0.5 rounded-full text-xs " + (
              activeTab === tab ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
            )}>{counts[tab]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500">No {activeTab === "all" ? "" : activeTab} bookings found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Guest</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Room</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Dates</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{booking.user?.name}</p>
                    <p className="text-xs text-gray-400">{booking.user?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{booking.room?.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{booking.room?.type}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{formatDate(booking.checkIn)}</p>
                    <p className="text-xs text-gray-400">to {formatDate(booking.checkOut)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Ksh {booking.totalPrice?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={"px-2 py-1 text-xs font-semibold rounded-full capitalize " + STATUS_STYLES[booking.status]}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {booking.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(booking._id, "confirmed")}
                            disabled={updatingId === booking._id}
                            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(booking._id, "cancelled")}
                            disabled={updatingId === booking._id}
                            className="px-3 py-1.5 text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => updateStatus(booking._id, "cancelled")}
                          disabled={updatingId === booking._id}
                          className="px-3 py-1.5 text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      {booking.status === "cancelled" && (
                        <span className="text-xs text-gray-400">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}