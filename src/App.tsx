import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
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

// Wrapper components for pages that need navigation
const HomeWrapper = () => {
  const navigate = useNavigate();
  return <Home setCurrentPage={(page) => navigate(`/${page}`)} />;
};

const AboutWrapper = () => <About />;
const JourneyWrapper = () => <Journey />;
const ShowroomsWrapper = () => <Showrooms />;
const ContactWrapper = () => <Contact />;

const ProductsWrapper = () => {
  const navigate = useNavigate();
  return <Products
    setCurrentPage={(page) => navigate(`/${page}`)}
    setSelectedProductId={(id) => navigate(`/products/${id}`)}
  />;
};

const ProductDetailWrapper = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  return <ProductDetail
    productId={productId!}
    onBack={() => navigate(-1)}
  />;
};

const VehiclesWrapper = () => {
  const navigate = useNavigate();
  return <Vehicles
    setCurrentPage={(page) => navigate(`/${page}`)}
    setSelectedVehicleId={(id) => navigate(`/vehicles/${id}`)}
  />;
};

const VehicleDetailWrapper = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  return <VehicleDetail
    vehicleId={parseInt(vehicleId!)}
    onBack={() => navigate(-1)}
  />;
};

const MasseyProductsWrapper = () => {
  const navigate = useNavigate();
  return <MasseyProducts
    setCurrentPage={(page) => navigate(`/${page}`)}
    setSelectedProductId={(id) => navigate(`/products/${id}`)}
    setSelectedVehicleId={(id) => navigate(`/vehicles/${id}`)}
    onBack={() => navigate(-1)}
  />;
};

const FuelStationsWrapper = () => {
  const navigate = useNavigate();
  return <FuelStations setCurrentPage={(page) => navigate(`/${page}`)} />;
};

const LubricantsCompaniesWrapper = () => {
  const navigate = useNavigate();
  return <LubricantsCompanies
    setCurrentPage={(page) => navigate(`/${page}`)}
    setSelectedCompany={(companyId) => navigate(`/companies/${companyId}`)}
  />;
};

const CompanyProductsWrapper = () => {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  return <CompanyProducts
    companyId={companyId!}
    setCurrentPage={(page) => navigate(`/${page}`)}
    setSelectedProductId={(id) => navigate(`/products/${id}`)}
    onBack={() => navigate(-1)}
  />;
};

const AboutDetailWrapper = () => {
  const navigate = useNavigate();
  const { aboutEntryId } = useParams<{ aboutEntryId: string }>();
  return <AboutDetail 
    entryId={aboutEntryId!} 
    onBack={() => navigate(-1)} 
  />;
};

const CareersWrapper = () => {
  const navigate = useNavigate();
  return <Careers setCurrentPage={(page) => navigate(`/${page}`)} />;
};

const ManagementWrapper = () => {
  const navigate = useNavigate();
  return <Management setCurrentPage={(page) => navigate(`/${page}`)} />;
};

const AwardsWrapper = () => {
  const navigate = useNavigate();
  return <Awards setCurrentPage={(page) => navigate(`/${page}`)} />;
};

const PromotersWrapper = () => {
  const navigate = useNavigate();
  return <Promoters setCurrentPage={(page) => navigate(`/${page}`)} />;
};

const InstitutionalSalesWrapper = () => {
  const navigate = useNavigate();
  return <InstitutionalSales setCurrentPage={(page) => navigate(`/${page}`)} />;
};

const AdminLoginWrapper = () => {
  const navigate = useNavigate();
  return <AdminLogin onLogin={() => navigate('/admin-dashboard')} />;
};

const AdminDashboardWrapper = () => <AdminDashboard />;
const ResetPasswordWrapper = () => <ResetPassword />;
const PrivacyPolicyWrapper = () => <PrivacyPolicy />;
const TermsAndConditionsWrapper = () => <TermsAndConditions />;
const BackendStatusWrapper = () => <BackendStatus />;

// Layout component for pages with header/footer
const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-white flex flex-col w-full overflow-x-hidden">
    <Header currentPage="" setCurrentPage={() => {}} />
    <main className="flex-grow w-full">
      {children}
    </main>
    <Footer setCurrentPage={() => {}} />
  </div>
);

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

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

  return (
    <HelmetProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><HomeWrapper /></Layout>} />
          <Route path="/home" element={<Layout><HomeWrapper /></Layout>} />
          <Route path="/about" element={<Layout><AboutWrapper /></Layout>} />
          <Route path="/journey" element={<Layout><JourneyWrapper /></Layout>} />
          <Route path="/showrooms" element={<Layout><ShowroomsWrapper /></Layout>} />
          <Route path="/contact" element={<Layout><ContactWrapper /></Layout>} />
          <Route path="/products" element={<Layout><ProductsWrapper /></Layout>} />
          <Route path="/products/:productId" element={<Layout><ProductDetailWrapper /></Layout>} />
          <Route path="/vehicles" element={<Layout><VehiclesWrapper /></Layout>} />
          <Route path="/vehicles/:vehicleId" element={<Layout><VehicleDetailWrapper /></Layout>} />
          <Route path="/massey-products" element={<Layout><MasseyProductsWrapper /></Layout>} />
          <Route path="/fuel-stations" element={<Layout><FuelStationsWrapper /></Layout>} />
          <Route path="/lubricants-companies" element={<Layout><LubricantsCompaniesWrapper /></Layout>} />
          <Route path="/companies/:companyId" element={<Layout><CompanyProductsWrapper /></Layout>} />
          <Route path="/about/:aboutEntryId" element={<Layout><AboutDetailWrapper /></Layout>} />
          <Route path="/careers" element={<Layout><CareersWrapper /></Layout>} />
          <Route path="/privacy-policy" element={<Layout><PrivacyPolicyWrapper /></Layout>} />
          <Route path="/terms-and-conditions" element={<Layout><TermsAndConditionsWrapper /></Layout>} />
          <Route path="/management" element={<Layout><ManagementWrapper /></Layout>} />
          <Route path="/awards" element={<Layout><AwardsWrapper /></Layout>} />
          <Route path="/promoters" element={<Layout><PromotersWrapper /></Layout>} />
          <Route path="/institutional-sales" element={<Layout><InstitutionalSalesWrapper /></Layout>} />
          <Route path="/admin-login" element={<AdminLoginWrapper />} />
          <Route path="/admin-dashboard" element={isAdminAuthenticated ? <AdminDashboardWrapper /> : <AdminLoginWrapper />} />
          <Route path="/reset-password" element={<ResetPasswordWrapper />} />
          <Route path="/backend-status" element={<BackendStatusWrapper />} />
          {/* Catch all route */}
          <Route path="*" element={<Layout><HomeWrapper /></Layout>} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;