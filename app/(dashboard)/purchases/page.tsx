'use client';

import { useState } from 'react';
import { usePurchases, useProducts, useVendors, useLedger } from '@/hooks/use-data';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, uid, today, generatePONo } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface PurchaseItem {
  id: string;
  product_id: string;
  name: string;
  qty: number;
  cost: number;
  unit: string;
}

export default function PurchasesPage() {
  const { purchases, add } = usePurchases();
  const { products, update: updateProduct } = useProducts();
  const { vendors } = useVendors();
  const { add: addLedger } = useLedger();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    vendor_id: '',
    pay_mode: 'cash' as const,
    notes: '',
  });
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const addItem = () => {
    setItems((prev) => [...prev, { id: uid(), product_id: '', name: '', qty: 1, cost: 0, unit: '' }]);
  };

  const updateItem = (idx: number, field: string, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === 'product_id') {
        const p = products.find((x) => x.id === val);
        updated[idx] = { ...updated[idx], product_id: val, name: p?.name || '', cost: p?.cost_price || 0, unit: p?.unit || '' };
      } else {
        updated[idx] = { ...updated[idx], [field]: field === 'qty' || field === 'cost' ? +val : val };
      }
      return updated;
    });
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((a, x) => a + x.cost * x.qty, 0);
  const vendor = vendors.find((v) => v.id === form.vendor_id);

  const save = async () => {
    if (items.length === 0) return;
    const po = {
      ...form,
      id: uid(),
      po_no: generatePONo(),
      items,
      total,
      vendor_name: vendor?.name || 'Unknown',
    };
    await add(po);

    // Update stock & cost
    for (const item of items) {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod) {
        await updateProduct(item.product_id, { stock: prod.stock + item.qty, cost_price: item.cost || prod.cost_price });
      }
    }

    // Ledger for credit
    if (form.pay_mode === 'credit' && form.vendor_id) {
      await addLedger({
        date: today(),
        type: 'vendor',
        party_id: form.vendor_id,
        description: `Credit Purchase - ${po.po_no}`,
        debit: 0,
        credit: total,
        ref: po.id,
      });
    }

    setModalOpen(false);
    setItems([]);
    setForm({ date: today(), vendor_id: '', pay_mode: 'cash', notes: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{purchases.length} records</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Purchase
        </button>
      </div>

      <Table>
        <Thead>
          <Th>PO #</Th>
          <Th>Date</Th>
          <Th>Vendor</Th>
          <Th>Items</Th>
          <Th>Total</Th>
          <Th>Payment</Th>
        </Thead>
        <Tbody>
          {purchases.length === 0 ? (
            <Tr>
              <Td colSpan={6} className="text-center text-muted-foreground py-8">
                No purchases yet
              </Td>
            </Tr>
          ) : (
            [...purchases].reverse().map((p) => (
              <Tr key={p.id}>
                <Td className="font-mono text-[11px]">{p.po_no}</Td>
                <Td>{formatDate(p.date)}</Td>
                <Td>{p.vendor_name}</Td>
                <Td>{p.items?.length || 0} items</Td>
                <Td className="font-mono text-orange-400">{formatCurrency(p.total)}</Td>
                <Td>
                  <Badge variant={p.pay_mode === 'cash' ? 'green' : 'yellow'}>{p.pay_mode}</Badge>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase Order" className="max-w-2xl">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Vendor</label>
            <select
              value={form.vendor_id}
              onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Payment</label>
            <select
              value={form.pay_mode}
              onChange={(e) => setForm({ ...form, pay_mode: e.target.value as any })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">Items</span>
          <button onClick={addItem} className="rounded-lg bg-secondary border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors">
            + Add Item
          </button>
        </div>

        {items.map((item, idx) => (
          <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 mb-2 items-center">
            <select
              value={item.product_id}
              onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
              className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(idx, 'qty', e.target.value)}
              className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="number"
              placeholder="Cost/unit"
              value={item.cost}
              onChange={(e) => updateItem(idx, 'cost', e.target.value)}
              className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={() => removeItem(idx)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        ))}

        <div className="text-right font-bold mt-3">
          Total: <span className="font-mono text-orange-400">{formatCurrency(total)}</span>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Save Purchase
          </button>
        </div>
      </Modal>
    </div>
  );
}
