'use client';

import { useState } from 'react';
import { useProducts, useCustomers, useSales, useQuotations, useLedger } from '@/hooks/use-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, uid, today, generateInvoiceNo } from '@/lib/utils';
import { Search, Minus, Plus, Trash2, Printer, X, ClipboardList } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  unit: string;
  qty: number;
}

export default function POSPage() {
  const { products, update: updateProduct } = useProducts();
  const { customers } = useCustomers();
  const { add: addSale } = useSales();
  const { quotations, update: updateQuote } = useQuotations();
  const { add: addLedger } = useLedger();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [payMode, setPayMode] = useState<'cash' | 'credit' | 'card'>('cash');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [invoice, setInvoice] = useState<any>(null);
  const [loadQuoteOpen, setLoadQuoteOpen] = useState(false);
  const [fromQuote, setFromQuote] = useState<string | null>(null);

  const pendingQuotes = quotations.filter((q) => q.status === 'approved' || q.status === 'pending');
  const cats = [...new Set(products.map((p) => p.category_id).filter(Boolean))];

  const addToCart = (p: any) => {
    setCart((prev) => {
      const ex = prev.find((x) => x.id === p.id);
      if (ex) return prev.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x));
      return [...prev, { id: p.id, name: p.name, price: p.sale_price, cost: p.cost_price, unit: p.unit, qty: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { setCart((prev) => prev.filter((x) => x.id !== id)); return; }
    setCart((prev) => prev.map((x) => (x.id === id ? { ...x, qty } : x)));
  };

  const updatePrice = (id: string, price: number) => {
    setCart((prev) => prev.map((x) => (x.id === id ? { ...x, price } : x)));
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((x) => x.id !== id));

  const subtotal = cart.reduce((a, x) => a + x.price * x.qty, 0);
  const discAmt = subtotal * (discount / 100);
  const total = subtotal - discAmt;
  const profit = cart.reduce((a, x) => a + (x.price - x.cost) * x.qty, 0) - discAmt;

  const customer = customers.find((c) => c.id === customerId);

  const loadQuotation = (q: any) => {
    setCart(q.items.map((i: any) => ({ ...i })));
    setCustomerId(q.customer_id || '');
    setDiscount(q.discount || 0);
    setFromQuote(q.id);
    setLoadQuoteOpen(false);
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    const invNo = generateInvoiceNo();
    const sale = {
      id: uid(),
      invoice_no: invNo,
      date: today(),
      customer_id: customerId || null,
      customer_name: customer?.name || 'Walk-in',
      items: cart.map((x) => ({ product_id: x.id, name: x.name, qty: x.qty, price: x.price, cost: x.cost, unit: x.unit })),
      subtotal,
      discount,
      discount_amount: discAmt,
      total,
      profit,
      pay_mode: payMode,
      status: payMode === 'credit' ? 'credit' : 'paid',
      from_quote_id: fromQuote,
    };

    await addSale(sale);

    // Update stock
    for (const item of cart) {
      const prod = products.find((p) => p.id === item.id);
      if (prod) {
        await updateProduct(item.id, { stock: prod.stock - item.qty });
      }
    }

    // Ledger for credit
    if (payMode === 'credit' && customerId) {
      await addLedger({
        date: today(),
        type: 'customer',
        party_id: customerId,
        description: `Credit Sale - ${invNo}`,
        debit: total,
        credit: 0,
        ref: sale.id,
      });
    }

    // Mark quotation converted
    if (fromQuote) {
      await updateQuote(fromQuote, { status: 'converted', sale_id: sale.id });
    }

    setInvoice(sale);
    setCart([]);
    setDiscount(0);
    setCustomerId('');
    setFromQuote(null);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (catFilter === '' || p.category_id === catFilter) &&
      p.stock > 0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales POS</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">New transaction</p>
        </div>
        <button
          onClick={() => setLoadQuoteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-secondary border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          Load Quotation
        </button>
      </div>

      {fromQuote && (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-sm text-green-400 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Loaded from Quotation — review and complete sale
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 h-[calc(100vh-180px)]">
        {/* Products */}
        <div className="overflow-y-auto scrollbar-thin pr-1">
          <div className="sticky top-0 bg-background pb-3 z-10">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg bg-secondary border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="w-36 rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Categories</option>
                {cats.map((c) => {
                  const catProd = products.find((p) => p.category_id === c);
                  return <option key={c} value={c}>{catProd?.category_id || c}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="text-left rounded-lg border border-border bg-card p-3 hover:border-primary/50 hover:bg-secondary/50 transition-all"
              >
                <div className="font-semibold text-sm leading-tight">{p.name}</div>
                <div className="text-orange-400 font-mono text-sm mt-1">
                  {formatCurrency(p.sale_price)}
                  <span className="text-muted-foreground text-[10px]"> /{p.unit}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Stock: {p.stock}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-10">No products found</div>
            )}
          </div>
        </div>

        {/* Cart */}
        <Card className="flex flex-col h-full p-0 overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm">
                Cart{' '}
                <span className="text-orange-400">
                  {cart.length > 0 ? `(${cart.reduce((a, x) => a + x.qty, 0)} items)` : ''}
                </span>
              </span>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            {cart.length === 0 && (
              <div className="text-center text-muted-foreground py-10 text-sm">Click products to add</div>
            )}
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-2 border-b border-border last:border-b-0">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="shrink-0 w-5 h-5 rounded bg-red-500/10 text-red-400 flex items-center justify-center text-[10px] hover:bg-red-500/20"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-5 h-5 rounded border border-border bg-secondary flex items-center justify-center hover:border-primary/50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateQty(item.id, +e.target.value)}
                        min="1"
                        className="w-10 text-center bg-secondary border border-border rounded px-1 py-0.5 text-xs"
                      />
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-5 h-5 rounded border border-border bg-secondary flex items-center justify-center hover:border-primary/50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updatePrice(item.id, +e.target.value)}
                      className="w-16 bg-secondary border border-border rounded px-1.5 py-0.5 text-xs"
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-orange-400 font-mono text-sm">{formatCurrency(item.price * item.qty)}</div>
                  <div className="text-[10px] text-muted-foreground">{item.qty} × {item.price}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Discount</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(+e.target.value)}
                    min="0"
                    max="100"
                    className="w-12 bg-secondary border border-border rounded px-1.5 py-0.5 text-xs text-right"
                  />
                  <span className="text-muted-foreground text-xs">%</span>
                  <span className="font-mono text-red-400 text-xs">-{formatCurrency(discAmt)}</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span className="font-mono text-orange-400">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-green-400 font-mono">
                <span>Est. Profit</span>
                <span>{formatCurrency(profit)}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-3 mb-3">
              {(['cash', 'credit', 'card'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayMode(m)}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-colors ${
                    payMode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary border border-border hover:bg-secondary/80'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={completeSale}
              className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Complete Sale {formatCurrency(total)}
            </button>
          </div>
        </Card>
      </div>

      {/* Invoice Modal */}
      <Modal open={!!invoice} onClose={() => setInvoice(null)} title="Invoice" className="max-w-md">
        {invoice && (
          <div id="invoice-print">
            <div className="text-center mb-4 pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-orange-400">⚙ HardwarePOS</h2>
              <div className="text-xs text-muted-foreground">Paint & Hardware Shop</div>
              <div className="flex justify-between text-xs mt-3">
                <span><b>Invoice:</b> {invoice.invoice_no}</span>
                <span><b>Date:</b> {invoice.date}</span>
              </div>
              <div className="text-left text-xs mt-1">
                <b>Customer:</b> {invoice.customer_name} | <b>Payment:</b>{' '}
                <span className="capitalize">{invoice.pay_mode}</span>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1">#</th>
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Rate</th>
                  <th className="text-right py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-1 text-muted-foreground">{i + 1}</td>
                    <td className="py-1">{item.name}</td>
                    <td className="py-1 text-center">{item.qty} {item.unit}</td>
                    <td className="py-1 text-right font-mono">{item.price}</td>
                    <td className="py-1 text-right font-mono text-orange-400">
                      {formatCurrency(item.price * item.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-3 border-t border-border">
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Discount ({invoice.discount}%)</span>
                  <span className="font-mono text-red-400">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base mt-2">
                <span>Total</span>
                <span className="font-mono text-orange-400">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
            {invoice.from_quote_id && (
              <div className="mt-2 text-[10px] text-muted-foreground">Converted from Quotation</div>
            )}
            <div className="text-center mt-4 text-[10px] text-muted-foreground">Thank you for your business!</div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={() => setInvoice(null)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </Modal>

      {/* Load Quotation Modal */}
      <Modal open={loadQuoteOpen} onClose={() => setLoadQuoteOpen(false)} title="Load Quotation">
        {pendingQuotes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending quotations</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-3 py-2 text-left text-[10px] uppercase font-mono text-muted-foreground">Quote #</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase font-mono text-muted-foreground">Customer</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase font-mono text-muted-foreground">Amount</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase font-mono text-muted-foreground">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingQuotes.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2 font-mono text-[11px]">{q.quote_no}</td>
                    <td className="px-3 py-2">{q.customer_name || 'Walk-in'}</td>
                    <td className="px-3 py-2 font-mono text-orange-400">{formatCurrency(q.total)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={q.status === 'approved' ? 'green' : 'yellow'}>{q.status}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => loadQuotation(q)} className="rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90">
                        Load →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button onClick={() => setLoadQuoteOpen(false)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
