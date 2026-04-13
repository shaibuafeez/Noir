program ghost_launchpad_v2.aleo {

    @noupgrade
    constructor() {}

    // ── Constants ──

    const MAX_SUPPLY: u64 = 1000000u64;
    const GRADUATION_THRESHOLD: u64 = 800000u64;
    const CURVE_DIVISOR: u64 = 1000u64;
    const CREATOR_FEE_BPS: u128 = 200u128;  // 2% creator fee (basis points out of 10000)
    const FEE_DENOMINATOR: u128 = 10000u128;

    // ── Records ──

    // Private holding of tokens for a specific launch.
    record LaunchHolding {
        owner: address,
        launch_id: field,
        amount: u64,
    }

    // Proof-of-creation receipt for launch creators.
    record LaunchReceipt {
        owner: address,
        launch_id: field,
    }

    // ── Mappings (public on-chain state) ──

    mapping supply_sold: field => u64;
    mapping graduated: field => bool;
    mapping launch_creators: field => address;
    mapping treasury: field => u128;        // Accumulated value from bonding curve buys
    mapping creator_fees: field => u128;    // Claimable creator fees

    // ── Transitions ──

    // Create a new launch. Returns a receipt to the creator.
    fn create_launch(launch_id: field) -> (LaunchReceipt, Final) {
        let receipt: LaunchReceipt = LaunchReceipt {
            owner: self.caller,
            launch_id: launch_id,
        };
        let caller: address = self.caller;
        return (receipt, final {
            // Assert launch doesn't already exist
            let existing: bool = supply_sold.contains(launch_id);
            assert(!existing);

            // Initialize state
            supply_sold.set(launch_id, 0u64);
            graduated.set(launch_id, false);
            launch_creators.set(launch_id, caller);
            treasury.set(launch_id, 0u128);
            creator_fees.set(launch_id, 0u128);
        });
    }

    // Buy tokens on the bonding curve.
    // max_price is the maximum cost the buyer is willing to pay (slippage protection).
    fn buy_token(
        launch_id: field,
        amount: u64,
        max_price: u64,
    ) -> (LaunchHolding, Final) {
        assert(amount > 0u64);

        let holding: LaunchHolding = LaunchHolding {
            owner: self.caller,
            launch_id: launch_id,
            amount: amount,
        };

        return (holding, final {
            // Must not be graduated
            let is_graduated: bool = graduated.get(launch_id);
            assert(!is_graduated);

            let current_supply: u64 = supply_sold.get(launch_id);

            // Max supply check
            let new_supply: u64 = current_supply + amount;
            assert(new_supply <= MAX_SUPPLY);

            // Bonding curve cost: amount * (1 + (current_supply + amount/2) / CURVE_DIVISOR)
            let midpoint: u64 = current_supply + amount / 2u64;
            let cost: u64 = amount * (1u64 + midpoint / CURVE_DIVISOR);
            assert(cost <= max_price);

            // Accumulate payment into treasury
            let cost_128: u128 = cost as u128;
            let current_treasury: u128 = treasury.get(launch_id);
            treasury.set(launch_id, current_treasury + cost_128);

            // Accumulate creator fee (2%)
            let fee: u128 = cost_128 * CREATOR_FEE_BPS / FEE_DENOMINATOR;
            let current_fees: u128 = creator_fees.get(launch_id);
            creator_fees.set(launch_id, current_fees + fee);

            // Update supply
            supply_sold.set(launch_id, new_supply);

            // Check graduation threshold
            if (new_supply >= GRADUATION_THRESHOLD) {
                graduated.set(launch_id, true);
            }
        });
    }

    // Sell tokens back on the bonding curve.
    // Returns a new LaunchHolding with the remainder.
    fn sell_token(
        holding: LaunchHolding,
        sell_amount: u64,
    ) -> (LaunchHolding, Final) {
        assert(sell_amount > 0u64);
        assert(sell_amount <= holding.amount);

        let remaining: u64 = holding.amount - sell_amount;

        let remainder: LaunchHolding = LaunchHolding {
            owner: self.caller,
            launch_id: holding.launch_id,
            amount: remaining,
        };

        let lid: field = holding.launch_id;
        return (remainder, final {
            let current_supply: u64 = supply_sold.get(lid);
            assert(sell_amount <= current_supply);

            let new_supply: u64 = current_supply - sell_amount;

            // Bonding curve refund: sell_amount * (1 + (current_supply - sell_amount/2) / CURVE_DIVISOR)
            let midpoint: u64 = current_supply - sell_amount / 2u64;
            let refund: u128 = sell_amount as u128 * (1u128 + midpoint as u128 / CURVE_DIVISOR as u128);

            // Ensure treasury has enough to cover refund
            let current_treasury: u128 = treasury.get(lid);
            assert(current_treasury >= refund);
            treasury.set(lid, current_treasury - refund);

            supply_sold.set(lid, new_supply);

            // Graduation is IRREVERSIBLE — once graduated, stays graduated.
            // No un-graduation on sell.
        });
    }

    // Merge two holdings for the same launch into one.
    fn merge_holdings(
        a: LaunchHolding,
        b: LaunchHolding,
    ) -> LaunchHolding {
        assert_eq(a.launch_id, b.launch_id);

        // Overflow guard
        let merged: u64 = a.amount + b.amount;
        assert(merged >= a.amount);

        return LaunchHolding {
            owner: self.caller,
            launch_id: a.launch_id,
            amount: merged,
        };
    }

    // Creator claims accumulated fees. Only the registered creator can call this.
    fn claim_creator_fees(launch_id: field) -> Final {
        let caller: address = self.caller;
        return final {
            let creator: address = launch_creators.get(launch_id);
            assert_eq(creator, caller);

            let claimable: u128 = creator_fees.get(launch_id);
            assert(claimable > 0u128);

            // Reset claimable fees to zero
            creator_fees.set(launch_id, 0u128);

            // Note: actual payout requires cross-program USDCx transfer.
            // Currently records the claim on-chain; off-chain settlement follows.
        };
    }
}
