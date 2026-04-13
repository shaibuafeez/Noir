import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type Interaction,
} from "discord.js";
import { createWallet, getAddress } from "../aleo/wallet.js";
import { parseIntent } from "../agent/parser.js";
import { handleIntent, executeConfirmedTrade } from "../agent/actions.js";

const pendingConfirmations = new Map<string, string>();

const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("Create your Aleo wallet"),
  new SlashCommandBuilder()
    .setName("portfolio")
    .setDescription("View your portfolio"),
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("View active strategies"),
  new SlashCommandBuilder()
    .setName("price")
    .setDescription("Check token price")
    .addStringOption((o) => o.setName("token").setDescription("Token symbol").setRequired(true)),
  new SlashCommandBuilder()
    .setName("ghost")
    .setDescription("Send a natural language command to Ghost")
    .addStringOption((o) => o.setName("command").setDescription("e.g. buy 100 ALEO").setRequired(true)),
];

export async function registerCommands(token: string, clientId: string): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), {
    body: commands.map((c) => c.toJSON()),
  });
  console.log("[discord] Slash commands registered");
}

export function createDiscordBot(token: string, clientId: string): Client {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once("ready", async () => {
    console.log(`[discord] Bot ready as ${client.user?.tag}`);
    await registerCommands(token, clientId);
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction);
      } else if (interaction.isButton()) {
        await handleButton(interaction);
      }
    } catch (err) {
      console.error("[discord] Interaction error:", err);
    }
  });

  client.on("error", (err) => {
    console.error("[discord] Client error:", err.message);
  });

  client.on("shardError", (err) => {
    console.error("[discord] Shard error:", err.message);
  });

  // Prevent unhandled WS errors from crashing the process
  process.on("unhandledRejection", (err) => {
    console.error("[unhandled]", err);
  });

  client.login(token);
  return client;
}

async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId = interaction.user.id;
  const discordId = `discord_${userId}`;

  switch (interaction.commandName) {
    case "start": {
      const existing = getAddress(discordId);
      if (existing) {
        await interaction.reply({
          content: `Welcome back! Your Aleo address:\n\`${existing}\``,
          ephemeral: true,
        });
        return;
      }
      const { address } = createWallet(discordId);
      await interaction.reply({
        content:
          `Wallet created!\n\nYour Aleo address:\n\`${address}\`\n\n` +
          `Use \`/ghost buy 100 ALEO\` to start trading. Buys create private records on-chain.`,
        ephemeral: true,
      });
      return;
    }

    case "portfolio": {
      await interaction.deferReply({ ephemeral: true });
      const result = await handleIntent(discordId, { action: "portfolio" });
      await interaction.editReply(result.message);
      return;
    }

    case "status": {
      await interaction.deferReply({ ephemeral: true });
      const result = await handleIntent(discordId, { action: "status" });
      await interaction.editReply(result.message);
      return;
    }

    case "price": {
      await interaction.deferReply({ ephemeral: true });
      const token = interaction.options.getString("token", true).toUpperCase();
      const { getPrice } = await import("../market/prices.js");
      const price = await getPrice(token);
      await interaction.editReply(`${token}: $${price.toFixed(4)}`);
      return;
    }

    case "ghost": {
      const text = interaction.options.getString("command", true);

      if (!getAddress(discordId)) {
        await interaction.reply({
          content: "You need a wallet first. Use `/start`.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const parseResult = await parseIntent(text, {
        sessionId: discordId,
        walletAddress: getAddress(discordId),
      });

      if (!parseResult) {
        await interaction.editReply({
          content: "I couldn't parse that command. Try 'portfolio', 'buy 100 ALEO', or 'status'.",
        });
        return;
      }

      if (parseResult.type === "conversation") {
        await interaction.editReply({ content: parseResult.message });
        return;
      }

      const result = await handleIntent(discordId, parseResult.intent);

      if (result.needsConfirmation && result.confirmData) {
        const key = `${discordId}:${Date.now()}`;
        pendingConfirmations.set(key, result.confirmData);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm:${key}`)
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`cancel:${key}`)
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger),
        );

        await interaction.editReply({
          content: result.message,
          components: [row],
        });
      } else {
        await interaction.editReply(result.message);
      }
      return;
    }
  }
}

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const userId = interaction.user.id;
  const discordId = `discord_${userId}`;
  const customId = interaction.customId;

  if (customId.startsWith("confirm:")) {
    const key = customId.slice(8);
    const confirmData = pendingConfirmations.get(key);

    if (!confirmData) {
      await interaction.reply({ content: "Order expired.", ephemeral: true });
      return;
    }

    pendingConfirmations.delete(key);
    await interaction.update({
      content: "Proving transaction on Aleo... (this takes ~2 min)",
      components: [],
    });

    executeConfirmedTrade(discordId, confirmData)
      .then(async (result) => {
        await interaction.editReply({ content: result, components: [] });
      })
      .catch(async (err) => {
        const msg = `Trade failed: ${err instanceof Error ? err.message : String(err)}`;
        await interaction.editReply({ content: msg, components: [] });
      });
  } else if (customId.startsWith("cancel:")) {
    const key = customId.slice(7);
    pendingConfirmations.delete(key);
    await interaction.update({ content: "Trade cancelled.", components: [] });
  }
}
