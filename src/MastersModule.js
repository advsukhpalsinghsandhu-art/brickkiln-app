import React, { useState, useEffect } from 'react';
import { Trash2, Pencil } from 'lucide-react';

// Pass in your existing `supabase` client from App.js as a prop
export default function MastersModule({ supabase, subTab: subTabProp, onSubTabChange }) {
  const [internalSubTab, setInternalSubTab] = useState('item');
  const subTab = subTabProp || internalSubTab;
  const setSubTab = onSubTabChange || setInternalSubTab;
  const [error, setError] = useState('');

  const tabs = [
    ['item', 'Item'],
    ['chakka', 'Chakka'],
    ['city', 'City'],
    ['freight', 'Freight'],
    ['vehicle', 'Vehicle'],
    ['lineChamber', 'Line/Chamber'],
    ['location', 'Location'],
    ['ledger', 'Ledger'],
    ['gst', 'GST Tax'],
    ['saleAgent', 'Sale Agent'],
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

      {subTab === 'item' && <ItemMaster supabase={supabase} setError={setError} />}
      {subTab === 'chakka' && <ChakkaMaster supabase={supabase} setError={setError} />}
      {subTab === 'city' && <CityMaster supabase={supabase} setError={setError} />}
      {subTab === 'freight' && <FreightMaster supabase={supabase} setError={setError} />}
      {subTab === 'vehicle' && <VehicleMaster supabase={supabase} setError={setError} />}
      {subTab === 'lineChamber' && <LineChamberMaster supabase={supabase} setError={setError} />}
      {subTab === 'location' && <LocationMaster supabase={supabase} setError={setError} />}
      {subTab === 'ledger' && <LedgerMaster supabase={supabase} setError={setError} />}
      {subTab === 'gst' && <GstTaxMaster supabase={supabase} setError={setError} />}
      {subTab === 'saleAgent' && <SaleAgentMaster supabase={supabase} setError={setError} />}
    </div>
  );
}

// ---------- Generic CRUD panel shell ----------
function Panel({ title, form, onSave, onClear, rows, columns, onEdit, onDelete, fields }) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">{form.id ? `Edit ${title}` : `Add ${title}`}</h2>
        <div className="space-y-3">
          {fields}
          <div className="flex gap-2">
            <button onClick={onSave} className="flex-1 bg-red-700 text-white font-bold py-2 rounded-md">
              {form.id ? 'Update' : 'Save'}
            </button>
            {form.id && (
              <button onClick={onClear} className="px-4 bg-gray-300 rounded-md font-semibold">Clear</button>
            )}
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-gray-400">No entries yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                {columns.map((c) => <th key={c.key} className="px-3 py-2 text-left">{c.label}</th>)}
                <th className="px-3 py-2">Edit</th>
                <th className="px-3 py-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="border-b">
                  <td className="px-3 py-2">{i + 1}</td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2">{c.render ? c.render(row) : row[c.key]}</td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => onEdit(row)} className="text-blue-500"><Pencil size={16} /></button>
                  </td>
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

