import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Upload, Wallet, Moon, Sun } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

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
        {/* Optional: Hide labels on very small screens if needed, but usually helpful */}
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

  return (
    <>
      {/* --- TOP NAVBAR (Universal) --- */}
      {/* On Mobile: Just Logo + Theme. On Desktop: Logo + Links + Theme */}
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

            {/* Desktop Navigation (Hidden on Mobile) */}
            <div className="hidden sm:flex items-center space-x-2">
              <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavLink to="/transactions" icon={CreditCard} label="Transactions" />
              <NavLink to="/upload" icon={Upload} label="Import CSV" />
            </div>

            {/* Right Section: Theme Toggle + Profile */}
            <div className="flex items-center gap-3 pl-4 sm:border-l border-border ml-2">
               <ThemeToggle />
               <div className="hidden sm:flex gap-3">
                 <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs ring-2 ring-background">R</div>
                 <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center text-pink-700 dark:text-pink-300 font-bold text-xs ring-2 ring-background">S</div>
               </div>
            </div>

          </div>
        </div>
      </nav>

      {/* --- MOBILE BOTTOM FLOATING NAVBAR (Liquid Glass) --- */}
      <div className="fixed bottom-6 left-4 right-4 sm:hidden z-50">
        <div className="
          flex items-center justify-around h-16 px-2
          bg-white/80 dark:bg-black/60 
          backdrop-blur-xl saturate-150
          border border-white/20 dark:border-white/10
          rounded-2xl shadow-2xl
          ring-1 ring-black/5 dark:ring-white/5
        ">
          <NavLink to="/" icon={LayoutDashboard} label="Home" mobile />
          <NavLink to="/transactions" icon={CreditCard} label="Transact" mobile />
          <NavLink to="/upload" icon={Upload} label="Import" mobile />
        </div>
      </div>
    </>
  );
}