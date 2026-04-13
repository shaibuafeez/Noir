import test_usdcx_stablecoin.aleo;

program ghost_trade_v3.aleo {

    @noupgrade
    constructor() {}

    // ── Constants ──

    const MAX_TRADE_AMOUNT: u64 = 10000u64;
    const BASIS_POINTS: u64 = 10000u64;

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

    // ── Mappings ──

    // Authorized minters — only addresses registered here can create holdings.
    mapping authorized_minters: address => bool;

    // Admin address for minter management (set on first call).
    mapping admin: u8 => address;

    // ── Transitions ──

    // Initialize the admin (deployer). Can only be called once.
    fn init_admin() -> Final {
        let caller: address = self.caller;
        return final {
            let has_admin: bool = admin.contains(0u8);
            assert(!has_admin);
            admin.set(0u8, caller);
            authorized_minters.set(caller, true);
        };
    }

    // Admin can authorize additional minters.
    fn authorize_minter(minter: address) -> Final {
        let caller: address = self.caller;
        return final {
            let current_admin: address = admin.get(0u8);
            assert_eq(current_admin, caller);
            authorized_minters.set(minter, true);
        };
    }

    // Seed an initial balance for a token.
    // Restricted to authorized minters only.
    fn create_holding(token: field, amount: u64) -> (Holding, Final) {
        assert(amount > 0u64);

        let holding: Holding = Holding {
            owner: self.caller,
            token,
            amount,
        };
        let caller: address = self.caller;
        return (holding, final {
            let is_authorized: bool = authorized_minters.get_or_use(caller, false);
            assert(is_authorized);
        });
    }

    // Swap: consume a holding, produce remainder + new token holding + receipt.
    // price is in basis points (amount_out = amount * price / BASIS_POINTS).
    fn swap(
        holding: Holding,
        token_out: field,
        amount: u64,
        price: u64,
        timestamp: u64,
    ) -> (Holding, Holding, Receipt) {
        // Safety: max trade size
        assert(amount <= MAX_TRADE_AMOUNT);
        // Safety: can't spend more than you have
        assert(amount <= holding.amount);

        let remaining: u64 = holding.amount - amount;
        let amount_out: u64 = amount * price / BASIS_POINTS;

        // Safety: must receive at least 1 token (prevents zero-output from rounding)
        assert(amount_out > 0u64);

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

        // Overflow guard: sum must not wrap
        let merged: u64 = a.amount + b.amount;
        assert(merged >= a.amount);

        return Holding {
            owner: self.caller,
            token: a.token,
            amount: merged,
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

    // Buy tokens by paying USDCx (test_usdcx_stablecoin.aleo) to a seller.
    // USDCx uses u128 amounts (6 decimals, same as USDC).
    fn buy_with_usdcx(
        token: field,
        amount: u64,
        usdcx_cost: u128,
        seller: address,
    ) -> (Holding, Final) {
        // Safety: max trade size
        assert(amount <= MAX_TRADE_AMOUNT);
        assert(usdcx_cost > 0u128);

        // Transfer USDCx to seller via the official stablecoin program
        let transfer: Final = test_usdcx_stablecoin.aleo::transfer_public(seller, usdcx_cost);

        let holding: Holding = Holding {
            owner: self.caller,
            token,
            amount,
        };

        return (holding, final {
            transfer.run();
        });
    }
}
