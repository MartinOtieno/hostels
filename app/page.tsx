// room-booking/app/(pages)/(home)/page.tsx

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

interface RoomImage {
  url: string;
  label: string;
}

interface Room {
  _id: string;
  name: string;
  pricePerNight: number;
  type: string;
  amenities: string[];
  images: RoomImage[];
  isAvailable: boolean;
}

interface Stats {
  availableRooms: number;
  totalBookings: number;
  totalUsers: number;
}

const PLACEHOLDER_IMAGES: Record<string, string> = {
  single: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
  double: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
  suite: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
  family: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
  default: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
};

function getRoomImage(room: Room): string {
  if (room.images && room.images.length > 0 && room.images[0]?.url) {
    return room.images[0].url;
  }
  return PLACEHOLDER_IMAGES[room.type] ?? PLACEHOLDER_IMAGES["default"];
}

async function getFeaturedRooms(): Promise<Room[]> {
  try {
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(base + "/api/rooms", { cache: "no-store" });
    const data = await res.json();
    if (data.success) {
      return data.data
        .filter((r: Room) => r.isAvailable)
        .slice(0, 3);
    }
    return [];
  } catch {
    return [];
  }
}

async function getStats(): Promise<Stats> {
  try {
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const [roomsRes, bookingsRes, usersRes] = await Promise.all([
      fetch(base + "/api/rooms", { cache: "no-store" }),
      fetch(base + "/api/bookings", { cache: "no-store" }),
      fetch(base + "/api/users", { cache: "no-store" }),
    ]);

    const rooms = await roomsRes.json();
    const bookings = await bookingsRes.json();
    const users = usersRes.ok ? await usersRes.json() : { count: 0 };

    const availableRooms = rooms.success
      ? rooms.data.filter((r: Room) => r.isAvailable).length
      : 0;

    return {
      availableRooms,
      totalBookings: bookings.success
        ? bookings.count ?? bookings.data?.length ?? 0
        : 0,
      totalUsers: users.success
        ? users.count ?? users.data?.length ?? 0
        : 0,
    };
  } catch {
    return { availableRooms: 0, totalBookings: 0, totalUsers: 0 };
  }
}

const steps = [
  {
    step: "01",
    title: "Browse Rooms",
    description:
      "Explore our available rooms with detailed photos, amenities, and pricing.",
  },
  {
    step: "02",
    title: "Request a Viewing",
    description:
      "Schedule a visit to see the room in person before making a decision.",
  },
  {
    step: "03",
    title: "Book & Move In",
    description:
      "Confirm your booking online and get ready to move into your new home.",
  },
];

export default async function HomePage() {
  const [featuredRooms, stats] = await Promise.all([
    getFeaturedRooms(),
    getStats(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative h-[90vh] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600"
          alt="Chicago Apartment Building"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-black/50" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm rounded-full mb-6">
            🏠 Rooms Available in Chicago
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Find Your Perfect
            <span className="text-blue-400"> Room in Chicago</span>
          </h1>
          <p className="text-gray-300 text-xl mb-8 max-w-2xl mx-auto">
            Quality rooms starting from{" "}
            <span className="text-white font-semibold">Ksh 12,500/month</span>.
            Secure, comfortable, and conveniently located.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rooms"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg transition duration-200 shadow-lg"
            >
              Browse Rooms
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-xl text-lg transition duration-200 backdrop-blur-sm"
            >
              Request a Viewing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar from DB ── */}
      <section className="bg-blue-600 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            {
              value: stats.availableRooms > 0
                ? stats.availableRooms + "+"
                : "20+",
              label: "Available Rooms",
            },
            {
              value: stats.totalUsers > 0
                ? stats.totalUsers + "+"
                : "100+",
              label: "Happy Tenants",
            },
            {
              value: "5★",
              label: "Average Rating",
            },
            {
              value: "24/7",
              label: "Support & Help",
            },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-blue-200 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Rooms from DB ── */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured Rooms
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Handpicked rooms offering the best value, comfort, and location in
            6142 S Rhodes Ave, Chicago,IL.
          </p>
        </div>

        {featuredRooms.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-5xl mb-4">🏠</p>
            <p className="text-gray-500">
              No rooms available right now. Check back soon!
            </p>
            <Link
              href="/rooms"
              className="inline-block mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              Browse All Rooms
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredRooms.map((room) => (
              <Link
                key={room._id}
                href={"/rooms/" + room._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden border border-gray-100 group"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={getRoomImage(room)}
                    alt={room.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full capitalize">
                    {room.type}
                  </span>
                  <span className={
                    "absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full " +
                    (room.isAvailable
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white")
                  }>
                    {room.isAvailable ? "Available" : "Occupied"}
                  </span>
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                    {room.name}
                  </h3>
                  <p className="text-blue-600 font-semibold text-lg mb-4">
                    Ksh {room.pricePerNight.toLocaleString()}
                    <span className="text-gray-400 text-sm font-normal">
                      /month
                    </span>
                  </p>

                  {room.amenities && room.amenities.length > 0 && (
                    <ul className="space-y-1 mb-6">
                      {room.amenities.slice(0, 3).map((amenity) => (
                        <li
                          key={amenity}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <span className="text-blue-500">✓</span>
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="block text-center py-2.5 px-4 bg-blue-600 group-hover:bg-blue-700 text-white font-medium rounded-xl transition duration-200">
                    View Details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/rooms"
            className="inline-block px-8 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold rounded-xl transition duration-200"
          >
            View All Rooms
          </Link>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 text-lg">
              Getting your perfect room is just three simple steps away.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, index) => (
              <div key={item.step} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-blue-200 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Find Your Room?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join hundreds of tenants who have found their perfect room in
            6142 S Rhodes Ave, Chicago,IL. Start browsing today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rooms"
              className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-xl text-lg transition duration-200"
            >
              Browse Rooms
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-blue-700 hover:bg-blue-800 border border-blue-500 text-white font-semibold rounded-xl text-lg transition duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}