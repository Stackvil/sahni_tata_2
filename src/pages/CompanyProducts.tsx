import { useState, useEffect } from 'react';
import { Droplet, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { productsAPI, companiesAPI, normalizeImageUrl } from '../services/api';

interface Product {
  id: number;
  name: string;
  image: string;
  description: string;
  specs: string;
  category: string;
  category_name?: string;
}

interface CompanyProductsProps {
  companyId: string;
  setCurrentPage?: (page: string) => void;
  setSelectedProductId?: (id: number) => void;
  onBack: () => void;
}

export default function CompanyProducts({ companyId, setCurrentPage, setSelectedProductId, onBack }: CompanyProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [companyName, setCompanyName] = useState<string>('Company');
  const [loading, setLoading] = useState(true);
  const [allLoadedProducts, setAllLoadedProducts] = useState<Product[]>([]);

  // Normalize company key function
  const normalizeCompanyKey = (company: any): string => {
    if (!company) return '';
    let companyStr = typeof company === 'string' ? company : String(company || '');
    let companyKey = companyStr.toLowerCase().replace(/\s+/g, '').replace('lubricants', '');
    if (companyKey.includes('jiobp') || companyKey.includes('jio-bp')) return 'jiobp';
    if (companyKey.includes('superline')) return 'superline';
    if (companyKey.includes('reliance')) return 'reliance';
    if (companyKey.includes('balmerol')) return 'balmerol';
    if (companyKey.includes('mahindra')) return 'mahindra';
    if (companyKey === 'hp' || companyKey.includes('hp')) return 'hp';
    return companyKey;
  };

  // Load all products at once
  const loadAllProducts = async () => {
    setLoading(true);
    
    try {
      const normalizedCompanyId = normalizeCompanyKey(companyId);
      let allProducts: any[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      
      // Fetch all pages until no more products
      let totalProductsInDB = 0;
      let totalPagesInDB = 0;
      
      while (hasMorePages) {
        const pageData = await productsAPI.getAll(currentPage, 100, ''); // Use large page size
        let pageProducts: any[] = [];
        
        if (Array.isArray(pageData)) {
          pageProducts = pageData;
        } else if (pageData?.products && Array.isArray(pageData.products)) {
          pageProducts = pageData.products;
        } else if (pageData?.data && Array.isArray(pageData.data)) {
          pageProducts = pageData.data;
        }
        
        // Store total and totalPages from first page
        if (currentPage === 1) {
          totalProductsInDB = pageData?.total || 0;
          totalPagesInDB = pageData?.total_pages || Math.ceil(totalProductsInDB / 100);
          console.log(`[CompanyProducts] First page: Total products in DB=${totalProductsInDB}, Total pages=${totalPagesInDB}`);
        }
        
        console.log(`[CompanyProducts] Page ${currentPage}/${totalPagesInDB || '?'}: Loaded ${pageProducts.length} products from API`);
        
        if (pageProducts.length === 0) {
          console.log(`[CompanyProducts] No more products on page ${currentPage}, stopping`);
          hasMorePages = false;
          break;
        }
        
        // Filter products by company
        const companyProducts = pageProducts.filter((p: any) => {
          const productCompany = p.company || p.company_key || '';
          const productCompanyStr = typeof productCompany === 'string' ? productCompany : String(productCompany || '');
          const normalizedProductCompany = normalizeCompanyKey(productCompanyStr);
          return normalizedProductCompany === normalizedCompanyId;
        });
        
        console.log(`[CompanyProducts] Page ${currentPage}: Found ${companyProducts.length} products for company ${normalizedCompanyId} (out of ${pageProducts.length} total)`);
        
        allProducts = [...allProducts, ...companyProducts];
        
        // Check if there are more pages
        // Continue if we haven't reached the last page
        if (totalPagesInDB > 0) {
          hasMorePages = currentPage < totalPagesInDB;
        } else {
          // If totalPages is not available, continue if we got a full page (might be more)
          hasMorePages = pageProducts.length === 100;
        }
        
        currentPage++;
        
        // Safety limit to prevent infinite loops
        if (currentPage > 200) {
          console.warn('[CompanyProducts] Reached safety limit (200 pages), stopping pagination');
          break;
        }
        
        // Also stop if we've fetched all pages
        if (totalPagesInDB > 0 && currentPage > totalPagesInDB) {
          console.log(`[CompanyProducts] Reached last page (${totalPagesInDB}), stopping`);
          hasMorePages = false;
          break;
        }
      }
      
      console.log(`[CompanyProducts] Finished loading. Total products for ${normalizedCompanyId}: ${allProducts.length}`);
      
      setAllLoadedProducts(allProducts);
      
      // Extract categories from all products
      const categorySet = new Set<string>();
      allProducts.forEach((p: any) => {
        const cat = p.category || p.category_name || '';
        let categoryName = '';
        if (cat && typeof cat === 'object') {
          const catObj = cat as any;
          categoryName = catObj.NAME || catObj.name || catObj.LABEL || catObj.label || catObj.id || '';
        } else if (cat && typeof cat === 'string') {
          categoryName = cat;
        }
        if (categoryName && typeof categoryName === 'string' && categoryName.trim() !== '') {
          categorySet.add(categoryName.toLowerCase().trim());
        }
      });
      
      const dynamicCategories = Array.from(categorySet)
        .filter(cat => cat !== '')
        .map(cat => ({
          id: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      
      setCategories([
        { id: 'all', label: 'All Products' },
        ...dynamicCategories
      ]);
      
    } catch (error) {
      console.error('[CompanyProducts] Failed to load products:', error);
      setAllLoadedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCompanyProducts = async () => {
      setAllLoadedProducts([]);
      await loadAllProducts();
      
      // Get company name
      try {
        const companiesData = await companiesAPI.getAll();
        if (companiesData && Array.isArray(companiesData)) {
          const company = companiesData.find((c: any) => {
            const cId = c.id || c.key || '';
            const normalizedCId = normalizeCompanyKey(cId);
            const normalizedId = normalizeCompanyKey(companyId);
            return normalizedCId === normalizedId;
          });
          if (company) {
            setCompanyName(company.name || company.title || companyId);
          } else {
            setCompanyName(companyId.charAt(0).toUpperCase() + companyId.slice(1));
          }
        } else {
          setCompanyName(companyId.charAt(0).toUpperCase() + companyId.slice(1));
        }
      } catch (err) {
        console.warn('[CompanyProducts] Failed to load company name:', err);
        setCompanyName(companyId.charAt(0).toUpperCase() + companyId.slice(1));
      }
    };
    
    loadCompanyProducts();
  }, [companyId]);

  const filteredProducts = selectedCategory === 'all' 
    ? allLoadedProducts 
    : allLoadedProducts.filter(p => {
        const cat = p.category || p.category_name || '';
        let productCategory = '';
        if (cat && typeof cat === 'object') {
          const catObj = cat as any;
          productCategory = (catObj.NAME || catObj.name || catObj.LABEL || catObj.label || catObj.id || '').toLowerCase();
        } else if (cat && typeof cat === 'string') {
          productCategory = cat.toLowerCase();
        }
        const selectedCat = selectedCategory.toLowerCase();
        return productCategory === selectedCat;
      });

  if (loading) {
    return (
      <LoadingSpinner 
        message="Thank you for visiting us. Please wait..." 
        fullScreen={true} 
      />
    );
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gray-900 text-white py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center text-white hover:text-red-400 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Companies
          </button>
        </div>
      </section>

      {/* Company Header */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{companyName} Products</h1>
          <p className="text-xl text-red-100">Premium quality lubricants for superior performance</p>
        </div>
      </section>

      {/* Category Filter */}
      {categories.length > 1 && (
        <section className="bg-gray-50 py-6 sticky top-[73px] z-40 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-semibold transition-all ${
                    selectedCategory === category.id
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
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
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 group cursor-pointer aspect-square flex flex-col"
                  >
                    <div className="relative flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center p-3">
                      <img
                        src={normalizeImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full max-h-[120px] object-contain mx-auto"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const productName = product.name.substring(0, 15);
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${productName}</text></svg>`)}`;
                        }}
                      />
                    </div>
                    
                    <div className="p-3 text-center flex-shrink-0">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-600 line-clamp-1 mb-1">{product.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length > 0 && (
                <div className="text-center mt-8 text-gray-500">
                  <p>Showing all {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Droplet size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">No products found.</p>
              <p className="text-sm text-gray-500 mt-2">
                {allLoadedProducts.length > 0 
                  ? `Found ${allLoadedProducts.length} product(s) for ${companyName}, but none match the "${selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.label || selectedCategory}" category.`
                  : `No products found for ${companyName}.`}
              </p>
              {allLoadedProducts.length > 0 && selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Show All Products
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
