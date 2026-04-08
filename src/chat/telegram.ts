import { Bot, InlineKeyboard } from "grammy";
import { createWallet, getAddress } from "../aleo/wallet.js";
import { parseIntent } from "../agent/parser.js";
import { handleIntent, executeConfirmedTrade } from "../agent/actions.js";
import { getNetworkLabel } from "../aleo/network.js";

const pendingConfirmations = new Map<string, string>();

export function createBot(token: string, llmUrl?: string): Bot {
  const bot = new Bot(token);

  // /start — create wallet
  bot.command("start", async (ctx) => {
    const telegramId = String(ctx.from!.id);

    // Check if user already has a wallet
    const existing = getAddress(telegramId);
    if (existing) {
      await ctx.reply(
        `Welcome back! Your Aleo address:\n\`${existing}\`\n\n` +
          "Commands:\n" +
          '• "buy 100 ALEO"\n' +
          '• "sell 50 ALEO"\n' +
          '• "portfolio"\n' +
          '• "limit buy 100 ALEO at 0.50"',
        { parse_mode: "Markdown" },
      );
      return;
    }

    const { address } = createWallet(telegramId);
    await ctx.reply(
      `Wallet created!\n\nYour Aleo address:\n\`${address}\`\n\n` +
        `This is your ${getNetworkLabel()} wallet. Buys create private records on-chain via ZK proofs.\n\n` +
        "Try:\n" +
        '• "buy 100 ALEO"\n' +
        '• "portfolio"',
      { parse_mode: "Markdown" },
    );
  });

  // /portfolio shortcut
  bot.command("portfolio", async (ctx) => {
    const telegramId = String(ctx.from!.id);
    const result = await handleIntent(telegramId, { action: "portfolio" });
    await ctx.reply(result.message);
  });

  // Text messages — parse intent
  bot.on("message:text", async (ctx) => {
    const telegramId = String(ctx.from!.id);
    const text = ctx.message.text;

    // Check wallet exists
    if (!getAddress(telegramId)) {
      await ctx.reply("You need a wallet first. Send /start to create one.");
      return;
    }

    const intent = await parseIntent(text, llmUrl);
    const result = await handleIntent(telegramId, intent);

    if (result.needsConfirmation && result.confirmData) {
      // Store confirmation data and show confirm/cancel buttons
      const key = `${telegramId}:${Date.now()}`;
      pendingConfirmations.set(key, result.confirmData);

      const keyboard = new InlineKeyboard()
        .text("Confirm", `confirm:${key}`)
        .text("Cancel", `cancel:${key}`);

      await ctx.reply(result.message, { reply_markup: keyboard });
    } else {
      await ctx.reply(result.message);
    }
  });

  // Callback queries — confirm/cancel
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const telegramId = String(ctx.from!.id);

    if (data.startsWith("confirm:")) {
      const key = data.slice(8);
      const confirmData = pendingConfirmations.get(key);

      if (!confirmData) {
        await ctx.answerCallbackQuery({ text: "Order expired" });
        return;
      }

      pendingConfirmations.delete(key);
      await ctx.answerCallbackQuery({ text: "Executing..." });
      await ctx.editMessageReplyMarkup(undefined);
      await ctx.editMessageText("Proving transaction on Aleo... (this takes ~2 min)");

      // Run proving in background — don't block the callback handler
      const chatId = ctx.chat!.id;
      const messageId = ctx.callbackQuery.message!.message_id;
      executeConfirmedTrade(telegramId, confirmData)
        .then((result) => {
          bot.api.editMessageText(chatId, messageId, result).catch(() => {});
        })
        .catch((err) => {
          const msg = `Trade failed: ${err instanceof Error ? err.message : String(err)}`;
          bot.api.editMessageText(chatId, messageId, msg).catch(() => {});
        });
    } else if (data.startsWith("cancel:")) {
      const key = data.slice(7);
      pendingConfirmations.delete(key);
      await ctx.answerCallbackQuery({ text: "Cancelled" });
      await ctx.editMessageText("Trade cancelled.");
    }
  });

  return bot;
}
