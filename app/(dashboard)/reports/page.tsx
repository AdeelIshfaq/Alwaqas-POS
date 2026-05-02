'use client';

import { useState, useMemo } from 'react';
import { useSales, usePurchases, useExpenses } from '@/hooks/use-data';
import { StatCard, Card } from '@/components/ui/card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, today } from '@/lib/utils';

export default function ReportsPage() {
  const { sales } = useSales();
  const { purchases } = usePurchases();
  const { expenses } = useExpenses();

  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState(today().slice(0, 8) + '01');
  const [to, setTo] = useState(today());
  const [tab, setTab] = useState<'pl' | 'inv' | 'exp'>('pl');

  const inRange = (date: string) => date >= from && date <= to;

  const filtSales = useMemo(() => sales.filter((s) => s.status !== 'cancelled' && inRange(s.date)), [sales, from, to]);
  const filtExp = useMemo(() => expenses.filter((e) => inRange(e.date)), [expenses, from, to]);
  const filtPurch = useMemo(() => purchases.filter((p) => inRange(p.date)), [purchases, from, to]);

  const revenue = filtSales.reduce((a, s) => a + s.total, 0);
  const cogs = filtSales.reduce((a, s) => a + s.items.reduce((b, i) => b + (i.cost || 0) * i.qty, 0), 0);
  const grossProfit = revenue - cogs;
  const totalExp = filtExp.reduce((a, e) => a + e.amount, 0);
  const netProfit = grossProfit - totalExp;
  const totalPurch = filtPurch.reduce((a, p) => a + p.total, 0);
  const margin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0';
  const netMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0';

  const invoiceRows = filtSales.map((s) => ({
    ...s,
    cogs: s.items.reduce((a, i) => a + (i.cost || 0) * i.qty, 0),
    grossP: s.profit || 0,
    margin: s.total > 0 ? (((s.profit || 0) / s.total) * 100).toFixed(1) : '0',
  }));

  const expByCat = filtExp.reduce((acc: Record<string, number>, e) => {
    acc[e.category || 'Other'] = (acc[e.category || 'Other'] || 0) + e.amount;
    return acc;
  }, {});

  const setPreset = (p: string) => {
    setPeriod(p);
    const t = today();
    if (p === 'today') { setFrom(t); setTo(t); }
    else if (p === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); setFrom(d.toISOString().slice(0, 10)); setTo(t); }
    else if (p === 'month') { setFrom(t.slice(0, 8) + '01'); setTo(t); }
    else if (p === 'year') { setFrom(t.slice(0, 4) + '-01-01'); setTo(t); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">P&L Reports</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Profit & Loss Analysis</p>
        </div>
      </div>

      <Card className="mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          {['today', 'week', 'month', 'year', 'custom'].map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                period === p ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border hover:bg-secondary/80'
              }`}
            >
              {p}
            </button>
          ))}
          {period === 'custom' && (
            <>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg bg-secondary border border-border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg bg-secondary border border-border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Revenue" value={formatCurrency(revenue)} color="orange" />
        <StatCard label="COGS" value={formatCurrency(cogs)} color="red" />
        <StatCard label="Gross Profit" value={formatCurrency(grossProfit)} subtext={`Margin: ${margin}%`} color="green" />
        <StatCard label="Expenses" value={formatCurrency(totalExp)} color="red" />
        <StatCard label="Net Profit" value={formatCurrency(netProfit)} subtext={`Net Margin: ${netMargin}%`} color={netProfit >= 0 ? 'green' : 'red'} />
        <StatCard label="Purchases" value={formatCurrency(totalPurch)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit mb-5">
        {[
          { id: 'pl' as const, label: 'P&L Summary' },
          { id: 'inv' as const, label: 'Invoice Profit' },
          { id: 'exp' as const, label: 'Expense Breakdown' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pl' && (
        <Card className="max-w-lg">
          <h3 className="text-sm font-bold mb-4">Profit & Loss Statement</h3>
          {[
            { label: 'Sales Revenue', val: revenue, color: 'text-orange-400' },
            { label: '(-) Cost of Goods Sold', val: -cogs, color: 'text-red-400' },
            null,
            { label: '= Gross Profit', val: grossProfit, color: 'text-green-400', bold: true },
            { label: 'Gross Margin', val: margin + '%', color: 'text-muted-foreground', isStr: true },
            null,
            { label: '(-) Rent & Utilities', val: -filtExp.filter((e) => ['Rent', 'Utilities'].includes(e.category)).reduce((a, e) => a + e.amount, 0), color: 'text-red-400' },
            { label: '(-) Salaries', val: -filtExp.filter((e) => e.category === 'Salaries').reduce((a, e) => a + e.amount, 0), color: 'text-red-400' },
            { label: '(-) Other Expenses', val: -filtExp.filter((e) => !['Rent', 'Utilities', 'Salaries'].includes(e.category)).reduce((a, e) => a + e.amount, 0), color: 'text-red-400' },
            null,
            { label: '= Net Profit / Loss', val: netProfit, color: netProfit >= 0 ? 'text-green-400' : 'text-red-400', bold: true },
            { label: 'Net Margin', val: netMargin + '%', color: 'text-muted-foreground', isStr: true },
          ].map((row, i) =>
            row === null ? (
              <hr key={i} className="border-border my-3" />
            ) : (
              <div key={i} className={`flex justify-between py-1.5 border-b border-border last:border-b-0 ${row.bold ? 'font-bold' : ''}`}>
                <span className={`text-sm ${row.bold ? 'text-foreground' : 'text-muted-foreground'}`}>{row.label}</span>
                <span className={`font-mono text-sm ${row.color}`}>
                  {row.isStr ? row.val : formatCurrency(Math.abs(row.val as number))}
                </span>
              </div>
            )
          )}
        </Card>
      )}

      {tab === 'inv' && (
        <Table>
          <Thead>
            <Th>Invoice</Th>
            <Th>Date</Th>
            <Th>Customer</Th>
            <Th>Revenue</Th>
            <Th>COGS</Th>
            <Th>Gross Profit</Th>
            <Th>Margin</Th>
          </Thead>
          <Tbody>
            {invoiceRows.length === 0 ? (
              <Tr>
                <Td colSpan={7} className="text-center text-muted-foreground py-8">
                  No sales in period
                </Td>
              </Tr>
            ) : (
              <>
                {invoiceRows.map((s) => (
                  <Tr key={s.id}>
                    <Td className="font-mono text-[11px]">{s.invoice_no}</Td>
                    <Td>{formatDate(s.date)}</Td>
                    <Td>{s.customer_name}</Td>
                    <Td className="font-mono text-orange-400">{formatCurrency(s.total)}</Td>
                    <Td className="font-mono text-red-400">{formatCurrency(s.cogs)}</Td>
                    <Td className="font-mono text-green-400">{formatCurrency(s.grossP)}</Td>
                    <Td>
                      <Badge variant={+s.margin >= 20 ? 'green' : +s.margin >= 10 ? 'yellow' : 'red'}>
                        {s.margin}%
                      </Badge>
                    </Td>
                  </Tr>
                ))}
                <Tr className="bg-secondary/50 font-bold">
                  <Td colSpan={3} className="text-xs">TOTALS</Td>
                  <Td className="font-mono text-orange-400">{formatCurrency(revenue)}</Td>
                  <Td className="font-mono text-red-400">{formatCurrency(cogs)}</Td>
                  <Td className="font-mono text-green-400">{formatCurrency(grossProfit)}</Td>
                  <Td>
                    <Badge variant="blue">{margin}%</Badge>
                  </Td>
                </Tr>
              </>
            )}
          </Tbody>
        </Table>
      )}

      {tab === 'exp' && (
        <Table>
          <Thead>
            <Th>Category</Th>
            <Th>Amount</Th>
            <Th>% of Total</Th>
          </Thead>
          <Tbody>
            {Object.entries(expByCat).length === 0 ? (
              <Tr>
                <Td colSpan={3} className="text-center text-muted-foreground py-8">
                  No expenses in period
                </Td>
              </Tr>
            ) : (
              <>
                {Object.entries(expByCat)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                    <Tr key={cat}>
                      <Td>
                        <Badge variant="purple">{cat}</Badge>
                      </Td>
                      <Td className="font-mono text-red-400">{formatCurrency(amt)}</Td>
                      <Td>{totalExp > 0 ? ((amt / totalExp) * 100).toFixed(1) : 0}%</Td>
                    </Tr>
                  ))}
                <Tr className="bg-secondary/50 font-bold">
                  <Td>TOTAL</Td>
                  <Td className="font-mono text-red-400">{formatCurrency(totalExp)}</Td>
                  <Td>100%</Td>
                </Tr>
              </>
            )}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
