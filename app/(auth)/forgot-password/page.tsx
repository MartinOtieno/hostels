// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    // ✅ DEBUG: log what email was received
    console.log("Forgot password request for:", email);
    console.log("RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.log("No user found for email:", email);
      return NextResponse.json({ success: true });
    }

    console.log("User found:", user.name, user.email);

    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken   = token;
    user.resetPasswordExpires = expires;
    await user.save();

    console.log("Token saved to user. Sending email...");

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    // ✅ Separate try/catch for email so we can see the exact Resend error
    try {
      const emailResult = await resend.emails.send({
        from:    "JluvStays <onboarding@resend.dev>",
        to:      user.email,
        subject: "Reset your password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h2 style="color:#1e293b;margin-bottom:8px;">Reset your password</h2>
            <p style="color:#64748b;margin-bottom:24px;">
              Hi ${user.name},<br/>
              We received a request to reset your password. Click the button below.
              This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}"
              style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
              Reset Password
            </a>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
              If you did not request this, you can safely ignore this email.<br/>
              Or copy this link: ${resetUrl}
            </p>
          </div>
        `,
      });

      // ✅ Log the full Resend response
      console.log("Resend response:", JSON.stringify(emailResult));

      // Resend returns { data, error }
      if (emailResult.error) {
        console.error("Resend error:", emailResult.error);
        return NextResponse.json(
          { success: false, message: `Email failed: ${emailResult.error.message}` },
          { status: 500 }
        );
      }

      console.log("Email sent successfully. ID:", emailResult.data?.id);
    } catch (emailError: any) {
      console.error("Resend threw exception:", emailError?.message ?? emailError);
      return NextResponse.json(
        { success: false, message: `Email error: ${emailError?.message ?? "Unknown"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to send reset email" },
      { status: 500 }
    );
  }
}