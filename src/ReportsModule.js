import React, { useState, useEffect } from 'react';

// Pass in your existing `supabase` client. No DB setup needed — this module
// only reads from tables created by the other modules.
export default function ReportsModule({ supabase }) {
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState(firstDayOfMonth());
  const [toDate, setToDate] = useState(todayStr());
  const [rangeActive, setRangeActive] = useState(true);

  const from = rangeActive ? fromDate : null;
  const to = rangeActive ? toDate : null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} disabled={!rangeActive} className="px-3 py-2 border rounded-md disabled:bg-gray-100" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} disabled={!rangeActive} className="px-3 py-2 border rounded-md disabled:bg-gray-100" />
        </div>
        <button onClick={() => { setFromDate(firstDayOfMonth()); setToDate(todayStr()); setRangeActive(true); }} className="px-3 py-2 rounded-md text-sm font-semibold bg-gray-100 hover:bg-gray-200">This Month</button>
        <button onClick={() => setRangeActive(!rangeActive)} className={`px-3 py-2 rounded-md text-sm font-semibold ${!rangeActive ? 'bg-red-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
          {rangeActive ? 'Show All-Time Instead' : 'All-Time (click to filter by date)'}
        </button>
      </div>

      <ProductionSummary supabase={supabase} setError={setError} from={from} to={to} />
      <SalesNikashiSummary supabase={supabase} setError={setError} from={from} to={to} />
      <PurchaseSummary supabase={supabase} setError={setError} from={from} to={to} />
      <FinancialSummary supabase={supabase} setError={setError} from={from} to={to} />
      <LedgerBalances supabase={supabase} setError={setError} asOf={to} />
      <CurrentStock supabase={supabase} setError={setError} />
    </div>
  );
}

// ---------- shared helpers ----------
const todayStr = () => new Date().toISOString().split('T')[0];
const firstDayOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; };

function useAllRows(supabase, table, selectStr, setError) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let active = true;
    supabase.from(table).select(selectStr || '*').then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message); else setRows(data || []);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return rows;
}

function inRange(dateStr, from, to) {
  if (!dateStr) return false;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

function sumBy(rows, groupKeyFn, valueKey) {
  const totals = {};
  for (const r of rows) {
    const key = groupKeyFn(r);
    if (key === null || key === undefined) continue;
    totals[key] = (totals[key] || 0) + (Number(r[valueKey]) || 0);
  }
  return totals;
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function StatGrid({ entries }) {
  if (entries.length === 0) return <p className="text-gray-400 text-sm">No data in this range</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {entries.map(([label, val]) => (
        <div key={label} className="p-3 rounded-lg border-2 bg-gray-50 border-gray-200">
          <p className="text-xs font-bold text-gray-500 truncate">{label}</p>
          <p className="text-xl font-bold text-red-800">{typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : val}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------- Production Summary ----------------
function ProductionSummary({ supabase, setError, from, to }) {
  const pathai = useAllRows(supabase, 'pathai_vouchers', '*, items(item_name)', setError);
  const kachiBharai = useAllRows(supabase, 'kachi_bharai', '*, items(item_name)', setError);
  const jalai = useAllRows(supabase, 'jalai_vouchers', '*', setError);
  const nikasi = useAllRows(supabase, 'nikasi_records', '*, items(item_name)', setError);
  const wastage = useAllRows(supabase, 'wastage_records', '*, items(item_name)', setError);
  const rawMaterialTxns = useAllRows(supabase, 'raw_material_transactions', '*, raw_materials(material_name, unit)', setError);

  const inR = (r) => inRange(r.date, from, to);
  const pathaiInRange = pathai.filter(inR);
  const kachiInRange = kachiBharai.filter(inR);
  const jalaiInRange = jalai.filter(inR);
  const nikasiInRange = nikasi.filter(inR);
  const wastageInRange = wastage.filter(inR);
  const rmUsageInRange = rawMaterialTxns.filter((r) => inR(r) && r.txn_type === 'usage');
  const rmPurchaseInRange = rawMaterialTxns.filter((r) => inR(r) && r.txn_type === 'purchase');

  const stageTotals = [
    ['Pathai (bricks made)', pathaiInRange.reduce((s, r) => s + (r.quantity || 0), 0)],
    ['Kachi Bharai (stacked)', kachiInRange.reduce((s, r) => s + (r.quantity || 0), 0)],
    ['Jalai Rounds (kiln firings)', jalaiInRange.length],
    ['Nikasi (kiln unloaded)', nikasiInRange.reduce((s, r) => s + (r.quantity || 0), 0)],
    ['Wastage', wastageInRange.reduce((s, r) => s + (r.quantity || 0), 0)],
    ['Raw Material Used', rmUsageInRange.reduce((s, r) => s + (r.quantity || 0), 0)],
    ['Raw Material Purchased (qty)', rmPurchaseInRange.reduce((s, r) => s + (r.quantity || 0), 0)],
  ];

  return (
    <Section title="🔥 Production Summary">
      <StatGrid entries={stageTotals} />
    </Section>
  );
}

// ---------------- Sales & Nikashi (Pakki Bharai) Summary ----------------
function SalesNikashiSummary({ supabase, setError, from, to }) {
  const records = useAllRows(supabase, 'records', '*, items(item_name)', setError);
  const inR = (r) => inRange(r.date, from, to);

  const sales = records.filter((r) => r.type === 'sales' && inR(r));
  const nikashi = records.filter((r) => r.type === 'nikashi' && inR(r));

  const salesByItem = sumBy(sales, (r) => r.items?.item_name || 'Unknown', 'sold_quantity');
  const nikashiByItem = sumBy(nikashi, (r) => r.items?.item_name || 'Unknown', 'quantity');

  return (
    <Section title="💰 Sales & Nikashi (Pakki Bharai) Summary">
      <StatGrid entries={[
        ['Total Sold (qty)', sales.reduce((s, r) => s + (r.sold_quantity || 0), 0)],
        ['Total Sales Amount (₹)', sales.reduce((s, r) => s + (Number(r.total_amount) || 0), 0)],
        ['Total Nikashi (Pakki Bharai) Stacked', nikashi.reduce((s, r) => s + (r.quantity || 0), 0)],
      ]} />
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div>
          <p className="text-sm font-bold text-gray-600 mb-2">Sold by Item</p>
          <StatGrid entries={Object.entries(salesByItem)} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600 mb-2">Nikashi by Item</p>
          <StatGrid entries={Object.entries(nikashiByItem)} />
        </div>
      </div>
    </Section>
  );
}

// ---------------- Purchase Summary ----------------
function PurchaseSummary({ supabase, setError, from, to }) {
  const purchases = useAllRows(supabase, 'purchases', '*, ledgers(ledger_name), items(item_name), raw_materials(material_name)', setError);
  const inRangePurchases = purchases.filter((r) => inRange(r.date, from, to));

  const bySupplier = sumBy(inRangePurchases.filter((r) => r.amount), (r) => r.ledgers?.ledger_name || 'Cash Purchase', 'amount');
  const byMaterialType = sumBy(inRangePurchases.filter((r) => r.amount), (r) => r.material_type === 'item' ? 'Finished Items' : 'Raw Materials', 'amount');

  return (
    <Section title="🛒 Purchase Summary">
      <StatGrid entries={[
        ['Total Purchase Amount (₹)', inRangePurchases.reduce((s, r) => s + (Number(r.amount) || 0), 0)],
        ['Number of Purchases', inRangePurchases.length],
      ]} />
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div>
          <p className="text-sm font-bold text-gray-600 mb-2">By Supplier (₹)</p>
          <StatGrid entries={Object.entries(bySupplier)} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600 mb-2">By Material Type (₹)</p>
          <StatGrid entries={Object.entries(byMaterialType)} />
        </div>
      </div>
    </Section>
  );
}

// ---------------- Financial Summary ----------------
function FinancialSummary({ supabase, setError, from, to }) {
  const payments = useAllRows(supabase, 'payments', '*', setError);
  const receipts = useAllRows(supabase, 'receipts', '*', setError);
  const vouchers = useAllRows(supabase, 'account_vouchers', '*', setError);

  const paymentsInRange = payments.filter((r) => inRange(r.date, from, to));
  const receiptsInRange = receipts.filter((r) => inRange(r.date, from, to));
  const vouchersInRange = vouchers.filter((r) => inRange(r.date, from, to));

  const totalPaid = paymentsInRange.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalReceived = receiptsInRange.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <Section title="📑 Financial Summary">
      <StatGrid entries={[
        ['Total Paid (₹)', totalPaid],
        ['Total Received (₹)', totalReceived],
        ['Net Cash Flow (₹)', totalReceived - totalPaid],
        ['Account Vouchers Posted', vouchersInRange.length],
      ]} />
    </Section>
  );
}

// ---------------- Ledger Balances (as of "To" date) ----------------
function LedgerBalances({ supabase, setError, asOf }) {
  const ledgers = useAllRows(supabase, 'ledgers', '*', setError);
  const opening = useAllRows(supabase, 'ledgers_opening', '*', setError);
  const purchases = useAllRows(supabase, 'purchases', '*', setError);
  const sales = useAllRows(supabase, 'records', '*', setError);
  const payments = useAllRows(supabase, 'payments', '*', setError);
  const receipts = useAllRows(supabase, 'receipts', '*', setError);
  const ledgerVouchers = useAllRows(supabase, 'ledger_vouchers', '*', setError);
  const accountVouchers = useAllRows(supabase, 'account_vouchers', '*', setError);

  const upTo = (r) => !asOf || (r.date && r.date <= asOf);

  const balances = {};
  const addTo = (ledgerId, amount) => {
    if (!ledgerId) return;
    balances[ledgerId] = (balances[ledgerId] || 0) + amount;
  };

  opening.filter(upTo).forEach((r) => addTo(r.ledger_id, r.balance_type === 'debit' ? Number(r.opening_balance) : -Number(r.opening_balance)));
  sales.filter((r) => r.type === 'sales' && upTo(r)).forEach((r) => addTo(r.ledger_id, Number(r.total_amount) || 0));
  purchases.filter(upTo).forEach((r) => addTo(r.ledger_id, -(Number(r.amount) || 0)));
  payments.filter(upTo).forEach((r) => addTo(r.ledger_id, Number(r.amount) || 0));
  receipts.filter(upTo).forEach((r) => addTo(r.ledger_id, -(Number(r.amount) || 0)));
  ledgerVouchers.filter(upTo).forEach((r) => addTo(r.ledger_id, r.voucher_type === 'debit' ? Number(r.amount) : -Number(r.amount)));
  accountVouchers.filter(upTo).forEach((r) => { addTo(r.debit_ledger_id, Number(r.amount) || 0); addTo(r.credit_ledger_id, -(Number(r.amount) || 0)); });

  const rows = ledgers
    .map((l) => ({ ...l, balance: balances[l.id] || 0 }))
    .filter((l) => l.balance !== 0);

  return (
    <Section title={`📒 Ledger Balances (as of ${asOf || 'today'})`}>
      <p className="text-xs text-gray-500 mb-3">Positive = they owe us. Negative = we owe them. This is a simplified running total from your recorded transactions, not a certified statement — verify against source vouchers for anything critical.</p>
      {rows.length === 0 ? (
        <p className="text-gray-400 text-sm">No outstanding balances</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="px-3 py-2 text-left">Ledger</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Balance (₹)</th></tr>
          </thead>
          <tbody>
            {rows.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).map((l) => (
              <tr key={l.id} className="border-b">
                <td className="px-3 py-2">{l.ledger_name}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{l.ledger_type}</td>
                <td className={`px-3 py-2 font-bold ${l.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{l.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

// ---------------- Current Stock (live snapshot, not date-filtered) ----------------
function CurrentStock({ supabase, setError }) {
  const items = useAllRows(supabase, 'items', '*', setError);
  const inventory = useAllRows(supabase, 'inventory', '*', setError);

  const totalByItem = (itemId) => inventory.filter((r) => r.item_id === itemId).reduce((s, r) => s + (r.quantity || 0), 0);

  return (
    <Section title="📦 Current Stock (Live Snapshot)">
      <StatGrid entries={items.map((it) => [it.item_name, totalByItem(it.id)])} />
    </Section>
  );
}
