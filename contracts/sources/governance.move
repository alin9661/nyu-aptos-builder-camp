module nyu_aptos_builder_camp::governance {
    use std::error;
    use std::option;
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::table::{Self, Table};

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_EBOARD: u64 = 2;
    const E_CANDIDATE_CANNOT_VOTE: u64 = 3;
    const E_ALREADY_VOTED: u64 = 4;
    const E_VOTING_CLOSED: u64 = 5;
    const E_INVALID_CANDIDATE: u64 = 6;
    const E_ELECTION_NOT_FOUND: u64 = 7;
    const E_ALREADY_FINALIZED: u64 = 8;
    const E_TIE_NEEDS_RUNOFF: u64 = 9;
    const E_NOT_ELIGIBLE_VOTER: u64 = 10;

    /// Weight scale factor: using SCALE = 2 means
    /// e-board member weight = 2 (represents 1.0)
    /// advisor weight = 3 (represents 1.5)
    const SCALE: u64 = 2;
    const EBOARD_WEIGHT: u64 = 2;
    const ADVISOR_WEIGHT: u64 = 3;

    /// Main roles resource storing admin and e-board configuration
    struct Roles has key {
        admin: address,
        advisor: address,
        president: address,
        vice_president: address,
        eboard_members: vector<address>,
    }

    /// Election resource keyed by role_name and election_id
    /// Allows multiple elections per role over time
    /// Note: Current implementation supports one active election at a time.
    /// For concurrent elections, extend to use Table<election_key, Election> storage.
    struct Election has key {
        role_name: vector<u8>,
        election_id: u64,
        candidates: vector<address>,
        start_ts: u64,
        end_ts: u64,
        /// Track who pitched (candidates cannot vote)
        pitched: Table<address, bool>,
        /// Track who has already voted
        has_voted: Table<address, bool>,
        /// Accumulated scaled vote weights per candidate
        tallies_scaled: Table<address, u64>,
        finalized: bool,
        winner: option::Option<address>,
    }

    /// Event emitted when a candidate is added to an election
    #[event]
    struct CandidateAddedEvent has drop, store {
        role_name: vector<u8>,
        election_id: u64,
        candidate: address,
    }

    /// Event emitted when a vote is cast
    #[event]
    struct VoteCastEvent has drop, store {
        role_name: vector<u8>,
        election_id: u64,
        voter: address,
        candidate: address,
        weight: u64,
    }

    /// Event emitted when an election is finalized
    #[event]
    struct ElectionFinalizedEvent has drop, store {
        role_name: vector<u8>,
        election_id: u64,
        winner: option::Option<address>,
        is_tie: bool,
    }

    /// Initialize roles and events. Called once by admin.
    public entry fun init_roles(
        admin: &signer,
        advisor_addr: address,
        president_addr: address,
        vice_president_addr: address,
        eboard_members: vector<address>,
    ) {
        let admin_addr = signer::address_of(admin);
        move_to(admin, Roles {
            admin: admin_addr,
            advisor: advisor_addr,
            president: president_addr,
            vice_president: vice_president_addr,
            eboard_members,
        });
    }

    /// Admin-only: Update roles configuration
    public entry fun set_roles(
        admin: &signer,
        advisor_addr: address,
        president_addr: address,
        vice_president_addr: address,
    ) acquires Roles {
        let roles = borrow_global_mut<Roles>(@nyu_aptos_builder_camp);
        assert!(signer::address_of(admin) == roles.admin, error::permission_denied(E_NOT_ADMIN));
        roles.advisor = advisor_addr;
        roles.president = president_addr;
        roles.vice_president = vice_president_addr;
    }

    /// Admin-only: Update e-board members list
    public entry fun set_eboard_members(
        admin: &signer,
        eboard_members: vector<address>,
    ) acquires Roles {
        let roles = borrow_global_mut<Roles>(@nyu_aptos_builder_camp);
        assert!(signer::address_of(admin) == roles.admin, error::permission_denied(E_NOT_ADMIN));
        roles.eboard_members = eboard_members;
    }

    /// Admin-only: Start a new election
    public entry fun start_election(
        admin: &signer,
        role_name: vector<u8>,
        election_id: u64,
        start_ts: u64,
        end_ts: u64,
    ) acquires Roles {
        let admin_addr = signer::address_of(admin);
        let roles = borrow_global<Roles>(@nyu_aptos_builder_camp);
        assert!(admin_addr == roles.admin, error::permission_denied(E_NOT_ADMIN));
        assert!(end_ts > start_ts, error::invalid_argument(E_VOTING_CLOSED));

        move_to(admin, Election {
            role_name,
            election_id,
            candidates: vector::empty<address>(),
            start_ts,
            end_ts,
            pitched: table::new<address, bool>(),
            has_voted: table::new<address, bool>(),
            tallies_scaled: table::new<address, u64>(),
            finalized: false,
            winner: option::none<address>(),
        });
    }

    /// Helper to get election key from role_name and election_id
    fun get_election_key(role_name: vector<u8>, election_id: u64): vector<u8> {
        let key = role_name;
        vector::append(&mut key, b"|");
        let id_bytes = std::bcs::to_bytes(&election_id);
        vector::append(&mut key, id_bytes);
        key
    }

    /// Admin-only: Add a candidate to an election
    public entry fun add_candidate(
        admin: &signer,
        role_name: vector<u8>,
        election_id: u64,
        candidate: address,
    ) acquires Roles, Election {
        let admin_addr = signer::address_of(admin);
        let roles = borrow_global<Roles>(@nyu_aptos_builder_camp);
        assert!(admin_addr == roles.admin, error::permission_denied(E_NOT_ADMIN));

        let election = borrow_global_mut<Election>(@nyu_aptos_builder_camp);
        assert!(!election.finalized, error::invalid_state(E_ALREADY_FINALIZED));

        // Mark candidate as pitched (they cannot vote)
        if (!table::contains(&election.pitched, candidate)) {
            table::add(&mut election.pitched, candidate, true);
            vector::push_back(&mut election.candidates, candidate);

            // Emit event
            event::emit(CandidateAddedEvent {
                role_name,
                election_id,
                candidate,
            });
        };
    }

    /// Cast a vote in an election
    /// Voter must be advisor or e-board member, and must not be a candidate
    public entry fun cast_vote(
        voter: &signer,
        role_name: vector<u8>,
        election_id: u64,
        candidate: address,
        now_ts: u64,
    ) acquires Roles, Election {
        let voter_addr = signer::address_of(voter);
        let roles = borrow_global<Roles>(@nyu_aptos_builder_camp);
        let election = borrow_global_mut<Election>(@nyu_aptos_builder_camp);

        // Check election exists and is active
        assert!(!election.finalized, error::invalid_state(E_ALREADY_FINALIZED));
        assert!(now_ts >= election.start_ts, error::invalid_argument(E_VOTING_CLOSED));
        assert!(now_ts < election.end_ts, error::invalid_argument(E_VOTING_CLOSED));

        // Check voter hasn't voted
        if (table::contains(&election.has_voted, voter_addr)) {
            assert!(!*table::borrow(&election.has_voted, voter_addr), error::invalid_state(E_ALREADY_VOTED));
        };

        // Check voter is not a candidate
        if (table::contains(&election.pitched, voter_addr)) {
            assert!(!*table::borrow(&election.pitched, voter_addr), error::permission_denied(E_CANDIDATE_CANNOT_VOTE));
        };

        // Check candidate is valid
        let valid_candidate = vector::contains(&election.candidates, &candidate);
        assert!(valid_candidate, error::invalid_argument(E_INVALID_CANDIDATE));

        // Determine voter weight
        let weight = if (voter_addr == roles.advisor) {
            ADVISOR_WEIGHT
        } else if (is_eboard_member(roles, voter_addr)) {
            EBOARD_WEIGHT
        } else {
            abort error::permission_denied(E_NOT_ELIGIBLE_VOTER)
        };

        // Mark as voted
        if (!table::contains(&election.has_voted, voter_addr)) {
            table::add(&mut election.has_voted, voter_addr, true);
        } else {
            *table::borrow_mut(&mut election.has_voted, voter_addr) = true;
        };

        // Add vote weight to candidate's tally
        if (!table::contains(&election.tallies_scaled, candidate)) {
            table::add(&mut election.tallies_scaled, candidate, weight);
        } else {
            let current = table::borrow_mut(&mut election.tallies_scaled, candidate);
            *current = *current + weight;
        };

        // Emit event
        event::emit(VoteCastEvent {
            role_name,
            election_id,
            voter: voter_addr,
            candidate,
            weight,
        });
    }

    /// Helper: Check if address is in e-board members list
    fun is_eboard_member(roles: &Roles, addr: address): bool {
        vector::contains(&roles.eboard_members, &addr)
    }

    /// Admin-only: Finalize an election and determine winner
    public entry fun finalize_election(
        admin: &signer,
        role_name: vector<u8>,
        election_id: u64,
        now_ts: u64,
    ) acquires Roles, Election {
        let admin_addr = signer::address_of(admin);
        let roles = borrow_global<Roles>(@nyu_aptos_builder_camp);
        assert!(admin_addr == roles.admin, error::permission_denied(E_NOT_ADMIN));

        let election = borrow_global_mut<Election>(@nyu_aptos_builder_camp);
        assert!(!election.finalized, error::invalid_state(E_ALREADY_FINALIZED));
        assert!(now_ts >= election.end_ts, error::invalid_argument(E_VOTING_CLOSED));

        // Find candidate with highest tally
        let max_tally = 0u64;
        let winner_addr = option::none<address>();
        let is_tie = false;
        let len = vector::length(&election.candidates);

        let i = 0;
        while (i < len) {
            let candidate = *vector::borrow(&election.candidates, i);
            let tally = if (table::contains(&election.tallies_scaled, candidate)) {
                *table::borrow(&election.tallies_scaled, candidate)
            } else {
                0u64
            };

            if (tally > max_tally) {
                max_tally = tally;
                winner_addr = option::some(candidate);
                is_tie = false;
            } else if (tally == max_tally && option::is_some(&winner_addr)) {
                // Tie detected: if another candidate has same tally, it's a tie
                if (tally > 0) {
                    is_tie = true;
                }
            };

            i = i + 1;
        };

        // If tie, don't set winner (requires run-off)
        if (is_tie) {
            election.winner = option::none<address>();
        } else {
            election.winner = winner_addr;
        };

        election.finalized = true;

        // Emit event
        event::emit(ElectionFinalizedEvent {
            role_name,
            election_id,
            winner: election.winner,
            is_tie,
        });
    }

    /// Public getter: Get winner of an election
    public fun get_winner(
        role_name: vector<u8>,
        election_id: u64,
    ): option::Option<address> acquires Election {
        let election = borrow_global<Election>(@nyu_aptos_builder_camp);
        assert!(election.finalized, error::invalid_state(E_ALREADY_FINALIZED));
        election.winner
    }

    /// Public getter: Read-only access to Roles for cross-module access
    /// Treasury module will use this to check role memberships
    /// Helper: Check if address is advisor
    public fun is_advisor(addr: address): bool acquires Roles {
        let roles = borrow_global<Roles>(@nyu_aptos_builder_camp);
        addr == roles.advisor
    }

    /// Helper: Check if address is president
    public fun is_president(addr: address): bool acquires Roles {
        let roles = borrow_global<Roles>(@nyu_aptos_builder_camp);
        addr == roles.president
    }

    /// Helper: Check if address is vice president
    public fun is_vice_president(addr: address): bool acquires Roles {
        let roles = borrow_global<Roles>(@nyu_aptos_builder_camp);
        addr == roles.vice_president
    }

    /// Helper: Check if address is in e-board members
    public fun is_eboard_member_public(addr: address): bool acquires Roles {
        let roles = borrow_global<Roles>(@nyu_aptos_builder_camp);
        is_eboard_member(roles, addr)
    }

    /// Helper: Get admin address
    public fun get_admin(): address acquires Roles {
        let roles = borrow_global<Roles>(@nyu_aptos_builder_camp);
        roles.admin
    }
}