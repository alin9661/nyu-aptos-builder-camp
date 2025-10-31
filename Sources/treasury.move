module nyu_aptos_builder_camp::treasury {
    use std::error;
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;
    use aptos_framework::table::{Self, Table};
    use nyu_aptos_builder_camp::governance;

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_EBOARD: u64 = 2;
    const E_REQUEST_NOT_FOUND: u64 = 3;
    const E_ALREADY_PAID: u64 = 4;
    const E_NOT_ALL_APPROVED: u64 = 5;
    const E_INSUFFICIENT_BALANCE: u64 = 6;
    const E_NOT_ROLE: u64 = 7;
    const E_ALREADY_APPROVED: u64 = 8;
    const E_PAUSED: u64 = 9;

    /// Reimbursement request structure
    struct ReimbursementRequest<phantom CoinType> has drop, store {
        id: u64,
        payee: address,
        amount: u64,
        invoice_uri: vector<u8>,
        invoice_hash: vector<u8>,
        created_ts: u64,
        approved_advisor: bool,
        approved_president: bool,
        approved_vice: bool,
        paid_out: bool,
    }

    /// Vault resource holding the coin balance
    struct Vault<phantom CoinType> has key {
        /// The coin balance stored in this module account
        balance: Coin<CoinType>,
    }

    /// Treasury state tracking reimbursement requests
    struct Treasury<phantom CoinType> has key {
        next_req_id: u64,
        requests: Table<u64, ReimbursementRequest<CoinType>>,
        paused: bool,
    }

    #[event]
    /// Event emitted when funds are deposited (sponsor or merch)
    struct DepositReceivedEvent has drop, store {
        source: vector<u8>, // "SPONSOR" or "MERCH"
        amount: u64,
        total_balance: u64,
    }

    #[event]
    /// Event emitted when a reimbursement request is submitted
    struct ReimbursementSubmittedEvent has drop, store {
        id: u64,
        payee: address,
        amount: u64,
        invoice_uri: vector<u8>,
    }

    #[event]
    /// Event emitted when a reimbursement request is approved
    struct ReimbursementApprovedEvent has drop, store {
        id: u64,
        approver: address,
        role: vector<u8>, // "ADVISOR", "PRESIDENT", "VICE"
    }

    #[event]
    /// Event emitted when a reimbursement is paid out
    struct ReimbursementPaidEvent has drop, store {
        id: u64,
        payee: address,
        amount: u64,
    }

    /// Initialize vault and treasury. Called once by module account.
    public entry fun init_vault<CoinType>(
        account: &signer,
    ) {
        let account_addr = signer::address_of(account);
        move_to(account, Vault<CoinType> {
            balance: coin::zero<CoinType>(),
        });
        move_to(account, Treasury<CoinType> {
            next_req_id: 0,
            requests: table::new<u64, ReimbursementRequest<CoinType>>(),
            paused: false,
        });
    }

    /// Register coin type for tests (caller must have CoinStore)
    public entry fun register_coin<CoinType>(
        account: &signer,
    ) {
        coin::register<CoinType>(account);
    }

    /// Deposit funds from sponsor
    public entry fun deposit_sponsor<CoinType>(
        from: &signer,
        amount: u64,
    ) acquires Vault, Treasury {
        let treasury = borrow_global<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        assert!(!treasury.paused, error::invalid_state(E_PAUSED));

        let coin_to_deposit = coin::withdraw<CoinType>(from, amount);
        let vault = borrow_global_mut<Vault<CoinType>>(@nyu_aptos_builder_camp);
        coin::merge(&mut vault.balance, coin_to_deposit);

        let total = coin::value<CoinType>(&vault.balance);

        // Emit event
        event::emit(DepositReceivedEvent {
            source: b"SPONSOR",
            amount,
            total_balance: total,
        });
    }

    /// Deposit funds from merch revenue
    public entry fun deposit_merch<CoinType>(
        from: &signer,
        amount: u64,
    ) acquires Vault, Treasury {
        let treasury = borrow_global<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        assert!(!treasury.paused, error::invalid_state(E_PAUSED));

        let coin_to_deposit = coin::withdraw<CoinType>(from, amount);
        let vault = borrow_global_mut<Vault<CoinType>>(@nyu_aptos_builder_camp);
        coin::merge(&mut vault.balance, coin_to_deposit);

        let total = coin::value<CoinType>(&vault.balance);

        // Emit event
        event::emit(DepositReceivedEvent {
            source: b"MERCH",
            amount,
            total_balance: total,
        });
    }

    /// Submit a reimbursement request (e-board members only)
    public entry fun submit_reimbursement<CoinType>(
        payee: &signer,
        amount: u64,
        invoice_uri: vector<u8>,
        invoice_hash: vector<u8>,
        now_ts: u64,
    ) acquires Treasury {
        let payee_addr = signer::address_of(payee);
        let treasury = borrow_global<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        assert!(!treasury.paused, error::invalid_state(E_PAUSED));

        // Check payee is e-board member
        assert!(governance::is_eboard_member_public(payee_addr), error::permission_denied(E_NOT_EBOARD));

        let treasury_mut = borrow_global_mut<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        let id = treasury_mut.next_req_id;
        treasury_mut.next_req_id = id + 1;

        let request = ReimbursementRequest<CoinType> {
            id,
            payee: payee_addr,
            amount,
            invoice_uri,
            invoice_hash,
            created_ts: now_ts,
            approved_advisor: false,
            approved_president: false,
            approved_vice: false,
            paid_out: false,
        };

        // Copy invoice_uri before moving request
        let invoice_uri_copy = *&request.invoice_uri;

        table::add(&mut treasury_mut.requests, id, request);

        // Emit event
        event::emit(ReimbursementSubmittedEvent {
            id,
            payee: payee_addr,
            amount,
            invoice_uri: invoice_uri_copy,
        });
    }

    /// Approve a reimbursement request (advisor, president, or vice only)
    public entry fun approve_reimbursement<CoinType>(
        approver: &signer,
        id: u64,
    ) acquires Treasury {
        let approver_addr = signer::address_of(approver);
        let treasury = borrow_global<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        assert!(!treasury.paused, error::invalid_state(E_PAUSED));
        assert!(table::contains(&treasury.requests, id), error::not_found(E_REQUEST_NOT_FOUND));

        let treasury_mut = borrow_global_mut<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        let request = table::borrow_mut(&mut treasury_mut.requests, id);

        assert!(!request.paid_out, error::invalid_state(E_ALREADY_PAID));

        let role: vector<u8>;

        if (governance::is_advisor(approver_addr)) {
            assert!(!request.approved_advisor, error::invalid_state(E_ALREADY_APPROVED));
            request.approved_advisor = true;
            role = b"ADVISOR";
        } else if (governance::is_president(approver_addr)) {
            assert!(!request.approved_president, error::invalid_state(E_ALREADY_APPROVED));
            request.approved_president = true;
            role = b"PRESIDENT";
        } else if (governance::is_vice_president(approver_addr)) {
            assert!(!request.approved_vice, error::invalid_state(E_ALREADY_APPROVED));
            request.approved_vice = true;
            role = b"VICE";
        } else {
            abort error::permission_denied(E_NOT_ROLE)
        };

        // Emit event
        event::emit(ReimbursementApprovedEvent {
            id,
            approver: approver_addr,
            role,
        });
    }

    /// Execute reimbursement payment (anyone can call, but enforces all approvals)
    public entry fun execute_reimbursement<CoinType>(
        executor: &signer,
        id: u64,
    ) acquires Vault, Treasury {
        let treasury = borrow_global<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        assert!(!treasury.paused, error::invalid_state(E_PAUSED));
        assert!(table::contains(&treasury.requests, id), error::not_found(E_REQUEST_NOT_FOUND));

        let treasury_mut = borrow_global_mut<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        let request = table::borrow_mut(&mut treasury_mut.requests, id);

        assert!(!request.paid_out, error::invalid_state(E_ALREADY_PAID));
        assert!(request.approved_advisor, error::permission_denied(E_NOT_ALL_APPROVED));
        assert!(request.approved_president, error::permission_denied(E_NOT_ALL_APPROVED));
        assert!(request.approved_vice, error::permission_denied(E_NOT_ALL_APPROVED));

        let vault = borrow_global_mut<Vault<CoinType>>(@nyu_aptos_builder_camp);
        let balance = coin::value<CoinType>(&vault.balance);
        assert!(balance >= request.amount, error::invalid_argument(E_INSUFFICIENT_BALANCE));

        // Transfer funds to payee
        let payment = coin::extract<CoinType>(&mut vault.balance, request.amount);
        coin::deposit(request.payee, payment);

        request.paid_out = true;

        // Emit event
        event::emit(ReimbursementPaidEvent {
            id,
            payee: request.payee,
            amount: request.amount,
        });
    }

    /// Admin-only: Cancel a reimbursement request (if not paid)
    public entry fun cancel_reimbursement<CoinType>(
        admin: &signer,
        id: u64,
    ) acquires Treasury {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == governance::get_admin(), error::permission_denied(E_NOT_ADMIN));

        let treasury = borrow_global<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        assert!(table::contains(&treasury.requests, id), error::not_found(E_REQUEST_NOT_FOUND));

        let treasury_mut = borrow_global_mut<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        let request = table::borrow_mut(&mut treasury_mut.requests, id);
        assert!(!request.paid_out, error::invalid_state(E_ALREADY_PAID));

        // Remove request (in practice, we'd mark as cancelled, but for simplicity we remove)
        // Note: Table doesn't support removal easily, so we mark as paid to prevent execution
        // In production, add a 'cancelled' flag field
        request.paid_out = true;
    }

    /// Admin-only: Pause/unpause treasury operations
    public entry fun set_paused<CoinType>(
        admin: &signer,
        paused: bool,
    ) acquires Treasury {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == governance::get_admin(), error::permission_denied(E_NOT_ADMIN));

        let treasury = borrow_global_mut<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        treasury.paused = paused;
    }

    /// Public getter: Get vault balance
    public fun get_balance<CoinType>(): u64 acquires Vault {
        let vault = borrow_global<Vault<CoinType>>(@nyu_aptos_builder_camp);
        coin::value<CoinType>(&vault.balance)
    }

    /// Public getter: Get reimbursement request details
    public fun get_request<CoinType>(
        id: u64,
    ): (address, u64, bool, bool, bool, bool) acquires Treasury {
        let treasury = borrow_global<Treasury<CoinType>>(@nyu_aptos_builder_camp);
        assert!(table::contains(&treasury.requests, id), error::not_found(E_REQUEST_NOT_FOUND));
        let request = table::borrow(&treasury.requests, id);
        (
            request.payee,
            request.amount,
            request.approved_advisor,
            request.approved_president,
            request.approved_vice,
            request.paid_out,
        )
    }
}