import {
  Account,
  ProgramManager,
  AleoNetworkClient,
  NetworkRecordProvider,
} from "@provablehq/sdk";
import { getCachedKeyProvider } from "./key-cache.js";
import { getNetworkConfig } from "./network.js";

let networkClient: AleoNetworkClient;

export function getNetworkClient(): AleoNetworkClient {
  if (!networkClient) {
    networkClient = new AleoNetworkClient(getNetworkConfig().apiUrl);
  }
  return networkClient;
}

export function createProgramManager(account: Account): ProgramManager {
  const net = getNetworkClient();
  const kp = getCachedKeyProvider();
  const recordProvider = new NetworkRecordProvider(account, net);

  const pm = new ProgramManager(getNetworkConfig().apiUrl, kp, recordProvider);
  pm.setAccount(account);
  return pm;
}
