import "server-only";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

const usingEmulator =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
// Must match the project the browser signs in to (see src/lib/firebase.ts).
const projectId = usingEmulator ? "demo-classsync" : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

// Google's public keys for Firebase ID tokens (cached and rotated by jose).
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/**
 * Returns the uid for a valid Firebase ID token, or null.
 * Follows Firebase's documented checks: RS256 signed by Google, issuer and
 * audience match this project, not expired, has a subject.
 */
export async function verifyRequestUser(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || token === "undefined") {
    console.warn("[verify-user] request had no ID token");
    return null;
  }
  const issuer = `https://securetoken.google.com/${projectId}`;
  try {
    if (usingEmulator) {
      // The local Auth emulator issues unsigned tokens; only accept them in emulator mode.
      const claims = decodeJwt(token);
      if (claims.aud !== projectId || claims.iss !== issuer || !claims.sub) throw new Error("wrong project");
      if (claims.exp && claims.exp * 1000 < Date.now()) throw new Error("expired");
      return claims.sub;
    }
    const { payload } = await jwtVerify(token, googleKeys, { algorithms: ["RS256"], issuer, audience: projectId });
    if (!payload.sub) throw new Error("missing subject");
    return payload.sub;
  } catch (err) {
    console.warn("[verify-user] ID token rejected:", (err as { code?: string }).code ?? "", (err as Error).message);
    return null;
  }
}
