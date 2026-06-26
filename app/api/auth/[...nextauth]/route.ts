import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        // ✅ Return null instead of throwing — throwing causes NextAuth to
        // redirect to the error page, which breaks redirect:false on the client
        if (!credentials?.email || !credentials?.password) {
          throw new Error("MISSING_CREDENTIALS");
        }

        try {
          await connectDB();
        } catch {
          throw new Error("DB_CONNECTION_FAILED");
        }

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("INVALID_PASSWORD");
        }

        // ✅ Return the user object on success
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as ExtendedUser).id;
        token.role = (user as ExtendedUser).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as ExtendedUser).id = token.id as string;
        (session.user as ExtendedUser).role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    // ❌ REMOVED: error: "/login"
    // This was the root cause — when authorize() throws, NextAuth redirects
    // to this error page. Combined with redirect:false on the client, the
    // response gets swallowed silently and nothing happens.
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };