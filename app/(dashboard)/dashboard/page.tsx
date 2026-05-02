'use client';

import Link from 'next/link';
import { StatCard, Card } from '@/components/ui/card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProducts, useSales, useExpenses } from '@/hooks/use-data';
import { formatCurrency, formatDate, today } from '@/lib/utils';
import { ArrowUpRight, AlertTriangle, ShoppingCart } from 'lucide-react';

export default function DashboardPage() {
  const { products } = useProducts();
  const { sales } = useSales();
  const { expenses } = useExpenses();

  const todayStr = today();
  const todaySales = sales.filter((s) => s.date === todayStr && s.status !== 'cancelled');
  const todayRevenue = todaySales.reduce((a, s) => a + s.total, 0);
  const todayProfit = todaySales.reduce((a, s) => a + (s.profit || 0), 0);
  const todayExp = expenses.filter((e) => e.date === todayStr).reduce((a, e) => a + e.amount, 0);
  const totalRevenue = sales.filter((s) => s.status !== 'cancelled').reduce((a, s) => a + s.total, 0);
  const lowStock = products.filter((p) => p.stock <= p.min_stock);
  const recentSales = [...sales].reverse().slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{formatDate(todayStr)}</p>
        </div>
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          + New Sale
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Today's Sales" value={formatCurrency(todayRevenue)} subtext={`${todaySales.length} invoice(s)`} color="orange" />
        <StatCard label="Today's Profit" value={formatCurrency(todayProfit)} subtext="After COGS" color="green" />
        <StatCard label="Today's Expenses" value={formatCurrency(todayExp)} subtext="Cash out" color="red" />
        <StatCard
          label="Net Today"
          value={formatCurrency(todayProfit - todayExp)}
          subtext="Profit - Expenses"
          color={todayProfit - todayExp >= 0 ? 'green' : 'red'}
        />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} subtext="All time" />
        <StatCard label="Low Stock Items" value={lowStock.length.toString()} subtext="Need reorder" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold">Recent Sales</h3>
            <Link href="/pos" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <Table>
            <Thead>
              <Th>Invoice</Th>
              <Th>Customer</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
            </Thead>
            <Tbody>
              {recentSales.length === 0 ? (
                <Tr>
                  <Td colSpan={4} className="text-center text-muted-foreground py-8">
                    No sales yet
                  </Td>
                </Tr>
              ) : (
                recentSales.map((s) => (
                  <Tr key={s.id}>
                    <Td className="font-mono text-[11px]">{s.invoice_no}</Td>
                    <Td>{s.customer_name || 'Walk-in'}</Td>
                    <Td className="font-mono text-orange-400">{formatCurrency(s.total)}</Td>
                    <Td>
                      <Badge
                        variant={
                          s.status === 'paid' ? 'green' : s.status === 'credit' ? 'yellow' : 'red'
                        }
                      >
                        {s.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Low Stock Alert
            </h3>
            <Link href="/inventory" className="text-xs text-primary hover:underline flex items-center gap-1">
              Inventory <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">All items well-stocked</div>
          ) : (
            <Table>
              <Thead>
                <Th>Product</Th>
                <Th>Stock</Th>
                <Th>Min</Th>
              </Thead>
              <Tbody>
                {lowStock.map((p) => (
                  <Tr key={p.id}>
                    <Td>{p.name}</Td>
                    <Td>
                      <Badge variant="red">
                        {p.stock} {p.unit}
                      </Badge>
                    </Td>
                    <Td className="text-muted-foreground text-xs">{p.min_stock}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
