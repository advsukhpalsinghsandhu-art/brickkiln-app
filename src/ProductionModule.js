import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

// Pass in your existing `supabase` client and `userRole` from App.js as props.
// This module covers the pipeline BEFORE bricks reach your existing
// Nikashi/inventory tab (which functions as "Pakki Bharai" — stacking
// fired bricks into sellable stock):
//
//   Pathai (molding) -> Kachi Bharai (load into kiln) -> Jalai (firing)
//     -> Nikasi (unload fired bricks) -> [existing Nikashi tab = Pakki Bharai]
//
export default function ProductionModule({ supabase, userRole, subTab: subTabProp, onSubTabChange }) {
  const [internalSubTab, setInternalSubTab] = useState('rawMaterial');
  const subTab = subTabProp || internalSubTab;
  const setSubTab = onSubTabChange || setInternalSubTab;
  const [error, setError] = useState('');

  const tabs = [
    ['rawMaterial', '🪨 Raw Material'],
    ['pathai', '🧱 Pathai'],
    ['kachiBharai', '🔥 Kachi Bharai'],
    ['jalai', '🔥 Jalai'],
    ['nikasi', '📤 Nikasi'],
    ['wastage', '⚠️ Wastage'],
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      {!subTabProp && (
      <div className="flex gap-2 flex-wrap">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`px-3 py-2 rounded-lg font-semibold text-xs ${subTab === key ? 'bg-red-800 text-white' : 'bg-white text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {subTab === 'rawMaterial' && <RawMaterial supabase={supabase} setError={setError} userRole={userRole} />}
      {subTab === 'pathai' && <Pathai supabase={supabase} setError={setError} userRole={userRole} />}
      {subTab === 'kachiBharai' && <KachiBharai supabase={supabase} setError={setError} userRole={userRole} />}
      {subTab === 'jalai' && <Jalai supabase={supabase} setError={setError} userRole={userRole} />}
      {subTab === 'nikasi' && <Nikasi supabase={supabase} setError={setError} userRole={userRole} />}
      {subTab === 'wastage' && <Wastage supabase={supabase} setError={setError} userRole={userRole} />}
    </div>
  );
}

// ---------- shared helpers ----------

// Standard load + realtime-sync against one table (same pattern as MastersModule)
function useSynced(supabase, table, selectStr, setError, orderCol = 'id') {
  const [rows, setRows] = useState([]);
  const load = async () => {
    const { data, error } = await supabase.from(table).select(selectStr || '*').order(orderCol, { ascending: false });
    if (error) setError(error.message); else setRows(data || []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel(`${table}-sync`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, load).subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { rows, load };
}

function useLookup(supabase, table, setError) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    supabase.from(table).select('*').order('id').then(({ data, error }) => {
      if (error) setError(error.message); else setRows(data || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return rows;
}

function sumBy(rows, groupKeyFn, valueKey = 'quantity') {
  const totals = {};
  for (const r of rows) {
    const key = groupKeyFn(r);
    if (key === null || key === undefined) continue;
    totals[key] = (totals[key] || 0) + (r[valueKey] || 0);
  }
  return totals;
}

function StockGrid({ title, entries }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-gray-400 text-sm">No stock yet</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {entries.map(([label, qty]) => (
            <div key={label} className={`p-3 rounded-lg border-2 ${qty <= 0 ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-300'}`}>
              <p className="text-xs font-bold truncate">{label}</p>
              <p className={`text-xl font-bold ${qty <= 0 ? 'text-gray-400' : 'text-green-600'}`}>{qty}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormPanel({ title, children, onSave, tableRows, columns, onDelete }) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="space-y-3">
          {children}
          <button onClick={onSave} className="w-full bg-red-700 text-white font-bold py-2 rounded-md">Save</button>
        </div>
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        {tableRows.length === 0 ? (
          <p className="text-gray-400">No entries yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((c) => <th key={c.key} className="px-3 py-2 text-left">{c.label}</th>)}
                <th className="px-3 py-2">Del</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.id} className="border-b">
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2">{c.render ? c.render(row) : row[c.key]}</td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => onDelete(row.id)} className="text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const todayStr = () => new Date().toISOString().split('T')[0];

// ---------------- Raw Material ----------------
function RawMaterial({ supabase, setError, userRole }) {
  const [mode, setMode] = useState('txn');
  const materials = useLookup(supabase, 'raw_materials', setError);
  const locations = useLookup(supabase, 'locations', setError);

  const emptyMaterial = { material_name: '', unit: '' };
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const { rows: materialRows, load: reloadMaterials } = useSynced(supabase, 'raw_materials', '*', setError);

  const emptyTxn = { date: todayStr(), material_id: '', txn_type: 'purchase', quantity: '', location_id: '', remarks: '' };
  const [txnForm, setTxnForm] = useState(emptyTxn);
  const { rows: txnRows } = useSynced(supabase, 'raw_material_transactions', '*, raw_materials(material_name), locations(location_name)', setError, 'date');

  const saveMaterial = async () => {
    if (!materialForm.material_name.trim()) return;
    const { error } = await supabase.from('raw_materials').insert({ material_name: materialForm.material_name.trim(), unit: materialForm.unit || null, is_active: true });
    if (error) setError(error.message); else { setMaterialForm(emptyMaterial); reloadMaterials(); }
  };

  const saveTxn = async () => {
    if (!txnForm.material_id || !txnForm.quantity) return;
    const { error } = await supabase.from('raw_material_transactions').insert({
      date: txnForm.date, material_id: txnForm.material_id, txn_type: txnForm.txn_type,
      quantity: parseFloat(txnForm.quantity), location_id: txnForm.location_id || null,
      remarks: txnForm.remarks || null, added_by: userRole,
    });
    if (error) setError(error.message); else setTxnForm(emptyTxn);
  };

  // Stock = purchases - usage, per material
  const purchases = sumBy(txnRows.filter(r => r.txn_type === 'purchase'), r => r.raw_materials?.material_name);
  const usage = sumBy(txnRows.filter(r => r.txn_type === 'usage'), r => r.raw_materials?.material_name);
  const stockEntries = materials.map(m => [`${m.material_name} (${m.unit || 'unit'})`, (purchases[m.material_name] || 0) - (usage[m.material_name] || 0)]);

  return (
    <div className="space-y-4">
      <StockGrid title="Raw Material Stock" entries={stockEntries} />
      <div className="flex gap-2">
        <button onClick={() => setMode('txn')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${mode === 'txn' ? 'bg-red-800 text-white' : 'bg-gray-100'}`}>Purchase / Usage</button>
        <button onClick={() => setMode('material')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${mode === 'material' ? 'bg-red-800 text-white' : 'bg-gray-100'}`}>Manage Materials</button>
      </div>

      {mode === 'material' && (
        <FormPanel
          title="Add Raw Material"
          onSave={saveMaterial}
          tableRows={materialRows}
          onDelete={async (id) => { const { error } = await supabase.from('raw_materials').delete().eq('id', id); if (error) setError(error.message); }}
          columns={[{ key: 'material_name', label: 'Material' }, { key: 'unit', label: 'Unit' }]}
        >
          <input type="text" value={materialForm.material_name} onChange={e => setMaterialForm(p => ({ ...p, material_name: e.target.value }))} placeholder="Material Name (e.g. Coal, Clay)" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={materialForm.unit} onChange={e => setMaterialForm(p => ({ ...p, unit: e.target.value }))} placeholder="Unit (kg, ton, truck load)" className="w-full px-3 py-2 border rounded-md" />
        </FormPanel>
      )}

      {mode === 'txn' && (
        <FormPanel
          title="Record Purchase / Usage"
          onSave={saveTxn}
          tableRows={txnRows}
          onDelete={async (id) => { const { error } = await supabase.from('raw_material_transactions').delete().eq('id', id); if (error) setError(error.message); }}
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'material', label: 'Material', render: r => r.raw_materials?.material_name },
            { key: 'txn_type', label: 'Type' },
            { key: 'quantity', label: 'Qty' },
            { key: 'location', label: 'Location', render: r => r.locations?.location_name || '-' },
          ]}
        >
          <input type="date" value={txnForm.date} onChange={e => setTxnForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
          <select value={txnForm.material_id} onChange={e => setTxnForm(p => ({ ...p, material_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
            <option value="">Select Material</option>
            {materials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
          </select>
          <select value={txnForm.txn_type} onChange={e => setTxnForm(p => ({ ...p, txn_type: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
            <option value="purchase">Purchase (stock in)</option>
            <option value="usage">Usage (stock out)</option>
          </select>
          <input type="number" value={txnForm.quantity} onChange={e => setTxnForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Quantity" className="w-full px-3 py-2 border rounded-md" />
          <select value={txnForm.location_id} onChange={e => setTxnForm(p => ({ ...p, location_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
            <option value="">Location (optional)</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.location_name}</option>)}
          </select>
          <input type="text" value={txnForm.remarks} onChange={e => setTxnForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Remarks" className="w-full px-3 py-2 border rounded-md" />
        </FormPanel>
      )}
    </div>
  );
}

// ---------------- Pathai (molding -> green stock) ----------------
function Pathai({ supabase, setError, userRole }) {
  const items = useLookup(supabase, 'items', setError);
  const locations = useLookup(supabase, 'locations', setError);
  const empty = { date: todayStr(), item_id: '', location_id: '', pather_name: '', quantity: '' };
  const [form, setForm] = useState(empty);
  const { rows } = useSynced(supabase, 'pathai_vouchers', '*, items(item_name), locations(location_name)', setError, 'date');
  const { rows: kachiRows } = useSynced(supabase, 'kachi_bharai', '*, items(item_name)', setError, 'date');
  const { rows: wastageRows } = useSynced(supabase, 'wastage_records', '*, items(item_name)', setError, 'date');

  const save = async () => {
    if (!form.item_id || !form.quantity) return;
    const { error } = await supabase.from('pathai_vouchers').insert({
      date: form.date, item_id: form.item_id, location_id: form.location_id || null,
      pather_name: form.pather_name || null, quantity: parseInt(form.quantity), added_by: userRole,
    });
    if (error) setError(error.message); else setForm(empty);
  };

  // Green stock (molded, not yet loaded into kiln, minus green-stage wastage)
  const molded = sumBy(rows, r => r.items?.item_name);
  const loaded = sumBy(kachiRows, r => r.items?.item_name);
  const wasted = sumBy(wastageRows.filter(w => w.stage === 'green'), r => r.items?.item_name);
  const greenStock = items.map(it => [it.item_name, (molded[it.item_name] || 0) - (loaded[it.item_name] || 0) - (wasted[it.item_name] || 0)]);

  return (
    <div className="space-y-4">
      <StockGrid title="Green Stock (molded, awaiting kiln loading)" entries={greenStock} />
      <FormPanel
        title="Add Pathai Voucher"
        onSave={save}
        tableRows={rows}
        onDelete={async (id) => { const { error } = await supabase.from('pathai_vouchers').delete().eq('id', id); if (error) setError(error.message); }}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'item', label: 'Item', render: r => r.items?.item_name },
          { key: 'location', label: 'Location', render: r => r.locations?.location_name || '-' },
          { key: 'pather_name', label: 'Pather' },
          { key: 'quantity', label: 'Qty' },
        ]}
      >
        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
        <select value={form.item_id} onChange={e => setForm(p => ({ ...p, item_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
          <option value="">Select Item</option>
          {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
        </select>
        <select value={form.location_id} onChange={e => setForm(p => ({ ...p, location_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
          <option value="">Location (Pather)</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.location_name}</option>)}
        </select>
        <input type="text" value={form.pather_name} onChange={e => setForm(p => ({ ...p, pather_name: e.target.value }))} placeholder="Pather Name" className="w-full px-3 py-2 border rounded-md" />
        <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Quantity Molded" className="w-full px-3 py-2 border rounded-md" />
      </FormPanel>
    </div>
  );
}

// ---------------- Kachi Bharai (green stock -> kiln line/chamber) ----------------
function KachiBharai({ supabase, setError, userRole }) {
  const items = useLookup(supabase, 'items', setError);
  const lineChambers = useLookup(supabase, 'line_chambers', setError);
  const empty = { date: todayStr(), item_id: '', line_chamber_id: '', quantity: '' };
  const [form, setForm] = useState(empty);
  const { rows } = useSynced(supabase, 'kachi_bharai', '*, items(item_name), line_chambers(line_number, chamber_number)', setError, 'date');
  const { rows: nikasiRows } = useSynced(supabase, 'nikasi_records', '*, line_chambers(line_number, chamber_number)', setError, 'date');

  const save = async () => {
    if (!form.item_id || !form.line_chamber_id || !form.quantity) return;
    const { error } = await supabase.from('kachi_bharai').insert({
      date: form.date, item_id: form.item_id, line_chamber_id: form.line_chamber_id,
      quantity: parseInt(form.quantity), added_by: userRole,
    });
    if (error) setError(error.message); else setForm(empty);
  };

  const lcLabel = lc => `Line ${lc.line_number}${lc.chamber_number ? ' / Ch ' + lc.chamber_number : ''}`;
  const loaded = sumBy(rows, r => r.line_chambers ? lcLabel(r.line_chambers) : null);
  const unloaded = sumBy(nikasiRows, r => r.line_chambers ? lcLabel(r.line_chambers) : null);
  const kilnStock = lineChambers.map(lc => [lcLabel(lc), (loaded[lcLabel(lc)] || 0) - (unloaded[lcLabel(lc)] || 0)]);

  return (
    <div className="space-y-4">
      <StockGrid title="In-Kiln Stock (loaded, awaiting/undergoing firing)" entries={kilnStock} />
      <FormPanel
        title="Add Kachi Bharai"
        onSave={save}
        tableRows={rows}
        onDelete={async (id) => { const { error } = await supabase.from('kachi_bharai').delete().eq('id', id); if (error) setError(error.message); }}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'item', label: 'Item', render: r => r.items?.item_name },
          { key: 'line', label: 'Line/Chamber', render: r => r.line_chambers ? lcLabel(r.line_chambers) : '-' },
          { key: 'quantity', label: 'Qty' },
        ]}
      >
        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
        <select value={form.item_id} onChange={e => setForm(p => ({ ...p, item_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
          <option value="">Select Item</option>
          {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
        </select>
        <select value={form.line_chamber_id} onChange={e => setForm(p => ({ ...p, line_chamber_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
          <option value="">Select Line/Chamber</option>
          {lineChambers.map(lc => <option key={lc.id} value={lc.id}>{lcLabel(lc)}</option>)}
        </select>
        <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Quantity Loaded" className="w-full px-3 py-2 border rounded-md" />
      </FormPanel>
    </div>
  );
}

// ---------------- Jalai (firing round + fuel) ----------------
function Jalai({ supabase, setError, userRole }) {
  const lineChambers = useLookup(supabase, 'line_chambers', setError);
  const fuels = useLookup(supabase, 'raw_materials', setError);
  const empty = { date: todayStr(), line_chamber_id: '', round_number: '', fuel_material_id: '', fuel_quantity: '', remarks: '' };
  const [form, setForm] = useState(empty);
  const { rows } = useSynced(supabase, 'jalai_vouchers', '*, line_chambers(line_number, chamber_number), raw_materials(material_name, unit)', setError, 'date');

  const save = async () => {
    if (!form.line_chamber_id) return;
    const { error } = await supabase.from('jalai_vouchers').insert({
      date: form.date, line_chamber_id: form.line_chamber_id, round_number: form.round_number ? parseInt(form.round_number) : null,
      fuel_material_id: form.fuel_material_id || null, fuel_quantity: form.fuel_quantity ? parseFloat(form.fuel_quantity) : null,
      remarks: form.remarks || null, added_by: userRole,
    });
    if (error) setError(error.message); else setForm(empty);
  };

  const lcLabel = lc => `Line ${lc.line_number}${lc.chamber_number ? ' / Ch ' + lc.chamber_number : ''}`;

  return (
    <FormPanel
      title="Add Jalai Voucher"
      onSave={save}
      tableRows={rows}
      onDelete={async (id) => { const { error } = await supabase.from('jalai_vouchers').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'date', label: 'Date' },
        { key: 'line', label: 'Line/Chamber', render: r => r.line_chambers ? lcLabel(r.line_chambers) : '-' },
        { key: 'round_number', label: 'Round' },
        { key: 'fuel', label: 'Fuel', render: r => r.raw_materials ? `${r.fuel_quantity ?? ''} ${r.raw_materials.unit || ''} ${r.raw_materials.material_name}` : '-' },
      ]}
    >
      <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
      <select value={form.line_chamber_id} onChange={e => setForm(p => ({ ...p, line_chamber_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
        <option value="">Select Line/Chamber</option>
        {lineChambers.map(lc => <option key={lc.id} value={lc.id}>{lcLabel(lc)}</option>)}
      </select>
      <input type="number" value={form.round_number} onChange={e => setForm(p => ({ ...p, round_number: e.target.value }))} placeholder="Round Number" className="w-full px-3 py-2 border rounded-md" />
      <select value={form.fuel_material_id} onChange={e => setForm(p => ({ ...p, fuel_material_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
        <option value="">Select Fuel (optional)</option>
        {fuels.map(f => <option key={f.id} value={f.id}>{f.material_name}</option>)}
      </select>
      <input type="number" value={form.fuel_quantity} onChange={e => setForm(p => ({ ...p, fuel_quantity: e.target.value }))} placeholder="Fuel Quantity Used" className="w-full px-3 py-2 border rounded-md" />
      <input type="text" value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Remarks" className="w-full px-3 py-2 border rounded-md" />
    </FormPanel>
  );
}

// ---------------- Nikasi (unload fired bricks from kiln) ----------------
function Nikasi({ supabase, setError, userRole }) {
  const [view, setView] = useState('item'); // 'item' or 'lineChamber' report toggle
  const items = useLookup(supabase, 'items', setError);
  const lineChambers = useLookup(supabase, 'line_chambers', setError);
  const empty = { date: todayStr(), item_id: '', line_chamber_id: '', quantity: '' };
  const [form, setForm] = useState(empty);
  const { rows } = useSynced(supabase, 'nikasi_records', '*, items(item_name), line_chambers(line_number, chamber_number)', setError, 'date');

  const save = async () => {
    if (!form.item_id || !form.line_chamber_id || !form.quantity) return;
    const { error } = await supabase.from('nikasi_records').insert({
      date: form.date, item_id: form.item_id, line_chamber_id: form.line_chamber_id,
      quantity: parseInt(form.quantity), added_by: userRole,
    });
    if (error) setError(error.message); else setForm(empty);
  };

  const lcLabel = lc => `Line ${lc.line_number}${lc.chamber_number ? ' / Ch ' + lc.chamber_number : ''}`;
  const byItem = sumBy(rows, r => r.items?.item_name);
  const byLineChamber = sumBy(rows, r => r.line_chambers ? lcLabel(r.line_chambers) : null);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setView('item')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${view === 'item' ? 'bg-red-800 text-white' : 'bg-gray-100'}`}>Item Wise Nikasi</button>
        <button onClick={() => setView('lineChamber')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${view === 'lineChamber' ? 'bg-red-800 text-white' : 'bg-gray-100'}`}>Line/Chamber Nikasi</button>
      </div>
      <StockGrid
        title={view === 'item' ? 'Total Unloaded — by Item' : 'Total Unloaded — by Line/Chamber'}
        entries={view === 'item' ? Object.entries(byItem) : Object.entries(byLineChamber)}
      />
      <FormPanel
        title="Add Nikasi (Kiln Unload)"
        onSave={save}
        tableRows={rows}
        onDelete={async (id) => { const { error } = await supabase.from('nikasi_records').delete().eq('id', id); if (error) setError(error.message); }}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'item', label: 'Item', render: r => r.items?.item_name },
          { key: 'line', label: 'Line/Chamber', render: r => r.line_chambers ? lcLabel(r.line_chambers) : '-' },
          { key: 'quantity', label: 'Qty' },
        ]}
      >
        <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
        <select value={form.item_id} onChange={e => setForm(p => ({ ...p, item_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
          <option value="">Select Item</option>
          {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
        </select>
        <select value={form.line_chamber_id} onChange={e => setForm(p => ({ ...p, line_chamber_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
          <option value="">Select Line/Chamber</option>
          {lineChambers.map(lc => <option key={lc.id} value={lc.id}>{lcLabel(lc)}</option>)}
        </select>
        <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Quantity Unloaded" className="w-full px-3 py-2 border rounded-md" />
      </FormPanel>
      <p className="text-xs text-gray-500">Once unloaded here, use your existing <span className="font-semibold">Nikashi</span> tab (Pakki Bharai) to stack these into sellable stock.</p>
    </div>
  );
}

// ---------------- Wastage ----------------
function Wastage({ supabase, setError, userRole }) {
  const items = useLookup(supabase, 'items', setError);
  const lineChambers = useLookup(supabase, 'line_chambers', setError);
  const empty = { date: todayStr(), stage: 'green', item_id: '', line_chamber_id: '', quantity: '', reason: '' };
  const [form, setForm] = useState(empty);
  const { rows } = useSynced(supabase, 'wastage_records', '*, items(item_name), line_chambers(line_number, chamber_number)', setError, 'date');

  const save = async () => {
    if (!form.item_id || !form.quantity) return;
    const { error } = await supabase.from('wastage_records').insert({
      date: form.date, stage: form.stage, item_id: form.item_id,
      line_chamber_id: form.stage === 'kiln' ? (form.line_chamber_id || null) : null,
      quantity: parseInt(form.quantity), reason: form.reason || null, added_by: userRole,
    });
    if (error) setError(error.message); else setForm(empty);
  };

  const lcLabel = lc => `Line ${lc.line_number}${lc.chamber_number ? ' / Ch ' + lc.chamber_number : ''}`;

  return (
    <FormPanel
      title="Record Wastage"
      onSave={save}
      tableRows={rows}
      onDelete={async (id) => { const { error } = await supabase.from('wastage_records').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'date', label: 'Date' },
        { key: 'stage', label: 'Stage' },
        { key: 'item', label: 'Item', render: r => r.items?.item_name },
        { key: 'line', label: 'Line/Chamber', render: r => r.line_chambers ? lcLabel(r.line_chambers) : '-' },
        { key: 'quantity', label: 'Qty' },
        { key: 'reason', label: 'Reason' },
      ]}
    >
      <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
      <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
        <option value="green">Green (molded, before kiln)</option>
        <option value="kiln">In-Kiln (during firing)</option>
        <option value="fired">Fired (after unloading)</option>
      </select>
      <select value={form.item_id} onChange={e => setForm(p => ({ ...p, item_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
        <option value="">Select Item</option>
        {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
      </select>
      {form.stage === 'kiln' && (
        <select value={form.line_chamber_id} onChange={e => setForm(p => ({ ...p, line_chamber_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
          <option value="">Line/Chamber (optional)</option>
          {lineChambers.map(lc => <option key={lc.id} value={lc.id}>{lcLabel(lc)}</option>)}
        </select>
      )}
      <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Quantity Wasted" className="w-full px-3 py-2 border rounded-md" />
      <input type="text" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason (rain, breakage, etc.)" className="w-full px-3 py-2 border rounded-md" />
    </FormPanel>
  );
}
