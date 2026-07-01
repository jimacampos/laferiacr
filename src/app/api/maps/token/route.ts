import { NextResponse } from "next/server";

// Issues a short-lived Azure Maps access token so the browser SDK can authenticate
// with Microsoft Entra ID instead of a shared subscription key (never sent to the
// client). The token is minted with the app's managed identity in Azure, or the
// developer's `az login` credentials locally. Returns 503 when Maps isn't configured
// so the map component can degrade gracefully.
//
// Requires: AZURE_MAPS_CLIENT_ID (the Maps account's unique client id) and the app
// identity (or local principal) holding the "Azure Maps Data Reader" role.

export const dynamic = "force-dynamic";

const MAPS_SCOPE = "https://atlas.microsoft.com/.default";

type Credential = { getToken: (scope: string) => Promise<{ token: string } | null> };
let cachedCredential: Credential | undefined;

async function getCredential(): Promise<Credential> {
  if (!cachedCredential) {
    const { DefaultAzureCredential } = await import("@azure/identity");
    cachedCredential = new DefaultAzureCredential({
      managedIdentityClientId: process.env.AZURE_MANAGED_IDENTITY_CLIENT_ID,
    });
  }
  return cachedCredential;
}

export async function GET() {
  const clientId = process.env.AZURE_MAPS_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "maps_not_configured" }, { status: 503 });
  }

  try {
    const credential = await getCredential();
    const accessToken = await credential.getToken(MAPS_SCOPE);
    if (!accessToken) throw new Error("no token returned");
    return NextResponse.json(
      { clientId, token: accessToken.token },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "token_unavailable" }, { status: 503 });
  }
}
