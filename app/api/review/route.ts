import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "../../../models/Review";

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const { user, room, rating, comment } = body;

  const review = await Review.create({
    user,
    room,
    rating,
    comment,
  });

  return NextResponse.json({ success: true, review });
}