import { useState, useEffect } from 'react';
import { Droplet, ArrowLeft, Phone, Mail } from 'lucide-react';
import { productsAPI, normalizeImageUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Product {
  id: number | string;
  name: string;
  category: string;
  image?: string;
  description: string;
  specs: string;
  company?: string;
  company_key?: string;
  category_name?: string;
  catalog_url?: string;
}

interface ProductDetailProps {
  productId: number | string; // Accept both number and string (UUID)
  onBack: () => void;
}

export default function ProductDetail({ productId, onBack }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Extract catalog URL helper
  const getCatalogUrl = (product: Product | null): string => {
    if (!product) return '';
    
    // First try catalog_url from product (direct field)
    let catalogUrl = product.catalog_url || '';
    
    // If not found, try to extract from specs
    if (!catalogUrl || catalogUrl.trim() === '') {
      const specsText = product.specs || '';
      const catalogMatch = specsText.match(/Catalog:\s*(.+?)(?:\n|$)/i);
      if (catalogMatch) {
        catalogUrl = catalogMatch[1].trim();
      }
    }
    
    // Return the URL if it exists and is not empty
    const finalUrl = catalogUrl && catalogUrl.trim() !== '' ? catalogUrl.trim() : '';
    console.log('[ProductDetail] getCatalogUrl result:', {
      hasProduct: !!product,
      catalogUrl: product?.catalog_url,
      extractedUrl: finalUrl,
      willDisplay: finalUrl !== ''
    });
    return finalUrl;
  };

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      try {
        let productData: Product | null = null;
        
        // Normalize function to convert any value to string
        const normalizeString = (value: any): string => {
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') return value;
          if (typeof value === 'number' || typeof value === 'boolean') return String(value);
          if (typeof value === 'object') {
            // Handle category objects (e.g., {ID, NAME, LABEL})
            if (value.LABEL) return String(value.LABEL);
            if (value.label) return String(value.label);
            if (value.NAME) return String(value.NAME);
            if (value.name) return String(value.name);
            if (value.id) return String(value.id);
            if (value.ID) return String(value.ID);
            // If it's an object, try to extract a meaningful string
            if (value.text) return String(value.text);
            if (value.content) return String(value.content);
            if (value.value) return String(value.value);
            if (value.message) return String(value.message);
            // If it's an array, join it
            if (Array.isArray(value)) {
              return value.map(v => normalizeString(v)).join(', ');
            }
            // Don't stringify objects - return empty string instead
            return '';
          }
          return String(value || '');
        };
        
        // Try loading from backend API first
        try {
          console.log('[ProductDetail] Loading product from backend, productId:', productId);
          const data = await productsAPI.getById(String(productId));
          console.log('[ProductDetail] Backend response:', data);
          
          // Handle different response structures
          if (Array.isArray(data)) {
            productData = data.find((p: any) => 
              String(p.id) === String(productId) || 
              Number(p.id) === Number(productId) ||
              p.id === productId
            ) || null;
          } else if (data.product) {
            productData = data.product;
          } else if (data.data) {
            productData = data.data;
          } else if (data.id || data.name) {
            productData = data;
          }
          
          console.log('[ProductDetail] Raw productData from API:', productData);
          console.log('[ProductDetail] catalog_url in productData:', productData?.catalog_url);
        } catch (backendError) {
          console.error('[ProductDetail] Backend API failed:', backendError);
          throw new Error('Failed to load product from backend. Please try again later.');
        }
        
        if (!productData) {
          throw new Error('Product not found');
        }
        
        // Normalize the product data structure
        const normalizedProduct: Product = {
          id: productData.id || productId,
          name: normalizeString(productData.name) || 'Product',
          category: (() => {
            const cat = productData.category || productData.category_name;
            // Handle category as object (e.g., {ID, NAME, LABEL})
            if (cat && typeof cat === 'object') {
              const catObj = cat as any;
              return catObj.LABEL || catObj.label || catObj.NAME || catObj.name || catObj.id || catObj.ID || 'automotive';
            }
            return normalizeString(cat) || 'automotive';
          })(),
          image: normalizeString(productData.image || (productData as any).image_url) || '',
          description: normalizeString(productData.description) || 'Premium quality product for your needs.',
          specs: normalizeString(productData.specs) || 'Standard specifications',
          company: normalizeString(productData.company || productData.company_key) || '',
          catalog_url: (() => {
            // Try multiple possible field names for catalog URL
            const catalogUrl = productData.catalog_url || 
                              (productData as any).catalog_url ||
                              (productData as any).catalogUrl ||
                              (productData as any).catalog ||
                              '';
            // Don't normalize URLs - preserve them as-is
            const urlString = typeof catalogUrl === 'string' ? catalogUrl.trim() : '';
            console.log('[ProductDetail] Catalog URL extraction:', {
              original: catalogUrl,
              urlString: urlString,
              isEmpty: !urlString || urlString === ''
            });
            return urlString && urlString !== '' ? urlString : undefined;
          })(),
        };
        
        console.log('[ProductDetail] Raw productData:', productData);
        console.log('[ProductDetail] All catalog fields:', {
          catalog_url: productData.catalog_url,
          catalogUrl: (productData as any).catalogUrl,
          catalog: (productData as any).catalog,
          allKeys: Object.keys(productData)
        });
        console.log('[ProductDetail] Normalized product:', normalizedProduct);
        console.log('[ProductDetail] Catalog URL from API:', productData.catalog_url);
        console.log('[ProductDetail] Catalog URL normalized:', normalizedProduct.catalog_url);
        
        // Debug: Check if catalog should display
        const catalogUrl = normalizedProduct.catalog_url || '';
        console.log('[ProductDetail] Will catalog display?', {
          hasCatalogUrl: !!normalizedProduct.catalog_url,
          catalogUrl: catalogUrl,
          isEmpty: !catalogUrl || catalogUrl.trim() === '',
          type: typeof normalizedProduct.catalog_url
        });
        
        setProduct(normalizedProduct);
      } catch (err: any) {
        console.error('[ProductDetail] Error loading product:', err);
        // Ensure error message is a string
        let errorMessage = 'Failed to load product. Please try again.';
        if (err) {
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err.message) {
            errorMessage = typeof err.message === 'string' ? err.message : String(err.message);
          } else if (err.detail) {
            errorMessage = typeof err.detail === 'string' ? err.detail : String(err.detail);
          } else {
            errorMessage = String(err);
          }
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <LoadingSpinner 
        message="Thank you for visiting us. Please wait..." 
        fullScreen={true} 
      />
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            {error || 'Product Not Found'}
          </h2>
          <button
            onClick={onBack}
            className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header with Back Button */}
      <section className="bg-gray-900 text-white py-3 sm:py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center text-white hover:text-red-400 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 mr-2" />
            Back to Products
          </button>
        </div>
      </section>

      {/* Product Detail Section */}
      <section className="py-6 sm:py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            {/* Product Image */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 flex items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px] shadow-xl">
              {product.image ? (
                <img
                  src={normalizeImageUrl(product.image)}
                  alt={product.name}
                  className="w-full h-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Use SVG placeholder as fallback
                    const productName = product.name.substring(0, 20);
                    target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${productName}</text></svg>`)}`;
                  }}
                />
              ) : (
                <Droplet size={100} className="sm:w-32 sm:h-32 md:w-40 md:h-40 text-red-600 opacity-50" />
              )}
            </div>

            {/* Product Details */}
            <div>
              <div className="mb-6 sm:mb-8">
                <span className="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold uppercase mb-4 sm:mb-6 inline-block">
                  {product.category}
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">{product.name}</h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 leading-relaxed">{product.description}</p>
              </div>

              {/* Specifications */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                  <Droplet className="mr-2 sm:mr-3 text-red-600 sm:w-8 sm:h-8" size={24} />
                  Specifications
                </h2>
                <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border-2 border-gray-200">
                  {(() => {
                    // Parse specs - remove catalog path if present and format nicely
                    let specsText = product.specs || '';
                    
                    // Use catalog_url from product if available, otherwise try to extract from specs
                    let catalogUrl = product.catalog_url || '';
                    if (!catalogUrl) {
                      const catalogMatch = specsText.match(/Catalog:\s*(.+?)(?:\n|$)/i);
                      if (catalogMatch) {
                        catalogUrl = catalogMatch[1].trim();
                        specsText = specsText.replace(/Catalog:.*$/i, '').trim();
                      }
                    }
                    
                    // Split specs by | or newline and format as list
                    const specItems = specsText
                      .split(/\s*\|\s*|\n/)
                      .map(s => s.trim())
                      .filter(s => s && !s.toLowerCase().includes('catalog:'));
                    
                    if (specItems.length > 0) {
                      return (
                        <div className="space-y-2 sm:space-y-3">
                          {specItems.map((spec, index) => (
                            <div key={index} className="flex items-start text-gray-700">
                              <Droplet size={16} className="sm:w-5 sm:h-5 text-red-600 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                              <span className="text-sm sm:text-base md:text-lg font-medium break-words">{spec}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    
                    // Fallback: display as plain text if no pipe separators
                    return (
                      <div className="flex items-center text-gray-700">
                        <Droplet size={20} className="sm:w-6 sm:h-6 text-red-600 mr-3 sm:mr-4 flex-shrink-0" />
                        <span className="text-base sm:text-lg md:text-xl font-semibold break-words">{specsText || 'Specifications not available'}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Product Catalog Download/View */}
              {(() => {
                const catalogUrl = getCatalogUrl(product);
                const hasCatalog = catalogUrl && catalogUrl.trim() !== '' && catalogUrl !== 'null' && catalogUrl !== 'undefined';
                console.log('[ProductDetail] Catalog display check:', {
                  catalogUrl,
                  hasCatalog,
                  productCatalogUrl: product?.catalog_url,
                  productData: product
                });
                return hasCatalog;
              })() && (
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Product Catalog
                  </h2>
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 sm:p-6 rounded-xl border-2 border-red-200">
                    <p className="text-sm sm:text-base text-gray-700 mb-4">
                      Download the complete product catalog (PDF) for detailed specifications, technical data, and application information.
                    </p>
                    <a
                      href={(() => {
                        const url = getCatalogUrl(product);
                        // If URL already starts with http/https, use as-is, otherwise normalize
                        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                          return url;
                        }
                        return normalizeImageUrl(url);
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base md:text-lg"
                      onClick={(e) => {
                        const url = getCatalogUrl(product);
                        console.log('[ProductDetail] Catalog link clicked:', url);
                        if (!url || url.trim() === '') {
                          e.preventDefault();
                          alert('Catalog URL is not available');
                        }
                      }}
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View/Download Product Catalog (PDF)
                    </a>
                  </div>
                </div>
              )}

              {/* Features/Benefits */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Key Features</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="bg-red-600 p-1.5 sm:p-2 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm sm:text-base text-gray-800 font-semibold">Premium Quality</span>
                  </div>
                  <div className="flex items-center bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="bg-red-600 p-1.5 sm:p-2 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm sm:text-base text-gray-800 font-semibold">Industry Standard</span>
                  </div>
                  <div className="flex items-center bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="bg-red-600 p-1.5 sm:p-2 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm sm:text-base text-gray-800 font-semibold">Trusted Brand</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 sm:space-y-4">
                <a
                  href="https://wa.me/919281029456"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-red-600 text-white py-3 sm:py-4 px-4 sm:px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-red-700 transition-colors flex items-center justify-center group min-h-[44px]"
                >
                  <Phone className="mr-2 sm:w-5 sm:h-5" size={18} />
                  Get Quote
                </a>
                <button className="w-full bg-gray-800 text-white py-3 sm:py-4 px-4 sm:px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-900 transition-colors flex items-center justify-center min-h-[44px]">
                  <Mail className="mr-2 sm:w-5 sm:h-5" size={18} />
                  Contact Us
                </button>
                <a
                  href="tel:+919281029456"
                  className="block w-full bg-green-600 text-white py-3 sm:py-4 px-4 sm:px-8 rounded-lg font-bold text-base sm:text-lg hover:bg-green-700 transition-colors text-center min-h-[44px] flex items-center justify-center"
                >
                  Call: +91 92810 29456
                </a>
              </div>

              {/* Contact Info */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone size={18} className="text-red-600 mr-3" />
                    <a href="tel:+919281029456" className="text-gray-700 hover:text-red-600">
                      +91 92810 29456
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Mail size={18} className="text-red-600 mr-3" />
                    <a href="mailto:sahniauto@gmail.com" className="text-gray-700 hover:text-red-600">
                      sahniauto@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

