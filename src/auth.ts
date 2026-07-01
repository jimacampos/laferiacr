import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Auth.js (NextAuth v5) wired to Microsoft Entra External ID (CIAM) over OIDC
// (see docs/decisions/0011-auth-library-authjs.md and 0005-identity-entra-external-id.md).
// The CIAM authority differs from workforce Entra, so `issuer` is supplied via env.
// A custom `profile` maps claims directly and skips the Graph profile-photo fetch,
// which does not apply to External ID (Google / email OTP) users.
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Container Apps terminates TLS at the ingress; trust the forwarded host so the
  // OIDC redirect/callback URL is computed correctly.
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      profile(profile) {
        return {
          // `oid` is the immutable object id Microsoft recommends as a stable key.
          id: profile.oid ?? profile.sub,
          name: profile.name ?? profile.preferred_username ?? null,
          email: profile.email ?? profile.preferred_username ?? null,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    // Runs with `account`/`user` only on the initial sign-in; upsert the internal
    // users row then (never on every request) and stash our id on the token.
    async jwt({ token, account, user }) {
      if (account && user?.id) {
        const email = user.email ?? null;
        const displayName = user.name ?? null;
        const { prisma } = await import("@/lib/prisma");
        const dbUser = await prisma.user.upsert({
          where: { externalId: user.id },
          update: { email, displayName },
          create: { externalId: user.id, email, displayName },
        });
        token.uid = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.uid === "string") {
        session.user.id = token.uid;
      }
      return session;
    },
  },
});
