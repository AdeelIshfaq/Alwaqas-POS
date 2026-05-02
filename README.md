# HardwarePOS — Next.js + Supabase

A complete POS (Point of Sale) system for **Paint & Hardware Shops**, built with **Next.js 15**, **Supabase**, and **Tailwind CSS**. Deploy-ready for **Vercel**.

## Features

### Core POS
- **Sales POS** — Fast checkout with product grid, cart management, discount, multiple payment modes (cash/credit/card)
- **Inventory Management** — Products with categories, stock tracking, low-stock alerts, cost/sale pricing
- **Quotations** — Create quotes, approve/reject, convert directly to sales
- **Purchases** — Purchase orders with vendor tracking, auto stock update
- **Customers & Vendors** — Contact management with outstanding balance tracking
- **Ledgers** — Full customer & vendor ledger with running balance, manual adjustments
- **Expenses** — Track shop expenses by category (Rent, Salaries, Utilities, etc.)
- **P&L Reports** — Profit & Loss analysis with period filters, invoice-level profit margins, expense breakdowns
- **Daily Ledger** — Day-wise summary of sales, purchases, expenses
- **Print Invoices** — Clean printable invoice format

### User Management & RBAC
- **Role-Based Access Control** — Three roles: Super Admin, Admin, User
- **Super Admin** — Full access including user management, delete permissions
- **Admin** — Can add/edit data but cannot delete records or manage users
- **User** — Can create transactions (sales, purchases) but limited edit access
- **User Management Page** — Invite new users, assign roles, activate/deactivate accounts
- **Activity Tracking** — All transactions tagged with creator

### Technical
- **Real-time Sync** — All data syncs instantly across devices via Supabase Realtime
- **Authentication** — Secure login with Supabase Auth
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Icons | Lucide React |
| Fonts | Geist Sans + Mono |

## Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **Anon Key** from Project Settings → API
3. Go to the SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
4. Enable Email provider in Authentication → Providers (or configure your preferred auth method)
5. **Important**: Go to Authentication → Policies and disable "Confirm email" for easier testing, or configure SMTP

### 2. Clone & Setup

```bash
git clone <your-repo>
cd hardware-pos-nextjs
npm install
```

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. First User Setup

1. Click "Register" on the login page
2. Enter your details — the first user automatically becomes **Super Admin**
3. Use "Invite User" in the sidebar to add team members

### 6. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo to Vercel and add the environment variables in the dashboard.

## Role Permissions

| Action | Super Admin | Admin | User |
|--------|-------------|-------|------|
| View Dashboard | ✅ | ✅ | ✅ |
| Create Sales | ✅ | ✅ | ✅ |
| Add Products | ✅ | ✅ | ✅ |
| Edit Products | ✅ | ✅ | ✅ |
| Delete Products | ✅ | ❌ | ❌ |
| Delete Customers | ✅ | ❌ | ❌ |
| Delete Vendors | ✅ | ❌ | ❌ |
| Delete Quotations | ✅ | ❌ | ❌ |
| Delete Expenses | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Change User Roles | ✅ | ❌ | ❌ |
| Deactivate Users | ✅ | ❌ | ❌ |

## Project Structure

```
app/
  (dashboard)/           # Protected routes with sidebar layout
    dashboard/           # Overview stats, recent sales, low stock
    pos/                 # Sales point of sale
    inventory/           # Products & categories
    quotations/          # Quotes management
    purchases/           # Purchase orders
    customers/           # Customer management
    vendors/             # Vendor management
    ledger/              # Customer & vendor ledgers
    expenses/            # Expense tracking
    reports/             # P&L reports
    users/               # User management (Super Admin only)
  auth/login/            # Login & registration
  layout.tsx             # Root layout with AuthProvider
components/
  sidebar.tsx            # Navigation sidebar
  auth-provider.tsx      # Auth context with role checks
  ui/                    # Reusable UI components
hooks/
  use-data.ts            # Supabase data hooks with realtime
  use-staff.ts           # Staff/user management hooks
lib/
  supabase/              # Client, server, middleware clients
  utils.ts               # Formatting helpers
types/
  index.ts               # TypeScript types
supabase/migrations/     # Database schema
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `staff` | User accounts with roles (extends auth.users) |
| `categories` | Product categories |
| `products` | Inventory items with stock, pricing |
| `customers` | Customer contacts |
| `vendors` | Supplier contacts |
| `sales` | Sales transactions with items JSON |
| `purchases` | Purchase orders with items JSON |
| `quotations` | Quotes with items JSON |
| `ledger` | Accounting entries (Dr/Cr) |
| `expenses` | Shop expenses |
| `activity_log` | Audit trail |

## Security Notes

- Only **Super Admin** can delete records or manage users
- RLS policies protect the `staff` table — only Super Admins can modify user roles
- The `handle_new_user()` trigger automatically creates staff records on signup
- User deactivation prevents login without deleting data

## Currency

The app uses **Pakistani Rupees (Rs)** formatting by default. Change `formatCurrency()` in `lib/utils.ts` to switch currencies.

## License

MIT
