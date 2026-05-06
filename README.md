# Stash

Stash is a modern, professional, and student-focused money management application. Designed with a sleek dark-mode aesthetic, it allows users to effortlessly track their daily expenses, manage monthly targets, and stay financially disciplined.

## Key Features

- **Quick-Log Cards**: Log your expenses in a single tap without cumbersome dropdowns. Features dedicated inputs for Food, Transport, Shopping, and Other.
- **Stash Points System**: A gamified savings approach. Earn 1 Stash Point for every ৳1 saved below your daily limit.
- **Dynamic Budgets**: Set your own Monthly Budget and Daily Limits directly from your personalized dashboard settings.
- **Internationalization**: Full currency switching support (BDT ৳, USD $, INR ₹, SAR ﷼) and a country selection feature that pins your national flag to your profile.
- **Secure Authentication**: Built-in, secure Social Login (Google & GitHub) powered by Supabase OAuth. 

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, Framer Motion
- **Icons**: Lucide React & Custom inline SVGs
- **Backend & Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Environment Setup**: Create a `.env.local` file in the root directory and add your Supabase keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run the local server**: `npm run dev`

Navigate to `http://localhost:3000` to start using Stash.
