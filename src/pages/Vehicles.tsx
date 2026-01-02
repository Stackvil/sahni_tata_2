import { useState, useEffect, useRef, useMemo } from 'react';
import { Heart, Calendar, MapPin, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { loadVehicles, getCategories, Vehicle } from '../data/tataVehicles';
import { normalizeImageUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface VehiclesProps {
  setCurrentPage?: (page: string) => void;
  setSelectedVehicleId?: (id: number) => void;
}

// Helper function to format image paths - now uses normalizeImageUrl from API service
const encodeImagePath = (path: string | any): string => {
  // Handle case where path might be an object
  if (!path) return '';
  
  if (typeof path === 'string') {
    return normalizeImageUrl(path);
  }
  
  // If path is an object, try to extract string from common properties
  if (typeof path === 'object' && path !== null) {
    const imageStr = path.image || path.url || path.path || path.src || '';
    if (typeof imageStr === 'string' && imageStr.trim() !== '') {
      return normalizeImageUrl(imageStr);
    }
  }
  
  console.warn('[encodeImagePath] Invalid image path type:', typeof path, path);
  return '';
};

// Helper to safely get brand from sessionStorage
const getSavedBrand = (): 'tata' | 'massey' | null => {
  try {
    const saved = sessionStorage.getItem('sahni_selectedBrand');
    if (saved === 'tata' || saved === 'massey') {
      return saved;
    }
  } catch (e) {
    // ignore sessionStorage errors
  }
  return null;
};

// Helper to safely save brand to sessionStorage
const saveBrand = (brand: 'tata' | 'massey' | null) => {
  try {
    if (brand) {
      sessionStorage.setItem('sahni_selectedBrand', brand);
    } else {
      sessionStorage.removeItem('sahni_selectedBrand');
    }
  } catch (e) {
    // ignore storage errors
  }
};

export default function Vehicles({ setCurrentPage, setSelectedVehicleId }: VehiclesProps) {
  // Initialize brand from sessionStorage - default to 'tata' if no saved preference
  const [selectedBrand, setSelectedBrand] = useState<'tata' | 'massey' | null>(() => {
    const saved = getSavedBrand();
    // Use saved brand if exists, otherwise show brand selection page
    return saved || null;
  });
  const [selectedFilter, setSelectedFilter] = useState<'popular' | 'large' | 'small' | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [brandImageErrors, setBrandImageErrors] = useState<{ tata: boolean; massey: boolean }>({ tata: false, massey: false });
  const scrollRevealRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [searchParams, setSearchParams] = useState({
    pickUpDate: '',
    droppingDate: '',
    pickUpLocation: '',
    droppingLocation: '',
  });
  const vehiclesSectionRef = useRef<HTMLDivElement>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load vehicles and categories on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      // Explicitly set initial filter states to 'all' at the start
      setSelectedCategory('all');
      setSelectedFilter('all');
      // Default to 'tata' if no brand is selected
        const savedBrand = getSavedBrand();
        if (savedBrand && !selectedBrand) {
          setSelectedBrand(savedBrand);
        }
        // Don't auto-select - let brand selection page show if no brand is selected
      try {
        // Load vehicles and categories in parallel with timeout
        const loadPromise = Promise.all([
          loadVehicles(),
          getCategories(),
        ]);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timeout - please refresh the page')), 30000)
        );
        
        const result = await Promise.race([
          loadPromise,
          timeoutPromise
        ]);
        
        const [loadedVehicles, loadedCategories] = result as [Vehicle[], string[]];
        
        console.log('[Vehicles Page] Loaded vehicles:', {
          count: loadedVehicles.length,
          sample: loadedVehicles.slice(0, 3).map(v => ({
            name: v.name,
            images: v.images,
            imageCount: v.images?.length || 0
          }))
        });
        
        // Filter vehicles immediately - only keep Tata vehicles for vehicles page
        // Backend structure: Tata vehicles have category: 'ev', 'ace', 'intra', 'yodha'
        // Massey vehicles have category: 'massey'
        const tataVehiclesOnly = loadedVehicles.filter(v => {
          const cat = (v.category || '').toLowerCase().trim();
          const name = (v.name || '').toLowerCase().trim();
          
          // Exclude Massey vehicles - check category and name
          if (cat === 'massey' || cat.includes('massey') || 
              name.includes('massey') || name.includes('ferguson') ||
              name.includes('mf ') || name.includes('mf-') ||
              name.includes('241 di') || name.includes('1035')) {
            return false;
          }
          
          // Only include valid Tata categories
          const validTataCategories = ['ev', 'ace', 'intra', 'yodha'];
          return validTataCategories.includes(cat);
        });
        
        console.log('[Vehicles] Filtered vehicles on load:', {
          total: loadedVehicles.length,
          tataOnly: tataVehiclesOnly.length,
          removed: loadedVehicles.length - tataVehiclesOnly.length,
          removedNames: loadedVehicles
            .filter(v => !tataVehiclesOnly.includes(v))
            .map(v => v.name)
        });
        
        setVehicles(tataVehiclesOnly);
        
        // Filter out massey category from the list - only show Tata categories
        // Tata categories: ev, ace, intra, yodha
        // Massey category: massey (should be excluded)
        const filteredCategories = loadedCategories.filter(cat => {
          if (!cat || typeof cat !== 'string') return false;
          const catLower = cat.toLowerCase().trim();
          // Only include valid Tata categories
          const validTataCategories = ['ev', 'ace', 'intra', 'yodha'];
          return validTataCategories.includes(catLower) && 
                 catLower !== 'massey' && 
                 catLower !== 'massey ferguson' &&
                 !catLower.includes('massey');
        });
        setCategories(filteredCategories);
        
        // Ensure states are still set correctly after loading (safety check)
        // These should already be set at the start of loadData, but we ensure they're correct here too
        if (selectedCategory === 'massey' || (typeof selectedCategory === 'string' && selectedCategory.toLowerCase().includes('massey'))) {
          setSelectedCategory('all');
        }
        // Don't auto-select brand - show brand selection if no brand is selected
        // Only update if there's a saved brand preference
        const savedBrand = getSavedBrand();
        if (savedBrand && !selectedBrand) {
          setSelectedBrand(savedBrand);
        }
      } catch (err) {
        console.error('[Vehicles Page] Error loading vehicles:', err);
        setError('Failed to load vehicles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Restore brand selection on mount - this ensures brand is restored when navigating back
  useEffect(() => {
    // Check current URL hash - if it's massey-products, don't restore brand here
    const currentHash = window.location.hash.slice(1);
    if (currentHash === 'massey-products') {
      // Don't interfere with massey-products navigation
      return;
    }
    
    // Only restore saved brand preference if it exists
    // If no saved preference, show brand selection (don't auto-select)
    const savedBrand = getSavedBrand();
    if (savedBrand && !selectedBrand) {
      setSelectedBrand(savedBrand);
    }
    // If no saved brand and no selected brand, brand selection UI will show automatically
  }, []); // Only run on mount

  // Reset selected category if it's massey (after categories are loaded)
  useEffect(() => {
    if (selectedCategory === 'massey') {
      setSelectedCategory('all');
    }
  }, [categories]); // Run when categories change

  const toggleFavorite = (vehicleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(vehicleId)) {
        newFavorites.delete(vehicleId);
      } else {
        newFavorites.add(vehicleId);
      }
      return newFavorites;
    });
  };

  // Extract price values for display
  const getPriceDisplay = (priceString?: string) => {
    if (!priceString) return { total: '', monthly: '' };
    const match = priceString.match(/₹([\d.]+)\s*Lakh/);
    if (match) {
      const lakhs = parseFloat(match[1]);
      const total = `₹${(lakhs * 100000).toLocaleString('en-IN')}`;
      const monthly = `₹${Math.round((lakhs * 100000) / 60).toLocaleString('en-IN')}/month`;
      return { total, monthly };
    }
    return { total: priceString, monthly: '' };
  };


  // Filter vehicles based on selected brand, category and filter
  // Use useMemo to ensure filtering happens correctly and efficiently
  const filteredVehicles = useMemo(() => {
    // If no vehicles loaded yet, return empty array
    if (!vehicles || vehicles.length === 0) {
      console.log('[Vehicles] No vehicles to filter');
      return [];
    }
    
    // Filter by brand - if no brand selected, return empty array (brand selection page will show)
    if (!selectedBrand) {
      return [];
    }
    const brand = selectedBrand;
    // Ensure category and filter default to 'all' if not set
    const category = (selectedCategory && selectedCategory.trim() !== '') ? selectedCategory.trim() : 'all';
    const filter = (selectedFilter && selectedFilter.trim() !== '') ? selectedFilter.trim() : 'all';
    
    console.log(`[Vehicles] Filtering vehicles - Brand: ${brand}, Category: ${category}, Filter: ${filter}, Total vehicles: ${vehicles.length}`);
    
    let filtered = vehicles.filter(vehicle => {
      // Normalize category and name for comparison
      const vehicleCategory = (vehicle.category || '').toLowerCase().trim();
      const vehicleName = (vehicle.name || '').toLowerCase().trim();
      
      // Enhanced Massey detection - check multiple indicators
      const isMassey = 
        vehicleCategory === 'massey' || 
        vehicleCategory.includes('massey') ||
        vehicleName.includes('massey ferguson') ||
        vehicleName.includes('massey') ||
        vehicleName.includes('mf ') ||
        vehicleName.includes('mf-') ||
        vehicleName.includes('mf1035') ||
        vehicleName.includes('mf 1035') ||
        vehicleName.includes('mf241') ||
        vehicleName.includes('mf 241') ||
        vehicleName.includes('mf245') ||
        vehicleName.includes('mf 245') ||
        vehicleName.includes('mf30') ||
        vehicleName.includes('mf 30') ||
        vehicleName.includes('mf5245') ||
        vehicleName.includes('mf 5245') ||
        vehicleName.includes('mf6026') ||
        vehicleName.includes('mf 6026') ||
        vehicleName.includes('mf6036') ||
        vehicleName.includes('mf 6036') ||
        vehicleName.includes('mf7250') ||
        vehicleName.includes('mf 7250') ||
        vehicleName.includes('mf244') ||
        vehicleName.includes('mf 244') ||
        vehicleName.includes('241 di') ||
        vehicleName.includes('1035') ||
        vehicleName.includes('ferguson');
      
      if (brand === 'tata') {
        // Show only Tata vehicles (exclude Massey)
        // According to API: Tata categories are: ev, ace, intra, yodha
        // Massey category is: massey
        if (isMassey) {
          return false; // Filter out Massey vehicles
        }
        
        // Also ensure we only show valid Tata categories: ev, ace, intra, yodha
        const validTataCategories = ['ev', 'ace', 'intra', 'yodha'];
        if (!validTataCategories.includes(vehicleCategory)) {
          return false; // Filter out invalid categories
        }
      } else if (brand === 'massey') {
        // Show only Massey vehicles - category should be 'massey'
        if (!isMassey) {
          return false;
        }
      } else {
        // No brand selected - show brand selection UI (handled separately)
        return false;
      }
      
      // Filter by category (case-insensitive) - only if not 'all'
      if (category !== 'all' && category.trim() !== '') {
        const selectedCatLower = category.toLowerCase().trim();
        if (vehicleCategory !== selectedCatLower) {
          return false;
        }
      }
      
      // Filter by size/popularity - only if not 'all'
      if (filter === 'popular') {
        return vehicle.popular === true;
      }
      if (filter === 'large') {
        return vehicle.size === 'large';
      }
      if (filter === 'small') {
        return vehicle.size === 'small';
      }
      
      // For 'all' or any other filter, show all vehicles
      return true;
    });
    
    // Sort vehicles - Bring "Yodha 2.0" to top when Yodha category is selected
    if (category.toLowerCase() === 'yodha') {
      filtered.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        
        // Check if vehicle name contains "yodha 2.0" (case-insensitive)
        const aIsYodha20 = aName.includes('yodha 2.0');
        const bIsYodha20 = bName.includes('yodha 2.0');
        
        // If one is Yodha 2.0 and the other isn't, prioritize Yodha 2.0
        if (aIsYodha20 && !bIsYodha20) return -1;
        if (!aIsYodha20 && bIsYodha20) return 1;
        
        // If both or neither are Yodha 2.0, maintain original order
        return 0;
      });
    }
    
    // Sort Intra vehicles: V10, V20, V30, V50, V70 in order (always, regardless of category filter)
    // This ensures Intra vehicles display in correct order even when viewing "all" vehicles
    const intraOrder = ['v10', 'v20', 'v30', 'v50', 'v70'];
    
    // Helper function to check if vehicle is Intra
    const isIntraVehicle = (vehicle: Vehicle): boolean => {
      const vehicleCategory = (vehicle.category || '').toLowerCase().trim();
      const vehicleName = (vehicle.name || '').toLowerCase();
      return vehicleCategory === 'intra' || vehicleName.includes('intra');
    };
    
    // Helper function to get Intra vehicle order index
    const getIntraOrderIndex = (vehicle: Vehicle): number => {
      if (!isIntraVehicle(vehicle)) {
        return -1; // Not an Intra vehicle
      }
      
      const vehicleName = (vehicle.name || '').toLowerCase();
      // Extract the model number from vehicle name (e.g., "intra v10" -> "v10")
      for (let i = 0; i < intraOrder.length; i++) {
        if (vehicleName.includes(intraOrder[i])) {
          return i;
        }
      }
      // If Intra but not in our ordered list, put it at the end of Intra vehicles
      return intraOrder.length;
    };
    
    // Sort all vehicles, ensuring Intra vehicles are in order when they appear together
    filtered.sort((a, b) => {
      const aIsIntra = isIntraVehicle(a);
      const bIsIntra = isIntraVehicle(b);
      
      // If both are Intra vehicles, sort by their order (V10, V20, V30, V50, V70)
      if (aIsIntra && bIsIntra) {
        const aIndex = getIntraOrderIndex(a);
        const bIndex = getIntraOrderIndex(b);
        return aIndex - bIndex;
      }
      
      // If only one is Intra, maintain relative positions (stable sort)
      // This ensures Intra vehicles keep their position relative to other categories
      // but are sorted correctly among themselves
      return 0;
    });
    
    console.log(`[Vehicles] Filtered result: ${filtered.length} vehicles out of ${vehicles.length}`);
    return filtered;
  }, [vehicles, selectedBrand, selectedCategory, selectedFilter]);

  // Set up intersection observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    scrollRevealRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      scrollRevealRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [filteredVehicles.length]); // Re-run when vehicles change

  // Debug: Log to console (remove in production)
  useEffect(() => {
    console.log('[Vehicles] State:', {
      totalVehicles: vehicles.length,
      filteredVehicles: filteredVehicles.length,
      selectedBrand: selectedBrand,
      selectedCategory: selectedCategory,
      selectedFilter: selectedFilter,
      sampleFiltered: filteredVehicles.slice(0, 3).map(v => ({
        name: v.name,
        category: v.category
      }))
    });
    
    // Log any Massey vehicles that shouldn't be showing
    if (selectedBrand === 'tata') {
      const masseyInFiltered = filteredVehicles.filter(v => {
        const name = (v.name || '').toLowerCase();
        const cat = (v.category || '').toLowerCase();
        return cat.includes('massey') || name.includes('massey') || name.includes('ferguson');
      });
      if (masseyInFiltered.length > 0) {
        console.error('[Vehicles] ERROR: Massey vehicles found in filtered list:', masseyInFiltered.map(v => v.name));
      }
    }
  }, [vehicles.length, filteredVehicles.length, selectedBrand, selectedCategory, selectedFilter, filteredVehicles]);


  const handleVehicleClick = (vehicleId: number) => {
    // Ensure brand is saved before navigating to detail
    if (selectedBrand) {
      saveBrand(selectedBrand);
    }
    // setSelectedVehicleId already handles navigation via React Router
    if (setSelectedVehicleId) {
      setSelectedVehicleId(vehicleId);
    }
    // Don't call setCurrentPage - it causes wrong navigation
  };

  const handleBookingNow = () => {
    // Navigate to contact page or show booking form
    if (setCurrentPage) {
      setCurrentPage('contact');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSeeAllTrucks = () => {
    // Scroll to vehicles section or show all vehicles
    setSelectedFilter('all');
    if (vehiclesSectionRef.current) {
      vehiclesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSearchTruck = () => {
    // Filter vehicles based on search criteria
    // For now, just scroll to vehicles section
    if (vehiclesSectionRef.current) {
      vehiclesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // You can add more complex filtering logic here based on searchParams
  };

  // Handle brand selection
  const handleBrandSelect = (brand: 'tata' | 'massey') => {
    setSelectedBrand(brand);
    saveBrand(brand);
    if (brand === 'massey') {
      // Navigate to Massey Ferguson products page
      if (setCurrentPage) {
        console.log('[Vehicles] Navigating to massey-products page');
        setCurrentPage('massey-products');
        // Ensure URL hash is updated
        window.location.hash = '#massey-products';
      }
    } else {
      // Show Tata vehicles
      if (vehiclesSectionRef.current) {
        vehiclesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Show brand selection page if no brand is selected
  if (!selectedBrand) {
    return (
      <div className="bg-white min-h-screen">
        {/* Brand Selection Section */}
        <section className="relative bg-gradient-to-br from-gray-50 to-white py-10 sm:py-12 md:py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Select Your <span className="text-red-600">Vehicle Brand</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Choose from our authorized vehicle dealerships
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
              {/* Tata Brand Card */}
              <button
                onClick={() => {
                  setSelectedBrand('tata');
                  saveBrand('tata');
                }}
                className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-200 hover:border-red-600"
              >
                <div className="relative h-64 bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mb-4">
                      {!brandImageErrors.tata ? (
                        <img
                          src={normalizeImageUrl('/images/new-logo.png')}
                          alt="Tata Motors"
                          className="h-32 w-auto mx-auto object-contain"
                          onError={() => {
                            setBrandImageErrors(prev => ({ ...prev, tata: true }));
                          }}
                        />
                      ) : (
                        <div className="text-5xl font-bold text-blue-600">TATA</div>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                      Tata Motors
                    </h2>
                    <p className="text-gray-600 mt-2">Commercial Vehicles & Trucks</p>
                  </div>
                </div>
                <div className="p-6 bg-gray-50">
                  <div className="flex items-center justify-center text-red-600 font-semibold group-hover:text-red-700">
                    <span>View Vehicles</span>
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Massey Ferguson Brand Card */}
              <button
                onClick={() => {
                  setSelectedBrand('massey');
                  saveBrand('massey');
                  // Navigate to Massey Products page
                  if (setCurrentPage) {
                    setCurrentPage('massey-products');
                    window.location.hash = '#massey-products';
                  }
                }}
                className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-200 hover:border-red-600"
              >
                <div className="relative h-64 bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mb-4">
                      {!brandImageErrors.massey ? (
                        <img
                          src={normalizeImageUrl('/images/TAFE_Logo.jpg')}
                          alt="Massey Ferguson"
                          className="h-32 w-auto mx-auto object-contain"
                          onError={() => {
                            setBrandImageErrors(prev => ({ ...prev, massey: true }));
                          }}
                        />
                      ) : (
                        <div className="text-3xl font-bold text-green-600">MF</div>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                      Massey Ferguson
                    </h2>
                    <p className="text-gray-600 mt-2">Tractors & Agricultural Equipment</p>
                  </div>
                </div>
                <div className="p-6 bg-gray-50">
                  <div className="flex items-center justify-center text-red-600 font-semibold group-hover:text-red-700">
                    <span>View Products</span>
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show vehicles page when brand is selected
  return (
    <div className="bg-white">
      
      <Helmet>
        <title>Tata Commercial Vehicles | Sahni Auto Group - Vijayawada</title>
        <meta name="description" content="Explore Tata commercial vehicles at Sahni Auto Group. Ace, Yodha, trucks, buses, and more. Authorized Tata Motors dealer in Vijayawada, Andhra Pradesh & Telangana." />
        <meta name="keywords" content="Tata vehicles, Tata Ace, Tata Yodha, commercial vehicles, Tata Motors dealer, Vijayawada, Andhra Pradesh, Sahni Auto Group" />
        <meta property="og:title" content="Tata Commercial Vehicles | Sahni Auto Group" />
        <meta property="og:description" content="Explore Tata commercial vehicles at Sahni Auto Group. Authorized dealer in Vijayawada." />
        <meta property="og:url" content={window.location.href} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      {/* Brand Header with Back to Brand Selection */}
      <section className="bg-gray-900 text-white py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => {
              saveBrand(null);
              setSelectedBrand(null);
            }}
            className="flex items-center text-white hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Brand Selection
          </button>
          <div className="flex items-center gap-2">
            <img src={normalizeImageUrl('/images/new-logo.png')} alt="Tata" className="h-6 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-sm font-semibold">Tata Motors Vehicles</span>
          </div>
        </div>
      </section>

      {/* Hero Section - Find a Truck */}
      <section className="relative bg-stone-50 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <div className="py-2 sm:py-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-5">
                Find a <span className="text-red-600">Truck</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                // Allow us to guide you through the innovative stress free approach in finding your dream truck.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
                <button 
                  onClick={handleBookingNow}
                  className="bg-red-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
                >
                  Book Now
                </button>
                <button 
                  onClick={handleSeeAllTrucks}
                  className="bg-white text-red-600 px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-bold text-base sm:text-lg border-2 border-red-600 hover:bg-red-50 transition-colors w-full sm:w-auto"
                >
                  See All Trucks
                </button>
              </div>

              {/* Search Form */}
              <div className="bg-gray-50 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl border-2 border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Pick Up Date</label>
                    <div className="flex items-center bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 min-h-[44px]">
                      <Calendar size={18} className="sm:w-5 sm:h-5 text-gray-500 mr-2 flex-shrink-0" />
                      <input 
                        type="date" 
                        className="w-full outline-none text-gray-700 text-sm sm:text-base" 
                        value={searchParams.pickUpDate}
                        onChange={(e) => setSearchParams({...searchParams, pickUpDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Dropping Date</label>
                    <div className="flex items-center bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 min-h-[44px]">
                      <Calendar size={18} className="sm:w-5 sm:h-5 text-gray-500 mr-2 flex-shrink-0" />
                      <input 
                        type="date" 
                        className="w-full outline-none text-gray-700 text-sm sm:text-base" 
                        value={searchParams.droppingDate}
                        onChange={(e) => setSearchParams({...searchParams, droppingDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Pick Up Location</label>
                    <div className="flex items-center bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 min-h-[44px]">
                      <MapPin size={18} className="sm:w-5 sm:h-5 text-gray-500 mr-2 flex-shrink-0" />
                      <select 
                        className="w-full outline-none text-gray-700 bg-transparent text-sm sm:text-base"
                        value={searchParams.pickUpLocation}
                        onChange={(e) => setSearchParams({...searchParams, pickUpLocation: e.target.value})}
                      >
                        <option value="">Select Location</option>
                        <option>Vijayawada</option>
                        <option>Hyderabad</option>
                        <option>Bangalore</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Dropping Location</label>
                    <div className="flex items-center bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 min-h-[44px]">
                      <MapPin size={18} className="sm:w-5 sm:h-5 text-gray-500 mr-2 flex-shrink-0" />
                      <select 
                        className="w-full outline-none text-gray-700 bg-transparent text-sm sm:text-base"
                        value={searchParams.droppingLocation}
                        onChange={(e) => setSearchParams({...searchParams, droppingLocation: e.target.value})}
                      >
                        <option value="">Select Location</option>
                        <option>Vijayawada</option>
                        <option>Hyderabad</option>
                        <option>Bangalore</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSearchTruck}
                  className="w-full bg-white text-red-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-base sm:text-lg border-2 border-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
                >
                  Search a Truck
                </button>
              </div>
            </div>

            {/* Right Side - Truck Video */}
            <div className="relative p-0 m-0">
              <div className="relative w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] overflow-hidden">
                <video
                  src="/videos/videoplayback.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Collection Trucks Section */}
      <section ref={vehiclesSectionRef} className="py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Our collection trucks</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 px-2">
              // Allow us to guide you through the innovative stress free approach in finding your dream truck.
            </p>

            {/* Category Filter Tabs */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">Filter by Category</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base min-h-[44px] ${
                    selectedCategory === 'all'
                      ? 'bg-red-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  All Vehicles
                </button>
                {categories
                  .filter((cat) => {
                    // Filter out massey category and ensure only valid Tata categories
                    const catLower = (cat || '').toLowerCase();
                    return catLower !== 'massey' && 
                           !catLower.includes('massey') &&
                           ['ev', 'ace', 'intra', 'yodha'].includes(catLower);
                  })
                  .map((cat) => {
                    // Format category name for display
                    const catStr = typeof cat === 'string' ? cat : String(cat);
                    const formattedName = catStr.toUpperCase(); // EV, ACE, INTRA, YODHA
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(catStr)}
                        className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base min-h-[44px] ${
                          selectedCategory.toLowerCase() === catStr.toLowerCase()
                            ? 'bg-red-600 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                        }`}
                      >
                        {formattedName}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
              <button
                onClick={() => setSelectedFilter('popular')}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base min-h-[44px] ${
                  selectedFilter === 'popular'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setSelectedFilter('large')}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base min-h-[44px] ${
                  selectedFilter === 'large'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                Large Truck
              </button>
              <button
                onClick={() => setSelectedFilter('small')}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base min-h-[44px] ${
                  selectedFilter === 'small'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                Small Truck
              </button>
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base min-h-[44px] ${
                  selectedFilter === 'all'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <LoadingSpinner message="Thank you for visiting us. Please wait..." fullScreen={false} />
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-base sm:text-lg md:text-xl text-red-600 mb-4 px-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm sm:text-base min-h-[44px]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Vehicle Cards Grid */}
          {!loading && !error && (!vehicles || vehicles.length === 0) ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">No vehicles available</p>
              <p className="text-sm text-gray-500 mb-4">Please check back later.</p>
            </div>
          ) : !loading && !error && filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">No vehicles found matching your filters.</p>
              <p className="text-sm text-gray-500 mb-4">Total vehicles: {vehicles.length}</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedFilter('all');
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Show All Vehicles
              </button>
            </div>
          ) : !loading && !error ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 items-stretch">
              {filteredVehicles.map((vehicle: Vehicle, index: number) => {
                try {
                  const priceDisplay = getPriceDisplay(vehicle.price);
                  const isFavorite = favorites.has(vehicle.id);
                  // Ensure imagePath is a string - images should already be strings from transform
                  let imagePath: string = '';
                  if (vehicle.images && vehicle.images.length > 0) {
                    const firstImage = vehicle.images[0];
                    // Images should already be strings after transformation
                    if (typeof firstImage === 'string') {
                      imagePath = firstImage;
                    } else if (firstImage && typeof firstImage === 'object') {
                      // Fallback: try to extract string from object
                      const extracted = firstImage.image || firstImage.url || firstImage.path || firstImage.src || '';
                      if (typeof extracted === 'string' && extracted.trim() !== '') {
                        imagePath = extracted;
                      } else {
                        console.warn(`[Vehicles] Could not extract valid image path from object for ${vehicle.name}:`, firstImage);
                        imagePath = '';
                      }
                    } else {
                      console.warn(`[Vehicles] Image is not a string or object for ${vehicle.name}:`, typeof firstImage, firstImage);
                      imagePath = '';
                    }
                  }
                  
                  // Ensure imagePath is always a string before encoding
                  if (typeof imagePath !== 'string') {
                    console.error(`[Vehicles] imagePath is not a string for ${vehicle.name}:`, typeof imagePath, imagePath);
                    imagePath = '';
                  }
                  
                  // encodeImagePath now handles both strings and objects safely, but we ensure it's a string
                  const encodedPath = imagePath ? encodeImagePath(imagePath) : '';
                  
                  return (
                    <div
                      key={`vehicle-${vehicle.id}-${index}`}
                      ref={(el) => {
                        if (scrollRevealRefs.current) {
                          scrollRevealRefs.current[index] = el;
                        }
                      }}
                      className="scroll-reveal"
                    >
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 card-hover flex flex-col h-full">
                    {/* Vehicle Image */}
                    <div className="relative h-80 bg-gray-100 overflow-hidden group flex-shrink-0">
                      {encodedPath && !imageErrors.has(vehicle.id) ? (
                        <img
                          key={`img-${vehicle.id}-${imagePath}`}
                          src={encodedPath}
                          alt={vehicle.name}
                          className="w-full h-full object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          decoding="async"
                          fetchPriority={index < 6 ? "high" : "low"}
                          onError={(e) => {
                            // Debug: Log the failed path
                            const target = e.target as HTMLImageElement;
                            console.error(`[Vehicles] Image failed to load for ${vehicle.name}:`, {
                              vehicleId: vehicle.id,
                              vehicleName: vehicle.name,
                              imagePath: imagePath,
                              encodedPath: encodedPath,
                              imageSrc: target.src,
                              firstImage: vehicle.images?.[0],
                              imageType: typeof vehicle.images?.[0],
                              allImages: vehicle.images
                            });
                            // Mark this image as failed using React state
                            setImageErrors(prev => new Set(prev).add(vehicle.id));
                            // Use SVG data URI as placeholder instead of external service
                            if (target.src && !target.src.startsWith('data:image/svg+xml')) {
                              const vehicleName = vehicle.name.substring(0, 20);
                              const svgPlaceholder = `data:image/svg+xml,${encodeURIComponent(`<svg width="400" height="320" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="320" fill="#DC2626"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${vehicleName}</text>
</svg>`)}`;
                              target.src = svgPlaceholder;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                          <div className="text-center text-xs p-2">
                            <div>{encodedPath ? 'Image not found' : 'No Image Available'}</div>
                            {encodedPath && (
                              <div className="text-xs mt-1 text-gray-400">{vehicle.name}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Heart Icon (Favorite) */}
                      <button
                        onClick={(e) => toggleFavorite(vehicle.id, e)}
                        className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                      >
                        <Heart 
                          size={20} 
                          className={isFavorite ? 'text-red-600 fill-red-600' : 'text-gray-600'} 
                        />
                      </button>
                    </div>

                    {/* Vehicle Details */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 min-h-[3.5rem] flex items-center">{vehicle.name}</h3>
                      
                      {/* Price */}
                      {priceDisplay.total && (
                        <div className="mb-3">
                          <div className="text-2xl font-bold text-gray-900">{priceDisplay.total}</div>
                        </div>
                      )}

                      {/* Seating */}
                      {vehicle.specs.seating && (
                        <div className="flex items-center text-gray-600 mb-4">
                          <Users size={18} className="mr-2" />
                          <span className="text-sm">{vehicle.specs.seating} Seater</span>
                        </div>
                      )}

                      {/* Spacer to push button to bottom */}
                      <div className="flex-grow"></div>

                      {/* View Details Button */}
                      <button
                        onClick={() => handleVehicleClick(vehicle.id)}
                        className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-auto"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
                  );
                } catch (error) {
                  console.error('Error rendering vehicle:', vehicle?.id, error);
                  return (
                    <div key={vehicle?.id || index} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 p-4">
                      <p className="text-red-600">Error loading vehicle {vehicle?.id || index}</p>
                    </div>
                  );
                }
              })}
            </div>
          ) : null}

          {/* See All Trucks Button - Only show when not loading and has vehicles */}
          {!loading && !error && filteredVehicles.length > 0 && (
            <div className="text-center">
              <button 
                onClick={handleSeeAllTrucks}
                className="bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg border-2 border-red-600 hover:bg-red-50 transition-colors"
              >
                See All Trucks
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
