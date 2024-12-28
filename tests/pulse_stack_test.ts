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
    name: "Can set and get budget",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        
        let block = chain.mineBlock([
            Tx.contractCall("pulse_stack", "set-budget", [
                types.uint(1000)
            ], wallet_1.address)
        ]);
        
        block.receipts[0].result.expectOk();
        
        // Verify budget
        let getBlock = chain.mineBlock([
            Tx.contractCall("pulse_stack", "get-budget", [
                types.principal(wallet_1.address)
            ], wallet_1.address)
        ]);
        
        const budgetData = getBlock.receipts[0].result.expectSome();
        assertEquals(budgetData['monthly-limit'], types.uint(1000));
        assertEquals(budgetData['spent'], types.uint(0));
    }
});

Clarinet.test({
    name: "Can set and track financial goals",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        
        let block = chain.mineBlock([
            Tx.contractCall("pulse_stack", "set-goal", [
                types.uint(5000),
                types.uint(100),
                types.ascii("Emergency Fund")
            ], wallet_1.address)
        ]);
        
        block.receipts[0].result.expectOk();
        
        // Update goal progress
        let updateBlock = chain.mineBlock([
            Tx.contractCall("pulse_stack", "update-goal-progress", [
                types.uint(1000)
            ], wallet_1.address)
        ]);
        
        updateBlock.receipts[0].result.expectOk();
        
        // Verify goal progress
        let getBlock = chain.mineBlock([
            Tx.contractCall("pulse_stack", "get-goal", [
                types.principal(wallet_1.address)
            ], wallet_1.address)
        ]);
        
        const goalData = getBlock.receipts[0].result.expectSome();
        assertEquals(goalData['target'], types.uint(5000));
        assertEquals(goalData['saved'], types.uint(1000));
    }
});