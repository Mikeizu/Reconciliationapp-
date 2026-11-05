/**
 * Core Reconciliation & POS Detection Engine
 */

export interface Transaction {
  id: string;
  source: 'bank' | 'sage';
  rawDate: string;
  date: string; // ISO YYYY-MM-DD
  dateTime?: string; // Optional time if present
  description: string;
  reference?: string;
  debit: number; // money out / withdrawal
  credit: number; // money in / deposit
  amount: number; // signed: credit > 0, debit < 0 or net value
  balance?: number;
  // Specific POS fields
  isKinprePos: boolean;
  posTerminalDate?: string;
  posTerminalTime?: string;
  posDetails?: string;
  rawNarrationLines?: string[];
}

export interface MatchedPair {
  id: string;
  bankTx?: Transaction;
  sageTx?: Transaction;
  matchType: 'exact' | 'fuzzy_date' | 'unmatched_bank' | 'unmatched_sage' | 'manual';
  confidence: number;
  variance: number;
  notes?: string;
}

export type SortOrder = 'ascending' | 'descending' | 'raw';

export interface DateOrderInfo {
  detectedOrder: 'ascending' | 'descending' | 'mixed' | 'unknown';
  firstDate?: string;
  lastDate?: string;
  isConsistent: boolean;
}

/**
 * Standardize various date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MMM-YYYY, etc.)
 */
export function normalizeDate(input: string): { iso: string; raw: string } {
  if (!input) return { iso: '1970-01-01', raw: '' };
  const clean = input.trim();

  // Try parsing ISO first (YYYY-MM-DD)
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return { iso: `${y}-${m}-${d}`, raw: clean };
  }

  // DD-MMM-YYYY or DD/MMM/YYYY (e.g. 24-OCT-2024 or 24 Oct 2024)
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const mmmMatch = clean.match(/^(\d{1,2})[-/ ]([a-zA-Z]{3,})[-/ ](\d{2,4})/);
  if (mmmMatch) {
    const d = mmmMatch[1].padStart(2, '0');
    const mStr = mmmMatch[2].toLowerCase().substring(0, 3);
    const m = monthNames[mStr] || '01';
    let y = mmmMatch[3];
    if (y.length === 2) y = '20' + y;
    return { iso: `${y}-${m}-${d}`, raw: clean };
  }

  // DD/MM/YYYY or DD-MM-YYYY (most common in UK, Nigeria, Europe Sage & Banks)
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    let y = dmyMatch[3];
    if (y.length === 2) y = '20' + y;

    // If p2 > 12, it's definitely MM/DD/YYYY, otherwise default to DD/MM/YYYY
    if (p2 > 12 && p1 <= 12) {
      const m = String(p1).padStart(2, '0');
      const d = String(p2).padStart(2, '0');
      return { iso: `${y}-${m}-${d}`, raw: clean };
    }
    const d = String(p1).padStart(2, '0');
    const m = String(p2).padStart(2, '0');
    return { iso: `${y}-${m}-${d}`, raw: clean };
  }

  // Fallback to JS Date
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return { iso: `${y}-${m}-${d}`, raw: clean };
  }

  return { iso: '1970-01-01', raw: clean };
}

/**
 * Detect if a list of transactions is in Ascending or Descending order by date
 */
export function detectDateOrdering(transactions: Transaction[]): DateOrderInfo {
  if (transactions.length < 2) {
    return {
      detectedOrder: 'unknown',
      firstDate: transactions[0]?.date,
      lastDate: transactions[0]?.date,
      isConsistent: true,
    };
  }

  let ascCount = 0;
  let descCount = 0;
  let equalCount = 0;

  for (let i = 0; i < transactions.length - 1; i++) {
    const d1 = transactions[i].date;
    const d2 = transactions[i + 1].date;
    if (d1 < d2) {
      ascCount++;
    } else if (d1 > d2) {
      descCount++;
    } else {
      equalCount++;
    }
  }

  const firstDate = transactions[0].date;
  const lastDate = transactions[transactions.length - 1].date;

  if (descCount > ascCount && descCount >= Math.floor((transactions.length - 1) * 0.6)) {
    return {
      detectedOrder: 'descending',
      firstDate,
      lastDate,
      isConsistent: ascCount === 0,
    };
  } else if (ascCount > descCount && ascCount >= Math.floor((transactions.length - 1) * 0.6)) {
    return {
      detectedOrder: 'ascending',
      firstDate,
      lastDate,
      isConsistent: descCount === 0,
    };
  }

  return {
    detectedOrder: 'mixed',
    firstDate,
    lastDate,
    isConsistent: false,
  };
}

