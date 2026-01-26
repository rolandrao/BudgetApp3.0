# R&S Finance Dashboard 💸

A modern, mobile-first personal finance tracker designed for couples to manage shared and personal expenses with ease. Built with **React**, **Supabase**, and **Shadcn UI**.

![Project Banner](https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=2000&h=600)

## ✨ Features

### 📊 **Interactive Analytics Dashboard**
* **Dynamic Comparison:** Compare spending between any two years (e.g., 2026 vs 2025).
* **Smart Filtering:** Drill down by User (Roland/Sarah) and Type (Shared/Personal).
* **Visual Insights:** Beautiful bar charts and donut charts powered by `Recharts` with custom tooltips.
* **KPI Cards:** Instant view of Total Spend, Monthly Average, and Top Categories with trend indicators.

### 🏭 **"Factory Mode" Transaction Categorization**
* **Speed Workflow:** Categorize transactions one by one with a focused card UI.
* **Keyboard Shortcuts:**
    * `S` → Mark as **Shared** & Next
    * `W` → Mark as **Personal** & Next
    * `X` → **Exclude** & Next
    * `A` / `D` → Navigation
* **Multi-Source Import:** Drag-and-drop support for **Apple Card**, **Chase**, and **Capital One** CSVs with auto-detection.

### 📱 **Mobile-First Design**
* **Responsive Layouts:** Tables transform into clean card lists on mobile devices.
* **Liquid Navigation:** iOS-style floating bottom navigation bar with a glassmorphism effect on mobile.
* **Dark Mode:** Fully supported dark/light theme switching.

### 📝 **Transaction Management**
* **Spreadsheet View:** Full-width editable table for desktop users.
* **Inline Editing:** Click any cell to edit amounts, dates, or descriptions instantly.
* **Advanced Filtering:** Search by description, date range, amount, or category.

---

## 🛠️ Tech Stack

* **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Charts:** [Recharts](https://recharts.org/)
* **Backend / Database:** [Supabase](https://supabase.com/)
* **CSV Parsing:** [PapaParse](https://www.papaparse.com/)

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* A Supabase account and project url/key.

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/finance-tracker.git](https://github.com/yourusername/finance-tracker.git)
    cd finance-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

---

## 🗄️ Database Schema

Run this SQL in your Supabase SQL Editor to set up the table:

```sql
create table public.transactions (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  transaction_date date null,
  description text null,
  amount numeric null,
  category text null,
  paid_by text null, -- 'Roland' or 'Sarah'
  is_shared boolean null default false,
  exclude boolean null default false,
  source text null, -- 'Chase', 'Apple Card', etc.
  constraint transactions_pkey primary key (id)
);
```

## 🎹 Keyboard Shortcuts (Upload Page)

| Key | Action |
| :--- | :--- |
| **S** | Mark as **Shared** (Purple) and Advance |
| **W** | Mark as **Personal** (Blue) and Advance |
| **X** | Mark as **Excluded** (Grey) and Advance |
| **A** | Go to Previous Transaction |
| **D** | Skip to Next Transaction |

## 📄 License

This project is open source and available under the [MIT License](LICENSE).