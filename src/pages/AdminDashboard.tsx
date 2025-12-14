import { useEffect, useState } from 'react';
import {
  Package,
  Car,
  MapPin,
  Image as ImageIcon,
  FileText,
  LogOut,
  Home,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Video,
  Briefcase,
  Trophy,
} from 'lucide-react';
import AdminProducts from '../components/admin/AdminProducts';
import AdminVehicles from '../components/admin/AdminVehicles';
import AdminShowrooms from '../components/admin/AdminShowrooms';
import AdminAboutMedia from '../components/admin/AdminAboutMedia';
import AdminAbout from '../components/admin/AdminAbout';
import AdminHomeVideo from '../components/admin/AdminHomeVideo';
import AdminCareers from '../components/admin/AdminCareers';
import AdminAwards from '../components/admin/AdminAwards';
import { authAPI, getAuthToken, normalizeImageUrl } from '../services/api';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Package;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home-video', label: 'Home Video', icon: Video },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'showrooms', label: 'Showrooms', icon: MapPin },
  { id: 'about', label: 'About Us', icon: FileText },
  { id: 'about-media', label: 'About Us Media', icon: ImageIcon },
  { id: 'careers', label: 'Careers', icon: Briefcase },
  { id: 'awards', label: 'Awards', icon: Trophy },
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<string>('home-video');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminSessionExpiry');
    authAPI.logout();
    setIsAuthenticated(false);
    setMobileMenuOpen(false);
    window.location.hash = '#admin-login';
  };

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('adminAuthenticated');
      const loginTime = localStorage.getItem('adminLoginTime');
      const expiryTime = localStorage.getItem('adminSessionExpiry');
      const token = getAuthToken();

      if ((authStatus === 'true' && loginTime) || token) {
        if (expiryTime) {
          const expiryDate = new Date(expiryTime);
          const now = new Date();
          if (now < expiryDate) {
            setIsAuthenticated(true);
          } else {
            handleLogout();
          }
        } else if (loginTime) {
          const loginDate = new Date(loginTime);
          const now = new Date();
          const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);

          if (hoursDiff < 3) {
            setIsAuthenticated(true);
            const newExpiry = new Date(Date.now() + (3 - hoursDiff) * 60 * 60 * 1000);
            localStorage.setItem('adminSessionExpiry', newExpiry.toISOString());
          } else {
            handleLogout();
          }
        } else if (token) {
          setIsAuthenticated(true);
          const newExpiry = new Date(Date.now() + 3 * 60 * 60 * 1000);
          localStorage.setItem('adminSessionExpiry', newExpiry.toISOString());
        }
      }
    };

    checkAuth();

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    const expiryTime = localStorage.getItem('adminSessionExpiry');
    if (expiryTime) {
      const expiryDate = new Date(expiryTime);
      const now = new Date();
      const timeUntilExpiry = expiryDate.getTime() - now.getTime();

      if (timeUntilExpiry > 0) {
        const logoutTimer = setTimeout(() => handleLogout(), timeUntilExpiry);
        const interval = setInterval(checkAuth, 60000);

        return () => {
          clearTimeout(logoutTimer);
          clearInterval(interval);
          window.removeEventListener('resize', handleResize);
        };
      }
    }

    const interval = setInterval(checkAuth, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    window.location.hash = '#admin-login';
    return null;
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const desktopMarginClass = sidebarOpen ? 'lg:ml-64' : 'lg:ml-20';

  const handleSidebarToggle = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'home-video':
        return <AdminHomeVideo isDarkMode={isDarkMode} />;
      case 'vehicles':
        return <AdminVehicles isDarkMode={isDarkMode} />;
      case 'showrooms':
        return <AdminShowrooms isDarkMode={isDarkMode} />;
      case 'about':
        return <AdminAbout isDarkMode={isDarkMode} />;
      case 'about-media':
        return <AdminAboutMedia isDarkMode={isDarkMode} />;
      case 'careers':
        return <AdminCareers isDarkMode={isDarkMode} />;
      case 'awards':
        return <AdminAwards isDarkMode={isDarkMode} />;
      case 'products':
      default:
        return <AdminProducts isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col lg:flex-row`}>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'} w-full sm:w-80 transition-all duration-300 fixed lg:fixed inset-y-0 left-0 z-40 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 border-r overflow-y-auto flex flex-col`}
      >
        <div className={`p-4 sm:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
                <img
                  src={normalizeImageUrl('/images/logo.jpg')}
                  alt="Sahni Group Logo"
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/old-logo.png';
                  target.onerror = () => {
                    target.style.display = 'none';
                  };
                }}
              />
              <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-base sm:text-lg`}>
                Sahni Group
              </span>
            </div>
          ) : (
            <img
              src={normalizeImageUrl('/images/logo.jpg')}
              alt="Sahni Group Logo"
              className="w-10 h-10 object-contain rounded-lg mx-auto flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/old-logo.png';
                target.onerror = () => {
                  target.style.display = 'none';
                };
              }}
            />
          )}

          <button
            onClick={handleSidebarToggle}
            className={`${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            } p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center`}
            aria-label="Toggle sidebar"
          >
            {mobileMenuOpen ? <X size={22} className="lg:hidden" /> : <Menu size={22} className="lg:hidden" />}
            <span className="hidden lg:inline-flex">{sidebarOpen ? <X size={20} /> : <Menu size={20} />}</span>
          </button>
        </div>

        <nav className="p-3 sm:p-4 space-y-2">
          <div
            className={`${
              sidebarOpen ? 'px-3 py-2' : 'px-2 py-2'
            } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs font-semibold uppercase tracking-wider`}
          >
            {sidebarOpen && 'Navigation'}
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'px-4 py-3.5' : 'px-2 py-3.5 justify-center'
                } rounded-xl transition-all duration-200 min-h-[48px] touch-manipulation ${
                  isActive
                    ? isDarkMode
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-purple-100 text-purple-700 shadow-md'
                    : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="ml-3 font-medium text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 space-y-2 mt-6">
          <div
            className={`${
              sidebarOpen ? 'px-3 py-2' : 'px-2 py-2'
            } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs font-semibold uppercase tracking-wider`}
          >
            {sidebarOpen && 'General'}
          </div>

          <button
            onClick={() => {
              window.location.hash = '#home';
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center ${
              sidebarOpen ? 'px-4 py-3.5' : 'px-2 py-3.5 justify-center'
            } rounded-xl transition-all duration-200 min-h-[48px] touch-manipulation ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700 active:bg-gray-600' : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            }`}
          >
            <Home size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="ml-3 font-medium text-sm">View Site</span>}
          </button>
        </div>

        <div className={`p-3 sm:p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mt-auto`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              sidebarOpen ? 'px-4 py-3.5' : 'px-2 py-3.5 justify-center'
            } rounded-xl transition-all duration-200 min-h-[48px] touch-manipulation ${
              isDarkMode ? 'text-red-400 hover:bg-gray-700 active:bg-gray-600' : 'text-red-600 hover:bg-red-50 active:bg-red-100'
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="ml-3 font-medium text-sm">Log Out</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 w-full ${desktopMarginClass} transition-all duration-300 overflow-x-hidden`}>
        <header
          className={`${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border-b sticky top-0 z-20`}
        >
          <div className="px-3 sm:px-4 md:px-6 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 w-full md:max-w-xl">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700 active:bg-gray-600' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                } p-2.5 rounded-lg transition-colors lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center`}
                aria-label="Open navigation"
              >
                <Menu size={22} />
              </button>
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search anything"
                    className={`w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl border text-base sm:text-sm min-h-[48px] ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  />
                  <span className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    ⌘ K
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3 w-full md:w-auto">
              <div className={`${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              } rounded-lg p-1 flex items-center`}
              >
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${!isDarkMode ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
                  aria-label="Use light mode"
                >
                  <Sun size={18} />
                </button>
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${isDarkMode ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-600'}`}
                  aria-label="Use dark mode"
                >
                  <Moon size={18} />
                </button>
              </div>

              <button
                className={`${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700 active:bg-gray-600' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                } p-2.5 rounded-lg transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center`}
                aria-label="Notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center">
                <img
                  src={normalizeImageUrl('/images/logo.jpg')}
                  alt="Sahni Group"
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg border border-gray-200 bg-white p-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/old-logo.png';
                    target.onerror = () => {
                      target.style.display = 'none';
                    };
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <section className={`p-3 sm:p-4 md:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
          <div className={`${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } rounded-xl sm:rounded-2xl shadow-sm border p-4 sm:p-6`}
          >
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                <h1 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {NAV_ITEMS.find((item) => item.id === activeSection)?.label || 'Dashboard'}
                </h1>
              </div>
            </div>

            {renderActiveSection()}
          </div>
        </section>
      </main>
    </div>
  );
}
