import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ Replace these with your own Supabase project values (Settings → API)
const SUPABASE_URL = 'https://gvmzgkhlgwrmwazbxhzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bXpna2hsZ3dybXdhemJ4aHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTkxOTgsImV4cCI6MjA5ODM5NTE5OH0.X6-x3MlnpIPmuB6XtFDpSh019qlfUVpfGRfjwxWjiFQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BRICK_TYPES = ['Awwal', 'Dara', 'Dom', 'Tile', 'Khinger'];

// Convert a flat list of inventory rows (brick_type, stack_number, quantity)
// into the nested { brickType: { stackNumber: qty } } shape the UI expects.
const rowsToInventory = (rows) => {
  const inv = {};
  for (const row of rows) {
    if (!inv[row.brick_type]) inv[row.brick_type] = {};
    inv[row.brick_type][row.stack_number] = row.quantity;
  }
  return inv;
};

// Convert a DB record row into the camelCase shape the UI expects.
const rowToRecord = (r) => ({
  id: r.id,
  type: r.type,
  date: r.date,
  brickType: r.brick_type,
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

  const [activeTab, setActiveTab] = useState('inventory');
  const [records, setRecords] = useState([]);
  const [inventory, setInventory] = useState({});

  const [nikashiForm, setNikashiForm] = useState({ brickType: 'Awwal', stackNumber: '1', quantity: '' });
  const [salesForm, setSalesForm] = useState({
    date: new Date().toISOString().split('T')[0],
    customerName: '', driverName: '', slipNumber: '', brickType: 'Awwal', stackNumber: '',
    soldQuantity: '', salePrice: ''
  });
  const [inventoryAdjustForm, setInventoryAdjustForm] = useState({ brickType: 'Awwal', stackNumber: '', quantity: '' });
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadError, setLoadError] = useState('');

  // Load data once logged in, then keep it live-synced via Supabase Realtime
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn]);

  // Upsert a single inventory row (brick type + stack) to a given quantity
  const upsertInventory = async (type, stack, quantity) => {
    const { error } = await supabase
      .from('inventory')
      .upsert(
        { brick_type: type, stack_number: parseInt(stack), quantity },
        { onConflict: 'brick_type,stack_number' }
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
      setActiveTab('inventory');
    } else if (username === 'muneem' && password === 'muneem123') {
      setIsLoggedIn(true);
      setUserRole('muneem');
      setActiveTab('nikashi');
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
    if (!nikashiForm.quantity) return;
    const qty = parseInt(nikashiForm.quantity);
    const stack = nikashiForm.stackNumber;
    const type = nikashiForm.brickType;
    const current = inventory[type]?.[stack] || 0;

    await upsertInventory(type, stack, current + qty);

    const { error } = await supabase.from('records').insert({
      type: 'nikashi', date: selectedDate,
      brick_type: type, stack_number: parseInt(stack), quantity: qty, added_by: userRole
    });
    if (error) setLoadError(error.message);

    setNikashiForm({ brickType: 'Awwal', stackNumber: '1', quantity: '' });
  };

  const handleAddSales = async () => {
    if (!salesForm.customerName || !salesForm.slipNumber || !salesForm.soldQuantity || !salesForm.stackNumber) return;

    const qty = parseInt(salesForm.soldQuantity);
    const stack = salesForm.stackNumber;
    const type = salesForm.brickType;
    const available = inventory[type]?.[stack] || 0;

    if (qty > available) return;

    await upsertInventory(type, stack, available - qty);

    const { error } = await supabase.from('records').insert({
      type: 'sales', date: salesForm.date,
      customer_name: salesForm.customerName, driver_name: salesForm.driverName, slip_number: salesForm.slipNumber,
      brick_type: type, stack_number: parseInt(stack), sold_quantity: qty,
      total_amount: salesForm.salePrice ? (qty / 1000) * parseFloat(salesForm.salePrice) : null, added_by: userRole
    });
    if (error) setLoadError(error.message);

    setSalesForm({ date: new Date().toISOString().split('T')[0], customerName: '', driverName: '', slipNumber: '', brickType: 'Awwal', stackNumber: '', soldQuantity: '', salePrice: '' });
  };

  const handleInventoryAdjust = async () => {
    if (!inventoryAdjustForm.quantity || !inventoryAdjustForm.stackNumber) return;
    const qty = parseInt(inventoryAdjustForm.quantity);
    const stack = inventoryAdjustForm.stackNumber;
    const type = inventoryAdjustForm.brickType;
    const current = inventory[type]?.[stack] || 0;
    if (current + qty < 0) return;

    await upsertInventory(type, stack, current + qty);
    setInventoryAdjustForm({ brickType: 'Awwal', stackNumber: '', quantity: '' });
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

  const totalByType = (type) => Object.values(inventory[type] || {}).reduce((s, q) => s + q, 0);
  const todayNikashi = records.filter(r => r.date === selectedDate && r.type === 'nikashi');
  const todaySales = records.filter(r => r.date === selectedDate && r.type === 'sales');
  const allSales = records.filter(r => r.type === 'sales');
  const allNikashi = records.filter(r => r.type === 'nikashi');

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-600 mb-2">🧱 Brick Kiln Pro</h1>
            <p className="text-gray-600">Production & Sales Management</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="Enter username" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="Enter password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            {loginError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{loginError}</p></div>}

            <button onClick={handleLogin} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-lg hover:from-orange-600 hover:to-red-600">Login</button>

          </div>


        </div>
      </div>
    );
  }

  const tabList = userRole === 'employer' 
    ? [['inventory','📦 Inventory'],['nikashi','🏭 Nikashi'],['sales','💰 Sales'],['reports','📊 Reports']]
    : [['nikashi','🏭 Nikashi'],['sales','💰 Sales']];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">🧱 Brick Kiln Pro</h1>
            <p className="text-orange-100">{userRole === 'employer' ? '👨‍💼 Employer Dashboard' : '📊 Muneem Dashboard'}</p>
          </div>
          <button onClick={handleLogout} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-bold">🚪 Logout</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loadError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
            <p className="font-bold text-red-700">⚠️ Sync error: {loadError}</p>
            <p className="text-xs text-red-600">Check your Supabase URL/key and table setup.</p>
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

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabList.map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap ${activeTab === key ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'inventory' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6"><h2 className="text-xl font-bold mb-4">Adjust Inventory</h2>
              <div className="space-y-3">
                <select value={inventoryAdjustForm.brickType} onChange={e => setInventoryAdjustForm(p => ({ ...p, brickType: e.target.value }))} className="w-full px-3 py-2 border rounded-md">{BRICK_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                <input type="number" value={inventoryAdjustForm.stackNumber} onChange={e => setInventoryAdjustForm(p => ({ ...p, stackNumber: e.target.value }))} placeholder="Stack No" className="w-full px-3 py-2 border rounded-md" />
                <input type="number" value={inventoryAdjustForm.quantity} onChange={e => setInventoryAdjustForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Qty" className="w-full px-3 py-2 border rounded-md" />
                <button onClick={handleInventoryAdjust} className="w-full bg-purple-500 text-white font-bold py-2 rounded-md">Adjust</button>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-5 gap-2">
                {BRICK_TYPES.map(type => {
                  const total = totalByType(type);
                  return <div key={type} className={`p-3 rounded-lg border-2 ${total === 0 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}><p className="text-xs font-bold">{type}</p><p className={`text-2xl font-bold ${total === 0 ? 'text-red-600' : 'text-green-600'}`}>{total}</p></div>;
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nikashi' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6"><h2 className="text-xl font-bold mb-4">Add Nikashi</h2>
              <div className="space-y-3">
                <select value={nikashiForm.brickType} onChange={e => setNikashiForm(p => ({ ...p, brickType: e.target.value }))} className="w-full px-3 py-2 border rounded-md">{BRICK_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                <input type="number" value={nikashiForm.stackNumber} onChange={e => setNikashiForm(p => ({ ...p, stackNumber: e.target.value }))} placeholder="Stack No" className="w-full px-3 py-2 border rounded-md" />
                <input type="number" value={nikashiForm.quantity} onChange={e => setNikashiForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Qty" className="w-full px-3 py-2 border rounded-md" />
                <button onClick={handleAddNikashi} className="w-full bg-orange-500 text-white font-bold py-2 rounded-md">Add</button>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              {todayNikashi.length === 0 ? <p className="text-gray-400">No records</p> : (
                <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Stack</th><th className="px-3 py-2 text-left">Qty</th><th className="px-3 py-2 text-left">Added By</th><th className="px-3 py-2">Del</th></tr></thead>
                  <tbody>{todayNikashi.map(r => (<tr key={r.id} className="border-b"><td className="px-3 py-2">{r.brickType}</td><td className="px-3 py-2">S{r.stackNumber}</td><td className="px-3 py-2 font-bold">{r.quantity}</td><td className="px-3 py-2 text-xs text-blue-600">{r.addedBy}</td><td className="px-3 py-2"><button onClick={() => deleteRecord(r.id)} className="text-red-500"><Trash2 size={16} /></button></td></tr>))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6"><h2 className="text-xl font-bold mb-4">Record Sale</h2>
              <div className="space-y-3">
                <input type="date" value={salesForm.date} onChange={e => setSalesForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                <input type="text" value={salesForm.customerName} onChange={e => setSalesForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Customer" className="w-full px-3 py-2 border rounded-md" />
                <input type="text" value={salesForm.driverName} onChange={e => setSalesForm(p => ({ ...p, driverName: e.target.value }))} placeholder="Driver" className="w-full px-3 py-2 border rounded-md" />
                <input type="text" value={salesForm.slipNumber} onChange={e => setSalesForm(p => ({ ...p, slipNumber: e.target.value }))} placeholder="Slip #" className="w-full px-3 py-2 border rounded-md" />
                <select value={salesForm.brickType} onChange={e => setSalesForm(p => ({ ...p, brickType: e.target.value }))} className="w-full px-3 py-2 border rounded-md">{BRICK_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                <select value={salesForm.stackNumber} onChange={e => setSalesForm(p => ({ ...p, stackNumber: e.target.value }))} className="w-full px-3 py-2 border rounded-md"><option value="">Stack</option>{Object.entries(inventory[salesForm.brickType] || {}).filter(([, qty]) => qty > 0).map(([stack, qty]) => <option key={stack} value={stack}>S{stack}</option>)}</select>
                <input type="number" value={salesForm.soldQuantity} onChange={e => setSalesForm(p => ({ ...p, soldQuantity: e.target.value }))} placeholder="Qty" className="w-full px-3 py-2 border rounded-md" />
                <input type="number" value={salesForm.salePrice} onChange={e => setSalesForm(p => ({ ...p, salePrice: e.target.value }))} placeholder="₹/1000" className="w-full px-3 py-2 border rounded-md" />
                <button onClick={handleAddSales} className="w-full bg-green-500 text-white font-bold py-2 rounded-md">Record</button>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              {todaySales.length === 0 ? <p className="text-gray-400">No sales</p> : (
                <table className="w-full text-xs"><thead className="bg-gray-50"><tr><th className="px-2 py-2 text-left">Customer</th><th className="px-2 py-2 text-left">Qty</th><th className="px-2 py-2 text-left">Added By</th><th className="px-2 py-2">Del</th></tr></thead>
                  <tbody>{todaySales.map(r => (<tr key={r.id} className="border-b"><td className="px-2 py-2">{r.customerName}</td><td className="px-2 py-2">{r.soldQuantity}</td><td className="px-2 py-2 text-blue-600">{r.addedBy}</td><td className="px-2 py-2"><button onClick={() => deleteRecord(r.id)} className="text-red-500"><Trash2 size={14} /></button></td></tr>))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Reports</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div><h3 className="text-lg font-bold mb-4">Nikashi</h3>{BRICK_TYPES.map(type => {
                const total = allNikashi.filter(r => r.brickType === type).reduce((s, r) => s + r.quantity, 0);
                return <div key={type} className="flex justify-between p-2 bg-gray-50 rounded"><span>{type}</span><span className="font-bold text-orange-600">{total}</span></div>;
              })}</div>
              {allSales.length > 0 && <div><h3 className="text-lg font-bold mb-4">Sales</h3><div className="space-y-3"><div className="p-3 bg-blue-50 rounded"><p className="text-xs">Sold</p><p className="text-3xl font-bold text-blue-600">{allSales.reduce((s, r) => s + r.soldQuantity, 0)}</p></div></div></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}