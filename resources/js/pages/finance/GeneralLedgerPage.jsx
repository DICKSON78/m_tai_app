import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { BookOpen, Search, Filter, ChevronRight } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 2 }).format(n || 0);

const TYPES = { asset: 'bg-blue-100 text-blue-700', liability: 'bg-red-100 text-red-700', equity: 'bg-purple-100 text-purple-700', revenue: 'bg-green-100 text-green-700', expense: 'bg-orange-100 text-orange-700' };

export default function GeneralLedgerPage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountLedger, setAccountLedger] = useState(null);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchSummary = useCallback(async () => {
    try {
      const [sumRes, accRes] = await Promise.all([
        api.get('/owner/finance/ledger/summary'),
        api.get('/owner/finance/accounts', { params: { per_page: 200 } }),
      ]);
      setSummary(sumRes.data);
      setAccounts(accRes.data.data || []);
    } catch {}
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = { per_page: 50, date_from: dateFrom, date_to: dateTo };
      if (search) params.search = search;
      if (typeFilter) params.account_type = typeFilter;
      const res = await api.get('/owner/finance/ledger', { params });
      setTransactions(res.data.data || []);
      setCurrentPage(res.data.current_page || 1);
      setLastPage(res.data.last_page || 1);
    } catch { setTransactions([]); } finally { setTxLoading(false); }
  }, [dateFrom, dateTo, search, typeFilter]);

  const fetchAccountLedger = useCallback(async (accountId) => {
    setSelectedAccount(accountId);
    setLoading(true);
    try {
      const res = await api.get(`/owner/finance/ledger/account/${accountId}`, { params: { date_from: dateFrom, date_to: dateTo } });
      setAccountLedger(res.data);
    } catch { setAccountLedger(null); } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchSummary(); fetchTransactions(); }, [fetchSummary, fetchTransactions]);

  const groupedAccounts = summary ? {
    asset: summary.assets || [], liability: summary.liabilities || [],
    equity: summary.equity || [], revenue: summary.revenue || [], expenses: summary.expenses || [],
  } : {};

  return (
    <div className="space-y-6">
      <PageHeader title="General Ledger" subtitle="View all account transactions and balances" icon={BookOpen} />

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total Assets', value: fmt(summary.total_assets), color: 'text-blue-600' },
            { label: 'Total Liabilities', value: fmt(summary.total_liabilities), color: 'text-red-600' },
            { label: 'Total Equity', value: fmt(summary.total_equity), color: 'text-purple-600' },
            { label: 'Total Revenue', value: fmt(summary.total_revenue), color: 'text-green-600' },
            { label: 'Total Expenses', value: fmt(summary.total_expenses), color: 'text-orange-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>TZS {s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Accounts</h3>
          {Object.entries(groupedAccounts).map(([type, items]) => (
            items.length > 0 && (
              <div key={type} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPES[type]}`}>{type}</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                  {items.map(acc => (
                    <button key={acc.id} onClick={() => fetchAccountLedger(acc.id)}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedAccount === acc.id ? 'bg-[#00D4AA]/5 border-l-2 border-[#00D4AA]' : ''}`}>
                      <div>
                        <span className="font-mono text-xs text-gray-500 mr-2">{acc.code}</span>
                        <span className="font-medium text-gray-900">{acc.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${acc.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>TZS {fmt(acc.balance)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        <div className="lg:col-span-2">
          {accountLedger ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{accountLedger.account.code} - {accountLedger.account.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Type: <span className="capitalize">{accountLedger.account.type}</span></p>
                  </div>
                  <button onClick={() => { setAccountLedger(null); setSelectedAccount(null); }} className="text-xs text-[#00D4AA] font-medium">Close</button>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3">
                  <div><p className="text-[10px] text-gray-500">Opening</p><p className="text-sm font-bold">TZS {fmt(accountLedger.opening_balance)}</p></div>
                  <div><p className="text-[10px] text-gray-500">Total Debit</p><p className="text-sm font-bold text-blue-600">TZS {fmt(accountLedger.total_debit)}</p></div>
                  <div><p className="text-[10px] text-gray-500">Total Credit</p><p className="text-sm font-bold text-green-600">TZS {fmt(accountLedger.total_credit)}</p></div>
                  <div><p className="text-[10px] text-gray-500">Closing</p><p className="text-sm font-bold">TZS {fmt(accountLedger.closing_balance)}</p></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-xs text-gray-500 uppercase">
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-left px-4 py-2">Ref</th>
                    <th className="text-left px-4 py-2">Description</th>
                    <th className="text-right px-4 py-2">Debit</th>
                    <th className="text-right px-4 py-2">Credit</th>
                    <th className="text-right px-4 py-2">Balance</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-500" colSpan={4}>Opening Balance</td>
                      <td className="px-4 py-2 text-right text-xs font-bold">-</td>
                      <td className="px-4 py-2 text-right text-xs font-bold">TZS {fmt(accountLedger.opening_balance)}</td>
                    </tr>
                    {accountLedger.transactions?.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600">{tx.date}</td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-500">{tx.reference || '-'}</td>
                        <td className="px-4 py-2 text-gray-900">{tx.description}</td>
                        <td className="px-4 py-2 text-right font-medium text-blue-600">{tx.debit > 0 ? fmt(tx.debit) : '-'}</td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">{tx.credit > 0 ? fmt(tx.credit) : '-'}</td>
                        <td className="px-4 py-2 text-right font-bold">TZS {fmt(tx.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h4 className="font-bold text-gray-900">Recent Transactions</h4>
              </div>
              {txLoading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No transactions found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-xs text-gray-500 uppercase">
                      <th className="text-left px-4 py-2">Date</th>
                      <th className="text-left px-4 py-2">Ref</th>
                      <th className="text-left px-4 py-2">Description</th>
                      <th className="text-left px-4 py-2">Account</th>
                      <th className="text-right px-4 py-2">Debit</th>
                      <th className="text-right px-4 py-2">Credit</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-600">{tx.journal_entry?.date}</td>
                          <td className="px-4 py-2 font-mono text-xs text-gray-500">{tx.journal_entry?.reference || '-'}</td>
                          <td className="px-4 py-2 text-gray-900">{tx.description || tx.journal_entry?.description}</td>
                          <td className="px-4 py-2 text-xs"><span className="font-mono text-gray-500">{tx.account?.code}</span> {tx.account?.name}</td>
                          <td className="px-4 py-2 text-right font-medium text-blue-600">{tx.debit > 0 ? fmt(tx.debit) : '-'}</td>
                          <td className="px-4 py-2 text-right font-medium text-green-600">{tx.credit > 0 ? fmt(tx.credit) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
