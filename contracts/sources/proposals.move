module nyu_aptos_builder_camp::proposals {
    use std::error;
    use std::signer;
    use aptos_framework::event;
    use aptos_framework::table::{Self, Table};
    use nyu_aptos_builder_camp::governance;

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_EBOARD: u64 = 2;
    const E_ALREADY_VOTED: u64 = 3;
    const E_VOTING_CLOSED: u64 = 4;
    const E_PROPOSAL_NOT_FOUND: u64 = 5;
    const E_ALREADY_FINALIZED: u64 = 6;
    const E_NOT_FINALIZED: u64 = 7;
    const E_NOT_PASSED: u64 = 8;
    const E_ALREADY_EXECUTED: u64 = 9;
    const E_NOT_ELIGIBLE_VOTER: u64 = 10;

    /// Proposal status constants
    const STATUS_DRAFT: u8 = 0;
    const STATUS_ACTIVE: u8 = 1;
    const STATUS_PASSED: u8 = 2;
    const STATUS_REJECTED: u8 = 3;
    const STATUS_EXECUTED: u8 = 4;

    /// Voting weights (same as governance module)
    const SCALE: u64 = 2;
    const EBOARD_WEIGHT: u64 = 2;
    const ADVISOR_WEIGHT: u64 = 3;

    /// Proposal structure
    struct Proposal has store {
        id: u64,
        creator: address,
        title: vector<u8>,
        description: vector<u8>,
        start_ts: u64,
        end_ts: u64,
        status: u8,
        yay_votes: u64,  // Scaled vote weight for "yes"
        nay_votes: u64,  // Scaled vote weight for "no"
        has_voted: Table<address, bool>,
        finalized: bool,
        executed: bool,
    }

    /// Proposals storage
    struct ProposalsStore has key {
        next_proposal_id: u64,
        proposals: Table<u64, Proposal>,
    }

    /// Events
    #[event]
    struct ProposalCreatedEvent has drop, store {
        proposal_id: u64,
        creator: address,
        title: vector<u8>,
        start_ts: u64,
        end_ts: u64,
    }

    #[event]
    struct VoteCastEvent has drop, store {
        proposal_id: u64,
        voter: address,
        vote: bool,  // true = yay, false = nay
        weight: u64,
    }

    #[event]
    struct ProposalFinalizedEvent has drop, store {
        proposal_id: u64,
        status: u8,
        yay_votes: u64,
        nay_votes: u64,
    }

    #[event]
    struct ProposalExecutedEvent has drop, store {
        proposal_id: u64,
    }

    /// Initialize proposals storage
    public entry fun init_proposals(admin: &signer) {
        move_to(admin, ProposalsStore {
            next_proposal_id: 0,
            proposals: table::new<u64, Proposal>(),
        });
    }

    /// Create a new proposal (e-board members only)
    public fun create_proposal(
        creator: &signer,
        title: vector<u8>,
        description: vector<u8>,
        start_ts: u64,
        end_ts: u64,
    ): u64 acquires ProposalsStore {
        let creator_addr = signer::address_of(creator);

        // Verify creator is e-board member
        assert!(governance::is_eboard_member_public(creator_addr), error::permission_denied(E_NOT_EBOARD));
        assert!(end_ts > start_ts, error::invalid_argument(E_VOTING_CLOSED));

        let store = borrow_global_mut<ProposalsStore>(@nyu_aptos_builder_camp);
        let proposal_id = store.next_proposal_id;
        store.next_proposal_id = proposal_id + 1;

        let proposal = Proposal {
            id: proposal_id,
            creator: creator_addr,
            title: *&title,
            description,
            start_ts,
            end_ts,
            status: STATUS_ACTIVE,
            yay_votes: 0,
            nay_votes: 0,
            has_voted: table::new<address, bool>(),
            finalized: false,
            executed: false,
        };

        // Emit event before moving proposal
        event::emit(ProposalCreatedEvent {
            proposal_id,
            creator: creator_addr,
            title,
            start_ts,
            end_ts,
        });

        table::add(&mut store.proposals, proposal_id, proposal);
        proposal_id
    }

    /// Vote on a proposal
    public entry fun vote_on_proposal(
        voter: &signer,
        proposal_id: u64,
        vote: bool,  // true = yay, false = nay
        now_ts: u64,
    ) acquires ProposalsStore {
        let voter_addr = signer::address_of(voter);
        let store = borrow_global_mut<ProposalsStore>(@nyu_aptos_builder_camp);

        assert!(table::contains(&store.proposals, proposal_id), error::not_found(E_PROPOSAL_NOT_FOUND));
        let proposal = table::borrow_mut(&mut store.proposals, proposal_id);

        // Check proposal is active and within voting window
        assert!(!proposal.finalized, error::invalid_state(E_ALREADY_FINALIZED));
        assert!(now_ts >= proposal.start_ts, error::invalid_argument(E_VOTING_CLOSED));
        assert!(now_ts < proposal.end_ts, error::invalid_argument(E_VOTING_CLOSED));

        // Check voter hasn't voted
        if (table::contains(&proposal.has_voted, voter_addr)) {
            assert!(!*table::borrow(&proposal.has_voted, voter_addr), error::invalid_state(E_ALREADY_VOTED));
        };

        // Determine voter weight
        let weight = if (governance::is_advisor(voter_addr)) {
            ADVISOR_WEIGHT
        } else if (governance::is_eboard_member_public(voter_addr)) {
            EBOARD_WEIGHT
        } else {
            abort error::permission_denied(E_NOT_ELIGIBLE_VOTER)
        };

        // Mark as voted
        if (!table::contains(&proposal.has_voted, voter_addr)) {
            table::add(&mut proposal.has_voted, voter_addr, true);
        } else {
            *table::borrow_mut(&mut proposal.has_voted, voter_addr) = true;
        };

        // Add vote weight
        if (vote) {
            proposal.yay_votes = proposal.yay_votes + weight;
        } else {
            proposal.nay_votes = proposal.nay_votes + weight;
        };

        // Emit event
        event::emit(VoteCastEvent {
            proposal_id,
            voter: voter_addr,
            vote,
            weight,
        });
    }

    /// Finalize a proposal (admin only)
    public entry fun finalize_proposal(
        admin: &signer,
        proposal_id: u64,
        now_ts: u64,
    ) acquires ProposalsStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == governance::get_admin(), error::permission_denied(E_NOT_ADMIN));

        let store = borrow_global_mut<ProposalsStore>(@nyu_aptos_builder_camp);
        assert!(table::contains(&store.proposals, proposal_id), error::not_found(E_PROPOSAL_NOT_FOUND));

        let proposal = table::borrow_mut(&mut store.proposals, proposal_id);
        assert!(!proposal.finalized, error::invalid_state(E_ALREADY_FINALIZED));
        assert!(now_ts >= proposal.end_ts, error::invalid_argument(E_VOTING_CLOSED));

        // Determine outcome
        let status = if (proposal.yay_votes > proposal.nay_votes) {
            STATUS_PASSED
        } else {
            STATUS_REJECTED
        };

        proposal.status = status;
        proposal.finalized = true;

        // Emit event
        event::emit(ProposalFinalizedEvent {
            proposal_id,
            status,
            yay_votes: proposal.yay_votes,
            nay_votes: proposal.nay_votes,
        });
    }

    /// Execute a passed proposal (admin only)
    public entry fun execute_proposal(
        admin: &signer,
        proposal_id: u64,
    ) acquires ProposalsStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == governance::get_admin(), error::permission_denied(E_NOT_ADMIN));

        let store = borrow_global_mut<ProposalsStore>(@nyu_aptos_builder_camp);
        assert!(table::contains(&store.proposals, proposal_id), error::not_found(E_PROPOSAL_NOT_FOUND));

        let proposal = table::borrow_mut(&mut store.proposals, proposal_id);
        assert!(proposal.finalized, error::invalid_state(E_NOT_FINALIZED));
        assert!(proposal.status == STATUS_PASSED, error::invalid_state(E_NOT_PASSED));
        assert!(!proposal.executed, error::invalid_state(E_ALREADY_EXECUTED));

        proposal.status = STATUS_EXECUTED;
        proposal.executed = true;

        // Emit event
        event::emit(ProposalExecutedEvent {
            proposal_id,
        });
    }

    /// Public getters
    public fun get_proposal_status(proposal_id: u64): u8 acquires ProposalsStore {
        let store = borrow_global<ProposalsStore>(@nyu_aptos_builder_camp);
        assert!(table::contains(&store.proposals, proposal_id), error::not_found(E_PROPOSAL_NOT_FOUND));
        let proposal = table::borrow(&store.proposals, proposal_id);
        proposal.status
    }

    public fun get_proposal_votes(proposal_id: u64): (u64, u64) acquires ProposalsStore {
        let store = borrow_global<ProposalsStore>(@nyu_aptos_builder_camp);
        assert!(table::contains(&store.proposals, proposal_id), error::not_found(E_PROPOSAL_NOT_FOUND));
        let proposal = table::borrow(&store.proposals, proposal_id);
        (proposal.yay_votes, proposal.nay_votes)
    }

    // ========== Test Helpers ==========
    // Public accessors for error codes and status constants for use in tests

    #[test_only]
    public fun E_NOT_ADMIN(): u64 { E_NOT_ADMIN }
    #[test_only]
    public fun E_NOT_EBOARD(): u64 { E_NOT_EBOARD }
    #[test_only]
    public fun E_ALREADY_VOTED(): u64 { E_ALREADY_VOTED }
    #[test_only]
    public fun E_VOTING_CLOSED(): u64 { E_VOTING_CLOSED }

    #[test_only]
    public fun STATUS_PASSED(): u8 { STATUS_PASSED }
    #[test_only]
    public fun STATUS_REJECTED(): u8 { STATUS_REJECTED }
    #[test_only]
    public fun STATUS_EXECUTED(): u8 { STATUS_EXECUTED }
}
