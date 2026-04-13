/**
 * NoirClient — main facade for the Noir Protocol SDK.
 *
 * Sub-clients are lazily initialized. Read-only operations (explorer, math)
 * work without a private key. On-chain transactions require an account.
 */

import type { AleoNetwork, NoirClientOptions } from "./types.js";
import { ValidationError } from "./errors.js";
import { ExplorerClient } from "./network/explorer.js";
import { TradeClient } from "./trade/trade-client.js";
import { LaunchpadClient } from "./launchpad/launchpad-client.js";
import { ZkLoginClient } from "./zklogin/zklogin-client.js";

export class NoirClient {
  private readonly network: AleoNetwork;
  private readonly priorityFee?: number;
  private account: any;

  private _explorer?: ExplorerClient;
  private _trade?: TradeClient;
  private _launchpad?: LaunchpadClient;
  private _zklogin?: ZkLoginClient;

  constructor(options: NoirClientOptions = {}) {
    this.network = options.network ?? "testnet";
    this.priorityFee = options.priorityFee;

    if (options.account) {
      this.account = options.account;
    } else if (options.privateKey) {
      this.account = NoirClient.accountFromKey(options.privateKey);
    }
  }

  /** Resolve account, throw if not available. */
  private requireAccount(): any {
    if (!this.account) {
      throw new ValidationError(
        "An account (privateKey or account) is required for on-chain transactions.",
      );
    }
    return this.account;
  }

  /** Create an Account from a private key string. */
  private static accountFromKey(privateKey: string): any {
    let sdk: any;
    try {
      sdk = require("@provablehq/sdk");
    } catch {
      throw new ValidationError(
        "@provablehq/sdk is required. Install it as a dependency.",
      );
    }
    return sdk.Account.from_string(privateKey);
  }

  // ── Sub-clients (lazy) ──

  /** Explorer client for read-only on-chain queries. No account needed. */
  get explorer(): ExplorerClient {
    if (!this._explorer) {
      this._explorer = new ExplorerClient(this.network, this.priorityFee);
    }
    return this._explorer;
  }

  /** Trade client for swaps, holdings, and transfers. Requires account. */
  get trade(): TradeClient {
    if (!this._trade) {
      this._trade = new TradeClient(
        this.requireAccount(),
        this.network,
        this.priorityFee,
      );
    }
    return this._trade;
  }

  /** Launchpad client for bonding curve operations. Requires account. */
  get launchpad(): LaunchpadClient {
    if (!this._launchpad) {
      this._launchpad = new LaunchpadClient(
        this.requireAccount(),
        this.network,
        this.priorityFee,
      );
    }
    return this._launchpad;
  }

  /** zkLogin client for commitment registration. Requires account. */
  get zklogin(): ZkLoginClient {
    if (!this._zklogin) {
      this._zklogin = new ZkLoginClient(
        this.requireAccount(),
        this.network,
        this.priorityFee,
      );
    }
    return this._zklogin;
  }

  // ── Static helpers ──

  /**
   * Create a new Aleo account.
   * @returns Object with privateKey, viewKey, and address strings.
   */
  static createAccount(): {
    privateKey: string;
    viewKey: string;
    address: string;
  } {
    let sdk: any;
    try {
      sdk = require("@provablehq/sdk");
    } catch {
      throw new ValidationError(
        "@provablehq/sdk is required. Install it as a dependency.",
      );
    }
    const account = new sdk.Account();
    return {
      privateKey: account.privateKey().to_string(),
      viewKey: account.viewKey().to_string(),
      address: account.address().to_string(),
    };
  }
}
