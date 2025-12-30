import { useEffect, useMemo, useState } from 'react';
import { MapPin, Phone, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { showroomsAPI, normalizeImageUrl } from '../services/api';

interface Showroom {
  id: string;
  city: string;
  address: string;
  phone: string;
  sales_phone?: string;
  service_phone?: string;
  email: string;
  image?: string;
  images?: string[];
  isMain: boolean;
  category?: string;
  isBranch?: boolean;
  map_link?: string;
}

const STATIC_SHOWROOMS: Showroom[] = [
  {
    id: 'vijayawada',
    city: 'Vijayawada',
    address: 'Sahni Complex, 2nd Cross Rd, Auto Nagar, Vijayawada, Andhra Pradesh 520007',
    phone: '+91 92810 29456',
    email: 'info.sahniauto@gmail.com',
    image: normalizeImageUrl('https://tata-storagebucket.s3.ap-south-1.amazonaws.com/images/showrooms/vijayawada.png'),
    isMain: true,
  },
  {
    id: 'narasaraopet',
    city: 'Narasaraopet',
    address: 'Palnadu Road, Narasaraopet',
    phone: '+91 92810 29456',
    email: 'info.sahniauto@gmail.com',
    image: normalizeImageUrl('https://tata-storagebucket.s3.ap-south-1.amazonaws.com/images/showrooms/NARASARAOPET.png'),
    isMain: true,
  },
  {
    id: 'guntur',
    city: 'Guntur',
    address: 'NH 16, Guntur Main Road, Guntur District',
    phone: '+91 92810 29456',
    email: 'info.sahniauto@gmail.com',
    image: normalizeImageUrl('https://tata-storagebucket.s3.ap-south-1.amazonaws.com/images/showrooms/guntur.png'),
    isMain: true,
  },
  {
    id: 'kaikaluru',
    city: 'Kaikaluru',
    address: 'Main Road, Kaikaluru',
    phone: '+91 92810 29456',
    email: 'info.sahniauto@gmail.com',
    isMain: false,
  },
  {
    id: 'nuziveedu',
    city: 'Nuziveedu',
    address: 'Eluru Road, Nuziveedu',
    phone: '+91 92810 29456',
    email: 'info.sahniauto@gmail.com',
    isMain: false,
  },
  {
    id: 'nandiagama',
    city: 'Nandiagama',
    address: 'Krishna District, Nandiagama',
    phone: '+91 92810 29456',
    email: 'info.sahniauto@gmail.com',
    isMain: false,
  },
  {
    id: 'piduguralla',
    city: 'Piduguralla',
    address: 'Guntur District, Piduguralla',
    phone: '+91 92810 29456',
    email: 'info.sahniauto@gmail.com',
    isMain: false,
  },
];

const normalizeShowrooms = (items: any[]): Showroom[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    const id = String(item?.id || item?.detail_id || item?.showroom_id || item?.uuid || index);
    const city = item?.city || item?.name || item?.location || `Showroom ${index + 1}`;
    
    // Normalize image URLs - convert S3 to CloudFront if needed, or use normalizeImageUrl
    const imagePath = item?.image || item?.banner || item?.photo || '';
    let imageUrl = typeof imagePath === 'string' ? imagePath : '';
    
    // Convert S3 URLs to CloudFront using normalizeImageUrl
    if (imageUrl) {
      imageUrl = normalizeImageUrl(imageUrl);
    }

    // Images array - normalize each URL
    let images: string[] | undefined;
    if (item?.images && Array.isArray(item.images)) {
      images = item.images
        .filter((img: string) => typeof img === 'string' && img)
        .map((img: string) => normalizeImageUrl(img));
    }

    // Determine category - check multiple indicators for Massey Ferguson
    let category = (item?.category || '').toLowerCase().trim();
    const cityLower = city.toLowerCase();
    const addressLower = (item?.address || '').toLowerCase();
    const imagePathLower = (imagePath || '').toLowerCase();
    
    // Check if this is a Massey Ferguson showroom by name, address, image, or category
    // TAFE (Tractors and Farm Equipment Limited) manufactures Massey Ferguson tractors
    // Also explicitly check for Mylavaram
    const isMassey = 
      category === 'massey' || 
      category === 'massey ferguson' ||
      category.includes('massey') ||
      cityLower === 'mylavaram' ||
      cityLower.includes('massey') ||
      cityLower.includes('ferguson') ||
      cityLower.includes('tafe') ||
      addressLower.includes('massey') ||
      addressLower.includes('ferguson') ||
      addressLower.includes('tafe') ||
      addressLower.includes('mylavaram') ||
      imagePathLower.includes('tafe') ||
      (item?.brand && (item.brand.toLowerCase() === 'massey' || item.brand.toLowerCase() === 'massey ferguson' || item.brand.toLowerCase() === 'tafe'));

    // Set category based on detection
    if (isMassey) {
      category = 'massey';
    } else if (!category || category === '') {
      // Default to 'tata' only if not Massey and no category specified
      category = 'tata';
    }

    return {
      id,
      city,
      address: item?.address || 'Address coming soon',
      phone: item?.phone || '',
      sales_phone: item?.sales_phone || item?.phone || '',
      service_phone: item?.service_phone || item?.phone || '',
      email: item?.email || 'info.sahniauto@gmail.com',
      image: imageUrl,
      images: images,
      isMain: Boolean(item?.is_main ?? item?.isMain ?? item?.is_primary ?? false),
      category,
      isBranch: item?.is_branch || item?.isBranch || false,
      map_link: item?.map_link || undefined,
    };
  });
};

