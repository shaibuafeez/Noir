// Tests for ghost_launchpad_v2.aleo bonding curve math
// Run with: cd programs/ghost_launchpad && leo test
//
// These tests replicate the bonding curve formulas from the main program
// to verify correctness of the pricing, graduation, and fee logic.

program launchpad_test.aleo {

    @noupgrade
    constructor() {}

    const MAX_SUPPLY: u64 = 1000000u64;
    const GRADUATION_THRESHOLD: u64 = 800000u64;
    const CURVE_DIVISOR: u64 = 1000u64;
    const CREATOR_FEE_BPS: u128 = 200u128;
    const FEE_DENOMINATOR: u128 = 10000u128;

    // ── Bonding curve price: price = 1 + supply / CURVE_DIVISOR ──

    @test
    fn test_price_at_zero_supply() {
        let supply: u64 = 0u64;
        let price: u64 = 1u64 + supply / CURVE_DIVISOR;
        assert_eq(price, 1u64);
    }

    @test
    fn test_price_at_1000_supply() {
        let supply: u64 = 1000u64;
        let price: u64 = 1u64 + supply / CURVE_DIVISOR;
        assert_eq(price, 2u64);
    }

    @test
    fn test_price_at_500k_supply() {
        let supply: u64 = 500000u64;
        let price: u64 = 1u64 + supply / CURVE_DIVISOR;
        assert_eq(price, 501u64);
    }

    @test
    fn test_price_at_graduation() {
        let supply: u64 = GRADUATION_THRESHOLD;
        let price: u64 = 1u64 + supply / CURVE_DIVISOR;
        assert_eq(price, 801u64);
    }

    @test
    fn test_price_at_max_supply() {
        let supply: u64 = MAX_SUPPLY;
        let price: u64 = 1u64 + supply / CURVE_DIVISOR;
        assert_eq(price, 1001u64);
    }

    // ── Buy cost: amount * (1 + midpoint / CURVE_DIVISOR) ──

    @test
    fn test_buy_cost_from_zero() {
        let current_supply: u64 = 0u64;
        let amount: u64 = 1000u64;
        let midpoint: u64 = current_supply + amount / 2u64;
        let cost: u64 = amount * (1u64 + midpoint / CURVE_DIVISOR);
        // midpoint = 500, cost = 1000 * (1 + 0) = 1000 (integer division: 500/1000 = 0)
        assert_eq(cost, 1000u64);
    }

    @test
    fn test_buy_cost_at_high_supply() {
        let current_supply: u64 = 500000u64;
        let amount: u64 = 1000u64;
        let midpoint: u64 = current_supply + amount / 2u64;
        let cost: u64 = amount * (1u64 + midpoint / CURVE_DIVISOR);
        // midpoint = 500500, cost = 1000 * (1 + 500) = 501000
        assert_eq(cost, 501000u64);
    }

    // ── Sell refund: sell_amount * (1 + midpoint / CURVE_DIVISOR) ──

    @test
    fn test_sell_refund() {
        let current_supply: u64 = 10000u64;
        let sell_amount: u64 = 1000u64;
        let midpoint: u64 = current_supply - sell_amount / 2u64;
        let refund: u128 = sell_amount as u128 * (1u128 + midpoint as u128 / CURVE_DIVISOR as u128);
        // midpoint = 9500, refund = 1000 * (1 + 9) = 10000
        assert_eq(refund, 10000u128);
    }

    // ── Supply constraints ──

    @test
    fn test_supply_within_max() {
        let current_supply: u64 = 999000u64;
        let amount: u64 = 1000u64;
        let new_supply: u64 = current_supply + amount;
        assert(new_supply <= MAX_SUPPLY);
    }

    @test
    fn test_graduation_triggers() {
        let new_supply: u64 = 800000u64;
        assert(new_supply >= GRADUATION_THRESHOLD);
    }

    @test
    fn test_below_graduation() {
        let new_supply: u64 = 799999u64;
        assert(new_supply < GRADUATION_THRESHOLD);
    }

    // ── Creator fee calculation ──

    @test
    fn test_creator_fee_2_percent() {
        let cost: u128 = 10000u128;
        let fee: u128 = cost * CREATOR_FEE_BPS / FEE_DENOMINATOR;
        // 10000 * 200 / 10000 = 200
        assert_eq(fee, 200u128);
    }

    @test
    fn test_creator_fee_small_cost() {
        let cost: u128 = 100u128;
        let fee: u128 = cost * CREATOR_FEE_BPS / FEE_DENOMINATOR;
        // 100 * 200 / 10000 = 2
        assert_eq(fee, 2u128);
    }

    // ── Treasury accounting ──

    @test
    fn test_treasury_accumulates() {
        let current_treasury: u128 = 5000u128;
        let cost: u128 = 1000u128;
        let new_treasury: u128 = current_treasury + cost;
        assert_eq(new_treasury, 6000u128);
    }

    @test
    fn test_treasury_covers_refund() {
        let current_treasury: u128 = 5000u128;
        let refund: u128 = 3000u128;
        assert(current_treasury >= refund);
        let new_treasury: u128 = current_treasury - refund;
        assert_eq(new_treasury, 2000u128);
    }
}
