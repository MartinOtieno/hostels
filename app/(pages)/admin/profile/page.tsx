"use client";

import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  Save:    () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Camera:  () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Eye:     () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff:  () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>,
  Lock:    () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  User:    () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0116 0v1"/></svg>,
  Spinner: () => <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>,
};

const ROLE_LABELS: Record<string, string> = {
  admin:            "Administrator",
  property_manager: "Property Manager",
  receptionist:     "Receptionist",
  caretaker:        "Caretaker",
  accountant:       "Accountant",
  security:         "Security",
  maintenance:      "Maintenance",
  tenant:           "Tenant",
  guest:            "Guest",
};

const ROLE_COLORS: Record<string, string> = {
  admin:            "bg-blue-100 text-blue-700",
  property_manager: "bg-emerald-100 text-emerald-700",
  receptionist:     "bg-violet-100 text-violet-700",
  caretaker:        "bg-amber-100 text-amber-700",
  accountant:       "bg-rose-100 text-rose-700",
  security:         "bg-orange-100 text-orange-700",
  maintenance:      "bg-slate-100 text-slate-600",
  tenant:           "bg-slate-100 text-slate-600",
  guest:            "bg-slate-100 text-slate-600",
};

// ─── Password strength ────────────────────────────────────────────────────────

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  const map = [
    { label: "",        color: "bg-slate-200"   },
    { label: "Weak",    color: "bg-red-400"     },
    { label: "Fair",    color: "bg-amber-400"   },
    { label: "Good",    color: "bg-blue-400"    },
    { label: "Strong",  color: "bg-emerald-500" },
  ];
  return { score, ...map[score] };
}

// ─── Password input ───────────────────────────────────────────────────────────

function PasswordInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <Icons.EyeOff /> : <Icons.Eye />}
      </button>
    </div>
  );
}

// ─── Cloudinary upload ────────────────────────────────────────────────────────

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "");
  formData.append("folder", "jluvstays/profiles");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Photo upload failed");
  return (await res.json()).secure_url as string;
}

// ─── Safe JSON fetch ──────────────────────────────────────────────────────────

