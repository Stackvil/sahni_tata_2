import { X, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { normalizeImageUrl } from '../services/api';

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export default function Header({ currentPage, setCurrentPage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [vehiclesDropdownOpen, setVehiclesDropdownOpen] = useState(false);
  const [vehiclesDropdownTimeout, setVehiclesDropdownTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [businessesDropdownOpen, setBusinessesDropdownOpen] = useState(false);
  const [businessesDropdownTimeout, setBusinessesDropdownTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [mobileAboutDropdownOpen, setMobileAboutDropdownOpen] = useState(false);
  const [mobileVehiclesDropdownOpen, setMobileVehiclesDropdownOpen] = useState(false);
  const [mobileBusinessesDropdownOpen, setMobileBusinessesDropdownOpen] = useState(false);

  const navigate = useNavigate();

  const navItems = [
    { id: 'products', label: 'OUR BUSINESSES' },
    { id: 'about', label: 'ABOUT US' },
    { id: 'vehicles', label: 'VEHICLES' },
    { id: 'careers', label: 'CAREERS' },
    { id: 'showrooms', label: 'SHOWROOMS' },
    { id: 'contact', label: 'CONTACT' },
  ];

  const handleNavClick = (pageId: string) => {
    setMobileMenuOpen(false);
    setAboutDropdownOpen(false);
    setVehiclesDropdownOpen(false);
    setBusinessesDropdownOpen(false);
    setMobileAboutDropdownOpen(false);
    setMobileVehiclesDropdownOpen(false);
    setMobileBusinessesDropdownOpen(false);
    
    if (pageId === 'autocomponents') {
      navigate('/');
      setTimeout(() => {
        const aftermarketSection = document.getElementById('aftermarket');
        if (aftermarketSection) {
          aftermarketSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }
    
    navigate(`/${pageId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const topBarFor = (active: boolean) =>
    active && (
      <span className="absolute -top-2 left-0 right-0 mx-auto h-1 bg-[#ffd54a]" />
    );

  return (
    <>
      {/* MODIFIED: Changed 'sticky' to 'relative' so it stays at the top of the page.
          Removed 'position: sticky' from the inline style.
      */}
      <header className="relative z-[9998] bg-[#2368a8] w-full" style={{ zIndex: 9998 }}>
        <div className="flex w-full h-20 sm:h-24 md:h-28 lg:h-[140px] min-w-0 relative">
          
          {/* LEFT: WHITE CAPSULE LOGO */}
          <div className="flex items-center z-10">
             <div className="h-full w-32 sm:w-40 md:w-48 lg:w-[250px] bg-white rounded-br-[40px] sm:rounded-br-[60px] lg:rounded-br-[80px] shadow-md flex items-center justify-center overflow-hidden p-0.5 sm:p-1">
               <img
                 src={normalizeImageUrl('/images/GROUP (1).png')}
                alt="Sahni Group Logo"
                 className="cursor-pointer transition-transform duration-300 hover:scale-105 touch-manipulation"
                 style={{
                   height: 'calc(100% - 4px)',
                   width: '100%',
                   objectFit: 'contain',
                 }}
                 onClick={() => handleNavClick('home')}
               />
             </div>
           </div>

          {/* RIGHT: BLUE NAV BAR */}
          <div className="flex-1 flex items-center min-w-0 relative">
            <div className="hidden lg:flex flex-1 items-center justify-center h-full min-w-0 px-2 relative">
              <nav className="flex items-center space-x-4 xl:space-x-6 2xl:space-x-8 justify-center max-w-full relative">
                
                <button
                  onClick={() => handleNavClick('home')}
                  className={`relative px-2 xl:px-3 py-3 text-[13px] lg:text-[14px] xl:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                    currentPage === 'home' ? 'text-[#ffd54a]' : 'text-white hover:text-[#ffd54a]'
                  }`}
                >
                  {topBarFor(currentPage === 'home')}
                  HOME
                </button>

                {navItems.map((item) => {
                  // VEHICLES DROPDOWN
                  if (item.id === 'vehicles') {
                    const isActive = currentPage === 'vehicles' || currentPage === 'massey-products';
                    return (
                      <div
                        key={item.id}
                        className="relative z-50"
                        onMouseEnter={() => {
                          if (vehiclesDropdownTimeout) clearTimeout(vehiclesDropdownTimeout);
                          setVehiclesDropdownOpen(true);
                        }}
                        onMouseLeave={() => {
                          const timeout = setTimeout(() => setVehiclesDropdownOpen(false), 120);
                          setVehiclesDropdownTimeout(timeout);
                        }}
                      >
                        <button
                          onClick={() => handleNavClick(item.id)}
                          className={`relative px-2 xl:px-3 py-3 text-[13px] lg:text-[14px] xl:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                            isActive ? 'text-[#ffd54a]' : 'text-white hover:text-[#ffd54a]'
                          }`}
                        >
                          {topBarFor(isActive)}
                          {item.label}
                        </button>
                        {vehiclesDropdownOpen && (
                          <div className="absolute top-full left-0 pt-3 w-60 z-[9999]" 
                               onMouseEnter={() => { if (vehiclesDropdownTimeout) clearTimeout(vehiclesDropdownTimeout); setVehiclesDropdownOpen(true); }}
                               onMouseLeave={() => { const timeout = setTimeout(() => setVehiclesDropdownOpen(false), 120); setVehiclesDropdownTimeout(timeout); }}>
                            <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                              <button onClick={() => handleNavClick('vehicles')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">All Vehicles</button>
                              <button onClick={() => { handleNavClick('vehicles'); sessionStorage.setItem('sahni_selectedBrand', 'tata'); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Tata Motors</button>
                              <button onClick={() => handleNavClick('massey-products')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Massey Ferguson</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // OUR BUSINESSES DROPDOWN
                  if (item.id === 'products') {
                    const isActive = ['products', 'vehicles', 'massey-products', 'fuel-stations', 'showrooms', 'institutional-sales'].includes(currentPage);
                    return (
                      <div
                        key={item.id}
                        className="relative z-50"
                        onMouseEnter={() => {
                          if (businessesDropdownTimeout) clearTimeout(businessesDropdownTimeout);
                          setBusinessesDropdownOpen(true);
                        }}
                        onMouseLeave={() => {
                          const timeout = setTimeout(() => setBusinessesDropdownOpen(false), 120);
                          setBusinessesDropdownTimeout(timeout);
                        }}
                      >
                        <button
                          onClick={() => handleNavClick(item.id)}
                          className={`relative px-2 xl:px-3 py-3 text-[13px] lg:text-[14px] xl:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                            isActive ? 'text-[#ffd54a]' : 'text-white hover:text-[#ffd54a]'
                          }`}
                        >
                          {topBarFor(isActive)}
                          {item.label}
                        </button>
                        {businessesDropdownOpen && (
                          <div className="absolute top-full left-0 pt-3 w-72 z-[9999]"
                               onMouseEnter={() => { if (businessesDropdownTimeout) clearTimeout(businessesDropdownTimeout); setBusinessesDropdownOpen(true); }}
                               onMouseLeave={() => { const timeout = setTimeout(() => setBusinessesDropdownOpen(false), 120); setBusinessesDropdownTimeout(timeout); }}>
                            <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                              <button onClick={() => { handleNavClick('vehicles'); sessionStorage.setItem('sahni_selectedBrand', 'tata'); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Sahni Tata Motors</button>
                              <button onClick={() => handleNavClick('massey-products')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Sahni Massey Ferguson</button>
                              <button onClick={() => handleNavClick('fuel-stations')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Sahni Fuel Stations</button>
                              <button onClick={() => handleNavClick('institutional-sales')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Sahni Tata Genuine Parts</button>
                              <button onClick={() => { sessionStorage.setItem('sahni_autoSelectHP', 'true'); handleNavClick('products'); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Sahni Lubricants</button>
                              <button onClick={() => handleNavClick('autocomponents')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Sahni Auto Components</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // ABOUT DROPDOWN
                  if (item.id === 'about') {
                    const isActive = ['about', 'management', 'awards', 'promoters'].includes(currentPage);
                    return (
                      <div
                        key={item.id}
                        className="relative z-50"
                        onMouseEnter={() => setAboutDropdownOpen(true)}
                        onMouseLeave={() => setAboutDropdownOpen(false)}
                      >
                        <button
                          onClick={() => handleNavClick(item.id)}
                          className={`relative px-2 xl:px-3 py-3 text-[13px] lg:text-[14px] xl:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                            isActive ? 'text-[#ffd54a]' : 'text-white hover:text-[#ffd54a]'
                          }`}
                        >
                          {topBarFor(isActive)}
                          {item.label}
                        </button>
                        {aboutDropdownOpen && (
                          <div className="absolute top-full left-0 pt-3 w-60 z-[9999]" onMouseEnter={() => setAboutDropdownOpen(true)} onMouseLeave={() => setAboutDropdownOpen(false)}>
                            <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                              <button onClick={() => handleNavClick('about')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Our Story</button>
                              <button onClick={() => handleNavClick('promoters')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Promoters</button>
                              <button onClick={() => handleNavClick('management')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Management Team</button>
                              <button onClick={() => handleNavClick('awards')} className="w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]">Our Awards</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const isActive = currentPage === item.id;
                  return (
                    <Link
                      key={item.id}
                      to={`/${item.id}`}
                      onClick={() => handleNavClick(item.id)}
                      className={`relative px-2 xl:px-3 py-3 text-[13px] lg:text-[14px] xl:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                        isActive ? 'text-[#ffd54a]' : 'text-white hover:text-[#ffd54a]'
                      }`}
                    >
                      {topBarFor(isActive)}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              className="lg:hidden ml-auto mr-2 p-2 rounded-md transition-all duration-300 hover:bg-[#0d46ac] focus:outline-none focus:ring-2 focus:ring-[#ffd54a] min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="relative w-6 h-6">
                <span className={`absolute top-1/2 left-1/2 w-5 h-0.5 bg-white transform -translate-x-1/2 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'}`} />
                <span className={`absolute top-1/2 left-1/2 w-5 h-0.5 bg-white transform -translate-x-1/2 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`absolute top-1/2 left-1/2 w-5 h-0.5 bg-white transform -translate-x-1/2 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        <div className={`lg:hidden fixed top-0 left-0 h-full w-full sm:w-80 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0 opacity-100 visible' : '-translate-x-full opacity-0 invisible pointer-events-none'}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center space-x-3">
              <img src={normalizeImageUrl('/images/GROUP (1).png')} alt="Sahni Group" className="h-12 w-auto object-contain" />
              <div className="flex flex-col">
                <div className="text-base font-black text-gray-900 leading-tight">SAHNI GROUP</div>
                <div className="text-[10px] text-gray-500 font-medium">Since 1965</div>
                </div>
              </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-md hover:bg-red-50 hover:text-red-600">
              <X size={22} className="text-gray-700" />
            </button>
          </div>
          <nav className="flex flex-col py-2 max-h-[calc(100vh-90px)] overflow-y-auto">
            {/* Home */}
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full text-left px-4 py-3 text-base font-semibold uppercase tracking-wide transition-colors ${
                currentPage === 'home' ? 'text-red-600 bg-red-50' : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              HOME
            </button>

            {/* Navigation Items */}
            {navItems.map((item) => {
              // OUR BUSINESSES DROPDOWN (mobile)
              if (item.id === 'products') {
                const isActive = ['products', 'vehicles', 'massey-products', 'fuel-stations', 'showrooms', 'institutional-sales'].includes(currentPage);
                return (
                  <div key={item.id} className="border-t border-gray-100">
                    <button
                      onClick={() => setMobileBusinessesDropdownOpen(!mobileBusinessesDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-base font-semibold uppercase tracking-wide transition-colors ${
                        isActive ? 'text-red-600 bg-red-50' : 'text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {mobileBusinessesDropdownOpen ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </button>
                    {mobileBusinessesDropdownOpen && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={() => { handleNavClick('vehicles'); sessionStorage.setItem('sahni_selectedBrand', 'tata'); }}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Sahni Tata Motors
                        </button>
                        <button
                          onClick={() => handleNavClick('massey-products')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Sahni Massey Ferguson
                        </button>
                        <button
                          onClick={() => handleNavClick('fuel-stations')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Sahni Fuel Stations
                        </button>
                        <button
                          onClick={() => handleNavClick('institutional-sales')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Sahni Tata Genuine Parts
                        </button>
                        <button
                          onClick={() => { sessionStorage.setItem('sahni_autoSelectHP', 'true'); handleNavClick('products'); }}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Sahni Lubricants
                        </button>
                        <button
                          onClick={() => handleNavClick('autocomponents')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Sahni Auto Components
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // ABOUT DROPDOWN (mobile)
              if (item.id === 'about') {
                const isActive = ['about', 'management', 'awards', 'promoters'].includes(currentPage);
                return (
                  <div key={item.id} className="border-t border-gray-100">
                    <button
                      onClick={() => setMobileAboutDropdownOpen(!mobileAboutDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-base font-semibold uppercase tracking-wide transition-colors ${
                        isActive ? 'text-red-600 bg-red-50' : 'text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {mobileAboutDropdownOpen ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </button>
                    {mobileAboutDropdownOpen && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={() => handleNavClick('about')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Our Story
                        </button>
                        <button
                          onClick={() => handleNavClick('promoters')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Promoters
                        </button>
                        <button
                          onClick={() => handleNavClick('management')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Management Team
                        </button>
                        <button
                          onClick={() => handleNavClick('awards')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Our Awards
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // VEHICLES DROPDOWN (mobile)
              if (item.id === 'vehicles') {
                const isActive = currentPage === 'vehicles' || currentPage === 'massey-products';
                return (
                  <div key={item.id} className="border-t border-gray-100">
                    <button
                      onClick={() => setMobileVehiclesDropdownOpen(!mobileVehiclesDropdownOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-base font-semibold uppercase tracking-wide transition-colors ${
                        isActive ? 'text-red-600 bg-red-50' : 'text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {mobileVehiclesDropdownOpen ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </button>
                    {mobileVehiclesDropdownOpen && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={() => handleNavClick('vehicles')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          All Vehicles
                        </button>
                        <button
                          onClick={() => { handleNavClick('vehicles'); sessionStorage.setItem('sahni_selectedBrand', 'tata'); }}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Tata Motors
                        </button>
                        <button
                          onClick={() => handleNavClick('massey-products')}
                          className="w-full text-left px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        >
                          Massey Ferguson
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // Regular navigation items (no dropdown)
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-4 py-3 text-base font-semibold uppercase tracking-wide transition-colors border-t border-gray-100 ${
                    isActive ? 'text-red-600 bg-red-50' : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <a href="tel:+919281029456" className="w-full bg-red-600 text-white py-3.5 rounded-lg font-semibold flex items-center justify-center shadow-md">
              <Phone size={18} className="mr-2" /> Call Now
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
