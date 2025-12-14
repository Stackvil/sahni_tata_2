import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MoreVertical, FileText } from 'lucide-react';
import { aboutAPI, normalizeImageUrl } from '../../services/api';

interface AboutEntry {
  id: string;
  title: string;
  description: string;
  link?: string;
  image?: string;
}

interface AdminAboutProps {
  isDarkMode?: boolean;
}

export default function AdminAbout({ isDarkMode = false }: AdminAboutProps) {
  const [entries, setEntries] = useState<AboutEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<AboutEntry>({
    id: '',
    title: '',
    description: '',
    link: '',
    image: '',
  });
  const [fileFile, setFileFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await aboutAPI.getAll();
      const normalizedEntries = Array.isArray(data) 
        ? data.map((item: any) => {
            // Normalize image URL - backend might return null, empty string, or a path
            const imageUrl = item.image ? normalizeImageUrl(item.image) : '';
            
            return {
              id: String(item.id || item.about_id || ''),
              title: item.title || '',
              description: item.description || '',
              link: item.link || '',
              image: imageUrl, // Normalized image URL
            };
          })
        : [];
      setEntries(normalizedEntries);
    } catch (error: any) {
      console.error('Error loading about entries:', error);
      // Show user-friendly error message
      if (error?.message?.includes('Database connection')) {
        alert('Unable to connect to database. Please check backend server status.');
      }
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      id: '',
      title: '',
      description: '',
      link: '',
      image: '',
    });
    setFileFile(null);
    setFilePreview(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (entry: AboutEntry) => {
    setEditingId(entry.id);
    setIsAdding(false);
    setFormData(entry);
    setFileFile(null);
    setFilePreview(entry.image || null);
    setShowActionsMenu(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in title and description');
      return;
    }

    // Warn if file is large
    if (fileFile && fileFile.size > 2 * 1024 * 1024) {
      const proceed = confirm(`The selected file is ${(fileFile.size / 1024 / 1024).toFixed(2)} MB. Large files may cause timeout errors. Do you want to continue?`);
      if (!proceed) {
        return;
      }
    }

    setIsSaving(true);
    try {
      if (isAdding) {
        console.log('[AdminAbout] Creating entry with file:', fileFile ? {
          name: fileFile.name,
          size: fileFile.size,
          sizeMB: (fileFile.size / 1024 / 1024).toFixed(2)
        } : 'No file');
        
        await aboutAPI.create({
          title: formData.title,
          description: formData.description,
          file: fileFile || undefined, // API expects 'file' (File object)
        });
      } else if (editingId) {
        console.log('[AdminAbout] Updating entry:', {
          id: editingId,
          title: formData.title,
          description: formData.description,
          hasFile: !!fileFile,
          fileType: fileFile instanceof File ? 'File' : typeof fileFile,
          fileSize: fileFile ? `${(fileFile.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'
        });
        
        await aboutAPI.update(editingId, {
          title: formData.title,
          description: formData.description,
          file: fileFile || undefined, // API expects 'file' (File object) - only send if new file selected
        });
        
        console.log('[AdminAbout] Entry updated successfully');
      }
      await loadEntries();
      setIsAdding(false);
      setEditingId(null);
      setFormData({ id: '', title: '', description: '', link: '', image: '' });
      setFileFile(null);
      setFilePreview(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('[AdminAbout] Error saving entry:', error);
      
      // Handle timeout errors specifically
      if (error?.message?.includes('timeout') || error?.message?.includes('504') || error?.message?.includes('Gateway Timeout')) {
        alert(`Upload timeout: The file upload is taking too long. This might be due to:\n1. Large file size (${fileFile ? (fileFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'unknown'})\n2. Slow network connection\n3. Backend server timeout\n\nPlease try:\n- Using a smaller file (under 2MB recommended)\n- Checking your internet connection\n- Trying again later`);
      } else if (error?.message?.includes('Network error') || error?.message?.includes('Failed to fetch')) {
        alert(`Network error: ${error.message}\n\nPlease check your internet connection and try again.`);
      } else {
        alert(error.message || 'Failed to save entry. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await aboutAPI.delete(id);
        await loadEntries();
        setShowActionsMenu(null);
      } catch (error: any) {
        alert(error.message || 'Failed to delete entry');
      }
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ id: '', title: '', description: '', link: '', image: '' });
    setFileFile(null);
    setFilePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB to prevent timeout issues)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert(`File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds the maximum allowed size of 5 MB. Please select a smaller file.`);
        e.target.value = ''; // Clear the input
        setFileFile(null);
        setFilePreview(null);
        return;
      }
      
      // Warn about large files that might cause timeout
      if (file.size > 2 * 1024 * 1024) { // 2MB
        const proceed = confirm(`Warning: This file is ${(file.size / 1024 / 1024).toFixed(2)} MB. Large files may take longer to upload and could timeout. Do you want to continue?`);
        if (!proceed) {
          e.target.value = ''; // Clear the input
          setFileFile(null);
          setFilePreview(null);
          return;
        }
      }
      
      console.log('[AdminAbout] File selected:', {
        name: file.name,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        type: file.type
      });
      
      setFileFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.onerror = () => {
        console.error('[AdminAbout] Error reading file for preview');
      };
      reader.readAsDataURL(file);
    } else {
      setFileFile(null);
      setFilePreview(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading entries...</p>
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
          Add Entry
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6 mb-6 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isAdding ? 'Add New Entry' : 'Edit Entry'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="Enter title"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                rows={4}
                placeholder="Enter description"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Image/File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700' 
                    : 'bg-white border-gray-200 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700'
                }`}
              />
              {fileFile && (
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  ✓ Selected: {fileFile.name} ({(fileFile.size / 1024 / 1024).toFixed(2)} MB, {fileFile.type})
                </p>
              )}
              {filePreview && (
                <div className="mt-3">
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-contain rounded-lg border border-gray-200"
                  />
                </div>
              )}
              {!filePreview && formData.image && (
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
                Link (Optional)
              </label>
              <input
                type="text"
                value={formData.link || ''}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-colors ${
                isSaving
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save
                </>
              )}
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
              <th className="px-6 py-4 text-left text-sm font-semibold">Image</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className={`inline-flex flex-col items-center p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <FileText className={`mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={48} />
                    <p className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>No Entries Found</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click "Add Entry" to create one</p>
                  </div>
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr 
                  key={entry.id} 
                  className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors ${
                    index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50')
                  }`}
                >
                  <td className="px-6 py-4">
                    {entry.image ? (
                      <div className={`w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <img
                          src={normalizeImageUrl(entry.image)}
                          alt={entry.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <FileText className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} size={24} />
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {entry.title}
                  </td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    <div className="max-w-md truncate" title={entry.description}>
                      {entry.description}
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {entry.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowActionsMenu(showActionsMenu === entry.id ? null : entry.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {showActionsMenu === entry.id && (
                        <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-10 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            onClick={() => handleEdit(entry)}
                            className={`w-full text-left px-4 py-2 text-sm rounded-t-xl hover:bg-purple-50 transition-colors ${
                              isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700'
                            }`}
                          >
                            <Edit size={14} className="inline mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
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

      {entries.length > 0 && (
        <div className={`flex items-center justify-between mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
          </div>
        </div>
      )}
    </div>
  );
}

