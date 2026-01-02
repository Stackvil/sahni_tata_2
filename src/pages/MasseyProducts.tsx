import { useState, useEffect } from 'react';
import { ArrowLeft, Droplet } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { masseyAPI, normalizeImageUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface MasseyProductsProps {
  setCurrentPage?: (page: string) => void;
  setSelectedProductId?: (id: number) => void;
  setSelectedVehicleId?: (id: number) => void;
  onBack?: () => void;
}

interface Product {
  id: number;
  name: string;
  image: string;
  description: string;
  specs: string;
  category: string;
}

export default function MasseyProducts({ setCurrentPage, setSelectedProductId, setSelectedVehicleId, onBack }: MasseyProductsProps) {
  const [masseyProducts, setMasseyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMasseyProducts = async () => {
      setLoading(true);
      try {
        console.log('[MasseyProducts] Loading Massey Ferguson products from dedicated API...');
        
        // Load products and vehicles (for image fallback)
        const [productsResponse, vehiclesData] = await Promise.all([
          masseyAPI.getAllProducts(),
          // Also load vehicles to get images for Massey products
          import('../data/tataVehicles').then(m => m.loadVehicles()).catch(() => []),
        ]);
        
        // Backend returns: { data: [...], total_count, total_pages, current_page, per_page }
        const productsData = Array.isArray(productsResponse) 
          ? productsResponse 
          : (productsResponse?.data || []);
        
        console.log('[MasseyProducts] Products loaded:', productsData?.length || 0);
        console.log('[MasseyProducts] Products response:', {
          total_count: productsResponse?.total_count,
          total_pages: productsResponse?.total_pages,
          current_page: productsResponse?.current_page,
          per_page: productsResponse?.per_page
        });
        console.log('[MasseyProducts] Vehicles loaded for image fallback:', vehiclesData?.length || 0);
        
        // Create a map of vehicle images by name for fallback
        const vehicleImageMap: { [key: string]: string } = {};
        if (Array.isArray(vehiclesData)) {
          vehiclesData
            .filter(v => {
              const cat = (v.category || '').toLowerCase();
              return cat === 'massey' || cat.includes('massey') || 
                     (v.name || '').toLowerCase().includes('massey');
            })
            .forEach(v => {
              if (v.images && v.images.length > 0) {
                // Get first image, normalize it
                const firstImg = v.images[0];
                let imgUrl = '';
                if (typeof firstImg === 'string') {
                  imgUrl = firstImg;
                } else if (firstImg && typeof firstImg === 'object') {
                  imgUrl = firstImg.image || firstImg.url || firstImg.path || firstImg.src || '';
                }
                if (imgUrl) {
                  // Store normalized URL
                  const normalizedUrl = normalizeImageUrl(imgUrl);
                  vehicleImageMap[v.name.toLowerCase()] = normalizedUrl;
                  // Also store variations for better matching
                  const nameParts = v.name.toLowerCase().split(' ');
                  nameParts.forEach(part => {
                    if (part.length > 3) { // Only store meaningful parts
                      vehicleImageMap[part] = normalizedUrl;
                    }
                  });
                }
              }
            });
          console.log('[MasseyProducts] Vehicle image map created:', Object.keys(vehicleImageMap).length, 'entries');
        }
        
        // Transform products to match expected format
        const products: Product[] = Array.isArray(productsData) 
          ? productsData.map((p: any) => {
              // Get category ID from product (could be ID or category object)
              let categoryId = '';
              
              // Handle category as object (e.g., {ID, NAME, LABEL})
              if (p.category && typeof p.category === 'object') {
                categoryId = p.category.ID || p.category.id || p.category.NAME || p.category.name || '';
              } else if (p.category && typeof p.category === 'string') {
                categoryId = p.category;
              } else if (p.category_id) {
                categoryId = p.category_id;
              }
              
              const finalCategory = categoryId || 'tractors';
              
              // Handle image - could be string, array, or object
              let productImage = '';
              if (p.image) {
                if (typeof p.image === 'string') {
                  productImage = p.image;
                } else if (Array.isArray(p.image) && p.image.length > 0) {
                  // Get first image from array
                  const firstImg = p.image[0];
                  if (typeof firstImg === 'string') {
                    productImage = firstImg;
                  } else if (firstImg && typeof firstImg === 'object') {
                    // Extract string from image object
                    productImage = firstImg.image || firstImg.url || firstImg.path || firstImg.src || '';
                  }
                } else if (typeof p.image === 'object' && p.image !== null) {
                  // Image is an object, extract string
                  productImage = p.image.image || p.image.url || p.image.path || p.image.src || '';
                }
              }
              
              // If no image found, try to get from vehicle data if available
              if (!productImage && p.vehicle_images && Array.isArray(p.vehicle_images) && p.vehicle_images.length > 0) {
                const firstVehicleImg = p.vehicle_images[0];
                if (typeof firstVehicleImg === 'string') {
                  productImage = firstVehicleImg;
                } else if (firstVehicleImg && typeof firstVehicleImg === 'object') {
                  productImage = firstVehicleImg.image || firstVehicleImg.url || firstVehicleImg.path || firstVehicleImg.src || '';
                }
              }
              
              // Fallback: Try to get image from vehicles by matching name
              if (!productImage && vehicleImageMap && Object.keys(vehicleImageMap).length > 0) {
                const productNameLower = (p.name || '').toLowerCase();
                // Try exact match first
                if (vehicleImageMap[productNameLower]) {
                  productImage = vehicleImageMap[productNameLower];
                  console.log(`[MasseyProducts] Found exact image match for ${p.name}`);
                } else {
                  // Try partial match - check if product name contains vehicle name or vice versa
                  for (const [vehicleName, vehicleImage] of Object.entries(vehicleImageMap)) {
                    if (productNameLower.includes(vehicleName) || vehicleName.includes(productNameLower)) {
                      productImage = vehicleImage;
                      console.log(`[MasseyProducts] Found partial image match for ${p.name} -> ${vehicleName}`);
                      break;
                    }
                  }
                  
                  // If still no match, try matching by model numbers (e.g., "241 DI", "1035", "MF 30")
                  if (!productImage) {
                    const modelMatch = productNameLower.match(/(\d+[a-z]*|\d+\.\d+)/i);
                    if (modelMatch) {
                      const modelNum = modelMatch[0].toLowerCase();
                      for (const [vehicleName, vehicleImage] of Object.entries(vehicleImageMap)) {
                        if (vehicleName.includes(modelNum)) {
                          productImage = vehicleImage;
                          console.log(`[MasseyProducts] Found model number match for ${p.name} -> ${vehicleName}`);
                          break;
                        }
                      }
                    }
                  }
                }
              }
              
              if (!productImage) {
                console.warn(`[MasseyProducts] No image found for product: ${p.name}`);
              }
              
              return {
                id: p.id || p.product_id || String(p.name || Math.random()),
                name: p.name || 'Massey Ferguson Product',
                image: productImage,
                description: p.description || 'Massey Ferguson tractor - Reliable and powerful agricultural equipment.',
                specs: p.specs || 'Agricultural Tractor',
                category: String(finalCategory).toLowerCase(),
              };
            })
          : [];
        
        console.log(`[MasseyProducts] Transformed ${products.length} products`);
        if (products.length > 0) {
          console.log('[MasseyProducts] Sample products:', products.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            hasImage: !!p.image,
            image: p.image ? p.image.substring(0, 100) : 'none'
          })));
        }
        
        setMasseyProducts(products);
        
        if (products.length === 0) {
          console.warn('[MasseyProducts] No products found from Massey API');
          console.warn('[MasseyProducts] Raw productsData:', productsData);
        }
      } catch (err: any) {
        console.error('[MasseyProducts] Error loading massey products:', err);
        setMasseyProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadMasseyProducts();
  }, []);

  // Display all products without filtering
  const filteredProducts = masseyProducts;

  // Shared function to find matching vehicle for a Massey product
  const findMatchingVehicle = async (product: Product) => {
    try {
      const { loadVehicles } = await import('../data/tataVehicles');
      const allVehicles = await loadVehicles();
      const productNameLower = product.name.toLowerCase();
      
      console.log(`[MasseyProducts] Looking for vehicle matching: ${product.name}`);
      
      // Find vehicle by matching name (Massey Ferguson vehicles have category='massey')
      let matchingVehicle = allVehicles.find(v => {
        const vNameLower = (v.name || '').toLowerCase();
        const vCategory = (v.category || '').toLowerCase();
        
        // Exact match
        if (vNameLower === productNameLower) {
          return true;
        }
        
        // Category must be massey
        if (vCategory !== 'massey' && !vCategory.includes('massey') && !vNameLower.includes('massey')) {
          return false;
        }
        
        // Check if product name contains vehicle name or vice versa
        if (productNameLower.includes(vNameLower) || vNameLower.includes(productNameLower)) {
          return true;
        }
        
        // Try matching by model numbers (e.g., "241 DI", "1035", "MF 30")
        const productModelMatch = productNameLower.match(/(\d+[a-z]*|\d+\.\d+)/i);
        const vehicleModelMatch = vNameLower.match(/(\d+[a-z]*|\d+\.\d+)/i);
        if (productModelMatch && vehicleModelMatch && productModelMatch[0] === vehicleModelMatch[0]) {
          return true;
        }
        
        return false;
      });
      
      if (matchingVehicle) {
        console.log(`[MasseyProducts] Found matching vehicle: ${matchingVehicle.name} (ID: ${matchingVehicle.id})`);
        return matchingVehicle.id;
      } else {
        console.warn('[MasseyProducts] Could not find matching vehicle for:', product.name);
        console.warn('[MasseyProducts] Available Massey vehicles:', 
          allVehicles
            .filter(v => {
              const cat = (v.category || '').toLowerCase();
              return cat === 'massey' || cat.includes('massey') || (v.name || '').toLowerCase().includes('massey');
            })
            .map(v => v.name)
        );
        // Fallback: try to find any Massey vehicle
        const masseyVehicle = allVehicles.find(v => {
          const cat = (v.category || '').toLowerCase();
          return cat === 'massey' || cat.includes('massey') || (v.name || '').toLowerCase().includes('massey');
        });
        if (masseyVehicle) {
          console.log(`[MasseyProducts] Using fallback vehicle: ${masseyVehicle.name} (ID: ${masseyVehicle.id})`);
          return masseyVehicle.id;
        } else {
          console.error('[MasseyProducts] No Massey vehicles found at all!');
          return null;
        }
      }
    } catch (error) {
      console.error('[MasseyProducts] Error finding vehicle:', error);
      return null;
    }
  };

  const handleBack = () => {
    // Clear brand selection and go back to brand selection page
    try {
      sessionStorage.removeItem('sahni_selectedBrand');
    } catch (e) {
      // ignore storage errors
    }
    if (onBack) {
      onBack();
    } else if (setCurrentPage) {
      setCurrentPage('vehicles');
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        message="Thank you for visiting us. Please wait..." 
        fullScreen={true} 
      />
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>Massey Ferguson Tractors | Sahni Auto Group - Vijayawada</title>
        <meta name="description" content="Massey Ferguson tractors and agricultural equipment at Sahni Auto Group. Authorized dealer for Massey Ferguson tractors in Vijayawada, Andhra Pradesh & Telangana." />
        <meta name="keywords" content="Massey Ferguson tractors, agricultural equipment, tractors, farming machinery, Sahni Auto Group, Vijayawada" />
        <meta property="og:title" content="Massey Ferguson Tractors | Sahni Auto Group" />
        <meta property="og:description" content="Massey Ferguson tractors and agricultural equipment at Sahni Auto Group." />
        <meta property="og:url" content={window.location.href} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      {/* Header */}
      <section className="bg-gray-900 text-white py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-white hover:text-red-400 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Brand Selection
          </button>
          <div className="flex items-center gap-2">
            <img src={normalizeImageUrl('/images/TAFE_Logo.jpg')} alt="Massey Ferguson" className="h-6 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-sm font-semibold">Massey Ferguson Products</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-10 bg-gradient-to-br from-red-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <img
              src={normalizeImageUrl('/images/TAFE_Logo.jpg')}
              alt="Massey Ferguson"
              className="h-32 w-auto mx-auto mb-6 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black uppercase mb-4 tracking-tight">
              Massey Ferguson Products
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Explore our complete range of Massey Ferguson tractors and agricultural equipment
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={async () => {
                  // Massey Ferguson products need to be mapped to vehicles
                  const vehicleId = await findMatchingVehicle(product);
                  if (vehicleId && setSelectedVehicleId) {
                    setSelectedVehicleId(vehicleId);
                    // setSelectedVehicleId already handles navigation via React Router
                  } else {
                    alert(`Vehicle details not available for ${product.name}. Please contact us for more information.`);
                  }
                }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 group cursor-pointer flex flex-col h-full"
              >
                {/* Vehicle Image */}
                <div className="relative h-80 bg-gray-100 overflow-hidden flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {product.image ? (
                    <img
                        src={normalizeImageUrl(product.image)}
                      alt={product.name}
                      className="w-full h-full object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                          console.error(`[MasseyProducts] Image failed to load for ${product.name}:`, {
                            image: product.image,
                            normalized: normalizeImageUrl(product.image)
                          });
                          // Use SVG placeholder as fallback
                          const productName = product.name.substring(0, 20);
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="400" height="320" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="320" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${productName}</text></svg>`)}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                        <div className="text-center text-sm p-4">
                          <p>No Image Available</p>
                          <p className="text-xs mt-2">{product.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Vehicle Details */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 min-h-[3.5rem] flex items-center">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{product.description}</p>
                  {product.specs && (
                    <p className="text-xs text-gray-500 mb-4">{product.specs}</p>
                  )}
                  
                  {/* Spacer to push button to bottom */}
                  <div className="flex-grow"></div>
                  
                  {/* Booking Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Massey Ferguson products need to be mapped to vehicles
                      const vehicleId = await findMatchingVehicle(product);
                      if (vehicleId && setSelectedVehicleId) {
                        setSelectedVehicleId(vehicleId);
                        // setSelectedVehicleId already handles navigation via React Router
                      } else {
                        alert(`Vehicle details not available for ${product.name}. Please contact us for more information.`);
                      }
                    }}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-auto"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <Droplet size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">No products found in this category.</p>
              <p className="text-sm text-gray-500 mt-2">Please check back later for more products.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

