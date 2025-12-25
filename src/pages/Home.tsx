import { useEffect, useRef, useState } from 'react';
import { Building2, Users, Package, Eye, Target, ArrowRight, Droplet, MapPin, Mail, Phone, Calendar, User, MessageSquare, Award } from 'lucide-react';
import { homeAPI, aboutAPI, normalizeImageUrl } from '../services/api';

interface HomeProps {
  setCurrentPage?: (page: string) => void;
}

interface AboutEntry {
  id: string;
  title: string;
  description: string;
  link?: string;
  image?: string;
}

const normalizeAboutEntries = (items: any[]): AboutEntry[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const linkValue = item?.link || item?.cta || '';
    const isImagePath = linkValue && (
      linkValue.includes('/images/') ||
      linkValue.endsWith('.png') ||
      linkValue.endsWith('.jpg') ||
      linkValue.endsWith('.jpeg') ||
      linkValue.endsWith('.webp') ||
      linkValue.endsWith('.gif') ||
      linkValue.endsWith('.svg')
    );

    const rawImage =
      item?.file ||
      item?.image ||
      item?.image_url ||
      item?.photo ||
      item?.banner ||
      item?.thumbnail ||
      (isImagePath ? linkValue : '');

    return {
      id: String(item?.id || item?.about_id || item?.uuid || index),
      title: item?.title || item?.heading || `Highlight ${index + 1}`,
      description: item?.description || item?.details || '',
      link: isImagePath ? undefined : (linkValue || undefined),
      image: rawImage ? normalizeImageUrl(rawImage) : undefined,
    };
  });
};

