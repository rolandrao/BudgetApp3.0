import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider'; 
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import UploadPage from './pages/Upload'; 

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
          
          <Navbar />
          
          {/* Changed: px-0 on mobile to allow full-width tables. pb-24 added for bottom nav clearance. */}
          <main className="max-w-7xl mx-auto py-4 sm:py-8 px-0 sm:px-6 lg:px-8 pb-24 sm:pb-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/upload" element={<UploadPage />} />
            </Routes>
          </main>
          
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;