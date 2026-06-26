"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  photo?: string;
}

interface StaffMember {
  _id: string;
  user: StaffUser;
  employeeNumber: string;
  position: string;
  department: string;
  hireDate?: string;
  salary?: number | string;
  isActive: boolean;
  order?: number;
}

interface UserOption {
  _id: string;
  name: string;
  email: string;
}

type ModalMode = "add" | "edit" | null;

interface StaffForm {
  userId: string;
  employeeNumber: string;
  position: string;
  department: string;
  hireDate: string;
  // FIX: salary kept as string for input binding; converted to number on submit
  salary: string;
  order: string; // FIX: use string so <input type="number"> binds cleanly, convert on submit
  isActive: boolean;
}

const EMPTY_FORM: StaffForm = {
  userId: "",
  employeeNumber: "",
  position: "receptionist",
  department: "",
  hireDate: "",
  salary: "",
  order: "0",
  isActive: true,
};

const POSITIONS = [
  { value: "property_manager", label: "Property Manager" },
  { value: "receptionist",     label: "Receptionist"     },
  { value: "caretaker",        label: "Caretaker"        },
  { value: "accountant",       label: "Accountant"       },
  { value: "security",         label: "Security"         },
  { value: "maintenance",      label: "Maintenance"      },
];

const POSITION_COLORS: Record<string, string> = {
  property_manager: "bg-emerald-50 text-emerald-700",
  receptionist:     "bg-violet-50 text-violet-700",
  caretaker:        "bg-amber-50 text-amber-700",
  accountant:       "bg-rose-50 text-rose-700",
  security:         "bg-sky-50 text-sky-700",
  maintenance:      "bg-orange-50 text-orange-700",
};

