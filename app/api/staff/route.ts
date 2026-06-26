// room-booking/app/api/staff/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import StaffProfile from "../../../models/StaffProfile";
import User from "../../../models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly");
    const filter = activeOnly === "true" ? { isActive: true } : {};

    const staff = await StaffProfile.find(filter)
      .populate({ path: "user", select: "name email phone photo gender role" })
      .sort({ order: 1 });

    return NextResponse.json(
      { success: true, count: staff.length, data: staff },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, employeeNumber, position, department, hireDate, salary, emergencyContact, order } = body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!userId || !employeeNumber || !position || !hireDate) {
      return NextResponse.json(
        { success: false, message: "userId, employeeNumber, position and hireDate are required" },
        { status: 400 }
      );
    }

    // ── Validate position is a known value ────────────────────────────────────
    const VALID_POSITIONS = [
      "property_manager", "receptionist", "caretaker",
      "accountant", "security", "maintenance",
    ];
    if (!VALID_POSITIONS.includes(position)) {
      return NextResponse.json(
        { success: false, message: `Invalid position "${position}". Must be one of: ${VALID_POSITIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // ── Check user exists ─────────────────────────────────────────────────────
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // ── Check no existing staff profile ───────────────────────────────────────
    const existing = await StaffProfile.findOne({ user: userId });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "This user already has a staff profile" },
        { status: 409 }
      );
    }

    // ── Check employee number is unique ───────────────────────────────────────
    const existingNumber = await StaffProfile.findOne({ employeeNumber });
    if (existingNumber) {
      return NextResponse.json(
        { success: false, message: "Employee number already in use" },
        { status: 409 }
      );
    }

    // ── Promote user role to their specific position ──────────────────────────
    // ✅ FIXED: was setting role to generic "staff" — now sets the actual position
    // so the admin layout's role-based nav works correctly (it checks for
    // "property_manager", "receptionist", etc. not "staff")
    await User.findByIdAndUpdate(userId, { role: position });

    // ── Create staff profile ──────────────────────────────────────────────────
    const profile = await StaffProfile.create({
      user:             userId,
      employeeNumber,
      position,
      department:       department       || "",
      hireDate:         new Date(hireDate),
      salary:           salary           || 0,
      emergencyContact: emergencyContact || {},
      order:            order            || 0,
      isActive:         true,
    });

    const populated = await profile.populate({
      path: "user",
      select: "name email phone photo gender role",
    });

    return NextResponse.json(
      {
        success: true,
        message: `${user.name} promoted to ${position} successfully`,
        data: populated,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("POST /api/staff error:", error);

    // ── Surface Mongoose validation errors clearly ─────────────────────────
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((e: any) => e.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: `Validation error: ${messages}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create staff profile" },
      { status: 500 }
    );
  }
}