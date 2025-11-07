#[test_only]
module nyu_aptos_builder_camp::proposals_test {
    use std::vector;
    use nyu_aptos_builder_camp::proposals;
    use nyu_aptos_builder_camp::governance;

    const ADMIN: address = @nyu_aptos_builder_camp;
    const ADVISOR: address = @advisor;
    const PRESIDENT: address = @president;
    const VICE: address = @vice;
    const EBOARD1: address = @0xEB01;
    const EBOARD2: address = @0xEB02;

    #[test(admin = @nyu_aptos_builder_camp)]
    fun test_init_proposals(admin: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);
    }

    #[test(admin = @nyu_aptos_builder_camp, eboard1 = @0xEB01)]
    fun test_create_proposal_eboard_only(admin: signer, eboard1: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);

        let title = b"Increase Membership Dues";
        let description = b"Proposal to increase annual membership dues from $50 to $75";
        let start_ts = 1000;
        let end_ts = 2000;

        let proposal_id = proposals::create_proposal(
            &eboard1,
            title,
            description,
            start_ts,
            end_ts,
        );

        assert!(proposal_id == 0, 0);
    }

    #[test(admin = @nyu_aptos_builder_camp, non_eboard = @0x0E01)]
    #[expected_failure(abort_code = 2, location = nyu_aptos_builder_camp::proposals)]
    fun test_create_proposal_non_eboard_fails(admin: signer, non_eboard: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);

        let title = b"Test Proposal";
        let description = b"This should fail";

        proposals::create_proposal(
            &non_eboard,
            title,
            description,
            1000,
            2000,
        );
    }

    #[test(admin = @nyu_aptos_builder_camp, eboard1 = @0xEB01, advisor = @advisor)]
    fun test_vote_on_proposal(admin: signer, eboard1: signer, advisor: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);

        // Create proposal
        let proposal_id = proposals::create_proposal(
            &eboard1,
            b"Test Proposal",
            b"Description",
            1000,
            2000,
        );

        // Advisor votes yes (weight 3)
        proposals::vote_on_proposal(&advisor, proposal_id, true, 1500);

        // Verify vote was recorded
        let (yay_votes, nay_votes) = proposals::get_proposal_votes(proposal_id);
        assert!(yay_votes == 3, 0); // Advisor weight is 3
        assert!(nay_votes == 0, 1);
    }

    #[test(admin = @nyu_aptos_builder_camp, eboard1 = @0xEB01, eboard2 = @0xEB02)]
    fun test_proposal_passes(admin: signer, eboard1: signer, eboard2: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);

        // Create proposal
        let proposal_id = proposals::create_proposal(
            &eboard1,
            b"Test Proposal",
            b"Description",
            1000,
            2000,
        );

        // Two e-board members vote yes (weight 2 each = 4 total)
        proposals::vote_on_proposal(&eboard1, proposal_id, true, 1500);
        proposals::vote_on_proposal(&eboard2, proposal_id, true, 1501);

        // Finalize proposal
        proposals::finalize_proposal(&admin, proposal_id, 2100);

        // Check status
        let status = proposals::get_proposal_status(proposal_id);
        assert!(status == proposals::STATUS_PASSED(), 0);
    }

    #[test(admin = @nyu_aptos_builder_camp, eboard1 = @0xEB01, eboard2 = @0xEB02)]
    fun test_proposal_rejected(admin: signer, eboard1: signer, eboard2: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);

        // Create proposal
        let proposal_id = proposals::create_proposal(
            &eboard1,
            b"Test Proposal",
            b"Description",
            1000,
            2000,
        );

        // Two e-board members vote no (weight 2 each = 4 total)
        proposals::vote_on_proposal(&eboard1, proposal_id, false, 1500);
        proposals::vote_on_proposal(&eboard2, proposal_id, false, 1501);

        // Finalize proposal
        proposals::finalize_proposal(&admin, proposal_id, 2100);

        // Check status
        let status = proposals::get_proposal_status(proposal_id);
        assert!(status == proposals::STATUS_REJECTED(), 0);
    }

    #[test(admin = @nyu_aptos_builder_camp, eboard1 = @0xEB01, voter = @advisor)]
    #[expected_failure(abort_code = 3, location = nyu_aptos_builder_camp::proposals)]
    fun test_cannot_vote_twice(admin: signer, eboard1: signer, voter: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);

        let proposal_id = proposals::create_proposal(
            &eboard1,
            b"Test Proposal",
            b"Description",
            1000,
            2000,
        );

        // Vote once
        proposals::vote_on_proposal(&voter, proposal_id, true, 1500);

        // Try to vote again - should fail
        proposals::vote_on_proposal(&voter, proposal_id, false, 1501);
    }

    #[test(admin = @nyu_aptos_builder_camp, eboard1 = @0xEB01, voter = @advisor)]
    #[expected_failure(abort_code = 4, location = nyu_aptos_builder_camp::proposals)]
    fun test_cannot_vote_before_start(admin: signer, eboard1: signer, voter: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);

        let proposal_id = proposals::create_proposal(
            &eboard1,
            b"Test Proposal",
            b"Description",
            1000,
            2000,
        );

        // Try to vote before start time
        proposals::vote_on_proposal(&voter, proposal_id, true, 999);
    }

    #[test(admin = @nyu_aptos_builder_camp, eboard1 = @0xEB01, voter = @advisor)]
    #[expected_failure(abort_code = 4, location = nyu_aptos_builder_camp::proposals)]
    fun test_cannot_vote_after_end(admin: signer, eboard1: signer, voter: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);

        let proposal_id = proposals::create_proposal(
            &eboard1,
            b"Test Proposal",
            b"Description",
            1000,
            2000,
        );

        // Try to vote after end time
        proposals::vote_on_proposal(&voter, proposal_id, true, 2000);
    }

    #[test(admin = @nyu_aptos_builder_camp, eboard1 = @0xEB01)]
    fun test_execute_passed_proposal(admin: signer, eboard1: signer) {
        setup_governance(&admin);
        proposals::init_proposals(&admin);

        // Create and pass proposal
        let proposal_id = proposals::create_proposal(
            &eboard1,
            b"Test Proposal",
            b"Description",
            1000,
            2000,
        );

        proposals::vote_on_proposal(&eboard1, proposal_id, true, 1500);
        proposals::finalize_proposal(&admin, proposal_id, 2100);

        // Execute proposal
        proposals::execute_proposal(&admin, proposal_id);

        // Check status
        let status = proposals::get_proposal_status(proposal_id);
        assert!(status == proposals::STATUS_EXECUTED(), 0);
    }

    // Helper functions
    fun setup_governance(admin: &signer) {
        let eboard_members = vector::empty<address>();
        vector::push_back(&mut eboard_members, EBOARD1);
        vector::push_back(&mut eboard_members, EBOARD2);

        governance::init_roles(
            admin,
            ADVISOR,
            PRESIDENT,
            VICE,
            eboard_members,
        );
    }
}
