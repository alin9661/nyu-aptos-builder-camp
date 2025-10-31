#[test_only]
module nyu_aptos_builder_camp::treasury_test {
    use std::signer;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::managed_coin;
    use nyu_aptos_builder_camp::governance;
    use nyu_aptos_builder_camp::treasury;

    const ADMIN: address = @nyu_aptos_builder_camp;
    const ADVISOR: address = @advisor;
    const PRESIDENT: address = @president;
    const VICE: address = @vice;
    const EBOARD1: address = @0xEB01;
    const SPONSOR: address = @0x5B01;
    const MERCH: address = @0xCE01;

    struct FakeCoin has drop {}

    #[test(admin = @nyu_aptos_builder_camp)]
    fun test_init_vault(admin: signer) {
        treasury::init_vault<FakeCoin>(&admin);
        let balance = treasury::get_balance<FakeCoin>();
        assert!(balance == 0, 0);
    }

    #[test(admin = @nyu_aptos_builder_camp, sponsor = @0x5B01)]
    fun test_deposit_sponsor(admin: signer, sponsor: signer) {
        setup_vault(&admin);
        setup_governance(&admin);
        setup_coin(&sponsor);

        // Give sponsor some coins
        let amount = 10000;
        managed_coin::register<FakeCoin>(&sponsor);
        coin::deposit<FakeCoin>(signer::address_of(&sponsor), coin::mint<FakeCoin>(amount, &sponsor));

        treasury::deposit_sponsor<FakeCoin>(&sponsor, amount);

        let balance = treasury::get_balance<FakeCoin>();
        assert!(balance == amount, 1);
    }

    #[test(admin = @nyu_aptos_builder_camp, merch = @0xCE01)]
    fun test_deposit_merch(admin: signer, merch: signer) {
        setup_vault(&admin);
        setup_governance(&admin);
        setup_coin(&merch);

        let amount = 5000;
        managed_coin::register<FakeCoin>(&merch);
        coin::deposit<FakeCoin>(signer::address_of(&merch), coin::mint<FakeCoin>(amount, &merch));

        treasury::deposit_merch<FakeCoin>(&merch, amount);

        let balance = treasury::get_balance<FakeCoin>();
        assert!(balance == amount, 1);
    }

    #[test(admin = @nyu_aptos_builder_camp, eboard1 = @0xEB01)]
    fun test_submit_reimbursement_eboard_only(admin: signer, eboard1: signer) {
        setup_vault(&admin);
        setup_governance(&admin);

        let amount = 1000;
        let invoice_uri = b"https://example.com/invoice.pdf";
        let invoice_hash = b"abc123";

        let id = treasury::submit_reimbursement<FakeCoin>(
            &eboard1,
            amount,
            invoice_uri,
            invoice_hash,
            1000,
        );

        assert!(id == 0, 0);
    }

    #[test(admin = @nyu_aptos_builder_camp, non_eboard = @0x0E01)]
    #[expected_failure(abort_code = treasury::E_NOT_EBOARD)]
    fun test_submit_reimbursement_non_eboard(admin: signer, non_eboard: signer) {
        setup_vault(&admin);
        setup_governance(&admin);

        let amount = 1000;
        let invoice_uri = b"https://example.com/invoice.pdf";
        let invoice_hash = b"abc123";

        // Non-e-board member cannot submit
        treasury::submit_reimbursement<FakeCoin>(
            &non_eboard,
            amount,
            invoice_uri,
            invoice_hash,
            1000,
        );
    }