const posLabel = (v: string) => POSITIONS.find(p => p.value === v)?.label ?? v;

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  Plus:        () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>,
  Edit:        () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:       () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Ban:         () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  Check:       () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M20 6L9 17l-5-5"/></svg>,
  Close:       () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Search:      () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Staff:       () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a6 6 0 016-6h4a6 6 0 016 6v1"/><path d="M9 12l2 2 4-4"/></svg>,
  Key:         () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  ChevronDown: () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>,
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, photo, size = 36 }: { name: string; photo?: string; size?: number }) {
  // FIX: guard against empty/undefined name before splitting
  const safeName = name?.trim() || "?";
  const initials = safeName === "?"
    ? "?"
    : safeName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const colors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-sky-500"];
  const color  = colors[(safeName.charCodeAt(0) ?? 0) % colors.length];
  const hasPhoto = photo && photo.trim() !== "" && photo !== "/avatar.png";

  if (hasPhoto) {
    return (
      <Image
        src={photo!}
        alt={safeName}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ─── Staff Modal (Add / Edit) ─────────────────────────────────────────────────

function StaffModal({
  mode,
  member,
  users,
  onClose,
  onSave,
}: {
  mode: ModalMode;
  member: StaffMember | null;
  users: UserOption[];
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = mode === "edit";

  // FIX: included isActive in edit-mode spread; order coerced to string
  const [form, setForm] = useState<StaffForm>(
    isEdit && member
      ? {
          userId:         member.user?._id         ?? "",
          employeeNumber: member.employeeNumber     ?? "",
          position:       member.position           ?? "receptionist",
          department:     member.department         ?? "",
          hireDate:       member.hireDate           ?? "",
          salary:         member.salary != null ? String(member.salary) : "",
          order:          member.order   != null ? String(member.order) : "0",
          isActive:       member.isActive,
        }
      : EMPTY_FORM
  );

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const firstRef = useRef<HTMLSelectElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  // FIX: separate handler for text/select vs checkbox vs number inputs
  function setField<K extends keyof StaffForm>(field: K, value: StaffForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const handleChange =
    (field: keyof Pick<StaffForm, "userId" | "employeeNumber" | "position" | "department" | "hireDate" | "salary" | "order">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setField(field, e.target.value as StaffForm[typeof field]);

  async function handleSubmit() {
    if (!form.userId || !form.employeeNumber || !form.position) {
      setError("User, employee number and position are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url    = isEdit ? `/api/staff/${member!._id}` : "/api/staff";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary: form.salary ? Number(form.salary) : undefined,
          order:  Number(form.order),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message ?? "Something went wrong");
      }
      onSave();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-semibold text-slate-500 mb-1.5">{children}</label>
  );
  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="font-bold text-slate-900">{isEdit ? "Edit Staff Member" : "Add Staff Member"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <Icons.Close />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>
          )}

          {/* User select */}
          <div>
            <Label>Assign to User</Label>
            <div className="relative">
              <select
                ref={firstRef}
                value={form.userId}
                onChange={handleChange("userId")}
                disabled={isEdit}
                className={`${inputCls} appearance-none pr-8 disabled:bg-slate-50 disabled:text-slate-400`}
              >
                <option value="">Select a user…</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Icons.ChevronDown />
              </span>
            </div>
            {isEdit && (
              <p className="text-xs text-slate-400 mt-1">User cannot be changed when editing.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Employee number */}
            <div>
              <Label>Employee Number</Label>
              <input
                value={form.employeeNumber}
                onChange={handleChange("employeeNumber")}
                placeholder="EMP-001"
                className={inputCls}
              />
            </div>

            {/* Position */}
            <div>
              <Label>Position / Role</Label>
              <div className="relative">
                <select
                  value={form.position}
                  onChange={handleChange("position")}
                  className={`${inputCls} appearance-none pr-8`}
                >
                  {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Icons.ChevronDown />
                </span>
              </div>
            </div>

            {/* Department */}
            <div>
              <Label>Department</Label>
              <input
                value={form.department}
                onChange={handleChange("department")}
                placeholder="e.g. Operations"
                className={inputCls}
              />
            </div>

            {/* Hire date */}
            <div>
              <Label>Hire Date</Label>
              <input
                type="date"
                value={form.hireDate}
                onChange={handleChange("hireDate")}
                className={inputCls}
              />
            </div>

            {/* Salary */}
            <div>
              <Label>Monthly Salary (Ksh)</Label>
              <input
                type="number"
                value={form.salary}
                onChange={handleChange("salary")}
                placeholder="e.g. 45000"
                className={inputCls}
              />
            </div>

            {/* Display order */}
            <div>
              <Label>Display Order</Label>
              <input
                type="number"
                value={form.order}
                onChange={handleChange("order")}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Staff Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetPasswordModal({
  member,
  onClose,
  onSave,
}: {
  member: StaffMember;
  onClose: () => void;
  onSave: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function handleReset() {
    if (!password)            { setError("Enter a new password.");              return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)  { setError("Passwords do not match.");            return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/${member._id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { message?: string }).message ?? "Reset failed");
      }
      onSave();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Reset Password</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icons.Close />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Avatar name={member.user.name} photo={member.user.photo} size={36} />
            <div>
              <p className="text-sm font-semibold text-slate-800">{member.user.name}</p>
              <p className="text-xs text-slate-400">{member.user.email}</p>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex gap-2.5 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Resetting…" : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  member,
  onClose,
  onConfirm,
}: {
  member: StaffMember;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onConfirm();
    // onConfirm is responsible for closing; don't reset here
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <Icons.Trash />
        </div>
        <h3 className="font-bold text-slate-900 mb-1">Remove staff member?</h3>
        <p className="text-slate-500 text-sm mb-6">
          <span className="font-semibold text-slate-700">{member.user.name}</span> will be removed from staff. Their user account will not be deleted.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            disabled={deleting}
            onClick={handleDelete}
            className="flex-1 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-60"
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [staff,        setStaff]        = useState<StaffMember[]>([]);
  const [users,        setUsers]        = useState<UserOption[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [posFilter,    setPosFilter]    = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalMode,       setModalMode]       = useState<ModalMode>(null);
  const [selectedMember,  setSelectedMember]  = useState<StaffMember | null>(null);
  const [deleteTarget,    setDeleteTarget]    = useState<StaffMember | null>(null);
  const [resetTarget,     setResetTarget]     = useState<StaffMember | null>(null);
  const [toast,           setToast]           = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // FIX: wrap loadAll in useCallback so it's stable across renders
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([fetch("/api/staff"), fetch("/api/users")]);
      if (!sRes.ok || !uRes.ok) throw new Error("Failed to fetch data");
      const sData = await sRes.json();
      const uData = await uRes.json();
      setStaff(sData.data ?? []);
      setUsers(uData.data ?? []);
    } catch (e) {
      console.error("Failed to load staff data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // FIX: include loadAll in dependency array (stable via useCallback)
  useEffect(() => { loadAll(); }, [loadAll]);

  async function toggleActive(member: StaffMember) {
    try {
      const res = await fetch(`/api/staff/${member._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      showToast(`${member.user.name} ${!member.isActive ? "activated" : "deactivated"}.`);
      loadAll();
    } catch (e) {
      console.error("toggleActive error:", e);
      showToast("Failed to update status.");
    }
  }

  async function deleteMember(id: string) {
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeleteTarget(null);
      showToast("Staff member removed.");
      loadAll();
    } catch (e) {
      console.error("deleteMember error:", e);
      setDeleteTarget(null);
      showToast("Failed to remove staff member.");
    }
  }

  // ── Filtered ──────────────────────────────────────────────────────────────

  const filtered = staff.filter(s => {
    // FIX: guard against undefined user before accessing properties
    if (!s.user) return false;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.user.name?.toLowerCase().includes(q) ||
      s.user.email?.toLowerCase().includes(q) ||
      s.employeeNumber?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q);
    const matchPos    = posFilter    === "all" || s.position === posFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? s.isActive : !s.isActive);
    return matchSearch && matchPos && matchStatus;
  });

  const stats = {
    total:    staff.length,
    active:   staff.filter(s => s.isActive).length,
    inactive: staff.filter(s => !s.isActive).length,
  };

  const inputCls = "appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your team members and their roles</p>
        </div>
        <button
          onClick={() => { setSelectedMember(null); setModalMode("add"); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-blue-600/20"
        >
          <Icons.Plus /> Add Staff Member
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Staff", value: stats.total,    color: "text-slate-900"   },
          { label: "Active",      value: stats.active,   color: "text-emerald-600" },
          { label: "Inactive",    value: stats.inactive, color: "text-red-500"     },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icons.Search />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, ID, department…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select value={posFilter} onChange={e => setPosFilter(e.target.value)} className={inputCls}>
              <option value="all">All positions</option>
              {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Icons.ChevronDown />
            </span>
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Icons.ChevronDown />
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-48" />
                </div>
                <div className="h-5 bg-slate-100 rounded w-20" />
                <div className="h-5 bg-slate-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Icons.Staff />
            </div>
            <p className="text-slate-500 font-medium">No staff found</p>
            <p className="text-slate-400 text-sm mt-1">
              {staff.length === 0
                ? "Add your first team member to get started."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            {/* FIX: col-span-2 moved to a wrapping div so it spans properly in the grid */}
            <div className="hidden md:grid md:grid-cols-[2fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Staff Member</span>
              <span>Position</span>
              <span>Department</span>
              <span>Hire Date</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-slate-50">
              {filtered.map(member => (
                // FIX: grid columns match header (6 cols, first is wider for avatar+info)
                <div
                  key={member._id}
                  className="flex flex-col md:grid md:grid-cols-[2fr_auto_auto_auto_auto_auto] gap-4 items-start md:items-center px-6 py-4 hover:bg-slate-50 transition"
                >
                  {/* Name + email + emp number (avatar inside) */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={member.user?.name ?? "?"} photo={member.user?.photo} size={40} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{member.user?.name}</p>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                          {member.employeeNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{member.user?.email}</p>
                    </div>
                  </div>

                  {/* Position */}
                  <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full whitespace-nowrap ${POSITION_COLORS[member.position] ?? "bg-slate-100 text-slate-600"}`}>
                    {posLabel(member.position)}
                  </span>

                  {/* Department */}
                  <p className="text-sm text-slate-500 whitespace-nowrap">{member.department || "—"}</p>

                  {/* Hire date */}
                  <p className="text-xs text-slate-400 whitespace-nowrap">
                    {member.hireDate
                      ? new Date(member.hireDate).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>

                  {/* Status */}
                  <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full whitespace-nowrap ${
                    member.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}>
                    {member.isActive ? "Active" : "Inactive"}
                  </span>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    {/* Edit */}
                    <button
                      onClick={() => { setSelectedMember(member); setModalMode("edit"); }}
                      title="Edit"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Icons.Edit />
                    </button>

                    {/* Toggle active */}
                    <button
                      onClick={() => toggleActive(member)}
                      title={member.isActive ? "Deactivate" : "Activate"}
                      className={`p-2 rounded-lg transition ${
                        member.isActive
                          ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {member.isActive ? <Icons.Ban /> : <Icons.Check />}
                    </button>

                    {/* Reset password */}
                    <button
                      onClick={() => setResetTarget(member)}
                      title="Reset password"
                      className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                    >
                      <Icons.Key />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(member)}
                      title="Remove"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer count */}
            <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
              Showing {filtered.length} of {staff.length} staff members
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modalMode && (
        <StaffModal
          mode={modalMode}
          member={selectedMember}
          users={users}
          onClose={() => setModalMode(null)}
          onSave={() => {
            setModalMode(null);
            loadAll();
            showToast(modalMode === "add" ? "Staff member added." : "Staff member updated.");
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          member={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMember(deleteTarget._id)}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          member={resetTarget}
          onClose={() => setResetTarget(null)}
          onSave={() => { setResetTarget(null); showToast("Password reset successfully."); }}
        />
      )}
    </div>
  );
}