// Small reusable helper for standard load/realtime-sync against one table
function useMaster(supabase, table, selectStr, setError) {
  const [rows, setRows] = useState([]);
  const load = async () => {
    const { data, error } = await supabase.from(table).select(selectStr || '*').order('id');
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

// ---------------- Item Master ----------------
function ItemMaster({ supabase, setError }) {
  const empty = { id: null, item_name: '', is_active: true };
  const [form, setForm] = useState(empty);
  const { rows } = useMaster(supabase, 'items', '*', setError);

  const save = async () => {
    if (!form.item_name.trim()) return;
    const payload = { item_name: form.item_name.trim(), is_active: form.is_active };
    const { error } = form.id
      ? await supabase.from('items').update(payload).eq('id', form.id)
      : await supabase.from('items').insert(payload);
    if (error) setError(error.message); else setForm(empty);
  };

  return (
    <Panel
      title="Item"
      form={form}
      onSave={save}
      onClear={() => setForm(empty)}
      rows={rows}
      onEdit={(r) => setForm({ id: r.id, item_name: r.item_name, is_active: r.is_active })}
      onDelete={async (id) => { const { error } = await supabase.from('items').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'item_name', label: 'Item Name' },
        { key: 'is_active', label: 'Active', render: (r) => r.is_active ? 'Yes' : 'No' },
      ]}
      fields={
        <>
          <input type="text" value={form.item_name} onChange={(e) => setForm((p) => ({ ...p, item_name: e.target.value }))} placeholder="Item Name" className="w-full px-3 py-2 border rounded-md" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            Active
          </label>
        </>
      }
    />
  );
}

// ---------------- Chakka Master ----------------
function ChakkaMaster({ supabase, setError }) {
  const empty = { id: null, item_id: '', chakka_name: 'Default', remarks: '' };
  const [form, setForm] = useState(empty);
  const [items, setItems] = useState([]);
  const { rows } = useMaster(supabase, 'chakka_master', '*, items(item_name)', setError);

  useEffect(() => {
    supabase.from('items').select('*').order('id').then(({ data, error }) => {
      if (error) setError(error.message); else setItems(data || []);
    });
  }, [supabase, setError]);

  const save = async () => {
    if (!form.item_id || !form.chakka_name.trim()) return;
    const payload = { item_id: form.item_id, chakka_name: form.chakka_name.trim(), remarks: form.remarks || null };
    const { error } = form.id
      ? await supabase.from('chakka_master').update(payload).eq('id', form.id)
      : await supabase.from('chakka_master').insert(payload);
    if (error) setError(error.message); else setForm(empty);
  };

  return (
    <Panel
      title="Chakka"
      form={form}
      onSave={save}
      onClear={() => setForm(empty)}
      rows={rows}
      onEdit={(r) => setForm({ id: r.id, item_id: r.item_id, chakka_name: r.chakka_name, remarks: r.remarks || '' })}
      onDelete={async (id) => { const { error } = await supabase.from('chakka_master').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'item', label: 'Item', render: (r) => r.items?.item_name },
        { key: 'chakka_name', label: 'Chakka Name' },
      ]}
      fields={
        <>
          <select value={form.item_id} onChange={(e) => setForm((p) => ({ ...p, item_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
            <option value="">Select Item</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.item_name}</option>)}
          </select>
          <input type="text" value={form.chakka_name} onChange={(e) => setForm((p) => ({ ...p, chakka_name: e.target.value }))} placeholder="Chakka Name" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} placeholder="Remarks" className="w-full px-3 py-2 border rounded-md" />
        </>
      }
    />
  );
}

// ---------------- City Master ----------------
function CityMaster({ supabase, setError }) {
  const empty = { id: null, city_name: '', state: '' };
  const [form, setForm] = useState(empty);
  const { rows } = useMaster(supabase, 'cities', '*', setError);

  const save = async () => {
    if (!form.city_name.trim()) return;
    const payload = { city_name: form.city_name.trim(), state: form.state || null };
    const { error } = form.id
      ? await supabase.from('cities').update(payload).eq('id', form.id)
      : await supabase.from('cities').insert(payload);
    if (error) setError(error.message); else setForm(empty);
  };

  return (
    <Panel
      title="City"
      form={form}
      onSave={save}
      onClear={() => setForm(empty)}
      rows={rows}
      onEdit={(r) => setForm({ id: r.id, city_name: r.city_name, state: r.state || '' })}
      onDelete={async (id) => { const { error } = await supabase.from('cities').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'city_name', label: 'City' },
        { key: 'state', label: 'State' },
      ]}
      fields={
        <>
          <input type="text" value={form.city_name} onChange={(e) => setForm((p) => ({ ...p, city_name: e.target.value }))} placeholder="City Name" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} placeholder="State" className="w-full px-3 py-2 border rounded-md" />
        </>
      }
    />
  );
}

