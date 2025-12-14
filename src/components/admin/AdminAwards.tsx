import { useEffect, useState } from 'react';
import { Trophy, Plus, Edit, Trash2, X, Save, Image as ImageIcon, Award, CheckCircle } from 'lucide-react';
import { awardsAPI, normalizeImageUrl } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';

interface AdminAwardsProps {
  isDarkMode?: boolean;
}

interface Award {
  id: string;
  brand: string;
  logo?: string;
  award: string;
  award_text?: string;
  year?: string;
  display_order?: number;
}

interface AwardGroup {
  brand: string;
  logo?: string;
  awards: string[];
}

export default function AdminAwards({ isDarkMode = false }: AdminAwardsProps) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brand: '',
    award_text: '',
    year: '',
    display_order: 0,
  });

  useEffect(() => {
    loadAwards();
  }, []);

  // Clear error/success messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadAwards = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get flat list of individual awards for admin
      const response = await awardsAPI.getAll(true);
      
      if (Array.isArray(response)) {
        setAwards(response as Award[]);
      } else {
        setAwards([]);
      }
    } catch (error: any) {
      console.error('Error loading awards:', error);
      setError(error.message || 'Failed to load awards. Please check if the backend server is running.');
      setAwards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (award: Award) => {
    setEditingAward(award);
    setFormData({
      brand: award.brand,
      award_text: award.award_text || award.award,
      year: award.year || '',
      display_order: award.display_order || 0,
    });
    setLogoPreview(award.logo ? normalizeImageUrl(award.logo) : null);
    setLogoFile(null);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (awardId: string) => {
    if (!confirm('Are you sure you want to delete this award?')) {
      return;
    }

    try {
      await awardsAPI.delete(awardId);
      setSuccess('Award deleted successfully');
      loadAwards();
    } catch (error: any) {
      setError(error.message || 'Failed to delete award');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const awardData: any = {
        brand: formData.brand,
        award_text: formData.award_text,
        year: formData.year || undefined,
        display_order: parseInt(formData.display_order.toString()) || 0,
      };

      if (logoFile) {
        awardData.logo = logoFile;
      }

      if (editingAward && editingAward.id) {
        await awardsAPI.update(editingAward.id, awardData);
        setSuccess('Award updated successfully');
      } else {
        await awardsAPI.create(awardData);
        setSuccess('Award created successfully');
      }

      setShowForm(false);
      setEditingAward(null);
      setFormData({
        brand: '',
        award_text: '',
        year: '',
        display_order: 0,
      });
      setLogoFile(null);
      setLogoPreview(null);
      loadAwards();
    } catch (error: any) {
      setError(error.message || 'Failed to save award');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewAward = () => {
    setEditingAward(null);
    setFormData({
      brand: '',
      award_text: '',
      year: '',
      display_order: 0,
    });
    setLogoFile(null);
    setLogoPreview(null);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  // Group awards by brand for display
  const groupedAwards = awards.reduce((acc, award) => {
    if (!acc[award.brand]) {
      acc[award.brand] = {
        brand: award.brand,
        logo: award.logo,
        awards: [],
      };
    }
    acc[award.brand].awards.push({
      id: award.id,
      award: award.award_text || award.award,
      year: award.year,
      display_order: award.display_order,
    });
    return acc;
  }, {} as Record<string, { brand: string; logo?: string; awards: Array<{ id: string; award: string; year?: string; display_order?: number }> }>);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner message="Loading awards data..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Trophy className="mr-2" size={28} />
          Awards Management
        </h2>
        <button
          onClick={handleNewAward}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Plus size={20} className="mr-2" />
          New Award
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
          <CheckCircle size={20} className="mr-2" />
          {success}
        </div>
      )}

      {showForm && (
        <div className={`mb-6 p-6 border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {editingAward ? 'Edit Award' : 'Create New Award'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingAward(null);
                setError(null);
              }}
              className={`p-2 hover:bg-gray-100 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Brand *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Tata Motors, HP Lubricants"
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Year</label>
                <input
                  type="text"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="e.g., 2022-2023"
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Award Text *</label>
              <textarea
                name="award_text"
                value={formData.award_text}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="e.g., BEST COMMERCIAL VEHICLE DEALER - ANDHRA PRADESH & TELANGANA (2022-2023)"
                className={`w-full px-4 py-2 border rounded-lg ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Display Order</label>
              <input
                type="number"
                name="display_order"
                value={formData.display_order}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-4 py-2 border rounded-lg ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Brand Logo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className={`w-full px-4 py-2 border rounded-lg ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
              {logoPreview && (
                <div className="mt-2">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-20 w-auto object-contain rounded border"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingAward ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAward(null);
                }}
                className={`px-6 py-2 rounded-lg font-semibold ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold mb-4">Awards ({awards.length})</h3>
        {awards.length === 0 ? (
          <p className="text-gray-500">No awards yet. Create your first one!</p>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedAwards).map((group) => (
              <div
                key={group.brand}
                className={`p-6 border rounded-lg ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {group.logo && (
                    <img
                      src={normalizeImageUrl(group.logo)}
                      alt={`${group.brand} Logo`}
                      className="h-16 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <h4 className="text-xl font-bold">{group.brand}</h4>
                </div>
                <div className="space-y-3">
                  {group.awards.map((awardItem, index) => {
                    const awardId = awardItem.id;
                    return (
                      <div
                        key={awardId || index}
                        className={`p-4 border-l-4 border-blue-500 rounded ${
                          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Award size={16} className="text-blue-500" />
                              {awardItem.year && (
                                <span className="text-sm text-gray-500">({awardItem.year})</span>
                              )}
                            </div>
                            <p className="text-sm font-medium">{awardItem.award}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                const award = awards.find(a => a.id === awardId);
                                if (award) {
                                  handleEdit(award);
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
                            >
                              <Edit size={14} className="mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(awardId)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

