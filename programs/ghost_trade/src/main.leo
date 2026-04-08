program ghost_trade.aleo {

    @noupgrade
    constructor() {}

    // ── Records ──

    // A private holding of a token.
    record Holding {
        owner: address,
        token: field,
        amount: u64,
    }

    // A private receipt of a swap.
    record Receipt {
        owner: address,
        token_in: field,
        token_out: field,
        amount_in: u64,
        amount_out: u64,
        timestamp: u64,
    }

    // A ZK proof that the holder has at least `threshold` of a token
    // without revealing the actual amount.
    record BalanceProof {
        owner: address,
        token: field,
        threshold: u64,
        is_sufficient: bool,
    }

    // ── Transitions ──

    // Seed an initial balance for a token.
    fn create_holding(token: field, amount: u64) -> Holding {
        return Holding {
            owner: self.caller,
            token,
            amount,
        };
    }

    // Swap: consume a holding, produce remainder + new token holding + receipt.
    // price is in basis points (amount_out = amount * price / 10000).
    fn swap(
        holding: Holding,
        token_out: field,
        amount: u64,
        price: u64,
        timestamp: u64,
    ) -> (Holding, Holding, Receipt) {
        // Safety: max trade size
        assert(amount <= 10000u64);
        // Safety: can't spend more than you have
        assert(amount <= holding.amount);

        let remaining: u64 = holding.amount - amount;
        let amount_out: u64 = amount * price / 10000u64;

        let leftover: Holding = Holding {
            owner: self.caller,
            token: holding.token,
            amount: remaining,
        };

        let acquired: Holding = Holding {
            owner: self.caller,
            token: token_out,
            amount: amount_out,
        };

        let receipt: Receipt = Receipt {
            owner: self.caller,
            token_in: holding.token,
            token_out,
            amount_in: amount,
            amount_out,
            timestamp,
        };

        return (leftover, acquired, receipt);
    }

    // Split a holding and send a portion to a recipient.
    fn transfer_private(
        holding: Holding,
        recipient: address,
        amount: u64,
    ) -> (Holding, Holding) {
        assert(amount <= holding.amount);

        let remaining: u64 = holding.amount - amount;

        let sender_holding: Holding = Holding {
            owner: self.caller,
            token: holding.token,
            amount: remaining,
        };

        let recipient_holding: Holding = Holding {
            owner: recipient,
            token: holding.token,
            amount,
        };

        return (sender_holding, recipient_holding);
    }

    // Merge two holdings of the same token into one.
    // Useful for consolidating fragmented records after multiple trades.
    fn merge_holdings(
        a: Holding,
        b: Holding,
    ) -> Holding {
        // Both must be the same token
        assert_eq(a.token, b.token);

        return Holding {
            owner: self.caller,
            token: a.token,
            amount: a.amount + b.amount,
        };
    }

    // Prove you hold at least `threshold` of a token without revealing your balance.
    // Produces a BalanceProof record that anyone can verify.
    fn prove_minimum_balance(
        holding: Holding,
        threshold: u64,
    ) -> (Holding, BalanceProof) {
        let is_sufficient: bool = holding.amount >= threshold;

        // Return the original holding unchanged + the proof
        let unchanged: Holding = Holding {
            owner: self.caller,
            token: holding.token,
            amount: holding.amount,
        };

        let proof: BalanceProof = BalanceProof {
            owner: self.caller,
            token: holding.token,
            threshold,
            is_sufficient,
        };

        return (unchanged, proof);
    }

    // Burn a holding — consume a record and destroy the tokens.
    // Useful for dust cleanup or intentional burns.
    fn burn_holding(holding: Holding) -> () {
        assert(holding.amount > 0u64);
        // Record is consumed, nothing is returned — tokens are destroyed.
    }
}
