import { useState, useEffect, useRef } from 'react';
import { Droplet, Filter } from 'lucide-react';
import { productsAPI, normalizeImageUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface ProductsProps {
  setCurrentPage?: (page: string) => void;
  setSelectedProductId?: (id: number | string) => void; // Accept both number and string (UUID)
}

interface Product {
  id: number | string; // Can be numeric ID or UUID string
  name: string;
  category: string;
  image?: string;
  description: string;
  specs: string;
  company: string;
}

export default function Products({ setCurrentPage, setSelectedProductId }: ProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [showBrandsView, setShowBrandsView] = useState(true); // New state to control brand view
  const [showOthersView, setShowOthersView] = useState(false); // New state to control "Others" brands view
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string; image: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [itemsPerPage] = useState(20); // Products per page

  // Auto-select HP if coming from Home page (after products are loaded)
  useEffect(() => {
    if (!loading && products.length > 0) {
      const autoSelectHP = sessionStorage.getItem('sahni_autoSelectHP');
      if (autoSelectHP === 'true') {
        setSelectedCompany('hp');
        setShowBrandsView(false);
        setShowOthersView(false);
        sessionStorage.removeItem('sahni_autoSelectHP'); // Clear after use
        // Scroll to products section after a brief delay
        setTimeout(() => {
          const productsSection = document.getElementById('products-section');
          if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [loading, products]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let backendProducts: Product[] = [];
        let categoriesData: { id: string; label: string }[] = [];
        let companiesData: { id: string; name: string; image: string }[] = [];
        
        // Try loading from backend API first
        console.log('[Products] Loading products from backend');
        
        try {
          // Load ALL products from backend for filtering and pagination
          let allProductsList: Product[] = [];
          let currentPageNum = 1;
          let hasMorePages = true;
          let totalProductsCount = 0;
          
          // Load all pages to get complete product list
          while (hasMorePages) {
            const pageData = await productsAPI.getAll(currentPageNum, 1000, '');
            
            if (!pageData) {
              break;
            }
            
            // Extract products from response
            let pageProducts: Product[] = [];
            if (pageData.products && Array.isArray(pageData.products)) {
              pageProducts = pageData.products;
            } else if (pageData.data && Array.isArray(pageData.data)) {
              pageProducts = pageData.data;
            } else if (Array.isArray(pageData)) {
              pageProducts = pageData;
            }
            
            if (pageProducts.length > 0) {
              allProductsList.push(...pageProducts);
            }
            
            // Get total count from first page
            if (currentPageNum === 1) {
              totalProductsCount = pageData.total || pageProducts.length;
              console.log(`[Products] Total products in database: ${totalProductsCount}`);
            }
            
            // Check if there are more pages
            const totalPagesCount = pageData.total_pages || 1;
            if (currentPageNum >= totalPagesCount || pageProducts.length === 0) {
              hasMorePages = false;
            } else {
              currentPageNum++;
            }
          }
          
          console.log(`[Products] Loaded ${allProductsList.length} products from backend`);
          backendProducts = allProductsList;
        } catch (error) {
          console.warn('[Products] Backend API failed, falling back to static JSON file:', error);
          
          // Fallback to static JSON file
          try {
            const response = await fetch('/products.json');
            if (response.ok) {
              const staticData = await response.json();
              const staticProducts = Array.isArray(staticData) ? staticData : (staticData.products || staticData.data || []);
              console.log(`[Products] Loaded ${staticProducts.length} products from static JSON (offline mode)`);
              backendProducts = staticProducts;
              // Show a non-intrusive notification that we're using offline data
              if (!error?.message?.includes('offline')) {
                console.info('[Products] Using static data - API endpoint is unavailable');
              }
            } else {
              throw new Error('Failed to load static products file');
            }
          } catch (fallbackError) {
            console.error('[Products] Static JSON fallback also failed:', fallbackError);
            throw new Error('Failed to load products. Please check your connection and try again.');
          }
        }
        
        const mergedProducts = backendProducts;
        console.log(`[Products] Total products from backend: ${mergedProducts.length}`);
        
        // Extract categories from merged products
        const categoriesSet = new Set(
          mergedProducts
            .map(p => {
              const cat = p.category || p.category_name;
              // Handle category as object (e.g., {ID, NAME, LABEL})
              if (cat && typeof cat === 'object') {
                return (cat.NAME || cat.name || cat.LABEL || cat.label || cat.id || '').trim();
              }
              return typeof cat === 'string' ? cat.trim() : '';
            })
            .filter((cat): cat is string => cat !== '')
        );
        categoriesData = Array.from(categoriesSet).map(cat => ({
          id: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
        }));
        
        // Extract companies from merged products - normalize first to avoid duplicates
        const normalizeCompanyKey = (company: string | null | undefined): string => {
          if (!company || typeof company !== 'string') {
            return 'unknown';
          }
          
          let companyKey = company.toLowerCase().replace(/\s+/g, '').replace('lubricants', '');
          
          if (companyKey.includes('jiobp') || companyKey.includes('jio-bp')) {
            return 'jiobp';
          } else if (companyKey.includes('superline')) {
            return 'superline';
          } else if (companyKey.includes('reliance')) {
            return 'reliance';
          } else if (companyKey.includes('balmerol')) {
            return 'balmerol';
          } else if (companyKey.includes('mahindra')) {
            return 'mahindra';
          } else if (companyKey === 'hp' || companyKey.includes('hp')) {
            return 'hp';
          }
          
          return companyKey;
        };
        
        // Create a map of normalized keys to company names (keep first occurrence)
        const companyMap = new Map<string, string>();
        mergedProducts.forEach(p => {
          const companyValue = p.company || p.company_key || '';
          if (companyValue && typeof companyValue === 'string' && companyValue.trim() !== '') {
            const normalizedKey = normalizeCompanyKey(companyValue);
            if (!companyMap.has(normalizedKey)) {
              companyMap.set(normalizedKey, companyValue);
            }
          }
        });
        
        // Convert map to array of company objects with logos (using CloudFront URLs)
        const companyLogoMap: { [key: string]: string } = {
          'hp': normalizeImageUrl('/images/sahni verticals/HP_SULLI5.png'),
          'mahindra': normalizeImageUrl('/images/sahni verticals/lubricant_brands/Mahindra1.png'),
          'jiobp': normalizeImageUrl('/images/sahni verticals/lubricant_brands/Jio-bp_logo.svg'),
          'superline': normalizeImageUrl('/images/sahni verticals/lubricant_brands/superline.png'),
          'reliance': normalizeImageUrl('/images/sahni verticals/lubricant_brands/reliance lubricants.avif'),
          'balmerol': normalizeImageUrl('/images/sahni verticals/lubricant_brands/balmerol industrial.png'),
        };
        
        companiesData = Array.from(companyMap.entries()).map(([key, name]) => ({
          id: key,
          name: name,
          image: companyLogoMap[key] || '',
        }));
        
        // Add "All Companies" option at the beginning for filter dropdown
        companiesData = [{ id: 'all', name: 'All Companies', image: '' }, ...companiesData];
        
        // Store all products - we'll filter and paginate them
        setProducts(mergedProducts);
        setCategories(categoriesData);
        setCompanies(companiesData);
        setTotalProducts(mergedProducts.length);
        
        if (mergedProducts.length === 0) {
          setError('No products found. Please check your connection and try again.');
        }
      } catch (err: any) {
        console.error('[Products] Unexpected error:', err);
        setError(err?.message || 'Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPageNum(1);
  }, [selectedCategory, selectedCompany]);

  // Filter products based on selected category and company
  const allFilteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory || p.category_name === selectedCategory;
    
    // Company matching: handle both company ID (like "hp") and full company name (like "HP Lubricants")
    let matchesCompany = true;
    if (selectedCompany !== 'all') {
      // Find the company object to get both id and name
      const companyObj = companies.find(c => c.id === selectedCompany);
      if (companyObj) {
        // Match by company ID or company name
        matchesCompany = p.company === selectedCompany || 
                        p.company === companyObj.name ||
                        p.company?.toLowerCase() === companyObj.id?.toLowerCase() ||
                        p.company?.toLowerCase() === companyObj.name?.toLowerCase() ||
                        p.company_key === selectedCompany ||
                        p.company_key === companyObj.id;
      } else {
        // Fallback: direct comparison
        matchesCompany = p.company === selectedCompany || 
                        p.company?.toLowerCase() === selectedCompany?.toLowerCase() ||
                        p.company_key === selectedCompany;
      }
    }
    
    return matchesCategory && matchesCompany;
  });

  // Get categories for selected company (HP products)
  const isHPSelected = selectedCompany === 'hp' || selectedCompany?.toLowerCase() === 'hp';
  const hpProducts = products.filter(p => {
    const companyObj = companies.find(c => c.id === selectedCompany);
    if (companyObj) {
      return p.company === selectedCompany || 
             p.company === companyObj.name ||
             p.company?.toLowerCase() === companyObj.id?.toLowerCase() ||
             p.company?.toLowerCase() === companyObj.name?.toLowerCase() ||
             p.company_key === selectedCompany ||
             p.company_key === companyObj.id;
    }
    return p.company === selectedCompany || 
           p.company?.toLowerCase() === selectedCompany?.toLowerCase() ||
           p.company_key === selectedCompany;
  });
  
  // Extract unique categories from HP products
  const hpCategories = Array.from(new Set(
    hpProducts
      .map(p => {
        const cat = p.category_name || p.category;
        return typeof cat === 'string' ? cat : '';
      })
      .filter(cat => cat !== '')
  )).sort();

  // Calculate pagination for filtered products
  const totalFilteredProducts = allFilteredProducts.length;
  const totalFilteredPages = Math.max(1, Math.ceil(totalFilteredProducts / itemsPerPage));
  
  // Update total pages when filters change
  useEffect(() => {
    setTotalPages(totalFilteredPages);
    setTotalProducts(totalFilteredProducts);
  }, [totalFilteredPages, totalFilteredProducts]);

  // Get paginated filtered products
  const startIndex = (currentPageNum - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredProducts = allFilteredProducts.slice(startIndex, endIndex);

  // Scroll animation setup
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

    // Observe all elements with scroll-reveal class
    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [filteredProducts]);

  // Handle brand selection
  const handleBrandSelect = (companyId: string) => {
    setSelectedCompany(companyId);
    setShowBrandsView(false); // Hide brands view and show products
    setShowOthersView(false); // Hide others view
    // Scroll to products section
    setTimeout(() => {
      const productsSection = document.getElementById('products-section');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Handle "Others" selection
  const handleOthersSelect = () => {
    setShowOthersView(true);
    setShowBrandsView(false);
  };

  // Define "Others" brands
  const othersBrands = [
    { id: 'mahindra', name: 'Mahindra', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/Mahindra1.png') },
    { id: 'reliance', name: 'Reliance', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/reliance lubricants.avif') },
    { id: 'balmerol', name: 'Balmerol', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/balmerol industrial.png') },
    { id: 'superline', name: 'Superline', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/superline.png') },
    { id: 'jiobp', name: 'Jio BP', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/Jio-bp_logo.svg') },
  ];

  // Show "Others" brands view
  if (showOthersView) {
    return (
      <div className="bg-white pattern-diamond">
        {/* Back Button */}
        <section className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => {
                setShowOthersView(false);
                setShowBrandsView(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Brands
            </button>
          </div>
        </section>

        {/* Others Brands Selection Section */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-14 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 scroll-reveal">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                Select a <span className="text-red-600">Brand</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Choose a brand to explore our premium range of lubricants and products
              </p>
            </div>

            <div className="flex justify-center items-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8 max-w-7xl w-full">
                {othersBrands.map((company, index) => {
                  const normalizedLogoPath = company.image ? normalizeImageUrl(company.image) : '';
                  
                  return (
                  <button
                    key={company.id}
                    onClick={() => handleBrandSelect(company.id)}
                    className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-2 border-2 border-gray-100 hover:border-red-300 flex flex-col aspect-square scroll-reveal"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Decorative Corner Accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-600/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Logo - Direct in button, no inner container */}
                    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                      {normalizedLogoPath ? (
                        <img
                          src={normalizedLogoPath}
                          alt={company.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-400">
                          {company.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    {/* Brand Name */}
                    <div className="text-center pb-4 sm:pb-5">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                        {company.name}
                      </h3>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show main brands view (HP and Others)
  if (showBrandsView && selectedCompany === 'all') {
    return (
      <div className="bg-white pattern-diamond">
        {/* Brands Selection Section */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-14 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 scroll-reveal">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                Select a <span className="text-red-600">Brand</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Choose a brand to explore our premium range of lubricants and products
              </p>
            </div>

            {loading ? (
              <LoadingSpinner message="Loading brands..." fullScreen={false} />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 max-w-6xl w-full">
                {/* HP Brand Card */}
                {(() => {
                  const hpCompany = companies.find(c => c.id === 'hp' || c.id.toLowerCase() === 'hp');
                  if (!hpCompany) return null;
                  
                  const companyLogoMap: { [key: string]: string } = {
                    'hp': normalizeImageUrl('/images/sahni verticals/HP_SULLI5.png'),
                  };
                  
                  const logoPath = hpCompany.image || companyLogoMap['hp'] || '';
                  const normalizedLogoPath = logoPath ? normalizeImageUrl(logoPath) : '';
                  
                  return (
                    <button
                      key="hp"
                      onClick={() => handleBrandSelect('hp')}
                      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 hover:border-red-300 flex flex-col p-6 sm:p-8 scroll-reveal"
                    >
                      {/* Logo Container */}
                      <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center p-4 sm:p-6">
                          {normalizedLogoPath ? (
                            <img
                              src={normalizedLogoPath}
                              alt="HP Lubricants"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                              loading="eager"
                              fetchPriority="high"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.hp-fallback')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'hp-fallback text-4xl sm:text-5xl md:text-6xl font-bold text-gray-400';
                                  fallback.textContent = 'HP';
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-400">HP</div>
                          )}
                        </div>
                        
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </div>
                      
                      {/* Brand Name */}
                      <div className="text-center flex-shrink-0">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300 mb-2">
                          HP Lubricants
                        </h3>
                        <div className="flex items-center justify-center text-red-600 font-semibold text-xs sm:text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase tracking-wide">
                          <span>View Products</span>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })()}

                {/* Other Brands Cards */}
                {othersBrands.map((brand) => {
                  const normalizedLogoPath = brand.image ? normalizeImageUrl(brand.image) : '';
                  
                  return (
                    <button
                      key={brand.id}
                      onClick={() => handleBrandSelect(brand.id)}
                      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 hover:border-red-300 flex flex-col p-6 sm:p-8 scroll-reveal"
                    >
                      {/* Logo Container */}
                      <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center p-4 sm:p-6">
                          {normalizedLogoPath ? (
                            <img
                              src={normalizedLogoPath}
                              alt={brand.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.brand-fallback')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'brand-fallback text-4xl sm:text-5xl md:text-6xl font-bold text-gray-400';
                                  fallback.textContent = brand.name.charAt(0);
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-400">{brand.name.charAt(0)}</div>
                          )}
                        </div>
                        
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </div>
                      
                      {/* Brand Name */}
                      <div className="text-center flex-shrink-0">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300 mb-2">
                          {brand.name}
                        </h3>
                        <div className="flex items-center justify-center text-red-600 font-semibold text-xs sm:text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase tracking-wide">
                          <span>View Products</span>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-white pattern-diamond">
      {/* Hero Section - HP Banner only when HP is selected (not in brands view) */}
      {selectedCompany === 'hp' && !showBrandsView && (
        <section className="relative w-full overflow-hidden">
          <div className="relative w-full">
            <img
              src={normalizeImageUrl('/images/prdcts_hero.jpg')}
              alt="HP Lubricants - India's Largest Lube Marketer"
              className="w-full h-auto object-contain"
              loading="eager"
              fetchPriority="high"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="1920" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="1920" height="600" fill="#1e3a8a"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">HP LUBRICANTS</text></svg>`)}`;
              }}
            />
          </div>
        </section>
      )}

      {/* Back Button - Show when a brand is selected (not in brands view) */}
      {selectedCompany !== 'all' && !showBrandsView && (
        <section className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => {
                setSelectedCompany('all');
                setShowBrandsView(true);
                setShowOthersView(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Brands
            </button>
          </div>
        </section>
      )}

      {/* HP Inquiry Section - Show when HP is selected */}
      {selectedCompany === 'hp' && !showBrandsView && (
        <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">For Enquiries</h3>
                <a
                  href="tel:+919346699555"
                  className="text-2xl sm:text-3xl font-bold hover:text-yellow-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +91 93466 99555
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters Section - Only show when no brand is selected */}
      {selectedCompany === 'all' && (
      <section className="bg-white border-b border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Layout - Side by Side Filters */}
          <div className="hidden lg:block py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Company Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Filter size={24} className="text-red-600" />
                    <h2 className="text-lg font-bold text-gray-900">Filter by Company</h2>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompany(company.id)}
                      className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 hover:scale-105 ${
                        selectedCompany === company.id
                          ? 'bg-red-600 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {company.image && (
                        <img
                          src={normalizeImageUrl(company.image)}
                          alt={company.name}
                          className="h-5 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span>{typeof company.name === 'string' ? company.name : String(company.id || '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Filter size={24} className="text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Filter by Category</h3>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105 ${
                        selectedCategory === category.id
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {typeof category.label === 'string' ? category.label : String(category.id || '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout - Stacked Filters */}
          <div className="lg:hidden">
            {/* Company Filter */}
            <div className="py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <div className="flex items-center space-x-2">
                  <Filter size={20} className="text-red-600" />
                  <h2 className="text-base font-bold text-gray-900">Filter by Company</h2>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompany(company.id)}
                    className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-300 flex items-center gap-2 ${
                      selectedCompany === company.id
                        ? 'bg-red-600 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-900 hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    {company.image && (
                      <img
                        src={normalizeImageUrl(company.image)}
                        alt={company.name}
                        className="h-4 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span>{typeof company.name === 'string' ? company.name : String(company.id || '')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="py-4 bg-gray-100">
              <div className="flex items-center space-x-2 mb-3">
                <Filter size={16} className="text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Filter by Category</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-gray-900 text-white shadow-md scale-105'
                        : 'bg-white text-gray-900 hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    {typeof category.label === 'string' ? category.label : String(category.id || '')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Enhanced Products Grid - Professional Design */}
      <section id="products-section" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50 scroll-reveal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12 scroll-reveal">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Our <span className="text-red-600">Product Range</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Premium quality lubricants engineered for superior performance and reliability
            </p>
          </div>

          {/* Category Filter Buttons - Show when HP is selected */}
          {isHPSelected && hpCategories.length > 0 && !showBrandsView && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">Filter by Category</h3>
              <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
                <div className="flex gap-2 sm:gap-3 min-w-max pb-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setCurrentPageNum(1);
                    }}
                    className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base min-h-[44px] whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === 'all'
                        ? 'bg-red-600 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {hpCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setCurrentPageNum(1);
                      }}
                      className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base min-h-[44px] whitespace-nowrap flex-shrink-0 ${
                        selectedCategory === category
                          ? 'bg-red-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <LoadingSpinner message="Thank you for visiting us. Please wait..." fullScreen={false} />
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12 sm:py-16 md:py-20">
              <p className="text-base sm:text-lg text-red-600 mb-4 px-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm sm:text-base min-h-[44px]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Enhanced Product Grid */}
          {!loading && !error && (
            <>
              {/* Coming Soon for non-HP brands */}
              {selectedCompany !== 'all' && selectedCompany !== 'hp' && !showBrandsView ? (
                <div className="text-center py-20 sm:py-24 md:py-32 lg:py-40 relative overflow-hidden">
                  {/* Halftone pattern background effect */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0',
                    transform: 'rotate(-5deg)',
                    transformOrigin: 'center'
                  }}></div>
                  
                  <div className="relative z-10">
                    <div className="inline-block transform -rotate-2 sm:-rotate-1">
                      <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-gray-900 mb-2 sm:mb-4 leading-none tracking-tight" style={{
                        textShadow: '3px 3px 0px rgba(0,0,0,0.1), 6px 6px 0px rgba(0,0,0,0.05)',
                        transform: 'perspective(500px) rotateX(5deg)'
                      }}>
                        COMING
                      </h2>
                    </div>
                    <div className="inline-block transform rotate-1 sm:rotate-0.5 mt-2 sm:mt-4">
                      <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white mb-4 sm:mb-6 leading-none tracking-tight relative" style={{
                        textShadow: '3px 3px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.2)',
                        WebkitTextStroke: '2px #000',
                        transform: 'perspective(500px) rotateX(-5deg) translateY(-10px)'
                      }}>
                        SOON
                      </h2>
                    </div>
                    
                    {/* Halftone dots effect under text */}
                    <div className="mt-8 sm:mt-12 relative" style={{
                      backgroundImage: `radial-gradient(circle, #000 2px, transparent 2px)`,
                      backgroundSize: '15px 15px',
                      backgroundPosition: '0 0',
                      height: '100px',
                      opacity: 0.3,
                      transform: 'rotate(-5deg)',
                      clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)'
                    }}></div>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 sm:py-16 md:py-20 lg:py-32">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4 sm:mb-6">
                    <Droplet size={32} className="sm:w-12 sm:h-12 md:w-12 md:h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 px-2">No Products Found</h3>
                  <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-2">
                    We couldn't find any products matching your current filters. Try adjusting your selection to see more options.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCompany('all');
                      setSelectedCategory('all');
                    }}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base min-h-[44px]"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
                    {filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (setSelectedProductId) {
                          setSelectedProductId(product.id);
                        }
                        if (setCurrentPage) {
                          setCurrentPage('product-detail');
                        }
                      }}
                      className="group bg-white rounded-xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 border border-gray-200 hover:border-red-300 cursor-pointer relative scroll-reveal flex flex-col"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Product Image Container - Mobile Optimized */}
                      <div className="relative w-full h-56 sm:h-64 md:h-72 lg:h-80 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-8">
                        {product.image ? (
                          <img
                            src={normalizeImageUrl(product.image)}
                            alt={product.name}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            loading={index < 8 ? "eager" : "lazy"}
                            fetchPriority={index < 4 ? "high" : "auto"}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!imageErrors.has(product.id.toString())) {
                                setImageErrors(prev => new Set(prev).add(product.id.toString()));
                                const productName = product.name.substring(0, 15);
                                target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${productName}</text></svg>`)}`;
                              }
                            }}
                          />
                        ) : (
                          <Droplet size={80} className="text-red-600 opacity-50" />
                        )}
                        
                        {/* Category Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold uppercase shadow-lg whitespace-nowrap">
                            {typeof product.category === 'string' ? product.category : (product.category_name || 'Product')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-4 sm:p-5 md:p-6 bg-white flex flex-col flex-shrink-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 line-clamp-2 mb-2 text-center group-hover:text-red-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 line-clamp-2 text-center leading-relaxed">
                          {product.description || 'Premium quality product'}
                        </p>
                      </div>
                    </div>
                  ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {!loading && !error && allFilteredProducts.length > 0 && totalFilteredPages > 1 && (
                <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                  {/* Products count info */}
                  <div className="text-sm text-gray-600">
                    Showing page {currentPageNum} of {totalFilteredPages} 
                    <span className="hidden sm:inline"> ({totalFilteredProducts} filtered products)</span>
                  </div>
                  
                  {/* Pagination buttons */}
                  <div className="flex items-center gap-2">
                    {/* Previous button */}
                    <button
                      onClick={() => {
                        setCurrentPageNum(prev => Math.max(1, prev - 1));
                        setTimeout(() => {
                          const productsSection = document.getElementById('products-section');
                          if (productsSection) {
                            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      disabled={currentPageNum === 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[100px] ${
                        currentPageNum === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalFilteredPages <= 5) {
                          // Show all pages if 5 or less
                          pageNum = i + 1;
                        } else if (currentPageNum <= 3) {
                          // Show first 5 pages
                          pageNum = i + 1;
                        } else if (currentPageNum >= totalFilteredPages - 2) {
                          // Show last 5 pages
                          pageNum = totalFilteredPages - 4 + i;
                        } else {
                          // Show pages around current page
                          pageNum = currentPageNum - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPageNum(pageNum);
                              // Scroll to top of products section
                              setTimeout(() => {
                                const productsSection = document.getElementById('products-section');
                                if (productsSection) {
                                  productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[40px] ${
                              currentPageNum === pageNum
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {/* Show ellipsis if there are more pages */}
                      {totalFilteredPages > 5 && currentPageNum < totalFilteredPages - 2 && (
                        <>
                          <span className="px-2 text-gray-400">...</span>
                          <button
                            onClick={() => {
                              setCurrentPageNum(totalFilteredPages);
                              setTimeout(() => {
                                const productsSection = document.getElementById('products-section');
                                if (productsSection) {
                                  productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }}
                            className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            {totalFilteredPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Next button */}
                    <button
                      onClick={() => {
                        setCurrentPageNum(prev => Math.min(totalFilteredPages, prev + 1));
                        setTimeout(() => {
                          const productsSection = document.getElementById('products-section');
                          if (productsSection) {
                            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      disabled={currentPageNum === totalFilteredPages}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[100px] ${
                        currentPageNum === totalFilteredPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Enhanced Brand Section - Professional Design */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden scroll-reveal">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="bg-red-600/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide border border-red-600/30">
                Trusted Partners
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Authorized <span className="text-red-500">Distributors</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We are proud authorized distributors of leading lubricant brands, offering the finest quality products for all your automotive and industrial needs.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
            {(() => {
              // Always show all companies, not just from loaded products
              const allCompanies = [
                { id: 'hp', name: 'HP Lubricants', image: normalizeImageUrl('/images/sahni verticals/HP_SULLI5.png') },
                { id: 'mahindra', name: 'Mahindra', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/Mahindra1.png') },
                { id: 'jiobp', name: 'Jio BP', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/Jio-bp_logo.svg') },
                { id: 'superline', name: 'Superline', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/superline.png') },
                { id: 'reliance', name: 'Reliance', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/reliance lubricants.avif') },
                { id: 'balmerol', name: 'Balmerol', image: normalizeImageUrl('/images/sahni verticals/lubricant_brands/balmerol industrial.png') },
              ];
              
              return allCompanies.map((company) => {
              const normalizedLogoPath = company.image ? normalizeImageUrl(company.image) : '';
              const hasImageError = imageErrors.has(company.id);
              
              return (
                <div 
                  key={company.id} 
                  className="group bg-white/5 backdrop-blur-sm p-6 sm:p-8 rounded-2xl flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/20"
                >
                  {normalizedLogoPath && !hasImageError ? (
                    <div className="h-20 w-full sm:h-24 md:h-28 flex items-center justify-center mb-4 bg-white/5 rounded-lg p-3 group-hover:bg-white/10 transition-colors">
                      <img
                        src={normalizedLogoPath}
                        alt={typeof company.name === 'string' ? company.name : String(company.id || '')}
                        className="max-h-full max-w-full w-auto h-auto object-contain group-hover:scale-110 transition-transform duration-300"
                        onError={() => {
                          setImageErrors(prev => new Set(prev).add(company.id));
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-16 sm:h-20 md:h-24 w-full flex items-center justify-center mb-4">
                      <div className="text-2xl sm:text-3xl font-bold text-white/60">
                        {company.name && typeof company.name === 'string' ? company.name.charAt(0) : '?'}
                      </div>
                    </div>
                  )}
                  <div className="text-xs sm:text-sm font-semibold text-gray-300 text-center group-hover:text-white transition-colors">
                    {typeof company.name === 'string' ? company.name : String(company.id || '')}
                  </div>
                </div>
              );
            });
            })()}
          </div>
        </div>
      </section>
    </div>
  );
}

