// app/api/viewing-request/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ViewingRequest from "@/models/ViewingRequest";
import User from "@/models/User";
import mongoose from "mongoose";
import { createNotification } from "@/lib/createNotification";

// ─── Helper: notify all admins ────────────────────────────────────────────────
async function notifyAdmins(payload: {
  type: "viewing_approved" | "viewing_rejected" | "viewing_pending" | "general";
  title: string;
  message: string;
  link: string;
  refId?: mongoose.Types.ObjectId;
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
          refId:    payload.refId,
          refModel: "ViewingRequest",
        })
      )
    );
  } catch (err) {
    console.error("notifyAdmins error:", err);
  }
}

// ─── PATCH /api/viewing-request/[id] ─────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid viewing request ID" },
        { status: 400 }
      );
    }

    const { status } = await req.json();

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const updated = await ViewingRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("room", "name type pricePerNight")
      .populate("user", "name email");

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Viewing request not found" },
        { status: 404 }
      );
    }

    const roomName      = updated.room?.name ?? "the room";
    const guestName     = updated.user?.name ?? "A guest";
    const preferredDate = new Date(updated.preferredDate).toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "short", year: "numeric",
    });

    if (status === "approved") {
      // Notify guest
      await createNotification({
        userId:   updated.user._id,
        type:     "viewing_approved",
        title:    "Viewing Request Approved ✅",
        message:  `Your viewing request for ${roomName} on ${preferredDate} has been approved. Our team will contact you to confirm the time.`,
        link:     "/viewing-requests",
        refId:    updated._id,
        refModel: "ViewingRequest",
      });

      // Notify admins
      await notifyAdmins({
        type:    "viewing_approved",
        title:   "Viewing Approved ✅",
        message: `${guestName}'s viewing request for ${roomName} on ${preferredDate} has been approved.`,
        link:    "/admin/viewing-requests",
        refId:   updated._id,
      });

    } else if (status === "rejected") {
      // Notify guest
      await createNotification({
        userId:   updated.user._id,
        type:     "viewing_rejected",
        title:    "Viewing Request Declined ❌",
        message:  `Unfortunately your viewing request for ${roomName} on ${preferredDate} could not be accommodated. Browse other available rooms or request a different date.`,
        link:     "/rooms",
        refId:    updated._id,
        refModel: "ViewingRequest",
      });

      // Notify admins
      await notifyAdmins({
        type:    "viewing_rejected",
        title:   "Viewing Declined ❌",
        message: `${guestName}'s viewing request for ${roomName} on ${preferredDate} has been declined.`,
        link:    "/admin/viewing-requests",
        refId:   updated._id,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Viewing request ${status}`,
      data:    updated,
    });
  } catch (error) {
    console.error("PATCH /api/viewing-request/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update viewing request" },
      { status: 500 }
    );
  }
}

// ─── GET /api/viewing-request/[id] ───────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }

    const request = await ViewingRequest.findById(id)
      .populate("room", "name type pricePerNight images")
      .populate("user", "name email phone");

    if (!request) {
      return NextResponse.json(
        { success: false, message: "Viewing request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error("GET /api/viewing-request/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch viewing request" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/viewing-request/[id] ────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 }
      );
    }

    await ViewingRequest.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Viewing request deleted" });
  } catch (error) {
    console.error("DELETE /api/viewing-request/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete viewing request" },
      { status: 500 }
    );
  }
}