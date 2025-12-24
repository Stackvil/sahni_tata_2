import { X, Phone } from 'lucide-react';
import { useState } from 'react';

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

  const navItems = [
    { id: 'products', label: 'OUR BUSINESSES' },
    { id: 'about', label: 'ABOUT US' },
    { id: 'vehicles', label: 'VEHICLES' },
    { id: 'careers', label: 'CAREERS' },
    { id: 'showrooms', label: 'SHOWROOMS' },
    { id: 'contact', label: 'CONTACT' },
  ];

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
    setAboutDropdownOpen(false);
    setVehiclesDropdownOpen(false);
    setBusinessesDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const topBarFor = (active: boolean) =>
    active && (
      <span className="absolute -top-2 left-0 right-0 mx-auto h-1 bg-[#ffd54a]" />
    );

  return (
    <>
      {/* VARUN STYLE STICKY HEADER */}
        <header className="sticky top-0 z-[100] bg-[#2368a8]">
         {/* adjusted height for requested logo dimensions */}
         <div className="flex w-full h-[140px]">
           {/* LEFT: WHITE CAPSULE WITH FULL-SIZE LOGO (no inner padding) */}
           <div className="flex items-center">
             <div className="h-full w-[250px] bg-white rounded-br-[80px] shadow-md flex items-center justify-center overflow-hidden p-1">
               <img
                 src="/images/GROUP (1).png"
                 alt="Sahni Group Logo"
                 className="cursor-pointer transition-transform duration-300 hover:scale-105"
                 style={{
                   height: '135px',
                   width: '100%',
                   objectFit: 'contain',
                 }}
                 onClick={() => handleNavClick('home')}
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   target.style.display = 'none';
                   const parent = target.parentElement;
                   if (parent && !parent.querySelector('.fallback-logo')) {
                     const fallback = document.createElement('div');
                     fallback.className =
                       'fallback-logo bg-red-600 text-white w-full h-full flex items-center justify-center font-black text-2xl';
                     fallback.textContent = 'S';
                     fallback.style.cssText =
                       'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; cursor: pointer;';
                     fallback.onclick = () => handleNavClick('home');
                     parent.appendChild(fallback);
                   }
                 }}
               />
             </div>
           </div>

          {/* RIGHT: BLUE NAV BAR */}
          <div className="flex-1 flex items-center">
            {/* DESKTOP NAV (centered, professional) */}
            <div className="hidden lg:flex flex-1 items-center justify-center h-full">
              <nav className="flex items-center space-x-12">
                {/* HOME */}
                <button
                  onClick={() => handleNavClick('home')}
                  className={`relative px-3 py-3 text-[14px] lg:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                    currentPage === 'home'
                      ? 'text-[#ffd54a]'
                      : 'text-white hover:text-[#ffd54a]'
                  }`}
                >
                  {topBarFor(currentPage === 'home')}
                  HOME
                </button>

                {navItems.map((item) => {
                  // VEHICLES DROPDOWN
                  if (item.id === 'vehicles') {
                    const isActive =
                      currentPage === item.id ||
                      currentPage === 'massey-products';

                    return (
                      <div
                        key={item.id}
                        className="relative"
                        onMouseEnter={() => {
                          if (vehiclesDropdownTimeout) {
                            clearTimeout(vehiclesDropdownTimeout);
                            setVehiclesDropdownTimeout(null);
                          }
                          setVehiclesDropdownOpen(true);
                        }}
                        onMouseLeave={() => {
                          const timeout = setTimeout(() => {
                            setVehiclesDropdownOpen(false);
                          }, 120);
                          setVehiclesDropdownTimeout(timeout);
                        }}
                      >
                        <button
                          onClick={() => handleNavClick(item.id)}
                            className={`relative px-3 py-3 text-[14px] lg:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                            isActive
                              ? 'text-[#ffd54a]'
                              : 'text-white hover:text-[#ffd54a]'
                          }`}
                        >
                          {topBarFor(isActive)}
                          {item.label}
                        </button>

                        {vehiclesDropdownOpen && (
                          <div
                            className="absolute top-full left-0 pt-3 w-60 z-[9999]"
                            onMouseEnter={() => {
                              if (vehiclesDropdownTimeout) {
                                clearTimeout(vehiclesDropdownTimeout);
                                setVehiclesDropdownTimeout(null);
                              }
                              setVehiclesDropdownOpen(true);
                            }}
                            onMouseLeave={() => {
                              const timeout = setTimeout(() => {
                                setVehiclesDropdownOpen(false);
                              }, 120);
                              setVehiclesDropdownTimeout(timeout);
                            }}
                          >
                            <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('vehicles');
                                  setVehiclesDropdownOpen(false);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('vehicles');
                                  setVehiclesDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                                  currentPage === 'vehicles'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                All Vehicles
                              </button>
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('vehicles');
                                  setVehiclesDropdownOpen(false);
                                  sessionStorage.setItem(
                                    'sahni_selectedBrand',
                                    'tata',
                                  );
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('vehicles');
                                  setVehiclesDropdownOpen(false);
                                  sessionStorage.setItem(
                                    'sahni_selectedBrand',
                                    'tata',
                                  );
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                                  currentPage === 'vehicles' &&
                                  sessionStorage.getItem(
                                    'sahni_selectedBrand',
                                  ) === 'tata'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Tata Motors
                              </button>
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('massey-products');
                                  setVehiclesDropdownOpen(false);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('massey-products');
                                  setVehiclesDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                                  currentPage === 'massey-products'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Massey Ferguson
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // ABOUT DROPDOWN
                  if (item.id === 'about') {
                    const isActive =
                      currentPage === item.id ||
                      currentPage === 'management' ||
                      currentPage === 'awards' ||
                      currentPage === 'promoters';

                    return (
                      <div
                        key={item.id}
                        className="relative"
                        onMouseEnter={() => setAboutDropdownOpen(true)}
                        onMouseLeave={() => setAboutDropdownOpen(false)}
                      >
                        <button
                          onClick={() => handleNavClick(item.id)}
                            className={`relative px-3 py-3 text-[14px] lg:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                            isActive
                              ? 'text-[#ffd54a]'
                              : 'text-white hover:text-[#ffd54a]'
                          }`}
                        >
                          {topBarFor(isActive)}
                          {item.label}
                        </button>

                        {aboutDropdownOpen && (
                          <div
                            className="absolute top-full left-0 pt-3 w-60 z-[9999]"
                            onMouseEnter={() => setAboutDropdownOpen(true)}
                            onMouseLeave={() => setAboutDropdownOpen(false)}
                          >
                            <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('about');
                                  setAboutDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                                  currentPage === 'about'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Our Story
                              </button>
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('promoters');
                                  setAboutDropdownOpen(false);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('promoters');
                                  setAboutDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                                  currentPage === 'promoters'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Promoters
                              </button>
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('management');
                                  setAboutDropdownOpen(false);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('management');
                                  setAboutDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                                  currentPage === 'management'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Management Team
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNavClick('awards');
                                  setAboutDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                                  currentPage === 'awards'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Our Awards
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // OUR BUSINESSES DROPDOWN
                  if (item.id === 'products') {
                    const isActive =
                      currentPage === item.id ||
                      currentPage === 'vehicles' ||
                      currentPage === 'massey-products' ||
                      currentPage === 'fuel-stations' ||
                      currentPage === 'showrooms' ||
                      currentPage === 'products' ||
                      currentPage === 'institutional-sales';

                    return (
                      <div
                        key={item.id}
                        className="relative"
                        onMouseEnter={() => {
                          if (businessesDropdownTimeout) {
                            clearTimeout(businessesDropdownTimeout);
                            setBusinessesDropdownTimeout(null);
                          }
                          setBusinessesDropdownOpen(true);
                        }}
                        onMouseLeave={() => {
                          const timeout = setTimeout(() => {
                            setBusinessesDropdownOpen(false);
                          }, 120);
                          setBusinessesDropdownTimeout(timeout);
                        }}
                      >
                        <button
                          onClick={() => handleNavClick(item.id)}
                            className={`relative px-3 py-3 text-[14px] lg:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                            isActive
                              ? 'text-[#ffd54a]'
                              : 'text-white hover:text-[#ffd54a]'
                          }`}
                        >
                          {topBarFor(isActive)}
                          {item.label}
                        </button>

                        {businessesDropdownOpen && (
                          <div
                            className="absolute top-full left-0 pt-3 w-72 z-[9999]"
                            onMouseEnter={() => {
                              if (businessesDropdownTimeout) {
                                clearTimeout(businessesDropdownTimeout);
                                setBusinessesDropdownTimeout(null);
                              }
                              setBusinessesDropdownOpen(true);
                            }}
                            onMouseLeave={() => {
                              const timeout = setTimeout(() => {
                                setBusinessesDropdownOpen(false);
                              }, 120);
                              setBusinessesDropdownTimeout(timeout);
                            }}
                          >
                            <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 space-y-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavClick('vehicles');
                                  setBusinessesDropdownOpen(false);
                                  sessionStorage.setItem(
                                    'sahni_selectedBrand',
                                    'tata',
                                  );
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors block whitespace-nowrap cursor-pointer ${
                                  currentPage === 'vehicles' &&
                                  sessionStorage.getItem(
                                    'sahni_selectedBrand',
                                  ) === 'tata'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Sahni Tata Motors
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavClick('massey-products');
                                  setBusinessesDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors block whitespace-nowrap cursor-pointer ${
                                  currentPage === 'massey-products'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Sahni Massey Ferguson
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavClick('fuel-stations');
                                  setBusinessesDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors block whitespace-nowrap cursor-pointer ${
                                  currentPage === 'fuel-stations'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Sahni Fuel Stations
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavClick('institutional-sales');
                                  setBusinessesDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors block whitespace-nowrap cursor-pointer ${
                                  currentPage === 'institutional-sales'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Sahni Tata Genuine Parts
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavClick('showrooms');
                                  setBusinessesDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors block whitespace-nowrap cursor-pointer ${
                                  currentPage === 'showrooms'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Sahni Showrooms
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sessionStorage.setItem(
                                    'sahni_autoSelectHP',
                                    'true',
                                  );
                                  handleNavClick('products');
                                  setBusinessesDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors block whitespace-nowrap cursor-pointer ${
                                  currentPage === 'products'
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                                }`}
                              >
                                Sahni HP Lubricants
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // NORMAL ITEMS
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`relative px-3 py-3 text-[14px] lg:text-[15px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                        isActive
                          ? 'text-[#ffd54a]'
                          : 'text-white hover:text-[#ffd54a]'
                      }`}
                    >
                      {topBarFor(isActive)}
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              className="lg:hidden ml-auto mr-2 p-2 rounded-md transition-all duration-300 hover:bg-[#0d46ac] focus:outline-none focus:ring-2 focus:ring-[#ffd54a] min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (mobileMenuOpen) {
                  setAboutDropdownOpen(false);
                  setVehiclesDropdownOpen(false);
                }
              }}
              aria-label="Toggle mobile menu"
            >
              <div className="relative w-6 h-6">
                <span
                  className={`absolute top-1/2 left-1/2 w-5 h-0.5 bg-white transform -translate-x-1/2 transition-all duration-300 ${
                    mobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                  }`}
                />
                <span
                  className={`absolute top-1/2 left-1/2 w-5 h-0.5 bg-white transform -translate-x-1/2 transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute top-1/2 left-1/2 w-5 h-0.5 bg-white transform -translate-x-1/2 transition-all duration-300 ${
                    mobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* MOBILE OVERLAY */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => {
              setMobileMenuOpen(false);
              setBusinessesDropdownOpen(false);
            }}
          />
        )}

        {/* MOBILE DRAWER */}
        <div
          className={`lg:hidden fixed top-0 left-0 h-full w-full sm:w-80 sm:max-w-[85vw] bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? 'translate-x-0 opacity-100 visible'
              : '-translate-x-full opacity-0 invisible pointer-events-none'
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center space-x-3">
              <img
                src="/images/GROUP (1).png"
                alt="Sahni Group Logo"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="flex flex-col">
                <div className="text-base font-black text-gray-900 leading-tight">
                  SAHNI GROUP
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  Since 1965
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setBusinessesDropdownOpen(false);
              }}
              className="p-2 rounded-md hover:bg-red-50 hover:text-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              aria-label="Close menu"
            >
              <X size={22} className="text-gray-700" />
            </button>
          </div>

          {/* Drawer items */}
          <nav className="flex flex-col py-2 max-h-[calc(100vh-90px)] overflow-y-auto">
            {navItems.map((item, index) => {
              // OUR BUSINESSES mobile
              if (item.id === 'products') {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        setBusinessesDropdownOpen(!businessesDropdownOpen);
                      }}
                      className={`relative text-left py-4 px-4 sm:px-6 mx-2 my-1 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 min-h-[56px] flex items-center group w-full ${
                        currentPage === item.id ||
                        currentPage === 'vehicles' ||
                        currentPage === 'massey-products' ||
                        currentPage === 'fuel-stations' ||
                        currentPage === 'showrooms' ||
                        currentPage === 'products' ||
                        currentPage === 'institutional-sales'
                          ? 'text-gray-900 bg-yellow-50 border-l-4 border-[#ffd54a] shadow-sm'
                          : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                      }`}
                      style={{
                        animationDelay: mobileMenuOpen ? `${index * 50}ms` : '0ms',
                        animationFillMode: 'both',
                      }}
                    >
                      <span className="flex-1">{item.label}</span>
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 ${
                          businessesDropdownOpen ? 'rotate-90' : ''
                        } ${
                          currentPage === item.id ||
                          currentPage === 'vehicles' ||
                          currentPage === 'massey-products' ||
                          currentPage === 'fuel-stations' ||
                          currentPage === 'showrooms' ||
                          currentPage === 'products' ||
                          currentPage === 'institutional-sales'
                            ? 'text-[#ffd54a]'
                            : 'text-gray-400'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    {businessesDropdownOpen && (
                      <div className="ml-4 mr-2 mb-2 space-y-1">
                        <button
                          onClick={() => {
                            handleNavClick('vehicles');
                            setBusinessesDropdownOpen(false);
                            sessionStorage.setItem('sahni_selectedBrand', 'tata');
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'vehicles' &&
                            sessionStorage.getItem('sahni_selectedBrand') === 'tata'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Sahni Tata Motors
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('massey-products');
                            setBusinessesDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'massey-products'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Sahni Massey Ferguson
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('fuel-stations');
                            setBusinessesDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'fuel-stations'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Sahni Fuel Stations
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('institutional-sales');
                            setBusinessesDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'institutional-sales'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Sahni Tata Genuine Parts
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('showrooms');
                            setBusinessesDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'showrooms'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Sahni Showrooms
                        </button>
                        <button
                          onClick={() => {
                            sessionStorage.setItem('sahni_autoSelectHP', 'true');
                            handleNavClick('products');
                            setBusinessesDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'products'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Sahni HP Lubricants
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // VEHICLES mobile
              if (item.id === 'vehicles') {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        handleNavClick(item.id);
                        setVehiclesDropdownOpen(!vehiclesDropdownOpen);
                      }}
                      className={`relative text-left py-4 px-4 sm:px-6 mx-2 my-1 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 min-h-[56px] flex items-center group w-full ${
                        currentPage === item.id || currentPage === 'massey-products'
                          ? 'text-gray-900 bg-yellow-50 border-l-4 border-[#ffd54a] shadow-sm'
                          : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                      }`}
                      style={{
                        animationDelay: mobileMenuOpen ? `${index * 50}ms` : '0ms',
                        animationFillMode: 'both',
                      }}
                    >
                      <span className="flex-1">{item.label}</span>
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 ${
                          vehiclesDropdownOpen ? 'rotate-90' : ''
                        } ${
                          currentPage === item.id || currentPage === 'massey-products'
                            ? 'text-[#ffd54a]'
                            : 'text-gray-400'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    {vehiclesDropdownOpen && (
                      <div className="ml-4 mr-2 mb-2 space-y-1">
                        <button
                          onClick={() => {
                            handleNavClick('vehicles');
                            setVehiclesDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'vehicles'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          All Vehicles
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('vehicles');
                            setVehiclesDropdownOpen(false);
                            sessionStorage.setItem('sahni_selectedBrand', 'tata');
                          }}
                          className="w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]"
                        >
                          Tata Motors
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('massey-products');
                            setVehiclesDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'massey-products'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Massey Ferguson
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // ABOUT mobile
              if (item.id === 'about') {
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        handleNavClick(item.id);
                        setAboutDropdownOpen(!aboutDropdownOpen);
                      }}
                      className={`relative text-left py-4 px-4 sm:px-6 mx-2 my-1 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 min-h-[56px] flex items-center group w-full ${
                        currentPage === item.id ||
                        currentPage === 'management' ||
                        currentPage === 'awards' ||
                        currentPage === 'promoters'
                          ? 'text-gray-900 bg-yellow-50 border-l-4 border-[#ffd54a] shadow-sm'
                          : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                      }`}
                      style={{
                        animationDelay: mobileMenuOpen ? `${index * 50}ms` : '0ms',
                        animationFillMode: 'both',
                      }}
                    >
                      <span className="flex-1">{item.label}</span>
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 ${
                          aboutDropdownOpen ? 'rotate-90' : ''
                        } ${
                          currentPage === item.id ||
                          currentPage === 'management' ||
                          currentPage === 'awards' ||
                          currentPage === 'promoters'
                            ? 'text-[#ffd54a]'
                            : 'text-gray-400'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    {aboutDropdownOpen && (
                      <div className="ml-4 mr-2 mb-2 space-y-1">
                        <button
                          onClick={() => {
                            handleNavClick('about');
                            setAboutDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'about'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Our Story
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('promoters');
                            setAboutDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'promoters'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Promoters
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('management');
                            setAboutDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'management'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Management Team
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick('awards');
                            setAboutDropdownOpen(false);
                          }}
                          className={`w-full text-left py-3 px-4 rounded-lg font-medium uppercase tracking-wide text-sm transition-all ${
                            currentPage === 'awards'
                              ? 'text-gray-900 bg-yellow-50 border-l-2 border-[#ffd54a]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#ffd54a]'
                          }`}
                        >
                          Our Awards
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // NORMAL mobile items
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative text-left py-4 px-4 sm:px-6 mx-2 my-1 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 min-h-[56px] flex items-center group ${
                    currentPage === item.id
                      ? 'text-gray-900 bg-yellow-50 border-l-4 border-[#ffd54a] shadow-sm'
                      : 'text-gray-900 hover:bg-gray-50 hover:text-[#ffd54a]'
                  }`}
                  style={{
                    animationDelay: mobileMenuOpen ? `${index * 50}ms` : '0ms',
                    animationFillMode: 'both',
                  }}
                >
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <a
              href="tel:+919281029456"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3.5 px-4 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all duration-300 flex items-center justify-center shadow-md"
            >
              <Phone size={18} className="mr-2" />
              Call Now
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
