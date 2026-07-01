import type { DefaultSession } from "next-auth";

// Expose our internal users.id on the session and token (set in src/auth.ts callbacks).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
  }
}