// ---------------- Freight Master ----------------
function FreightMaster({ supabase, setError }) {
  const empty = { id: null, from_city_id: '', to_city_id: '', vehicle_type: '', rate: '' };
  const [form, setForm] = useState(empty);
  const [cities, setCities] = useState([]);
  const { rows } = useMaster(supabase, 'freight_master', '*, from:cities!freight_master_from_city_id_fkey(city_name), to:cities!freight_master_to_city_id_fkey(city_name)', setError);

  useEffect(() => {
    supabase.from('cities').select('*').order('id').then(({ data, error }) => {
      if (error) setError(error.message); else setCities(data || []);
    });
  }, [supabase, setError]);

  const save = async () => {
    if (!form.from_city_id || !form.to_city_id || !form.rate) return;
    const payload = { from_city_id: form.from_city_id, to_city_id: form.to_city_id, vehicle_type: form.vehicle_type || null, rate: parseFloat(form.rate) };
    const { error } = form.id
      ? await supabase.from('freight_master').update(payload).eq('id', form.id)
      : await supabase.from('freight_master').insert(payload);
    if (error) setError(error.message); else setForm(empty);
  };

  return (
    <Panel
      title="Freight"
      form={form}
      onSave={save}
      onClear={() => setForm(empty)}
      rows={rows}
      onEdit={(r) => setForm({ id: r.id, from_city_id: r.from_city_id, to_city_id: r.to_city_id, vehicle_type: r.vehicle_type || '', rate: r.rate })}
      onDelete={async (id) => { const { error } = await supabase.from('freight_master').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'from', label: 'From', render: (r) => r.from?.city_name },
        { key: 'to', label: 'To', render: (r) => r.to?.city_name },
        { key: 'vehicle_type', label: 'Vehicle Type' },
        { key: 'rate', label: 'Rate (₹)' },
      ]}
      fields={
        <>
          <select value={form.from_city_id} onChange={(e) => setForm((p) => ({ ...p, from_city_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
            <option value="">From City</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.city_name}</option>)}
          </select>
          <select value={form.to_city_id} onChange={(e) => setForm((p) => ({ ...p, to_city_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
            <option value="">To City</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.city_name}</option>)}
          </select>
          <input type="text" value={form.vehicle_type} onChange={(e) => setForm((p) => ({ ...p, vehicle_type: e.target.value }))} placeholder="Vehicle Type" className="w-full px-3 py-2 border rounded-md" />
          <input type="number" value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))} placeholder="Rate (₹)" className="w-full px-3 py-2 border rounded-md" />
        </>
      }
    />
  );
}

// ---------------- Vehicle Master ----------------
function VehicleMaster({ supabase, setError }) {
  const empty = { id: null, vehicle_number: '', vehicle_type: '', driver_name: '', driver_phone: '', is_active: true };
  const [form, setForm] = useState(empty);
  const { rows } = useMaster(supabase, 'vehicles', '*', setError);

  const save = async () => {
    if (!form.vehicle_number.trim()) return;
    const payload = {
      vehicle_number: form.vehicle_number.trim(), vehicle_type: form.vehicle_type || null,
      driver_name: form.driver_name || null, driver_phone: form.driver_phone || null, is_active: form.is_active,
    };
    const { error } = form.id
      ? await supabase.from('vehicles').update(payload).eq('id', form.id)
      : await supabase.from('vehicles').insert(payload);
    if (error) setError(error.message); else setForm(empty);
  };

  return (
    <Panel
      title="Vehicle"
      form={form}
      onSave={save}
      onClear={() => setForm(empty)}
      rows={rows}
      onEdit={(r) => setForm({ id: r.id, vehicle_number: r.vehicle_number, vehicle_type: r.vehicle_type || '', driver_name: r.driver_name || '', driver_phone: r.driver_phone || '', is_active: r.is_active })}
      onDelete={async (id) => { const { error } = await supabase.from('vehicles').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'vehicle_number', label: 'Vehicle No.' },
        { key: 'vehicle_type', label: 'Type' },
        { key: 'driver_name', label: 'Driver' },
        { key: 'driver_phone', label: 'Phone' },
      ]}
      fields={
        <>
          <input type="text" value={form.vehicle_number} onChange={(e) => setForm((p) => ({ ...p, vehicle_number: e.target.value }))} placeholder="Vehicle Number" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.vehicle_type} onChange={(e) => setForm((p) => ({ ...p, vehicle_type: e.target.value }))} placeholder="Vehicle Type" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.driver_name} onChange={(e) => setForm((p) => ({ ...p, driver_name: e.target.value }))} placeholder="Driver Name" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.driver_phone} onChange={(e) => setForm((p) => ({ ...p, driver_phone: e.target.value }))} placeholder="Driver Phone" className="w-full px-3 py-2 border rounded-md" />
        </>
      }
    />
  );
}

