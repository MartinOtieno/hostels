"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Jluv</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Jluv<span className="text-blue-600">Stays</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              Home
            </Link>
            <Link
              href="/rooms"
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              Rooms
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-blue-600 font-medium transition"
            >
              Contact
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Hi, {session.user?.name?.split(" ")[0]}
                </span>
                <Link
                  href="/trips"
                  className="text-sm text-gray-600 hover:text-blue-600 font-medium"
                >
                  My Bookings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  My Account
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
            <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
            <div className="w-5 h-0.5 bg-gray-600"></div>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
            <Link href="/" className="block text-gray-600 hover:text-blue-600 py-2 font-medium">Home</Link>
            <Link href="/rooms" className="block text-gray-600 hover:text-blue-600 py-2 font-medium">Rooms</Link>
            <Link href="/about" className="block text-gray-600 hover:text-blue-600 py-2 font-medium">About</Link>
            <Link href="/contact" className="block text-gray-600 hover:text-blue-600 py-2 font-medium">Contact</Link>
            {session ? (
              <>
                <Link href="/trips" className="block text-gray-600 hover:text-blue-600 py-2 font-medium">My Bookings</Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full text-left text-gray-600 hover:text-blue-600 py-2 font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-gray-600 hover:text-blue-600 py-2 font-medium">Sign In</Link>
                <Link href="/register" className="block py-2 px-4 bg-blue-600 text-white rounded-lg font-medium text-center">My Account</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}