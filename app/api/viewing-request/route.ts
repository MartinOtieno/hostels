// app/api/viewing-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ViewingRequest from "../../../models/ViewingRequest";
import Room from "../../../models/Room";
import User from "@/models/User";
import { createNotification } from "@/lib/createNotification";

// ─── Helper: notify all admins ────────────────────────────────────────────────
async function notifyAdmins(payload: {
  type: "viewing_pending" | "viewing_approved" | "viewing_rejected" | "general";
  title: string;
  message: string;
  link: string;
  refId?: unknown;
  refModel?: "Booking" | "ViewingRequest" | null;
}) {
  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map(admin =>
        createNotification({
          userId:   admin._id,
          type:     payload.type,
          title:    payload.title,
          message:  payload.message,
          link:     payload.link,
          refId:    payload.refId as string | undefined,
          refModel: payload.refModel,
        })
      )
    );
  } catch (err) {
    console.error("notifyAdmins error:", err);
  }
}

// -----------------------------------------------
// POST /api/viewing-request — Submit a viewing request
// -----------------------------------------------
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, roomId, preferredDate, message } = body;

    // 1. Validate required fields
    if (!userId || !roomId || !preferredDate) {
      return NextResponse.json(
        { success: false, message: "userId, roomId and preferredDate are required" },
        { status: 400 }
      );
    }

    // 2. Validate preferred date is not in the past
    const preferred = new Date(preferredDate);
    if (preferred < new Date()) {
      return NextResponse.json(
        { success: false, message: "Preferred date cannot be in the past" },
        { status: 400 }
      );
    }

    // 3. Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // 4. Check if user already has a pending viewing request for this room
    const existingRequest = await ViewingRequest.findOne({
      user:   userId,
      room:   roomId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: "You already have a pending viewing request for this room" },
        { status: 409 }
      );
    }

    // 5. Create viewing request
    const viewingRequest = await ViewingRequest.create({
      user:          userId,
      room:          roomId,
      preferredDate: preferred,
      message:       message || "",
      status:        "pending",
    });

    // 6. Populate response
    const populated = await viewingRequest.populate([
      { path: "room", select: "name type pricePerNight" },
      { path: "user", select: "name email phone" },
    ]);

    // 7. Format date
    const preferredFmt = preferred.toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "short", year: "numeric",
    });
    const guestName = populated.user?.name ?? "A guest";

    // 8. 🔔 Notify the guest — request received
    await createNotification({
      userId,
      type:     "viewing_pending",
      title:    "Viewing Request Submitted 📅",
      message:  `Your viewing request for ${room.name} on ${preferredFmt} has been submitted and is awaiting review. We'll notify you once it's confirmed.`,
      link:     "/viewing-requests",
      refId:    viewingRequest._id,
      refModel: "ViewingRequest",
    });

    // 9. 🔔 Notify all admins — new viewing request
    await notifyAdmins({
      type:     "viewing_pending",
      title:    "New Viewing Request 👁️",
      message:  `${guestName} has requested to view ${room.name} on ${preferredFmt}. Review and approve or decline.`,
      link:     "/admin/viewing-requests",
      refId:    viewingRequest._id,
      refModel: "ViewingRequest",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Viewing request submitted successfully",
        data:    populated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/viewing-request error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit viewing request" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------
// GET /api/viewing-request — Fetch viewing requests
// -----------------------------------------------
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const roomId = searchParams.get("roomId");
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (userId) filter.user = userId;
    if (roomId) filter.room = roomId;
    if (status) filter.status = status;

    const requests = await ViewingRequest.find(filter)
      .populate({ path: "room", select: "name type pricePerNight images" })
      .populate({ path: "user", select: "name email phone" })
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, count: requests.length, data: requests },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/viewing-request error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch viewing requests" },
      { status: 500 }
    );
  }
}