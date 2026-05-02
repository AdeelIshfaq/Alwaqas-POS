-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users / Staff table (extends auth.users)
CREATE TABLE staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'Pcs',
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_no TEXT NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT 'Walk-in',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  profit NUMERIC(12,2) NOT NULL DEFAULT 0,
  pay_mode TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'paid',
  from_quote_id UUID,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_no TEXT NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL DEFAULT 'Unknown',
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  pay_mode TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_no TEXT NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT 'Walk-in',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  sale_id UUID,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ledger
CREATE TABLE ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('customer', 'vendor')),
  party_id UUID NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit NUMERIC(12,2) NOT NULL DEFAULT 0,
  ref TEXT,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES staff(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Staff policies
CREATE POLICY "staff_select_all" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff_insert_super" ON staff FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "staff_update_super" ON staff FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'super_admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "staff_delete_super" ON staff FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid() AND role = 'super_admin')
);

-- Allow all for other tables (authenticated users)
CREATE POLICY "allow_all" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON quotations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE quotations;
ALTER PUBLICATION supabase_realtime ADD TABLE ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- Function to auto-create staff record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.staff (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data
INSERT INTO categories (name) VALUES
  ('Paints'),
  ('Hardware'),
  ('Tools'),
  ('Plumbing'),
  ('Electrical');

INSERT INTO products (name, category_id, unit, cost_price, sale_price, stock, min_stock)
SELECT 'Wall Paint White 20L', id, 'Can', 1800, 2400, 25, 5 FROM categories WHERE name = 'Paints';

INSERT INTO products (name, category_id, unit, cost_price, sale_price, stock, min_stock)
SELECT 'Primer Coat 4L', id, 'Can', 450, 650, 40, 8 FROM categories WHERE name = 'Paints';

INSERT INTO products (name, category_id, unit, cost_price, sale_price, stock, min_stock)
SELECT 'Cement 50kg', id, 'Bag', 700, 950, 100, 20 FROM categories WHERE name = 'Hardware';

INSERT INTO products (name, category_id, unit, cost_price, sale_price, stock, min_stock)
SELECT 'Steel Wire 1kg', id, 'KG', 180, 280, 60, 10 FROM categories WHERE name = 'Hardware';

INSERT INTO products (name, category_id, unit, cost_price, sale_price, stock, min_stock)
SELECT 'Drill Machine', id, 'Pcs', 2500, 3500, 8, 2 FROM categories WHERE name = 'Tools';

INSERT INTO products (name, category_id, unit, cost_price, sale_price, stock, min_stock)
SELECT 'Paint Brush Set', id, 'Set', 120, 200, 30, 5 FROM categories WHERE name = 'Tools';

INSERT INTO products (name, category_id, unit, cost_price, sale_price, stock, min_stock)
SELECT 'PVC Pipe 1"', id, 'Ft', 35, 55, 200, 50 FROM categories WHERE name = 'Plumbing';

INSERT INTO products (name, category_id, unit, cost_price, sale_price, stock, min_stock)
SELECT 'Wire 3-Core 1mm', id, 'Ft', 22, 38, 300, 60 FROM categories WHERE name = 'Electrical';

INSERT INTO customers (name, phone, address) VALUES
  ('Ahmed Construction', '0321-1234567', 'Main Market, Islamabad'),
  ('Malik Builders', '0333-7654321', 'G-9, Islamabad');

INSERT INTO vendors (name, phone, address) VALUES
  ('Metro Paint Suppliers', '0300-1112222', 'Industrial Area'),
  ('National Hardware Co', '0311-3334444', 'Raja Bazaar');
