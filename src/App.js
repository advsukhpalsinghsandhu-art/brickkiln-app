import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import MastersModule from './MastersModule';
import ProductionModule from './ProductionModule';
import TransactionModule from './TransactionModule';
import FinancialModule from './FinancialModule';
import InitialSettingsModule from './InitialSettingsModule';
import ReportsModule from './ReportsModule';
import AdminModule from './AdminModule';
import { verifyPassword } from './authUtils';

// ⚠️ Replace these with your own Supabase project values (Settings → API)
const SUPABASE_URL = 'https://gvmzgkhlgwrmwazbxhzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bXpna2hsZ3dybXdhemJ4aHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTkxOTgsImV4cCI6MjA5ODM5NTE5OH0.X6-x3MlnpIPmuB6XtFDpSh019qlfUVpfGRfjwxWjiFQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// General UI text, keyed by language
const translations = {
  en: {
    appTitle: '🧱 Brick Kiln Pro',
    tagline: 'Production & Sales Management',
    username: 'Username',
    password: 'Password',
    enterUsername: 'Enter username',
    enterPassword: 'Enter password',
    login: 'Login',
    pleaseEnterCreds: 'Please enter username and password',
    invalidCreds: '❌ Invalid username or password',
    employer: '👨‍💼 Employer',
    muneem: '📊 Muneem',
    logout: '🚪 Logout',
    syncError: '⚠️ Sync error:',
    checkSupabase: 'Check your Supabase URL/key and table setup.',
    itemsInMaster: 'Items in Master',
    totalSold: 'Total Sold',
    totalNikashi: 'Total Nikashi',
    todayNikashiEntries: "Today's Nikashi Entries",
    syncDataTitle: '💾 Sync Data (Download & Load Backups)',
    downloadMyData: '📥 Download My Data',
    loadPartnerData: "📤 Load Partner's Data",
    syncHint: "👉 Muneem: Download daily. Employer: Load muneem's backup file",
    addNikashi: 'Add Nikashi (Pakki Bharai)',
    stackNo: 'Stack No',
    qty: 'Qty',
    add: 'Add',
    noRecords: 'No records',
    tableType: 'Type',
    tableStack: 'Stack',
    tableQty: 'Qty',
    tableAddedBy: 'Added By',
    tableDel: 'Del',
    dataLoadedFrom: '✅ Data loaded from: ',
    errorLoadingFile: '❌ Error loading file',
    unknown: 'unknown',
    pathaiTitle: 'Pathai',
    voucherNo: 'Voucher No',
    date: 'Date',
    locationName: 'Location Name',
    remarks: 'Remarks',
    enterPathaiDetail: 'Enter Pathai Detail',
    sr: 'Sr',
    patherName: 'Pather Name',
    bricks: 'Bricks',
    tiles: 'Tiles',
    agentName: 'Agent Name',
    addRow: '+ Add Row',
    total: 'Total',
    katQty: 'Kat Qty',
    netQty: 'Net Qty',
    items: 'Items',
    save: 'Save',
    modify: 'Modify',
    delete: 'Delete',
    filter: 'Filter...',
    clear: 'Clear',
    returnBtn: 'Return',
    first: 'First',
    next: 'Next',
    previous: 'Previous',
    last: 'Last',
    find: 'Find...',
    list: 'List...',
    gherNo: 'Gher No',
    itemName: 'Item Name',
    chakkeWiseDetail: 'Chakke Wise Nikasi Detail',
    chakkaNo: 'Chakka No',
    qtyHeapedUp: 'Qty Heaped Up',
    labourWise: 'Labour Wise',
    labourerName: 'Labourer Name',
    pawaDetail: 'Pawa Detail',
    totalNikasi: 'Total Nikasi',
    newVoucher: 'New',
    oilUsageTitle: 'Oil Usage',
    enterOilDetail: 'Enter Oil Usage Detail',
    vehicleName: 'Vehicle',
    ledgerNameLabel: 'Ledger / Supplier',
    rate: 'Rate',
    amount: 'Amount',
    totalQuantity: 'Total Quantity',
    totalAmount: 'Total Amount',
    odometer: 'Odometer',
  },
  pa: {
    appTitle: '🧱 ਇੱਟ ਭੱਠਾ ਪ੍ਰੋ',
    tagline: 'ਉਤਪਾਦਨ ਅਤੇ ਵਿਕਰੀ ਪ੍ਰਬੰਧਨ',
    username: 'ਯੂਜ਼ਰਨੇਮ',
    password: 'ਪਾਸਵਰਡ',
    enterUsername: 'ਯੂਜ਼ਰਨੇਮ ਦਰਜ ਕਰੋ',
    enterPassword: 'ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ',
    login: 'ਲੌਗਇਨ',
    pleaseEnterCreds: 'ਕਿਰਪਾ ਕਰਕੇ ਯੂਜ਼ਰਨੇਮ ਅਤੇ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ',
    invalidCreds: '❌ ਗਲਤ ਯੂਜ਼ਰਨੇਮ ਜਾਂ ਪਾਸਵਰਡ',
    employer: '👨‍💼 ਮਾਲਕ',
    muneem: '📊 ਮੁਨੀਮ',
    logout: '🚪 ਲੌਗਆਊਟ',
    syncError: '⚠️ ਸਿੰਕ ਗਲਤੀ:',
    checkSupabase: 'ਆਪਣਾ Supabase URL/ਕੁੰਜੀ ਅਤੇ ਟੇਬਲ ਸੈੱਟਅੱਪ ਚੈੱਕ ਕਰੋ।',
    itemsInMaster: 'ਮਾਸਟਰ ਵਿੱਚ ਆਈਟਮਾਂ',
    totalSold: 'ਕੁੱਲ ਵਿਕਰੀ',
    totalNikashi: 'ਕੁੱਲ ਨਿਕਾਸੀ',
    todayNikashiEntries: 'ਅੱਜ ਦੀਆਂ ਨਿਕਾਸੀ ਐਂਟਰੀਆਂ',
    syncDataTitle: '💾 ਡਾਟਾ ਸਿੰਕ ਕਰੋ (ਬੈਕਅੱਪ ਡਾਊਨਲੋਡ ਅਤੇ ਲੋਡ ਕਰੋ)',
    downloadMyData: '📥 ਮੇਰਾ ਡਾਟਾ ਡਾਊਨਲੋਡ ਕਰੋ',
    loadPartnerData: '📤 ਪਾਰਟਨਰ ਦਾ ਡਾਟਾ ਲੋਡ ਕਰੋ',
    syncHint: 'ਮੁਨੀਮ: ਰੋਜ਼ਾਨਾ ਡਾਊਨਲੋਡ ਕਰੋ। ਮਾਲਕ: ਮੁਨੀਮ ਦੀ ਬੈਕਅੱਪ ਫਾਈਲ ਲੋਡ ਕਰੋ',
    addNikashi: 'ਨਿਕਾਸੀ ਸ਼ਾਮਲ ਕਰੋ (ਪੱਕੀ ਭਰਾਈ)',
    stackNo: 'ਸਟੈਕ ਨੰ.',
    qty: 'ਮਾਤਰਾ',
    add: 'ਸ਼ਾਮਲ ਕਰੋ',
    noRecords: 'ਕੋਈ ਰਿਕਾਰਡ ਨਹੀਂ',
    tableType: 'ਕਿਸਮ',
    tableStack: 'ਸਟੈਕ',
    tableQty: 'ਮਾਤਰਾ',
    tableAddedBy: 'ਸ਼ਾਮਲ ਕਰਨ ਵਾਲਾ',
    tableDel: 'ਹਟਾਓ',
    dataLoadedFrom: '✅ ਡਾਟਾ ਲੋਡ ਹੋਇਆ: ',
    errorLoadingFile: '❌ ਫਾਈਲ ਲੋਡ ਕਰਨ ਵਿੱਚ ਗਲਤੀ',
    unknown: 'ਅਣਜਾਣ',
    pathaiTitle: 'ਪਥਾਈ',
    voucherNo: 'ਵਾਊਚਰ ਨੰ.',
    date: 'ਮਿਤੀ',
    locationName: 'ਟਿਕਾਣੇ ਦਾ ਨਾਮ',
    remarks: 'ਟਿੱਪਣੀ',
    enterPathaiDetail: 'ਪਥਾਈ ਵੇਰਵਾ ਦਰਜ ਕਰੋ',
    sr: 'ਲੜੀ',
    patherName: 'ਪੱਥਰ ਦਾ ਨਾਮ',
    bricks: 'ਇੱਟਾਂ',
    tiles: 'ਟਾਈਲਾਂ',
    agentName: 'ਏਜੰਟ ਦਾ ਨਾਮ',
    addRow: '+ ਕਤਾਰ ਸ਼ਾਮਲ ਕਰੋ',
    total: 'ਕੁੱਲ',
    katQty: 'ਕਾਟ ਮਾਤਰਾ',
    netQty: 'ਸ਼ੁੱਧ ਮਾਤਰਾ',
    items: 'ਆਈਟਮਾਂ',
    save: 'ਸੇਵ ਕਰੋ',
    modify: 'ਸੋਧੋ',
    delete: 'ਹਟਾਓ',
    filter: 'ਫਿਲਟਰ...',
    clear: 'ਸਾਫ਼ ਕਰੋ',
    returnBtn: 'ਵਾਪਸ',
    first: 'ਪਹਿਲਾ',
    next: 'ਅਗਲਾ',
    previous: 'ਪਿਛਲਾ',
    last: 'ਆਖਰੀ',
    find: 'ਲੱਭੋ...',
    list: 'ਸੂਚੀ...',
    gherNo: 'ਘਰ ਨੰ.',
    itemName: 'ਆਈਟਮ ਦਾ ਨਾਮ',
    chakkeWiseDetail: 'ਚੱਕੇ ਅਨੁਸਾਰ ਨਿਕਾਸੀ ਵੇਰਵਾ',
    chakkaNo: 'ਚੱਕਾ ਨੰ.',
    qtyHeapedUp: 'ਢੇਰ ਕੀਤੀ ਮਾਤਰਾ',
    labourWise: 'ਮਜ਼ਦੂਰ ਅਨੁਸਾਰ',
    labourerName: 'ਮਜ਼ਦੂਰ ਦਾ ਨਾਮ',
    pawaDetail: 'ਪਾਵਾ ਵੇਰਵਾ',
    totalNikasi: 'ਕੁੱਲ ਨਿਕਾਸੀ',
    newVoucher: 'ਨਵਾਂ',
    oilUsageTitle: 'ਤੇਲ ਦੀ ਵਰਤੋਂ',
    enterOilDetail: 'ਤੇਲ ਵਰਤੋਂ ਵੇਰਵਾ ਦਰਜ ਕਰੋ',
    vehicleName: 'ਵਾਹਨ',
    ledgerNameLabel: 'ਲੈਜਰ / ਸਪਲਾਇਰ',
    rate: 'ਦਰ',
    amount: 'ਰਕਮ',
    totalQuantity: 'ਕੁੱਲ ਮਾਤਰਾ',
    totalAmount: 'ਕੁੱਲ ਰਕਮ',
    odometer: 'ਓਡੋਮੀਟਰ',
  },
};

