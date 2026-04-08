#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { initDb } from "../storage/db.js";
import { createWallet, getAddress, loadWallet } from "../aleo/wallet.js";
import { executeSwap, transferCredits } from "../aleo/trade.js";
import { getPrice } from "../market/prices.js";
import { handleIntent } from "../agent/actions.js";

initDb();

const CLI_USER = "cli_user";
const program = new Command();

program
  .name("ghost")
  .description("Ghost — Private AI trading agent on Aleo")
  .version("0.1.0");

program
  .command("wallet")
  .description("Show or create your Aleo wallet")
  .action(() => {
    const addr = getAddress(CLI_USER);
    if (addr) {
      console.log(`Your Aleo address: ${addr}`);
    } else {
      const { address } = createWallet(CLI_USER);
      console.log(`Wallet created: ${address}`);
    }
  });

program
  .command("buy <amount> <token>")
  .description("Buy tokens privately on Aleo")
  .action(async (amountStr: string, token: string) => {
    const account = loadWallet(CLI_USER);
    if (!account) {
      console.log("No wallet. Run: ghost wallet");
      return;
    }

    const amount = parseFloat(amountStr);
    const price = await getPrice(token.toUpperCase());
    console.log(`BUY ${amount} ${token.toUpperCase()} @ $${price.toFixed(4)}`);
    console.log("Proving transaction... (this takes ~2 min)");

    const result = await executeSwap(account, CLI_USER, "buy", token.toUpperCase(), amount, price);
    console.log(result.message);
  });

program
  .command("sell <amount> <token>")
  .description("Sell tokens")
  .action(async (amountStr: string, token: string) => {
    const account = loadWallet(CLI_USER);
    if (!account) {
      console.log("No wallet. Run: ghost wallet");
      return;
    }

    const amount = parseFloat(amountStr);
    const price = await getPrice(token.toUpperCase());
    const result = await executeSwap(account, CLI_USER, "sell", token.toUpperCase(), amount, price);
    console.log(result.message);
  });

program
  .command("send <amount> <recipient>")
  .description("Send ALEO credits privately")
  .action(async (amountStr: string, recipient: string) => {
    const account = loadWallet(CLI_USER);
    if (!account) {
      console.log("No wallet. Run: ghost wallet");
      return;
    }

    const amount = parseFloat(amountStr);
    console.log(`Sending ${amount} ALEO to ${recipient.slice(0, 12)}...`);
    console.log("Proving transaction...");

    const result = await transferCredits(account, recipient, amount);
    console.log(result.message);
  });

program
  .command("portfolio")
  .description("View your portfolio")
  .action(async () => {
    const result = await handleIntent(CLI_USER, { action: "portfolio" });
    console.log(result.message);
  });

program
  .command("stack <token> <amount> <interval>")
  .description("DCA — recurring buys (e.g. ghost stack ALEO 50 weekly)")
  .action(async (token: string, amountStr: string, interval: string) => {
    const result = await handleIntent(CLI_USER, {
      action: "stack",
      token: token.toUpperCase(),
      amount: parseFloat(amountStr),
      interval: interval as "hourly" | "daily" | "weekly",
    });
    console.log(result.message);
  });

program
  .command("protect <threshold>")
  .description("Stop-loss — auto-sell on drawdown (e.g. ghost protect 20)")
  .action(async (thresholdStr: string) => {
    const result = await handleIntent(CLI_USER, {
      action: "protect",
      threshold: parseFloat(thresholdStr),
    });
    console.log(result.message);
  });

program
  .command("status")
  .description("View active strategies")
  .action(async () => {
    const result = await handleIntent(CLI_USER, { action: "status" });
    console.log(result.message);
  });

program
  .command("price <token>")
  .description("Check current price")
  .action(async (token: string) => {
    const price = await getPrice(token.toUpperCase());
    console.log(`${token.toUpperCase()}: $${price.toFixed(4)}`);
  });

program.parse();
