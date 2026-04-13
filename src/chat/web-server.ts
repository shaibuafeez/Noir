import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { createWallet, getAddress } from "../aleo/wallet.js";
import { parseIntent, type AgentContext } from "../agent/parser.js";
import { handleIntent, executeConfirmedTrade } from "../agent/actions.js";
import { mapToolToIntent } from "../agent/ai.js";
import { handleApiRequest } from "./web-api.js";
import { fetchMarketSnapshot, type MarketSnapshot } from "./market-ws.js";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { randomBytes } from "node:crypto";
import {
  exchangeCodeForTokens,
  verifyGoogleJwt,
  getGoogleAuthUrl,
} from "../auth/google.js";
import { getOrCreateOAuthWallet } from "../aleo/zklogin.js";

const pendingConfirmations = new Map<string, string>();

// OAuth state tokens with 5-minute TTL
const oauthStates = new Map<string, number>();
setInterval(() => {
  const now = Date.now();
  for (const [state, ts] of oauthStates) {
    if (now - ts > 5 * 60_000) oauthStates.delete(state);
  }
}, 60_000);

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".mjs":  "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif":  "image/gif",
  ".ico":  "image/x-icon",
  ".css":  "text/css; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf":  "font/ttf",
  ".txt":  "text/plain; charset=utf-8",
  ".map":  "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function resolveStaticFile(webDir: string, urlPath: string): string | null {
  // Strip query string
  const cleanUrl = urlPath.split("?")[0] ?? "/";
  const candidates: string[] = [];

  if (cleanUrl === "/" || cleanUrl === "") {
    candidates.push(join(webDir, "index.html"));
  } else {
    // Exact file match (e.g. /_next/static/xxx.js)
    candidates.push(join(webDir, cleanUrl));
    // Trailing-slash route (Next.js static export: /dashboard/ → /dashboard/index.html)
    if (cleanUrl.endsWith("/")) {
      candidates.push(join(webDir, cleanUrl, "index.html"));
    } else {
      // Clean URL fallback: /dashboard → /dashboard/index.html or /dashboard.html
      candidates.push(join(webDir, `${cleanUrl}.html`));
      candidates.push(join(webDir, cleanUrl, "index.html"));
    }
  }

  for (const p of candidates) {
    if (!p.startsWith(webDir)) continue; // directory traversal guard
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

export function startWebServer(port = 3000): void {
  // Serve Next.js static export from web-next/out
  const webDir = join(import.meta.dirname, "../../web-next/out");

  const server = createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // REST API routes take priority over static files
    if (await handleApiRequest(req, res)) return;

    // OAuth routes
    if (await handleOAuthRequest(req, res)) return;

    const urlPath = req.url ?? "/";
    const filePath = resolveStaticFile(webDir, urlPath);

    if (filePath) {
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
      // Cache Next.js hashed assets aggressively; HTML and root files stay fresh.
      const isHashedAsset = filePath.includes(`${"/_next/static/"}`);
      const cacheControl = isHashedAsset
        ? "public, max-age=31536000, immutable"
        : "no-cache";
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      });
      res.end(readFileSync(filePath));
      return;
    }

    // SPA-style fallback: serve root index.html for unknown routes so
    // client-side navigation still resolves if the user deep-links.
    const indexPath = join(webDir, "index.html");
    if (existsSync(indexPath)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(readFileSync(indexPath));
      return;
    }

    res.writeHead(404);
    res.end("Not found. Run `cd web-next && npm run build` to generate the site.");
  });

  const wss = new WebSocketServer({ server });

  // ── Real-time price broadcast every 5 seconds ──
  let lastSnapshot: MarketSnapshot[] = [];
  const PRICE_INTERVAL_MS = 5_000;

  async function broadcastPrices(): Promise<void> {
    try {
      lastSnapshot = await fetchMarketSnapshot();
      const msg = JSON.stringify({ type: "price_update", data: lastSnapshot });
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      }
    } catch (e) {
      console.error("[price-ws] broadcast error:", e);
    }
  }

  // Start broadcast loop
  setInterval(() => void broadcastPrices(), PRICE_INTERVAL_MS);
  // Fire first snapshot immediately
  void broadcastPrices();

  wss.on("connection", (ws) => {
    // Each WS connection uses a session ID as the "user"
    let currentSessionId = `web_${Date.now().toString(36)}`;
    console.log(`[web] Client connected: ${currentSessionId}`);

    // Send latest snapshot immediately so new clients don't wait 5s
    if (lastSnapshot.length > 0) {
      send(ws, { type: "price_update", data: lastSnapshot });
    }

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type: string;
          text?: string;
          key?: string;
          sessionId?: string;
          action?: string;
          params?: Record<string, unknown>;
        };

        // OAuth session rebinding: client sends { type: "auth", sessionId }
        if (msg.type === "auth" && msg.sessionId) {
          const addr = getAddress(msg.sessionId);
          if (addr) {
            currentSessionId = msg.sessionId;
            console.log(`[web] Session rebound to: ${currentSessionId}`);
            send(ws, { type: "wallet", address: addr, sessionId: currentSessionId, auth: true });
          } else {
            send(ws, { type: "error", message: "Invalid session" });
          }
          return;
        }

        if (msg.type === "start") {
          const existing = getAddress(currentSessionId);
          if (existing) {
            send(ws, { type: "wallet", address: existing, sessionId: currentSessionId });
          } else {
            const { address } = createWallet(currentSessionId);
            send(ws, { type: "wallet", address, sessionId: currentSessionId });
          }
          return;
        }

        if (msg.type === "message" && msg.text) {
          if (!getAddress(currentSessionId)) {
            const { address } = createWallet(currentSessionId);
            send(ws, { type: "wallet", address, sessionId: currentSessionId });
          }

          const agentCtx: AgentContext = {
            sessionId: currentSessionId,
            walletAddress: getAddress(currentSessionId),
            sessionType: currentSessionId.startsWith("oauth_") ? "oauth" : "web",
          };
          const parseResult = await parseIntent(msg.text, agentCtx);

          if (!parseResult) {
            // No AI, no regex match → static help
            send(ws, {
              type: "response",
              message:
                "I couldn't parse that command. Try 'portfolio', 'buy 100 ALEO', or 'status'.",
            });
          } else if (parseResult.type === "conversation") {
            // AI responded conversationally
            send(ws, { type: "response", message: parseResult.message });
          } else {
            // Tool call → existing handleIntent flow
            const result = await handleIntent(currentSessionId, parseResult.intent);
            if (result.needsConfirmation && result.confirmData) {
              const key = `${currentSessionId}:${Date.now()}`;
              pendingConfirmations.set(key, result.confirmData);
              send(ws, {
                type: "confirm",
                message: result.message,
                key,
              });
            } else {
              send(ws, { type: "response", message: result.message });
            }
          }
          return;
        }

        if (msg.type === "confirm" && msg.key) {
          const confirmData = pendingConfirmations.get(msg.key);
          if (!confirmData) {
            send(ws, { type: "response", message: "Order expired." });
            return;
          }
          pendingConfirmations.delete(msg.key);
          send(ws, { type: "response", message: "Proving transaction on Aleo... (~2 min)" });

          executeConfirmedTrade(currentSessionId, confirmData)
            .then((result) => send(ws, { type: "response", message: result }))
            .catch((err) =>
              send(ws, {
                type: "response",
                message: `Failed: ${err instanceof Error ? err.message : String(err)}`,
              }),
            );
          return;
        }

        if (msg.type === "cancel" && msg.key) {
          pendingConfirmations.delete(msg.key!);
          send(ws, { type: "response", message: "Trade cancelled." });
          return;
        }

        // Voice action: Gemini function call → mapToolToIntent → handleIntent
        if (msg.type === "voice_action" && msg.action) {
          if (!getAddress(currentSessionId)) {
            const { address } = createWallet(currentSessionId);
            send(ws, { type: "wallet", address, sessionId: currentSessionId });
          }
          const intent = mapToolToIntent(msg.action, msg.params ?? {});
          if (!intent) {
            send(ws, { type: "voice_response", message: "I didn't understand that action." });
            return;
          }
          const result = await handleIntent(currentSessionId, intent);
          if (result.needsConfirmation && result.confirmData) {
            const key = `${currentSessionId}:${Date.now()}`;
            pendingConfirmations.set(key, result.confirmData);
            send(ws, { type: "voice_response", message: result.message, confirmKey: key });
          } else {
            send(ws, { type: "voice_response", message: result.message });
          }
          return;
        }
      } catch (err) {
        send(ws, { type: "error", message: "Invalid message" });
      }
    });

    ws.on("close", () => {
      console.log(`[web] Client disconnected: ${currentSessionId}`);
    });
  });

  server.listen(port, () => {
    console.log(`[web] Dashboard at http://localhost:${port}`);
  });
}

