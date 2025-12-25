import { useEffect, useMemo, useState } from 'react';
import { Fuel, MapPin, Phone, Clock } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { fuelStationsAPI, normalizeImageUrl } from '../services/api';

interface FuelStation {
  id: string;
  name: string;
  location: string;
  address: string;
  phone?: string;
  image?: string;
  mapLink?: string;
  features: string[];
}

interface FuelStationsProps {
  setCurrentPage?: (page: string) => void;
}

const DEFAULT_FEATURES = ['Diesel & Petrol', '24/7 Service', 'Air & Water', 'Card Payments'];

const normalizeStations = (stations: any[]): FuelStation[] => {
  if (!Array.isArray(stations)) {
    console.warn('[normalizeStations] Input is not an array:', stations);
    return [];
  }

  console.log('[normalizeStations] Processing', stations.length, 'stations');

  return stations.map((station, index) => {
    console.log(`[normalizeStations] Processing station ${index}:`, station);
    
    const id = String(
      station?.id ||
        station?.station_id ||
        station?.fuel_station_id ||
        station?.uuid ||
        index
    );

    const name =
      station?.name ||
      station?.title ||
      station?.location ||
      station?.city ||
      `Fuel Station ${index + 1}`;

    // Try to get location from various fields, or derive from address
    let location = station?.location || station?.city || station?.area;
    if (!location && station?.address) {
      // Try to extract city/state from address
      const addressParts = station.address.split(',');
      if (addressParts.length > 1) {
        location = addressParts[addressParts.length - 1].trim();
      }
    }
    location = location || 'Andhra Pradesh';

    const rawFeatures = station?.features;
    let features: string[] = [];

    if (Array.isArray(rawFeatures)) {
      features = rawFeatures.filter(Boolean);
    } else if (typeof rawFeatures === 'string') {
      features = rawFeatures
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean);
    } else if (station?.amenities && Array.isArray(station.amenities)) {
      features = station.amenities.filter(Boolean);
    } else {
      features = DEFAULT_FEATURES;
    }

    // Build map link from latitude/longitude if available
    let mapLink = station?.mapLink || station?.map_link || station?.google_maps_link || '';
    if (!mapLink && station?.latitude && station?.longitude) {
      mapLink = `https://www.google.com/maps?q=${station.latitude},${station.longitude}`;
    }

    const normalized = {
      id,
      name,
      location,
      address: station?.address || station?.full_address || 'Address coming soon',
      phone: station?.phone || station?.contact || station?.phone_number || '+91 93918 20529',
      image: station?.image || station?.banner || station?.photo || station?.image_url || '',
      mapLink,
      features: features.length > 0 ? features : DEFAULT_FEATURES,
    };

    console.log(`[normalizeStations] Normalized station ${index}:`, normalized);
    return normalized;
  });
};

