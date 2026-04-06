
import React, { useEffect, useLayoutEffect, Suspense, lazy, useState } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

// Lazy load components to reduce initial bundle size
const StoreFront = lazy(() => import('./components/StoreFront').then(module => ({ default: module.StoreFront })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const ToastContainer: React.FC = () => {
    const { notifications, dismissNotification } = useShop();

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {notifications.map(n => (
                <div 
                    key={n.id} 
                    className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-slide-up min-w-[300px] border
                        ${n.type === 'success' ? 'bg-white border-green-500 text-green-700' : 
                          n.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-700'}`}
                >
                    {n.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
                    {n.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
                    {n.type === 'info' && <Info size={20} className="text-gray-500" />}
                    
                    <span className="font-bold text-sm flex-1">{n.message}</span>
                    <button onClick={() => dismissNotification(n.id)} className="opacity-50 hover:opacity-100"><X size={16}/></button>
                </div>
            ))}
        </div>
    );
};

// Component to handle dynamic head updates (favicon, title)
const HeadManager: React.FC = () => {
    const { settings } = useShop();

    useLayoutEffect(() => {
        // Determine the target icon URL. Default to the specific GitHub image provided.
        let targetIcon = "https://raw.githubusercontent.com/ethoart/arobazzar-img/main/favicona.png";
        
        if (settings) {
            if (settings.siteFavicon && settings.siteFavicon.trim().length > 5) {
                targetIcon = settings.siteFavicon;
            }
        } else {
             try {
                const saved = localStorage.getItem('arobazzar_settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.siteFavicon && parsed.siteFavicon.length > 5) {
                        targetIcon = parsed.siteFavicon;
                    }
                }
            } catch { /* ignore */ }
        }

        const oldLink = document.getElementById('dynamic-favicon');
        if (oldLink && (oldLink as HTMLLinkElement).href === targetIcon) return;

        const newLink = document.createElement('link');
        newLink.id = 'dynamic-favicon';
        newLink.rel = 'icon';
        newLink.href = targetIcon;
        
        if (oldLink) {
            document.head.removeChild(oldLink);
        }
        document.head.appendChild(newLink);

    }, [settings]);

    return null;
};

const PageRouter: React.FC = () => {
  const { currentPage, isLoading, navigateTo } = useShop();
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const handleHashChange = () => {
        if (window.location.hash === '#aroadmin') {
            history.replaceState(null, '', window.location.pathname + window.location.search);
            navigateTo('LOGIN');
        }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigateTo]);

  // Handle loader exit transition
  useEffect(() => {
    if (!isLoading) {
        // Artificial delay for smoothness to ensure content starts rendering
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => setIsMounted(false), 800); // Wait for fade animation to complete
        }, 800); // Wait slightly longer for banner imagery to settle
        return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="relative font-sans text-gray-900 dark:text-gray-100 antialiased overflow-hidden min-h-screen">
      <HeadManager />
      <ToastContainer />
      
      {isMounted && (
          <div className={`fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] z-[999] transition-all duration-1000 ease-in-out ${isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
              <div className="relative">
                  <div className="font-display font-black text-5xl tracking-tighter text-black dark:text-white animate-scale-in">AROBAZZAR.</div>
                  <div className="absolute -bottom-4 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-full">
                      <div className="h-full bg-black dark:bg-white animate-loading-progress w-full origin-left"></div>
                  </div>
              </div>
              <div className="mt-12 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500 animate-pulse">Initializing Premium Experience</div>
          </div>
      )}

      <Suspense fallback={null}>
        {!isLoading && (
            <div className="animate-fade-in">
                {currentPage === 'ADMIN' ? <AdminDashboard /> : <StoreFront />}
            </div>
        )}
      </Suspense>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ShopProvider>
      <PageRouter />
    </ShopProvider>
  );
};

export default App;
