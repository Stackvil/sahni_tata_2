import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Journey from './pages/Journey';
import Showrooms from './pages/Showrooms';
import Contact from './pages/Contact';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import FuelStations from './pages/FuelStations';
import LubricantsCompanies from './pages/LubricantsCompanies';
import CompanyProducts from './pages/CompanyProducts';
import MasseyProducts from './pages/MasseyProducts';
import AboutDetail from './pages/AboutDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ResetPassword from './pages/ResetPassword';
import Careers from './pages/Careers';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import Management from './pages/Management';
import Awards from './pages/Awards';
import Promoters from './pages/Promoters';
import InstitutionalSales from './pages/InstitutionalSales';
import BackendStatus from './components/BackendStatus';
import LaunchCountdown from './components/LaunchCountdown';

function App() {
  // Initialize state from URL hash or default to 'home'
  const getInitialPage = () => {
    const hash = window.location.hash.slice(1); // Remove the '#'
    if (hash) {
      const [page, query] = hash.split('?');
      if (query) {
        const params = new URLSearchParams(query);
        const vehicleId = params.get('vehicleId');
        const productId = params.get('productId');
        const companyId = params.get('companyId');
        const aboutEntryId = params.get('aboutEntryId');
        return { page, vehicleId, productId, companyId, aboutEntryId };
      }
      return { page, vehicleId: null, productId: null, companyId: null, aboutEntryId: null };
    }
    return { page: 'home', vehicleId: null, productId: null, companyId: null, aboutEntryId: null };
  };

  const initial = getInitialPage();
  const [currentPage, setCurrentPage] = useState(initial.page || 'home');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    initial.vehicleId ? parseInt(initial.vehicleId) : null
  );
  const [selectedProductId, setSelectedProductId] = useState<number | string | null>(
    initial.productId || null
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    initial.companyId || null
  );
  const [selectedAboutEntryId, setSelectedAboutEntryId] = useState<string | null>(
    initial.aboutEntryId || null
  );
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);

  // Check if launch time has passed
  useEffect(() => {
    const checkLaunchTime = () => {
      const now = new Date();
      const launchTime = new Date();
      launchTime.setDate(now.getDate() + 1);
      launchTime.setHours(12, 30, 0, 0); // Tomorrow at 12:30 PM

      if (now.getTime() >= launchTime.getTime()) {
        setIsLaunched(true);
        localStorage.setItem('sahni_launched', 'true');
      } else {
        // Check if user has manually bypassed (for testing)
        // Only allow bypass if we're close to launch time (within 1 hour) or explicitly set
        const launched = localStorage.getItem('sahni_launched');
        const timeUntilLaunch = launchTime.getTime() - now.getTime();
        const oneHour = 60 * 60 * 1000;
        
        if (launched === 'true' && timeUntilLaunch <= oneHour) {
          setIsLaunched(true);
        }
      }
    };

    checkLaunchTime();
    // Check every second to catch the launch time accurately
    const interval = setInterval(checkLaunchTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check admin authentication
  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated');
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (authStatus === 'true' && loginTime) {
      const loginDate = new Date(loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        setIsAdminAuthenticated(true);
      } else {
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminLoginTime');
        setIsAdminAuthenticated(false);
      }
    }
  }, []);

  // Scroll to top when page or detail IDs change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, selectedVehicleId, selectedProductId, selectedCompanyId, selectedAboutEntryId]);

  // Update URL hash when page or IDs change
  useEffect(() => {
    let hash = `#${currentPage}`;
    if (currentPage === 'vehicle-detail' && selectedVehicleId) {
      hash += `?vehicleId=${selectedVehicleId}`;
    } else if (currentPage === 'product-detail' && selectedProductId) {
      hash += `?productId=${selectedProductId}`;
    } else if (currentPage === 'company-products' && selectedCompanyId) {
      hash += `?companyId=${selectedCompanyId}`;
    } else if (currentPage === 'about-detail' && selectedAboutEntryId) {
      hash += `?aboutEntryId=${selectedAboutEntryId}`;
    }
    window.location.hash = hash;
  }, [currentPage, selectedVehicleId, selectedProductId, selectedCompanyId, selectedAboutEntryId]);

  // Listen for hash changes (back/forward browser buttons)
  useEffect(() => {
    const handleHashChange = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const hash = window.location.hash.slice(1);
      if (hash) {
        const [page, query] = hash.split('?');
        // Only update if page actually changed to prevent loops
        if (page && page !== currentPage) {
          console.log('[App] Hash changed to:', page);
          setCurrentPage(page);
        }
        
        // Parse query parameters
        if (query) {
          const params = new URLSearchParams(query);
          const vehicleId = params.get('vehicleId');
          const productId = params.get('productId');
          const companyId = params.get('companyId');
          const aboutEntryId = params.get('aboutEntryId');
          
          setSelectedVehicleId(vehicleId ? parseInt(vehicleId) : null);
          setSelectedProductId(productId || null);
          setSelectedCompanyId(companyId || null);
          setSelectedAboutEntryId(aboutEntryId || null);
        } else {
          setSelectedVehicleId(null);
          setSelectedProductId(null);
          setSelectedCompanyId(null);
          setSelectedAboutEntryId(null);
        }
      } else {
        if (currentPage !== 'home') {
          setCurrentPage('home');
        }
        setSelectedVehicleId(null);
        setSelectedProductId(null);
        setSelectedCompanyId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPage]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    if (page !== 'vehicle-detail') setSelectedVehicleId(null);
    if (page !== 'product-detail') setSelectedProductId(null);
    if (page !== 'company-products') setSelectedCompanyId(null);
    if (page !== 'about-detail') setSelectedAboutEntryId(null);
  };

  const handleAboutEntryIdChange = (id: string | null) => {
    setSelectedAboutEntryId(id);
    if (id) {
      setCurrentPage('about-detail');
    }
  };

  const handleVehicleIdChange = (id: number | null) => {
    setSelectedVehicleId(id);
    if (id) {
      setCurrentPage('vehicle-detail');
    }
  };

  const handleProductIdChange = (id: number | string | null) => {
    setSelectedProductId(id);
    if (id) {
      setCurrentPage('product-detail');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={handlePageChange} />;
      case 'about':
        return <About setCurrentPage={handlePageChange} setSelectedAboutEntryId={handleAboutEntryIdChange} />;
      case 'about-detail':
        return selectedAboutEntryId ? (
          <AboutDetail 
            entryId={selectedAboutEntryId}
            onBack={() => {
              handlePageChange('about');
              setSelectedAboutEntryId(null);
            }}
          />
        ) : (
          <About setCurrentPage={handlePageChange} setSelectedAboutEntryId={handleAboutEntryIdChange} />
        );
      case 'journey':
        return <Journey />;
      case 'showrooms':
        return <Showrooms />;
      case 'careers':
        return <Careers setCurrentPage={handlePageChange} />;
      case 'contact':
        return <Contact />;
      case 'products':
        return <Products setCurrentPage={handlePageChange} setSelectedProductId={handleProductIdChange} />;
      case 'product-detail':
        return selectedProductId ? (
          <ProductDetail 
            productId={selectedProductId} 
            onBack={() => {
              // Check if we came from company-products page
              if (selectedCompanyId) {
                handlePageChange('company-products');
              } else {
                handlePageChange('products');
              }
              setSelectedProductId(null);
            }} 
          />
        ) : (
          <Products setCurrentPage={handlePageChange} setSelectedProductId={handleProductIdChange} />
        );
      case 'vehicles':
        return <Vehicles setCurrentPage={handlePageChange} setSelectedVehicleId={handleVehicleIdChange} />;
      case 'massey-products':
        return (
          <MasseyProducts 
            setCurrentPage={handlePageChange}
            setSelectedProductId={handleProductIdChange}
            setSelectedVehicleId={handleVehicleIdChange}
            onBack={() => {
              handlePageChange('vehicles');
            }}
          />
        );
      case 'vehicle-detail':
        return selectedVehicleId ? (
          <VehicleDetail 
            vehicleId={selectedVehicleId} 
            onBack={() => {
              // Check if we came from massey-products (vehicles with IDs 100-111 are Massey Ferguson)
              if (selectedVehicleId && selectedVehicleId >= 100 && selectedVehicleId <= 111) {
                handlePageChange('massey-products');
              } else {
                handlePageChange('vehicles');
              }
              setSelectedVehicleId(null);
            }} 
          />
        ) : (
          <Vehicles setCurrentPage={handlePageChange} setSelectedVehicleId={handleVehicleIdChange} />
        );
      case 'fuel-stations':
        return <FuelStations setCurrentPage={handlePageChange} />;
      case 'lubricants-companies':
        return (
          <LubricantsCompanies 
            setCurrentPage={handlePageChange} 
            setSelectedCompany={(companyId) => {
              setSelectedCompanyId(companyId);
              handlePageChange('company-products');
            }}
          />
        );
      case 'company-products':
        return selectedCompanyId ? (
          <CompanyProducts 
            companyId={selectedCompanyId}
            setCurrentPage={handlePageChange}
            setSelectedProductId={handleProductIdChange}
            onBack={() => {
              handlePageChange('lubricants-companies');
              setSelectedCompanyId(null);
            }}
          />
        ) : (
          <LubricantsCompanies 
            setCurrentPage={handlePageChange} 
            setSelectedCompany={(companyId) => {
              setSelectedCompanyId(companyId);
              handlePageChange('company-products');
            }}
          />
        );
      case 'admin-login':
        return <AdminLogin onLogin={() => {
          setIsAdminAuthenticated(true);
          handlePageChange('admin-dashboard');
        }} />;
      case 'admin-dashboard':
        return isAdminAuthenticated ? (
          <AdminDashboard />
        ) : (
          <AdminLogin onLogin={() => {
            setIsAdminAuthenticated(true);
            handlePageChange('admin-dashboard');
          }} />
        );
      case 'reset-password':
        return <ResetPassword />;
      case 'privacy-policy':
        return <PrivacyPolicy />;
      case 'terms-and-conditions':
        return <TermsAndConditions />;
      case 'management':
        return <Management setCurrentPage={handlePageChange} />;
      case 'awards':
        return <Awards setCurrentPage={handlePageChange} />;
      case 'promoters':
        return <Promoters setCurrentPage={handlePageChange} />;
      case 'institutional-sales':
        return <InstitutionalSales setCurrentPage={handlePageChange} />;
      case 'backend-status':
        return <BackendStatus />;
      default:
        return <Home setCurrentPage={handlePageChange} />;
    }
  };

  // Don't show header/footer for admin pages and backend status
  if (currentPage === 'admin-login' || currentPage === 'admin-dashboard' || currentPage === 'reset-password' || currentPage === 'backend-status') {
    return <>{renderPage()}</>;
  }

  // Show countdown if launch time hasn't passed (but allow admin to bypass)
  const showCountdown = !isLaunched && !isAdminAuthenticated;

  return (
    <>
      {showCountdown && (
        <LaunchCountdown onLaunch={() => setIsLaunched(true)} />
      )}
      <div className={`min-h-screen bg-white flex flex-col w-full overflow-x-hidden ${showCountdown ? 'hidden' : ''}`}>
        <Header currentPage={currentPage} setCurrentPage={handlePageChange} />
        <main className="flex-grow w-full">
          {renderPage()}
        </main>
        <Footer setCurrentPage={handlePageChange} />
      </div>
    </>
  );
}

export default App;
