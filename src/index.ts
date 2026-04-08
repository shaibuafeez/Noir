import "dotenv/config";
import { initDb } from "./storage/db.js";
import { createBot } from "./chat/telegram.js";
import { startLimitOrderEngine } from "./market/limits.js";
import { startStrategyEngine, stopStrategyEngine } from "./market/strategies.js";
import { startAlertEngine, stopAlertEngine } from "./market/alerts.js";
import { startPriceRecorder, stopPriceRecorder } from "./market/indicators.js";
import { createDiscordBot } from "./chat/discord.js";
import { startWebServer } from "./chat/web-server.js";
import { startMcpServer } from "./mcp/server.js";
import { validateNetwork } from "./aleo/network.js";
import { prewarmKeys } from "./aleo/key-cache.js";

function main(): void {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN is required in .env");
    process.exit(1);
  }

  const llmUrl = process.env.LLM_URL || undefined;

  // Validate network configuration (fails fast for invalid config)
  validateNetwork();

  // Initialize database
  console.log("[ghost] Initializing database...");
  initDb();

  // Pre-warm proving key cache (non-blocking)
  prewarmKeys().catch((err) => {
    console.warn("[ghost] Key prewarm failed:", err instanceof Error ? err.message : err);
  });

  // Create and start Telegram bot
  console.log("[ghost] Starting Telegram bot...");
  const bot = createBot(botToken, llmUrl);

  // Start engines
  startLimitOrderEngine(bot);
  startStrategyEngine(bot);
  startAlertEngine(bot);
  startPriceRecorder();

  // Start web dashboard
  const webPort = parseInt(process.env.WEB_PORT ?? "3000", 10);
  startWebServer(webPort);

  // Start MCP server
  const mcpPort = parseInt(process.env.MCP_PORT ?? "3001", 10);
  startMcpServer(mcpPort);

  // Start Discord bot (if configured)
  const discordToken = process.env.DISCORD_BOT_TOKEN;
  const discordClientId = process.env.DISCORD_CLIENT_ID;
  if (discordToken && discordClientId) {
    console.log("[ghost] Starting Discord bot...");
    createDiscordBot(discordToken, discordClientId);
  }

  // Start polling
  bot.start({
    onStart: () => {
      console.log("[ghost] Bot is running!");
      if (llmUrl) {
        console.log(`[ghost] LLM endpoint: ${llmUrl}`);
      } else {
        console.log("[ghost] LLM not configured — using regex parser");
      }
    },
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n[ghost] Shutting down...");
    stopStrategyEngine();
    stopAlertEngine();
    stopPriceRecorder();
    bot.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