export default function FuelStations({ setCurrentPage }: FuelStationsProps) {
  const [fuelStations, setFuelStations] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadStations = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('[FuelStations] Loading fuel stations...');
        let stations;
        
        // Try to load from backend API first
        try {
          stations = await fuelStationsAPI.getAll(1, 100);
          console.log('[FuelStations] Raw API response:', stations);
          console.log('[FuelStations] Loaded', stations?.length || 0, 'station(s) from backend');
        } catch (apiError: any) {
          console.warn('[FuelStations] Backend API failed, loading from public JSON file:', apiError);
          
          // Load from public JSON file
          const response = await fetch('/fuelStations.json');
          if (!response.ok) {
            throw new Error('Failed to fetch fuelStations.json');
          }
          const jsonData = await response.json();
          stations = jsonData.fuelStations || jsonData || [];
          console.log('[FuelStations] Loaded', stations?.length || 0, 'station(s) from public JSON file');
        }

        if (!stations || stations.length === 0) {
          console.warn('[FuelStations] No stations found, trying public JSON file as fallback...');
          
          // Try loading from public JSON file as fallback
          try {
            const response = await fetch('/fuelStations.json');
            if (response.ok) {
              const jsonData = await response.json();
              stations = jsonData.fuelStations || jsonData || [];
              console.log('[FuelStations] Loaded', stations?.length || 0, 'station(s) from public JSON file (fallback)');
            }
          } catch (e) {
            console.warn('[FuelStations] Public JSON file also unavailable');
          }
          
          if (!stations || stations.length === 0) {
            setError(null);
            setFuelStations([]);
            return;
          }
        }

        const normalized = normalizeStations(stations);
        console.log('[FuelStations] Normalized stations:', normalized);

        if (normalized.length === 0) {
          console.warn('[FuelStations] Normalization resulted in empty array');
          setError('No fuel stations found.');
        } else {
          setFuelStations(normalized);
          setError(null);
        }
      } catch (error: any) {
        console.error('[FuelStations] Loading failed, trying public JSON file:', error);
        
        // Final fallback to public JSON file
        try {
          const response = await fetch('/fuelStations.json');
          if (response.ok) {
            const jsonData = await response.json();
            const stations = jsonData.fuelStations || jsonData || [];
            const normalized = normalizeStations(stations);
            if (normalized.length > 0) {
              setFuelStations(normalized);
              setError(null);
              console.log('[FuelStations] Successfully loaded from public JSON file');
            } else {
              setError('No fuel stations found.');
              setFuelStations([]);
            }
          } else {
            throw error;
          }
        } catch (jsonError: any) {
          console.error('[FuelStations] All loading methods failed:', jsonError);
          
          // Provide more user-friendly error messages
          let errorMessage = 'Failed to load fuel stations.';
          if (error?.message?.includes('Network error') || error?.message?.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          } else if (error?.message?.includes('404')) {
            errorMessage = 'Fuel stations data not found.';
          } else if (error?.message?.includes('500')) {
            errorMessage = 'Server error occurred. Please try again later.';
          } else {
            errorMessage = error?.message || 'Failed to load fuel stations. Please try again later.';
          }
          
          setError(errorMessage);
          setFuelStations([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [refreshKey]);

  const handleRetry = () => {
    setRefreshKey(prev => prev + 1);
  };

  const stationsToDisplay = useMemo(() => fuelStations.filter(Boolean), [fuelStations]);

  return (
    <div className="bg-white">
      {/* Header Section */}
      <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="bg-gray-800 p-3 sm:p-4 rounded-full">
                <Fuel size={30} className="sm:w-10 sm:h-10 text-red-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-blue-900 uppercase px-2">FUEL STATIONS</h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-2">
              We operate a fuel station providing quality fuel products and services to retail and commercial customers.
            </p>
          </div>
        </div>
      </section>

      {/* Fuel Stations Grid */}
      <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <LoadingSpinner message="Loading fuel stations..." fullScreen={false} />
          )}

          {error && !loading && (
            <div className="bg-white border border-red-100 rounded-xl shadow-lg p-4 sm:p-6 md:p-10 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-red-600 mb-2 sm:mb-3">Unable to load fuel stations</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm sm:text-base min-h-[44px]"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && stationsToDisplay.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6 md:p-10 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Fuel station information coming soon</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                We are updating our network of fuel stations. Please check back shortly or contact our support team for the latest information.
              </p>
            </div>
          )}

          {!loading && !error && stationsToDisplay.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 max-w-4xl mx-auto">
              {stationsToDisplay.map((station) => (
                <div
                  key={station.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Station Image */}
                  <div className="relative w-full h-80 sm:h-96 md:h-[450px] overflow-hidden">
                    <img
                      src={station.image ? normalizeImageUrl(station.image) : 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop'}
                      alt={station.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop';
                      }}
                    />
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-red-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                      {station.location}
                    </div>
                  </div>

                  {/* Station Details */}
                  <div className="p-5 sm:p-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{station.name}</h3>

                    {/* Address */}
                    <div className="flex items-start mb-4">
                      <MapPin size={20} className="text-red-600 mr-3 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-2">{station.address}</p>
                        {station.mapLink && (
                          <a
                            href={station.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-red-600 hover:text-red-700 text-sm font-semibold transition-colors"
                          >
                            <MapPin size={16} className="mr-1" />
                            View on Google Maps
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    {station.phone && (
                      <div className="flex items-center mb-4">
                        <Phone size={20} className="text-red-600 mr-3 flex-shrink-0" />
                        <a href={`tel:${station.phone}`} className="text-gray-700 hover:text-red-600 transition-colors">
                          {station.phone}
                        </a>
                      </div>
                    )}

                    {/* Features */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Features:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {station.features.map((feature, index) => (
                          <div key={`${station.id}-feature-${index}`} className="flex items-center">
                            <svg className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="bg-blue-50 p-6 sm:p-8 rounded-xl">
              <div className="text-4xl sm:text-5xl font-bold text-blue-900 mb-2">1</div>
              <div className="text-lg sm:text-xl font-semibold text-gray-700">Fuel Station</div>
            </div>
            <div className="bg-green-50 p-6 sm:p-8 rounded-xl">
              <div className="text-4xl sm:text-5xl font-bold text-green-900 mb-2">24/7</div>
              <div className="text-lg sm:text-xl font-semibold text-gray-700">Service Available</div>
            </div>
            <div className="bg-yellow-50 p-6 sm:p-8 rounded-xl">
              <div className="text-4xl sm:text-5xl font-bold text-yellow-900 mb-2">100%</div>
              <div className="text-lg sm:text-xl font-semibold text-gray-700">Quality Assured</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

