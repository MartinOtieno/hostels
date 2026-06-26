// app/api/contact/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { name, email, phone, message } = await req.json();

    // ✅ VALIDATION (MUST BE BEFORE EVERYTHING)
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ 1. Save to DB
    await ContactMessage.create({
      name,
      email,
      phone,
      message,
    });

    // ✅ 2. Send email to ADMIN
    await resend.emails.send({
      from: "onboarding@resend.dev", // change in production
      to: "your@email.com", // 🔴 replace with your admin email
      subject: "New Contact Message",
      html: `
        <h2>New Message Received</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || "N/A"}</p>
        <p><b>Message:</b><br/>${message}</p>
      `,
    });

    // ✅ 3. Auto-reply to USER
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "We received your message",
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for contacting us. We’ve received your message and will get back to you within 24 hours.</p>
        <br/>
        <p>— Room Finder Team</p>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("CONTACT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}