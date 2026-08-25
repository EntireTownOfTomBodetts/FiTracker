import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ComposedChart, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  LayoutDashboard, ClipboardList, ShoppingBag, TrendingUp, Building2, Target,
  Sparkles, Home, Zap, ShoppingCart, Car, Stethoscope, Tv, MoreHorizontal,
  Plane, PiggyBank, Wallet, CreditCard, Plus, Trash2, Pencil, X, Save,
  AlertTriangle, CheckCircle2, ArrowUp, ArrowDown, Layers, DollarSign,
  Info, RotateCcw, Download, Upload,
} from 'lucide-react';

/* ---------------------------------------------------------------------- */
/* Tokens & constants                                                     */
/* ---------------------------------------------------------------------- */

const COLORS = {
  bg: '#15181A',
  panel: '#1D2220',
  panelAlt: '#232927',
  border: 'rgba(232,230,222,0.10)',
  text: '#E8E6DE',
  textMuted: '#93998F',
  copper: '#C97B4A',
  malachite: '#6B9080',
  ochre: '#E0B354',
  rust: '#A85C4A',
  slate: '#7C8CA8',
  clay: '#B08968',
};

const EXPENSE_CATEGORIES = [
  { key: 'housing', label: 'Housing', icon: Home, color: COLORS.slate },
  { key: 'utilities', label: 'Utilities', icon: Zap, color: '#8FA998' },
  { key: 'food', label: 'Food & Groceries', icon: ShoppingCart, color: COLORS.copper },
  { key: 'transportation', label: 'Transportation', icon: Car, color: COLORS.clay },
  { key: 'healthcare', label: 'Healthcare & Insurance', icon: Stethoscope, color: COLORS.rust },
  { key: 'subscriptions', label: 'Subscriptions & Entertainment', icon: Tv, color: '#9B8AA6' },
  { key: 'shopping', label: 'Shopping & Personal', icon: ShoppingBag, color: '#8C7A6B' },
  { key: 'other', label: 'Other', icon: MoreHorizontal, color: '#6B7280' },
];

const DEFAULT_SETTINGS = {
  retirementAnnualSpend: '60000',
  safeWithdrawalRate: '4',
  expectedReturn: '7',
  savingsRateGoal: '25',
  currentAge: '',
  targetAge: '',
};

const ENTRIES_KEY = 'dink-monthly-entries';
const SETTINGS_KEY = 'dink-settings';

const emptyExpenses = () =>
  EXPENSE_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.key]: '' }), {});

const currentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const emptyEntry = () => ({
  month: currentMonthStr(),
  income: '',
  expenses: emptyExpenses(),
  experiences: '',
  retirementContrib: '',
  brokerageContrib: '',
  portfolioValue: '',
  cashSavings: '',
  allocStocks: '',
  allocBonds: '',
  allocCash: '',
  homeValue: '',
  mortgageBalance: '',
  otherDebt: '',
  notes: '',
});

/* ---------------------------------------------------------------------- */
/* localStorage helpers                                                   */
/* ---------------------------------------------------------------------- */

const storageGet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

const storageSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
};

/* ---------------------------------------------------------------------- */
/* Helpers                                                                */
/* ---------------------------------------------------------------------- */

const num = (v) => (v === '' || v === null || v === undefined || isNaN(v) ? 0 : Number(v));

