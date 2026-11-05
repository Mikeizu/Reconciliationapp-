import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDateOrdering,
  sortTransactions,
  detectKinprePosTransaction,
  reconcileStatements,
  normalizeDate,
  Transaction,
} from './reconciliation';

test('normalizeDate parses standard formats correctly', () => {
  assert.equal(normalizeDate('2024-10-25').iso, '2024-10-25');
  assert.equal(normalizeDate('25/10/2024').iso, '2024-10-25');
  assert.equal(normalizeDate('24-OCT-2024').iso, '2024-10-24');
  assert.equal(normalizeDate('05-Oct-2024').iso, '2024-10-05');
});

test('detectDateOrdering correctly detects descending and ascending order', () => {
  const descendingTxs: Transaction[] = [
    { id: '1', source: 'bank', rawDate: '2024-10-31', date: '2024-10-31', description: 'A', debit: 0, credit: 100, amount: 100, isKinprePos: false },
    { id: '2', source: 'bank', rawDate: '2024-10-25', date: '2024-10-25', description: 'B', debit: 50, credit: 0, amount: -50, isKinprePos: false },
    { id: '3', source: 'bank', rawDate: '2024-10-10', date: '2024-10-10', description: 'C', debit: 0, credit: 200, amount: 200, isKinprePos: false },
    { id: '4', source: 'bank', rawDate: '2024-10-02', date: '2024-10-02', description: 'D', debit: 20, credit: 0, amount: -20, isKinprePos: false },
  ];

  const ascendingTxs: Transaction[] = [
    { id: '10', source: 'sage', rawDate: '2024-10-02', date: '2024-10-02', description: 'D', debit: 20, credit: 0, amount: -20, isKinprePos: false },
    { id: '11', source: 'sage', rawDate: '2024-10-10', date: '2024-10-10', description: 'C', debit: 0, credit: 200, amount: 200, isKinprePos: false },
    { id: '12', source: 'sage', rawDate: '2024-10-25', date: '2024-10-25', description: 'B', debit: 50, credit: 0, amount: -50, isKinprePos: false },
    { id: '13', source: 'sage', rawDate: '2024-10-31', date: '2024-10-31', description: 'A', debit: 0, credit: 100, amount: 100, isKinprePos: false },
  ];

  const bankOrder = detectDateOrdering(descendingTxs);
  assert.equal(bankOrder.detectedOrder, 'descending');

  const sageOrder = detectDateOrdering(ascendingTxs);
  assert.equal(sageOrder.detectedOrder, 'ascending');
});

test('sortTransactions aligns bank and sage in either order', () => {
  const bankTxs: Transaction[] = [
    { id: '1', source: 'bank', rawDate: '2024-10-31', date: '2024-10-31', description: 'A', debit: 0, credit: 100, amount: 100, isKinprePos: false },
    { id: '2', source: 'bank', rawDate: '2024-10-02', date: '2024-10-02', description: 'B', debit: 0, credit: 50, amount: 50, isKinprePos: false },
  ];

  const sortedAsc = sortTransactions(bankTxs, 'ascending');
  assert.equal(sortedAsc[0].date, '2024-10-02');
  assert.equal(sortedAsc[1].date, '2024-10-31');

  const sortedDesc = sortTransactions(sortedAsc, 'descending');
  assert.equal(sortedDesc[0].date, '2024-10-31');
  assert.equal(sortedDesc[1].date, '2024-10-02');
});

test('detectKinprePosTransaction identifies KINPRE GLOBAL VENTURES with date under it', () => {
  // Case 1: Multi-line description with date under
  const narrative1 = `POS PAYMENT KINPRE GLOBAL VENTURES\n24-OCT-2024 15:30:00\nTERMINAL 09482`;
  const result1 = detectKinprePosTransaction(narrative1);
  assert.equal(result1.isKinprePos, true);
  assert.equal(result1.extractedDate, '2024-10-24');
  assert.equal(result1.extractedTime, '15:30:00');

  // Case 2: Multi-line cell with slash date under
  const narrative2 = `KINPRE GLOBAL VENTURES\n12/10/2024`;
  const result2 = detectKinprePosTransaction(narrative2);
  assert.equal(result2.isKinprePos, true);
  assert.equal(result2.extractedDate, '2024-10-12');

  // Case 3: Regular vendor (not Kinpre)
  const narrative3 = `TRANSFER TO ABC SUPPLIERS LTD\n01-OCT-2024`;
  const result3 = detectKinprePosTransaction(narrative3);
  assert.equal(result3.isKinprePos, false);
});

test('reconcileStatements matches entries and identifies variances', () => {
  const bankTxs: Transaction[] = [
    { id: 'b1', source: 'bank', rawDate: '2024-10-25', date: '2024-10-25', description: 'POS KINPRE GLOBAL VENTURES\n24-OCT-2024', debit: 0, credit: 50000, amount: 50000, isKinprePos: true },
    { id: 'b2', source: 'bank', rawDate: '2024-10-20', date: '2024-10-20', description: 'OFFICE SUPPLIES', debit: 12000, credit: 0, amount: -12000, isKinprePos: false },
    { id: 'b3', source: 'bank', rawDate: '2024-10-15', date: '2024-10-15', description: 'UNKNOWN BANK CHARGE', debit: 1500, credit: 0, amount: -1500, isKinprePos: false },
  ];

  const sageTxs: Transaction[] = [
    { id: 's1', source: 'sage', rawDate: '2024-10-20', date: '2024-10-20', description: 'OFFICE DEPOT', debit: 12000, credit: 0, amount: -12000, isKinprePos: false },
    // Sage recorded on transaction date (24th) while bank settled on 25th (1 day clearing lag)
    { id: 's2', source: 'sage', rawDate: '2024-10-24', date: '2024-10-24', description: 'KINPRE VENTURES SALES', debit: 0, credit: 50000, amount: 50000, isKinprePos: true },
  ];

  const result = reconcileStatements(bankTxs, sageTxs, { dateToleranceDays: 2 });
  assert.equal(result.summary.matchedCount, 2);
  assert.equal(result.summary.unmatchedBankCount, 1);
  assert.equal(result.summary.kinprePosCount, 1);
});
