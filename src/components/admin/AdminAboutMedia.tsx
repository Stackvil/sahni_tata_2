import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MoreVertical, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
  description?: string;
  createdAt?: string;
  status?: 'Published' | 'Inactive' | 'Draft';
}

interface AdminAboutMediaProps {
  isDarkMode?: boolean;
}

export default function AdminAboutMedia({ isDarkMode = false }: AdminAboutMediaProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState<MediaItem>({
    id: '',
    type: 'image',
    url: '',
    title: '',
    description: '',
    status: 'Published',
  });

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = () => {
    const saved = localStorage.getItem('adminAboutMedia');
    if (saved) {
      setMediaItems(JSON.parse(saved));
    } else {
      setMediaItems([]);
    }
  };

  const saveMedia = (updatedMedia: MediaItem[]) => {
    localStorage.setItem('adminAboutMedia', JSON.stringify(updatedMedia));
    setMediaItems(updatedMedia);
  };

  const handleAdd = (type: 'image' | 'video' = 'image') => {
    setIsAdding(true);
    setFormData({
      id: '',
      type,
      url: '',
      title: '',
      description: '',
      status: 'Published',
    });
    // Scroll to top when adding
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setIsAdding(false);
    setFormData(item);
    setShowActionsMenu(null);
    // Scroll to top when editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!formData.url) {
      alert('Please enter a media URL');
      return;
    }

    if (isAdding) {
      const newId = Date.now().toString();
      const newItem: MediaItem = {
        id: newId,
        type: formData.type,
        url: formData.url,
        title: formData.title,
        description: formData.description,
        status: formData.status || 'Published',
        createdAt: new Date().toISOString().split('T')[0],
      };
      saveMedia([...mediaItems, newItem]);
      setIsAdding(false);
    } else if (editingId) {
      const updatedMedia = mediaItems.map(item =>
        item.id === editingId ? formData : item
      );
      saveMedia(updatedMedia);
      setEditingId(null);
    }
    setFormData({ id: '', type: 'image', url: '', title: '', description: '', status: 'Published' });
    // Scroll to top after save
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this media item?')) {
      saveMedia(mediaItems.filter(item => item.id !== id));
      setShowActionsMenu(null);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ id: '', type: 'image', url: '', title: '', description: '', status: 'Published' });
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => handleAdd('image')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <ImageIcon size={18} />
            Add Image
          </button>
          <button
            onClick={() => handleAdd('video')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <VideoIcon size={18} />
            Add Video
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6 mb-6 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isAdding ? `Add New ${formData.type === 'image' ? 'Image' : 'Video'}` : 'Edit Media'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'image' | 'video' })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>URL *</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="/images/aboutus.png or /videos/videoplayback.mp4"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                  isDarkMode 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                rows={3}
              />
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
            {formData.url && (
              <div className="md:col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Preview</label>
                <div className={`border rounded-xl p-4 ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  {formData.type === 'image' ? (
                    <img
                      src={formData.url}
                      alt={formData.title || 'Preview'}
                      className="max-w-full h-48 object-contain mx-auto rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <video
                      src={formData.url}
                      controls
                      className="max-w-full h-48 object-contain mx-auto rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLVideoElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
            )}
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
              <th className="px-6 py-4 text-left text-sm font-semibold">Media</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Created At</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {mediaItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className={`inline-flex flex-col items-center p-6 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <ImageIcon className={`mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={48} />
                    <p className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>No Media Items Found</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click "Add Image" or "Add Video" to create one</p>
                  </div>
                </td>
              </tr>
            ) : (
              mediaItems.map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors ${
                    index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50')
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.title || 'Media'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <VideoIcon className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} size={24} />
                        )}
                      </div>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.title || 'Untitled'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.type === 'image' 
                        ? (isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700')
                        : (isDarkMode ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-700')
                    }`}>
                      {item.type === 'image' ? 'Image' : 'Video'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {item.title || 'N/A'}
                  </td>
                  <td className={`px-6 py-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.id.slice(-6)}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                      {item.status || 'Published'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowActionsMenu(showActionsMenu === item.id ? null : item.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {showActionsMenu === item.id && (
                        <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-10 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            onClick={() => handleEdit(item)}
                            className={`w-full text-left px-4 py-2 text-sm rounded-t-xl hover:bg-purple-50 transition-colors ${
                              isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700'
                            }`}
                          >
                            <Edit size={14} className="inline mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
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

      {mediaItems.length > 0 && (
        <div className={`flex items-center justify-between mt-6 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {mediaItems.length} item{mediaItems.length !== 1 ? 's' : ''}
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