const formatCurrency = (n, decimals = 0) =>
  num(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const formatShort = (n) => {
  const v = num(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}k`;
  return `${sign}$${abs.toFixed(0)}`;
};

const formatPct = (n, decimals = 1) => `${(num(n) * 100).toFixed(decimals)}%`;

const monthLabel = (monthStr) => {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const addMonthsLabel = (monthStr, n) => {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const computeDerived = (entry) => {
  const totalExpenses = EXPENSE_CATEGORIES.reduce((s, c) => s + num(entry.expenses[c.key]), 0);
  const experiences = num(entry.experiences);
  const totalSpending = totalExpenses + experiences;
  const income = num(entry.income);
  const savings = income - totalSpending;
  const savingsRate = income > 0 ? savings / income : 0;
  const portfolioValue = num(entry.portfolioValue);
  const cashSavings = num(entry.cashSavings);
  const homeValue = num(entry.homeValue);
  const mortgageBalance = num(entry.mortgageBalance);
  const otherDebt = num(entry.otherDebt);
  const homeEquity = homeValue - mortgageBalance;
  const netWorth = portfolioValue + cashSavings + homeEquity - otherDebt;
  const investableNetWorth = portfolioValue + cashSavings;
  return {
    ...entry, totalExpenses, experiences, totalSpending, income, savings, savingsRate,
    portfolioValue, cashSavings, homeValue, mortgageBalance, otherDebt, homeEquity,
    netWorth, investableNetWorth,
  };
};

/* ---------------------------------------------------------------------- */
/* Small UI building blocks                                               */
/* ---------------------------------------------------------------------- */

function StatCard({ icon: Icon, label, value, sublabel, trendValue, trendPositive, accent }) {
  return (
    <div className="card stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow">{label}</span>
        <Icon className="w-4 h-4" style={{ color: accent || COLORS.textMuted }} />
      </div>
      <div className="stat-value">{value}</div>
      {sublabel && (
        <div className="flex items-center gap-1 mt-1">
          {trendValue !== undefined && trendValue !== null && (
            <span className={`trend-pill ${trendPositive ? 'trend-up' : 'trend-down'}`}>
              {trendPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
          <span className="sublabel">{sublabel}</span>
        </div>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, accent, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="icon-badge" style={{ borderColor: accent }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h3 className="section-title">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function NumInput({ value, onChange, placeholder = '0', step = '1', min = '0' }) {
  return (
    <input
      type="number"
      className="input"
      value={value}
      min={min}
      step={step}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function InsightCard({ icon: Icon, tone, title, description }) {
  const toneColor = tone === 'good' ? COLORS.malachite : tone === 'warn' ? COLORS.ochre : tone === 'bad' ? COLORS.rust : COLORS.slate;
  return (
    <div className="insight-card" style={{ borderLeftColor: toneColor }}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: toneColor }} />
      <div>
        <div className="insight-title">{title}</div>
        <div className="insight-desc">{description}</div>
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label, currency = true, pct = false }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: p.color || p.fill }} />
          <span className="tooltip-name">{p.name}</span>
          <span className="tooltip-val">
            {pct ? `${p.value}%` : currency ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/* Main app                                                                */
/* ---------------------------------------------------------------------- */

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'entry', label: 'Monthly Entry', icon: ClipboardList },
  { key: 'spending', label: 'Spending', icon: ShoppingBag },
  { key: 'investments', label: 'Investments', icon: TrendingUp },
  { key: 'realestate', label: 'Real Estate', icon: Building2 },
  { key: 'retirement', label: 'Retirement', icon: Target },
  { key: 'insights', label: 'Insights', icon: Sparkles },
];

export default function App() {
  const [entries, setEntries] = useState(() => storageGet(ENTRIES_KEY) || []);
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...(storageGet(SETTINGS_KEY) || {}) }));
  const [settingsDraft, setSettingsDraft] = useState(() => ({ ...DEFAULT_SETTINGS, ...(storageGet(SETTINGS_KEY) || {}) }));
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState(emptyEntry());
  const [editingMonth, setEditingMonth] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [confirmDeleteMonth, setConfirmDeleteMonth] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const importInputRef = useRef(null);

  useEffect(() => {
    if (!savedMsg) return;
    const t = setTimeout(() => setSavedMsg(''), 2200);
    return () => clearTimeout(t);
  }, [savedMsg]);

  useEffect(() => {
    if (!importMsg) return;
    const t = setTimeout(() => setImportMsg(''), 3000);
    return () => clearTimeout(t);
  }, [importMsg]);

  const persistEntries = (next) => {
    setEntries(next);
    storageSet(ENTRIES_KEY, next);
  };

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.month.localeCompare(b.month)).map(computeDerived),
    [entries]
  );
  const latest = sortedEntries.length ? sortedEntries[sortedEntries.length - 1] : null;
  const prev = sortedEntries.length > 1 ? sortedEntries[sortedEntries.length - 2] : null;

  /* ---------------------------- form handlers ---------------------------- */

  const handleField = (key, value) => setFormData((f) => ({ ...f, [key]: value }));
  const handleExpenseField = (key, value) =>
    setFormData((f) => ({ ...f, expenses: { ...f.expenses, [key]: value } }));

  const startEdit = (entry) => {
    setEditingMonth(entry.month);
    setFormData({
      month: entry.month,
      income: String(entry.income ?? ''),
      expenses: EXPENSE_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.key]: String(entry.expenses?.[c.key] ?? '') }), {}),
      experiences: String(entry.experiences ?? ''),
      retirementContrib: String(entry.retirementContrib ?? ''),
      brokerageContrib: String(entry.brokerageContrib ?? ''),
      portfolioValue: String(entry.portfolioValue ?? ''),
      cashSavings: String(entry.cashSavings ?? ''),
      allocStocks: String(entry.allocStocks ?? ''),
      allocBonds: String(entry.allocBonds ?? ''),
      allocCash: String(entry.allocCash ?? ''),
      homeValue: String(entry.homeValue ?? ''),
      mortgageBalance: String(entry.mortgageBalance ?? ''),
      otherDebt: String(entry.otherDebt ?? ''),
      notes: entry.notes ?? '',
    });
    setActiveTab('entry');
  };

  const cancelEdit = () => {
    setEditingMonth(null);
    setFormData(emptyEntry());
  };

  const submitEntry = (e) => {
    e.preventDefault();
    if (!formData.month) return;
    const withoutThisMonth = entries.filter((en) => en.month !== formData.month);
    const next = [...withoutThisMonth, { ...formData }];
    persistEntries(next);
    setSavedMsg(`Saved entry for ${monthLabel(formData.month)}`);
    setEditingMonth(null);
    setFormData(emptyEntry());
  };

  const deleteEntry = (month) => {
    const next = entries.filter((en) => en.month !== month);
    persistEntries(next);
    setConfirmDeleteMonth(null);
  };

  const saveSettings = () => {
    setSettings(settingsDraft);
    storageSet(SETTINGS_KEY, settingsDraft);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const resetAll = () => {
    persistEntries([]);
    setSettings(DEFAULT_SETTINGS);
    setSettingsDraft(DEFAULT_SETTINGS);
    storageSet(SETTINGS_KEY, DEFAULT_SETTINGS);
    setConfirmReset(false);
  };

  const exportData = () => {
    const payload = { entries, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balanced-growth-tracker-backup-${currentMonthStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => importInputRef.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed.entries)) persistEntries(parsed.entries);
        if (parsed.settings) {
          const merged = { ...DEFAULT_SETTINGS, ...parsed.settings };
          setSettings(merged);
          setSettingsDraft(merged);
          storageSet(SETTINGS_KEY, merged);
        }
        setImportMsg('Backup imported successfully.');
      } catch (err) {
        setImportMsg("Couldn't read that file \u2014 make sure it's a backup exported from this app.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /* ------------------------------ insights ------------------------------ */

  const insights = useMemo(() => {
    if (!latest) return [];
    const list = [];
    const goal = num(settings.savingsRateGoal) / 100;

    if (latest.savingsRate >= goal) {
      list.push({ icon: CheckCircle2, tone: 'good', title: 'Savings rate on target', description: `You saved ${formatPct(latest.savingsRate)} of income in ${monthLabel(latest.month)}, at or above your ${formatPct(goal)} goal.` });
    } else if (latest.savingsRate >= goal - 0.05) {
      list.push({ icon: AlertTriangle, tone: 'warn', title: 'Savings rate slightly under goal', description: `${formatPct(latest.savingsRate)} saved this month vs a ${formatPct(goal)} goal \u2014 close, but worth a look at discretionary categories.` });
    } else {
      list.push({ icon: AlertTriangle, tone: 'bad', title: 'Savings rate below goal', description: `${formatPct(latest.savingsRate)} saved this month, well under your ${formatPct(goal)} target. See which categories grew below.` });
    }

    if (sortedEntries.length >= 4) {
      const priorThree = sortedEntries.slice(-4, -1);
      EXPENSE_CATEGORIES.forEach((c) => {
        const priorAvg = priorThree.reduce((s, e) => s + num(e.expenses[c.key]), 0) / priorThree.length;
        const latestVal = num(latest.expenses[c.key]);
        const diff = latestVal - priorAvg;
        if (priorAvg > 10 && diff / priorAvg > 0.15 && diff > 20) {
          list.push({ icon: TrendingUp, tone: 'warn', title: `${c.label} trending up`, description: `${formatCurrency(latestVal)} this month vs a ${formatCurrency(priorAvg)} 3-month average \u2014 up ${Math.round((diff / priorAvg) * 100)}%.` });
        }
      });
    }

    if (latest.totalSpending > 0) {
      const expPct = latest.experiences / latest.totalSpending;
      list.push({
        icon: Plane, tone: 'info', title: 'Experiences share of spending',
        description: `Travel & experiences made up ${formatPct(expPct)} of spending in ${monthLabel(latest.month)}${latest.savingsRate < goal ? ' \u2014 worth weighing against your savings goal this month.' : ', while savings stayed on track.'}`,
      });
    }

    const recent = sortedEntries.slice(-6);
    const avgSpend = recent.reduce((s, e) => s + e.totalSpending, 0) / (recent.length || 1);
    if (avgSpend > 0) {
      const monthsCovered = latest.cashSavings / avgSpend;
      if (monthsCovered < 3) {
        list.push({ icon: Wallet, tone: 'bad', title: 'Emergency fund is thin', description: `Cash savings cover about ${monthsCovered.toFixed(1)} months of spending. Most guidance targets 3\u20136 months before prioritizing extra investing.` });
      } else if (monthsCovered <= 6) {
        list.push({ icon: Wallet, tone: 'good', title: 'Emergency fund in healthy range', description: `Cash savings cover about ${monthsCovered.toFixed(1)} months of spending \u2014 within the typical 3\u20136 month target.` });
      } else {
        list.push({ icon: Wallet, tone: 'info', title: 'Cash cushion is large', description: `Cash savings cover about ${monthsCovered.toFixed(1)} months of spending. Beyond ~6 months, excess cash often loses ground to inflation \u2014 consider investing the surplus.` });
      }
    }

    if (prev) {
      const change = latest.netWorth - prev.netWorth;
      list.push({
        icon: change >= 0 ? ArrowUp : ArrowDown, tone: change >= 0 ? 'good' : 'warn',
        title: `Net worth ${change >= 0 ? 'grew' : 'declined'} month over month`,
        description: `${formatCurrency(Math.abs(change))} ${change >= 0 ? 'increase' : 'decrease'} from ${monthLabel(prev.month)} to ${monthLabel(latest.month)}.`,
      });
    }
    if (sortedEntries.length >= 13) {
      const yearAgo = sortedEntries[sortedEntries.length - 13];
      const change = latest.netWorth - yearAgo.netWorth;
      const pct = yearAgo.netWorth !== 0 ? change / Math.abs(yearAgo.netWorth) : 0;
      list.push({ icon: Layers, tone: change >= 0 ? 'good' : 'warn', title: 'Trailing 12-month net worth change', description: `${change >= 0 ? '+' : ''}${formatCurrency(change)} (${change >= 0 ? '+' : ''}${(pct * 100).toFixed(0)}%) over the last year.` });
    }

    if (latest.homeEquity > 75000 && latest.savingsRate >= goal && avgSpend > 0 && latest.cashSavings / avgSpend >= 5) {
      list.push({
        icon: Building2, tone: 'info', title: 'Strong position if you ever explore more real estate',
        description: `${formatCurrency(latest.homeEquity)} in home equity plus a solid savings rate and cash buffer would support exploring a HELOC or cash-out refinance for a rental property down the road \u2014 no need to act, just noting the option.`,
      });
    }

    return list;
  }, [latest, prev, sortedEntries, settings]);

  /* ------------------------------ FIRE math ------------------------------ */

  const fire = useMemo(() => {
    if (!latest) return null;
    const swr = num(settings.safeWithdrawalRate) / 100;
    const fireNumber = swr > 0 ? num(settings.retirementAnnualSpend) / swr : 0;
    const recent = sortedEntries.slice(-6);
    const avgContribution = recent.length
      ? recent.reduce((s, e) => s + num(e.retirementContrib) + num(e.brokerageContrib), 0) / recent.length
      : 0;
    const annualReturn = num(settings.expectedReturn) / 100;
    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    let cur = latest.investableNetWorth;
    const pmt = avgContribution;
    const maxMonths = 720;
    let months = 0;
    let reached = cur >= fireNumber && fireNumber > 0;
    const points = [{ m: 0, value: cur }];
    while (!reached && months < maxMonths) {
      cur = cur * (1 + monthlyReturn) + pmt;
      months += 1;
      if (months % 12 === 0) points.push({ m: months, value: cur });
      if (fireNumber > 0 && cur >= fireNumber) {
        reached = true;
        points.push({ m: months, value: cur });
      }
    }
    return {
      fireNumber,
      avgContribution,
      monthsToFire: reached ? months : null,
      points,
      currentInvestable: latest.investableNetWorth,
      progress: fireNumber > 0 ? Math.min(latest.investableNetWorth / fireNumber, 1) : 0,
    };
  }, [latest, sortedEntries, settings]);

  /* -------------------------------- charts ------------------------------- */

  const netWorthChartData = sortedEntries.map((e) => ({
    label: monthLabel(e.month),
    Cash: e.cashSavings,
    Investments: e.portfolioValue,
    'Home Equity': Math.max(e.homeEquity, 0),
    'Net Worth': e.netWorth,
  }));

  const incomeSpendData = sortedEntries.map((e) => ({
    label: monthLabel(e.month), Income: e.income, Spending: e.totalSpending, Savings: e.savings,
  }));

  const savingsRateData = sortedEntries.map((e) => ({ label: monthLabel(e.month), Rate: Math.round(e.savingsRate * 1000) / 10 }));

  const categoryTrendData = sortedEntries.map((e) => {
    const row = { label: monthLabel(e.month) };
    EXPENSE_CATEGORIES.forEach((c) => { row[c.label] = num(e.expenses[c.key]); });
    row['Experiences & Travel'] = e.experiences;
    return row;
  });

  const categoryPieData = latest
    ? [
        ...EXPENSE_CATEGORIES.map((c) => ({ name: c.label, value: num(latest.expenses[c.key]), color: c.color })),
        { name: 'Experiences & Travel', value: latest.experiences, color: COLORS.ochre },
      ].filter((d) => d.value > 0)
    : [];

  const portfolioTrendData = sortedEntries.map((e) => ({ label: monthLabel(e.month), Portfolio: e.portfolioValue }));

  const contributionsData = sortedEntries.map((e) => ({
    label: monthLabel(e.month), Retirement: num(e.retirementContrib), Brokerage: num(e.brokerageContrib),
  }));

  const allocationPieData = latest
    ? [
        { name: 'Stocks', value: num(latest.allocStocks), color: COLORS.malachite },
        { name: 'Bonds', value: num(latest.allocBonds), color: COLORS.slate },
        { name: 'Cash / Other', value: num(latest.allocCash), color: COLORS.clay },
      ].filter((d) => d.value > 0)
    : [];

  const realEstateData = sortedEntries.map((e) => ({
    label: monthLabel(e.month), 'Home Value': e.homeValue, Mortgage: e.mortgageBalance, Equity: e.homeEquity,
  }));

  const fireChartData = useMemo(() => {
    if (!fire || !latest) return [];
    const actual = sortedEntries.map((e) => ({ label: monthLabel(e.month), Actual: e.investableNetWorth, Projected: null }));
    const projected = fire.points.map((p) => ({
      label: p.m === 0 ? monthLabel(latest.month) : addMonthsLabel(latest.month, p.m),
      Actual: p.m === 0 ? latest.investableNetWorth : null,
      Projected: p.value,
    }));
    return [...actual.slice(0, -1), ...projected];
  }, [fire, sortedEntries, latest]);

  /* --------------------------------- render -------------------------------- */

  const goalRate = num(settings.savingsRateGoal) / 100;
  const momNetWorthChange = prev ? latest.netWorth - prev.netWorth : null;

  return (
    <div className="app-root">
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '20px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <Layers className="w-5 h-5" style={{ color: COLORS.ochre }} />
            <span className="eyebrow">Household Core Log</span>
          </div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
            Balanced Growth Tracker
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13.5, marginTop: 4 }}>
            Net worth, spending, investing, and real estate for a dual-income household \u2014 built to fund experiences without losing the retirement trajectory.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
        <div className="tab-nav">
          {TABS.map((t) => (
            <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px' }}>
        {!latest && activeTab !== 'entry' && (
          <div className="card empty-state">
            <ClipboardList className="w-8 h-8" style={{ margin: '0 auto 12px', color: COLORS.textMuted }} />
            <p style={{ fontSize: 15, color: COLORS.text, marginBottom: 6 }}>No entries logged yet</p>
            <p style={{ fontSize: 13, marginBottom: 16 }}>Add your first month to start seeing trends, charts, and suggestions.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('entry')}>
              <Plus className="w-3.5 h-3.5" /> Add first entry
            </button>
          </div>
        )}

        {/* --------------------------- OVERVIEW --------------------------- */}
        {activeTab === 'overview' && latest && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Layers} label="Net Worth" accent={COLORS.ochre}
                value={formatShort(latest.netWorth)}
                sublabel={prev ? `vs ${formatShort(prev.netWorth)} prior` : 'first month logged'}
                trendValue={prev ? formatShort(Math.abs(momNetWorthChange)) : undefined}
                trendPositive={momNetWorthChange >= 0} />
              <StatCard icon={PiggyBank} label="Savings Rate" accent={COLORS.malachite}
                value={formatPct(latest.savingsRate)}
                sublabel={`goal ${formatPct(goalRate)}`}
                trendValue={prev ? `${Math.round((latest.savingsRate - prev.savingsRate) * 1000) / 10}pt` : undefined}
                trendPositive={prev ? latest.savingsRate >= prev.savingsRate : true} />
              <StatCard icon={TrendingUp} label="Investable Assets" accent={COLORS.copper}
                value={formatShort(latest.investableNetWorth)}
                sublabel="portfolio + cash" />
              <StatCard icon={Home} label="Home Equity" accent={COLORS.slate}
                value={formatShort(latest.homeEquity)}
                sublabel={latest.homeValue ? `${formatPct(latest.homeEquity / latest.homeValue)} of value` : 'no home value set'} />
            </div>

            <SectionCard icon={Layers} title="Net Worth Strata" accent={COLORS.ochre}>
              <p style={{ color: COLORS.textMuted, fontSize: 12.5, marginTop: -8, marginBottom: 12 }}>
                Layered like a core sample \u2014 cash, investments, and home equity building up, with the net worth line on top (after other debt).
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={netWorthChartData}>
                  <defs>
                    <linearGradient id="gCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.slate} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={COLORS.slate} stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="gInvest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.malachite} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={COLORS.malachite} stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="gHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.clay} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={COLORS.clay} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                  <YAxis tickFormatter={formatShort} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Cash" stackId="1" stroke={COLORS.slate} fill="url(#gCash)" />
                  <Area type="monotone" dataKey="Investments" stackId="1" stroke={COLORS.malachite} fill="url(#gInvest)" />
                  <Area type="monotone" dataKey="Home Equity" stackId="1" stroke={COLORS.clay} fill="url(#gHome)" />
                  <Line type="monotone" dataKey="Net Worth" stroke={COLORS.ochre} strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard icon={DollarSign} title="Income vs Spending" accent={COLORS.copper}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={incomeSpendData}>
                    <CartesianGrid stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                    <YAxis tickFormatter={formatShort} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="Income" fill={COLORS.malachite} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Spending" fill={COLORS.rust} radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="Savings" stroke={COLORS.ochre} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </SectionCard>

              <SectionCard icon={Sparkles} title="Top Insights" accent={COLORS.ochre}>
                {insights.slice(0, 3).map((ins, i) => <InsightCard key={i} {...ins} />)}
                {insights.length === 0 && <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Log a couple more months to unlock trend insights.</p>}
                {insights.length > 3 && (
                  <button className="btn btn-ghost" style={{ marginTop: 4 }} onClick={() => setActiveTab('insights')}>
                    View all {insights.length} insights &rarr;
                  </button>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {/* --------------------------- ENTRY --------------------------- */}
        {activeTab === 'entry' && (
          <div className="flex flex-col gap-5">
            {savedMsg && (
              <div className="card" style={{ borderColor: COLORS.malachite, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.malachite }} />
                <span style={{ fontSize: 13 }}>{savedMsg}</span>
              </div>
            )}
            <form onSubmit={submitEntry} className="flex flex-col gap-5">
              <SectionCard icon={ClipboardList} title={editingMonth ? `Editing ${monthLabel(editingMonth)}` : 'Log a Month'} accent={COLORS.ochre}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Month">
                    <input type="month" className="input" value={formData.month} onChange={(e) => handleField('month', e.target.value)} required />
                  </Field>
                  <Field label="Combined Household Income (after-tax)">
                    <NumInput value={formData.income} onChange={(v) => handleField('income', v)} />
                  </Field>
                  <Field label="Travel & Experiences Spending">
                    <NumInput value={formData.experiences} onChange={(v) => handleField('experiences', v)} />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={ShoppingBag} title="Expenses" accent={COLORS.copper}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <Field key={c.key} label={c.label}>
                      <NumInput value={formData.expenses[c.key]} onChange={(v) => handleExpenseField(c.key, v)} />
                    </Field>
                  ))}
                </div>
              </SectionCard>

              <SectionCard icon={TrendingUp} title="Savings & Investments" accent={COLORS.malachite}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label="Retirement Contributions (401k/IRA/HSA)">
                    <NumInput value={formData.retirementContrib} onChange={(v) => handleField('retirementContrib', v)} />
                  </Field>
                  <Field label="Brokerage / Other Contributions">
                    <NumInput value={formData.brokerageContrib} onChange={(v) => handleField('brokerageContrib', v)} />
                  </Field>
                  <Field label="Total Portfolio Value (end of month)">
                    <NumInput value={formData.portfolioValue} onChange={(v) => handleField('portfolioValue', v)} />
                  </Field>
                  <Field label="Cash / Emergency Savings Balance">
                    <NumInput value={formData.cashSavings} onChange={(v) => handleField('cashSavings', v)} />
                  </Field>
                  <Field label="Allocation: Stocks %">
                    <NumInput value={formData.allocStocks} onChange={(v) => handleField('allocStocks', v)} max="100" />
                  </Field>
                  <Field label="Allocation: Bonds %">
                    <NumInput value={formData.allocBonds} onChange={(v) => handleField('allocBonds', v)} max="100" />
                  </Field>
                  <Field label="Allocation: Cash / Other %">
                    <NumInput value={formData.allocCash} onChange={(v) => handleField('allocCash', v)} max="100" />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={Building2} title="Real Estate & Debt" accent={COLORS.slate}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Home Value (estimate)">
                    <NumInput value={formData.homeValue} onChange={(v) => handleField('homeValue', v)} />
                  </Field>
                  <Field label="Mortgage Balance">
                    <NumInput value={formData.mortgageBalance} onChange={(v) => handleField('mortgageBalance', v)} />
                  </Field>
                  <Field label="Other Debt (cards, auto, loans)">
                    <NumInput value={formData.otherDebt} onChange={(v) => handleField('otherDebt', v)} />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard icon={Info} title="Notes" accent={COLORS.textMuted}>
                <textarea className="textarea" placeholder="Anything unusual this month? (bonus, big trip, repair, etc.)" value={formData.notes} onChange={(e) => handleField('notes', e.target.value)} />
              </SectionCard>

              <div className="flex items-center gap-3">
                <button type="submit" className="btn btn-primary"><Save className="w-3.5 h-3.5" /> {editingMonth ? 'Save Changes' : 'Save Entry'}</button>
                {editingMonth && <button type="button" className="btn btn-ghost" onClick={cancelEdit}><X className="w-3.5 h-3.5" /> Cancel</button>}
              </div>
            </form>

            {sortedEntries.length > 0 && (
              <SectionCard icon={Layers} title="Logged Months" accent={COLORS.ochre}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="entries">
                    <thead>
                      <tr>
                        <th>Month</th><th>Income</th><th>Spending</th><th>Savings Rate</th><th>Net Worth</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...sortedEntries].reverse().map((e) => (
                        <tr key={e.month}>
                          <td className="mono">{monthLabel(e.month)}</td>
                          <td className="mono">{formatCurrency(e.income)}</td>
                          <td className="mono">{formatCurrency(e.totalSpending)}</td>
                          <td className="mono" style={{ color: e.savingsRate >= goalRate ? COLORS.malachite : COLORS.ochre }}>{formatPct(e.savingsRate)}</td>
                          <td className="mono">{formatCurrency(e.netWorth)}</td>
                          <td>
                            <div className="flex items-center gap-2 justify-end">
                              <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => startEdit(e)}><Pencil className="w-3.5 h-3.5" /></button>
                              {confirmDeleteMonth === e.month ? (
                                <>
                                  <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 11.5 }} onClick={() => deleteEntry(e.month)}>Confirm</button>
                                  <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11.5 }} onClick={() => setConfirmDeleteMonth(null)}>Cancel</button>
                                </>
                              ) : (
                                <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setConfirmDeleteMonth(e.month)}><Trash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* --------------------------- SPENDING --------------------------- */}
        {activeTab === 'spending' && latest && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard icon={ShoppingBag} title={`Breakdown \u2014 ${monthLabel(latest.month)}`} accent={COLORS.copper}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                      {categoryPieData.map((d, i) => <Cell key={i} fill={d.color} stroke={COLORS.panel} strokeWidth={2} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center" style={{ marginTop: 8 }}>
                  {categoryPieData.map((d, i) => (
                    <div key={i} className="legend-chip"><span className="legend-swatch" style={{ background: d.color }} />{d.name}</div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard icon={Plane} title="Experiences vs Total Spending" accent={COLORS.ochre}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={sortedEntries.map((e) => ({ label: monthLabel(e.month), Experiences: e.experiences, 'Other Spending': e.totalExpenses }))}>
                    <CartesianGrid stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                    <YAxis tickFormatter={formatShort} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="Other Spending" stackId="s" fill={COLORS.panelAlt} stroke={COLORS.border} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Experiences" stackId="s" fill={COLORS.ochre} radius={[3, 3, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            <SectionCard icon={Layers} title="Category Trend" accent={COLORS.slate}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryTrendData}>
                  <CartesianGrid stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                  <YAxis tickFormatter={formatShort} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<ChartTooltip />} />
                  {EXPENSE_CATEGORIES.map((c) => (
                    <Bar key={c.key} dataKey={c.label} stackId="cat" fill={c.color} />
                  ))}
                  <Bar dataKey="Experiences & Travel" stackId="cat" fill={COLORS.ochre} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>
        )}

        {/* --------------------------- INVESTMENTS --------------------------- */}
        {activeTab === 'investments' && latest && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard icon={TrendingUp} title="Portfolio Value" accent={COLORS.malachite}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={portfolioTrendData}>
                    <defs>
                      <linearGradient id="gPortfolio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.malachite} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={COLORS.malachite} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                    <YAxis tickFormatter={formatShort} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="Portfolio" stroke={COLORS.malachite} fill="url(#gPortfolio)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </SectionCard>

              <SectionCard icon={PiggyBank} title={`Allocation \u2014 ${monthLabel(latest.month)}`} accent={COLORS.copper}>
                {allocationPieData.length ? (
                  <>
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie data={allocationPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                          {allocationPieData.map((d, i) => <Cell key={i} fill={d.color} stroke={COLORS.panel} strokeWidth={2} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip pct={false} currency={false} />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center" style={{ marginTop: 8 }}>
                      {allocationPieData.map((d, i) => (
                        <div key={i} className="legend-chip"><span className="legend-swatch" style={{ background: d.color }} />{d.name}: {d.value}%</div>
                      ))}
                    </div>
                  </>
                ) : <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Add allocation percentages in the monthly entry to see this chart.</p>}
              </SectionCard>
            </div>

            <SectionCard icon={DollarSign} title="Monthly Contributions" accent={COLORS.slate}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={contributionsData}>
                  <CartesianGrid stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                  <YAxis tickFormatter={formatShort} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Retirement" stackId="c" fill={COLORS.malachite} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Brokerage" stackId="c" fill={COLORS.copper} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard icon={PiggyBank} title="Savings Rate Trend" accent={COLORS.ochre}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={savingsRateData}>
                  <CartesianGrid stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip content={<ChartTooltip pct currency={false} />} />
                  <ReferenceLine y={num(settings.savingsRateGoal)} stroke={COLORS.ochre} strokeDasharray="4 4" label={{ value: 'Goal', fill: COLORS.ochre, fontSize: 11 }} />
                  <Line type="monotone" dataKey="Rate" stroke={COLORS.malachite} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>
        )}

        {/* --------------------------- REAL ESTATE --------------------------- */}
        {activeTab === 'realestate' && latest && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={Home} label="Home Value" accent={COLORS.slate} value={formatShort(latest.homeValue)} />
              <StatCard icon={CreditCard} label="Mortgage Balance" accent={COLORS.rust} value={formatShort(latest.mortgageBalance)} />
              <StatCard icon={Layers} label="Home Equity" accent={COLORS.clay} value={formatShort(latest.homeEquity)}
                sublabel={latest.homeValue ? `${formatPct(latest.homeEquity / latest.homeValue)} equity` : undefined} />
            </div>

            {latest.homeValue > 0 && (
              <SectionCard icon={Building2} title="Loan-to-Value" accent={COLORS.slate}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, color: COLORS.textMuted }}>Equity {formatPct(latest.homeEquity / latest.homeValue)}</span>
                  <span style={{ fontSize: 12.5, color: COLORS.textMuted }}>Mortgage {formatPct(latest.mortgageBalance / latest.homeValue)}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min((latest.homeEquity / latest.homeValue) * 100, 100)}%`, background: COLORS.clay }} />
                </div>
              </SectionCard>
            )}

            <SectionCard icon={Layers} title="Home Value, Mortgage & Equity Over Time" accent={COLORS.ochre}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={realEstateData}>
                  <CartesianGrid stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                  <YAxis tickFormatter={formatShort} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Mortgage" fill={COLORS.rust} fillOpacity={0.55} radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="Home Value" stroke={COLORS.slate} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Equity" stroke={COLORS.ochre} strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </SectionCard>

            <div className="insight-card" style={{ borderLeftColor: COLORS.slate }}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: COLORS.slate }} />
              <div>
                <div className="insight-title">On acquiring more property</div>
                <div className="insight-desc">
                  You marked your current focus as balanced growth rather than real estate acquisition, so this tab stays light. If that changes, the numbers to watch are: equity available to pull via a HELOC or cash-out refi (typically up to ~80% combined loan-to-value), your savings rate cushion after a new mortgage payment, and cash reserves of 6+ months since a second property adds vacancy and maintenance risk. The Insights tab will flag it if your position gets strong enough to be worth a look.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------- RETIREMENT --------------------------- */}
        {activeTab === 'retirement' && latest && fire && (
          <div className="flex flex-col gap-5">
            <SectionCard icon={Target} title="Retirement Assumptions" accent={COLORS.ochre}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Target Annual Retirement Spending (today's $)">
                  <NumInput value={settingsDraft.retirementAnnualSpend} onChange={(v) => setSettingsDraft((s) => ({ ...s, retirementAnnualSpend: v }))} />
                </Field>
                <Field label="Safe Withdrawal Rate %">
                  <NumInput value={settingsDraft.safeWithdrawalRate} onChange={(v) => setSettingsDraft((s) => ({ ...s, safeWithdrawalRate: v }))} step="0.1" />
                </Field>
                <Field label="Expected Annual Return %">
                  <NumInput value={settingsDraft.expectedReturn} onChange={(v) => setSettingsDraft((s) => ({ ...s, expectedReturn: v }))} step="0.1" />
                </Field>
                <Field label="Savings Rate Goal %">
                  <NumInput value={settingsDraft.savingsRateGoal} onChange={(v) => setSettingsDraft((s) => ({ ...s, savingsRateGoal: v }))} />
                </Field>
                <Field label="Current Age (optional)">
                  <NumInput value={settingsDraft.currentAge} onChange={(v) => setSettingsDraft((s) => ({ ...s, currentAge: v }))} />
                </Field>
                <Field label="Target Retirement Age (optional)">
                  <NumInput value={settingsDraft.targetAge} onChange={(v) => setSettingsDraft((s) => ({ ...s, targetAge: v }))} />
                </Field>
              </div>
              <div className="flex items-center gap-3" style={{ marginTop: 14 }}>
                <button className="btn btn-primary" onClick={saveSettings}><Save className="w-3.5 h-3.5" /> Save Assumptions</button>
                {settingsSaved && <span style={{ fontSize: 12.5, color: COLORS.malachite }}>Saved</span>}
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={Target} label="FIRE Number" accent={COLORS.ochre} value={formatShort(fire.fireNumber)} sublabel="target investable assets" />
              <StatCard icon={TrendingUp} label="Current Investable Assets" accent={COLORS.malachite} value={formatShort(fire.currentInvestable)} sublabel={`${formatPct(fire.progress)} of target`} />
              <StatCard icon={DollarSign} label="Avg. Monthly Contribution" accent={COLORS.copper} value={formatShort(fire.avgContribution)} sublabel="trailing 6-month average" />
            </div>

            <SectionCard icon={Target} title="Progress to Financial Independence" accent={COLORS.ochre}>
              <div className="progress-track" style={{ height: 14, marginBottom: 10 }}>
                <div className="progress-fill" style={{ width: `${fire.progress * 100}%`, background: `linear-gradient(90deg, ${COLORS.malachite}, ${COLORS.ochre})` }} />
              </div>
              <p style={{ fontSize: 13.5, color: COLORS.textMuted }}>
                {fire.monthsToFire !== null ? (
                  <>At the current savings pace and a {settings.expectedReturn}% assumed return, you're on track to reach your FIRE number of <b style={{ color: COLORS.text }}>{formatCurrency(fire.fireNumber)}</b> around <b style={{ color: COLORS.text }}>{addMonthsLabel(latest.month, fire.monthsToFire)}</b> ({(fire.monthsToFire / 12).toFixed(1)} years from now).</>
                ) : (
                  <>At the current contribution pace, this trajectory doesn't reach your FIRE number within 60 years. Increasing monthly contributions or revisiting the spending target would shorten the runway.</>
                )}
              </p>
            </SectionCard>

            <SectionCard icon={TrendingUp} title="Trajectory" accent={COLORS.malachite}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={fireChartData}>
                  <CartesianGrid stroke={COLORS.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={{ stroke: COLORS.border }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={formatShort} tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={fire.fireNumber} stroke={COLORS.ochre} strokeDasharray="4 4" label={{ value: 'FIRE number', fill: COLORS.ochre, fontSize: 11 }} />
                  <Line type="monotone" dataKey="Actual" stroke={COLORS.malachite} strokeWidth={2.5} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="Projected" stroke={COLORS.slate} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 8 }}>
                Projection is a simplified estimate based on your logged trajectory and the assumptions above \u2014 not a guarantee or personalized financial advice.
              </p>
            </SectionCard>
          </div>
        )}

        {/* --------------------------- INSIGHTS --------------------------- */}
        {activeTab === 'insights' && latest && (
          <div className="flex flex-col gap-5">
            <SectionCard icon={Sparkles} title="What the Data Shows" accent={COLORS.ochre}>
              {insights.length ? insights.map((ins, i) => <InsightCard key={i} {...ins} />) : (
                <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Log a few months of data to unlock trend-based insights.</p>
              )}
            </SectionCard>

            <SectionCard icon={Download} title="Backup & Restore" accent={COLORS.slate}>
              <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
                Data lives only in this browser. Export a backup occasionally, or if you switch computers or browsers, so you don't lose your history.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button className="btn" onClick={exportData}><Download className="w-3.5 h-3.5" /> Export data (.json)</button>
                <button className="btn" onClick={triggerImport}><Upload className="w-3.5 h-3.5" /> Import data (.json)</button>
                <input ref={importInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportFile} />
              </div>
              {importMsg && <p style={{ fontSize: 12.5, color: COLORS.malachite, marginTop: 10 }}>{importMsg}</p>}
            </SectionCard>

            <SectionCard icon={AlertTriangle} title="Danger Zone" accent={COLORS.rust}>
              <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>Clear every logged month and reset assumptions to defaults. This can't be undone \u2014 export a backup first if you might want it later.</p>
              {confirmReset ? (
                <div className="flex items-center gap-3">
                  <button className="btn btn-danger" onClick={resetAll}>Yes, delete everything</button>
                  <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-danger" onClick={() => setConfirmReset(true)}><RotateCcw className="w-3.5 h-3.5" /> Reset all data</button>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
