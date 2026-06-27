// app/api/contact/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    console.log("📩 Contact API hit");

    await connectDB();

    const { name, email, phone, message } = await req.json();

    console.log("📥 Incoming Data:", { name, email, phone, message });

    // ✅ VALIDATION
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ 1. Save to DB
    const savedMessage = await ContactMessage.create({
      name,
      email,
      phone,
      message,
    });

    console.log("✅ Saved to DB:", savedMessage._id);

    // ✅ 2. Send ADMIN email
    const adminEmail = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "your@email.com", // ⚠️ MUST be your verified email
      subject: "New Contact Message",
      html: `
        <h2>New Message Received</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || "N/A"}</p>
        <p><b>Message:</b><br/>${message}</p>
      `,
    });

    console.log("📧 Admin email response:", adminEmail);

    // ✅ 3. Send USER email (wrapped in try-catch so it doesn’t break everything)
    try {
      const userEmail = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email, // ⚠️ may fail if email not verified in Resend
        subject: "We received your message",
        html: `
          <p>Hi ${name},</p>
          <p>Thanks for contacting us. We’ve received your message and will get back to you within 24 hours.</p>
          <br/>
          <p>— Room Finder Team</p>
        `,
      });

      console.log("📧 User email response:", userEmail);
    } catch (userErr) {
      console.error("⚠️ User email failed:", userErr);
    }

    return NextResponse.json({
      success: true,
      message: "Message saved and processed",
    });

  } catch (error) {
    console.error("❌ CONTACT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}