/**
 * Specifically inspect a description/narrative to detect:
 * POS TRANSACTION NAMED "KINPRE GLOBAL VENTURES" with date under or inside it!
 */
export function detectKinprePosTransaction(description: string, fullRowText?: string): {
  isKinprePos: boolean;
  extractedDate?: string;
  extractedTime?: string;
  details?: string;
} {
  const combined = `${description || ''}\n${fullRowText || ''}`.toUpperCase();

  // Check for KINPRE GLOBAL VENTURES (allow slight typo/spacing tolerance)
  const hasKinpre = combined.includes('KINPRE') && combined.includes('GLOBAL');
  if (!hasKinpre) {
    return { isKinprePos: false };
  }

  // Check if it mentions POS, TERMINAL, CARD, PURCHASE, or VENTURES
  const isPos = combined.includes('POS') ||
                combined.includes('TERMINAL') ||
                combined.includes('PURCHASE') ||
                combined.includes('VENTURES') ||
                combined.includes('SETTLEMENT');

  // Look for date underneath or adjacent:
  // e.g. "KINPRE GLOBAL VENTURES\n24-OCT-2024" or "\n15/10/2024 14:22:05"
  const lines = combined.split(/[\r\n]+/);
  let extractedDate: string | undefined;
  let extractedTime: string | undefined;

  // 1. Check line directly after KINPRE or any following line with date pattern
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('KINPRE')) {
      // Check the next line (date underneath!)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const dateMatch = findDateInString(nextLine);
        if (dateMatch) {
          extractedDate = dateMatch.date;
          extractedTime = dateMatch.time;
          break;
        }
      }
    }
  }

  // 2. If not found on immediate next line, scan whole text for embedded date/time
  if (!extractedDate) {
    const dateMatch = findDateInString(combined);
    if (dateMatch) {
      extractedDate = dateMatch.date;
      extractedTime = dateMatch.time;
    }
  }

  return {
    isKinprePos: true,
    extractedDate,
    extractedTime,
    details: 'POS Transaction: KINPRE GLOBAL VENTURES',
  };
}

function findDateInString(str: string): { date?: string; time?: string } | null {
  // Check for time: HH:MM:SS or HH:MM
  const timeMatch = str.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  const time = timeMatch ? timeMatch[1] : undefined;

  // Check for DD-MMM-YYYY or DD/MMM/YYYY
  const mmmMatch = str.match(/(\d{1,2})[-/ ]([A-Z]{3,})[-/ ](\d{2,4})/i);
  if (mmmMatch) {
    const norm = normalizeDate(mmmMatch[0]);
    return { date: norm.iso, time };
  }

  // Check for DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
  const numDateMatch = str.match(/(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})/);
  if (numDateMatch) {
    const norm = normalizeDate(numDateMatch[0]);
    return { date: norm.iso, time };
  }

  return time ? { time } : null;
}

/**
 * Sort transactions according to requested order
 */
export function sortTransactions(transactions: Transaction[], order: SortOrder): Transaction[] {
  if (order === 'raw') return [...transactions];

  return [...transactions].sort((a, b) => {
    if (order === 'ascending') {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return a.id.localeCompare(b.id);
    } else {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      return b.id.localeCompare(a.id);
    }
  });
}

/**
 * Core Reconciliation Algorithm
 * Compares normalized Bank transactions with normalized Sage transactions
 */