export default function Showrooms() {
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loading, setLoading] = useState(true);
  // Start with Tata slide (index 0) - first image displays first
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedMasseyShowroom, setSelectedMasseyShowroom] = useState<Showroom | null>(null);
  const [masseyGalleryIndex, setMasseyGalleryIndex] = useState(0);

  useEffect(() => {
    const loadShowrooms = async () => {
      setLoading(true);

      try {
        console.log('[Showrooms] Fetching showrooms from API...');
        // Backend returns array directly
        const response = await showroomsAPI.getAll();
        console.log('[Showrooms] API Response:', response);
        
        const backendShowrooms = Array.isArray(response) 
          ? response 
          : (response?.showrooms || response?.data || []);

        console.log(`[Showrooms] Processing ${backendShowrooms.length} showrooms`);
        const normalized = normalizeShowrooms(backendShowrooms);
        console.log(`[Showrooms] Normalized ${normalized.length} showrooms`);

        if (normalized.length === 0) {
          console.warn('[Showrooms] No showrooms returned from backend, using empty array');
          setShowrooms([]);
        } else {
          setShowrooms(normalized);
        }
      } catch (error: any) {
        console.error('[Showrooms] Failed to load showrooms from backend:', error);
        setShowrooms([]);
      } finally {
        setLoading(false);
      }
    };

    loadShowrooms();
  }, []);

  // Hero images - Use only the two specified images
  const heroImages = useMemo(() => {
    // Use only these two images: frooti.png first, then frooti2.png
    return [
      normalizeImageUrl('/images/showrooms/RAVI.png'),
      normalizeImageUrl('/images/showrooms/frooti2.png'),
    ];
  }, []);

  // Auto-scroll images - Start with Tata (index 0), then Massey (index 1)
  useEffect(() => {
    // Ensure we start with first slide
    setCurrentImageIndex(0);

    if (heroImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages]);


  // Filter showrooms by category - exclude Massey from Tata, and vice versa
  const tataShowrooms = useMemo(() => {
    const filtered = showrooms.filter(s => {
      const category = (s.category || 'tata').toLowerCase().trim();
      // Include all Tata showrooms (main and branches), exclude Massey
      return category === 'tata' && !category.includes('massey') && category !== 'massey ferguson';
    });
    console.log(`[Showrooms] Found ${filtered.length} Tata showrooms`);
    return filtered;
  }, [showrooms]);
  
  // Separate main showrooms from branches
  const mainTataShowrooms = useMemo(() => {
    const main = tataShowrooms.filter(s => !s.isBranch);
    console.log(`[Showrooms] Found ${main.length} main Tata showrooms`);
    return main;
  }, [tataShowrooms]);
  
  const branchShowrooms = useMemo(() => {
    const branches = tataShowrooms.filter(s => s.isBranch === true);
    console.log(`[Showrooms] Found ${branches.length} branch showrooms`);
    return branches;
  }, [tataShowrooms]);
  
  const masseyShowrooms = useMemo(() => {
    return showrooms.filter(s => {
      const category = (s.category || '').toLowerCase().trim();
      // Include if category is 'massey', contains 'massey', or is 'massey ferguson'
      // Also check city name for Mylavaram specifically
      const cityLower = (s.city || '').toLowerCase();
      return category === 'massey' || 
             category.includes('massey') || 
             category === 'massey ferguson' ||
             cityLower === 'mylavaram';
    });
  }, [showrooms]);

  return (
    <div className="bg-white pattern-diamond">
      {/* Header Section - Full Poster Hero */}
      <section className="relative w-full bg-white overflow-hidden pb-0 md:pb-8 lg:pb-12" style={{ zIndex: 1 }}>
        {/* Background Image Carousel */}
        <div className="relative w-full" style={{ marginBottom: 0 }}>
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'
              }`}
              style={{ 
                width: '100%',
                position: index === currentImageIndex ? 'relative' : 'absolute',
                top: 0,
                left: 0
              }}
            >
              <img
                src={normalizeImageUrl(image)}
                alt={`Showroom Background ${index + 1}`}
                className="w-full h-auto block"
                style={{ 
                  objectFit: 'contain',
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: 'none',
                  margin: 0,
                  padding: 0,
                  verticalAlign: 'bottom'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://d3bslevwxw022c.cloudfront.net/buytrucknbus-tatamotors-com/cv/cv_online/Blog/2023527663/8146.webp';
                }}
              />
            </div>
          ))}
          
          {/* Image Indicators Overlay */}
          <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 z-10 flex justify-center">
            <div className="flex gap-2 bg-black/30 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? 'w-6 sm:w-8 bg-white'
                      : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Showrooms */}
      <section id="tata-showrooms" className="pt-0 sm:pt-8 md:pt-12 pb-8 sm:pb-12 md:pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="py-8 sm:py-12">
              <LoadingSpinner message="Loading showrooms..." fullScreen={false} />
            </div>
          )}

          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="bg-white p-2 rounded-lg shadow-md border-2 border-gray-200">
                <img
                  src={normalizeImageUrl('/images/new-logo.png')}
                  alt="Tata Motors Logo"
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Tata Motors Showrooms</h2>
            </div>
            <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto px-2">
              Our strategically located showrooms provide complete sales, service, and spare parts support for Tata Motors Small Commercial Vehicles across Krishna & Guntur Districts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10 md:mb-12">
            {mainTataShowrooms.map((showroom, index) => (
              <div
                key={`${showroom.id || index}-main`}
                className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-gray-100"
              >
                {/* First Image */}
                <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-4 left-4 bg-red-600 px-4 py-2 rounded-lg z-10">
                    <span className="text-white font-bold text-sm uppercase">{showroom.city}</span>
                  </div>
                  {showroom.image ? (
                    <img
                      src={normalizeImageUrl(showroom.image)}
                      alt={showroom.city}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop';
                      }}
                    />
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop"
                      alt={showroom.city}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-blue-900/10"></div>
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <MapPin className="text-red-600 mr-2" size={24} />
                    {showroom.city}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start">
                      <MapPin size={20} className="text-gray-500 mr-3 mt-1 flex-shrink-0" />
                      <a
                        href={showroom.map_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showroom.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 text-sm hover:text-red-600 transition-colors"
                      >
                        {showroom.address}
                      </a>
                    </div>

                    {showroom.sales_phone && (
                      <div className="flex items-start">
                        <Phone size={20} className="text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <div>
                            <span className="text-gray-600 text-sm font-medium">Sales: </span>
                            <a
                              href={`tel:${showroom.sales_phone.replace(/\s/g, '')}`}
                              className="text-red-600 hover:underline font-semibold"
                            >
                              {showroom.sales_phone}
                            </a>
                          </div>
                          {showroom.service_phone && showroom.service_phone !== showroom.sales_phone && (
                            <div className="mt-1">
                              <span className="text-gray-600 text-sm font-medium">Service: </span>
                              <a
                                href={`tel:${showroom.service_phone.replace(/\s/g, '')}`}
                                className="text-red-600 hover:underline font-semibold"
                              >
                                {showroom.service_phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <Clock size={20} className="text-gray-500 mr-3 flex-shrink-0" />
                      <p className="text-gray-700 text-sm">Mon - Sat: 9:00 AM - 7:00 PM</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Services Available:</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Sales
                      </span>
                      <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Service
                      </span>
                      <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Spare Parts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Branches Section */}
          {branchShowrooms.length > 0 && (
            <div className="mt-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Our Branches</h3>
                <p className="text-gray-600">Additional service locations across Andhra Pradesh</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {branchShowrooms.map((showroom, index) => (
                  <div
                    key={`${showroom.id || index}-branch`}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 p-4"
                  >
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <MapPin className="text-red-600 mr-2" size={20} />
                      {showroom.city}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <MapPin size={16} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700">{showroom.address}</p>
                      </div>
                      {showroom.phone && (
                        <div className="flex items-center">
                          <Phone size={16} className="text-gray-500 mr-2 flex-shrink-0" />
                          <a
                            href={`tel:${showroom.phone.replace(/\s/g, '')}`}
                            className="text-red-600 hover:underline font-semibold"
                          >
                            {showroom.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Massey Ferguson Showrooms Section */}
      <section id="massey-showrooms" className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="bg-white p-2 rounded-lg shadow-md border-2 border-gray-200">
                <img
                  src={normalizeImageUrl('/images/TAFE_Logo.jpg')}
                  alt="Massey Ferguson Logo"
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Massey Ferguson Showrooms</h2>
            </div>
            <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto px-2">
              Visit our authorized Massey Ferguson tractor dealerships for sales, service, and genuine spare parts across Andhra Pradesh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {masseyShowrooms.map((showroom, index) => {
              const isBranch = showroom.isBranch === true || (showroom as any).is_branch === true;
              return (
                <div
                  key={`${showroom.id || index}-massey`}
                  className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-gray-100"
                  onClick={() => {
                    if (!isBranch && showroom.images && showroom.images.length > 0) {
                      setSelectedMasseyShowroom(showroom);
                      setMasseyGalleryIndex(0);
                    }
                  }}
                >
                  {/* Image only for main Massey showroom; branches show info only */}
                  {!isBranch && showroom.image && (
                    <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-4 left-4 bg-green-600 px-4 py-2 rounded-lg z-10">
                        <span className="text-white font-bold text-sm uppercase">{showroom.city}</span>
                      </div>
                      {showroom.image ? (
                        <img
                          src={normalizeImageUrl(showroom.image)}
                          alt={showroom.city}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop';
                          }}
                        />
                      ) : (
                        <img
                          src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop"
                          alt={showroom.city}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-green-900/10"></div>
                      {showroom.images && showroom.images.length > 0 && (
                        <div className="absolute bottom-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Click to view {showroom.images.length} photos
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <MapPin className="text-green-600 mr-2" size={24} />
                      {showroom.city}
                      {isBranch && (
                        <span className="ml-2 text-xs font-semibold text-green-700 uppercase bg-green-50 px-2 py-1 rounded-full">
                          Branch
                        </span>
                      )}
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start">
                        <MapPin size={20} className="text-gray-500 mr-3 mt-1 flex-shrink-0" />
                        <a
                          href={showroom.map_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showroom.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-700 text-sm hover:text-green-600 transition-colors"
                        >
                          {showroom.address}
                        </a>
                      </div>

                      <div className="flex items-center">
                        <Phone size={20} className="text-gray-500 mr-3 flex-shrink-0" />
                        <a
                          href={`tel:${showroom.phone.replace(/\s/g, '')}`}
                          className="text-green-600 hover:underline font-semibold"
                        >
                          {showroom.phone}
                        </a>
                      </div>

                      <div className="flex items-center">
                        <Clock size={20} className="text-gray-500 mr-3 flex-shrink-0" />
                        <p className="text-gray-700 text-sm">Mon - Sat: 9:00 AM - 7:00 PM</p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Services Available:</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Sales
                        </span>
                        <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Service
                        </span>
                        <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Spare Parts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Visit Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Visit Our Showrooms?</h2>
              <div className="w-24 h-1 bg-red-600 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center border-2 border-blue-100">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Strategic Locations</h3>
              <p className="text-gray-700">
                Conveniently located across major cities for easy access and quick service
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-xl text-center border-2 border-blue-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone size={32} className="text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">Expert Team</h3>
              <p className="text-gray-700">
                Knowledgeable staff to help you choose the right vehicle and provide after-sales support
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-xl text-center border-2 border-blue-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-blue-900" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">Extended Hours</h3>
              <p className="text-gray-700">
                Flexible timings to accommodate your busy schedule with weekend availability
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 bg-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Visit Us Today</h2>
          <p className="text-xl mb-8">
            Experience the Sahni Group difference at any of our locations. Our team is ready to assist you with sales, service, and genuine spare parts.
          </p>
          <a
            href="tel:+919281029456"
            className="inline-block bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors"
          >
            Call Us: +91 92810 29456
          </a>
        </div>
      </section>

      {/* Massey Ferguson Image Gallery Modal */}
      {selectedMasseyShowroom && selectedMasseyShowroom.images && selectedMasseyShowroom.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMasseyShowroom(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedMasseyShowroom(null)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Close gallery"
            >
              <X size={24} className="text-gray-800" />
            </button>

            {/* Showroom Info Header */}
            <div className="bg-green-600 text-white p-4">
              <h3 className="text-2xl font-bold">{selectedMasseyShowroom.city}</h3>
              <p className="text-sm text-green-100 mt-1">{selectedMasseyShowroom.address}</p>
            </div>

            {/* Image Gallery */}
            <div className="relative bg-black">
              <div className="flex items-center justify-center min-h-[400px] max-h-[70vh]">
                {selectedMasseyShowroom.images.map((image, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                      idx === masseyGalleryIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={normalizeImageUrl(image)}
                      alt={`${selectedMasseyShowroom.city} - Image ${idx + 1}`}
                      className="max-w-full max-h-[70vh] object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop';
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              {selectedMasseyShowroom.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMasseyGalleryIndex((prev) => 
                        prev === 0 ? selectedMasseyShowroom.images!.length - 1 : prev - 1
                      );
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} className="text-gray-800" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMasseyGalleryIndex((prev) => 
                        prev === selectedMasseyShowroom.images!.length - 1 ? 0 : prev + 1
                      );
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} className="text-gray-800" />
                  </button>
                </>
              )}

              {/* Image Indicators */}
              {selectedMasseyShowroom.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                  {selectedMasseyShowroom.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMasseyGalleryIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === masseyGalleryIndex
                          ? 'w-8 bg-white'
                          : 'w-2 bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Image Counter */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                {masseyGalleryIndex + 1} / {selectedMasseyShowroom.images.length}
              </div>
            </div>

            {/* Contact Info Footer */}
            <div className="bg-gray-50 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Phone size={20} className="text-green-600" />
                <a
                  href={`tel:${selectedMasseyShowroom.phone.replace(/\s/g, '')}`}
                  className="text-green-600 hover:underline font-semibold"
                >
                  {selectedMasseyShowroom.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-gray-600" />
                <p className="text-gray-700 text-sm">Mon - Sat: 9:00 AM - 7:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