    #[test(admin = @nyu_aptos_builder_camp, advisor = @advisor, president = @president, vice = @vice, eboard1 = @0xEB01)]
    fun test_approval_requires_all_three(admin: signer, advisor: signer, president: signer, vice: signer, eboard1: signer) {
        setup_vault(&admin);
        setup_governance(&admin);
        setup_coin(&admin);

        // Submit reimbursement
        let amount = 1000;
        let invoice_uri = b"https://example.com/invoice.pdf";
        let invoice_hash = b"abc123";
        let id = treasury::submit_reimbursement<FakeCoin>(&eboard1, amount, invoice_uri, invoice_hash, 1000);

        // Approve by advisor
        treasury::approve_reimbursement<FakeCoin>(&advisor, id);
        let (_, _, approved_advisor, approved_president, approved_vice, paid_out) = treasury::get_request<FakeCoin>(id);
        assert!(approved_advisor == true, 0);
        assert!(approved_president == false, 1);
        assert!(approved_vice == false, 2);
        assert!(paid_out == false, 3);

        // Approve by president
        treasury::approve_reimbursement<FakeCoin>(&president, id);
        let (_, _, approved_advisor, approved_president, approved_vice, paid_out) = treasury::get_request<FakeCoin>(id);
        assert!(approved_advisor == true, 4);
        assert!(approved_president == true, 5);
        assert!(approved_vice == false, 6);

        // Approve by vice
        treasury::approve_reimbursement<FakeCoin>(&vice, id);
        let (_, _, approved_advisor, approved_president, approved_vice, paid_out) = treasury::get_request<FakeCoin>(id);
        assert!(approved_advisor == true, 7);
        assert!(approved_president == true, 8);
        assert!(approved_vice == true, 9);
        assert!(paid_out == false, 10);
    }

    #[test(admin = @nyu_aptos_builder_camp, advisor = @advisor, president = @president, vice = @vice, eboard1 = @0xEB01, executor = @0xEC01)]
    fun test_execute_reimbursement(admin: signer, advisor: signer, president: signer, vice: signer, eboard1: signer, executor: signer) {
        setup_vault(&admin);
        setup_governance(&admin);
        setup_coin(&admin);

        // Deposit funds
        let deposit_amount = 10000;
        managed_coin::register<FakeCoin>(&admin);
        coin::deposit<FakeCoin>(signer::address_of(&admin), coin::mint<FakeCoin>(deposit_amount, &admin));
        treasury::deposit_sponsor<FakeCoin>(&admin, deposit_amount);

        // Submit reimbursement
        let reimbursement_amount = 1000;
        let invoice_uri = b"https://example.com/invoice.pdf";
        let invoice_hash = b"abc123";
        let id = treasury::submit_reimbursement<FakeCoin>(&eboard1, reimbursement_amount, invoice_uri, invoice_hash, 1000);

        // Get initial balance
        let initial_balance = coin::balance<FakeCoin>(signer::address_of(&eboard1));

        // Approve by all three
        treasury::approve_reimbursement<FakeCoin>(&advisor, id);
        treasury::approve_reimbursement<FakeCoin>(&president, id);
        treasury::approve_reimbursement<FakeCoin>(&vice, id);

        // Execute payment
        treasury::execute_reimbursement<FakeCoin>(&executor, id);

        // Verify payment
        let new_balance = coin::balance<FakeCoin>(signer::address_of(&eboard1));
        assert!(new_balance == initial_balance + reimbursement_amount, 0);

        // Verify request marked as paid
        let (_, _, _, _, _, paid_out) = treasury::get_request<FakeCoin>(id);
        assert!(paid_out == true, 1);

        // Verify vault balance decreased
        let vault_balance = treasury::get_balance<FakeCoin>();
        assert!(vault_balance == deposit_amount - reimbursement_amount, 2);
    }