// ---------------- Line/Chamber Master ----------------
function LineChamberMaster({ supabase, setError }) {
  const empty = { id: null, line_number: '', chamber_number: '', capacity: '' };
  const [form, setForm] = useState(empty);
  const { rows } = useMaster(supabase, 'line_chambers', '*', setError);

  const save = async () => {
    if (!form.line_number.trim()) return;
    const payload = { line_number: form.line_number.trim(), chamber_number: form.chamber_number || null, capacity: form.capacity ? parseInt(form.capacity) : null };
    const { error } = form.id
      ? await supabase.from('line_chambers').update(payload).eq('id', form.id)
      : await supabase.from('line_chambers').insert(payload);
    if (error) setError(error.message); else setForm(empty);
  };

  return (
    <Panel
      title="Line/Chamber"
      form={form}
      onSave={save}
      onClear={() => setForm(empty)}
      rows={rows}
      onEdit={(r) => setForm({ id: r.id, line_number: r.line_number, chamber_number: r.chamber_number || '', capacity: r.capacity || '' })}
      onDelete={async (id) => { const { error } = await supabase.from('line_chambers').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'line_number', label: 'Line' },
        { key: 'chamber_number', label: 'Chamber' },
        { key: 'capacity', label: 'Capacity' },
      ]}
      fields={
        <>
          <input type="text" value={form.line_number} onChange={(e) => setForm((p) => ({ ...p, line_number: e.target.value }))} placeholder="Line Number" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.chamber_number} onChange={(e) => setForm((p) => ({ ...p, chamber_number: e.target.value }))} placeholder="Chamber Number" className="w-full px-3 py-2 border rounded-md" />
          <input type="number" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="Capacity" className="w-full px-3 py-2 border rounded-md" />
        </>
      }
    />
  );
}

// ---------------- Location Master ----------------
function LocationMaster({ supabase, setError }) {
  const empty = { id: null, location_name: '', description: '' };
  const [form, setForm] = useState(empty);
  const { rows } = useMaster(supabase, 'locations', '*', setError);

  const save = async () => {
    if (!form.location_name.trim()) return;
    const payload = { location_name: form.location_name.trim(), description: form.description || null };
    const { error } = form.id
      ? await supabase.from('locations').update(payload).eq('id', form.id)
      : await supabase.from('locations').insert(payload);
    if (error) setError(error.message); else setForm(empty);
  };

  return (
    <Panel
      title="Location"
      form={form}
      onSave={save}
      onClear={() => setForm(empty)}
      rows={rows}
      onEdit={(r) => setForm({ id: r.id, location_name: r.location_name, description: r.description || '' })}
      onDelete={async (id) => { const { error } = await supabase.from('locations').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'location_name', label: 'Location' },
        { key: 'description', label: 'Description' },
      ]}
      fields={
        <>
          <input type="text" value={form.location_name} onChange={(e) => setForm((p) => ({ ...p, location_name: e.target.value }))} placeholder="Location Name" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full px-3 py-2 border rounded-md" />
        </>
      }
    />
  );
}

