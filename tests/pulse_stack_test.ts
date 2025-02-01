import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can add a new transaction",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        
        let block = chain.mineBlock([
            Tx.contractCall("pulse_stack", "add-transaction", [
                types.int(100),
                types.ascii("groceries"),
                types.ascii("Weekly grocery shopping")
            ], wallet_1.address)
        ]);
        
        block.receipts[0].result.expectOk().expectUint(0);
        
        // Verify transaction details
        let getBlock = chain.mineBlock([
            Tx.contractCall("pulse_stack", "get-transaction", [
                types.uint(0)
            ], wallet_1.address)
        ]);
        
        const txData = getBlock.receipts[0].result.expectSome();
        assertEquals(txData['amount'], types.int(100));
        assertEquals(txData['category'], types.ascii("groceries"));
    }
});

Clarinet.test({
    name: "Can setup and execute recurring transactions",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        
        // Setup recurring transaction
        let block = chain.mineBlock([
            Tx.contractCall("pulse_stack", "setup-recurring-transaction", [
                types.int(500),
                types.ascii("rent"),
                types.ascii("Monthly rent payment"),
                types.uint(30)
            ], wallet_1.address)
        ]);
        
        block.receipts[0].result.expectOk();
        
        // Verify recurring transaction setup
        let getBlock = chain.mineBlock([
            Tx.contractCall("pulse_stack", "get-recurring-transaction", [
                types.principal(wallet_1.address)
            ], wallet_1.address)
        ]);
        
        const recurringData = getBlock.receipts[0].result.expectSome();
        assertEquals(recurringData['amount'], types.int(500));
        assertEquals(recurringData['period'], types.uint(30));
        assertEquals(recurringData['active'], true);
        
        // Mine blocks to trigger recurring transaction
        chain.mineEmptyBlockUntil(35);
        
        // Execute recurring transaction
        let executeBlock = chain.mineBlock([
            Tx.contractCall("pulse_stack", "execute-recurring-transactions", [], wallet_1.address)
        ]);
        
        executeBlock.receipts[0].result.expectOk();
        
        // Verify transaction was created
        let getTx = chain.mineBlock([
            Tx.contractCall("pulse_stack", "get-transaction", [
                types.uint(0)
            ], wallet_1.address)
        ]);
        
        const txData = getTx.receipts[0].result.expectSome();
        assertEquals(txData['amount'], types.int(500));
        assertEquals(txData['category'], types.ascii("rent"));
    }
});

Clarinet.test({
    name: "Can cancel recurring transaction",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        
        // Setup recurring transaction
        let setupBlock = chain.mineBlock([
            Tx.contractCall("pulse_stack", "setup-recurring-transaction", [
                types.int(100),
                types.ascii("subscription"),
                types.ascii("Monthly subscription"),
                types.uint(30)
            ], wallet_1.address)
        ]);
        
        setupBlock.receipts[0].result.expectOk();
        
        // Cancel recurring transaction
        let cancelBlock = chain.mineBlock([
            Tx.contractCall("pulse_stack", "cancel-recurring-transaction", [], wallet_1.address)
        ]);
        
        cancelBlock.receipts[0].result.expectOk();
        
        // Verify cancellation
        let getBlock = chain.mineBlock([
            Tx.contractCall("pulse_stack", "get-recurring-transaction", [
                types.principal(wallet_1.address)
            ], wallet_1.address)
        ]);
        
        const recurringData = getBlock.receipts[0].result.expectSome();
        assertEquals(recurringData['active'], false);
    }
});