export function reconcileStatements(
  bankTxs: Transaction[],
  sageTxs: Transaction[],
  options: {
    dateToleranceDays?: number;
    sortOrder?: SortOrder;
  } = {}
): {
  matchedPairs: MatchedPair[];
  summary: {
    totalBankCount: number;
    totalSageCount: number;
    matchedCount: number;
    unmatchedBankCount: number;
    unmatchedSageCount: number;
    totalBankCredits: number;
    totalBankDebits: number;
    totalSageCredits: number;
    totalSageDebits: number;
    netDifference: number;
    kinprePosCount: number;
    kinprePosTotal: number;
  };
} {
  const toleranceDays = options.dateToleranceDays ?? 3;
  const sortOrder = options.sortOrder ?? 'ascending';

  const sortedBank = sortTransactions(bankTxs, sortOrder);
  const sortedSage = sortTransactions(sageTxs, sortOrder);

  const matchedPairs: MatchedPair[] = [];
  const usedSageIds = new Set<string>();
  const usedBankIds = new Set<string>();

  // Helper to compute net monetary impact of a tx
  const getNet = (tx: Transaction) => {
    if (tx.credit > 0) return Math.abs(tx.credit);
    if (tx.debit > 0) return -Math.abs(tx.debit);
    return tx.amount;
  };

  // 1. Pass 1: Exact matches (exact amount + exact date)
  for (const b of sortedBank) {
    if (usedBankIds.has(b.id)) continue;
    const bNet = Math.round(getNet(b) * 100);

    for (const s of sortedSage) {
      if (usedSageIds.has(s.id)) continue;
      const sNet = Math.round(getNet(s) * 100);

      if (bNet === sNet && b.date === s.date) {
        matchedPairs.push({
          id: `match-${b.id}-${s.id}`,
          bankTx: b,
          sageTx: s,
          matchType: 'exact',
          confidence: 100,
          variance: 0,
          notes: 'Exact date & amount match',
        });
        usedBankIds.add(b.id);
        usedSageIds.add(s.id);
        break;
      }
    }
  }

  // 2. Pass 2: Exact amount with Date Tolerance (within ±toleranceDays)
  // Especially useful for card settlements (KINPRE GLOBAL VENTURES) or cheques
  for (const b of sortedBank) {
    if (usedBankIds.has(b.id)) continue;
    const bNet = Math.round(getNet(b) * 100);
    const bTime = new Date(b.date).getTime();

    let bestSage: Transaction | null = null;
    let minDayDiff = Infinity;

    for (const s of sortedSage) {
      if (usedSageIds.has(s.id)) continue;
      const sNet = Math.round(getNet(s) * 100);

      if (bNet === sNet) {
        const sTime = new Date(s.date).getTime();
        const dayDiff = Math.abs((bTime - sTime) / (1000 * 60 * 60 * 24));
        if (dayDiff <= toleranceDays && dayDiff < minDayDiff) {
          minDayDiff = dayDiff;
          bestSage = s;
        }
      }
    }

    if (bestSage) {
      matchedPairs.push({
        id: `match-fuzzy-${b.id}-${bestSage.id}`,
        bankTx: b,
        sageTx: bestSage,
        matchType: 'fuzzy_date',
        confidence: Math.max(70, Math.round(100 - minDayDiff * 8)),
        variance: 0,
        notes: `Amount match with ${minDayDiff === 0 ? 'same day' : `${minDayDiff} day date difference (clearing lag)`}`,
      });
      usedBankIds.add(b.id);
      usedSageIds.add(bestSage.id);
    }
  }

  // 3. Pass 3: Unmatched Bank items
  for (const b of sortedBank) {
    if (!usedBankIds.has(b.id)) {
      matchedPairs.push({
        id: `unmatched-bank-${b.id}`,
        bankTx: b,
        matchType: 'unmatched_bank',
        confidence: 0,
        variance: getNet(b),
        notes: 'In Bank Statement, missing in Sage GL',
      });
    }
  }

  // 4. Pass 4: Unmatched Sage items
  for (const s of sortedSage) {
    if (!usedSageIds.has(s.id)) {
      matchedPairs.push({
        id: `unmatched-sage-${s.id}`,
        sageTx: s,
        matchType: 'unmatched_sage',
        confidence: 0,
        variance: -getNet(s),
        notes: 'In Sage GL, missing in Bank Statement',
      });
    }
  }

  // Sort final matched list according to selected order
  matchedPairs.sort((a, b) => {
    const dateA = a.bankTx?.date || a.sageTx?.date || '';
    const dateB = b.bankTx?.date || b.sageTx?.date || '';
    if (sortOrder === 'ascending') {
      return dateA.localeCompare(dateB);
    } else {
      return dateB.localeCompare(dateA);
    }
  });

  // Calculate summary statistics
  let totalBankCredits = 0;
  let totalBankDebits = 0;
  let kinprePosCount = 0;
  let kinprePosTotal = 0;

  for (const b of bankTxs) {
    totalBankCredits += b.credit;
    totalBankDebits += b.debit;
    if (b.isKinprePos) {
      kinprePosCount++;
      kinprePosTotal += b.credit || b.amount;
    }
  }

  let totalSageCredits = 0;
  let totalSageDebits = 0;
  for (const s of sageTxs) {
    totalSageCredits += s.credit;
    totalSageDebits += s.debit;
  }

  const netBank = totalBankCredits - totalBankDebits;
  const netSage = totalSageCredits - totalSageDebits;
  const netDifference = netBank - netSage;

  const matchedCount = matchedPairs.filter(p => p.matchType === 'exact' || p.matchType === 'fuzzy_date' || p.matchType === 'manual').length;
  const unmatchedBankCount = matchedPairs.filter(p => p.matchType === 'unmatched_bank').length;
  const unmatchedSageCount = matchedPairs.filter(p => p.matchType === 'unmatched_sage').length;

  return {
    matchedPairs,
    summary: {
      totalBankCount: bankTxs.length,
      totalSageCount: sageTxs.length,
      matchedCount,
      unmatchedBankCount,
      unmatchedSageCount,
      totalBankCredits,
      totalBankDebits,
      totalSageCredits,
      totalSageDebits,
      netDifference,
      kinprePosCount,
      kinprePosTotal,
    },
  };
}

