import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { createWallet, getAddress } from "../aleo/wallet.js";
import { parseIntent } from "../agent/parser.js";
import { handleIntent, executeConfirmedTrade } from "../agent/actions.js";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const pendingConfirmations = new Map<string, string>();

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js":   "text/javascript",
  ".json": "application/json",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
  ".css":  "text/css",
  ".webmanifest": "application/manifest+json",
};

export function startWebServer(port = 3000): void {
  const webDir = join(import.meta.dirname, "../../web");

  const server = createServer((req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Resolve file path
    let urlPath = req.url ?? "/";
    if (urlPath === "/") urlPath = "/index.html";

    const filePath = join(webDir, urlPath);

    // Prevent directory traversal
    if (!filePath.startsWith(webDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (existsSync(filePath)) {
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
      // Special case: manifest.json → application/manifest+json
      const finalType = filePath.endsWith("manifest.json") ? "application/manifest+json" : contentType;
      res.writeHead(200, { "Content-Type": finalType });
      res.end(readFileSync(filePath));
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    // Each WS connection uses a session ID as the "user"
    const sessionId = `web_${Date.now().toString(36)}`;
    console.log(`[web] Client connected: ${sessionId}`);

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type: string;
          text?: string;
          key?: string;
        };

        if (msg.type === "start") {
          const existing = getAddress(sessionId);
          if (existing) {
            send(ws, { type: "wallet", address: existing });
          } else {
            const { address } = createWallet(sessionId);
            send(ws, { type: "wallet", address });
          }
          return;
        }

        if (msg.type === "message" && msg.text) {
          if (!getAddress(sessionId)) {
            const { address } = createWallet(sessionId);
            send(ws, { type: "wallet", address });
          }

          const intent = await parseIntent(msg.text);
          const result = await handleIntent(sessionId, intent);

          if (result.needsConfirmation && result.confirmData) {
            const key = `${sessionId}:${Date.now()}`;
            pendingConfirmations.set(key, result.confirmData);
            send(ws, {
              type: "confirm",
              message: result.message,
              key,
            });
          } else {
            send(ws, { type: "response", message: result.message });
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

          executeConfirmedTrade(sessionId, confirmData)
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
      } catch (err) {
        send(ws, { type: "error", message: "Invalid message" });
      }
    });

    ws.on("close", () => {
      console.log(`[web] Client disconnected: ${sessionId}`);
    });
  });

  server.listen(port, () => {
    console.log(`[web] Dashboard at http://localhost:${port}`);
  });
}

function send(ws: WebSocket, data: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}
