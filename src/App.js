import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import MastersModule from './MastersModule';
import ProductionModule from './ProductionModule';
import TransactionModule from './TransactionModule';

// ⚠️ Replace these with your own Supabase project values (Settings → API)
const SUPABASE_URL = 'https://gvmzgkhlgwrmwazbxhzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bXpna2hsZ3dybXdhemJ4aHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTkxOTgsImV4cCI6MjA5ODM5NTE5OH0.X6-x3MlnpIPmuB6XtFDpSh019qlfUVpfGRfjwxWjiFQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Convert a flat list of inventory rows (item_id, stack_number, quantity)
// into the nested { itemId: { stackNumber: qty } } shape the UI expects.
const rowsToInventory = (rows) => {
  const inv = {};
  for (const row of rows) {
    if (!inv[row.item_id]) inv[row.item_id] = {};
    inv[row.item_id][row.stack_number] = row.quantity;
  }
  return inv;
};

// Convert a DB record row into the camelCase shape the UI expects.
const rowToRecord = (r) => ({
  id: r.id,
  type: r.type,
  date: r.date,
  itemId: r.item_id,
  stackNumber: r.stack_number,
  quantity: r.quantity,
  customerName: r.customer_name,
  driverName: r.driver_name,
  slipNumber: r.slip_number,
  soldQuantity: r.sold_quantity,
  totalAmount: r.total_amount,
  addedBy: r.added_by,
});

