import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Power, KeyRound } from 'lucide-react';
import { createCredentials } from './authUtils';

// ---------- shared little bits ----------

const Card = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-3 py-2 border rounded-md';
const primaryBtn = 'bg-red-700 text-white font-bold py-2 px-4 rounded-md hover:bg-red-800 disabled:opacity-50';

const ErrorBanner = ({ message }) =>
  message ? (
    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md mb-4 text-sm text-red-700 font-semibold">
      ⚠️ {message}
    </div>
  ) : null;

// ---------- generic "simple master" list (Role Master / Manage Branch / Session Setup) ----------

function SimpleMasterList({ supabase, table, nameField, label, extraFields = [] }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ [nameField]: '', ...Object.fromEntries(extraFields.map(f => [f.key, ''])) });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from(table).select('*').order('id');
    if (err) setError(err.message); else setRows(data || []);
    setLoading(false);
  }, [supabase, table]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form[nameField]) return;
    const payload = { ...form, is_active: true };
    const { error: err } = await supabase.from(table).insert(payload);
    if (err) { setError(err.message); return; }
    setForm({ [nameField]: '', ...Object.fromEntries(extraFields.map(f => [f.key, ''])) });
    load();
  };

  const remove = async (id) => {
    const { error: err } = await supabase.from(table).delete().eq('id', id);
    if (err) setError(err.message); else load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title={`Add ${label}`}>
        <div className="space-y-3">
          <Field label={label}>
            <input className={inputCls} value={form[nameField]} onChange={e => setForm(p => ({ ...p, [nameField]: e.target.value }))} placeholder={`Enter ${label.toLowerCase()}`} />
          </Field>
          {extraFields.map(f => (
            <Field key={f.key} label={f.label}>
              <input type={f.type || 'text'} className={inputCls} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </Field>
          ))}
          <button onClick={add} className={`w-full ${primaryBtn}`}>Add {label}</button>
        </div>
      </Card>

      <Card title={`${label} List`} className="lg:col-span-2">
        <ErrorBanner message={error} />
        {loading ? <p className="text-gray-400">Loading...</p> : rows.length === 0 ? <p className="text-gray-400">No records</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">{label}</th>
                {extraFields.map(f => <th key={f.key} className="px-3 py-2 text-left">{f.label}</th>)}
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2">Del</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2 font-semibold">{r[nameField]}</td>
                  {extraFields.map(f => <td key={f.key} className="px-3 py-2">{r[f.key]}</td>)}
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center"><button onClick={() => remove(r.id)} className="text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ---------- Role Master ----------
const RoleMaster = ({ supabase }) => (
  <SimpleMasterList supabase={supabase} table="roles" nameField="role_name" label="Role" />
);

// ---------- Manage Branch ----------
const ManageBranch = ({ supabase }) => (
  <SimpleMasterList
    supabase={supabase}
    table="branches"
    nameField="branch_name"
    label="Branch"
    extraFields={[{ key: 'location', label: 'Location' }]}
  />
);

// ---------- Session Setup ----------
const SessionSetup = ({ supabase }) => (
  <SimpleMasterList
    supabase={supabase}
    table="sessions"
    nameField="session_name"
    label="Session"
    extraFields={[
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' },
    ]}
  />
);

// ---------- Salary Setup ----------
function SalarySetup({ supabase }) {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ roleId: '', employeeName: '', monthlySalary: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data: r } = await supabase.from('roles').select('*').order('id');
    setRoles(r || []);
    const { data, error: err } = await supabase.from('salary_setups').select('*').order('id', { ascending: false });
    if (err) setError(err.message); else setRows(data || []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.employeeName || !form.monthlySalary) return;
    const { error: err } = await supabase.from('salary_setups').insert({
      role_id: form.roleId || null,
      employee_name: form.employeeName,
      monthly_salary: parseFloat(form.monthlySalary),
    });
    if (err) { setError(err.message); return; }
    setForm({ roleId: '', employeeName: '', monthlySalary: '' });
    load();
  };

  const remove = async (id) => {
    const { error: err } = await supabase.from('salary_setups').delete().eq('id', id);
    if (err) setError(err.message); else load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Salary Setup">
        <div className="space-y-3">
          <Field label="Employee Name">
            <input className={inputCls} value={form.employeeName} onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} />
          </Field>
          <Field label="Role">
            <select className={inputCls} value={form.roleId} onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))}>
              <option value="">Select role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
            </select>
          </Field>
          <Field label="Monthly Salary">
            <input type="number" className={inputCls} value={form.monthlySalary} onChange={e => setForm(p => ({ ...p, monthlySalary: e.target.value }))} />
          </Field>
          <button onClick={save} className={`w-full ${primaryBtn}`}>Save Salary Setup</button>
        </div>
      </Card>

      <Card title="Configured Salaries" className="lg:col-span-2">
        <ErrorBanner message={error} />
        {rows.length === 0 ? <p className="text-gray-400">No records</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Employee</th><th className="px-3 py-2 text-left">Role</th><th className="px-3 py-2 text-left">Monthly Salary</th><th className="px-3 py-2">Del</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2 font-semibold">{r.employee_name}</td>
                  <td className="px-3 py-2">{roles.find(role => role.id === r.role_id)?.role_name || '-'}</td>
                  <td className="px-3 py-2 font-bold text-green-700">₹{r.monthly_salary}</td>
                  <td className="px-3 py-2 text-center"><button onClick={() => remove(r.id)} className="text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ---------- Post Salary ----------
function PostSalary({ supabase, userRole }) {
  const [setups, setSetups] = useState([]);
  const [postings, setPostings] = useState([]);
  const [form, setForm] = useState({ salarySetupId: '', month: new Date().toISOString().slice(0, 7), amountPaid: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data: s } = await supabase.from('salary_setups').select('*').order('id');
    setSetups(s || []);
    const { data, error: err } = await supabase.from('salary_postings').select('*').order('id', { ascending: false });
    if (err) setError(err.message); else setPostings(data || []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!form.salarySetupId || !form.amountPaid) return;
    const { error: err } = await supabase.from('salary_postings').insert({
      salary_setup_id: form.salarySetupId,
      month: form.month,
      amount_paid: parseFloat(form.amountPaid),
      posted_by: userRole,
    });
    if (err) { setError(err.message); return; }
    setForm(p => ({ ...p, amountPaid: '' }));
    load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Post Salary">
        <div className="space-y-3">
          <Field label="Employee">
            <select className={inputCls} value={form.salarySetupId} onChange={e => setForm(p => ({ ...p, salarySetupId: e.target.value }))}>
              <option value="">Select employee</option>
              {setups.map(s => <option key={s.id} value={s.id}>{s.employee_name}</option>)}
            </select>
          </Field>
          <Field label="Month">
            <input type="month" className={inputCls} value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))} />
          </Field>
          <Field label="Amount Paid">
            <input type="number" className={inputCls} value={form.amountPaid} onChange={e => setForm(p => ({ ...p, amountPaid: e.target.value }))} />
          </Field>
          <button onClick={post} className={`w-full ${primaryBtn}`}>Post Salary</button>
        </div>
      </Card>

      <Card title="Salary Postings" className="lg:col-span-2">
        <ErrorBanner message={error} />
        {postings.length === 0 ? <p className="text-gray-400">No records</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Employee</th><th className="px-3 py-2 text-left">Month</th><th className="px-3 py-2 text-left">Amount</th><th className="px-3 py-2 text-left">Posted By</th></tr></thead>
            <tbody>
              {postings.map(p => (
                <tr key={p.id} className="border-b">
                  <td className="px-3 py-2 font-semibold">{setups.find(s => s.id === p.salary_setup_id)?.employee_name || '-'}</td>
                  <td className="px-3 py-2">{p.month}</td>
                  <td className="px-3 py-2 font-bold text-green-700">₹{p.amount_paid}</td>
                  <td className="px-3 py-2 text-xs text-blue-600">{p.posted_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ---------- User Management ----------
function UserManagement({ supabase }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ username: '', roleId: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data: r } = await supabase.from('roles').select('*').order('id');
    setRoles(r || []);
    const { data, error: err } = await supabase.from('app_users').select('*').order('id');
    if (err) setError(err.message); else setUsers(data || []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    setError('');
    if (!form.username || !form.password) {
      setError('Username and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    const { salt, passwordHash } = await createCredentials(form.password);
    const { error: err } = await supabase.from('app_users').insert({
      username: form.username,
      role_id: form.roleId || null,
      password_hash: passwordHash,
      password_salt: salt,
      is_active: true,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setForm({ username: '', roleId: '', password: '' });
    load();
  };

  const resetPassword = async (u) => {
    const newPassword = window.prompt(`New password for "${u.username}" (min 6 characters):`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const { salt, passwordHash } = await createCredentials(newPassword);
    const { error: err } = await supabase.from('app_users').update({ password_hash: passwordHash, password_salt: salt }).eq('id', u.id);
    if (err) setError(err.message); else { setError(''); load(); }
  };

  const toggleActive = async (u) => {
    const { error: err } = await supabase.from('app_users').update({ is_active: !u.is_active }).eq('id', u.id);
    if (err) setError(err.message); else load();
  };

  const remove = async (id) => {
    const { error: err } = await supabase.from('app_users').delete().eq('id', id);
    if (err) setError(err.message); else load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Add User">
        <div className="space-y-3">
          <Field label="Username">
            <input className={inputCls} value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
          </Field>
          <Field label="Password">
            <input type="password" className={inputCls} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
          </Field>
          <Field label="Role">
            <select className={inputCls} value={form.roleId} onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))}>
              <option value="">Select role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
            </select>
          </Field>
          <p className="text-xs text-gray-500">Accounts with a role named "Employer" or "Admin" get full access. Any other role gets restricted (Muneem-level) access. This is on top of the built-in employer/muneem logins, which still work.</p>
          <button onClick={add} disabled={saving} className={`w-full ${primaryBtn}`}>{saving ? 'Saving...' : 'Add User'}</button>
        </div>
      </Card>

      <Card title="Users" className="lg:col-span-2">
        <ErrorBanner message={error} />
        {users.length === 0 ? <p className="text-gray-400">No records</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Username</th><th className="px-3 py-2 text-left">Role</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2">Reset PW</th><th className="px-3 py-2">Toggle</th><th className="px-3 py-2">Del</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="px-3 py-2 font-semibold">{u.username}</td>
                  <td className="px-3 py-2">{roles.find(r => r.id === u.role_id)?.role_name || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center"><button onClick={() => resetPassword(u)} className="text-gray-600" title="Reset password"><KeyRound size={16} /></button></td>
                  <td className="px-3 py-2 text-center"><button onClick={() => toggleActive(u)} className="text-blue-600"><Power size={16} /></button></td>
                  <td className="px-3 py-2 text-center"><button onClick={() => remove(u.id)} className="text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ---------- Advance Setting (key/value config) ----------
function AdvanceSetting({ supabase }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ key: '', value: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('advance_settings').select('*').order('id');
    if (err) setError(err.message); else setRows(data || []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.key) return;
    const { error: err } = await supabase.from('advance_settings').upsert(
      { setting_key: form.key, setting_value: form.value },
      { onConflict: 'setting_key' }
    );
    if (err) { setError(err.message); return; }
    setForm({ key: '', value: '' });
    load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Add / Update Setting">
        <div className="space-y-3">
          <Field label="Setting Key"><input className={inputCls} value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="e.g. default_gst_rate" /></Field>
          <Field label="Value"><input className={inputCls} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} /></Field>
          <button onClick={save} className={`w-full ${primaryBtn}`}>Save Setting</button>
        </div>
      </Card>
      <Card title="Advance Settings" className="lg:col-span-2">
        <ErrorBanner message={error} />
        {rows.length === 0 ? <p className="text-gray-400">No settings configured</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Key</th><th className="px-3 py-2 text-left">Value</th></tr></thead>
            <tbody>{rows.map(r => (<tr key={r.id} className="border-b"><td className="px-3 py-2 font-semibold">{r.setting_key}</td><td className="px-3 py-2">{r.setting_value}</td></tr>))}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ---------- Apply New Rates ----------
function ApplyNewRates({ supabase }) {
  const [items, setItems] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ itemId: '', newRate: '', effectiveDate: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data: it } = await supabase.from('items').select('*').order('id');
    setItems(it || []);
    const { data, error: err } = await supabase.from('rate_updates').select('*').order('id', { ascending: false });
    if (err) setError(err.message); else setRows(data || []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const apply = async () => {
    if (!form.itemId || !form.newRate) return;
    const { error: err } = await supabase.from('rate_updates').insert({
      item_id: form.itemId, new_rate: parseFloat(form.newRate), effective_date: form.effectiveDate,
    });
    if (err) { setError(err.message); return; }
    setForm(p => ({ ...p, newRate: '' }));
    load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Apply New Rate">
        <div className="space-y-3">
          <Field label="Item">
            <select className={inputCls} value={form.itemId} onChange={e => setForm(p => ({ ...p, itemId: e.target.value }))}>
              <option value="">Select item</option>
              {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
            </select>
          </Field>
          <Field label="New Rate"><input type="number" className={inputCls} value={form.newRate} onChange={e => setForm(p => ({ ...p, newRate: e.target.value }))} /></Field>
          <Field label="Effective Date"><input type="date" className={inputCls} value={form.effectiveDate} onChange={e => setForm(p => ({ ...p, effectiveDate: e.target.value }))} /></Field>
          <button onClick={apply} className={`w-full ${primaryBtn}`}>Apply Rate</button>
        </div>
      </Card>
      <Card title="Rate History" className="lg:col-span-2">
        <ErrorBanner message={error} />
        {rows.length === 0 ? <p className="text-gray-400">No rate changes yet</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-left">New Rate</th><th className="px-3 py-2 text-left">Effective From</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2 font-semibold">{items.find(it => it.id === r.item_id)?.item_name || '-'}</td>
                  <td className="px-3 py-2 font-bold text-green-700">₹{r.new_rate}</td>
                  <td className="px-3 py-2">{r.effective_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ---------- Update Opening Balance ----------
function UpdateOpeningBalance({ supabase }) {
  const [items, setItems] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ itemId: '', openingQty: '', asOfDate: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data: it } = await supabase.from('items').select('*').order('id');
    setItems(it || []);
    const { data, error: err } = await supabase.from('opening_balances').select('*').order('id', { ascending: false });
    if (err) setError(err.message); else setRows(data || []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.itemId || form.openingQty === '') return;
    const { error: err } = await supabase.from('opening_balances').upsert(
      { item_id: form.itemId, opening_qty: parseFloat(form.openingQty), as_of_date: form.asOfDate },
      { onConflict: 'item_id' }
    );
    if (err) { setError(err.message); return; }
    setForm(p => ({ ...p, openingQty: '' }));
    load();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Update Opening Balance">
        <div className="space-y-3">
          <Field label="Item">
            <select className={inputCls} value={form.itemId} onChange={e => setForm(p => ({ ...p, itemId: e.target.value }))}>
              <option value="">Select item</option>
              {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
            </select>
          </Field>
          <Field label="Opening Quantity"><input type="number" className={inputCls} value={form.openingQty} onChange={e => setForm(p => ({ ...p, openingQty: e.target.value }))} /></Field>
          <Field label="As Of Date"><input type="date" className={inputCls} value={form.asOfDate} onChange={e => setForm(p => ({ ...p, asOfDate: e.target.value }))} /></Field>
          <button onClick={save} className={`w-full ${primaryBtn}`}>Save Opening Balance</button>
        </div>
      </Card>
      <Card title="Opening Balances" className="lg:col-span-2">
        <ErrorBanner message={error} />
        {rows.length === 0 ? <p className="text-gray-400">No records</p> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-left">Opening Qty</th><th className="px-3 py-2 text-left">As Of</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2 font-semibold">{items.find(it => it.id === r.item_id)?.item_name || '-'}</td>
                  <td className="px-3 py-2 font-bold">{r.opening_qty}</td>
                  <td className="px-3 py-2">{r.as_of_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ---------- Set Active / Inactive (roles, branches, items) ----------
function SetActiveInactive({ supabase }) {
  const [entity, setEntity] = useState('roles');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const nameFieldFor = (e) => (e === 'roles' ? 'role_name' : e === 'branches' ? 'branch_name' : 'item_name');

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from(entity).select('*').order('id');
    if (err) setError(err.message); else setRows(data || []);
  }, [supabase, entity]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (row) => {
    const { error: err } = await supabase.from(entity).update({ is_active: !row.is_active }).eq('id', row.id);
    if (err) setError(err.message); else load();
  };

  return (
    <Card title="Set Active / Inactive">
      <div className="mb-4 flex gap-2">
        {[['roles', 'Roles'], ['branches', 'Branches'], ['items', 'Items']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setEntity(key)}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${entity === key ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorBanner message={error} />
      {rows.length === 0 ? <p className="text-gray-400">No records</p> : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2">Toggle</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2 font-semibold">{r[nameFieldFor(entity)]}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 text-center"><button onClick={() => toggle(r)} className="text-blue-600"><Power size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

// ---------- Admin Reports ----------
function AdminReports({ supabase }) {
  const [counts, setCounts] = useState({ roles: 0, branches: 0, users: 0, salarySetups: 0, salaryPostedThisMonth: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const month = new Date().toISOString().slice(0, 7);
      const [roles, branches, users, setups, postings] = await Promise.all([
        supabase.from('roles').select('id', { count: 'exact', head: true }),
        supabase.from('branches').select('id', { count: 'exact', head: true }),
        supabase.from('app_users').select('id', { count: 'exact', head: true }),
        supabase.from('salary_setups').select('id', { count: 'exact', head: true }),
        supabase.from('salary_postings').select('amount_paid').eq('month', month),
      ]);
      const firstErr = [roles, branches, users, setups, postings].find(r => r.error)?.error;
      if (firstErr) { setError(firstErr.message); return; }
      setCounts({
        roles: roles.count || 0,
        branches: branches.count || 0,
        users: users.count || 0,
        salarySetups: setups.count || 0,
        salaryPostedThisMonth: (postings.data || []).reduce((s, r) => s + Number(r.amount_paid || 0), 0),
      });
    };
    load();
  }, [supabase]);

  const cards = [
    ['Roles', counts.roles, 'border-red-700 text-red-800'],
    ['Branches', counts.branches, 'border-blue-500 text-blue-600'],
    ['Users', counts.users, 'border-green-500 text-green-600'],
    ['Salary Setups', counts.salarySetups, 'border-yellow-500 text-yellow-600'],
  ];

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(([label, value, cls]) => (
          <div key={label} className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${cls.split(' ')[0]}`}>
            <p className="text-xs text-gray-500 font-semibold">{label}</p>
            <p className={`text-3xl font-bold ${cls.split(' ')[1]}`}>{value}</p>
          </div>
        ))}
      </div>
      <Card title="This Month's Salary Payout">
        <p className="text-3xl font-bold text-green-700">₹{counts.salaryPostedThisMonth.toLocaleString('en-IN')}</p>
        <p className="text-xs text-gray-500 mt-1">Total posted for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
      </Card>
    </div>
  );
}

// ---------- Main module ----------

export default function AdminModule({ supabase, userRole, subTab, onSubTabChange }) {
  const tabs = [
    ['roleMaster', 'Role Master'],
    ['salarySetup', 'Salary Setup'],
    ['postSalary', 'Post Salary'],
    ['userManagement', 'User Management'],
    ['manageBranch', 'Manage Branch'],
    ['sessionSetup', 'Session Setup'],
    ['advanceSetting', 'Advance Setting'],
    ['adminReports', 'Admin Reports'],
    ['applyNewRates', 'Apply New Rates'],
    ['updateOpeningBalance', 'Update Opening Balance'],
    ['setActiveInactive', 'Set Active Inactive'],
  ];

  const active = subTab || tabs[0][0];

  const renderTab = () => {
    switch (active) {
      case 'roleMaster': return <RoleMaster supabase={supabase} />;
      case 'salarySetup': return <SalarySetup supabase={supabase} />;
      case 'postSalary': return <PostSalary supabase={supabase} userRole={userRole} />;
      case 'userManagement': return <UserManagement supabase={supabase} />;
      case 'manageBranch': return <ManageBranch supabase={supabase} />;
      case 'sessionSetup': return <SessionSetup supabase={supabase} />;
      case 'advanceSetting': return <AdvanceSetting supabase={supabase} />;
      case 'adminReports': return <AdminReports supabase={supabase} />;
      case 'applyNewRates': return <ApplyNewRates supabase={supabase} />;
      case 'updateOpeningBalance': return <UpdateOpeningBalance supabase={supabase} />;
      case 'setActiveInactive': return <SetActiveInactive supabase={supabase} />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => onSubTabChange(key)}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${active === key ? 'bg-red-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}
