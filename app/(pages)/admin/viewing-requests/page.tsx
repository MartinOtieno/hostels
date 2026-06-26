"use client";

import { useEffect, useState } from "react";

interface ViewingRequest {
  _id: string;
  room: { name: string; type: string };
  user: { name: string; email: string; phone: string };
  preferredDate: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminViewingRequestsPage() {
  const [requests, setRequests] = useState<ViewingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  // ✅ FIX: define function BEFORE useEffect
  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/viewing-request"); // change if needed
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRequests();
  }, []);

  const updateStatus = async (
    id: string,
    status: ViewingRequest["status"]
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/viewing-request/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Request ${status} successfully!`);

        setRequests((prev) =>
          prev.map((r) =>
            r._id === id ? { ...r, status } : r
          )
        );

        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered =
    activeTab === "all"
      ? requests
      : requests.filter((r) => r.status === activeTab);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-2">Viewing Requests</h1>
      <p className="text-gray-500 mb-4">
        {requests.length} total requests
      </p>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 w-fit">
        {(["all", "pending", "approved", "rejected"] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                "px-4 py-2 rounded-lg text-sm font-medium transition capitalize " +
                (activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:text-gray-700")
              }
            >
              {tab}{" "}
              <span
                className={
                  "ml-1 px-1.5 py-0.5 rounded-full text-xs " +
                  (activeTab === tab
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-500")
                }
              >
                {counts[tab]}
              </span>
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">👁</p>
          <p className="text-gray-500">
            No {activeTab === "all" ? "" : activeTab} viewing requests.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">
                    {request.room?.name}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {request.room?.type} room
                  </p>
                </div>
                <span
                  className={
                    "px-3 py-1 text-xs font-semibold rounded-full capitalize " +
                    STATUS_STYLES[request.status]
                  }
                >
                  {request.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">
                    Guest
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {request.user?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">
                    Email
                  </p>
                  <p className="text-sm text-gray-700">
                    {request.user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">
                    Phone
                  </p>
                  <p className="text-sm text-gray-700">
                    {request.user?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">
                    Preferred Date
                  </p>
                  <p className="text-sm text-gray-700">
                    {formatDate(request.preferredDate)}
                  </p>
                </div>
              </div>

              {request.message && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-gray-400 uppercase mb-1">
                    Message
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.message}
                  </p>
                </div>
              )}

              {request.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      updateStatus(request._id, "approved")
                    }
                    disabled={updatingId === request._id}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl disabled:opacity-50"
                  >
                    {updatingId === request._id
                      ? "..."
                      : "Approve"}
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(request._id, "rejected")
                    }
                    disabled={updatingId === request._id}
                    className="px-4 py-2 border border-red-300 text-red-500 rounded-xl disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <a
                    href={
                      "https://wa.me/" +
                      request.user?.phone?.replace(/\D/g, "")
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-green-500 text-white rounded-xl"
                  >
                    WhatsApp Guest
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}