async function handleOAuthRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  // Base URL for OAuth redirects — use BACKEND_URL env var in production (Railway)
  const backendBase = process.env.BACKEND_URL || `${url.protocol}//${url.host}`;

  // GET /auth/google → redirect to Google consent
  if (url.pathname === "/auth/google" && req.method === "GET") {
    if (!process.env.GOOGLE_CLIENT_ID) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Google OAuth not configured");
      return true;
    }

    const state = randomBytes(16).toString("hex");
    oauthStates.set(state, Date.now());

    const redirectUri = `${backendBase}/auth/google/callback`;
    const authUrl = getGoogleAuthUrl(redirectUri, state);

    res.writeHead(302, { Location: authUrl });
    res.end();
    return true;
  }

  // GET /auth/google/callback → exchange code, create/load wallet, redirect
  if (url.pathname === "/auth/google/callback" && req.method === "GET") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state || !oauthStates.has(state)) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Invalid or expired OAuth state");
      return true;
    }
    oauthStates.delete(state);

    try {
      const redirectUri = `${backendBase}/auth/google/callback`;
      const { idToken } = await exchangeCodeForTokens(code, redirectUri);
      const claims = await verifyGoogleJwt(idToken);
      const { address, sessionId } = getOrCreateOAuthWallet(
        "google",
        claims.sub,
        claims.iss,
      );

      const payload = Buffer.from(
        JSON.stringify({
          sessionId,
          address,
          provider: "google",
          name: claims.name,
          picture: claims.picture,
          email: claims.email,
        }),
      ).toString("base64url");

      // Redirect to the frontend (Vercel) with auth payload
      const frontendUrl = process.env.FRONTEND_URL || backendBase;
      res.writeHead(302, { Location: `${frontendUrl}/dashboard/?auth=${payload}` });
      res.end();
    } catch (err) {
      console.error("[oauth] callback error:", err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(
        `OAuth error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return true;
  }

  return false;
}

function send(ws: WebSocket, data: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}
