// room-booking/app/(pages)/admin/rooms/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface RoomImage {
  url: string;
  label: string;
}

interface Room {
  _id: string;
  name: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  isAvailable: boolean;
  images: RoomImage[];
  amenities: string[];
  description: string;
}

const IMAGE_LABELS = [
  "Bedroom",
  "Bathroom",
  "Living Room",
  "Kitchen",
  "Dining Area",
  "Balcony",
  "Study Desk",
  "Wardrobe",
  "Entrance",
  "View",
  "Other",
];

const emptyForm = {
  name: "",
  description: "",
  pricePerNight: "",
  capacity: "",
  type: "single",
  amenities: "",
  isAvailable: true,
};

const emptyImageEntry = {
  url: "",
  label: "Bedroom",
  file: null as File | null,
  preview: "",
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([{ ...emptyImageEntry }]);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      if (data.success) setRooms(data.data);
    } catch {
      setError("Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(""), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  // ---------------- IMAGE UPLOAD ----------------
  const handleImageUpload = async (file: File, index: number) => {
    setUploadingIndex(index);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImages((prev) => {
        const updated = [...prev];
        updated[index].preview = e.target?.result as string;
        return updated;
      });
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      const uploadedUrl = data?.images?.[0]?.url;

      if (!data.success || !uploadedUrl) {
        return showMsg("Upload failed or missing URL", true);
      }

      setImages((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          url: uploadedUrl,
          file,
        };
        return updated;
      });
    } catch {
      showMsg("Upload error", true);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleLabelChange = (index: number, label: string) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index].label = label;
      return updated;
    });
  };

  const handleUrlChange = (index: number, url: string) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index].url = url;
      updated[index].preview = url;
      return updated;
    });
  };

  const addImageSlot = () => {
    setImages((prev) => [...prev, { ...emptyImageEntry }]);
  };

  const removeImageSlot = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------------- HANDLE EDIT (FIXED) ----------------
  const handleEdit = (room: Room) => {
    setEditingRoom(room);

    setForm({
      name: room.name,
      description: room.description || "",
      pricePerNight: String(room.pricePerNight),
      capacity: String(room.capacity),
      type: room.type,
      amenities: room.amenities?.join(", ") || "",
      isAvailable: room.isAvailable,
    });

    setImages(
      room.images?.length
        ? room.images.map((img) => ({
            url: img.url,
            label: img.label,
            file: null,
            preview: img.url,
          }))
        : [{ ...emptyImageEntry }]
    );

    setShowForm(true);
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    if (!form.name) return showMsg("Room name is required.", true);

    setSaving(true);

    const validImages = images
      .filter((img) => img.url && img.url.trim() !== "")
      .map((img) => ({
        url: img.url,
        label: img.label,
      }));

    const body = {
      ...form,
      pricePerNight: Number(form.pricePerNight),
      capacity: Number(form.capacity),
      amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
      images: validImages,
    };

    try {
      const res = await fetch(
        editingRoom ? `/api/rooms/${editingRoom._id}` : "/api/rooms",
        {
          method: editingRoom ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (data.success) {
        showMsg(editingRoom ? "Updated" : "Created");
        setShowForm(false);
        setEditingRoom(null);
        setForm(emptyForm);
        setImages([{ ...emptyImageEntry }]);
        loadRooms();
      } else {
        showMsg(data.message || "Failed", true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete room?")) return;

    setDeletingId(id);

    try {
      await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      loadRooms();
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRoom(null);
    setForm(emptyForm);
    setImages([{ ...emptyImageEntry }]);
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-500 text-sm mt-1">
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => showForm ? handleCancel() : setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
        >
          {showForm ? "✕ Cancel" : "+ Add Room"}
        </button>
      </div>

      {/* ── Alerts ── */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      {/* ── Form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          {/* Form header */}
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">
              {editingRoom ? "✏️ Edit Room" : "➕ Add New Room"}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {editingRoom ? "Update room details and images" : "Fill in the details to add a new room"}
            </p>
          </div>

          <div className="p-6 space-y-8">

            {/* ── Basic Details ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Room Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Cozy Single Room"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="suite">Suite</option>
                    <option value="family">Family</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Month (Ksh) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="pricePerNight"
                    type="number"
                    value={form.pricePerNight}
                    onChange={handleChange}
                    placeholder="12500"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="capacity"
                    type="number"
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="2"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the room..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amenities
                    <span className="text-gray-400 font-normal ml-1">(comma separated)</span>
                  </label>
                  <input
                    name="amenities"
                    value={form.amenities}
                    onChange={handleChange}
                    placeholder="Free WiFi, Air Conditioning, TV, Private Bathroom"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    id="isAvailable"
                    checked={form.isAvailable}
                    onChange={handleChange}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <div>
                    <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Available for booking
                    </label>
                    <p className="text-xs text-gray-400">
                      Uncheck to mark this room as occupied
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Images Section ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Room Photos
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Upload photos and assign a label to each one
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addImageSlot}
                  className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg transition font-medium"
                >
                  + Add Photo
                </button>
              </div>

              <div className="space-y-4">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-2xl p-4 bg-gray-50"
                  >
                    <div className="flex items-start gap-4">

                      {/* Preview */}
                      <div
                        className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer group hover:border-blue-400 transition"
                        onClick={() => fileRefs.current[index]?.click()}
                      >
                        {img.preview ? (
                          <>
                            <Image
                              src={img.preview}
                              alt={img.label}
                              fill
                              sizes="112px"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <span className="text-white text-xs font-medium">Change</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-white group-hover:bg-blue-50 transition">
                            {uploadingIndex === index ? (
                              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span className="text-2xl mb-1">📷</span>
                                <span className="text-xs text-gray-400 text-center px-1">
                                  Click to upload
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        {/* Hidden file input */}
                        <input
                          ref={(el) => { fileRefs.current[index] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, index);
                          }}
                        />
                      </div>

                      {/* Controls */}
                      <div className="flex-1 space-y-3">

                        {/* Label selector */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Photo Label
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {IMAGE_LABELS.map((label) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => handleLabelChange(index, label)}
                                className={
                                  "px-3 py-1 text-xs rounded-full border transition font-medium " +
                                  (img.label === label
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600")
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* URL input */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Or paste image URL
                          </label>
                          <input
                            type="text"
                            value={img.url || ""}
                            onChange={(e) => handleUrlChange(index, e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Current label indicator */}
                        {img.url && (
                          <p className="text-xs text-green-600 font-medium">
                            ✓ Photo labeled as: <span className="font-bold">{img.label}</span>
                          </p>
                        )}
                      </div>

                      {/* Remove button */}
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageSlot(index)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                          title="Remove this photo"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add more button at bottom */}
              <button
                type="button"
                onClick={addImageSlot}
                className="mt-3 w-full py-3 border-2 border-dashed border-gray-200 hover:border-blue-300 text-gray-400 hover:text-blue-500 text-sm rounded-2xl transition"
              >
                + Add Another Photo
              </button>
            </div>

            {/* ── Form Actions ── */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleSubmit}
                disabled={saving || uploadingIndex !== null}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingRoom ? "💾 Update Room" : "➕ Create Room"
                )}
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rooms Table ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-gray-500 mb-4">No rooms yet. Add your first room above.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            + Add Room
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Room</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Photos</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((room) => (
                <tr key={room._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        {room.images && room.images.length > 0 && room.images[0].url ? (
                          <Image
                            src={room.images[0].url}
                            alt={room.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xl">
                            🏠
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{room.name}</p>
                        {room.images && room.images.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {room.images[0].label}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full capitalize">
                      {room.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    Ksh {room.pricePerNight.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {room.capacity} {room.capacity === 1 ? "person" : "people"}
                  </td>
                  <td className="px-6 py-4">
                    {room.images && room.images.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {room.images.slice(0, 3).map((img, i) => (
                            <div
                              key={i}
                              className="relative w-7 h-7 rounded-lg overflow-hidden border-2 border-white"
                            >
                              <Image
                                src={img.url}
                                alt={img.label}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {room.images.length} photo{room.images.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No photos</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={
                      "px-2 py-1 text-xs font-semibold rounded-full " +
                      (room.isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700")
                    }>
                      {room.isAvailable ? "Available" : "Occupied"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(room)}
                        className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(room._id)}
                        disabled={deletingId === room._id}
                        className="px-3 py-1.5 text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition font-medium disabled:opacity-50"
                      >
                        {deletingId === room._id ? "..." : "🗑️ Delete"}
                      </button>
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