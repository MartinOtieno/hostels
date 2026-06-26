import { NextResponse } from "next/server";
import { connectDB }from "@/lib/db";
import Review from "@/models/Review";

export async function GET(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  await connectDB();

  const reviews = await Review.find({ room: params.roomId })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  return NextResponse.json(reviews);
}