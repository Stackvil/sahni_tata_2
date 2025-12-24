import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Car, Zap, Battery, Shield, Gauge, TrendingUp, 
  CheckCircle2, ArrowRight, Phone, Mail, Share2,
  Star, Settings, Users, Droplet, Activity, FileText, Download
} from 'lucide-react';
import { getVehicleById, Vehicle } from '../data/tataVehicles';
import { normalizeImageUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface VehicleDetailProps {
  vehicleId: number;
  onBack: () => void;
}

// Images are normalized in useEffect, so we use them directly without encodeImagePath

export default function VehicleDetail({ vehicleId, onBack }: VehicleDetailProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);

  // Handle share functionality
  const handleShare = async () => {
    const vehicleUrl = window.location.href;
    const shareData = {
      title: `${vehicle?.name} - Sahni Auto Group`,
      text: `Check out ${vehicle?.name} at Sahni Auto Group: ${vehicle?.description || ''}`,
      url: vehicleUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.log('Error sharing:', err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(vehicleUrl);
        alert('Link copied to clipboard!');
      } catch (err) {
        // Final fallback: Show URL in prompt
        const copied = prompt('Copy this link:', vehicleUrl);
        if (copied) {
          alert('Link copied!');
        }
      }
    }
    setShareMenuOpen(null);
  };

  // Handle copy link
  const handleCopyLink = async () => {
    const vehicleUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(vehicleUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      const copied = prompt('Copy this link:', vehicleUrl);
      if (copied) {
        alert('Link copied!');
      }
    }
    setShareMenuOpen(null);
  };

  // Handle catalog download
  const handleViewCatalog = () => {
    if (vehicle?.catalog) {
      const pdfPath = vehicle.catalog;
      // If it's already a full URL, use it directly
      if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
        window.open(pdfPath, '_blank');
      } else {
        // Normalize the path - handle both relative and absolute paths
        let normalizedPath = pdfPath;
        if (!pdfPath.startsWith('/')) {
          normalizedPath = '/' + pdfPath;
        }
        // Use the backend URL for serving PDFs
        // Use localhost for local development
        const baseUrl = import.meta.env.VITE_API_URL || 'https://qqhxxgscjc.execute-api.ap-south-1.amazonaws.com/prod';
        const fullUrl = `${baseUrl}${normalizedPath}`;
        window.open(fullUrl, '_blank');
      }
    } else {
      alert('Catalog not available for this vehicle.');
    }
  };

  // Handle catalog download (alternative function name for consistency)
  const handleDownloadCatalog = () => {
    handleViewCatalog();
  };

  // Handle WhatsApp redirect for test drive
  const handleScheduleTestDrive = () => {
    const phoneNumber = '919281029456'; // WhatsApp number without + sign
    const message = `Hi, I'm interested in scheduling a test drive for ${vehicle?.name || 'this vehicle'}. Please provide more information.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.share-menu-container')) {
          setShareMenuOpen(null);
        }
      }
    };

    if (shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [shareMenuOpen]);

  useEffect(() => {
    const loadVehicle = async () => {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      try {
        setError(null);
        // Use getVehicleById helper which handles numeric ID to UUID mapping
        // It loads all vehicles and finds by numeric ID (frontend ID)
        console.log('[VehicleDetail] Loading vehicle with ID:', vehicleId, 'type:', typeof vehicleId);
        
        // getVehicleById accepts both number and string (numeric ID or UUID)
        // Pass vehicleId directly - it will handle both cases
        const vehicleData = await getVehicleById(vehicleId);
        
        if (vehicleData) {
          // Ensure images are strings and normalized
          const normalizedImages = vehicleData.images
            .map(img => {
              if (typeof img === 'string') {
                return normalizeImageUrl(img);
              } else if (img && typeof img === 'object') {
                // Fallback: extract string from object
                const imgStr = (img as any).image || (img as any).url || (img as any).path || (img as any).src || '';
                return typeof imgStr === 'string' ? normalizeImageUrl(imgStr) : '';
              }
              return '';
            })
            .filter((img): img is string => typeof img === 'string' && img !== '');
          
          console.log('[VehicleDetail] Vehicle images:', {
            original: vehicleData.images,
            normalized: normalizedImages,
            count: normalizedImages.length
          });
          
          setVehicle({
            ...vehicleData,
            images: normalizedImages
          });
          console.log('[VehicleDetail] ✓ Vehicle loaded:', vehicleData.name, `(${normalizedImages.length} images)`, {
            category: vehicleData.category,
            id: vehicleData.id,
            uuid: (vehicleData as any)._uuid
          });
        } else {
          const errorMsg = `Vehicle not found with ID: ${vehicleId}`;
          console.error('[VehicleDetail] ✗', errorMsg);
          setError(errorMsg);
        }
      } catch (error: any) {
        const errorMsg = error?.message || 'Error loading vehicle details';
        console.error('[VehicleDetail] Error loading vehicle:', error);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    
    loadVehicle();
  }, [vehicleId]);

  if (loading) {
    return (
      <LoadingSpinner 
        message="Loading vehicle details..." 
        fullScreen={true} 
      />
    );
  }

  if (!vehicle && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold mb-4">Vehicle Not Found</h2>
          {error && (
            <p className="text-red-600 mb-4">{error}</p>
          )}
          <p className="text-gray-600 mb-6">
            The vehicle details could not be loaded. This might be a Massey Ferguson product that needs to be linked to a vehicle.
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Ensure vehicle exists before accessing images
  if (!vehicle) {
    return null; // Will be handled by the check above
  }
  
  // Images should already be normalized strings from useEffect
  const vehicleImages = (vehicle.images && Array.isArray(vehicle.images) 
    ? vehicle.images
        .filter((img: any): img is string => {
          // Filter to only valid string images
          if (typeof img === 'string' && img.trim() !== '') {
            return true;
          }
          // If it's an object, try to extract string
          if (img && typeof img === 'object') {
            const imgStr = img.image || img.url || img.path || img.src || '';
            return typeof imgStr === 'string' && imgStr.trim() !== '';
          }
          return false;
        })
        .map((img: any): string => {
          // Map to string, normalizing if needed
          if (typeof img === 'string') {
            return normalizeImageUrl(img);
          }
          if (img && typeof img === 'object') {
            const imgStr = img.image || img.url || img.path || img.src || '';
            return typeof imgStr === 'string' ? normalizeImageUrl(imgStr) : '';
          }
          return '';
        })
        .filter((img: string): img is string => img !== '')
    : []) as string[];
  
  const mainImage = vehicleImages[selectedImageIndex] || vehicleImages[0] || '';
  
  console.log('[VehicleDetail] Image display:', {
    totalImages: vehicleImages.length,
    selectedIndex: selectedImageIndex,
    mainImage: mainImage ? mainImage.substring(0, 100) : 'none',
    allImages: vehicleImages.map(img => img.substring(0, 50))
  });

  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    // For tractors (massey category), use different defaults
    const isTractor = vehicle.category?.toLowerCase() === 'massey';
    
    // For tractors, don't use maxSpeed (they don't have high speeds)
    // Instead, use PTO power or engine power
    let maxSpeed: string | undefined = vehicle.specs.maxSpeed;
    if (!maxSpeed && !isTractor) {
      maxSpeed = '120 km/h'; // Default for vehicles
    } else if (!maxSpeed && isTractor) {
      maxSpeed = undefined; // Don't show maxSpeed for tractors
    }
    
    // For power, prefer PTO power for tractors, otherwise use engine power
    let power = '';
    if (isTractor) {
      // Access ptoPower from specs
      const ptoPower = vehicle.specs.ptoPower || vehicle.specs.power || '';
      if (ptoPower) {
        power = ptoPower.split('@')[0].trim();
      } else {
        power = 'Please provide from catalog';
      }
    } else {
      power = vehicle.specs.power ? vehicle.specs.power.split('@')[0] : '50 HP';
    }
    
    const torque = vehicle.specs.torque ? vehicle.specs.torque.split('@')[0].trim() : (isTractor ? '' : '100 Nm');
    const mileage = vehicle.specs.mileage || '20';
    const range = vehicle.category === 'ev' ? `${mileage} km range` : `${mileage} kmpl`;
    
    // Calculate acceleration estimate based on power (only for non-tractors)
    let acceleration = '';
    if (!isTractor) {
      const powerValue = parseInt(power.replace(/\D/g, '')) || 50;
      if (powerValue > 100) acceleration = '0-60 km/h in 6.0s';
      else if (powerValue > 75) acceleration = '0-60 km/h in 7.0s';
      else if (powerValue > 50) acceleration = '0-60 km/h in 8.0s';
      else acceleration = '0-60 km/h in 8.5s';
    }
    
    return {
      acceleration,
      maxSpeed,
      power,
      torque,
      range,
      safetyRating: '5-Star',
      isTractor
    };
  };

  const performance = getPerformanceMetrics();

  // Helper function to determine fuel type from vehicle name/category when not specified
  const getFuelType = (): string => {
    // If fuelType is explicitly set in specs, use it
    if (vehicle.specs.fuelType) {
      return vehicle.specs.fuelType;
    }
    
    // Otherwise, infer from vehicle name and category
    const nameLower = vehicle.name.toLowerCase();
    const categoryLower = vehicle.category?.toLowerCase() || '';
    
    // Check for EV/Electric vehicles
    if (categoryLower === 'ev' || nameLower.includes('ev') || nameLower.includes('electric')) {
      return 'Electric';
    }
    
    // Check for Diesel vehicles
    if (nameLower.includes('diesel')) {
      return 'Diesel';
    }
    
    // Check for CNG vehicles
    if (nameLower.includes('cng')) {
      // Check if it's bi-fuel
      if (nameLower.includes('bi-fuel') || nameLower.includes('bi fuel') || nameLower.includes('flex')) {
        return 'CNG/Petrol';
      }
      return 'CNG';
    }
    
    // Check for Petrol vehicles
    if (nameLower.includes('petrol')) {
      return 'Petrol';
    }
    
    // Check for Bi-fuel or Flex fuel vehicles
    if (nameLower.includes('bi-fuel') || nameLower.includes('bi fuel') || nameLower.includes('flex fuel')) {
      return 'CNG/Petrol';
    }
    
    // For Massey Ferguson tractors (typically diesel)
    if (categoryLower === 'massey' || nameLower.includes('massey')) {
      return 'Diesel';
    }
    
    // For commercial vehicles (ace, intra, yodha), default to Diesel if not specified
    // This is the most common fuel type for commercial vehicles in India
    if (categoryLower === 'ace' || categoryLower === 'intra' || categoryLower === 'yodha') {
      return 'Diesel';
    }
    
    // If we still can't determine, return empty string (will be handled by UI)
    // This prevents incorrectly showing "Electric" for vehicles we can't determine
    return '';
  };

  // Organize features
  const organizeFeatures = () => {
    const safety: string[] = [];
    const technology: string[] = [];
    const comfort: string[] = [];
    const performance: string[] = [];

    if (vehicle.features && Array.isArray(vehicle.features)) {
      vehicle.features.forEach((feature: string) => {
        const lowerFeature = feature.toLowerCase();
        if (lowerFeature.includes('camera') || lowerFeature.includes('monitor') || 
            lowerFeature.includes('alert') || lowerFeature.includes('safety') || 
            lowerFeature.includes('airbag')) {
          safety.push(feature);
        } else if (lowerFeature.includes('bluetooth') || lowerFeature.includes('audio') || 
                   lowerFeature.includes('navigation') || lowerFeature.includes('connectivity') ||
                   lowerFeature.includes('smart') || lowerFeature.includes('ai')) {
          technology.push(feature);
        } else if (lowerFeature.includes('ac') || lowerFeature.includes('seat') || 
                   lowerFeature.includes('key') || lowerFeature.includes('comfort') ||
                   lowerFeature.includes('vent')) {
          comfort.push(feature);
        } else {
          performance.push(feature);
        }
      });
    }

    // Fill with defaults if empty
    if (safety.length === 0) safety.push('Advanced Safety Features', '5-Star Safety Rating', 'Multiple Airbags');
    if (technology.length === 0) technology.push('Smart Connectivity', 'Navigation System', 'Bluetooth Audio');
    if (comfort.length === 0) comfort.push('Premium Interior', 'Climate Control', 'Comfortable Seating');
    if (performance.length === 0) performance.push('Efficient Performance', 'Smooth Driving', 'Reliable Engine');

    return { safety, technology, comfort, performance };
  };

  const features = organizeFeatures();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white"></div>
        
        {/* Navigation Bar */}
        <nav className="relative z-10 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to Vehicles</span>
          </button>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">Explore Models</button>
            <button 
              onClick={handleScheduleTestDrive}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
            >
              Schedule Test Drive
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            {/* Left Side - Text Content */}
            <div>
              <div className="mb-3 sm:mb-4">
                <span className="text-blue-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  {vehicle.category === 'ev' ? 'Electric Vehicle' : vehicle.category?.toUpperCase() || 'VEHICLE'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-gray-900">
                {vehicle.name}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                {vehicle.description || 'Experience the future of sustainable mobility with cutting-edge technology and luxury design.'}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
                {vehicle.catalog && (
                  <>
                    <button 
                      onClick={handleViewCatalog}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center justify-center text-white text-sm sm:text-base min-h-[44px]"
                    >
                      <FileText className="mr-2 w-4 h-4 sm:w-5 sm:h-5" size={18} />
                      View Catalog
                      <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" size={18} />
                    </button>
                    <button 
                      onClick={handleDownloadCatalog}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-700 hover:bg-gray-800 rounded-lg font-semibold transition-colors flex items-center justify-center text-white text-sm sm:text-base min-h-[44px]"
                    >
                      <Download className="mr-2 w-4 h-4 sm:w-5 sm:h-5" size={18} />
                      Download Catalog
                    </button>
                  </>
                )}
                <button 
                  onClick={handleScheduleTestDrive}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center justify-center text-white text-sm sm:text-base min-h-[44px]"
                >
                  <Phone className="mr-2 w-4 h-4 sm:w-5 sm:h-5" size={18} />
                  Schedule Test Drive
                </button>
                <div className="relative share-menu-container">
                  <button
                    onClick={() => setShareMenuOpen(shareMenuOpen === 'hero' ? null : 'hero')}
                    className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors border border-gray-300 text-gray-900"
                    title="Share this vehicle"
                  >
                    <Share2 size={20} />
                  </button>
                  {shareMenuOpen === 'hero' && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShareMenuOpen(null)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 share-menu-container">
                        <button
                          onClick={handleShare}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center text-gray-700"
                        >
                          <Share2 className="mr-2" size={16} />
                          Share via...
                        </button>
                        <button
                          onClick={handleCopyLink}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center text-gray-700"
                        >
                          <FileText className="mr-2" size={16} />
                          Copy Link
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Vehicle Image */}
            <div className="relative">
              <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden border border-gray-200">
                {mainImage && !imageError ? (
                  <>
                    <img
                      src={mainImage}
                      alt={vehicle.name}
                      className="w-full h-full object-contain p-4 sm:p-6 md:p-8"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error(`[VehicleDetail] Main image failed to load:`, {
                          src: target.src,
                          mainImage: mainImage.substring(0, 100),
                          vehicleName: vehicle.name
                        });
                        setImageError(true);
                        // Use SVG placeholder
                        const vehicleName = vehicle.name.substring(0, 20);
                        target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="400" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${vehicleName}</text></svg>`)}`;
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car size={80} className="sm:w-24 sm:h-24 md:w-32 md:h-32 text-gray-300" />
                    <p className="ml-4 text-sm text-gray-500">No image available</p>
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {vehicleImages.length > 1 && (
                <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 justify-center overflow-x-auto pb-2">
                  {vehicleImages.slice(0, 5).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        index === selectedImageIndex
                          ? 'border-blue-500 scale-110'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">IMG</text></svg>`)}`;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Unmatched Performance Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 px-2">Unmatched Performance</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience exceptional performance with cutting-edge technology and precision engineering
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Lightning Fast */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-500 transition-colors shadow-sm">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Lightning Fast</h3>
              <div className="space-y-2 mb-4">
                <p className="text-3xl font-bold text-blue-600">{performance.acceleration}</p>
                <p className="text-gray-600">Instant power delivery</p>
              </div>
              <p className="text-gray-500">
                {performance.power} of pure performance with instant torque delivery for an exhilarating driving experience.
              </p>
            </div>

            {/* Extended Range */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-500 transition-colors shadow-sm">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Battery className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Extended Range</h3>
              <div className="space-y-2 mb-4">
                <p className="text-3xl font-bold text-blue-600">{performance.range}</p>
                <p className="text-gray-600">On a single charge</p>
              </div>
              <p className="text-gray-500">
                Advanced battery technology ensures you can travel further with confidence and convenience.
              </p>
            </div>

            {/* Maximum Safety */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-500 transition-colors shadow-sm">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Maximum Safety</h3>
              <div className="space-y-2 mb-4">
                <p className="text-3xl font-bold text-blue-600">{performance.safetyRating}</p>
                <p className="text-gray-600">Safety rating</p>
              </div>
              <p className="text-gray-500">
                Equipped with cutting-edge safety features and autonomous driving capabilities for maximum protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainable Luxury Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Image */}
            <div className="relative">
              <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden border border-gray-200">
                {vehicleImages.length > 1 && vehicleImages[1] ? (
                  <img
                    src={vehicleImages[1]}
                    alt={`${vehicle.name} Luxury`}
                    className="w-full h-full object-cover"
                  />
                ) : mainImage ? (
                  <img
                    src={mainImage}
                    alt={`${vehicle.name} Luxury`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car size={120} className="text-gray-700" />
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Content */}
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
                {vehicle.name} - Sustainable Luxury
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Redefines what it means to drive green. With an advanced electric powertrain, premium materials, 
                and industry-leading range, this vehicle offers no compromise on luxury or performance.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                {performance.maxSpeed && !performance.isTractor ? (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <Gauge className="text-blue-600 mb-3" size={32} />
                    <p className="text-2xl font-bold mb-1 text-gray-900">{performance.maxSpeed}</p>
                    <p className="text-gray-500 text-sm">Top Speed</p>
                  </div>
                ) : performance.isTractor && vehicle.specs.power ? (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <Activity className="text-blue-600 mb-3" size={32} />
                    <p className="text-2xl font-bold mb-1 text-gray-900">{performance.power}</p>
                    <p className="text-gray-500 text-sm">Engine Power</p>
                  </div>
                ) : null}
                {!performance.isTractor && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <Users className="text-blue-600 mb-3" size={32} />
                    <p className="text-2xl font-bold mb-1 text-gray-900">{vehicle.specs.seating || '5'}</p>
                    <p className="text-gray-500 text-sm">Seating Capacity</p>
                  </div>
                )}
                {getFuelType() && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <Droplet className="text-blue-600 mb-3" size={32} />
                    <p className="text-2xl font-bold mb-1 text-gray-900">{getFuelType()}</p>
                    <p className="text-gray-500 text-sm">Fuel Type</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <Activity className="text-blue-600 mb-3" size={32} />
                  <p className="text-2xl font-bold mb-1 text-gray-900">{performance.torque}</p>
                  <p className="text-gray-500 text-sm">{performance.isTractor ? 'Torque' : 'Torque'}</p>
                </div>
                {performance.isTractor && vehicle.specs.ptoPower && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <Zap className="text-blue-600 mb-3" size={32} />
                    <p className="text-2xl font-bold mb-1 text-gray-900">{vehicle.specs.ptoPower}</p>
                    <p className="text-gray-500 text-sm">PTO Power</p>
                  </div>
                )}
              </div>

              {vehicle.catalog && (
                <div className="flex gap-3 flex-wrap">
                  <button 
                    onClick={handleViewCatalog}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center justify-center text-white text-sm sm:text-base min-h-[44px]"
                  >
                    <FileText className="mr-2" size={20} />
                    View Catalog
                    <ArrowRight className="ml-2" size={20} />
                  </button>
                  <button 
                    onClick={handleDownloadCatalog}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-700 hover:bg-gray-800 rounded-lg font-semibold transition-colors flex items-center justify-center text-white text-sm sm:text-base min-h-[44px]"
                  >
                    <Download className="mr-2" size={20} />
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features & Technology Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">Advanced Features & Technology</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the cutting-edge features that make this vehicle exceptional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Safety Features */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <Shield className="text-blue-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-4 text-gray-900">Safety</h3>
              <ul className="space-y-3">
                {features.safety.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="text-blue-600 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technology Features */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <Settings className="text-blue-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-4 text-gray-900">Technology</h3>
              <ul className="space-y-3">
                {features.technology.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="text-blue-600 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Comfort Features */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <Star className="text-blue-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-4 text-gray-900">Comfort</h3>
              <ul className="space-y-3">
                {features.comfort.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="text-blue-600 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Performance Features */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <TrendingUp className="text-blue-600 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-4 text-gray-900">Performance</h3>
              <ul className="space-y-3">
                {features.performance.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="text-blue-600 mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Autonomous Intelligence Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">Autonomous Intelligence</h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Our advanced AI systems provide Level 4 autonomous driving capabilities, making every journey 
                safer and more relaxing. Experience the future of transportation with cutting-edge safety features 
                and intelligent navigation.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <CheckCircle2 className="text-blue-600 mr-4 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900">Advanced AI Systems</h3>
                    <p className="text-gray-600">
                      State-of-the-art artificial intelligence powers autonomous driving features
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="text-blue-600 mr-4 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900">Level 4 Autonomy</h3>
                    <p className="text-gray-600">
                      Near-fully autonomous driving capabilities for enhanced safety and comfort
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="text-blue-600 mr-4 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900">Intelligent Navigation</h3>
                    <p className="text-gray-600">
                      Smart routing and traffic optimization for the most efficient journeys
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                {vehicle.catalog && (
                  <>
                    <button 
                      onClick={handleViewCatalog}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center justify-center text-white text-sm sm:text-base min-h-[44px]"
                    >
                      <FileText className="mr-2" size={20} />
                      View Catalog
                    </button>
                    <button 
                      onClick={handleDownloadCatalog}
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-700 hover:bg-gray-800 rounded-lg font-semibold transition-colors flex items-center justify-center text-white text-sm sm:text-base min-h-[44px]"
                    >
                      <Download className="mr-2" size={20} />
                      Download
                    </button>
                  </>
                )}
                <div className="relative share-menu-container">
                  <button
                    onClick={() => setShareMenuOpen(shareMenuOpen === 'autonomous' ? null : 'autonomous')}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors border border-gray-300 flex items-center justify-center text-gray-900 text-sm sm:text-base min-h-[44px]"
                  >
                    <Share2 className="mr-2" size={20} />
                    Share
                  </button>
                  {shareMenuOpen === 'autonomous' && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShareMenuOpen(null)}
                      ></div>
                      <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 share-menu-container">
                        <button
                          onClick={handleShare}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center text-gray-700"
                        >
                          <Share2 className="mr-2" size={16} />
                          Share via...
                        </button>
                        <button
                          onClick={handleCopyLink}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center text-gray-700"
                        >
                          <FileText className="mr-2" size={16} />
                          Copy Link
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Image/Visual */}
            <div className="relative">
              <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-white rounded-2xl overflow-hidden border border-blue-200">
                {vehicleImages.length > 2 && vehicleImages[2] ? (
                  <img
                    src={vehicleImages[2] || mainImage || ''}
                    alt={`${vehicle.name} Autonomous`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Settings size={64} className="text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-500">Autonomous Technology</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">Detailed Specifications</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete technical specifications and performance metrics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Specs */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Performance</h3>
              <div className="space-y-3">
                {vehicle.specs.power && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Power</span>
                    <span className="text-gray-900 font-semibold">{vehicle.specs.power}</span>
                  </div>
                )}
                {vehicle.specs.torque && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Torque</span>
                    <span className="text-gray-900 font-semibold">{vehicle.specs.torque}</span>
                  </div>
                )}
                {vehicle.specs.maxSpeed && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Max Speed</span>
                    <span className="text-gray-900 font-semibold">{vehicle.specs.maxSpeed}</span>
                  </div>
                )}
                {vehicle.specs.transmission && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transmission</span>
                    <span className="text-gray-900 font-semibold">{vehicle.specs.transmission}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dimensions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Dimensions</h3>
              <div className="space-y-3">
                {vehicle.specs.length && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Length</span>
                    <span className="text-gray-900 font-semibold">{vehicle.specs.length}</span>
                  </div>
                )}
                {vehicle.specs.width && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Width</span>
                    <span className="text-gray-900 font-semibold">{vehicle.specs.width}</span>
                  </div>
                )}
                {vehicle.specs.height && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Height</span>
                    <span className="text-gray-900 font-semibold">{vehicle.specs.height}</span>
                  </div>
                )}
                {vehicle.specs.wheelbase && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wheelbase</span>
                    <span className="text-gray-900 font-semibold">{vehicle.specs.wheelbase}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Capacity / Tractor Specs */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-blue-600">
                {vehicle.category?.toLowerCase() === 'massey' ? 'Tractor Specifications' : 'Capacity'}
              </h3>
              <div className="space-y-3">
                {getFuelType() && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Fuel Type</span>
                    <span className="text-gray-900 font-semibold">{getFuelType()}</span>
                  </div>
                )}
                {vehicle.category?.toLowerCase() === 'massey' ? (
                  <>
                    {vehicle.specs.ptoPower && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">PTO Power</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.ptoPower}</span>
                      </div>
                    )}
                    {vehicle.specs.liftCapacity && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Lift Capacity</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.liftCapacity}</span>
                      </div>
                    )}
                    {vehicle.specs.hydraulics && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Hydraulics</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.hydraulics}</span>
                      </div>
                    )}
                    {vehicle.specs.weight && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weight</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.weight}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {vehicle.specs.seating && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Seating</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.seating}</span>
                      </div>
                    )}
                    {vehicle.specs.payload && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Payload</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.payload}</span>
                      </div>
                    )}
                    {vehicle.specs.gvw && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">GVW</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.gvw}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Additional Tractor Specifications */}
          {vehicle.category?.toLowerCase() === 'massey' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {vehicle.specs.engine && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">Engine</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type</span>
                      <span className="text-gray-900 font-semibold">{vehicle.specs.engine}</span>
                    </div>
                  </div>
                </div>
              )}
              {vehicle.specs.pto && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">PTO</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specifications</span>
                      <span className="text-gray-900 font-semibold">{vehicle.specs.pto}</span>
                    </div>
                  </div>
                </div>
              )}
              {(vehicle.specs.tyresFront || vehicle.specs.tyresRear) && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">Tyres</h3>
                  <div className="space-y-3">
                    {vehicle.specs.tyresFront && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Front</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.tyresFront}</span>
                      </div>
                    )}
                    {vehicle.specs.tyresRear && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rear</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.tyresRear}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(vehicle.specs.clutch || vehicle.specs.brakes || vehicle.specs.steering) && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">Transmission & Controls</h3>
                  <div className="space-y-3">
                    {vehicle.specs.clutch && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Clutch</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.clutch}</span>
                      </div>
                    )}
                    {vehicle.specs.brakes && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Brakes</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.brakes}</span>
                      </div>
                    )}
                    {vehicle.specs.steering && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Steering</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.steering}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(vehicle.specs.groundClearance || vehicle.specs.turningCircleRadius || vehicle.specs.frontAxle) && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">Dimensions & Clearance</h3>
                  <div className="space-y-3">
                    {vehicle.specs.groundClearance && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Ground Clearance</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.groundClearance}</span>
                      </div>
                    )}
                    {vehicle.specs.turningCircleRadius && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Turning Circle Radius</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.turningCircleRadius}</span>
                      </div>
                    )}
                    {vehicle.specs.frontAxle && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Front Axle</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.frontAxle}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(vehicle.specs.rearDrive || vehicle.specs.rearTransmission || vehicle.specs.airCleaner) && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">Additional Features</h3>
                  <div className="space-y-3">
                    {vehicle.specs.rearDrive && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Rear Drive</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.rearDrive}</span>
                      </div>
                    )}
                    {vehicle.specs.rearTransmission && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Rear Transmission</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.rearTransmission}</span>
                      </div>
                    )}
                    {vehicle.specs.airCleaner && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Air Cleaner</span>
                        <span className="text-gray-900 font-semibold">{vehicle.specs.airCleaner}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-gray-900 px-2">
            Ready to Experience {vehicle.name}?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Schedule a test drive and discover the future of sustainable luxury driving
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleScheduleTestDrive}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center text-white"
            >
              <Phone className="mr-2" size={20} />
              Schedule Test Drive
            </button>
            <button
              onClick={() => window.location.href = 'mailto:sahniauto@gmail.com'}
              className="px-8 py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors border border-gray-300 flex items-center text-gray-900"
            >
              <Mail className="mr-2" size={20} />
              Contact Us
            </button>
            <button
              onClick={handleShare}
              className="px-8 py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors border border-gray-300 flex items-center text-gray-900"
            >
              <Share2 className="mr-2" size={20} />
              Share
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
