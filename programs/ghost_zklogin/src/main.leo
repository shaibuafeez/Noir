program ghost_zklogin_v2.aleo {

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

    // Maps a commitment (hash of salt+iss+sub) to the owning Aleo address.
    // Allows on-chain verification that an OAuth identity is linked to an address.
    mapping commitments: field => address;

    // ── Functions ──

    // Register a zkLogin commitment on-chain.
    // The commitment is verified by recomputing the hash from preimage components:
    //   commitment = BHP256::hash_to_field(salt || iss_hash || sub_hash)
    // This proves the caller knows the underlying OAuth identity without revealing it.
    fn register_zklogin(
        salt: field,
        iss_hash: field,
        sub_hash: field,
        timestamp: u64,
    ) -> (ZkLoginCredential, Final) {
        // Recompute the commitment from preimage to prove ownership
        let computed: field = BHP256::hash_to_field(salt + iss_hash + sub_hash);

        let credential: ZkLoginCredential = ZkLoginCredential {
            owner: self.caller,
            commitment: computed,
            issued_at: timestamp,
        };
        let caller: address = self.caller;
        let commitment: field = computed;
        return (credential, final {
            // Write the commitment -> address mapping.
            // If already registered by the same owner, this allows key rotation.
            // New registrations for an existing commitment are allowed (key rotation).
            commitments.set(commitment, caller);
        });
    }

    // Verify that a commitment is registered to the caller and produce a fresh credential.
    // Caller must provide the preimage components to prove they know the identity.
    fn verify_identity(
        salt: field,
        iss_hash: field,
        sub_hash: field,
        timestamp: u64,
    ) -> (ZkLoginCredential, Final) {
        // Recompute commitment from preimage
        let computed: field = BHP256::hash_to_field(salt + iss_hash + sub_hash);

        let credential: ZkLoginCredential = ZkLoginCredential {
            owner: self.caller,
            commitment: computed,
            issued_at: timestamp,
        };
        let caller: address = self.caller;
        let commitment: field = computed;
        return (credential, final {
            // Read the mapping and assert it matches the caller.
            let registered: address = commitments.get(commitment);
            assert_eq(registered, caller);
        });
    }

    // Unregister a commitment. Only the registered owner can remove the link.
    // Caller must provide preimage components to prove knowledge of the identity.
    fn unregister_zklogin(
        salt: field,
        iss_hash: field,
        sub_hash: field,
    ) -> Final {
        let computed: field = BHP256::hash_to_field(salt + iss_hash + sub_hash);
        let caller: address = self.caller;
        let commitment: field = computed;
        return final {
            // Only the registered address can unregister
            let registered: address = commitments.get(commitment);
            assert_eq(registered, caller);

            // Remove the commitment -> address link
            commitments.remove(commitment);
        };
    }
}