// Sidebar / menu labels, keyed by language then by tab/sub-tab key
const menuLabels = {
  en: {
    dashboard: '🏠 Dashboard', production: '🔥 Production',
    rawMaterial: '🪨 Raw Material', pathai: '🧱 Pathai', kachiBharai: '🔥 Kachi Bharai',
    jalai: '🔥 Jalai', nikasi: '📤 Nikasi (Pakki Bharai)', wastage: '⚠️ Wastage',
    transaction: '🛒 Transaction', purchase: '🛒 Purchase', sale: '💰 Sale',
    stockAdjustment: '📦 Stock Adjustment', issueReturn: '🔁 Issue/Return',
    creditLedger: '📒 Credit Ledger Work', creditVehicle: '🚚 Credit Vehicle Work',
    orders: '🧾 Orders', absentVoucher: '🙅 Absent Voucher', miscSale: '🧺 Misc Sale', oilUsage: '⛽ Oil Usage',
    financial: '💰 Financial Accounts', payment: '💵 Payment', receipt: '🧾 Receipt', voucher: '📑 Account Voucher',
    admin: '🛡️ Admin', roleMaster: '🎭 Role Master', salarySetup: '💵 Salary Setup', postSalary: '📤 Post Salary',
    userManagement: '👥 User Management', manageBranch: '🏢 Manage Branch', sessionSetup: '🗓️ Session Setup',
    advanceSetting: '⚙️ Advance Setting', adminReports: '📊 Admin Reports', applyNewRates: '💹 Apply New Rates',
    updateOpeningBalance: '📦 Update Opening Balance', setActiveInactive: '🔘 Set Active Inactive',
    masters: '📋 Masters', item: 'Item', chakka: 'Chakka', city: 'City', freight: 'Freight',
    vehicle: 'Vehicle', lineChamber: 'Line/Chamber', location: 'Location', ledger: 'Ledger',
    gst: 'GST Tax', saleAgent: 'Sale Agent',
    initialSettings: '⚙️ Initial Settings', labourRates: '👷 Labour Rates', katSetup: '⚙️ Kat Setup',
    commissionSetup: '💼 Commission Setup', itemsOpening: '📦 Items Opening', ledgersOpening: '📒 Ledgers Opening',
    reports: '📊 Reports',
  },
  pa: {
    dashboard: '🏠 ਡੈਸ਼ਬੋਰਡ', production: '🔥 ਉਤਪਾਦਨ',
    rawMaterial: '🪨 ਕੱਚਾ ਮਾਲ', pathai: '🧱 ਪਥਾਈ', kachiBharai: '🔥 ਕੱਚੀ ਭਰਾਈ',
    jalai: '🔥 ਜਲਾਈ', nikasi: '📤 ਨਿਕਾਸੀ (ਪੱਕੀ ਭਰਾਈ)', wastage: '⚠️ ਬਰਬਾਦੀ',
    transaction: '🛒 ਲੈਣ-ਦੇਣ', purchase: '🛒 ਖਰੀਦ', sale: '💰 ਵਿਕਰੀ',
    stockAdjustment: '📦 ਸਟਾਕ ਸਮਾਯੋਜਨ', issueReturn: '🔁 ਜਾਰੀ/ਵਾਪਸੀ',
    creditLedger: '📒 ਕ੍ਰੈਡਿਟ ਲੈਜਰ ਕੰਮ', creditVehicle: '🚚 ਕ੍ਰੈਡਿਟ ਵਾਹਨ ਕੰਮ',
    orders: '🧾 ਆਰਡਰ', absentVoucher: '🙅 ਗੈਰਹਾਜ਼ਰ ਵਾਊਚਰ', miscSale: '🧺 ਫੁਟਕਲ ਵਿਕਰੀ', oilUsage: '⛽ ਤੇਲ ਦੀ ਵਰਤੋਂ',
    financial: '💰 ਵਿੱਤੀ ਖਾਤੇ', payment: '💵 ਭੁਗਤਾਨ', receipt: '🧾 ਰਸੀਦ', voucher: '📑 ਖਾਤਾ ਵਾਊਚਰ',
    admin: '🛡️ ਪ੍ਰਸ਼ਾਸਨ', roleMaster: '🎭 ਭੂਮਿਕਾ ਮਾਸਟਰ', salarySetup: '💵 ਤਨਖਾਹ ਸੈੱਟਅੱਪ', postSalary: '📤 ਤਨਖਾਹ ਪੋਸਟ ਕਰੋ',
    userManagement: '👥 ਯੂਜ਼ਰ ਪ੍ਰਬੰਧਨ', manageBranch: '🏢 ਸ਼ਾਖਾ ਪ੍ਰਬੰਧਨ', sessionSetup: '🗓️ ਸੈਸ਼ਨ ਸੈੱਟਅੱਪ',
    advanceSetting: '⚙️ ਐਡਵਾਂਸ ਸੈਟਿੰਗ', adminReports: '📊 ਪ੍ਰਸ਼ਾਸਨ ਰਿਪੋਰਟਾਂ', applyNewRates: '💹 ਨਵੀਆਂ ਦਰਾਂ ਲਾਗੂ ਕਰੋ',
    updateOpeningBalance: '📦 ਓਪਨਿੰਗ ਬੈਲੇਂਸ ਅੱਪਡੇਟ ਕਰੋ', setActiveInactive: '🔘 ਸਰਗਰਮ/ਨਾ-ਸਰਗਰਮ ਸੈੱਟ ਕਰੋ',
    masters: '📋 ਮਾਸਟਰ', item: 'ਆਈਟਮ', chakka: 'ਚੱਕਾ', city: 'ਸ਼ਹਿਰ', freight: 'ਭਾੜਾ',
    vehicle: 'ਵਾਹਨ', lineChamber: 'ਲਾਈਨ/ਚੈਂਬਰ', location: 'ਟਿਕਾਣਾ', ledger: 'ਲੈਜਰ',
    gst: 'ਜੀ.ਐਸ.ਟੀ. ਟੈਕਸ', saleAgent: 'ਵਿਕਰੀ ਏਜੰਟ',
    initialSettings: '⚙️ ਸ਼ੁਰੂਆਤੀ ਸੈਟਿੰਗਾਂ', labourRates: '👷 ਮਜ਼ਦੂਰੀ ਦਰਾਂ', katSetup: '⚙️ ਕਾਟ ਸੈੱਟਅੱਪ',
    commissionSetup: '💼 ਕਮਿਸ਼ਨ ਸੈੱਟਅੱਪ', itemsOpening: '📦 ਆਈਟਮ ਓਪਨਿੰਗ', ledgersOpening: '📒 ਲੈਜਰ ਓਪਨਿੰਗ',
    reports: '📊 ਰਿਪੋਰਟਾਂ',
  },
};

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
  const [language, setLanguage] = useState('en');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTabs, setActiveSubTabs] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({ admin: true, production: true, transaction: true, masters: true, financial: true, initialSettings: true });
  const [records, setRecords] = useState([]);
  const [inventory, setInventory] = useState({});
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [ledgers, setLedgers] = useState([]);

  const [nikashiForm, setNikashiForm] = useState({ itemId: '', stackNumber: '1', quantity: '' });
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Pathai voucher header + detail table state (mirrors the legacy Pathai screen)
  const [pathaiForm, setPathaiForm] = useState({ voucherNo: '1', date: new Date().toISOString().split('T')[0], locationName: '', remarks: '' });
  const [pathaiRows, setPathaiRows] = useState([{ id: 1, patherName: '', bricks: '', tiles: '', remarks: '' }]);
  const [pathaiAgents, setPathaiAgents] = useState([{ id: 1, agentName: '', bricks: '', tiles: '' }]);
  const [pathaiKat, setPathaiKat] = useState({ bricksKat: '0', tilesKat: '0', itemsKat: '0' });
  const [pathaiVouchers, setPathaiVouchers] = useState([]);
  const [pathaiVoucherIndex, setPathaiVoucherIndex] = useState(-1); // -1 = new/unsaved voucher

  // Oil Usage voucher header + detail table state (mirrors the Pathai screen)
  const [oilForm, setOilForm] = useState({ voucherNo: '1', date: new Date().toISOString().split('T')[0], remarks: '' });
  const [oilRows, setOilRows] = useState([{ id: 1, vehicleId: '', ledgerId: '', quantity: '', rate: '', odometer: '', remarks: '' }]);
  const [oilVouchers, setOilVouchers] = useState([]);
  const [oilVoucherIndex, setOilVoucherIndex] = useState(-1); // -1 = new/unsaved voucher

  // Nikasi voucher header + detail tables state (mirrors the legacy Nikasi screen)
  const [nikasiVoucher, setNikasiVoucher] = useState({ voucherNo: '1', date: new Date().toISOString().split('T')[0], itemId: '', gherNo: '', remarks: '' });
  const [nikasiChakkaRows, setNikasiChakkaRows] = useState([{ id: 1, chakkaNo: '', qty: '' }]);
  const [nikasiLabourRows, setNikasiLabourRows] = useState([{ id: 1, labourerName: '', qty: '' }]);
  const [nikasiPawaRows, setNikasiPawaRows] = useState([{ id: 1, gherNo: '', qty: '' }]);
  const [nikasiVouchers, setNikasiVouchers] = useState([]);
  const [nikasiVoucherIndex, setNikasiVoucherIndex] = useState(-1); // -1 = new/unsaved voucher
  const [loadError, setLoadError] = useState('');

  // Load data once logged in, then keep it live-synced via Supabase Realtime
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadData = async () => {
      const { data: itemRows, error: itemErr } = await supabase.from('items').select('*').order('id');
      if (itemErr) { setLoadError(itemErr.message); return; }
      setItems(itemRows || []);

      // Locations for the Pathai "Location Name" dropdown — assumed table/column names,
      // update these if your Masters schema uses different ones.
      const { data: locRows, error: locErr } = await supabase.from('locations').select('*').order('id');
      if (locErr) {
        console.warn('Could not load locations (check table/column names):', locErr.message);
        setLocations([]);
      } else {
        setLocations(locRows || []);
      }

      // Nikasi voucher headers, for the First/Next/Previous/Last navigation.
      // Requires the nikasi_vouchers table (see nikasi_schema.sql).
      const { data: nikasiVoucherRows, error: nikasiVoucherErr } = await supabase
        .from('nikasi_vouchers').select('*').order('id');
      if (nikasiVoucherErr) {
        console.warn('Could not load nikasi_vouchers (has the schema been run yet?):', nikasiVoucherErr.message);
        setNikasiVouchers([]);
      } else {
        setNikasiVouchers(nikasiVoucherRows || []);
      }

      // Pathai voucher headers, for the First/Next/Previous/Last navigation.
      // Requires the pathai_vouchers table (see pathai_schema.sql).
      const { data: pathaiVoucherRows, error: pathaiVoucherErr } = await supabase
        .from('pathai_vouchers').select('*').order('id');
      if (pathaiVoucherErr) {
        console.warn('Could not load pathai_vouchers (has the schema been run yet?):', pathaiVoucherErr.message);
        setPathaiVouchers([]);
      } else {
        setPathaiVouchers(pathaiVoucherRows || []);
      }

      // Vehicles + Ledgers, for the Oil Usage screen's dropdowns.
      const { data: vehicleRows, error: vehicleErr } = await supabase.from('vehicles').select('*').order('id');
      if (vehicleErr) {
        console.warn('Could not load vehicles:', vehicleErr.message);
        setVehicles([]);
      } else {
        setVehicles(vehicleRows || []);
      }
      const { data: ledgerRows, error: ledgerErr } = await supabase.from('ledgers').select('*').order('id');
      if (ledgerErr) {
        console.warn('Could not load ledgers:', ledgerErr.message);
        setLedgers([]);
      } else {
        setLedgers(ledgerRows || []);
      }

      // Oil Usage voucher headers, for the First/Next/Previous/Last navigation.
      // Requires the oil_vouchers table (see the SQL provided with this feature).
      const { data: oilVoucherRows, error: oilVoucherErr } = await supabase
        .from('oil_vouchers').select('*').order('id');
      if (oilVoucherErr) {
        console.warn('Could not load oil_vouchers (has the schema been run yet?):', oilVoucherErr.message);
        setOilVouchers([]);
      } else {
        setOilVouchers(oilVoucherRows || []);
      }

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nikasi_vouchers' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pathai_vouchers' }, loadData)
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

  const handleLogin = async () => {
    setLoginError('');
    if (!username || !password) {
      setLoginError(translations[language].pleaseEnterCreds);
      return;
    }

    // Fallback built-in accounts (kept so you're never locked out)
    if (username === 'employer' && password === 'employer123') {
      setIsLoggedIn(true);
      setUserRole('employer');
      setActiveTab('dashboard');
      setUsername('');
      setPassword('');
      return;
    }
    if (username === 'muneem' && password === 'muneem123') {
      setIsLoggedIn(true);
      setUserRole('muneem');
      setActiveTab('dashboard');
      setUsername('');
      setPassword('');
      return;
    }

    // Otherwise, check accounts created in Admin → User Management
    const { data: userRow, error: userErr } = await supabase
      .from('app_users')
      .select('*, roles(role_name)')
      .eq('username', username)
      .eq('is_active', true)
      .maybeSingle();

    if (userErr || !userRow || !userRow.password_hash || !userRow.password_salt) {
      setLoginError(translations[language].invalidCreds);
      setUsername('');
      setPassword('');
      return;
    }

    const ok = await verifyPassword(password, userRow.password_salt, userRow.password_hash);
    if (!ok) {
      setLoginError(translations[language].invalidCreds);
      setUsername('');
      setPassword('');
      return;
    }

    // Role name from Role Master decides permission level. Anything named
    // "employer"/"admin" gets full (employer-level) access; everything
    // else gets restricted (muneem-level) access.
    const roleName = userRow.roles?.role_name || '';
    const mappedRole = /employer|admin/i.test(roleName) ? 'employer' : 'muneem';

    setIsLoggedIn(true);
    setUserRole(mappedRole);
    setActiveTab('dashboard');
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

  // --- Pathai detail table helpers ---
  const updatePathaiRow = (id, field, value) => {
    setPathaiRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addPathaiRow = () => {
    setPathaiRows((rows) => [...rows, { id: (rows[rows.length - 1]?.id || 0) + 1, patherName: '', bricks: '', tiles: '', remarks: '' }]);
  };
  const deletePathaiRow = (id) => {
    setPathaiRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };

  const updatePathaiAgent = (id, field, value) => {
    setPathaiAgents((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addPathaiAgent = () => {
    setPathaiAgents((rows) => [...rows, { id: (rows[rows.length - 1]?.id || 0) + 1, agentName: '', bricks: '', tiles: '' }]);
  };
  const deletePathaiAgent = (id) => {
    setPathaiAgents((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };

  const clearPathaiForm = () => {
    setPathaiForm({ voucherNo: '1', date: selectedDate, locationName: '', remarks: '' });
    setPathaiRows([{ id: 1, patherName: '', bricks: '', tiles: '', remarks: '' }]);
    setPathaiAgents([{ id: 1, agentName: '', bricks: '', tiles: '' }]);
    setPathaiKat({ bricksKat: '0', tilesKat: '0', itemsKat: '0' });
    setPathaiVoucherIndex(-1);
  };

  // Load one Pathai voucher's header + all its detail rows into the form
  const loadPathaiVoucherByIndex = async (index) => {
    const voucher = pathaiVouchers[index];
    if (!voucher) return;
    setPathaiVoucherIndex(index);
    setPathaiForm({
      voucherNo: voucher.voucher_no || '',
      date: voucher.date || selectedDate,
      locationName: voucher.location_id || '',
      remarks: voucher.remarks || '',
    });
    setPathaiKat({
      bricksKat: String(voucher.bricks_kat ?? '0'),
      tilesKat: String(voucher.tiles_kat ?? '0'),
      itemsKat: String(voucher.items_kat ?? '0'),
    });

    const [rowsRes, agentsRes] = await Promise.all([
      supabase.from('pathai_rows').select('*').eq('voucher_id', voucher.id).order('row_order'),
      supabase.from('pathai_agents').select('*').eq('voucher_id', voucher.id).order('row_order'),
    ]);
    setPathaiRows((rowsRes.data || []).length
      ? rowsRes.data.map((r) => ({ id: r.id, patherName: r.pather_name || '', bricks: r.bricks ?? '', tiles: r.tiles ?? '', remarks: r.remarks || '' }))
      : [{ id: 1, patherName: '', bricks: '', tiles: '', remarks: '' }]);
    setPathaiAgents((agentsRes.data || []).length
      ? agentsRes.data.map((r) => ({ id: r.id, agentName: r.agent_name || '', bricks: r.bricks ?? '', tiles: r.tiles ?? '' }))
      : [{ id: 1, agentName: '', bricks: '', tiles: '' }]);
  };

  const goPathaiFirst = () => pathaiVouchers.length && loadPathaiVoucherByIndex(0);
  const goPathaiLast = () => pathaiVouchers.length && loadPathaiVoucherByIndex(pathaiVouchers.length - 1);
  const goPathaiNext = () => {
    const next = pathaiVoucherIndex + 1;
    if (next < pathaiVouchers.length) loadPathaiVoucherByIndex(next);
  };
  const goPathaiPrevious = () => {
    const prev = pathaiVoucherIndex - 1;
    if (prev >= 0) loadPathaiVoucherByIndex(prev);
  };

  const handleSavePathai = async () => {
    if (!pathaiForm.locationName) { alert(translations[language].locationName + ' *'); return; }
    const voucherPayload = {
      voucher_no: pathaiForm.voucherNo,
      date: pathaiForm.date,
      location_id: pathaiForm.locationName,
      remarks: pathaiForm.remarks,
      bricks_kat: parseFloat(pathaiKat.bricksKat) || 0,
      tiles_kat: parseFloat(pathaiKat.tilesKat) || 0,
      items_kat: parseFloat(pathaiKat.itemsKat) || 0,
      created_by: userRole || '',
    };

    const isUpdate = pathaiVoucherIndex >= 0 && pathaiVouchers[pathaiVoucherIndex];
    let voucherId;

    if (isUpdate) {
      voucherId = pathaiVouchers[pathaiVoucherIndex].id;
      const { error } = await supabase.from('pathai_vouchers').update(voucherPayload).eq('id', voucherId);
      if (error) { alert(error.message); return; }
      await Promise.all([
        supabase.from('pathai_rows').delete().eq('voucher_id', voucherId),
        supabase.from('pathai_agents').delete().eq('voucher_id', voucherId),
      ]);
    } else {
      const { data, error } = await supabase.from('pathai_vouchers').insert(voucherPayload).select().single();
      if (error) { alert(error.message); return; }
      voucherId = data.id;
    }

    const rowsPayload = pathaiRows.filter(r => r.patherName || r.bricks || r.tiles).map((r, i) => ({ voucher_id: voucherId, pather_name: r.patherName, bricks: parseFloat(r.bricks) || 0, tiles: parseFloat(r.tiles) || 0, remarks: r.remarks, row_order: i }));
    const agentsPayload = pathaiAgents.filter(r => r.agentName || r.bricks || r.tiles).map((r, i) => ({ voucher_id: voucherId, agent_name: r.agentName, bricks: parseFloat(r.bricks) || 0, tiles: parseFloat(r.tiles) || 0, row_order: i }));

    if (rowsPayload.length) {
      const { error } = await supabase.from('pathai_rows').insert(rowsPayload);
      if (error) { alert('Pathai rows: ' + error.message); return; }
    }
    if (agentsPayload.length) {
      const { error } = await supabase.from('pathai_agents').insert(agentsPayload);
      if (error) { alert('Agent rows: ' + error.message); return; }
    }

    alert(translations[language].save + ' ✅');
    clearPathaiForm();
    const { data: freshVouchers } = await supabase.from('pathai_vouchers').select('*').order('id');
    setPathaiVouchers(freshVouchers || []);
  };

  const handleDeletePathai = async () => {
    if (pathaiVoucherIndex < 0 || !pathaiVouchers[pathaiVoucherIndex]) return;
    const voucherId = pathaiVouchers[pathaiVoucherIndex].id;
    const { error } = await supabase.from('pathai_vouchers').delete().eq('id', voucherId);
    if (error) { alert(error.message); return; }
    clearPathaiForm();
    const { data: freshVouchers } = await supabase.from('pathai_vouchers').select('*').order('id');
    setPathaiVouchers(freshVouchers || []);
  };

  // --- Oil Usage voucher helpers (mirrors the Pathai pattern) ---
  const updateOilRow = (id, field, value) => {
    setOilRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addOilRow = () => {
    setOilRows((rows) => [...rows, { id: (rows[rows.length - 1]?.id || 0) + 1, vehicleId: '', ledgerId: '', quantity: '', rate: '', odometer: '', remarks: '' }]);
  };
  const deleteOilRow = (id) => {
    setOilRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };

  const clearOilForm = () => {
    setOilForm({ voucherNo: '1', date: selectedDate, remarks: '' });
    setOilRows([{ id: 1, vehicleId: '', ledgerId: '', quantity: '', rate: '', odometer: '', remarks: '' }]);
    setOilVoucherIndex(-1);
  };

  // Load one Oil Usage voucher's header + all its detail rows into the form
  const loadOilVoucherByIndex = async (index) => {
    const voucher = oilVouchers[index];
    if (!voucher) return;
    setOilVoucherIndex(index);
    setOilForm({
      voucherNo: voucher.voucher_no || '',
      date: voucher.date || selectedDate,
      remarks: voucher.remarks || '',
    });

    const { data: rowsData } = await supabase.from('oil_voucher_rows').select('*').eq('voucher_id', voucher.id).order('row_order');
    setOilRows((rowsData || []).length
      ? rowsData.map((r) => ({ id: r.id, vehicleId: r.vehicle_id || '', ledgerId: r.ledger_id || '', quantity: r.quantity ?? '', rate: r.rate ?? '', odometer: r.odometer ?? '', remarks: r.remarks || '' }))
      : [{ id: 1, vehicleId: '', ledgerId: '', quantity: '', rate: '', odometer: '', remarks: '' }]);
  };

  const goOilFirst = () => oilVouchers.length && loadOilVoucherByIndex(0);
  const goOilLast = () => oilVouchers.length && loadOilVoucherByIndex(oilVouchers.length - 1);
  const goOilNext = () => {
    const next = oilVoucherIndex + 1;
    if (next < oilVouchers.length) loadOilVoucherByIndex(next);
  };
  const goOilPrevious = () => {
    const prev = oilVoucherIndex - 1;
    if (prev >= 0) loadOilVoucherByIndex(prev);
  };

  const handleSaveOil = async () => {
    const hasAnyRow = oilRows.some(r => r.vehicleId && r.quantity);
    if (!hasAnyRow) { alert(translations[language].vehicleName + ' / ' + translations[language].qty + ' *'); return; }

    const totalQuantity = oilRows.reduce((s, r) => s + (parseFloat(r.quantity) || 0), 0);
    const totalAmount = oilRows.reduce((s, r) => s + ((parseFloat(r.quantity) || 0) * (parseFloat(r.rate) || 0)), 0);

    const voucherPayload = {
      voucher_no: oilForm.voucherNo,
      date: oilForm.date,
      remarks: oilForm.remarks,
      total_quantity: totalQuantity,
      total_amount: totalAmount,
      created_by: userRole || '',
    };

    const isUpdate = oilVoucherIndex >= 0 && oilVouchers[oilVoucherIndex];
    let voucherId;

    if (isUpdate) {
      voucherId = oilVouchers[oilVoucherIndex].id;
      const { error } = await supabase.from('oil_vouchers').update(voucherPayload).eq('id', voucherId);
      if (error) { alert(error.message); return; }
      await supabase.from('oil_voucher_rows').delete().eq('voucher_id', voucherId);
    } else {
      const { data, error } = await supabase.from('oil_vouchers').insert(voucherPayload).select().single();
      if (error) { alert(error.message); return; }
      voucherId = data.id;
    }

    const rowsPayload = oilRows.filter(r => r.vehicleId && r.quantity).map((r, i) => ({
      voucher_id: voucherId, vehicle_id: r.vehicleId, ledger_id: r.ledgerId || null,
      quantity: parseFloat(r.quantity) || 0, rate: parseFloat(r.rate) || 0,
      amount: (parseFloat(r.quantity) || 0) * (parseFloat(r.rate) || 0),
      odometer: r.odometer ? parseFloat(r.odometer) : null, remarks: r.remarks, row_order: i,
    }));

    if (rowsPayload.length) {
      const { error } = await supabase.from('oil_voucher_rows').insert(rowsPayload);
      if (error) { alert('Oil rows: ' + error.message); return; }
    }

    alert(translations[language].save + ' ✅');
    clearOilForm();
    const { data: freshVouchers } = await supabase.from('oil_vouchers').select('*').order('id');
    setOilVouchers(freshVouchers || []);
  };

  const handleDeleteOil = async () => {
    if (oilVoucherIndex < 0 || !oilVouchers[oilVoucherIndex]) return;
    const voucherId = oilVouchers[oilVoucherIndex].id;
    const { error } = await supabase.from('oil_vouchers').delete().eq('id', voucherId);
    if (error) { alert(error.message); return; }
    clearOilForm();
    const { data: freshVouchers } = await supabase.from('oil_vouchers').select('*').order('id');
    setOilVouchers(freshVouchers || []);
  };

  // --- Nikasi voucher table helpers ---
  const updateNikasiChakkaRow = (id, field, value) => {
    setNikasiChakkaRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addNikasiChakkaRow = () => {
    setNikasiChakkaRows((rows) => [...rows, { id: (rows[rows.length - 1]?.id || 0) + 1, chakkaNo: '', qty: '' }]);
  };
  const deleteNikasiChakkaRow = (id) => {
    setNikasiChakkaRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };

  const updateNikasiLabourRow = (id, field, value) => {
    setNikasiLabourRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addNikasiLabourRow = () => {
    setNikasiLabourRows((rows) => [...rows, { id: (rows[rows.length - 1]?.id || 0) + 1, labourerName: '', qty: '' }]);
  };
  const deleteNikasiLabourRow = (id) => {
    setNikasiLabourRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };

  const updateNikasiPawaRow = (id, field, value) => {
    setNikasiPawaRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addNikasiPawaRow = () => {
    setNikasiPawaRows((rows) => [...rows, { id: (rows[rows.length - 1]?.id || 0) + 1, gherNo: '', qty: '' }]);
  };
  const deleteNikasiPawaRow = (id) => {
    setNikasiPawaRows((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };

  const clearNikasiForm = () => {
    setNikasiVoucher({ voucherNo: '1', date: selectedDate, itemId: '', gherNo: '', remarks: '' });
    setNikasiChakkaRows([{ id: 1, chakkaNo: '', qty: '' }]);
    setNikasiLabourRows([{ id: 1, labourerName: '', qty: '' }]);
    setNikasiPawaRows([{ id: 1, gherNo: '', qty: '' }]);
    setNikasiVoucherIndex(-1);
  };

  // Load one voucher's header + all its detail rows into the form
  const loadNikasiVoucherByIndex = async (index) => {
    const voucher = nikasiVouchers[index];
    if (!voucher) return;
    setNikasiVoucherIndex(index);
    setNikasiVoucher({
      voucherNo: voucher.voucher_no || '',
      date: voucher.date || selectedDate,
      itemId: voucher.item_id || '',
      gherNo: voucher.gher_no || '',
      remarks: voucher.remarks || '',
    });

    const [chakkaRes, labourRes, pawaRes] = await Promise.all([
      supabase.from('nikasi_chakka_rows').select('*').eq('voucher_id', voucher.id).order('row_order'),
      supabase.from('nikasi_labour_rows').select('*').eq('voucher_id', voucher.id).order('row_order'),
      supabase.from('nikasi_pawa_rows').select('*').eq('voucher_id', voucher.id).order('row_order'),
    ]);
    setNikasiChakkaRows((chakkaRes.data || []).length
      ? chakkaRes.data.map((r) => ({ id: r.id, chakkaNo: r.chakka_no || '', qty: r.qty ?? '' }))
      : [{ id: 1, chakkaNo: '', qty: '' }]);
    setNikasiLabourRows((labourRes.data || []).length
      ? labourRes.data.map((r) => ({ id: r.id, labourerName: r.labourer_name || '', qty: r.qty ?? '' }))
      : [{ id: 1, labourerName: '', qty: '' }]);
    setNikasiPawaRows((pawaRes.data || []).length
      ? pawaRes.data.map((r) => ({ id: r.id, gherNo: r.gher_no || '', qty: r.qty ?? '' }))
      : [{ id: 1, gherNo: '', qty: '' }]);
  };

  const goNikasiFirst = () => nikasiVouchers.length && loadNikasiVoucherByIndex(0);
  const goNikasiLast = () => nikasiVouchers.length && loadNikasiVoucherByIndex(nikasiVouchers.length - 1);
  const goNikasiNext = () => {
    const next = nikasiVoucherIndex + 1;
    if (next < nikasiVouchers.length) loadNikasiVoucherByIndex(next);
  };
  const goNikasiPrevious = () => {
    const prev = nikasiVoucherIndex - 1;
    if (prev >= 0) loadNikasiVoucherByIndex(prev);
  };

  const handleSaveNikasi = async () => {
    if (!nikasiVoucher.itemId) { alert(translations[language].itemName + ' *'); return; }
    const voucherPayload = {
      voucher_no: nikasiVoucher.voucherNo,
      date: nikasiVoucher.date,
      item_id: nikasiVoucher.itemId,
      gher_no: nikasiVoucher.gherNo,
      remarks: nikasiVoucher.remarks,
      total_nikasi: totalNikasiQty,
      created_by: userRole || '',
    };

    const isUpdate = nikasiVoucherIndex >= 0 && nikasiVouchers[nikasiVoucherIndex];
    let voucherId;

    if (isUpdate) {
      voucherId = nikasiVouchers[nikasiVoucherIndex].id;
      const { error } = await supabase.from('nikasi_vouchers').update(voucherPayload).eq('id', voucherId);
      if (error) { alert(error.message); return; }
      // Simplest correct approach: replace all child rows on modify
      await Promise.all([
        supabase.from('nikasi_chakka_rows').delete().eq('voucher_id', voucherId),
        supabase.from('nikasi_labour_rows').delete().eq('voucher_id', voucherId),
        supabase.from('nikasi_pawa_rows').delete().eq('voucher_id', voucherId),
      ]);
    } else {
      const { data, error } = await supabase.from('nikasi_vouchers').insert(voucherPayload).select().single();
      if (error) { alert(error.message); return; }
      voucherId = data.id;
    }

    const chakkaPayload = nikasiChakkaRows.filter(r => r.chakkaNo || r.qty).map((r, i) => ({ voucher_id: voucherId, chakka_no: r.chakkaNo, qty: parseFloat(r.qty) || 0, row_order: i }));
    const labourPayload = nikasiLabourRows.filter(r => r.labourerName || r.qty).map((r, i) => ({ voucher_id: voucherId, labourer_name: r.labourerName, qty: parseFloat(r.qty) || 0, row_order: i }));
    const pawaPayload = nikasiPawaRows.filter(r => r.gherNo || r.qty).map((r, i) => ({ voucher_id: voucherId, gher_no: r.gherNo, qty: parseFloat(r.qty) || 0, row_order: i }));

    if (chakkaPayload.length) {
      const { error } = await supabase.from('nikasi_chakka_rows').insert(chakkaPayload);
      if (error) { alert('Chakka rows: ' + error.message); return; }
    }
    if (labourPayload.length) {
      const { error } = await supabase.from('nikasi_labour_rows').insert(labourPayload);
      if (error) { alert('Labour rows: ' + error.message); return; }
    }
    if (pawaPayload.length) {
      const { error } = await supabase.from('nikasi_pawa_rows').insert(pawaPayload);
      if (error) { alert('Pawa rows: ' + error.message); return; }
    }

    alert(translations[language].save + ' ✅');
    clearNikasiForm();
    const { data: freshVouchers } = await supabase.from('nikasi_vouchers').select('*').order('id');
    setNikasiVouchers(freshVouchers || []);
  };

  const handleDeleteNikasi = async () => {
    if (nikasiVoucherIndex < 0 || !nikasiVouchers[nikasiVoucherIndex]) return;
    const voucherId = nikasiVouchers[nikasiVoucherIndex].id;
    const { error } = await supabase.from('nikasi_vouchers').delete().eq('id', voucherId);
    if (error) { alert(error.message); return; }
    clearNikasiForm();
    const { data: freshVouchers } = await supabase.from('nikasi_vouchers').select('*').order('id');
    setNikasiVouchers(freshVouchers || []);
  };

  // Pressing Enter in any input/select/textarea anywhere in the app moves the
  // cursor to the next field (like Tab), instead of submitting or doing nothing.
  const handleEnterNav = (e) => {
    if (e.key !== 'Enter') return;
    const tag = e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') return;
    e.preventDefault();
    const container = e.currentTarget;
    const focusable = Array.from(container.querySelectorAll('input, select, textarea'))
      .filter((el) => !el.disabled && !el.readOnly && el.offsetParent !== null);
    const idx = focusable.indexOf(e.target);
    if (idx > -1 && idx < focusable.length - 1) {
      const next = focusable[idx + 1];
      next.focus();
      if (typeof next.select === 'function') next.select();
    }
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
        alert(translations[language].dataLoadedFrom + (data.exportedBy || translations[language].unknown));
      } catch (err) {
        alert(translations[language].errorLoadingFile);
      }
    };
    reader.readAsText(file);
  };

  const todayNikashi = records.filter(r => r.date === selectedDate && r.type === 'nikashi');
  const allSales = records.filter(r => r.type === 'sales');
  const allNikashi = records.filter(r => r.type === 'nikashi');

  // Pathai totals: sum of the detail rows, minus the editable Kat Qty deduction
  const pathaiBricksTotal = pathaiRows.reduce((s, r) => s + (parseFloat(r.bricks) || 0), 0);
  const pathaiTilesTotal = pathaiRows.reduce((s, r) => s + (parseFloat(r.tiles) || 0), 0);
  const pathaiItemsTotal = pathaiBricksTotal + pathaiTilesTotal;
  const pathaiBricksKat = parseFloat(pathaiKat.bricksKat) || 0;
  const pathaiTilesKat = parseFloat(pathaiKat.tilesKat) || 0;
  const pathaiItemsKat = parseFloat(pathaiKat.itemsKat) || 0;
  const pathaiBricksNet = pathaiBricksTotal - pathaiBricksKat;
  const oilTotalQuantity = oilRows.reduce((s, r) => s + (parseFloat(r.quantity) || 0), 0);
  const oilTotalAmount = oilRows.reduce((s, r) => s + ((parseFloat(r.quantity) || 0) * (parseFloat(r.rate) || 0)), 0);
  const pathaiTilesNet = pathaiTilesTotal - pathaiTilesKat;
  const pathaiItemsNet = pathaiItemsTotal - pathaiItemsKat;

  // Total Nikasi: sum of the Chakke Wise Nikasi Detail rows' Qty Heaped Up
  const totalNikasiQty = nikasiChakkaRows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full relative">
          <button
            onClick={() => setLanguage(l => (l === 'en' ? 'pa' : 'en'))}
            className="absolute top-4 right-4 text-xs font-bold bg-red-100 text-red-800 px-3 py-1 rounded-full hover:bg-red-200"
          >
            {language === 'en' ? 'ਪੰਜਾਬੀ' : 'English'}
          </button>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-red-800 mb-2">{translations[language].appTitle}</h1>
            <p className="text-gray-600">{translations[language].tagline}</p>
          </div>

          <div className="space-y-4" onKeyDown={handleEnterNav}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{translations[language].username}</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={translations[language].enterUsername} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{translations[language].password}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder={translations[language].enterPassword} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700" />
            </div>

            {loginError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{loginError}</p></div>}

            <button onClick={handleLogin} className="w-full bg-gradient-to-r from-red-500 to-red-500 text-white font-bold py-3 rounded-lg hover:from-red-600 hover:to-red-600">{translations[language].login}</button>

          </div>


        </div>
      </div>
    );
  }

  const ml = menuLabels[language];
  const menuSections = [
    { key: 'dashboard', type: 'leaf', label: ml.dashboard },
    { key: 'production', type: 'group', label: ml.production, children: [
        ['rawMaterial', ml.rawMaterial], ['pathai', ml.pathai], ['kachiBharai', ml.kachiBharai],
        ['jalai', ml.jalai], ['nikasi', ml.nikasi], ['wastage', ml.wastage],
      ] },
    { key: 'transaction', type: 'group', label: ml.transaction, children: [
        ['purchase', ml.purchase], ['sale', ml.sale], ['stockAdjustment', ml.stockAdjustment],
        ['issueReturn', ml.issueReturn], ['creditLedger', ml.creditLedger],
        ['creditVehicle', ml.creditVehicle], ['orders', ml.orders],
        ['absentVoucher', ml.absentVoucher], ['miscSale', ml.miscSale], ['oilUsage', ml.oilUsage],
      ] },
    { key: 'financial', type: 'group', label: ml.financial, children: [
        ['payment', ml.payment], ['receipt', ml.receipt], ['voucher', ml.voucher],
      ] },
    ...(userRole === 'employer' ? [
      { key: 'admin', type: 'group', label: ml.admin, children: [
          ['roleMaster', ml.roleMaster], ['salarySetup', ml.salarySetup], ['postSalary', ml.postSalary],
          ['userManagement', ml.userManagement], ['manageBranch', ml.manageBranch], ['sessionSetup', ml.sessionSetup],
          ['advanceSetting', ml.advanceSetting], ['adminReports', ml.adminReports], ['applyNewRates', ml.applyNewRates],
          ['updateOpeningBalance', ml.updateOpeningBalance], ['setActiveInactive', ml.setActiveInactive],
        ] },
      { key: 'masters', type: 'group', label: ml.masters, children: [
          ['item', ml.item], ['chakka', ml.chakka], ['city', ml.city], ['freight', ml.freight],
          ['vehicle', ml.vehicle], ['lineChamber', ml.lineChamber], ['location', ml.location],
          ['ledger', ml.ledger], ['gst', ml.gst], ['saleAgent', ml.saleAgent],
        ] },
      { key: 'initialSettings', type: 'group', label: ml.initialSettings, children: [
          ['labourRates', ml.labourRates], ['katSetup', ml.katSetup], ['commissionSetup', ml.commissionSetup],
          ['itemsOpening', ml.itemsOpening], ['ledgersOpening', ml.ledgersOpening],
        ] },
      { key: 'reports', type: 'leaf', label: ml.reports },
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
    return translations[language].appTitle;
  })();

  return (
    <div className="min-h-screen bg-gray-100 flex" onKeyDown={handleEnterNav}>
      {/* Sidebar */}
      <div className="w-72 bg-red-800 text-white flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-red-700">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold">{translations[language].appTitle}</h1>
            <button
              onClick={() => setLanguage(l => (l === 'en' ? 'pa' : 'en'))}
              className="text-xs font-bold bg-red-950 hover:bg-black text-white px-2 py-1 rounded-md flex-shrink-0"
            >
              {language === 'en' ? 'ਪੰਜਾਬੀ' : 'English'}
            </button>
          </div>
          <p className="text-red-200 text-xs mt-1">{userRole === 'employer' ? translations[language].employer : translations[language].muneem}</p>
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
                    onClick={() => {
                      setExpandedGroups((p) => ({ ...p, [section.key]: !p[section.key] }));
                      setActiveTab(section.key);
                      setActiveSubTabs((p) => (p[section.key]
                        ? p
                        : { ...p, [section.key]: section.key === 'production' ? 'nikasi' : section.children[0][0] }));
                    }}
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
          <button onClick={handleLogout} className="w-full bg-red-950 hover:bg-black text-white px-4 py-2 rounded-lg font-bold text-sm">{translations[language].logout}</button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">{currentLabel}</h2>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString(language === 'pa' ? 'pa-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loadError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
              <p className="font-bold text-red-700">{translations[language].syncError} {loadError}</p>
              <p className="text-xs text-red-600">{translations[language].checkSupabase}</p>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-700">
                <p className="text-xs text-gray-500 font-semibold">{translations[language].itemsInMaster}</p>
                <p className="text-3xl font-bold text-red-800">{items.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
                <p className="text-xs text-gray-500 font-semibold">{translations[language].totalSold}</p>
                <p className="text-3xl font-bold text-blue-600">{allSales.reduce((s, r) => s + r.soldQuantity, 0)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
                <p className="text-xs text-gray-500 font-semibold">{translations[language].totalNikashi}</p>
                <p className="text-3xl font-bold text-green-600">{allNikashi.reduce((s, r) => s + r.quantity, 0)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-yellow-500">
                <p className="text-xs text-gray-500 font-semibold">{translations[language].todayNikashiEntries}</p>
                <p className="text-3xl font-bold text-yellow-600">{todayNikashi.length}</p>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-600 p-4 rounded-lg mb-6">
            <p className="font-bold text-blue-800 mb-3">{translations[language].syncDataTitle}</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={saveDataToFile} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 font-semibold text-sm">{translations[language].downloadMyData}</button>
              <label className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 font-semibold text-sm cursor-pointer">{translations[language].loadPartnerData}<input type="file" accept=".json" onChange={loadDataFromFile} className="hidden" /></label>
              <p className="text-xs text-blue-700 self-center">👉 {translations[language].syncHint}</p>
            </div>
          </div>

          {activeTab === 'production' && (activeSubTabs.production || 'nikasi') === 'nikasi' && (
            <div className="bg-white rounded-lg shadow-md">
              {/* Header toolbar, mirroring the legacy Nikasi screen */}
              <div className="flex flex-wrap gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
                <button onClick={goNikasiFirst} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].first}</button>
                <button onClick={goNikasiNext} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].next}</button>
                <button onClick={goNikasiPrevious} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].previous}</button>
                <button onClick={goNikasiLast} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].last}</button>
                <div className="flex-1" />
                <p className="text-xs text-gray-500 self-center px-2">
                  {nikasiVoucherIndex >= 0 ? `${nikasiVoucherIndex + 1} / ${nikasiVouchers.length}` : `${translations[language].newVoucher} (${nikasiVouchers.length})`}
                </p>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].find}</button>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].list}</button>
              </div>

              <div className="p-5 grid lg:grid-cols-3 gap-6">
                {/* Voucher header fields */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].voucherNo} *</label>
                      <input value={nikasiVoucher.voucherNo} onChange={e => setNikasiVoucher(p => ({ ...p, voucherNo: e.target.value }))} className="w-full px-3 py-2 border rounded-md bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].date} *</label>
                      <input type="date" value={nikasiVoucher.date} onChange={e => setNikasiVoucher(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].itemName} *</label>
                    <select value={nikasiVoucher.itemId} onChange={e => setNikasiVoucher(p => ({ ...p, itemId: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
                      <option value="">-</option>
                      {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].gherNo}</label>
                    <input value={nikasiVoucher.gherNo} onChange={e => setNikasiVoucher(p => ({ ...p, gherNo: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>

                {/* Right side: Labour Wise + Pawa Detail panels */}
                <div className="space-y-4">
                  <div className="border rounded-md overflow-hidden">
                    <p className="text-xs font-bold text-gray-600 px-2 py-1.5 bg-gray-100 border-b">{translations[language].labourWise}</p>
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-2 py-1.5 text-left w-8">{translations[language].sr}</th>
                        <th className="px-2 py-1.5 text-left">{translations[language].labourerName}</th>
                        <th className="px-2 py-1.5 text-right">{translations[language].qty}</th>
                        <th className="px-2 py-1.5 w-6"></th>
                      </tr></thead>
                      <tbody>
                        {nikasiLabourRows.map((r, idx) => (
                          <tr key={r.id} className="border-t">
                            <td className="px-2 py-1 text-gray-500">{idx + 1}</td>
                            <td className="px-1 py-1"><input value={r.labourerName} onChange={e => updateNikasiLabourRow(r.id, 'labourerName', e.target.value)} className="w-full px-1 py-0.5 border rounded" /></td>
                            <td className="px-1 py-1"><input type="number" value={r.qty} onChange={e => updateNikasiLabourRow(r.id, 'qty', e.target.value)} className="w-full px-1 py-0.5 border rounded text-right" /></td>
                            <td className="px-1 py-1 text-center"><button onClick={() => deleteNikasiLabourRow(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={addNikasiLabourRow} className="w-full text-xs text-blue-600 hover:bg-blue-50 py-1.5 border-t">{translations[language].addRow}</button>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <p className="text-xs font-bold text-gray-600 px-2 py-1.5 bg-gray-100 border-b">{translations[language].pawaDetail}</p>
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-2 py-1.5 text-left w-8">{translations[language].sr}</th>
                        <th className="px-2 py-1.5 text-left">{translations[language].gherNo}</th>
                        <th className="px-2 py-1.5 text-right">{translations[language].qty}</th>
                        <th className="px-2 py-1.5 w-6"></th>
                      </tr></thead>
                      <tbody>
                        {nikasiPawaRows.map((r, idx) => (
                          <tr key={r.id} className="border-t">
                            <td className="px-2 py-1 text-gray-500">{idx + 1}</td>
                            <td className="px-1 py-1"><input value={r.gherNo} onChange={e => updateNikasiPawaRow(r.id, 'gherNo', e.target.value)} className="w-full px-1 py-0.5 border rounded" /></td>
                            <td className="px-1 py-1"><input type="number" value={r.qty} onChange={e => updateNikasiPawaRow(r.id, 'qty', e.target.value)} className="w-full px-1 py-0.5 border rounded text-right" /></td>
                            <td className="px-1 py-1 text-center"><button onClick={() => deleteNikasiPawaRow(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={addNikasiPawaRow} className="w-full text-xs text-blue-600 hover:bg-blue-50 py-1.5 border-t">{translations[language].addRow}</button>
                  </div>
                </div>
              </div>

              {/* Chakke Wise Nikasi Detail table */}
              <div className="px-5">
                <p className="text-sm font-bold text-gray-700 mb-2">4. {translations[language].chakkeWiseDetail}</p>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr>
                      <th className="px-2 py-2 text-left w-16">{translations[language].sr}</th>
                      <th className="px-2 py-2 text-left">{translations[language].chakkaNo}</th>
                      <th className="px-2 py-2 text-right">{translations[language].qtyHeapedUp}</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr></thead>
                    <tbody>
                      {nikasiChakkaRows.map((r, idx) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-2 py-1 text-gray-500">{idx + 1}</td>
                          <td className="px-2 py-1"><input value={r.chakkaNo} onChange={e => updateNikasiChakkaRow(r.id, 'chakkaNo', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="px-2 py-1"><input type="number" value={r.qty} onChange={e => updateNikasiChakkaRow(r.id, 'qty', e.target.value)} className="w-full px-2 py-1 border rounded text-right" /></td>
                          <td className="px-2 py-1 text-center"><button onClick={() => deleteNikasiChakkaRow(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={addNikasiChakkaRow} className="w-full text-xs text-blue-600 hover:bg-blue-50 py-2 border-t">{translations[language].addRow}</button>
                </div>
              </div>

              {/* Remarks + Total Nikasi */}
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].remarks}</label>
                  <input value={nikasiVoucher.remarks} onChange={e => setNikasiVoucher(p => ({ ...p, remarks: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].totalNikasi} *</label>
                  <input readOnly value={totalNikasiQty} className="w-full px-3 py-2 border rounded-md bg-gray-50 font-bold" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
                <button onClick={handleSaveNikasi} className="bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-4 py-2 rounded-md">{translations[language].save}</button>
                <button onClick={handleSaveNikasi} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].modify}</button>
                <button onClick={handleDeleteNikasi} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].delete}</button>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].filter}</button>
                <button onClick={clearNikasiForm} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].clear}</button>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].returnBtn}</button>
              </div>
            </div>
          )}

          {activeTab === 'production' && activeSubTabs.production === 'pathai' && (
            <div className="bg-white rounded-lg shadow-md">
              {/* Header toolbar, mirroring the legacy Pathai screen */}
              <div className="flex flex-wrap gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
                <button onClick={goPathaiFirst} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].first}</button>
                <button onClick={goPathaiNext} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].next}</button>
                <button onClick={goPathaiPrevious} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].previous}</button>
                <button onClick={goPathaiLast} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].last}</button>
                <div className="flex-1" />
                <p className="text-xs text-gray-500 self-center px-2">
                  {pathaiVoucherIndex >= 0 ? `${pathaiVoucherIndex + 1} / ${pathaiVouchers.length}` : `${translations[language].newVoucher} (${pathaiVouchers.length})`}
                </p>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].find}</button>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].list}</button>
              </div>

              <div className="p-5 grid lg:grid-cols-3 gap-6">
                {/* Voucher header fields */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].voucherNo} *</label>
                      <input value={pathaiForm.voucherNo} onChange={e => setPathaiForm(p => ({ ...p, voucherNo: e.target.value }))} className="w-full px-3 py-2 border rounded-md bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].date} *</label>
                      <input type="date" value={pathaiForm.date} onChange={e => setPathaiForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].locationName} *</label>
                    <select value={pathaiForm.locationName} onChange={e => setPathaiForm(p => ({ ...p, locationName: e.target.value }))} className="w-full px-3 py-2 border rounded-md">
                      <option value="">-</option>
                      {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.location_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].remarks}</label>
                    <input value={pathaiForm.remarks} onChange={e => setPathaiForm(p => ({ ...p, remarks: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>

                {/* Agent summary table, top-right in the legacy screen */}
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100"><tr>
                      <th className="px-2 py-1.5 text-left">{translations[language].agentName}</th>
                      <th className="px-2 py-1.5 text-right">{translations[language].bricks}</th>
                      <th className="px-2 py-1.5 text-right">{translations[language].tiles}</th>
                      <th className="px-2 py-1.5"></th>
                    </tr></thead>
                    <tbody>
                      {pathaiAgents.map((a) => (
                        <tr key={a.id} className="border-t">
                          <td className="px-1 py-1"><input value={a.agentName} onChange={e => updatePathaiAgent(a.id, 'agentName', e.target.value)} className="w-full px-1 py-0.5 border rounded" /></td>
                          <td className="px-1 py-1"><input type="number" value={a.bricks} onChange={e => updatePathaiAgent(a.id, 'bricks', e.target.value)} className="w-full px-1 py-0.5 border rounded text-right" /></td>
                          <td className="px-1 py-1"><input type="number" value={a.tiles} onChange={e => updatePathaiAgent(a.id, 'tiles', e.target.value)} className="w-full px-1 py-0.5 border rounded text-right" /></td>
                          <td className="px-1 py-1 text-center"><button onClick={() => deletePathaiAgent(a.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={addPathaiAgent} className="w-full text-xs text-blue-600 hover:bg-blue-50 py-1.5 border-t">{translations[language].addRow}</button>
                </div>
              </div>

              {/* Pathai detail table */}
              <div className="px-5">
                <p className="text-sm font-bold text-gray-700 mb-2">4. {translations[language].enterPathaiDetail}</p>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr>
                      <th className="px-2 py-2 text-left w-12">{translations[language].sr}</th>
                      <th className="px-2 py-2 text-left">{translations[language].patherName}</th>
                      <th className="px-2 py-2 text-right">{translations[language].bricks}</th>
                      <th className="px-2 py-2 text-right">{translations[language].tiles}</th>
                      <th className="px-2 py-2 text-left">{translations[language].remarks}</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr></thead>
                    <tbody>
                      {pathaiRows.map((r, idx) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-2 py-1 text-gray-500">{idx + 1}</td>
                          <td className="px-2 py-1"><input value={r.patherName} onChange={e => updatePathaiRow(r.id, 'patherName', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="px-2 py-1"><input type="number" value={r.bricks} onChange={e => updatePathaiRow(r.id, 'bricks', e.target.value)} className="w-full px-2 py-1 border rounded text-right" /></td>
                          <td className="px-2 py-1"><input type="number" value={r.tiles} onChange={e => updatePathaiRow(r.id, 'tiles', e.target.value)} className="w-full px-2 py-1 border rounded text-right" /></td>
                          <td className="px-2 py-1"><input value={r.remarks} onChange={e => updatePathaiRow(r.id, 'remarks', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="px-2 py-1 text-center"><button onClick={() => deletePathaiRow(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={addPathaiRow} className="w-full text-xs text-blue-600 hover:bg-blue-50 py-2 border-t">{translations[language].addRow}</button>
                </div>
              </div>

              {/* Bricks / Tiles / Items totals with Kat Qty & Net Qty */}
              <div className="p-5 grid md:grid-cols-3 gap-4">
                <div className="border rounded-md p-3">
                  <p className="text-xs font-bold text-gray-500 mb-2">{translations[language].bricks}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><label className="block text-gray-500 mb-1">{translations[language].total}</label><input readOnly value={pathaiBricksTotal} className="w-full px-2 py-1 border rounded bg-gray-50 text-right" /></div>
                    <div><label className="block text-gray-500 mb-1">{translations[language].katQty}</label><input type="number" value={pathaiKat.bricksKat} onChange={e => setPathaiKat(p => ({ ...p, bricksKat: e.target.value }))} className="w-full px-2 py-1 border rounded text-right" /></div>
                    <div><label className="block text-gray-500 mb-1">{translations[language].netQty}</label><input readOnly value={pathaiBricksNet} className="w-full px-2 py-1 border rounded bg-gray-50 text-right font-bold" /></div>
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <p className="text-xs font-bold text-gray-500 mb-2">{translations[language].tiles}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><label className="block text-gray-500 mb-1">{translations[language].total}</label><input readOnly value={pathaiTilesTotal} className="w-full px-2 py-1 border rounded bg-gray-50 text-right" /></div>
                    <div><label className="block text-gray-500 mb-1">{translations[language].katQty}</label><input type="number" value={pathaiKat.tilesKat} onChange={e => setPathaiKat(p => ({ ...p, tilesKat: e.target.value }))} className="w-full px-2 py-1 border rounded text-right" /></div>
                    <div><label className="block text-gray-500 mb-1">{translations[language].netQty}</label><input readOnly value={pathaiTilesNet} className="w-full px-2 py-1 border rounded bg-gray-50 text-right font-bold" /></div>
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <p className="text-xs font-bold text-gray-500 mb-2">{translations[language].items}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><label className="block text-gray-500 mb-1">{translations[language].total}</label><input readOnly value={pathaiItemsTotal} className="w-full px-2 py-1 border rounded bg-gray-50 text-right" /></div>
                    <div><label className="block text-gray-500 mb-1">{translations[language].katQty}</label><input type="number" value={pathaiKat.itemsKat} onChange={e => setPathaiKat(p => ({ ...p, itemsKat: e.target.value }))} className="w-full px-2 py-1 border rounded text-right" /></div>
                    <div><label className="block text-gray-500 mb-1">{translations[language].netQty}</label><input readOnly value={pathaiItemsNet} className="w-full px-2 py-1 border rounded bg-gray-50 text-right font-bold" /></div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
                <button onClick={handleSavePathai} className="bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-4 py-2 rounded-md">{translations[language].save}</button>
                <button onClick={handleSavePathai} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].modify}</button>
                <button onClick={handleDeletePathai} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].delete}</button>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].filter}</button>
                <button onClick={clearPathaiForm} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].clear}</button>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].returnBtn}</button>
              </div>
            </div>
          )}

          {activeTab === 'production' && !['nikasi', 'pathai'].includes(activeSubTabs.production || 'nikasi') && (
            <ProductionModule supabase={supabase} userRole={userRole} language={language} subTab={activeSubTabs.production} onSubTabChange={(k) => setActiveSubTabs((p) => ({ ...p, production: k }))} />
          )}

          {activeTab === 'transaction' && activeSubTabs.transaction === 'oilUsage' && (
            <div className="bg-white rounded-lg shadow-md">
              {/* Header toolbar, mirroring the Pathai screen */}
              <div className="flex flex-wrap gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
                <button onClick={goOilFirst} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].first}</button>
                <button onClick={goOilNext} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].next}</button>
                <button onClick={goOilPrevious} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].previous}</button>
                <button onClick={goOilLast} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].last}</button>
                <div className="flex-1" />
                <p className="text-xs text-gray-500 self-center px-2">
                  {oilVoucherIndex >= 0 ? `${oilVoucherIndex + 1} / ${oilVouchers.length}` : `${translations[language].newVoucher} (${oilVouchers.length})`}
                </p>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].find}</button>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded">{translations[language].list}</button>
              </div>

              <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].voucherNo} *</label>
                  <input value={oilForm.voucherNo} onChange={e => setOilForm(p => ({ ...p, voucherNo: e.target.value }))} className="w-full px-3 py-2 border rounded-md bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].date}</label>
                  <input type="date" value={oilForm.date} onChange={e => setOilForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{translations[language].remarks}</label>
                  <input value={oilForm.remarks} onChange={e => setOilForm(p => ({ ...p, remarks: e.target.value }))} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>

              {/* Vehicle/Ledger-wise Oil Usage detail table */}
              <div className="px-5">
                <p className="text-sm font-bold text-gray-700 mb-2">{translations[language].enterOilDetail}</p>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100"><tr>
                      <th className="px-2 py-2 text-left w-12">{translations[language].sr}</th>
                      <th className="px-2 py-2 text-left">{translations[language].vehicleName}</th>
                      <th className="px-2 py-2 text-left">{translations[language].ledgerNameLabel}</th>
                      <th className="px-2 py-2 text-right">{translations[language].qty}</th>
                      <th className="px-2 py-2 text-right">{translations[language].rate}</th>
                      <th className="px-2 py-2 text-right">{translations[language].amount}</th>
                      <th className="px-2 py-2 text-right">{translations[language].odometer}</th>
                      <th className="px-2 py-2 text-left">{translations[language].remarks}</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr></thead>
                    <tbody>
                      {oilRows.map((r, idx) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-2 py-1 text-gray-500">{idx + 1}</td>
                          <td className="px-2 py-1">
                            <select value={r.vehicleId} onChange={e => updateOilRow(r.id, 'vehicleId', e.target.value)} className="w-full px-2 py-1 border rounded">
                              <option value="">{translations[language].vehicleName}</option>
                              {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number || v.vehicle_name}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1">
                            <select value={r.ledgerId} onChange={e => updateOilRow(r.id, 'ledgerId', e.target.value)} className="w-full px-2 py-1 border rounded">
                              <option value="">{translations[language].ledgerNameLabel}</option>
                              {ledgers.map(l => <option key={l.id} value={l.id}>{l.ledger_name}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1"><input type="number" value={r.quantity} onChange={e => updateOilRow(r.id, 'quantity', e.target.value)} className="w-full px-2 py-1 border rounded text-right" /></td>
                          <td className="px-2 py-1"><input type="number" value={r.rate} onChange={e => updateOilRow(r.id, 'rate', e.target.value)} className="w-full px-2 py-1 border rounded text-right" /></td>
                          <td className="px-2 py-1 text-right text-gray-500">{((parseFloat(r.quantity) || 0) * (parseFloat(r.rate) || 0)).toFixed(2)}</td>
                          <td className="px-2 py-1"><input type="number" value={r.odometer} onChange={e => updateOilRow(r.id, 'odometer', e.target.value)} className="w-full px-2 py-1 border rounded text-right" /></td>
                          <td className="px-2 py-1"><input value={r.remarks} onChange={e => updateOilRow(r.id, 'remarks', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="px-2 py-1 text-center"><button onClick={() => deleteOilRow(r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={addOilRow} className="w-full text-xs text-blue-600 hover:bg-blue-50 py-2 border-t">{translations[language].addRow}</button>
                </div>
              </div>

              {/* Totals */}
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                <div className="border rounded-md p-3">
                  <label className="block text-xs font-bold text-gray-500 mb-1">{translations[language].totalQuantity}</label>
                  <input readOnly value={oilTotalQuantity} className="w-full px-2 py-1 border rounded bg-gray-50 text-right font-bold" />
                </div>
                <div className="border rounded-md p-3">
                  <label className="block text-xs font-bold text-gray-500 mb-1">{translations[language].totalAmount}</label>
                  <input readOnly value={oilTotalAmount.toFixed(2)} className="w-full px-2 py-1 border rounded bg-gray-50 text-right font-bold" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
                <button onClick={handleSaveOil} className="bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-4 py-2 rounded-md">{translations[language].save}</button>
                <button onClick={handleSaveOil} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].modify}</button>
                <button onClick={handleDeleteOil} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].delete}</button>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].filter}</button>
                <button onClick={clearOilForm} className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].clear}</button>
                <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md">{translations[language].returnBtn}</button>
              </div>
            </div>
          )}

          {activeTab === 'transaction' && activeSubTabs.transaction !== 'oilUsage' && (
            <TransactionModule supabase={supabase} userRole={userRole} language={language} subTab={activeSubTabs.transaction} onSubTabChange={(k) => setActiveSubTabs((p) => ({ ...p, transaction: k }))} />
          )}

          {activeTab === 'financial' && (
            <FinancialModule supabase={supabase} userRole={userRole} language={language} subTab={activeSubTabs.financial} onSubTabChange={(k) => setActiveSubTabs((p) => ({ ...p, financial: k }))} />
          )}

          {activeTab === 'admin' && userRole === 'employer' && (
            <AdminModule supabase={supabase} userRole={userRole} language={language} subTab={activeSubTabs.admin} onSubTabChange={(k) => setActiveSubTabs((p) => ({ ...p, admin: k }))} />
          )}

          {activeTab === 'masters' && userRole === 'employer' && (
            <MastersModule supabase={supabase} language={language} subTab={activeSubTabs.masters} onSubTabChange={(k) => setActiveSubTabs((p) => ({ ...p, masters: k }))} />
          )}

          {activeTab === 'initialSettings' && userRole === 'employer' && (
            <InitialSettingsModule supabase={supabase} userRole={userRole} language={language} subTab={activeSubTabs.initialSettings} onSubTabChange={(k) => setActiveSubTabs((p) => ({ ...p, initialSettings: k }))} />
          )}

          {activeTab === 'reports' && (
            <ReportsModule supabase={supabase} language={language} />
          )}
        </div>
      </div>
    </div>
  );
}
