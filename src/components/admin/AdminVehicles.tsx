import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MoreVertical, Car } from 'lucide-react';
import { Vehicle } from '../../data/tataVehicles';
import { vehiclesAPI } from '../../services/api';
import { loadVehicles } from '../../data/tataVehicles';

interface AdminVehiclesProps {
  isDarkMode?: boolean;
}

export default function AdminVehicles({ isDarkMode = false }: AdminVehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    name: '',
    category: 'ace',
    subcategory: '',
    images: [],
    description: '',
    price: '',
    features: [],
    specs: {},
    status: 'Published',
  });
  const [imageFiles, setImageFiles] = useState<Map<number, File>>(new Map());

  // Subcategory options based on category
  const getSubcategories = (category: string): string[] => {
    switch (category) {
      case 'ev':
        return ['Ace EV 1000', 'Ace Pro EV'];
      case 'ace':
        return [
          'ACE CNG 2.0 (Bi-Fuel)',
          'Ace Diesel',
          'Ace Flex Fuel',
          'Ace Gold CNG',
          'Ace Gold CNG Plus',
          'Ace Gold Diesel',
          'Ace Gold Petrol',
          'Ace Gold Plus',
          'Ace HT+',
          'Ace Pro Bi-fuel',
          'Ace Pro Petrol'
        ];
      case 'intra':
        return ['Intra V10', 'Intra V20', 'Intra V20 Gold', 'Intra V30 Gold', 'Intra V50 Gold', 'Intra V70 Gold'];
      case 'yodha':
        return [
          'Winger Cargo',
          'Yodha 1200',
          'Yodha 1700',
          'Yodha 2.0',
          'Yodha CNG',
          'Yodha Crew Cab',
          'Yodha Crew Cab 4x2',
          'Yodha Crew Cab 4x4',
          'Yodha Ex Crew Cab',
          'Yodha Ex Single Cab',
          'Yodha Single Cab'
        ];
      case 'massey':
        return [
          '241 DI',
          'MF 1035 Dost',
          'MF 1035 R',
          'MF 241 PD PD',
          'MF 245',
          'MF 30',
          'MF 5245',
          'MF 6026',
          'MF 6036',
          'MF 7250',
          'Mf1035 Super Plus',
          'Mf244'
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    loadVehiclesData();
  }, []);

  const loadVehiclesData = async () => {
    try {
      setLoading(true);
      // Load vehicles from backend only
      const backendVehicles = await loadVehicles();
      setVehicles(backendVehicles);
    } catch (error) {
      console.error('Error loading vehicles from backend:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      category: 'ace',
      subcategory: '',
      images: [],
      description: '',
      price: '',
      features: [],
      specs: {},
      status: 'Published',
      createdAt: new Date().toISOString().split('T')[0],
    });
    setImageFiles(new Map());
    // Scroll to top when adding
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setIsAdding(false);
    setFormData({ ...vehicle, status: (vehicle as any).status || 'Published' });
    setImageFiles(new Map());
    setShowActionsMenu(null);
    // Scroll to top when editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      alert('Please fill in all required fields (Name, Description)');
      return;
    }

    try {
      if (isAdding) {
        // Create vehicle in backend only
        // Convert image files to array: use File objects where available, otherwise use URLs
        // Filter out empty strings and data URLs (we only want File objects or valid URLs)
        const imagesArray: (string | File)[] = (formData.images || [])
          .map((img, index) => {
            const file = imageFiles.get(index);
            // Prefer File object over data URL or empty string
            if (file) {
              return file;
            }
            // If it's a data URL (from FileReader preview), skip it - we want the File object
            if (typeof img === 'string' && img.startsWith('data:')) {
              return null;
            }
            // Return valid string URLs
            if (typeof img === 'string' && img.trim() !== '') {
              return img;
            }
            return null;
          })
          .filter((img): img is string | File => img !== null && img !== undefined);
        
        const catalogFile = imageFiles.get(-1) as File | undefined;
        
        const vehicleData: {
          name: string;
          category: string;
          subcategory?: string;
          description?: string;
          size?: string;
          popular?: boolean;
          specs?: string;
          images?: (string | File)[];
          features?: string | null; // Backend expects string | null, not array
          catalog?: File;
        } = {
          name: formData.name!,
          category: formData.category || 'ace',
          subcategory: formData.subcategory || undefined,
          description: formData.description || '',
          size: (formData as any).size || undefined,
          popular: (formData as any).popular || false,
          specs: formData.specs ? JSON.stringify(formData.specs) : undefined,
          // Convert features array to comma-separated string
          features: formData.features && formData.features.length > 0 
            ? formData.features.join(', ') 
            : null,
          catalog: catalogFile,
        };
        
        // Only include images if we have actual images (not empty array)
        if (imagesArray.length > 0) {
          vehicleData.images = imagesArray;
        }
        
        await vehiclesAPI.create(vehicleData);
        
        // Reload vehicles from backend
        await loadVehiclesData();
        setIsAdding(false);
        setImageFiles(new Map());
      } else if (editingId) {
        // Update vehicle in backend only
        // Convert image files to array: use File objects where available, otherwise use URLs
        // Filter out empty strings and data URLs (we only want File objects or valid URLs)
        const imagesArray: (string | File)[] = (formData.images || [])
          .map((img, index) => {
            const file = imageFiles.get(index);
            // Prefer File object over data URL or empty string
            if (file) {
              return file;
            }
            // If it's a data URL (from FileReader preview), skip it - we want the File object
            if (typeof img === 'string' && img.startsWith('data:')) {
              return null;
            }
            // Return valid string URLs
            if (typeof img === 'string' && img.trim() !== '') {
              return img;
            }
            return null;
          })
          .filter((img): img is string | File => img !== null && img !== undefined);
        
        // Backend requires name and category for update
        if (!formData.name || !formData.category) {
          alert('Name and Category are required fields');
          return;
        }
        
        const catalogFile = imageFiles.get(-1) as File | undefined;
        
        const vehicleData: {
          name: string; // Required by backend
          category: string; // Required by backend
          subcategory?: string | null;
          description?: string | null;
          size?: string | null;
          popular?: boolean;
          specs?: string | null;
          images?: (string | File)[];
          features?: string | null; // Backend expects string | null, not array
          catalog?: File;
        } = {
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory || null,
          description: formData.description || null,
          size: (formData as any).size || null,
          popular: (formData as any).popular || undefined,
          specs: formData.specs ? JSON.stringify(formData.specs) : null,
          // Convert features array to string (comma-separated) or null
          features: formData.features && formData.features.length > 0 
            ? formData.features.join(', ') 
            : null,
          catalog: catalogFile,
        };
        
        // Only include images if we have actual images (not empty array)
        if (imagesArray.length > 0) {
          vehicleData.images = imagesArray;
        }
        
        await vehiclesAPI.update(String(editingId), vehicleData);
        
        // Reload vehicles from backend
        await loadVehiclesData();
        setEditingId(null);
        setImageFiles(new Map());
      }
      setFormData({ name: '', category: 'ace', subcategory: '', images: [], description: '', price: '', features: [], specs: {}, status: 'Published' });
      // Scroll to top after save
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      alert(error?.message || 'Failed to save vehicle. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        // Delete vehicle from backend only
        await vehiclesAPI.delete(String(id));
        
        // Reload vehicles from backend
        await loadVehiclesData();
        setShowActionsMenu(null);
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Failed to delete vehicle. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
      setFormData({ name: '', category: 'ace', subcategory: '', images: [], description: '', price: '', features: [], specs: {}, status: 'Published' });
      setImageFiles(new Map());
    };

  const handleImageFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newImageFiles = new Map(imageFiles);
      newImageFiles.set(index, file);
      setImageFiles(newImageFiles);
      
      // Update preview in formData.images
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...(formData.images || [])];
        newImages[index] = reader.result as string;
        setFormData({ ...formData, images: newImages });
      };
      reader.readAsDataURL(file);
    } else {
      // Remove file from map
      const newImageFiles = new Map(imageFiles);
      newImageFiles.delete(index);
      setImageFiles(newImageFiles);
    }
  };

  const addImage = () => {
    setFormData({
      ...formData,
      images: [...(formData.images || []), ''],
    });
  };

  const removeImage = (index: number) => {
    const newImages = formData.images?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, images: newImages });
  };

  const addFeature = () => {
    const feature = prompt('Enter feature:');
    if (feature) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), feature],
      });
    }
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, features: newFeatures });
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
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Vehicle
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6 mb-6 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isAdding ? 'Add New Vehicle' : 'Edit Vehicle'}
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
                value={formData.category || 'ace'}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setFormData({ ...formData, category: newCategory, subcategory: '' }); // Reset subcategory when category changes
                }}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                required
              >
                <option value="ev">EV</option>
                <option value="ace">Tata Ace</option>
                <option value="intra">Tata Intra</option>
                <option value="yodha">Tata Yodha</option>
                <option value="massey">Massey Ferguson</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subcategory</label>
              <select
                value={formData.subcategory || ''}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <option value="">Select subcategory (optional)</option>
                {getSubcategories(formData.category || 'ace').map((subcat) => (
                  <option key={subcat} value={subcat}>
                    {subcat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price</label>
              <input
                type="text"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="₹8,11,000"
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
              <select
                value={(formData as any).status || 'Published'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Published' | 'Inactive' | 'Draft' })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
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
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description *</label>
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
                Catalog PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                id="catalog-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const newImageFiles = new Map(imageFiles);
                    // Store catalog file with a special key
                    newImageFiles.set(-1, file);
                    setImageFiles(newImageFiles);
                  }
                }}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700' 
                    : 'bg-white border-gray-200 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700'
                }`}
              />
              {formData.catalog && (
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Current catalog: <a href={formData.catalog} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{formData.catalog}</a>
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Images {formData.images && formData.images.length > 0 && `(${formData.images.length})`}
              </label>
              <div className="space-y-3">
                {formData.images && formData.images.length > 0 ? (
                  formData.images.map((img, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(index, e)}
                          className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                            isDarkMode 
                              ? 'bg-gray-600 border-gray-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700' 
                              : 'bg-white border-gray-200 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700'
                          }`}
                        />
                        {img && (
                          <div className="mt-2">
                            <img
                              src={img}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          removeImage(index);
                          const newImageFiles = new Map(imageFiles);
                          newImageFiles.delete(index);
                          setImageFiles(newImageFiles);
                        }}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                          isDarkMode 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-red-100 hover:bg-red-200 text-red-700'
                        }`}
                        title="Remove image"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 border-2 border-dashed rounded-xl ${
                    isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
                  }`}>
                    <p className="text-sm">No images added yet</p>
                    <p className="text-xs mt-1">Click "Add Image" to add vehicle images</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={addImage}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg' 
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-2 border-purple-300 hover:border-purple-400'
                  }`}
                >
                  <Plus size={18} />
                  Add Image
                </button>
              </div>
              {formData.images && formData.images.length > 0 && (
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  💡 Tip: Add multiple images to showcase different angles of the vehicle
                </p>
              )}
            </div>
            
            {/* Specifications Section */}
            <div className="md:col-span-2 mt-6">
              <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Specifications
              </h3>
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Engine & Power */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Engine</label>
                    <input
                      type="text"
                      value={formData.specs?.engine || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, engine: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Simpson S325.1 TIIIA, 3 Cylinders"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Power</label>
                    <input
                      type="text"
                      value={formData.specs?.power || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, power: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 42 HP (30.88 kW)"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>PTO Power</label>
                    <input
                      type="text"
                      value={formData.specs?.ptoPower || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, ptoPower: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 38.5 HP"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Torque</label>
                    <input
                      type="text"
                      value={formData.specs?.torque || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, torque: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 150 Nm @ 2000 rpm"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Transmission</label>
                    <input
                      type="text"
                      value={formData.specs?.transmission || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, transmission: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 8 Forward + 2 Reverse"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fuel Type</label>
                    <input
                      type="text"
                      value={formData.specs?.fuelType || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, fuelType: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Diesel"
                    />
                  </div>
                  
                  {/* Dimensions */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Length</label>
                    <input
                      type="text"
                      value={formData.specs?.length || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, length: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 3446 mm"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Width</label>
                    <input
                      type="text"
                      value={formData.specs?.width || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, width: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 1660 mm"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Height</label>
                    <input
                      type="text"
                      value={formData.specs?.height || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, height: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 2200 mm"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Wheelbase</label>
                    <input
                      type="text"
                      value={formData.specs?.wheelbase || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, wheelbase: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 1935 mm"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Ground Clearance</label>
                    <input
                      type="text"
                      value={formData.specs?.groundClearance || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, groundClearance: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 345 mm"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Weight</label>
                    <input
                      type="text"
                      value={formData.specs?.weight || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, weight: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 1875 kg"
                    />
                  </div>
                  
                  {/* Tractor Specific */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Hydraulics</label>
                    <input
                      type="text"
                      value={formData.specs?.hydraulics || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, hydraulics: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Oil Immersed Piston Pump"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Lift Capacity</label>
                    <input
                      type="text"
                      value={formData.specs?.liftCapacity || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, liftCapacity: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 1700 kgf"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>PTO</label>
                    <input
                      type="text"
                      value={formData.specs?.pto || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, pto: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 25 PTO, 540 rpm @ 1500 ERPM"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Front Tyres</label>
                    <input
                      type="text"
                      value={formData.specs?.tyresFront || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, tyresFront: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 6 x 16 (15.24 cm x 40.64 cm)"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rear Tyres</label>
                    <input
                      type="text"
                      value={formData.specs?.tyresRear || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, tyresRear: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 13.6 x 28 (34.54 cm x 71.12 cm)"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fuel Tank</label>
                    <input
                      type="text"
                      value={formData.specs?.fuelTank || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, fuelTank: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 47 L"
                    />
                  </div>
                  
                  {/* Additional Fields */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Clutch</label>
                    <input
                      type="text"
                      value={formData.specs?.clutch || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, clutch: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Dual Dry"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Brakes</label>
                    <input
                      type="text"
                      value={formData.specs?.brakes || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, brakes: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Oil Immersed"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Steering</label>
                    <input
                      type="text"
                      value={formData.specs?.steering || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, steering: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Manual / Power (Optional)"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Max Speed</label>
                    <input
                      type="text"
                      value={formData.specs?.maxSpeed || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, maxSpeed: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 30.3 kmph"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mileage</label>
                    <input
                      type="text"
                      value={formData.specs?.mileage || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, mileage: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 20 kmpl"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Seating</label>
                    <input
                      type="text"
                      value={formData.specs?.seating || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, seating: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 2+1"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Payload</label>
                    <input
                      type="text"
                      value={formData.specs?.payload || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, payload: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 750 kg"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rear Drive</label>
                    <input
                      type="text"
                      value={formData.specs?.rearDrive || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, rearDrive: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Massey Planetary Plus"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Turning Circle Radius</label>
                    <input
                      type="text"
                      value={formData.specs?.turningCircleRadius || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, turningCircleRadius: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., 2500 mm (With Brake)"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Front Axle</label>
                    <input
                      type="text"
                      value={formData.specs?.frontAxle || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, frontAxle: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Swept fixed - 2 WD"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Air Cleaner</label>
                    <input
                      type="text"
                      value={formData.specs?.airCleaner || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, airCleaner: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Wet-3 Stage"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rear Transmission</label>
                    <input
                      type="text"
                      value={formData.specs?.rearTransmission || ''}
                      onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, rearTransmission: e.target.value } })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                      placeholder="e.g., Power Drive"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features Section */}
            <div className="md:col-span-2 mt-6">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Features {formData.features && formData.features.length > 0 && `(${formData.features.length})`}
              </label>
              <div className="space-y-2">
                {formData.features && formData.features.length > 0 ? (
                  formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className={`flex-1 px-4 py-2 rounded-xl border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-500 text-gray-300' 
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}>
                        {feature}
                      </span>
                      <button
                        onClick={() => removeFeature(index)}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                          isDarkMode 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-red-100 hover:bg-red-200 text-red-700'
                        }`}
                        title="Remove feature"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No features added yet</p>
                )}
                <button
                  type="button"
                  onClick={addFeature}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg' 
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-2 border-purple-300 hover:border-purple-400'
                  }`}
                >
                  <Plus size={18} />
                  Add Feature
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              <Save size={18} />
              Save
            </button>
            <button
              onClick={handleCancel}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className={`w-full ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
          <thead>
            <tr className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <th className="px-6 py-4 text-left text-sm font-semibold">Vehicle name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Created At</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className={`inline-flex flex-col items-center p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Car className={`mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={48} />
                    <p className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>No Vehicles Found</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click "Add Vehicle" to create your first vehicle</p>
                  </div>
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle, index) => {
                const vehicleStatus = (vehicle as any).status || 'Published';
                const vehicleCreatedAt = (vehicle as any).createdAt;
                return (
                  <tr 
                    key={vehicle.id} 
                    className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors ${
                      index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50')
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {vehicle.images && vehicle.images.length > 0 && (
                          <img 
                            src={vehicle.images[0]} 
                            alt={vehicle.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{vehicle.name}</div>
                          {vehicle.subcategory && (
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{vehicle.subcategory}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {vehicle.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      V-{String(vehicle.id).padStart(4, '0')}
                    </td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {vehicle.price || 'N/A'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatDate(vehicleCreatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(vehicleStatus)}`}>
                        {vehicleStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === vehicle.id ? null : vehicle.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {showActionsMenu === vehicle.id && (
                          <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-10 ${
                            isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            <button
                              onClick={() => handleEdit(vehicle)}
                              className={`w-full text-left px-4 py-2 text-sm rounded-t-xl hover:bg-purple-50 transition-colors ${
                                isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700'
                              }`}
                            >
                              <Edit size={14} className="inline mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(vehicle.id)}
                              className={`w-full text-left px-4 py-2 text-sm rounded-b-xl hover:bg-red-50 transition-colors ${
                                isDarkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600'
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {vehicles.length > 0 && (
        <div className={`flex items-center justify-between mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
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