    #[test(admin = @nyu_aptos_builder_camp, advisor = @advisor, president = @president, vice = @vice, eboard1 = @0xEB01, executor = @0xEC01)]
    #[expected_failure(abort_code = treasury::E_INSUFFICIENT_BALANCE)]
    fun test_payout_fails_insufficient_funds(admin: signer, advisor: signer, president: signer, vice: signer, eboard1: signer, executor: signer) {
        setup_vault(&admin);
        setup_governance(&admin);
        setup_coin(&admin);

        // Deposit only 500
        let deposit_amount = 500;
        managed_coin::register<FakeCoin>(&admin);
        coin::deposit<FakeCoin>(signer::address_of(&admin), coin::mint<FakeCoin>(deposit_amount, &admin));
        treasury::deposit_sponsor<FakeCoin>(&admin, deposit_amount);

        // Submit reimbursement for 1000 (more than available)
        let reimbursement_amount = 1000;
        let invoice_uri = b"https://example.com/invoice.pdf";
        let invoice_hash = b"abc123";
        let id = treasury::submit_reimbursement<FakeCoin>(&eboard1, reimbursement_amount, invoice_uri, invoice_hash, 1000);

        // Approve by all three
        treasury::approve_reimbursement<FakeCoin>(&advisor, id);
        treasury::approve_reimbursement<FakeCoin>(&president, id);
        treasury::approve_reimbursement<FakeCoin>(&vice, id);

        // Execution should fail due to insufficient balance
        treasury::execute_reimbursement<FakeCoin>(&executor, id);
    }

    #[test(admin = @nyu_aptos_builder_camp, advisor = @advisor, president = @president, eboard1 = @0xEB01, executor = @0xEC01)]
    #[expected_failure(abort_code = treasury::E_NOT_ALL_APPROVED)]
    fun test_execute_fails_without_all_approvals(admin: signer, advisor: signer, president: signer, eboard1: signer, executor: signer) {
        setup_vault(&admin);
        setup_governance(&admin);
        setup_coin(&admin);

        // Deposit funds
        let deposit_amount = 10000;
        managed_coin::register<FakeCoin>(&admin);
        coin::deposit<FakeCoin>(signer::address_of(&admin), coin::mint<FakeCoin>(deposit_amount, &admin));
        treasury::deposit_sponsor<FakeCoin>(&admin, deposit_amount);

        // Submit reimbursement
        let reimbursement_amount = 1000;
        let invoice_uri = b"https://example.com/invoice.pdf";
        let invoice_hash = b"abc123";
        let id = treasury::submit_reimbursement<FakeCoin>(&eboard1, reimbursement_amount, invoice_uri, invoice_hash, 1000);

        // Only approve by advisor and president (missing vice)
        treasury::approve_reimbursement<FakeCoin>(&advisor, id);
        treasury::approve_reimbursement<FakeCoin>(&president, id);

        // Execution should fail - not all approvals present
        treasury::execute_reimbursement<FakeCoin>(&executor, id);
    }

    #[test(admin = @nyu_aptos_builder_camp, advisor = @advisor, eboard1 = @0xEB01)]
    #[expected_failure(abort_code = treasury::E_ALREADY_APPROVED)]
    fun test_cannot_approve_twice(admin: signer, advisor: signer, eboard1: signer) {
        setup_vault(&admin);
        setup_governance(&admin);

        // Submit reimbursement
        let id = treasury::submit_reimbursement<FakeCoin>(&eboard1, 1000, b"invoice", b"hash", 1000);

        // Approve once
        treasury::approve_reimbursement<FakeCoin>(&advisor, id);

        // Try to approve again - should fail
        treasury::approve_reimbursement<FakeCoin>(&advisor, id);
    }

    #[test(admin = @nyu_aptos_builder_camp)]
    fun test_set_paused(admin: signer) {
        setup_vault(&admin);
        setup_governance(&admin);

        treasury::set_paused<FakeCoin>(&admin, true);
        treasury::set_paused<FakeCoin>(&admin, false);
    }

    // Helper functions
    fun setup_vault(admin: &signer) {
        treasury::init_vault<FakeCoin>(admin);
    }

    fun setup_governance(admin: &signer) {
        let eboard_members = vector::empty<address>();
        vector::push_back(&mut eboard_members, EBOARD1);

        governance::init_roles(
            admin,
            ADVISOR,
            PRESIDENT,
            VICE,
            eboard_members,
        );
    }

    fun setup_coin(account: &signer) {
        managed_coin::initialize<FakeCoin>(
            account,
            b"Fake Coin",
            b"FAKE",
            6,
            false,
        );
    }
}

