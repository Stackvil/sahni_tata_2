import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MoreVertical, MapPin } from 'lucide-react';
import { showroomsAPI, normalizeImageUrl } from '../../services/api';

interface Showroom {
  city: string;
  address: string;
  phone: string;
  email: string;
  image?: string;
  isMain: boolean;
  id?: string | number;
  createdAt?: string;
  status?: 'Published' | 'Inactive' | 'Draft';
  name?: string;
  location?: string;
  category?: 'tata' | 'massey';
}

interface AdminShowroomsProps {
  isDarkMode?: boolean;
}

export default function AdminShowrooms({ isDarkMode = false }: AdminShowroomsProps) {
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Showroom>({
    city: '',
    address: '',
    phone: '',
    email: '',
    image: '',
    isMain: false,
    status: 'Published',
    name: '',
    location: '',
    category: 'tata',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadShowrooms();
  }, []);

  const loadShowrooms = async () => {
    try {
      setLoading(true);
      // Backend returns array directly
      const response = await showroomsAPI.getAll();
      const backendShowrooms = Array.isArray(response) ? response : (response?.showrooms || []);

      // Transform backend data to match frontend interface
      const transformedShowrooms: Showroom[] = backendShowrooms.map((s: any) => {
        // Normalize image URL - backend might return null, empty string, or a path
        const imageUrl = s.image ? normalizeImageUrl(s.image) : '';
        
        return {
          id: s.id || s.showroom_id,
          city: s.city || s.name || s.location || 'Unknown',
          address: s.address || '',
          phone: s.phone || '+91 98485 29755',
          email: s.email || 'sahniauto@gmail.com',
          image: imageUrl, // Normalized image URL
          isMain: s.isMain || s.is_main || false,
          status: 'Published' as const,
          createdAt: s.created_at || new Date().toISOString().split('T')[0],
          name: s.name || s.city || s.location,
          location: s.location || s.city || s.name,
          category: s.category || 'tata',
        };
      });

      setShowrooms(transformedShowrooms);
      console.log('Showrooms loaded from backend:', transformedShowrooms.length);
    } catch (error) {
      console.error('Error loading showrooms from backend:', error);
      setShowrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      city: '',
      address: '',
      phone: '',
      email: '',
      image: '',
      isMain: false,
      status: 'Published',
      category: 'tata',
    });
    setImageFile(null);
    setImagePreview(null);
    // Scroll to top when adding
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (showroom: Showroom) => {
    setEditingId(String(showroom.id));
    setIsAdding(false);
    setFormData({
      ...showroom,
      name: showroom.name || showroom.city || showroom.location || '',
      location: showroom.location || showroom.city || showroom.name || '',
    });
    setImageFile(null);
    setImagePreview(showroom.image || null);
    setShowActionsMenu(null);
    // Scroll to top when editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!formData.city || !formData.address || !formData.phone || !formData.email) {
      alert('Please fill in all required fields (City, Address, Phone, Email)');
      return;
    }

    try {
      if (isAdding) {
        // Create new showroom via backend
        const showroomData: {
          city: string;
          address: string;
          phone: string;
          email: string;
          is_main: boolean;
          category: string;
          image?: string | File;
        } = {
          city: formData.city.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          is_main: formData.isMain || false,
          category: formData.category || 'tata',
        };
        
        // Include image file if selected
        if (imageFile) {
          showroomData.image = imageFile;
        }

        console.log('Creating showroom with data:', showroomData);
        const result = await showroomsAPI.create(showroomData);
        console.log('Showroom created successfully:', result);

        await loadShowrooms();
        setIsAdding(false);
        setFormData({ city: '', address: '', phone: '', email: '', image: '', isMain: false, status: 'Published', name: '', location: '', category: 'tata' });
        setImageFile(null);
        setImagePreview(null);
      } else if (editingId) {
        // Update showroom via backend
        const showroomData: {
          city: string;
          address: string;
          phone: string;
          email: string;
          is_main: boolean;
          category: string;
          image?: string | File;
        } = {
          city: formData.city.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          is_main: formData.isMain,
          category: formData.category || 'tata',
        };
        
        // Include image file if a new file was selected
        if (imageFile) {
          showroomData.image = imageFile;
        }
        // If no new file selected, don't include image - backend will keep existing image

        console.log('Updating showroom with ID:', editingId);
        console.log('Updating showroom with data:', showroomData);
        await showroomsAPI.update(String(editingId), showroomData);
        console.log('Showroom updated successfully');

        await loadShowrooms();
        setEditingId(null);
        setFormData({ city: '', address: '', phone: '', email: '', image: '', isMain: false, status: 'Published', name: '', location: '', category: 'tata' });
        setImageFile(null);
        setImagePreview(null);
      }
      // Scroll to top after save
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error saving showroom:', error);
      const errorMessage = error?.message || error?.detail || 'Failed to save showroom. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('Are you sure you want to delete this showroom?')) {
      try {
        await showroomsAPI.delete(String(id));
        await loadShowrooms();
        setShowActionsMenu(null);
      } catch (error) {
        console.error('Error deleting showroom:', error);
        alert('Failed to delete showroom. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ city: '', address: '', phone: '', email: '', image: '', isMain: false, status: 'Published', name: '', location: '', category: 'tata' });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading showrooms...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Showroom
        </button>
      </div>

      {(isAdding || editingId !== null) && (
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6 mb-6 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isAdding ? 'Add New Showroom' : 'Edit Showroom'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category *</label>
              <select
                value={formData.category || 'tata'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'tata' | 'massey' })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                required
              >
                <option value="tata">Tata Showroom</option>
                <option value="massey">Massey Ferguson Showroom</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                rows={2}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 sm:py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-base sm:text-sm min-h-[48px] ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700' 
                    : 'bg-white border-gray-200 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700'
                }`}
              />
              {imagePreview && (
                <div className="mt-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-contain rounded-lg border border-gray-200"
                  />
                </div>
              )}
              {!imagePreview && formData.image && (
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
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
              <select
                value={formData.status || 'Published'}
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
              <label className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={formData.isMain}
                  onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                  className="mr-2 w-4 h-4 rounded"
                />
                <span className="text-sm font-semibold">Main Showroom</span>
              </label>
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
              <th className="px-6 py-4 text-left text-sm font-semibold">Showroom</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">City</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Created At</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {showrooms.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className={`inline-flex flex-col items-center p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <MapPin className={`mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={48} />
                    <p className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>No Showrooms Found</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click "Add Showroom" to create your first showroom</p>
                  </div>
                </td>
              </tr>
            ) : (
              showrooms.map((showroom, index) => (
                <tr 
                  key={`showroom-${showroom.id || index}-${showroom.city || ''}`} 
                  className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors ${
                    index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50')
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {showroom.image && (
                        <img 
                          src={showroom.image} 
                          alt={showroom.city}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{showroom.city}</div>
                        {showroom.isMain && (
                          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                            isDarkMode ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                          }`}>
                            Main
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      (showroom.category || 'tata') === 'massey' 
                        ? (isDarkMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200')
                        : (isDarkMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200')
                    }`}>
                      {(showroom.category || 'tata') === 'massey' ? 'Massey Ferguson' : 'Tata'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {showroom.city}
                  </td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {showroom.phone}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {showroom.email}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatDate(showroom.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(showroom.status)}`}>
                      {showroom.status || 'Published'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowActionsMenu(showActionsMenu === showroom.id ? null : showroom.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {showActionsMenu === showroom.id && (
                        <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-10 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            onClick={() => handleEdit(showroom)}
                            className={`w-full text-left px-4 py-2 text-sm rounded-t-xl hover:bg-purple-50 transition-colors ${
                              isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700'
                            }`}
                          >
                            <Edit size={14} className="inline mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(showroom.id!)}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {showrooms.length > 0 && (
        <div className={`flex items-center justify-between mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {showrooms.length} showroom{showrooms.length !== 1 ? 's' : ''}
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
