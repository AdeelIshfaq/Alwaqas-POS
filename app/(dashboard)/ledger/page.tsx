'use client';

import { useState } from 'react';
import { useCustomers, useVendors, useLedger } from '@/hooks/use-data';
import { Card } from '@/components/ui/card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, uid, today } from '@/lib/utils';
import { Plus, User, Factory } from 'lucide-react';

export default function LedgerPage() {
  const { customers } = useCustomers();
  const { vendors } = useVendors();
  const { entries, add } = useLedger();

  const [tab, setTab] = useState<'customer' | 'vendor'>('customer');
  const [partyId, setPartyId] = useState('');
  const [adjModal, setAdjModal] = useState(false);
  const [adjForm, setAdjForm] = useState({
    date: today(),
    type: 'debit' as 'debit' | 'credit',
    desc: '',
    amount: '',
  });

  const parties = tab === 'customer' ? customers : vendors;
  const party = parties.find((p) => p.id === partyId);

  const filteredEntries = entries
    .filter((e) => e.type === tab && e.party_id === partyId)
    .sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  const rows = filteredEntries.map((e) => {
    if (tab === 'customer') {
      running += (e.debit || 0) - (e.credit || 0);
    } else {
      running += (e.credit || 0) - (e.debit || 0);
    }
    return { ...e, balance: running };
  });

  const addAdj = async () => {
    if (!adjForm.amount || !partyId) return;
    await add({
      date: adjForm.date || today(),
      type: tab,
      party_id: partyId,
      description: adjForm.desc || 'Adjustment',
      debit: adjForm.type === 'debit' ? +adjForm.amount : 0,
      credit: adjForm.type === 'credit' ? +adjForm.amount : 0,
      ref: 'manual',
    });
    setAdjModal(false);
    setAdjForm({ date: today(), type: 'debit', desc: '', amount: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ledgers</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Customer & Vendor accounts</p>
        </div>
        {partyId && (
          <button
            onClick={() => setAdjModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adjustment
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit mb-5">
        <button
          onClick={() => { setTab('customer'); setPartyId(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'customer' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-4 h-4" /> Customers
        </button>
        <button
          onClick={() => { setTab('vendor'); setPartyId(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'vendor' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Factory className="w-4 h-4" /> Vendors
        </button>
      </div>

      <div className="mb-5">
        <select
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          className="w-full max-w-sm rounded-lg bg-secondary border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">— Select {tab === 'customer' ? 'Customer' : 'Vendor'} —</option>
          {parties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {party && (
        <Card className="mb-5 flex flex-wrap gap-8">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{tab.toUpperCase()}</div>
            <div className="font-bold text-base mt-0.5">{party.name}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">PHONE</div>
            <div className="text-sm mt-0.5">{party.phone}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
              {tab === 'customer' ? 'OUTSTANDING' : 'PAYABLE'}
            </div>
            <div className={`font-mono font-bold text-lg mt-0.5 ${
              rows.length > 0 && rows[rows.length - 1].balance > 0 ? 'text-red-400' : rows.length > 0 && rows[rows.length - 1].balance < 0 ? 'text-green-400' : 'text-muted-foreground'
            }`}>
              {formatCurrency(rows.length > 0 ? Math.abs(rows[rows.length - 1].balance) : 0)}{' '}
              {rows.length > 0 && rows[rows.length - 1].balance > 0
                ? tab === 'customer' ? 'Due' : 'Payable'
                : rows.length > 0 && rows[rows.length - 1].balance < 0
                ? 'Advance'
                : ''}
            </div>
          </div>
        </Card>
      )}

      {partyId && (
        <Table>
          <Thead>
            <Th>Date</Th>
            <Th>Description</Th>
            <Th>{tab === 'customer' ? 'Debit (Dr)' : 'Payment (Dr)'}</Th>
            <Th>{tab === 'customer' ? 'Credit (Cr)' : 'Purchase (Cr)'}</Th>
            <Th>Balance</Th>
          </Thead>
          <Tbody>
            {rows.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center text-muted-foreground py-8">
                  No transactions
                </Td>
              </Tr>
            ) : (
              rows.map((e) => (
                <Tr key={e.id}>
                  <Td>{formatDate(e.date)}</Td>
                  <Td>{e.description}</Td>
                  <Td className={e.debit > 0 ? (tab === 'customer' ? 'text-red-400' : 'text-green-400') : 'text-muted-foreground'}>
                    {e.debit > 0 ? formatCurrency(e.debit) : '—'}
                  </Td>
                  <Td className={e.credit > 0 ? (tab === 'customer' ? 'text-green-400' : 'text-red-400') : 'text-muted-foreground'}>
                    {e.credit > 0 ? formatCurrency(e.credit) : '—'}
                  </Td>
                  <Td className={`font-mono font-bold ${e.balance > 0 ? 'text-red-400' : e.balance < 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {formatCurrency(Math.abs(e.balance))} {e.balance > 0 ? (tab === 'customer' ? 'Dr' : 'Payable') : e.balance < 0 ? 'Cr' : ''}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      )}

      {/* Adjustment Modal */}
      <Modal open={adjModal} onClose={() => setAdjModal(false)} title="Manual Adjustment" className="max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Date</label>
            <input
              type="date"
              value={adjForm.date}
              onChange={(e) => setAdjForm({ ...adjForm, date: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Type</label>
            <select
              value={adjForm.type}
              onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value as any })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="debit">
                {tab === 'customer' ? 'Debit (Increase Due)' : 'Debit (Payment Made)'}
              </option>
              <option value="credit">
                {tab === 'customer' ? 'Credit (Payment/Decrease)' : 'Credit (Purchase/Invoice)'}
              </option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Description</label>
            <input
              value={adjForm.desc}
              onChange={(e) => setAdjForm({ ...adjForm, desc: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Amount</label>
            <input
              type="number"
              value={adjForm.amount}
              onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={() => setAdjModal(false)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button onClick={addAdj} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
