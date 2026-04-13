// Tests for ghost_zklogin_v2.aleo commitment logic
// Run with: cd programs/ghost_zklogin && leo test
//
// These tests verify the BHP256 commitment scheme used for zkLogin.

program zklogin_test.aleo {

    @noupgrade
    constructor() {}

    // Test: commitment is deterministic — same inputs produce same hash
    @test
    fn test_commitment_deterministic() {
        let salt: field = 123field;
        let iss_hash: field = 456field;
        let sub_hash: field = 789field;

        let c1: field = BHP256::hash_to_field(salt + iss_hash + sub_hash);
        let c2: field = BHP256::hash_to_field(salt + iss_hash + sub_hash);
        assert_eq(c1, c2);
    }

    // Test: different inputs produce different commitments
    @test
    fn test_commitment_diff_inputs() {
        let c1: field = BHP256::hash_to_field(1field + 2field + 3field);
        let c2: field = BHP256::hash_to_field(4field + 5field + 6field);
        assert(c1 != c2);
    }

    // Test: changing only the salt changes the commitment
    @test
    fn test_salt_changes_commitment() {
        let iss_hash: field = 100field;
        let sub_hash: field = 200field;

        let c1: field = BHP256::hash_to_field(1field + iss_hash + sub_hash);
        let c2: field = BHP256::hash_to_field(2field + iss_hash + sub_hash);
        assert(c1 != c2);
    }

    // Test: changing only the issuer changes the commitment
    @test
    fn test_issuer_changes_commitment() {
        let salt: field = 42field;
        let sub_hash: field = 200field;

        let c1: field = BHP256::hash_to_field(salt + 100field + sub_hash);
        let c2: field = BHP256::hash_to_field(salt + 999field + sub_hash);
        assert(c1 != c2);
    }

    // Test: changing only the subject changes the commitment
    @test
    fn test_subject_changes_commitment() {
        let salt: field = 42field;
        let iss_hash: field = 100field;

        let c1: field = BHP256::hash_to_field(salt + iss_hash + 1field);
        let c2: field = BHP256::hash_to_field(salt + iss_hash + 2field);
        assert(c1 != c2);
    }

    // Test: commitment is non-zero for non-zero inputs
    @test
    fn test_commitment_nonzero() {
        let c: field = BHP256::hash_to_field(123field + 456field + 789field);
        assert(c != 0field);
    }
}
