/**
 * Network configuration — reads ALEO_NETWORK env to select testnet or mainnet.
 * Mainnet requires MAINNET_CONFIRM=true as a safety gate.
 */

export type AleoNetwork = "testnet" | "mainnet";

export interface NetworkConfig {
  network: AleoNetwork;
  apiUrl: string;
  label: string;
  defaultPriorityFee: number;
}

const CONFIGS: Record<AleoNetwork, NetworkConfig> = {
  testnet: {
    network: "testnet",
    apiUrl: "https://api.explorer.provable.com/v1",
    label: "Aleo Testnet",
    defaultPriorityFee: 0.02,
  },
  mainnet: {
    network: "mainnet",
    apiUrl: "https://api.explorer.provable.com/v1",
    label: "Aleo Mainnet",
    defaultPriorityFee: 0.05,
  },
};

let resolved: NetworkConfig | null = null;

export function getNetworkConfig(): NetworkConfig {
  if (resolved) return resolved;

  const env = (process.env.ALEO_NETWORK ?? "testnet").toLowerCase();
  if (env !== "testnet" && env !== "mainnet") {
    throw new Error(`Invalid ALEO_NETWORK="${env}". Must be "testnet" or "mainnet".`);
  }

  if (env === "mainnet" && process.env.MAINNET_CONFIRM !== "true") {
    throw new Error(
      "ALEO_NETWORK=mainnet requires MAINNET_CONFIRM=true. " +
      "This is a safety gate — set it explicitly to confirm mainnet usage.",
    );
  }

  const config = { ...CONFIGS[env] };

  // Allow priority fee override
  const feeOverride = process.env.PRIORITY_FEE;
  if (feeOverride) {
    const fee = parseFloat(feeOverride);
    if (!isNaN(fee) && fee >= 0) config.defaultPriorityFee = fee;
  }

  resolved = config;
  return config;
}

export function getNetworkLabel(): string {
  return getNetworkConfig().label;
}

/**
 * Validate network config on startup. Throws if invalid.
 */
export function validateNetwork(): void {
  const cfg = getNetworkConfig();
  console.log(`[network] ${cfg.label} — API: ${cfg.apiUrl}`);
  console.log(`[network] Default priority fee: ${cfg.defaultPriorityFee}`);
}
