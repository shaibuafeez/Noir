program ghost_launchpad_v1.aleo {

    @noupgrade
    constructor() {}

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

            // Max supply = 1,000,000
            let new_supply: u64 = current_supply + amount;
            assert(new_supply <= 1000000u64);

            // Bonding curve cost: amount * (1 + (current_supply + amount/2) / 1000)
            let midpoint: u64 = current_supply + amount / 2u64;
            let cost: u64 = amount * (1u64 + midpoint / 1000u64);
            assert(cost <= max_price);

            // Update supply
            supply_sold.set(launch_id, new_supply);

            // Check graduation threshold: 800,000 tokens sold
            if (new_supply >= 800000u64) {
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
            supply_sold.set(lid, new_supply);

            // Un-graduate if supply drops back below threshold
            if (new_supply < 800000u64) {
                graduated.set(lid, false);
            }
        });
    }

    // Merge two holdings for the same launch into one.
    fn merge_holdings(
        a: LaunchHolding,
        b: LaunchHolding,
    ) -> LaunchHolding {
        assert_eq(a.launch_id, b.launch_id);

        return LaunchHolding {
            owner: self.caller,
            launch_id: a.launch_id,
            amount: a.amount + b.amount,
        };
    }
}
