import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MoreVertical, Package } from 'lucide-react';
import { productsAPI, normalizeImageUrl } from '../../services/api';

interface Product {
  id: string | number;
  name: string;
  category: string;
  image: string;
  description: string;
  specs: string;
  company: string;
  company_key?: string;
  category_name?: string;
  createdAt?: string;
  status?: 'Published' | 'Inactive' | 'Draft';
}

interface AdminProductsProps {
  isDarkMode?: boolean;
}

export default function AdminProducts({ isDarkMode = false }: AdminProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'automotive',
    category_name: 'automotive',
    image: '',
    description: '',
    specs: '',
    company: 'hp',
    company_key: 'hp',
    status: 'Published',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Helper function to extract string from category (handles both string and object)
  const extractCategoryString = (category: any): string => {
    if (category === null || category === undefined) return 'automotive';
    if (typeof category === 'string') {
      return category.trim() || 'automotive';
    }
    if (typeof category === 'object' && category !== null) {
      // Try common object properties in order of preference
      const value = category.name || category.label || category.NAME || category.LABEL || category.id || category.ID;
      if (value && typeof value === 'string') {
        return value.trim() || 'automotive';
      }
      if (value) {
        return String(value).trim() || 'automotive';
      }
      return 'automotive';
    }
    const str = String(category).trim();
    return str || 'automotive';
  };

  // Helper function to extract string from company (handles both string and object)
  const extractCompanyString = (company: any): string => {
    if (company === null || company === undefined) return 'Unknown';
    if (typeof company === 'string') {
      return company.trim() || 'Unknown';
    }
    if (typeof company === 'object' && company !== null) {
      // Try common object properties in order of preference
      const value = company.name || company.key || company.NAME || company.KEY || company.id || company.ID;
      if (value && typeof value === 'string') {
        return value.trim() || 'Unknown';
      }
      if (value) {
        return String(value).trim() || 'Unknown';
      }
      return 'Unknown';
    }
    const str = String(company).trim();
    return str || 'Unknown';
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll(1, 100, '');
      
      // Backend returns: { page, limit, total, total_pages, products: [...] }
      let backendProducts: any[] = [];
      if (Array.isArray(response)) {
        // Fallback for old format
        backendProducts = response;
      } else if (response && Array.isArray(response.products)) {
        backendProducts = response.products;
      } else if (response && Array.isArray(response.data)) {
        backendProducts = response.data;
      } else {
        console.warn('Unexpected response format from productsAPI:', response);
        backendProducts = [];
      }
      
      // Transform backend products to match frontend format
      // Backend returns: category, company (not category_name, company_key)
      // Handle cases where category/company might be objects
      const transformedProducts: Product[] = backendProducts.map((p: any) => {
        // Ensure we extract strings from objects
        const categoryStr = extractCategoryString(p.category || p.category_name);
        const companyStr = extractCompanyString(p.company || p.company_key);
        
        // Normalize image URL - backend might return null, empty string, or a path
        // Check multiple possible field names for image
        const rawImage = p.image || p.image_url || p.imageUrl || null;
        const imageUrl = rawImage ? normalizeImageUrl(String(rawImage)) : '';
        
        // Debug logging for image field
        if (p.id && !imageUrl && rawImage) {
          console.warn(`[AdminProducts] Image normalization failed for product ${p.id}:`, rawImage);
        }
        
        return {
          id: p.id,
          name: p.name || '',
          category: categoryStr,
          category_name: categoryStr, // Use extracted category string
          image: imageUrl, // Normalized image URL
          description: p.description || '',
          specs: p.specs || '',
          company: companyStr,
          company_key: companyStr, // Use extracted company string
          createdAt: p.created_at || p.createdAt || new Date().toISOString().split('T')[0],
          status: 'Published' as const,
        };
      });
      
      // Double-check: ensure no objects remain in the transformed data
      const validatedProducts = transformedProducts.map(p => ({
        ...p,
        category: extractCategoryString(p.category),
        company: extractCompanyString(p.company),
        category_name: extractCategoryString(p.category_name || p.category),
        company_key: extractCompanyString(p.company_key || p.company),
        // Ensure image is normalized
        image: p.image ? normalizeImageUrl(p.image) : '',
      }));
      
      // Debug: Log products with missing images
      const productsWithoutImages = validatedProducts.filter(p => !p.image);
      if (productsWithoutImages.length > 0) {
        console.warn(`[AdminProducts] ${productsWithoutImages.length} products without images:`, 
          productsWithoutImages.map(p => ({ id: p.id, name: p.name })));
      }
      
      setProducts(validatedProducts);
      console.log('Products loaded from backend:', validatedProducts.length);
    } catch (error) {
      console.error('Error loading products from backend:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      category: 'automotive',
      category_name: 'automotive',
      image: '',
      description: '',
      specs: '',
      company: 'hp',
      company_key: 'hp',
      status: 'Published',
      createdAt: new Date().toISOString().split('T')[0],
    });
    setImageFile(null);
    setImagePreview(null);
    // Scroll to top when adding
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setIsAdding(false);
    // Ensure all fields are set, including category_name and company_key
    // Extract strings from category and company in case they're objects
    const categoryStr = extractCategoryString(product.category_name || product.category);
    const companyStr = extractCompanyString(product.company_key || product.company);
    
    // Normalize image URL if it exists
    const normalizedImage = product.image ? normalizeImageUrl(product.image) : null;
    
    setFormData({
      ...product,
      category: categoryStr,
      category_name: categoryStr,
      company: companyStr,
      company_key: companyStr,
      image: normalizedImage || '', // Store normalized image URL in formData
    });
    setImageFile(null); // Reset file input - no new file selected yet
    setImagePreview(normalizedImage); // Show existing image as preview
    setShowActionsMenu(null);
    // Scroll to top when editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('Editing product:', product);
    console.log('Form data set to:', {
      ...product,
      category: categoryStr,
      category_name: categoryStr,
      company: companyStr,
      company_key: companyStr,
      image: normalizedImage,
    });
    console.log('[AdminProducts] Image preview set to:', normalizedImage);
  };

  const handleSave = async () => {
    if (isAdding) {
      // For create: all fields are required including image
      if (!formData.name || !formData.description || !formData.company_key || !formData.category_name || !imageFile) {
        alert('Please fill in all required fields (Name, Description, Company, Category, Image)');
        return;
      }
      if (!formData.specs) {
        alert('Please fill in Specs field (required)');
        return;
      }
    } else {
      // For update: name and description are required, image is optional
      if (!formData.name || !formData.description) {
        alert('Please fill in all required fields (Name, Description)');
        return;
      }
    }

    try {
      if (isAdding) {
        // Create new product via backend - ALL fields in FormData, all required
        // Double-check imageFile right before sending
        console.log('[AdminProducts] Pre-flight check - imageFile state:', {
          hasImageFile: !!imageFile,
          imageFileType: typeof imageFile,
          isFileInstance: imageFile instanceof File,
          imageFileDetails: imageFile ? {
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type
          } : null
        });
        
        if (!imageFile) {
          alert('Image is required. Please select an image file.');
          return;
        }
        
        // Verify imageFile is actually a File before sending
        if (!(imageFile instanceof File)) {
          console.error('[AdminProducts] imageFile is not a File object:', typeof imageFile, imageFile);
          alert('Invalid image file. Please select a file again.');
          return;
        }
        
        // Verify file has content
        if (imageFile.size === 0) {
          console.error('[AdminProducts] Image file is empty:', imageFile.name);
          alert('Selected image file is empty. Please select a valid image file.');
          return;
        }
        
        // File size validation - prevent 504 timeout errors
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
        const RECOMMENDED_FILE_SIZE = 2 * 1024 * 1024; // 2MB recommended
        
        if (imageFile.size > MAX_FILE_SIZE) {
          const fileSizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
          alert(
            `Image file is too large (${fileSizeMB} MB). Maximum size is 5 MB.\n\n` +
            `Please compress or resize the image before uploading.\n` +
            `Recommended size is under 2 MB for faster uploads and to avoid timeout errors.`
          );
          return;
        }
        
        if (imageFile.size > RECOMMENDED_FILE_SIZE) {
          const fileSizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
          const confirmUpload = confirm(
            `Warning: Image file is large (${fileSizeMB} MB). This may cause upload timeout errors.\n\n` +
            `Recommended size is under 2 MB. Do you want to continue anyway?`
          );
          if (!confirmUpload) {
            return;
          }
        }
        
        const productData: {
          name: string;
          company_key: string;
          category_name: string;
          description: string; // Required by backend
          specs: string; // Required by backend
          image: File; // Required by backend
        } = {
          name: formData.name!.trim(),
          company_key: (formData.company_key || formData.company || 'hp').trim(),
          category_name: (formData.category_name || formData.category || 'automotive').trim(),
          description: formData.description!.trim(), // Required
          specs: formData.specs?.trim() || '', // Required (empty string if not provided)
          image: imageFile, // Required - pass the File object directly
        };
        
        console.log('[AdminProducts] Image file selected for upload:', {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type,
          isFile: imageFile instanceof File,
          lastModified: new Date(imageFile.lastModified).toISOString()
        });
        
        console.log('[AdminProducts] Creating product with data:', {
          ...productData,
          image: `[File: ${imageFile.name}, ${imageFile.size} bytes, ${imageFile.type}]`
        });
        
        // Final verification before API call
        if (!(productData.image instanceof File)) {
          console.error('[AdminProducts] CRITICAL: productData.image is not a File object right before API call!', {
            type: typeof productData.image,
            value: productData.image
          });
          alert('Image file was lost. Please select the image file again.');
          return;
        }
        
        const result = await productsAPI.create(productData);
        console.log('Product created successfully:', result);
        console.log('Product image in response:', result?.image || result?.image_url || 'No image field found');
        
        // Reload products from backend
        await loadProducts();
        setIsAdding(false);
        
          // Reset form
          setFormData({ 
            name: '', 
            category: 'automotive', 
            category_name: 'automotive', 
            image: '', 
            description: '', 
            specs: '', 
            company: 'hp', 
            company_key: 'hp', 
            status: 'Published' 
          });
          setImageFile(null);
          setImagePreview(null);
          
          // Scroll to top after save
          window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (editingId) {
        // Update product via backend
        if (!formData.name || !formData.description) {
          alert('Please fill in all required fields (Name, Description)');
          return;
        }

        const productData: {
          name: string;
          description: string;
          specs?: string;
          category_name?: string;
          company_key?: string;
          image?: File; // Only File, not string - strings are not sent for updates
        } = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          specs: formData.specs?.trim() || '',
          // Include category_name and company_key so they can be updated
          category_name: formData.category_name || formData.category || 'automotive',
          company_key: formData.company_key || formData.company || 'hp',
        };
        
        // Include image file ONLY if a new file was selected
        // If no new file, don't include image field at all - backend will keep existing image
        if (imageFile && imageFile instanceof File) {
          productData.image = imageFile;
          console.log('[AdminProducts] Image file selected for update:', {
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type
          });
        } else {
          // Explicitly don't set image field if no new file
          // This ensures we don't accidentally send the existing image URL
          console.log('[AdminProducts] No new image file selected for update - backend will keep existing image');
        }
        
        console.log('Updating product with ID:', editingId);
        console.log('Updating product with data:', productData);
        console.log('[AdminProducts] Current formData.image:', formData.image);
        console.log('[AdminProducts] imageFile (new file):', imageFile ? { name: imageFile.name, size: imageFile.size } : 'null');
        console.log('[AdminProducts] imagePreview (existing):', imagePreview);
        
        try {
          const result = await productsAPI.update(String(editingId), productData);
          console.log('Product updated successfully:', result);
          console.log('Product image in response:', result?.image || result?.image_url || 'No image field found');
          
          // Check if image was lost
          if (!result?.image && formData.image) {
            console.warn('[AdminProducts] WARNING: Image was lost during update! Original image:', formData.image);
          }
          
          // Reload products from backend
          await loadProducts();
          setEditingId(null);
          
          // Reset form
          setFormData({ 
            name: '', 
            category: 'automotive', 
            category_name: 'automotive', 
            image: '', 
            description: '', 
            specs: '', 
            company: 'hp', 
            company_key: 'hp', 
            status: 'Published' 
          });
          
          // Scroll to top after save
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (updateError: any) {
          console.error('Update error:', updateError);
          throw updateError; // Re-throw to be caught by outer catch
        }
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      let errorMessage = error?.message || error?.detail || 'Failed to save product. Please try again.';
      
      // Better error messages for specific error types
      if (errorMessage.includes('504') || errorMessage.includes('Timeout') || errorMessage.includes('Gateway')) {
        errorMessage = 
          'Upload Timeout Error!\n\n' +
          'The upload took too long and timed out. This usually happens when:\n\n' +
          '• The image file is too large (try compressing/resizing to under 2 MB)\n' +
          '• Slow network connection\n' +
          '• Server is processing slowly\n\n' +
          'Solutions:\n' +
          '1. Compress or resize your image to under 2 MB\n' +
          '2. Try again when network is faster\n' +
          '3. Contact administrator if problem persists';
      }
      
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(String(id));
        await loadProducts(); // Reload products from backend
        setShowActionsMenu(null);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', category: 'automotive', category_name: 'automotive', image: '', description: '', specs: '', company: 'hp', company_key: 'hp', status: 'Published' });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[AdminProducts] File input changed:', {
      filesCount: e.target.files?.length || 0,
      file: file ? {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      } : null
    });
    
    if (file) {
      // Verify file is actually a File object
      if (!(file instanceof File)) {
        console.error('[AdminProducts] Selected item is not a File object:', typeof file, file);
        alert('Invalid file selected. Please try again.');
        return;
      }
      
      // Verify file has content
      if (file.size === 0) {
        console.error('[AdminProducts] Selected file is empty:', file.name);
        alert('Selected file is empty. Please select a valid image file.');
        return;
      }
      
      // File size validation - warn about large files immediately
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      const RECOMMENDED_FILE_SIZE = 2 * 1024 * 1024; // 2MB recommended
      
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(
          `Image file is too large (${fileSizeMB} MB). Maximum size is 5 MB.\n\n` +
          `Please compress or resize the image before uploading.\n` +
          `Recommended size is under 2 MB to avoid timeout errors.`
        );
        // Clear the file input
        e.target.value = '';
        return;
      }
      
      if (file.size > RECOMMENDED_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.warn(`[AdminProducts] Large file detected (${fileSizeMB} MB). Upload may cause timeout errors.`);
        // Still allow it, but show warning in UI if needed
      }
      
      console.log('[AdminProducts] Valid file selected, setting state:', {
        name: file.name,
        size: file.size,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        type: file.type,
        isFile: file instanceof File,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log('[AdminProducts] Image preview created, preview length:', (reader.result as string)?.length || 0);
      };
      reader.onerror = () => {
        console.error('[AdminProducts] Error reading file for preview');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('[AdminProducts] No file selected - clearing state');
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const getStatusBadge = (status: string = 'Published') => {
    const statusClasses = {
      Published: isDarkMode ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-100 text-green-700 border-green-200',
      Inactive: isDarkMode ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-200',
      Draft: isDarkMode ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return statusClasses[status as keyof typeof statusClasses] || statusClasses.Published;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-3 sm:py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 min-h-[48px] touch-manipulation"
        >
          <Plus size={18} />
          <span className="text-sm sm:text-base">Add Product</span>
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-4`}>
          <h3 className={`text-base sm:text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isAdding ? 'Add New Product' : 'Edit Product'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category *</label>
              <select
                value={formData.category_name || formData.category || 'automotive'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, category_name: e.target.value })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                required
              >
                <option value="automotive">Automotive</option>
                <option value="industrial">Industrial</option>
                <option value="greases">Greases</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Company *</label>
              <select
                value={formData.company_key || formData.company || 'hp'}
                onChange={(e) => setFormData({ ...formData, company: e.target.value, company_key: e.target.value })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                required
              >
                <option value="hp">HP</option>
                <option value="mahindra">Mahindra</option>
                <option value="jiobp">Jio-bp</option>
                <option value="reliance">Reliance</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
              <select
                value={formData.status || 'Published'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Published' | 'Inactive' | 'Draft' })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <option value="Published">Published</option>
                <option value="Inactive">Inactive</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Image * {isAdding && <span className="text-red-500">(Required)</span>}
              </label>
              <input
                key={editingId || 'new'} // Reset input when switching between add/edit modes
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700' 
                    : 'bg-white border-gray-200 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700'
                }`}
                required={isAdding}
              />
              {/* Debug info - show selected file */}
              {imageFile && (
                <div className={`text-xs mt-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  <p>✓ Selected: {imageFile.name}</p>
                  <p className={`mt-1 ${
                    imageFile.size > 2 * 1024 * 1024 
                      ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') 
                      : (isDarkMode ? 'text-green-400' : 'text-green-600')
                  }`}>
                    File size: {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
                    {imageFile.size > 2 * 1024 * 1024 && (
                      <span className="ml-1">⚠ (Large file - may cause timeout)</span>
                    )}
                    {imageFile.size > 5 * 1024 * 1024 && (
                      <span className="ml-1 text-red-500">❌ (Too large - will fail)</span>
                    )}
                  </p>
                  <p>Type: {imageFile.type}</p>
                </div>
              )}
              {isAdding && !imageFile && (
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  ⚠ Image file is required (Recommended: under 2 MB to avoid timeout errors)
                </p>
              )}
              {imagePreview && (
                <div className="mt-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-contain rounded-lg border border-gray-200"
                  />
                </div>
              )}
              {!imagePreview && formData.image && typeof formData.image === 'string' && (
                <div className="mt-3">
                  <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current image:</p>
                  <img 
                    src={formData.image} 
                    alt="Current" 
                    className="w-full h-48 object-contain rounded-lg border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description * {isAdding && <span className="text-red-500">(Required)</span>}
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                rows={3}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Specs * {isAdding && <span className="text-red-500">(Required)</span>}
              </label>
              <textarea
                value={formData.specs || ''}
                onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                rows={3}
                placeholder="Enter product specifications (JSON format or plain text)"
                required={isAdding}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-medium transition-colors min-h-[48px] touch-manipulation"
            >
              <Save size={18} />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className={`flex items-center justify-center gap-2 px-6 py-3 sm:py-2 rounded-xl font-medium transition-colors min-h-[48px] touch-manipulation ${
                isDarkMode 
                  ? 'bg-gray-600 hover:bg-gray-500 active:bg-gray-400 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900'
              }`}
            >
              <X size={18} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      <div className={`overflow-x-auto rounded-xl border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} shadow-sm -mx-3 sm:mx-0`}>
        <table className={`w-full min-w-[800px] ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
          <thead>
            <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} sticky top-0 z-10`}>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Product name</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Category</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">ID</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Company</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold hidden md:table-cell">Created At</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Status</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className={`inline-flex flex-col items-center p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-all duration-300`}>
                    <Package className={`mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={48} />
                    <p className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>No Products Found</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click "Add Product" to create your first product</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr 
                  key={product.id} 
                  className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-all duration-200 ${
                    index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50')
                  }`}
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="min-w-0">
                        <div className={`font-semibold text-sm sm:text-base truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</div>
                        {product.specs && (
                          <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.specs}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {extractCategoryString(product.category)}
                    </span>
                  </td>
                  <td className={`px-3 sm:px-6 py-3 sm:py-4 font-mono text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    P-{String(product.id).padStart(4, '0')}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {extractCompanyString(product.company)}
                    </span>
                  </td>
                  <td className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm hidden md:table-cell ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusBadge(product.status)}`}>
                      {product.status || 'Published'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowActionsMenu(showActionsMenu === product.id ? null : product.id)}
                        className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation ${
                          isDarkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-gray-100 active:bg-gray-200'
                        }`}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {showActionsMenu === product.id && (
                        <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-10 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            onClick={() => handleEdit(product)}
                            className={`w-full text-left px-4 py-3 text-sm rounded-t-xl hover:bg-purple-50 active:bg-purple-100 transition-colors min-h-[44px] flex items-center touch-manipulation ${
                              isDarkMode ? 'text-gray-300 hover:bg-gray-600 active:bg-gray-500' : 'text-gray-700'
                            }`}
                          >
                            <Edit size={14} className="inline mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className={`w-full text-left px-4 py-3 text-sm rounded-b-xl hover:bg-red-50 active:bg-red-100 transition-colors min-h-[44px] flex items-center touch-manipulation ${
                              isDarkMode ? 'text-red-400 hover:bg-gray-600 active:bg-gray-500' : 'text-red-600'
                            }`}
                          >
                            <Trash2 size={14} className="inline mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {products.length > 0 && (
        <div className={`flex items-center justify-between mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <button className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              1
            </button>
            <button className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}>
              2
            </button>
            <button className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}>
              3
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