/**
 * Parser for CSV / raw text into Transaction items
 */
export function parseStatementText(
  rawText: string,
  source: 'bank' | 'sage'
): Transaction[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const results: Transaction[] = [];

  // Detect delimiter: comma, tab, or semicolon
  const firstFew = lines.slice(0, 5).join('\n');
  const commaCount = (firstFew.match(/,/g) || []).length;
  const tabCount = (firstFew.match(/\t/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';

  // Identify header
  let startIndex = 0;
  let dateCol = -1;
  let descCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let amountCol = -1;
  let refCol = -1;
  let balanceCol = -1;

  const headerCells = lines[0].split(delimiter).map(c => c.trim().toLowerCase().replace(/['"]/g, ''));
  for (let i = 0; i < headerCells.length; i++) {
    const h = headerCells[i];
    if (h.includes('date') || h === 'dt' || h === 'posting date' || h === 'val date') dateCol = i;
    else if (h.includes('desc') || h.includes('narr') || h.includes('particular') || h.includes('detail') || h.includes('memo')) descCol = i;
    else if (h.includes('debit') || h.includes('withdrawal') || h.includes('paid out') || h.includes('dr')) debitCol = i;
    else if (h.includes('credit') || h.includes('deposit') || h.includes('paid in') || h.includes('cr')) creditCol = i;
    else if (h.includes('amount') || h.includes('value')) amountCol = i;
    else if (h.includes('ref') || h.includes('cheque') || h.includes('chq') || h.includes('trans no')) refCol = i;
    else if (h.includes('bal') || h.includes('running bal')) balanceCol = i;
  }

  // If header found, start from line 1
  if (dateCol !== -1 && (descCol !== -1 || amountCol !== -1 || debitCol !== -1)) {
    startIndex = 1;
  } else {
    // Default column assumptions
    dateCol = 0;
    descCol = 1;
    debitCol = 2;
    creditCol = 3;
    balanceCol = 4;
  }

  for (let idx = startIndex; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const cells = rawLine.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cells.length < 2) continue;

    const rawDateStr = cells[dateCol] || '';
    if (!rawDateStr || rawDateStr.toLowerCase() === 'date' || rawDateStr.toLowerCase() === 'total') continue;

    const { iso: dateIso } = normalizeDate(rawDateStr);
    const description = cells[descCol] || cells[1] || 'Transaction';

    // Parse numeric values
    const parseNum = (val?: string) => {
      if (!val) return 0;
      const clean = val.replace(/[^0-9.-]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : Math.abs(num);
    };

    let debit = 0;
    let credit = 0;
    let amount = 0;

    if (debitCol !== -1 && creditCol !== -1) {
      debit = parseNum(cells[debitCol]);
      credit = parseNum(cells[creditCol]);
      amount = credit > 0 ? credit : -debit;
    } else if (amountCol !== -1) {
      const rawAmt = cells[amountCol];
      const cleanAmt = rawAmt.replace(/[^0-9.-]/g, '');
      const parsedAmt = parseFloat(cleanAmt) || 0;
      if (parsedAmt < 0) {
        debit = Math.abs(parsedAmt);
        amount = parsedAmt;
      } else {
        credit = parsedAmt;
        amount = parsedAmt;
      }
    }

    const reference = refCol !== -1 ? cells[refCol] : undefined;
    const balance = balanceCol !== -1 ? parseNum(cells[balanceCol]) : undefined;

    // Check KINPRE POS
    const kinpreCheck = detectKinprePosTransaction(description, rawLine);

    results.push({
      id: `${source}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      source,
      rawDate: rawDateStr,
      date: dateIso,
      description,
      reference,
      debit,
      credit,
      amount,
      balance,
      isKinprePos: kinpreCheck.isKinprePos,
      posTerminalDate: kinpreCheck.extractedDate,
      posTerminalTime: kinpreCheck.extractedTime,
      posDetails: kinpreCheck.details,
      rawNarrationLines: [description],
    });
  }

  return results;
}
