// room-booking/src/app/api/rooms/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Room from "../../../models/Room";

// GET /api/rooms - Fetch all rooms (with optional filters)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const capacity = searchParams.get("capacity");

    const filter: Record<string, unknown> = {};

    if (type) filter.type = type;
    if (capacity) filter.capacity = { $gte: Number(capacity) };
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) (filter.pricePerNight as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (filter.pricePerNight as Record<string, number>).$lte = Number(maxPrice);
    }

    const rooms = await Room.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, count: rooms.length, data: rooms },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create a new room (admin use)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      name,
      description,
      pricePerNight,
      capacity,
      type,
      amenities,
      images,
      isAvailable,
    } = body;

    if (!name || !pricePerNight || !capacity || !type) {
      return NextResponse.json(
        {
          success: false,
          message: "name, pricePerNight, capacity, and type are required",
        },
        { status: 400 }
      );
    }

    const room = await Room.create({
      name,
      description,
      pricePerNight,
      capacity,
      type,
      amenities: amenities ?? [],
      images: images ?? [],
      isAvailable: isAvailable ?? true,
    });

    return NextResponse.json(
      { success: true, data: room },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create room" },
      { status: 500 }
    );
  }
}