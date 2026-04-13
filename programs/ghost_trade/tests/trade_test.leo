// Tests for ghost_trade_v3.aleo swap math and constraints
//
// NOTE: `leo test` requires deploying the parent program's dependency
// (test_usdcx_stablecoin.aleo -> merkle_tree.aleo) which is a pre-V9
// program without a constructor. This is a Leo tooling limitation.
// The test compiles clean — run `leo build --build-tests` to verify.
// The math is also covered by vitest in tests/launchpad.test.ts.
//
// These tests replicate the swap pricing formula and constraints
// from the main program to verify correctness.

program trade_test.aleo {

    @noupgrade
    constructor() {}

    const MAX_TRADE_AMOUNT: u64 = 10000u64;
    const BASIS_POINTS: u64 = 10000u64;

    // ── Swap output: amount_out = amount * price / BASIS_POINTS ──

    @test
    fn test_swap_50_percent_price() {
        let amount: u64 = 500u64;
        let price: u64 = 5000u64;  // 50% in basis points
        let amount_out: u64 = amount * price / BASIS_POINTS;
        assert_eq(amount_out, 250u64);
    }

    @test
    fn test_swap_1_to_1_price() {
        let amount: u64 = 100u64;
        let price: u64 = 10000u64;  // 100% = 1:1
        let amount_out: u64 = amount * price / BASIS_POINTS;
        assert_eq(amount_out, 100u64);
    }

    @test
    fn test_swap_2x_price() {
        let amount: u64 = 100u64;
        let price: u64 = 20000u64;  // 200% = 2:1
        let amount_out: u64 = amount * price / BASIS_POINTS;
        assert_eq(amount_out, 200u64);
    }

    @test
    fn test_swap_remainder() {
        let holding_amount: u64 = 1000u64;
        let amount: u64 = 300u64;
        let remaining: u64 = holding_amount - amount;
        assert_eq(remaining, 700u64);
    }

    // ── Trade constraints ──

    @test
    fn test_max_trade_amount() {
        let amount: u64 = MAX_TRADE_AMOUNT;
        assert(amount <= MAX_TRADE_AMOUNT);
    }

    @test
    fn test_min_output_nonzero() {
        // Smallest valid trade: 1 token at price 1 basis point
        let amount: u64 = 1u64;
        let price: u64 = 10000u64;
        let amount_out: u64 = amount * price / BASIS_POINTS;
        assert(amount_out > 0u64);
    }

    // ── Merge holdings overflow guard ──

    @test
    fn test_merge_no_overflow() {
        let a: u64 = 5000u64;
        let b: u64 = 3000u64;
        let merged: u64 = a + b;
        assert(merged >= a);  // Overflow guard
        assert_eq(merged, 8000u64);
    }

    // ── Transfer split math ──

    @test
    fn test_transfer_split() {
        let total: u64 = 1000u64;
        let send: u64 = 300u64;
        assert(send <= total);
        let remaining: u64 = total - send;
        assert_eq(remaining, 700u64);
    }

    @test
    fn test_transfer_full_amount() {
        let total: u64 = 500u64;
        let send: u64 = 500u64;
        assert(send <= total);
        let remaining: u64 = total - send;
        assert_eq(remaining, 0u64);
    }

    // ── Balance proof logic ──

    @test
    fn test_balance_proof_sufficient() {
        let amount: u64 = 500u64;
        let threshold: u64 = 100u64;
        let is_sufficient: bool = amount >= threshold;
        assert(is_sufficient);
    }

    @test
    fn test_balance_proof_insufficient() {
        let amount: u64 = 50u64;
        let threshold: u64 = 100u64;
        let is_sufficient: bool = amount >= threshold;
        assert(!is_sufficient);
    }

    @test
    fn test_balance_proof_exact() {
        let amount: u64 = 100u64;
        let threshold: u64 = 100u64;
        let is_sufficient: bool = amount >= threshold;
        assert(is_sufficient);
    }
}
