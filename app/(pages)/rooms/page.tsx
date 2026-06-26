// room-booking/app/(pages)/rooms/page.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

interface RoomImage {
  url: string;
  label: string;
}

interface Room {
  _id: string;
  name: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  type: string;
  amenities: string[];
  images: RoomImage[];
  isAvailable: boolean;
  createdAt: string;
}

const ROOM_TYPES = ["All", "single", "double", "suite", "family"];

const PLACEHOLDER_IMAGES: Record<string, string> = {
  single: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
  double: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
  suite: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
  family: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
  default: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
};

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/rooms");
        const data = await res.json();
        if (data.success) setRooms(data.data);
        else setError("Failed to load rooms.");
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadRooms();
  }, []);

  const fetchRooms = async (
    type = selectedType,
    min = minPrice,
    max = maxPrice,
    cap = capacity
  ) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (type !== "All") params.append("type", type);
    if (min) params.append("minPrice", min);
    if (max) params.append("maxPrice", max);
    if (cap) params.append("capacity", cap);
    try {
      const res = await fetch(`/api/rooms?${params.toString()}`);
      const data = await res.json();
      if (data.success) setRooms(data.data);
      else setError("Failed to load rooms.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedType("All");
    setMinPrice("");
    setMaxPrice("");
    setCapacity("");
    fetchRooms("All", "", "", "");
  };

  const getRoomImage = (room: Room): { url: string; label: string } => {
    if (room.images && room.images.length > 0 && room.images[0].url !== "") {
      return room.images[0];
    }
    return {
      url: PLACEHOLDER_IMAGES[room.type] ?? PLACEHOLDER_IMAGES["default"],
      label: "Bedroom",
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Page Header ── */}
      <section className="bg-blue-600 py-14 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Available Rooms</h1>
          <p className="text-blue-100 text-lg">
            {loading ? "Loading rooms..." : `${rooms.length} room${rooms.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ── Filters Bar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-4">Filter Rooms</p>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (Ksh)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (Ksh)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 30000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 2"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchRooms()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
              >
                Search
              </button>
              <button
                onClick={handleClear}
                className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                <div className="h-56 bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-10 bg-gray-200 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Error State ── */}
        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button onClick={() => fetchRooms()} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Try Again
            </button>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && rooms.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏠</p>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No rooms found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters to see more results.</p>
            <button onClick={handleClear} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Rooms Grid ── */}
        {!loading && !error && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const mainImage = getRoomImage(room);
              const isHovered = hoveredId === room._id;

              return (
                <div
                  key={room._id}
                  onClick={() => router.push(`/rooms/${room._id}`)}
                  onMouseEnter={() => setHoveredId(room._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    transform: isHovered ? "scale(1.03)" : "scale(1)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    boxShadow: isHovered
                      ? "0 20px 40px rgba(0,0,0,0.12)"
                      : "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={mainImage.url}
                      alt={`${room.name} - ${mainImage.label}`}
                      fill
                      priority={rooms.indexOf(room) === 0}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{
                        transform: isHovered ? "scale(1.08)" : "scale(1)",
                        transition: "transform 0.4s ease",
                        objectFit: "cover",
                      }}
                    />

                    {/* Dark overlay on hover */}
                    <div
                      style={{
                        opacity: isHovered ? 1 : 0,
                        transition: "opacity 0.3s ease",
                      }}
                      className="absolute inset-0 bg-black/10"
                    />

                    {/* Availability badge */}
                    <span className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full ${room.isAvailable ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                      {room.isAvailable ? "Available" : "Occupied"}
                    </span>

                    {/* Type badge */}
                    <span className="absolute top-3 left-3 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full capitalize">
                      {room.type}
                    </span>

                    {/* Image label from DB */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                      📷 {mainImage.label}
                    </div>

                    {/* Photo count */}
                    {room.images && room.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                        +{room.images.length - 1} more
                      </div>
                    )}

                    {/* View Details on hover */}
                    <div
                      style={{
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? "translateY(0)" : "translateY(8px)",
                        transition: "opacity 0.3s ease, transform 0.3s ease",
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="px-4 py-2 bg-white text-blue-600 text-sm font-semibold rounded-full shadow-lg">
                        👁 View Details
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3
                      style={{
                        color: isHovered ? "#2563eb" : "#111827",
                        transition: "color 0.3s ease",
                      }}
                      className="text-lg font-bold mb-1"
                    >
                      {room.name}
                    </h3>

                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {room.description || "No description available."}
                    </p>

                    {/* Price and Capacity */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-blue-600 font-bold text-lg">
                        Ksh {room.pricePerNight.toLocaleString()}
                        <span className="text-gray-400 text-sm font-normal">/month</span>
                      </p>
                      <span className="text-sm text-gray-500">
                        👤 {room.capacity} {room.capacity === 1 ? "person" : "people"}
                      </span>
                    </div>

                    {/* Amenities */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {room.amenities.slice(0, 3).map((amenity) => (
                          <span key={amenity} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">
                            ✓ {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Image labels preview */}
                    {room.images && room.images.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {room.images.slice(0, 4).map((img, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                            {img.label}
                          </span>
                        ))}
                        {room.images.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">
                            +{room.images.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="mt-auto">
                      <div
                        style={{
                          backgroundColor: isHovered ? "#1d4ed8" : "#2563eb",
                          transition: "background-color 0.3s ease",
                        }}
                        className="block text-center py-2.5 px-4 text-white font-medium rounded-xl text-sm"
                      >
                        View Details →
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}