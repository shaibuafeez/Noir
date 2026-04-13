/**
 * Noir Protocol SDK — Error hierarchy.
 */

export class NoirError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "NoirError";
  }
}

export class NetworkError extends NoirError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "NetworkError";
  }
}

export class TransactionError extends NoirError {
  constructor(
    message: string,
    public readonly txHash?: string,
    cause?: unknown,
  ) {
    super(message, cause);
    this.name = "TransactionError";
  }
}

export class ValidationError extends NoirError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class InsufficientFundsError extends NoirError {
  constructor(
    public readonly required: number,
    public readonly available?: number,
  ) {
    super(
      `Insufficient funds: need ${required}${available !== undefined ? `, have ${available}` : ""}`,
    );
    this.name = "InsufficientFundsError";
  }
}

export class LaunchpadError extends NoirError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "LaunchpadError";
  }
}
