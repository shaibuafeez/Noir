// Tests for ghost_zklogin_v2.aleo commitment logic
// Run with: cd programs/ghost_zklogin && leo test
//
// These tests verify the struct-based BHP256 commitment scheme used for zkLogin.
// The struct prevents field-addition collisions (e.g. salt=5,iss=3,sub=2
// vs salt=3,iss=5,sub=2 now produce different hashes).

program zklogin_test.aleo {

    @noupgrade
    constructor() {}

    struct ZkLoginPreimage {
        salt: field,
        iss_hash: field,
        sub_hash: field,
    }

    // Test: commitment is deterministic — same inputs produce same hash
    @test
    fn test_commitment_deterministic() {
        let p1: ZkLoginPreimage = ZkLoginPreimage { salt: 123field, iss_hash: 456field, sub_hash: 789field };
        let p2: ZkLoginPreimage = ZkLoginPreimage { salt: 123field, iss_hash: 456field, sub_hash: 789field };

        let c1: field = BHP256::hash_to_field(p1);
        let c2: field = BHP256::hash_to_field(p2);
        assert_eq(c1, c2);
    }

    // Test: different inputs produce different commitments
    @test
    fn test_commitment_diff_inputs() {
        let p1: ZkLoginPreimage = ZkLoginPreimage { salt: 1field, iss_hash: 2field, sub_hash: 3field };
        let p2: ZkLoginPreimage = ZkLoginPreimage { salt: 4field, iss_hash: 5field, sub_hash: 6field };

        let c1: field = BHP256::hash_to_field(p1);
        let c2: field = BHP256::hash_to_field(p2);
        assert(c1 != c2);
    }

    // Test: changing only the salt changes the commitment
    @test
    fn test_salt_changes_commitment() {
        let p1: ZkLoginPreimage = ZkLoginPreimage { salt: 1field, iss_hash: 100field, sub_hash: 200field };
        let p2: ZkLoginPreimage = ZkLoginPreimage { salt: 2field, iss_hash: 100field, sub_hash: 200field };

        let c1: field = BHP256::hash_to_field(p1);
        let c2: field = BHP256::hash_to_field(p2);
        assert(c1 != c2);
    }

    // Test: changing only the issuer changes the commitment
    @test
    fn test_issuer_changes_commitment() {
        let p1: ZkLoginPreimage = ZkLoginPreimage { salt: 42field, iss_hash: 100field, sub_hash: 200field };
        let p2: ZkLoginPreimage = ZkLoginPreimage { salt: 42field, iss_hash: 999field, sub_hash: 200field };

        let c1: field = BHP256::hash_to_field(p1);
        let c2: field = BHP256::hash_to_field(p2);
        assert(c1 != c2);
    }

    // Test: changing only the subject changes the commitment
    @test
    fn test_subject_changes_commitment() {
        let p1: ZkLoginPreimage = ZkLoginPreimage { salt: 42field, iss_hash: 100field, sub_hash: 1field };
        let p2: ZkLoginPreimage = ZkLoginPreimage { salt: 42field, iss_hash: 100field, sub_hash: 2field };

        let c1: field = BHP256::hash_to_field(p1);
        let c2: field = BHP256::hash_to_field(p2);
        assert(c1 != c2);
    }

    // Test: commitment is non-zero for non-zero inputs
    @test
    fn test_commitment_nonzero() {
        let p: ZkLoginPreimage = ZkLoginPreimage { salt: 123field, iss_hash: 456field, sub_hash: 789field };
        let c: field = BHP256::hash_to_field(p);
        assert(c != 0field);
    }

    // Test: struct hash prevents field-addition collision
    // With plain addition, (5,3,2) and (3,5,2) sum to 10 and hash the same.
    // With struct hashing, they produce different commitments.
    @test
    fn test_no_field_collision() {
        let p1: ZkLoginPreimage = ZkLoginPreimage { salt: 5field, iss_hash: 3field, sub_hash: 2field };
        let p2: ZkLoginPreimage = ZkLoginPreimage { salt: 3field, iss_hash: 5field, sub_hash: 2field };

        let c1: field = BHP256::hash_to_field(p1);
        let c2: field = BHP256::hash_to_field(p2);
        assert(c1 != c2);
    }
}