export default function Home({ setCurrentPage }: HomeProps) {
  const scrollRevealRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoLoading, setVideoLoading] = useState(true);
  const [adVideoUrl, setAdVideoUrl] = useState<string>('');
  const [adVideoLoading, setAdVideoLoading] = useState(true);
  const [adVideoError, setAdVideoError] = useState(false);
  const [aboutEntries, setAboutEntries] = useState<AboutEntry[]>([]);
  const [loadingAboutEntries, setLoadingAboutEntries] = useState<boolean>(true);
  const [imageError, setImageError] = useState(false);
  
  // Form state for appointment booking
  const [appointmentForm, setAppointmentForm] = useState({
    name: '',
    email: '',
    phone: '',
    requirement: '',
  });

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    // Observe all elements with scroll-reveal classes
    const scrollRevealElements = document.querySelectorAll(
      '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .scroll-reveal-fade'
    );
    
    scrollRevealElements.forEach((el) => {
      observer.observe(el);
    });

    // Also observe elements in refs array
    scrollRevealRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      scrollRevealElements.forEach((el) => {
        observer.unobserve(el);
      });
      scrollRevealRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  // Fetch video from API
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setVideoLoading(true);
        console.log('[Home] Fetching video from Vercel backend...');
        const url = await homeAPI.getVideo();
        console.log('[Home] Video URL received from backend:', url);
        if (url) {
          setVideoUrl(url);
        } else {
          // Fallback to default video if no video is set
          console.log('[Home] No video URL from backend, using BACKGROUND.mp4');
          setVideoUrl(normalizeImageUrl('/videos/BACKGROUND.mp4'));
        }
      } catch (error) {
        console.error('[Home] Failed to load home video from backend:', error);
        // Fallback to default video on error
        setVideoUrl(normalizeImageUrl('/videos/BACKGROUND.mp4'));
      } finally {
        setVideoLoading(false);
      }
    };

    loadVideo();
  }, []);

  // Load advertisement video
  useEffect(() => {
    // Use the adver1.mp4 video directly from public folder
    const adVideoPath = '/videos/adver1.mp4';
    const normalizedUrl = normalizeImageUrl(adVideoPath);
    console.log('[Home] Setting advertisement video URL:', normalizedUrl);
    setAdVideoUrl(normalizedUrl);
    setAdVideoError(false);
    setAdVideoLoading(false);
  }, []);

  // Fetch About entries
  useEffect(() => {
    const loadAboutEntries = async () => {
      setLoadingAboutEntries(true);
      try {
        console.log('[Home] Fetching about entries from Vercel backend...');
        const data = await aboutAPI.getAll();
        console.log('[Home] About entries received from backend:', data.length, 'items');
        const normalized = normalizeAboutEntries(data);
        setAboutEntries(normalized);
        console.log('[Home] About entries normalized and set:', normalized.length, 'items');
      } catch (error: any) {
        console.warn('[Home] Failed to load about entries from backend:', error);
      } finally {
        setLoadingAboutEntries(false);
      }
    };

    loadAboutEntries();
  }, []);


  return (
    <div className="bg-white">
      {/* Hero Section - Professional Full-Width Design */}
      <section className="relative min-h-[90vh] sm:min-h-[95vh] overflow-hidden w-full">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={
              imageError
                ? 'https://images.unsplash.com/photo-1556761175-b413dfb5e3d7?w=1920&h=1080&fit=crop'
                : normalizeImageUrl('/images/aboutus.png')
            }
            alt="Sahni Group Background"
            className="w-full h-full object-cover object-center"
            onError={() => setImageError(true)}
          />
          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/55 z-10"></div>
        </div>
        
        {/* Content Layer - Centered */}
        <div className="relative z-20 w-full h-full flex items-center justify-center min-h-[90vh] sm:min-h-[95vh]">
          {/* Hero Text - Professional 2 Lines with light card */}
          <div className="text-center w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 scroll-reveal-scale">
            <div className="inline-block bg-white/92 backdrop-blur-md rounded-2xl border border-white/70 shadow-[0_25px_80px_rgba(0,0,0,0.35)] px-6 sm:px-8 md:px-10 py-6 sm:py-7 md:py-8">
              <div
                className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl mx-auto leading-[1.05] tracking-tight text-yellow-300 drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)] text-center"
                style={{ fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 800 }}
              >
                <div className="block mb-4 sm:mb-5">Strengthened by strategic alliances.</div>
                <div className="block">Innovation-driven growth across our businesses.</div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator - Professional Chevron */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30">
            <div className="animate-bounce">
              <svg className="w-10 h-10 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Our Business Partners - Horizontal Scroll Section */}
      <section className="relative w-full bg-gradient-to-r from-purple-50 via-blue-50 to-blue-100 py-8 sm:py-10 md:py-12 overflow-x-hidden overflow-y-visible">
        <div className="w-full mx-auto">
          <div className="text-center mb-6 sm:mb-8 px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2 sm:mb-3">
              Our Business
            </h2>
            <div className="w-16 sm:w-20 md:w-24 h-1 bg-red-600 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Trusted partnerships with industry leaders
            </p>
                </div>

          {/* Horizontal Scroll Container */}
          <div className="relative w-full" style={{ overflow: 'hidden' }}>
            {/* Gradient Fade on Edges - Minimal */}
            <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-r from-purple-50 via-purple-50/20 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-l from-blue-100 via-blue-100/20 to-transparent z-10 pointer-events-none"></div>

            {/* Scrollable Content - Continuous Animation */}
            <div className="flex gap-4 sm:gap-5 md:gap-6 pb-4 animate-scroll-left will-change-transform" style={{ paddingLeft: '4rem', paddingRight: '4rem' }}>
              {/* First Set */}
              <div className="flex gap-4 sm:gap-5 md:gap-6 flex-shrink-0">
            {/* HP Lubricants Card */}
            <button
                className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                if (setCurrentPage) {
                  sessionStorage.setItem('sahni_autoSelectHP', 'true');
                  setCurrentPage('products');
                }
              }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  {/* Top Section - Logo */}
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-4 sm:p-5 relative">
                <img
                  src={normalizeImageUrl('/images/sahni verticals/HP_SULLI5.png')}
                  alt="HP Lubricants"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.hp-logo-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'hp-logo-fallback w-full h-full flex items-center justify-center text-red-600 text-xl sm:text-2xl font-bold';
                          fallback.textContent = 'HP LUBRICANTS';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
            </div>
                  {/* Bottom Section - Text */}
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-red-600 mb-2">HP Lubricants</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  India's No. 1 Lubricants Marketer, offering premium quality engine oils and lubricants for automotive and industrial applications.
                </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>EXPLORE PRODUCTS</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                </div>
              </div>
            </button>

            {/* Fuel Stations Card */}
                    <button
                className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('fuel-stations');
                }
              }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  {/* Top Section - Image */}
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-gray-100 overflow-hidden relative">
                <img
                  src={normalizeImageUrl('/images/sahni verticals/fuel.png')}
                  alt="Fuel Stations"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fuel-fallback')) {
                      const fallback = document.createElement('div');
                          fallback.className = 'fuel-fallback w-full h-full flex items-center justify-center bg-blue-600 text-white text-lg sm:text-xl font-bold';
                          fallback.textContent = 'FUEL STATIONS';
                      parent.appendChild(fallback);
                    }
                  }}
                />
                </div>
                  {/* Bottom Section - Text */}
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">Fuel Stations</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  Network of modern fuel stations providing quality fuel, 24/7 service, and convenient payment options across Andhra Pradesh and Telangana.
                </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>FIND STATIONS</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                </div>
              </div>
                    </button>

              {/* Tata Genuine Parts Card */}
            <button
                className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('institutional-sales');
                }
              }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  {/* Top Section - Logo */}
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-4 sm:p-5 relative">
                <img
                  src={normalizeImageUrl('/images/3075092_d9300.webp')}
                  alt="Tata Genuine Parts"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.tata-parts-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'tata-parts-fallback w-full h-full flex items-center justify-center text-blue-600 text-lg sm:text-xl font-bold';
                          fallback.textContent = 'TATA GENUINE PARTS';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
              </div>
                  {/* Bottom Section - Text */}
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">Tata Genuine Parts</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  Authentic spare parts and components for Tata Motors vehicles, ensuring optimal performance, reliability, and longevity for your commercial vehicles.
                </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>EXPLORE SPARE PARTS</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
              </div>
              </div>
            </button>

            {/* Tata Motors Card */}
                    <button
                className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                if (setCurrentPage) {
                  sessionStorage.setItem('sahni_selectedBrand', 'tata');
                  setCurrentPage('vehicles');
                }
              }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  {/* Top Section - Logo */}
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-4 sm:p-5 relative">
                    <img
                      src={normalizeImageUrl('/images/new-logo.png')}
                  alt="Tata Motors"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                        if (parent && !parent.querySelector('.tata-logo-fallback')) {
                      const fallback = document.createElement('div');
                          fallback.className = 'tata-logo-fallback w-full h-full flex items-center justify-center text-blue-600 text-xl sm:text-2xl font-bold';
                          fallback.textContent = 'TATA MOTORS';
                      parent.appendChild(fallback);
                    }
                  }}
                />
                  </div>
                  {/* Bottom Section - Text */}
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">Tata Motors</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  India's leading manufacturer of commercial vehicles, setting industry benchmarks in performance, reliability, and innovation.
                </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>EXPLORE VEHICLES</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
              </div>
              </div>
            </button>

            {/* TAFE Card */}
                    <button
                className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('massey-products');
                }
              }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  {/* Top Section - Logo */}
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-4 sm:p-5 relative">
                <img
                  src={normalizeImageUrl('/images/TAFE_Logo.jpg')}
                  alt="TAFE"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.tafe-logo-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'tafe-logo-fallback w-full h-full flex items-center justify-center text-red-600 text-lg sm:text-xl font-bold';
                          fallback.textContent = 'TAFE';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  {/* Bottom Section - Text */}
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">TAFE</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                      Premium tractors and agricultural machinery designed for superior performance, durability, and efficiency in farming operations.
                    </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>EXPLORE TRACTORS</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                </div>
              </div>
            </button>

            {/* Auto Components Card */}
            <button
              className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                // Scroll to aftermarket section
                const aftermarketSection = document.getElementById('aftermarket');
                if (aftermarketSection) {
                  aftermarketSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                {/* Top Section - Image */}
                <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-gray-100 overflow-hidden relative">
                  <img
                    src={normalizeImageUrl('/images/AUTO.jpeg')}
                    alt="Auto Components"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.auto-components-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'auto-components-fallback w-full h-full flex items-center justify-center bg-blue-600 text-white text-lg sm:text-xl font-bold';
                        fallback.textContent = 'AUTO COMPONENTS';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                {/* Bottom Section - Text */}
                <div className="bg-white p-4 sm:p-5">
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">Auto Components</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                    We are proud partners of world-renowned automotive component manufacturers, supplying genuine parts and accessories to the aftermarket.
                  </p>
                  <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                    <span>EXPLORE COMPONENTS</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </button>
              </div>

              {/* Duplicate Set for Seamless Loop */}
              <div className="flex gap-4 sm:gap-5 md:gap-6 flex-shrink-0" aria-hidden="true">
            {/* HP Lubricants Card */}
            <button
                className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                if (setCurrentPage) {
                  sessionStorage.setItem('sahni_autoSelectHP', 'true');
                  setCurrentPage('products');
                }
              }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-4 sm:p-5 relative">
                <img
                  src={normalizeImageUrl('/images/sahni verticals/HP_SULLI5.png')}
                  alt="HP Lubricants"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.hp-logo-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'hp-logo-fallback w-full h-full flex items-center justify-center text-red-600 text-xl sm:text-2xl font-bold';
                          fallback.textContent = 'HP LUBRICANTS';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
            </div>
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-red-600 mb-2">HP Lubricants</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  India's No. 1 Lubricants Marketer, offering premium quality engine oils and lubricants for automotive and industrial applications.
                </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>EXPLORE PRODUCTS</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                </div>
              </div>
            </button>

            {/* Fuel Stations Card */}
            <button
                className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('fuel-stations');
                }
              }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-gray-100 overflow-hidden relative">
                <img
                  src={normalizeImageUrl('/images/sahni verticals/fuel.png')}
                  alt="Fuel Stations"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fuel-fallback')) {
                      const fallback = document.createElement('div');
                          fallback.className = 'fuel-fallback w-full h-full flex items-center justify-center bg-blue-600 text-white text-lg sm:text-xl font-bold';
                          fallback.textContent = 'FUEL STATIONS';
                      parent.appendChild(fallback);
                    }
                  }}
                />
                </div>
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">Fuel Stations</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  Network of modern fuel stations providing quality fuel, 24/7 service, and convenient payment options across Andhra Pradesh and Telangana.
                </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>FIND STATIONS</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                </div>
              </div>
            </button>

              {/* Tata Genuine Parts Card */}
            <button
                className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                if (setCurrentPage) {
                  setCurrentPage('institutional-sales');
                }
              }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-4 sm:p-5 relative">
                <img
                  src={normalizeImageUrl('/images/3075092_d9300.webp')}
                  alt="Tata Genuine Parts"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.tata-parts-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'tata-parts-fallback w-full h-full flex items-center justify-center text-blue-600 text-lg sm:text-xl font-bold';
                          fallback.textContent = 'TATA GENUINE PARTS';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">Tata Genuine Parts</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  Authentic spare parts and components for Tata Motors vehicles, ensuring optimal performance, reliability, and longevity for your commercial vehicles.
                </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>EXPLORE SPARE PARTS</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
              </div>
              </div>
            </button>

              {/* Tata Motors Card */}
              <button
                className="flex-shrink-0 group cursor-pointer text-left"
                onClick={() => {
                  if (setCurrentPage) {
                    sessionStorage.setItem('sahni_selectedBrand', 'tata');
                    setCurrentPage('vehicles');
                  }
                }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-4 sm:p-5 relative">
                    <img
                      src={normalizeImageUrl('/images/new-logo.png')}
                      alt="Tata Motors"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.tata-logo-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'tata-logo-fallback w-full h-full flex items-center justify-center text-blue-600 text-xl sm:text-2xl font-bold';
                          fallback.textContent = 'TATA MOTORS';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">Tata Motors</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                      India's leading manufacturer of commercial vehicles, setting industry benchmarks in performance, reliability, and innovation.
                    </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>EXPLORE VEHICLES</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
                  </div>
                </div>
              </button>

              {/* TAFE Card */}
              <button
                className="flex-shrink-0 group cursor-pointer text-left"
                onClick={() => {
                  if (setCurrentPage) {
                    setCurrentPage('massey-products');
                  }
                }}
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                  <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-white flex items-center justify-center p-4 sm:p-5 relative">
                    <img
                      src={normalizeImageUrl('/images/TAFE_Logo.jpg')}
                      alt="TAFE"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.tafe-logo-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'tafe-logo-fallback w-full h-full flex items-center justify-center text-red-600 text-lg sm:text-xl font-bold';
                          fallback.textContent = 'TAFE';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                </div>
                  <div className="bg-white p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">TAFE</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                      Premium tractors and agricultural machinery designed for superior performance, durability, and efficiency in farming operations.
                    </p>
                    <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                      <span>EXPLORE TRACTORS</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
              </div>
            </div>
            </button>

            {/* Auto Components Card */}
            <button
              className="flex-shrink-0 group cursor-pointer text-left"
              onClick={() => {
                // Scroll to aftermarket section
                const aftermarketSection = document.getElementById('aftermarket');
                if (aftermarketSection) {
                  aftermarketSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden w-[200px] xs:w-[220px] sm:w-[240px] md:w-[260px] flex-shrink-0">
                {/* Top Section - Image */}
                <div className="h-40 xs:h-44 sm:h-48 md:h-52 bg-gray-100 overflow-hidden relative">
                  <img
                    src={normalizeImageUrl('/images/AUTO.jpeg')}
                    alt="Auto Components"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.auto-components-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'auto-components-fallback w-full h-full flex items-center justify-center bg-blue-600 text-white text-lg sm:text-xl font-bold';
                        fallback.textContent = 'AUTO COMPONENTS';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                {/* Bottom Section - Text */}
                <div className="bg-white p-4 sm:p-5">
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2">Auto Components</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                    We are proud partners of world-renowned automotive component manufacturers, supplying genuine parts and accessories to the aftermarket.
                  </p>
                  <div className="flex items-center text-red-600 font-bold text-xs sm:text-sm group-hover:text-red-700 transition-colors uppercase tracking-wide">
                    <span>EXPLORE COMPONENTS</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="relative w-full bg-gray-900 overflow-hidden">
        <div className="relative w-full">
          {videoLoading ? (
            <div className="w-full h-64 sm:h-96 md:h-[500px] flex items-center justify-center bg-gray-800">
              <div className="text-gray-400">Loading video...</div>
            </div>
          ) : videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto object-contain"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-64 sm:h-96 md:h-[500px] flex items-center justify-center bg-gray-800">
              <div className="text-gray-400">No video available</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-900/20"></div>
        </div>
      </section>

      {/* Advertisement Video Section */}
      <section className="relative w-full bg-gradient-to-br from-gray-50 to-white py-8 sm:py-10 md:py-12 lg:py-14 overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-6 sm:mb-8 md:mb-10 scroll-reveal">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
               Our Journey
            </h2>
            <div className="w-16 sm:w-20 md:w-24 h-1 bg-red-600 mx-auto"></div>
            <p className="text-lg sm:text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
              Discover what makes us different and how we serve our customers with excellence
            </p>
          </div>
          
          <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-xl bg-gray-900 scroll-reveal">
            {adVideoLoading ? (
              <div className="w-full aspect-video flex items-center justify-center bg-gray-800">
                <div className="text-gray-400 text-lg">Loading advertisement...</div>
              </div>
            ) : adVideoError ? (
              <div className="w-full aspect-video flex items-center justify-center bg-gray-800">
                <div className="text-gray-400 text-lg">Advertisement video not available</div>
              </div>
            ) : adVideoUrl ? (
              <video
                src={adVideoUrl}
                controls
                autoPlay={false}
                loop={false}
                muted={false}
                playsInline
                className="w-full h-auto object-contain"
                onError={(e) => {
                  setAdVideoError(true);
                  const videoElement = e.target as HTMLVideoElement;
                  console.error('Failed to load advertisement video:', {
                    videoSrc: videoElement.src,
                    networkState: videoElement.networkState,
                    error: videoElement.error
                  });
                }}
                poster={normalizeImageUrl('/images/aboutus.png')} // Optional: Add a poster image
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-gray-800">
                <div className="text-gray-400 text-lg">No advertisement video available</div>
              </div>
            )}
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-900/10 pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Our Story Section - Centered */}
      <section className="py-6 sm:py-8 md:py-10 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center scroll-reveal">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Our Story
            </h2>
            <div className="w-16 sm:w-20 md:w-24 h-1 bg-red-600 mx-auto"></div>
          </div>
        </div>
      </section>

      {/* About Us Section - Complete Page Content */}
      {/* Dynamic Highlights Section - Shows loading state and entries */}
      <section className="py-6 sm:py-8 md:py-10 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          {loadingAboutEntries ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="mt-3 text-gray-600">Loading highlights...</p>
            </div>
          ) : aboutEntries.length > 0 ? (
            <>
              <div className="text-center mb-6 sm:mb-8 md:mb-10 scroll-reveal">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                  LATEST HIGHLIGHTS
                </h2>
              </div>

              <div className="space-y-6 sm:space-y-8">
                {aboutEntries.map((entry, index) => {
                const hasImage = entry.image && entry.image.trim() !== '';

                return (
                  <div key={entry.id} className="flex justify-center scroll-reveal" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 max-w-4xl w-full">
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        {entry.title}
                      </h3>

                      {hasImage ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-4 sm:mb-6 items-start">
                          <div className="w-full">
                            <div className="w-full overflow-hidden rounded-lg shadow-md bg-gray-100">
                              <img
                                src={entry.image}
                                alt={entry.title}
                                className="w-full h-full max-h-72 object-cover block"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400 rounded-lg text-sm">Image not available</div>';
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-base sm:text-lg text-gray-700 leading-relaxed">
                            {entry.description.split('\n').filter((p) => p.trim()).length > 1 ? (
                              entry.description.split('\n').map((paragraph, pIndex) =>
                                paragraph.trim() ? (
                                  <p key={pIndex} className="mb-3 sm:mb-4">
                                    {paragraph.trim()}
                                  </p>
                                ) : null
                              )
                            ) : (
                              <p>{entry.description}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                          {entry.description.split('\n').filter((p) => p.trim()).length > 1 ? (
                            entry.description.split('\n').map((paragraph, pIndex) =>
                              paragraph.trim() ? (
                                <p key={pIndex} className="mb-3 sm:mb-4">
                                  {paragraph.trim()}
                                </p>
                              ) : null
                            )
                          ) : (
                            <p>{entry.description}</p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (setCurrentPage) {
                            setCurrentPage('about');
                          }
                        }}
                        className="inline-flex items-center text-red-600 font-semibold text-base sm:text-lg hover:text-red-700 transition-colors group"
                      >
                        LEARN MORE
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">
                          &gt;
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* About Section */}
      <section className="py-6 sm:py-8 md:py-10 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            <div className="scroll-reveal-left">
              <div className="w-16 sm:w-20 md:w-24 h-1 bg-red-600 mb-4 sm:mb-6" />
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-3 sm:mb-4 leading-relaxed">
                Founded in 1965 at Vijayawada by Late Harvinder Singh
                Sahni, Sahni Group has grown into a diversified business
                with interests in fuel retail, lubricants distribution,
                aftermarket sales, institutional supplies, and vehicle
                dealerships.
              </p>
              <p className="text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed">
                With operations across Andhra Pradesh and Telangana, the
                group employs 300+ people and partners with leading global
                brands.
              </p>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                Over six decades, Sahni Group has evolved from a single
                venture into a diversified conglomerate spanning critical
                sectors of the automotive and energy industries, serving
                both retail customers and major institutional clients with
                equal dedication.
              </p>
            </div>

            <div className="relative scroll-reveal-right">
              <img
                src={normalizeImageUrl('/images/aboutus.png')}
                alt="Sahni Group - Our Story"
                className="w-full h-auto rounded-2xl shadow-xl object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 to-transparent p-4 rounded-b-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-lg text-center border border-white/30">
                    <div className="text-2xl font-bold mb-1">60+</div>
                    <div className="text-xs text-gray-200">
                      Years Experience
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-lg text-center border border-white/30">
                    <div className="text-2xl font-bold mb-1">300+</div>
                    <div className="text-xs text-gray-200">
                      Skilled Professionals
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8 scroll-reveal">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              OUR COMPANY&apos;S
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Vision */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden scroll-reveal-left scroll-reveal-delay-1">
              <div className="bg-gray-800 text-white px-6 py-4 flex items-center">
                <Eye size={32} className="mr-3" />
                <h3 className="text-2xl font-bold">VISION</h3>
              </div>
              <div className="p-8">
                <p className="text-lg text-gray-700 text-center leading-relaxed">
                  To be a trusted leader in automotive and energy
                  solutions, delivering value through innovation,
                  integrity, and customer-focused service excellence.
                </p>
              </div>
            </div>

            {/* Mission */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden scroll-reveal-right scroll-reveal-delay-2">
              <div className="bg-gray-800 text-white px-6 py-4 flex items-center">
                <Target size={32} className="mr-3" />
                <h3 className="text-2xl font-bold">MISSION</h3>
              </div>
              <div className="p-8">
                <p className="text-lg text-gray-700 text-center leading-relaxed">
                  Empowering growth with reliable products, strong
                  partnerships, and sustainable practices while creating
                  opportunities and contributing to communities we serve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-10 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8 scroll-reveal">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Our Values
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 scroll-reveal-scale scroll-reveal-delay-1">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <Award size={40} className="text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Integrity
              </h3>
              <p className="text-gray-700">
                We conduct business with the highest ethical standards,
                building trust with every interaction.
              </p>
            </div>

            <div className="text-center p-6 scroll-reveal-scale scroll-reveal-delay-2">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <Users size={40} className="text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                People First
              </h3>
              <p className="text-gray-700">
                Our employees, customers, and communities are at the heart
                of everything we do.
              </p>
            </div>

            <div className="text-center p-6 scroll-reveal-scale scroll-reveal-delay-3">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <Target size={40} className="text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Excellence
              </h3>
              <p className="text-gray-700">
                We strive for excellence in every aspect of our business,
                continuously improving and innovating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 scroll-reveal">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Leadership
            </h2>
            <div className="w-16 sm:w-20 md:w-24 h-1 bg-red-600 mx-auto" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            {/* Late Shri Harvinder Singh Sahni */}
            <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-lg scroll-reveal-left scroll-reveal-delay-1">
              <div className="text-center mb-4 sm:mb-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-yellow-400 shadow-xl">
                  <img
                    src={normalizeImageUrl('/images/founder.png')}
                    alt="Late Shri Harvinder Singh Sahni"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                Late Shri Harvinder Singh Sahni
              </h3>
              <p className="text-lg sm:text-xl mb-3 sm:mb-4 text-center text-gray-300">
                Founder (1965)
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-center mb-3 sm:mb-4">
                A visionary entrepreneur who established Sahni Group in
                1965 with a clear mission: Building Businesses, Creating
                Employment.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-center">
                His legacy of integrity, hard work, and community service
                continues to inspire our organization today. Starting from
                Vijayawada, his vision was clear: to build businesses that
                not only thrive but also create meaningful employment
                opportunities for the community.
              </p>
            </div>

            {/* Gurjeet Singh Sahni */}
            <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-lg scroll-reveal-right scroll-reveal-delay-2">
              <div className="text-center mb-4 sm:mb-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-yellow-400 shadow-xl">
                  <img
                    src={normalizeImageUrl('/images/gurjeeth.png')}
                    alt="Gurjeet Singh Sahni"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                Gurjeet Singh Sahni
              </h3>
              <p className="text-lg sm:text-xl mb-3 sm:mb-4 text-center text-gray-300">
                Managing Director
              </p>
              <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                <p className="text-sm sm:text-base text-gray-300">
                  • Joint Secretary - Andhra Chamber of Commerce Industry and Federation.
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • General Secretary - NSM Old Students Association
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • Core Committee Member - Society for Vibrant Vijayawada
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • Executive Member - Andhra Motor Merchants Association (AMMA)
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • Past President - BNI Alpha with All time Record of 100 Crore Business
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • Director Community Service - Rotary Club of Vijayawada Mid-Town.
                </p>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-center mb-4 sm:mb-6">
                Leading Sahni Group into a new era while honoring the
                vision of founder Late Shri Harvinder Singh Sahni. Under his
                leadership, the group continues to expand its presence
                across multiple sectors, creating opportunities and
                building lasting value for the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Verticals Section - All Vertical Content (Header Removed) */}
      {(() => {
        const verticals = [
          {
            id: 'lubricants',
            icon: Droplet,
            title: 'Lubricants Distribution',
            description: 'As authorized distributors for leading lubricant brands, we supply high-quality  lubricants to both Automotive and Industrial markets.',
            retailBrands: [
              { name: 'HP Lubricants', image: normalizeImageUrl('/images/sahni verticals/HP_SULLI5.png') },
              { name: 'Mahindra', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/Mahindra1.png') },
              { name: 'Jio-bp', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/Jio-bp_logo.svg') },
              { name: 'SUPERLINE', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/superline.png') },
              { name: 'Reliance Lubricants', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/reliance lubricants.avif') },
            ],
            industrialBrands: [
              { name: 'HP Lubricants', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/HP-indus-Lubricants.png') },
              { name: 'Balmerol Lubricants', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/balmerol industrial.png') },
            ],
            image: normalizeImageUrl('/images/prdcts_hero.jpg'),
          },
          {
            id: 'aftermarket',
            icon: Package,
            title: 'Auto Components',
            description: 'We are proud partners of world-renowned automotive component manufacturers, supplying genuine parts and accessories to the aftermarket.',
            phone: '+91 93905 02406',
            brands: [
              { name: 'DANA SPICER', image: normalizeImageUrl('/images/sahni verticals/DANA SPICER.webp') },
              { name: 'SRMT', image: normalizeImageUrl('/images/sahni verticals/srmt-road-transport-anantapur-ho-anantapur-transporters-zvt2qmx.webp') },
              { name: 'SBP (SRI BHAVANI CASTINGS PVT LTD)', image: normalizeImageUrl('/images/sahni verticals/SRI-BHAVANI-CASTINGS-LTD-2.jpg') },
              { name: 'GAJRA GEARS', image: normalizeImageUrl('/images/sahni verticals/images.jpg') },
              { name: 'EMBROSS', image: normalizeImageUrl('/images/sahni verticals/2.jpg') },
              { name: 'ZF WABCO', image: normalizeImageUrl('/images/sahni verticals/f3e5b04c-bcb1-459a-8c47-9535ae88f974.avif')},
              { name: 'SPICER SELECT', image: normalizeImageUrl('/images/sahni verticals/1.jpg') },
              { name: 'SVL', image: normalizeImageUrl('/images/sahni verticals/dn.jpg') },
              { name: 'RSB', image: normalizeImageUrl('/images/sahni verticals/logo-3.png') },
            ],
            image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
          },
          {
            id: 'institutional',
            icon: Building2,
            title: 'Institutional & Government Sales',
            description: 'Distributors for Andhra Pradesh and Telangana for Tata Motors CV Spare Parts  for Institutional and Government Sales. We serve major government and institutional clients with customized solutions.',
            phone: '+91 93933 47788',
            clients: [
              { name: 'APSRTC', fullName: 'Andhra Pradesh State Road Transport Corporation' },
              { name: 'TGSRTC', fullName: 'Telangana State Road Transport Corporation' },
              { name: 'SHAR (ISRO)', fullName: 'Satish Dhawan Space Centre, ISRO' },
              { name: 'POSTAL DPT', fullName: 'Postal Department' },
              { name: 'SCCL', fullName: 'Singareni Collieries Company Limited' },
              { name: 'OTHER PSU\'s', fullName: 'Other Public Sector Undertakings' },
            ],
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
          },
        ];

        return (
          <>
            {/* Lubricants Distribution */}
            <section id="lubricants" className="py-8 sm:py-12 md:py-16 bg-white">
              <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
                <div className="text-center mb-8 sm:mb-10 md:mb-12 scroll-reveal">
                  <div className="bg-yellow-400 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg mb-4 sm:mb-6 inline-block">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 uppercase">LUBRICANTS</h2>
                  </div>
                  <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-4">
                    {verticals.find(v => v.id === 'lubricants')?.description}
                  </p>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a
                      href="tel:+919346699555"
                      className="text-xl sm:text-2xl font-bold text-blue-900 hover:text-red-600 transition-colors"
                    >
                      +91 93466 99555
                    </a>
                  </div>
                  
                  {/* Addresses */}
                  <div className="mt-6 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      {/* Hyderabad Address */}
                      <div className="flex items-start gap-3 text-left">
                        <MapPin className="w-5 h-5 text-blue-900 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Hyderabad</p>
                          <p className="text-sm sm:text-base text-gray-700">
                            Sahni Arcade, 4-10-264, PLOT NO15, BLOCK NO12, Auto Nagar, Hyderabad, Rangareddy, Telangana, 500070
                          </p>
                        </div>
                      </div>
                      
                      {/* Vijayawada Address */}
                      <div className="flex items-start gap-3 text-left">
                        <MapPin className="w-5 h-5 text-blue-900 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Vijayawada</p>
                          <p className="text-sm sm:text-base text-gray-700">
                            Sahni Complex, 2nd Cross Rd, Auto Nagar, Vijayawada, Andhra Pradesh 520007
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Lubricant Brands Grid */}
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {(() => {
                      const lubricantsData = verticals.find(v => v.id === 'lubricants');
                      const retailBrands = lubricantsData?.retailBrands || [];
                      const industrialBrands = lubricantsData?.industrialBrands || [];
                      
                      // Combine all brands, avoiding duplicates (HP Lubricants appears in both)
                      const allBrands = [...retailBrands];
                      industrialBrands.forEach(brand => {
                        // Only add if it's not already in the list
                        if (!allBrands.find(b => b.name === brand.name)) {
                          allBrands.push(brand);
                        }
                      });
                      
                      return allBrands.map((brand, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                          <div className="h-32 sm:h-36 md:h-40 bg-white flex items-center justify-center p-3 sm:p-4">
                            {brand.image ? (
                              <img
                                src={brand.image}
                                alt={brand.name}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.brand-fallback')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'brand-fallback w-full h-full flex items-center justify-center text-gray-600 text-sm font-bold';
                                    fallback.textContent = brand.name.toUpperCase();
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-sm font-bold text-gray-900">{brand.name}</span>
                            )}
                          </div>
                          <div className="p-3 sm:p-4 text-center">
                            <p className="text-sm sm:text-base font-semibold text-gray-900">{brand.name}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </section>

            {/* Spare Parts */}
            <section id="aftermarket" className="py-8 sm:py-12 md:py-16 bg-white">
              <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
                <div className="text-center mb-8 sm:mb-10 md:mb-12 scroll-reveal">
                  <div className="bg-yellow-400 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg mb-4 sm:mb-6 inline-block">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 uppercase whitespace-nowrap">Auto Components</h2>
                  </div>
                  <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-4">
                    {verticals.find(v => v.id === 'aftermarket')?.description}
                  </p>
                  {verticals.find(v => v.id === 'aftermarket')?.phone && (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a
                        href={`tel:${verticals.find(v => v.id === 'aftermarket')?.phone?.replace(/\s/g, '')}`}
                        className="text-xl sm:text-2xl font-bold text-blue-900 hover:text-red-600 transition-colors"
                      >
                        {verticals.find(v => v.id === 'aftermarket')?.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                  {verticals.find(v => v.id === 'aftermarket')?.brands?.map((brand, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-xl p-3 sm:p-4 md:p-5 lg:p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100 scroll-reveal-scale" style={{ animationDelay: `${(index % 9) * 0.1}s` }}>
                      <div className="h-32 sm:h-36 md:h-40 bg-gray-50 rounded-lg mb-3 sm:mb-4 flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-hidden">
                        {brand.image ? (
                          <img
                            src={brand.image}
                            alt={brand.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'text-lg font-bold text-blue-900 text-center';
                                fallback.textContent = brand.name;
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-lg font-bold text-blue-900 text-center">{brand.name}</span>
                        )}
                      </div>
                      <p className="text-center font-semibold text-blue-900 text-sm leading-tight">{brand.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Institutional Sales */}
            <section id="institutional" className="py-8 sm:py-12 md:py-16 bg-gray-50">
              <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
                <div className="text-center mb-8 sm:mb-10 md:mb-12 scroll-reveal">
                  <div className="bg-yellow-400 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg mb-4 sm:mb-6 inline-block">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 uppercase">INSTITUTIONAL & GOVERNMENT SALES</h2>
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 px-2">
                    
                  </p>
                  <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto px-2 mb-4">
                    {verticals.find(v => v.id === 'institutional')?.description}
                  </p>
                  {verticals.find(v => v.id === 'institutional')?.phone && (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a
                        href={`tel:${verticals.find(v => v.id === 'institutional')?.phone?.replace(/\s/g, '')}`}
                        className="text-xl sm:text-2xl font-bold text-blue-900 hover:text-red-600 transition-colors"
                      >
                        {verticals.find(v => v.id === 'institutional')?.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {verticals.find(v => v.id === 'institutional')?.clients?.map((client, index) => (
                    <div key={index} className="bg-blue-900 text-white p-6 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-dashed border-white">
                      <h3 className="text-xl font-bold mb-2 text-center">{client.name}</h3>
                      <p className="text-sm text-center text-gray-300">{client.fullName}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </>
        );
      })()}


      {/* Stats Section */}
      <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {[
              // { number: '60+', label: 'Years Experience', delay: '0s' },
              // { number: '300+', label: 'Skilled Professionals', delay: '0.2s' },
            ].map((stat, index) => (
                <div
                  key={index}
                ref={(el) => (scrollRevealRefs.current[18 + index] = el)}
                className="scroll-reveal"
              >
                <div className="bg-gray-900 text-white p-6 sm:p-8 md:p-10 lg:p-12 text-center shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-4 text-white">
                    {stat.number}
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-semibold text-gray-300 uppercase tracking-wide">{stat.label}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Book an Appointment Section */}
      <section className="py-6 sm:py-8 md:py-10 lg:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            {/* Left Side - Form */}
            <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-gray-100">
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-red-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                    <Calendar className="text-white w-5 h-5 sm:w-7 sm:h-7" size={28} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">BOOK AN APPOINTMENT</h2>
                </div>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  We are your trusted single-source vehicle customization center. Book your appointment today!
                </p>
              </div>
              
              <form 
                className="space-y-4 sm:space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  
                  // Format message for WhatsApp
                  const message = `*BOOK AN APPOINTMENT REQUEST*\n\n` +
                    `*Name:* ${appointmentForm.name}\n` +
                    `*Email:* ${appointmentForm.email}\n` +
                    (appointmentForm.phone ? `*Contact:* ${appointmentForm.phone}\n` : '') +
                    `*Requirement:*\n${appointmentForm.requirement}\n\n` +
                    `_This message was sent from the Sahni Group website._`;
                  
                  // Encode message for URL
                  const encodedMessage = encodeURIComponent(message);
                  
                  // WhatsApp number: +919281029456
                  const whatsappUrl = `https://wa.me/919281029456?text=${encodedMessage}`;
                  
                  // Open WhatsApp in new tab
                  window.open(whatsappUrl, '_blank');
                  
                  // Reset form
                  setAppointmentForm({
                    name: '',
                    email: '',
                    phone: '',
                    requirement: '',
                  });
                }}
              >
                <div>
                  <label htmlFor="appointment-name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" size={20} />
                    <input
                      type="text"
                      id="appointment-name"
                      placeholder="Full Name*"
                      required
                      value={appointmentForm.name}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, name: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="appointment-email" className="block text-sm font-semibold text-gray-900 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" size={20} />
                    <input
                      type="email"
                      id="appointment-email"
                      placeholder="Email*"
                      required
                      value={appointmentForm.email}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, email: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="appointment-phone" className="block text-sm font-semibold text-gray-900 mb-2">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" size={20} />
                    <input
                      type="tel"
                      id="appointment-phone"
                      placeholder="Contact number"
                      value={appointmentForm.phone}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, phone: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="appointment-requirement" className="block text-sm font-semibold text-gray-900 mb-2">
                    Share your requirement with us *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 sm:left-4 top-4 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" size={20} />
                    <textarea
                      id="appointment-requirement"
                      placeholder="Share your requirement with us*"
                      rows={5}
                      required
                      value={appointmentForm.requirement}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, requirement: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-300 text-sm sm:text-base resize-none"
                    ></textarea>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3.5 sm:py-4 px-6 sm:px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-red-700 active:bg-red-800 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center group min-h-[52px] touch-manipulation"
                >
                  SUBMIT
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform w-5 h-5" size={20} />
                </button>
              </form>
            </div>
            
            {/* Right Side - Contact Information */}
            <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
              {/* Address Card */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 md:p-8 hover:shadow-lg transition-shadow duration-300 border-l-4 border-red-600">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-red-600 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                    <MapPin className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" size={24} />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-wide">ADDRESS</h3>
                </div>
                <a
                  href="https://www.google.com/maps/dir//Sahni+Complex,+2nd+Cross+Rd,+Auto+Nagar,+Vijayawada,+Andhra+Pradesh+520007/@16.4984631,80.675735,17z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3a35fad90b21e801:0x8433da71029209b3!2m2!1d80.675735!2d16.4984631?entry=ttu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base md:text-lg text-gray-700 hover:text-red-600 transition-colors leading-relaxed block"
                >
                  Sahni Complex, 2nd Cross Rd,<br />
                  Auto Nagar, Vijayawada,<br />
                  Andhra Pradesh 520007, India
                </a>
              </div>
              
              {/* Contact Card */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 md:p-8 hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-600">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-blue-600 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                    <Phone className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" size={24} />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-wide">CONTACT US</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <a
                    href="tel:+919281029456"
                    className="flex items-center text-sm sm:text-base md:text-lg text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Phone size={18} className="mr-2 sm:mr-3 text-gray-400 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                    +91 92810 29456
                  </a>
                  <a
                    href="mailto:info.sahniauto@gmail.com"
                    className="flex items-center text-sm sm:text-base md:text-lg text-gray-700 hover:text-blue-600 transition-colors break-all"
                  >
                    <Mail size={18} className="mr-2 sm:mr-3 text-gray-400 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                    info.sahniauto@gmail.com
                  </a>
                </div>
              </div>
              
              {/* Hours Card */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 md:p-8 hover:shadow-lg transition-shadow duration-300 border-l-4 border-red-600">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="bg-red-600 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                    <Calendar className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" size={24} />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-wide">BUSINESS HOURS</h3>
                </div>
                <div className="space-y-1 sm:space-y-2 text-sm sm:text-base md:text-lg text-gray-700">
                  <p className="font-semibold">Monday - Saturday</p>
                  <p className="text-gray-600">9:30 AM - 7:00 PM</p>
                  <p className="font-semibold mt-3 sm:mt-4">Sunday</p>
                  <p className="text-gray-600">Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}