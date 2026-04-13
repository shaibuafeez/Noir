program ghost_zklogin_v1.aleo {

    @noupgrade
    constructor() {}

    // ── Records ──

    // A private credential proving that a zkLogin commitment was registered.
    record ZkLoginCredential {
        owner: address,
        commitment: field,
        issued_at: u64,
    }

    // ── Mappings ──

    // Maps a commitment (hash of iss+sub) to the owning Aleo address.
    // Allows on-chain verification that an OAuth identity is linked to an address.
    mapping commitments: field => address;

    // ── Functions ──

    // Register a zkLogin commitment on-chain.
    // The commitment is a hash of (salt, issuer, subject) computed off-chain.
    // This creates a private credential record and writes the mapping.
    fn register_zklogin(
        commitment: field,
        timestamp: u64,
    ) -> (ZkLoginCredential, Final) {
        let credential: ZkLoginCredential = ZkLoginCredential {
            owner: self.caller,
            commitment,
            issued_at: timestamp,
        };
        let caller: address = self.caller;
        return (credential, final {
            // Write the commitment → address mapping.
            // If already registered, this will overwrite (allows key rotation).
            commitments.set(commitment, caller);
        });
    }

    // Verify that a commitment is registered and produce a fresh credential.
    // This reads the on-chain mapping to confirm the link exists.
    fn verify_identity(
        commitment: field,
        timestamp: u64,
    ) -> (ZkLoginCredential, Final) {
        let credential: ZkLoginCredential = ZkLoginCredential {
            owner: self.caller,
            commitment,
            issued_at: timestamp,
        };
        let caller: address = self.caller;
        return (credential, final {
            // Read the mapping and assert it matches the caller.
            let registered: address = commitments.get(commitment);
            assert_eq(registered, caller);
        });
    }
}