async function safeFetch(url: string, options?: RequestInit) {
  const res  = await fetch(url, options);
  const text = await res.text();
  if (!text) throw new Error("Server returned an empty response.");
  return { res, data: JSON.parse(text) };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();

  const user = session?.user as {
    id?: string; name?: string; email?: string;
    role?: string; image?: string; phone?: string;
  } | undefined;

  // Profile form state — populated from API on mount
  const [name,           setName]           = useState("");
  const [phone,          setPhone]          = useState("");
  const [gender,         setGender]         = useState("prefer_not_to_say");
  const [email,          setEmail]          = useState("");
  const [photoPreview,   setPhotoPreview]   = useState("");
  const [photoFile,      setPhotoFile]      = useState<File | null>(null);
  const [profileSaving,  setProfileSaving]  = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving,  setPwSaving]  = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load profile from API and pre-populate form ───────────────────────────
  useEffect(() => {
    fetch("/api/profile")
      .then(async r => {
        const text = await r.text();
        if (!text) throw new Error("Empty response from server.");
        return JSON.parse(text);
      })
      .then(d => {
        if (d.success) {
          const p = d.data;
          setName(p.name   ?? "");
          setPhone(p.phone  ?? "");
          setGender(p.gender ?? "prefer_not_to_say");
          setEmail(p.email  ?? "");
          setPhotoPreview(p.photo ?? "");
        } else {
          toast.error(d.message ?? "Failed to load profile");
        }
      })
      .catch(e => toast.error(e.message ?? "Failed to load profile"))
      .finally(() => setLoadingProfile(false));
  }, []);

  // ── Photo: preview locally ────────────────────────────────────────────────
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5 MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  async function saveProfile() {
    if (!name.trim()) { toast.error("Name cannot be empty."); return; }
    setProfileSaving(true);
    let photoUrl = photoPreview;

    try {
      if (photoFile) {
        setPhotoUploading(true);
        try {
          photoUrl = await uploadToCloudinary(photoFile);
          setPhotoFile(null);
        } catch {
          toast.error("Photo upload failed. Saving without new photo.");
        } finally {
          setPhotoUploading(false);
        }
      }

      const { data } = await safeFetch("/api/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), phone: phone.trim(), gender, photo: photoUrl }),
      });

      if (!data.success) throw new Error(data.message ?? "Save failed");

      setPhotoPreview(photoUrl);
      await updateSession({ name: name.trim(), image: photoUrl });
      toast.success("Profile updated successfully.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  async function changePassword() {
    if (!currentPw)          { toast.error("Enter your current password.");               return; }
    if (newPw.length < 8)    { toast.error("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { toast.error("New passwords do not match.");                return; }

    setPwSaving(true);
    try {
      const { data } = await safeFetch("/api/profile/password", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });

      if (!data.success) throw new Error(data.message ?? "Failed to change password");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast.success("Password changed. A confirmation email has been sent to " + email);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  }

  const strength    = passwordStrength(newPw);
  const role        = user?.role ?? "guest";
  const initials    = name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const avatarBg    = ["bg-blue-500", "bg-violet-500", "bg-emerald-500"][(name.charCodeAt(0) ?? 0) % 3];
  const inputCls    = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const disabledCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed";

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Toaster position="top-center" toastOptions={{
        style:   { borderRadius: "10px", background: "#1e293b", color: "#f8fafc", fontSize: "14px" },
        success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
        error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
      }} />

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your personal information and account security.</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <Icons.User />
          <h2 className="font-semibold text-slate-900">Personal information</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            <div className={`w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center ${photoPreview ? "" : avatarBg}`}>
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Avatar"
                  width={80}
                  height={80}
                  sizes="80px"
                  className="object-cover w-full h-full"
                  unoptimized={photoPreview.startsWith("blob:")}
                />
              ) : (
                <span className="text-white text-2xl font-bold">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition"
              title="Change photo"
            >
              <Icons.Camera />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          <div>
            <p className="font-semibold text-slate-800">{name || "Your Name"}</p>
            <p className="text-slate-400 text-sm">{email}</p>
            <span className={`inline-block mt-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ${ROLE_COLORS[role] ?? ROLE_COLORS.guest}`}>
              {ROLE_LABELS[role] ?? role}
            </span>
            {photoFile && (
              <p className="text-xs text-blue-600 mt-1.5">
                New photo selected — will upload when you save.
              </p>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email address</label>
            <input value={email} disabled className={disabledCls} />
            <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed. Contact an administrator if needed.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Gender</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className={inputCls}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Role</label>
            <input value={ROLE_LABELS[role] ?? role} disabled className={disabledCls} />
            <p className="text-[11px] text-slate-400 mt-1">Role is assigned by the administrator.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={saveProfile}
              disabled={profileSaving || photoUploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {profileSaving || photoUploading ? <Icons.Spinner /> : <Icons.Save />}
              {photoUploading ? "Uploading photo…" : profileSaving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2 pb-6 border-b border-slate-100">
          <Icons.Lock />
          <div>
            <h2 className="font-semibold text-slate-900">Change password</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              A confirmation email will be sent to {email} after changing.
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Current password</label>
            <PasswordInput value={currentPw} onChange={setCurrentPw} placeholder="Enter current password" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">New password</label>
            <PasswordInput value={newPw} onChange={setNewPw} placeholder="Minimum 8 characters" />
            {newPw && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-slate-200"}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500">{strength.label && `Strength: ${strength.label}`}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Confirm new password</label>
            <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="Re-enter new password" />
            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600">Password requirements:</p>
            {[
              { rule: "At least 8 characters",         met: newPw.length >= 8          },
              { rule: "At least one uppercase letter",  met: /[A-Z]/.test(newPw)        },
              { rule: "At least one number",            met: /[0-9]/.test(newPw)        },
              { rule: "At least one special character", met: /[^A-Za-z0-9]/.test(newPw) },
            ].map(({ rule, met }) => (
              <p key={rule} className={met && newPw ? "text-emerald-600" : ""}>
                {met && newPw ? "✓" : "○"} {rule}
              </p>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={changePassword}
              disabled={pwSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pwSaving ? <Icons.Spinner /> : <Icons.Lock />}
              {pwSaving ? "Updating…" : "Change password"}
            </button>
          </div>
        </div>
      </div>

      {/* Session info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Session information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Signed in as</span>
            <span className="font-medium text-slate-800">{email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role</span>
            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${ROLE_COLORS[role] ?? ROLE_COLORS.guest}`}>
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">User ID</span>
            <span className="font-mono text-xs text-slate-400">{user?.id ?? "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}