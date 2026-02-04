import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ThemeProvider } from './components/theme-provider'; 
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';

// --- Page Imports ---
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import UploadPage from './pages/Upload'; 
import Login from './pages/Login';
import BudgetPage from './pages/Budget';
import SavingsGoals from './pages/SavingsGoals';
import SettingsPage from './pages/Settings';

// --- The "Bouncer" Component (Protects Routes) ---
const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for changes (sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
          <Routes>
            {/* --- Public Route --- */}
            <Route path="/login" element={<Login />} />

            {/* --- Protected Routes --- */}
            <Route path="/*" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-4 sm:py-8 px-0 sm:px-6 lg:px-8 pb-24 sm:pb-8">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/upload" element={<UploadPage />} />
                      <Route path="/budget" element={<BudgetPage />} />
                      <Route path="/goals" element={<SavingsGoals />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                  </main>
                </>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;