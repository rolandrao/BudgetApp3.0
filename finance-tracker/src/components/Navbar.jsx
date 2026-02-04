import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Upload, Wallet, Moon, Sun, LogOut, PieChart, Target, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { supabase } from '../lib/supabase';

// --- CONFIGURATION: UPDATE THESE EMAILS ---
const ROLAND_EMAIL = "rolandrao@gmail.com"; 
const SARAH_EMAIL = "sarah.email@gmail.com"; 

// --- Helper: Navigation Link Component ---
function NavLink({ to, icon: Icon, label, mobile = false }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  if (mobile) {
    return (
      <Link to={to} className="flex flex-col items-center justify-center w-full h-full gap-1">
        <div className={`p-1.5 rounded-full transition-all duration-300 ${
          isActive 
            ? 'bg-primary text-primary-foreground shadow-md scale-110' 
            : 'text-muted-foreground hover:bg-muted'
        }`}>
          <Icon size={20} />
        </div>
        <span className={`text-[10px] font-medium transition-colors ${
          isActive ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          {label}
        </span>
      </Link>
    )
  }

  // Desktop Link
  return (
    <Link
      to={to}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/20 dark:text-blue-400' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }
      `}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    // 1. Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const ThemeToggle = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full hover:bg-muted"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );

  // Helper to check identity
  const isRoland = userEmail && userEmail.toLowerCase() === ROLAND_EMAIL.toLowerCase();
  const isSarah = userEmail && userEmail.toLowerCase() === SARAH_EMAIL.toLowerCase();

  return (
    <>
      {/* --- TOP NAVBAR (Universal) --- */}
      <nav className="w-full bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-lg text-white shadow-lg">
                <Wallet size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground hidden sm:block">
                R&S Finance
              </span>
              <span className="font-bold text-xl tracking-tight text-foreground sm:hidden">
                R&S
              </span>
            </div>

            {/* Desktop Navigation (Center) */}
            <div className="hidden md:flex items-center space-x-2">
              <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavLink to="/budget" icon={PieChart} label="Budget" />
              <NavLink to="/goals" icon={Target} label="Goals" />
              <NavLink to="/transactions" icon={CreditCard} label="Transactions" />
              <NavLink to="/upload" icon={Upload} label="Import" />
            </div>

            {/* Right Section: Settings + Theme + Sign Out */}
            <div className="flex items-center gap-1 pl-2 sm:border-l border-border ml-2">
               
               {/* NEW: Settings Link (Visible on Mobile & Desktop) */}
               <Link to="/settings">
                 <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted text-muted-foreground">
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                 </Button>
               </Link>

               <ThemeToggle />
               
               {/* Mobile Sign Out (Icon Only) */}
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={handleSignOut} 
                 className="sm:hidden text-muted-foreground hover:text-destructive"
               >
                 <LogOut className="h-[1.2rem] w-[1.2rem]" />
               </Button>

               {/* Desktop Sign Out (Text Button) */}
               <Button 
                 variant="ghost" 
                 className="hidden sm:flex text-xs text-muted-foreground hover:text-destructive"
                 onClick={handleSignOut}
               >
                 Sign Out
               </Button>

               {/* Desktop Avatars */}
               <div className="hidden sm:flex gap-2 ml-2 items-center">
                 {/* Roland Badge */}
                 <div className={`
                    h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300
                    ${isRoland 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500 shadow-md scale-110' 
                        : 'bg-muted text-muted-foreground opacity-40 grayscale'
                    }
                 `}>
                    R
                 </div>

                 {/* Sarah Badge */}
                 <div className={`
                    h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300
                    ${isSarah 
                        ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 ring-2 ring-pink-500 shadow-md scale-110' 
                        : 'bg-muted text-muted-foreground opacity-40 grayscale'
                    }
                 `}>
                    S
                 </div>
               </div>
            </div>

          </div>
        </div>
      </nav>

      {/* --- MOBILE BOTTOM FLOATING NAVBAR --- */}
      {/* Kept clean with only the 4 most frequent actions */}
      <div className="fixed bottom-6 left-4 right-4 md:hidden z-50">
        <div className="
          flex items-center justify-around h-16 px-2
          bg-white/90 dark:bg-zinc-900/90 
          backdrop-blur-xl saturate-150
          border border-white/20 dark:border-white/10
          rounded-2xl shadow-2xl
          ring-1 ring-black/5 dark:ring-white/5
        ">
          <NavLink to="/" icon={LayoutDashboard} label="Home" mobile />
          <NavLink to="/budget" icon={PieChart} label="Budget" mobile />
          <NavLink to="/goals" icon={Target} label="Goals" mobile />
          <NavLink to="/transactions" icon={CreditCard} label="Txns" mobile />
        </div>
      </div>
    </>
  );
}