export default function BrickKilnTracker() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTabs, setActiveSubTabs] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({ production: true, transaction: true, masters: true });
  const [records, setRecords] = useState([]);
  const [inventory, setInventory] = useState({});
  const [items, setItems] = useState([]);

  const [nikashiForm, setNikashiForm] = useState({ itemId: '', stackNumber: '1', quantity: '' });
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadError, setLoadError] = useState('');

  // Load data once logged in, then keep it live-synced via Supabase Realtime
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      const { data: itemRows, error: itemErr } = await supabase.from('items').select('*').order('id');
      if (itemErr) { setLoadError(itemErr.message); return; }
      setItems(itemRows || []);

      const { data: invRows, error: invErr } = await supabase.from('inventory').select('*');
      if (invErr) { setLoadError(invErr.message); return; }
      setInventory(rowsToInventory(invRows || []));

      const { data: recRows, error: recErr } = await supabase
        .from('records')
        .select('*')
        .order('created_at', { ascending: true });
      if (recErr) { setLoadError(recErr.message); return; }
      setRecords((recRows || []).map(rowToRecord));
    };

    loadData();

    const channel = supabase
      .channel('brick-kiln-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn]);

  // Once items load, default the forms to the first item (only if unset)
  useEffect(() => {
    if (items.length === 0) return;
    const firstId = items[0].id;
    setNikashiForm(p => p.itemId ? p : { ...p, itemId: firstId });
  }, [items]);

  const itemName = (id) => items.find(it => it.id === id)?.item_name || 'Unknown';

  // Upsert a single inventory row (item + stack) to a given quantity
  const upsertInventory = async (itemId, stack, quantity) => {
    const { error } = await supabase
      .from('inventory')
      .upsert(
        { item_id: itemId, stack_number: parseInt(stack), quantity },
        { onConflict: 'item_id,stack_number' }
      );
    if (error) setLoadError(error.message);
  };

  const handleLogin = () => {
    setLoginError('');
    if (!username || !password) {
      setLoginError('Please enter username and password');
      return;
    }

    if (username === 'employer' && password === 'employer123') {
      setIsLoggedIn(true);
      setUserRole('employer');
      setActiveTab('dashboard');
    } else if (username === 'muneem' && password === 'muneem123') {
      setIsLoggedIn(true);
      setUserRole('muneem');
      setActiveTab('dashboard');
    } else {
      setLoginError('❌ Invalid username or password');
    }

    setUsername('');
    setPassword('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  const handleAddNikashi = async () => {
    if (!nikashiForm.quantity || !nikashiForm.itemId) return;
    const qty = parseInt(nikashiForm.quantity);
    const stack = nikashiForm.stackNumber;
    const itemId = nikashiForm.itemId;
    const current = inventory[itemId]?.[stack] || 0;

    await upsertInventory(itemId, stack, current + qty);

    const { error } = await supabase.from('records').insert({
      type: 'nikashi', date: selectedDate,
      item_id: itemId, stack_number: parseInt(stack), quantity: qty, added_by: userRole
    });
    if (error) setLoadError(error.message);

    setNikashiForm(p => ({ itemId: p.itemId, stackNumber: '1', quantity: '' }));
  };

  const deleteRecord = async (id) => {
    const { error } = await supabase.from('records').delete().eq('id', id);
    if (error) setLoadError(error.message);
  };

  const saveDataToFile = () => {
    const data = { records, inventory, exportDate: new Date().toLocaleString(), exportedBy: userRole };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup-${userRole}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadDataFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setRecords(data.records || []);
        setInventory(data.inventory || {});
        alert('✅ Data loaded from: ' + (data.exportedBy || 'unknown'));
      } catch (err) {
        alert('❌ Error loading file');
      }
    };
    reader.readAsText(file);
  };

  const todayNikashi = records.filter(r => r.date === selectedDate && r.type === 'nikashi');
  const allSales = records.filter(r => r.type === 'sales');
  const allNikashi = records.filter(r => r.type === 'nikashi');

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-red-800 mb-2">🧱 Brick Kiln Pro</h1>
            <p className="text-gray-600">Production & Sales Management</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="Enter username" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="Enter password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700" />
            </div>

            {loginError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{loginError}</p></div>}

            <button onClick={handleLogin} className="w-full bg-gradient-to-r from-red-500 to-red-500 text-white font-bold py-3 rounded-lg hover:from-red-600 hover:to-red-600">Login</button>

          </div>


        </div>
      </div>
    );
  }

  const menuSections = [
    { key: 'dashboard', type: 'leaf', label: '🏠 Dashboard' },
    { key: 'production', type: 'group', label: '🔥 Production', children: [
        ['rawMaterial', '🪨 Raw Material'], ['pathai', '🧱 Pathai'], ['kachiBharai', '🔥 Kachi Bharai'],
        ['jalai', '🔥 Jalai'], ['nikasi', '📤 Nikasi'], ['wastage', '⚠️ Wastage'],
      ] },
    { key: 'nikashi', type: 'leaf', label: '🏭 Nikashi (Pakki Bharai)' },
    { key: 'transaction', type: 'group', label: '🛒 Transaction', children: [
        ['purchase', '🛒 Purchase'], ['sale', '💰 Sale'], ['stockAdjustment', '📦 Stock Adjustment'],
        ['issueReturn', '🔁 Issue/Return'], ['creditLedger', '📒 Credit Ledger Work'],
        ['creditVehicle', '🚚 Credit Vehicle Work'], ['orders', '🧾 Orders'],
        ['absentVoucher', '🙅 Absent Voucher'], ['miscSale', '🧺 Misc Sale'],
      ] },
    ...(userRole === 'employer' ? [
      { key: 'masters', type: 'group', label: '📋 Masters', children: [
          ['item', 'Item'], ['chakka', 'Chakka'], ['city', 'City'], ['freight', 'Freight'],
          ['vehicle', 'Vehicle'], ['lineChamber', 'Line/Chamber'], ['location', 'Location'],
          ['ledger', 'Ledger'], ['gst', 'GST Tax'], ['saleAgent', 'Sale Agent'],
        ] },
      { key: 'reports', type: 'leaf', label: '📊 Reports' },
    ] : []),
  ];

  const currentLabel = (() => {
    for (const section of menuSections) {
      if (section.key === activeTab) return section.label;
      if (section.type === 'group' && section.children) {
        const match = section.children.find(([k]) => k === activeSubTabs[section.key]);
        if (section.key === activeTab && match) return `${section.label} / ${match[1]}`;
      }
    }
    return '🧱 Brick Kiln Pro';
  })();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-72 bg-red-800 text-white flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-red-700">
          <h1 className="text-xl font-bold">🧱 Brick Kiln Pro</h1>
          <p className="text-red-200 text-xs mt-1">{userRole === 'employer' ? '👨‍💼 Employer' : '📊 Muneem'}</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {menuSections.map((section) => (
            <div key={section.key}>
              {section.type === 'leaf' ? (
                <button
                  onClick={() => setActiveTab(section.key)}
                  className={`w-full text-left px-5 py-3 text-sm font-semibold ${activeTab === section.key ? 'bg-red-900' : 'hover:bg-red-700'}`}
                >
                  {section.label}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setExpandedGroups((p) => ({ ...p, [section.key]: !p[section.key] }))}
                    className={`w-full flex justify-between items-center px-5 py-3 text-sm font-semibold ${activeTab === section.key ? 'bg-red-900' : 'hover:bg-red-700'}`}
                  >
                    <span>{section.label}</span>
                    <span className="text-xs">{expandedGroups[section.key] ? '▲' : '▼'}</span>
                  </button>
                  {expandedGroups[section.key] && (
                    <div className="bg-red-900/40">
                      {section.children.map(([subKey, subLabel]) => (
                        <button
                          key={subKey}
                          onClick={() => {
                            setActiveTab(section.key);
                            setActiveSubTabs((p) => ({ ...p, [section.key]: subKey }));
                          }}
                          className={`w-full text-left pl-9 pr-5 py-2 text-xs ${activeTab === section.key && activeSubTabs[section.key] === subKey ? 'bg-red-950 text-white font-bold' : 'text-red-100 hover:bg-red-700'}`}
                        >
                          {subLabel}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-red-700">
          <button onClick={handleLogout} className="w-full bg-red-950 hover:bg-black text-white px-4 py-2 rounded-lg font-bold text-sm">🚪 Logout</button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">{currentLabel}</h2>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loadError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
              <p className="font-bold text-red-700">⚠️ Sync error: {loadError}</p>
              <p className="text-xs text-red-600">Check your Supabase URL/key and table setup.</p>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-700">
                <p className="text-xs text-gray-500 font-semibold">Items in Master</p>
                <p className="text-3xl font-bold text-red-800">{items.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
                <p className="text-xs text-gray-500 font-semibold">Total Sold</p>
                <p className="text-3xl font-bold text-blue-600">{allSales.reduce((s, r) => s + r.soldQuantity, 0)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
                <p className="text-xs text-gray-500 font-semibold">Total Nikashi</p>
                <p className="text-3xl font-bold text-green-600">{allNikashi.reduce((s, r) => s + r.quantity, 0)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-yellow-500">
                <p className="text-xs text-gray-500 font-semibold">Today's Nikashi Entries</p>
                <p className="text-3xl font-bold text-yellow-600">{todayNikashi.length}</p>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-600 p-4 rounded-lg mb-6">
            <p className="font-bold text-blue-800 mb-3">💾 Sync Data (Download & Load Backups)</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={saveDataToFile} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 font-semibold text-sm">📥 Download My Data</button>
              <label className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 font-semibold text-sm cursor-pointer">📤 Load Partner's Data<input type="file" accept=".json" onChange={loadDataFromFile} className="hidden" /></label>
              <p className="text-xs text-blue-700 self-center">👉 Muneem: Download daily. Employer: Load muneem's backup file</p>
            </div>
          </div>

          {activeTab === 'nikashi' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6"><h2 className="text-xl font-bold mb-4">Add Nikashi</h2>
                <div className="space-y-3">
                  <select value={nikashiForm.itemId} onChange={e => setNikashiForm(p => ({ ...p, itemId: e.target.value }))} className="w-full px-3 py-2 border rounded-md">{items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}</select>
                  <input type="number" value={nikashiForm.stackNumber} onChange={e => setNikashiForm(p => ({ ...p, stackNumber: e.target.value }))} placeholder="Stack No" className="w-full px-3 py-2 border rounded-md" />
                  <input type="number" value={nikashiForm.quantity} onChange={e => setNikashiForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Qty" className="w-full px-3 py-2 border rounded-md" />
                  <button onClick={handleAddNikashi} className="w-full bg-red-700 text-white font-bold py-2 rounded-md">Add</button>
                </div>
              </div>
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                {todayNikashi.length === 0 ? <p className="text-gray-400">No records</p> : (
                  <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Stack</th><th className="px-3 py-2 text-left">Qty</th><th className="px-3 py-2 text-left">Added By</th><th className="px-3 py-2">Del</th></tr></thead>
                    <tbody>{todayNikashi.map(r => (<tr key={r.id} className="border-b"><td className="px-3 py-2">{itemName(r.itemId)}</td><td className="px-3 py-2">S{r.stackNumber}</td><td className="px-3 py-2 font-bold">{r.quantity}</td><td className="px-3 py-2 text-xs text-blue-600">{r.addedBy}</td><td className="px-3 py-2"><button onClick={() => deleteRecord(r.id)} className="text-red-500"><Trash2 size={16} /></button></td></tr>))}</tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transaction' && (
            <TransactionModule supabase={supabase} userRole={userRole} subTab={activeSubTabs.transaction} onSubTabChange={(k) => setActiveSubTabs((p) => ({ ...p, transaction: k }))} />
          )}

          {activeTab === 'production' && (
            <ProductionModule supabase={supabase} userRole={userRole} subTab={activeSubTabs.production} onSubTabChange={(k) => setActiveSubTabs((p) => ({ ...p, production: k }))} />
          )}

          {activeTab === 'masters' && userRole === 'employer' && (
            <MastersModule supabase={supabase} subTab={activeSubTabs.masters} onSubTabChange={(k) => setActiveSubTabs((p) => ({ ...p, masters: k }))} />
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Reports</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div><h3 className="text-lg font-bold mb-4">Nikashi</h3>{items.map(it => {
                  const total = allNikashi.filter(r => r.itemId === it.id).reduce((s, r) => s + r.quantity, 0);
                  return <div key={it.id} className="flex justify-between p-2 bg-gray-50 rounded"><span>{it.item_name}</span><span className="font-bold text-red-800">{total}</span></div>;
                })}</div>
                {allSales.length > 0 && <div><h3 className="text-lg font-bold mb-4">Sales</h3><div className="space-y-3"><div className="p-3 bg-blue-50 rounded"><p className="text-xs">Sold</p><p className="text-3xl font-bold text-blue-600">{allSales.reduce((s, r) => s + r.soldQuantity, 0)}</p></div></div></div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