// ---------------- Ledger Master ----------------
function LedgerMaster({ supabase, setError }) {
  const empty = { id: null, ledger_name: '', ledger_type: 'customer', opening_balance: '0', opening_balance_type: 'debit', phone: '', address: '', gst_number: '' };
  const [form, setForm] = useState(empty);
  const { rows } = useMaster(supabase, 'ledgers', '*', setError);

  const save = async () => {
    if (!form.ledger_name.trim()) return;
    const payload = {
      ledger_name: form.ledger_name.trim(), ledger_type: form.ledger_type,
      opening_balance: parseFloat(form.opening_balance) || 0, opening_balance_type: form.opening_balance_type,
      phone: form.phone || null, address: form.address || null, gst_number: form.gst_number || null,
    };
    const { error } = form.id
      ? await supabase.from('ledgers').update(payload).eq('id', form.id)
      : await supabase.from('ledgers').insert(payload);
    if (error) setError(error.message); else setForm(empty);
  };

  return (
    <Panel
      title="Ledger"
      form={form}
      onSave={save}
      onClear={() => setForm(empty)}
      rows={rows}
      onEdit={(r) => setForm({ id: r.id, ledger_name: r.ledger_name, ledger_type: r.ledger_type, opening_balance: r.opening_balance, opening_balance_type: r.opening_balance_type, phone: r.phone || '', address: r.address || '', gst_number: r.gst_number || '' })}
      onDelete={async (id) => { const { error } = await supabase.from('ledgers').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'ledger_name', label: 'Name' },
        { key: 'ledger_type', label: 'Type' },
        { key: 'opening_balance', label: 'Opening Bal.', render: (r) => `₹${r.opening_balance} (${r.opening_balance_type})` },
      ]}
      fields={
        <>
          <input type="text" value={form.ledger_name} onChange={(e) => setForm((p) => ({ ...p, ledger_name: e.target.value }))} placeholder="Ledger Name" className="w-full px-3 py-2 border rounded-md" />
          <select value={form.ledger_type} onChange={(e) => setForm((p) => ({ ...p, ledger_type: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="expense">Expense</option>
            <option value="labour">Labour</option>
            <option value="other">Other</option>
          </select>
          <input type="number" value={form.opening_balance} onChange={(e) => setForm((p) => ({ ...p, opening_balance: e.target.value }))} placeholder="Opening Balance" className="w-full px-3 py-2 border rounded-md" />
          <select value={form.opening_balance_type} onChange={(e) => setForm((p) => ({ ...p, opening_balance_type: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
          <input type="text" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Address" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.gst_number} onChange={(e) => setForm((p) => ({ ...p, gst_number: e.target.value }))} placeholder="GST Number" className="w-full px-3 py-2 border rounded-md" />
        </>
      }
    />
  );
}

// ---------------- GST Tax Category + Class ----------------
function GstTaxMaster({ supabase, setError }) {
  const [mode, setMode] = useState('category');
  const emptyCat = { id: null, category_name: '' };
  const emptyClass = { id: null, class_name: '', category_id: '', rate_percent: '' };
  const [catForm, setCatForm] = useState(emptyCat);
  const [classForm, setClassForm] = useState(emptyClass);
  const { rows: cats } = useMaster(supabase, 'gst_tax_categories', '*', setError);
  const { rows: classes } = useMaster(supabase, 'gst_tax_classes', '*, gst_tax_categories(category_name)', setError);

  const saveCat = async () => {
    if (!catForm.category_name.trim()) return;
    const payload = { category_name: catForm.category_name.trim() };
    const { error } = catForm.id
      ? await supabase.from('gst_tax_categories').update(payload).eq('id', catForm.id)
      : await supabase.from('gst_tax_categories').insert(payload);
    if (error) setError(error.message); else setCatForm(emptyCat);
  };

  const saveClass = async () => {
    if (!classForm.class_name.trim() || !classForm.category_id) return;
    const payload = { class_name: classForm.class_name.trim(), category_id: classForm.category_id, rate_percent: parseFloat(classForm.rate_percent) || 0 };
    const { error } = classForm.id
      ? await supabase.from('gst_tax_classes').update(payload).eq('id', classForm.id)
      : await supabase.from('gst_tax_classes').insert(payload);
    if (error) setError(error.message); else setClassForm(emptyClass);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('category')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${mode === 'category' ? 'bg-red-800 text-white' : 'bg-gray-100'}`}>Tax Category</button>
        <button onClick={() => setMode('class')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${mode === 'class' ? 'bg-red-800 text-white' : 'bg-gray-100'}`}>Tax Class</button>
      </div>

      {mode === 'category' && (
        <Panel
          title="GST Category"
          form={catForm}
          onSave={saveCat}
          onClear={() => setCatForm(emptyCat)}
          rows={cats}
          onEdit={(r) => setCatForm({ id: r.id, category_name: r.category_name })}
          onDelete={async (id) => { const { error } = await supabase.from('gst_tax_categories').delete().eq('id', id); if (error) setError(error.message); }}
          columns={[{ key: 'category_name', label: 'Category Name' }]}
          fields={<input type="text" value={catForm.category_name} onChange={(e) => setCatForm((p) => ({ ...p, category_name: e.target.value }))} placeholder="Category Name" className="w-full px-3 py-2 border rounded-md" />}
        />
      )}

      {mode === 'class' && (
        <Panel
          title="GST Class"
          form={classForm}
          onSave={saveClass}
          onClear={() => setClassForm(emptyClass)}
          rows={classes}
          onEdit={(r) => setClassForm({ id: r.id, class_name: r.class_name, category_id: r.category_id, rate_percent: r.rate_percent })}
          onDelete={async (id) => { const { error } = await supabase.from('gst_tax_classes').delete().eq('id', id); if (error) setError(error.message); }}
          columns={[
            { key: 'class_name', label: 'Class Name' },
            { key: 'category', label: 'Category', render: (r) => r.gst_tax_categories?.category_name },
            { key: 'rate_percent', label: 'Rate %' },
          ]}
          fields={
            <>
              <input type="text" value={classForm.class_name} onChange={(e) => setClassForm((p) => ({ ...p, class_name: e.target.value }))} placeholder="Class Name" className="w-full px-3 py-2 border rounded-md" />
              <select value={classForm.category_id} onChange={(e) => setClassForm((p) => ({ ...p, category_id: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
                <option value="">Select Category</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
              </select>
              <input type="number" value={classForm.rate_percent} onChange={(e) => setClassForm((p) => ({ ...p, rate_percent: e.target.value }))} placeholder="Rate %" className="w-full px-3 py-2 border rounded-md" />
            </>
          }
        />
      )}
    </div>
  );
}

// ---------------- Sale Agent Master ----------------
function SaleAgentMaster({ supabase, setError }) {
  const empty = { id: null, agent_name: '', phone: '', commission_percent: '0', is_active: true };
  const [form, setForm] = useState(empty);
  const { rows } = useMaster(supabase, 'sale_agents', '*', setError);

  const save = async () => {
    if (!form.agent_name.trim()) return;
    const payload = { agent_name: form.agent_name.trim(), phone: form.phone || null, commission_percent: parseFloat(form.commission_percent) || 0, is_active: form.is_active };
    const { error } = form.id
      ? await supabase.from('sale_agents').update(payload).eq('id', form.id)
      : await supabase.from('sale_agents').insert(payload);
    if (error) setError(error.message); else setForm(empty);
  };

  return (
    <Panel
      title="Sale Agent"
      form={form}
      onSave={save}
      onClear={() => setForm(empty)}
      rows={rows}
      onEdit={(r) => setForm({ id: r.id, agent_name: r.agent_name, phone: r.phone || '', commission_percent: r.commission_percent, is_active: r.is_active })}
      onDelete={async (id) => { const { error } = await supabase.from('sale_agents').delete().eq('id', id); if (error) setError(error.message); }}
      columns={[
        { key: 'agent_name', label: 'Agent Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'commission_percent', label: 'Commission %' },
      ]}
      fields={
        <>
          <input type="text" value={form.agent_name} onChange={(e) => setForm((p) => ({ ...p, agent_name: e.target.value }))} placeholder="Agent Name" className="w-full px-3 py-2 border rounded-md" />
          <input type="text" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="w-full px-3 py-2 border rounded-md" />
          <input type="number" value={form.commission_percent} onChange={(e) => setForm((p) => ({ ...p, commission_percent: e.target.value }))} placeholder="Commission %" className="w-full px-3 py-2 border rounded-md" />
        </>
      }
    />
  );
}
