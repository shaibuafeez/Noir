import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export interface GoogleClaims {
  sub: string;
  email: string;
  name: string;
  picture: string;
  iss: string;
}

/**
 * Exchange an authorization code for tokens via Google's token endpoint.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<{ idToken: string; accessToken: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${body}`);
  }

  const json = (await res.json()) as {
    id_token: string;
    access_token: string;
  };
  return { idToken: json.id_token, accessToken: json.access_token };
}

/**
 * Verify a Google ID token (JWT) and return the claims.
 */
export async function verifyGoogleJwt(
  idToken: string,
): Promise<GoogleClaims> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID must be set");

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: GOOGLE_ISSUER,
    audience: clientId,
  });

  const p = payload as JWTPayload & {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!p.sub) throw new Error("Missing sub claim in Google JWT");

  return {
    sub: p.sub,
    email: p.email ?? "",
    name: p.name ?? "",
    picture: p.picture ?? "",
    iss: GOOGLE_ISSUER,
  };
}

/**
 * Build the Google OAuth consent URL.
 */
export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID must be set");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}
