program ghost_zklogin_v2.aleo {

    @noupgrade
    constructor() {}

    // ── Structs ──

    // Preimage for the zkLogin commitment hash.
    // Using a struct prevents field-addition collisions where
    // (salt=5, iss=3, sub=2) would equal (salt=3, iss=5, sub=2).
    struct ZkLoginPreimage {
        salt: field,
        iss_hash: field,
        sub_hash: field,
    }

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
    // The commitment is verified by recomputing the hash from a struct preimage:
    //   commitment = BHP256::hash_to_field(ZkLoginPreimage { salt, iss_hash, sub_hash })
    // This proves the caller knows the underlying OAuth identity without revealing it.
    fn register_zklogin(
        salt: field,
        iss_hash: field,
        sub_hash: field,
        timestamp: u64,
    ) -> (ZkLoginCredential, Final) {
        // Recompute the commitment from struct preimage to prove ownership
        let preimage: ZkLoginPreimage = ZkLoginPreimage { salt, iss_hash, sub_hash };
        let computed: field = BHP256::hash_to_field(preimage);

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
        // Recompute commitment from struct preimage
        let preimage: ZkLoginPreimage = ZkLoginPreimage { salt, iss_hash, sub_hash };
        let computed: field = BHP256::hash_to_field(preimage);

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
        let preimage: ZkLoginPreimage = ZkLoginPreimage { salt, iss_hash, sub_hash };
        let computed: field = BHP256::hash_to_field(preimage);
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
