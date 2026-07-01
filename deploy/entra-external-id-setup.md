# Sign-in setup — Microsoft Entra External ID (CIAM)

Phase 2 adds **optional** sign-in to La Feria CR using **Microsoft Entra External ID**
(the customer-facing "CIAM" flavor of Entra) over OIDC, wired through **Auth.js (NextAuth v5)**
— see [`../docs/decisions/0011-auth-library-authjs.md`](../docs/decisions/0011-auth-library-authjs.md)
and [`../docs/decisions/0005-identity-entra-external-id.md`](../docs/decisions/0005-identity-entra-external-id.md).

The app runs fine **without** these values — the header "Sign in" button just won't work until
they're configured. **MVP 0 scope: configure `dev` only; prod is deferred.**

This is a **one-time, mostly portal** setup. A separate External ID tenant is required (you
cannot reuse a workforce tenant), and the user flow + external identity providers can only be
created in the Entra admin center. App registration steps can optionally use the CLI.

## What you'll produce

Four values, fed to the app as env vars (the Bicep + CD workflow already read them):

| Value | Env var | Where it's stored |
| --- | --- | --- |
| Session secret (random) | `AUTH_SECRET` | GitHub env **secret** → Key Vault `auth-secret` |
| App (client) ID | `AUTH_MICROSOFT_ENTRA_ID_ID` | GitHub env **variable** → container app env |
| Client secret value | `AUTH_MICROSOFT_ENTRA_ID_SECRET` | GitHub env **secret** → Key Vault `entra-client-secret` |
| Issuer / authority URL | `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | GitHub env **variable** → container app env |

## Callback (redirect) URLs

Auth.js serves the OIDC callback at `/api/auth/callback/microsoft-entra-id`. Register **both**:

- **dev (Azure):** `https://laferia-dev-app.livelydesert-a1e831f2.centralus.azurecontainerapps.io/api/auth/callback/microsoft-entra-id`
- **local:** `http://localhost:3000/api/auth/callback/microsoft-entra-id`

> If the dev container app FQDN changes, update the redirect URI to match
> (`az containerapp show -g laferia-dev -n laferia-dev-app --query properties.configuration.ingress.fqdn -o tsv`).

## Steps

### 1. Create an External ID tenant (portal)

[Entra admin center](https://entra.microsoft.com) → **Identity → Overview → Manage tenants →
Create → External**. Pick a subdomain (e.g. `laferiacr`) → the tenant domain becomes
`laferiacr.onmicrosoft.com` and the CIAM authority host is `laferiacr.ciamlogin.com`.
Note the **tenant ID** (a GUID).

### 2. Add identity providers (portal)

In the External ID tenant → **External Identities → All identity providers**:

- **Email one-time passcode** — enabled by default; leave on.
- **Google** — add, following
  [Microsoft's Google federation guide](https://learn.microsoft.com/entra/external-id/customers/how-to-google-federation-customers)
  (create OAuth client in Google Cloud Console, paste client ID + secret).

### 3. Register the application

Either in the portal (**App registrations → New registration**, account type
*Accounts in this organizational directory only*, add the two redirect URIs of type **Web**),
or via CLI logged into the External ID tenant:

```bash
az login --tenant <EXTERNAL_ID_TENANT_ID> --allow-no-subscriptions

DEV_FQDN=$(az containerapp show -g laferia-dev -n laferia-dev-app \
  --query properties.configuration.ingress.fqdn -o tsv 2>/dev/null || echo laferia-dev-app.livelydesert-a1e831f2.centralus.azurecontainerapps.io)

az ad app create \
  --display-name "La Feria CR" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris \
    "https://${DEV_FQDN}/api/auth/callback/microsoft-entra-id" \
    "http://localhost:3000/api/auth/callback/microsoft-entra-id" \
  --enable-id-token-issuance true
```

Record the **Application (client) ID** from the output → this is `AUTH_MICROSOFT_ENTRA_ID_ID`.

### 4. Create a client secret

Portal: **App registration → Certificates & secrets → New client secret** (copy the *value*, not
the ID). Or CLI:

```bash
az ad app credential reset --id <APP_CLIENT_ID> --append --query password -o tsv
```

This value is `AUTH_MICROSOFT_ENTRA_ID_SECRET`. It expires — set a calendar reminder to rotate.

### 5. Create the user flow and link the app (portal)

**External Identities → User flows → New user flow** → enable **Email one-time passcode** and
**Google** → on the flow's **Applications** tab, add the app from step 3. This is what makes the
Google + email OTP options appear on the hosted sign-in page.

### 6. Compute the issuer

```
AUTH_MICROSOFT_ENTRA_ID_ISSUER = https://<subdomain>.ciamlogin.com/<EXTERNAL_ID_TENANT_ID>/v2.0
```

e.g. `https://laferiacr.ciamlogin.com/00000000-0000-0000-0000-000000000000/v2.0`.
Auth.js appends `/.well-known/openid-configuration` for discovery.

### 7. Generate the session secret

```bash
npx auth secret        # prints an AUTH_SECRET, or:
openssl rand -base64 33
```

### 8. Store the values for CD

In the GitHub repo → **Settings → Environments → dev**:

- **Secrets:** `AUTH_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`
- **Variables:** `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_ISSUER`

The CD workflow ([`../.github/workflows/cd.yml`](../.github/workflows/cd.yml)) passes these to
`infra/main.bicep`, which puts `AUTH_SECRET` + the client secret in Key Vault (referenced by the
container app) and sets the client id + issuer as plain env vars. Re-run CD (push to `main`, or
`gh workflow run cd.yml --ref main -f environment=dev`) to roll the app with sign-in enabled.

### 9. Local testing

Copy the four values into `.env` (see [`../.env.example`](../.env.example)) and
`npm run dev`. Sign in from the header; on success a row is upserted into `users`
(`external_id` = the token's `oid`).

## Notes

- **`oid`, not `sub`, is the durable key.** The `jwt` callback in `src/auth.ts` upserts
  `users` keyed on the immutable object id Microsoft recommends for storage.
- **No route protection yet.** Login is optional in Phase 2; middleware/guards arrive in Phase 3
  when a verified account is needed to contribute.
- **Portal-only steps:** tenant creation, identity providers, and user flow have no first-class
  `az` commands and must be done in the Entra admin center.
