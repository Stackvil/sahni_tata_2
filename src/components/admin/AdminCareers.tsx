import { useEffect, useState } from 'react';
import { Briefcase, Plus, Edit, Trash2, X, Save, Building, MapPin, FileText, CheckCircle } from 'lucide-react';
import { careersAPI, applicationsAPI, API_BASE_ENDPOINT } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';

interface AdminCareersProps {
  isDarkMode?: boolean;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements?: string[];
  status: string;
  created_at: string;
  updated_at?: string;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  resume: string;
  status: string;
  created_at: string;
}

export default function AdminCareers({ isDarkMode = false }: AdminCareersProps) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [showApplications, setShowApplications] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    requirements: '',
    status: 'active',
  });

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsData, appsData] = await Promise.all([
        careersAPI.getAllAdmin().catch((err) => {
          console.error('Error loading careers:', err);
          return [];
        }),
        applicationsAPI.getAll().catch((err) => {
          console.error('Error loading applications:', err);
          return [];
        }),
      ]);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (error: any) {
      console.error('Error in loadData:', error);
      setError(error.message || 'Failed to load data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (job: JobPosting) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      description: job.description,
      requirements: job.requirements?.join('\n') || '',
      status: job.status,
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      await careersAPI.delete(jobId);
      setSuccess('Job posting deleted successfully');
      loadData();
    } catch (error: any) {
      setError(error.message || 'Failed to delete job posting');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const requirements = formData.requirements
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      if (editingJob) {
        await careersAPI.update(editingJob.id, {
          title: formData.title,
          department: formData.department,
          location: formData.location,
          description: formData.description,
          requirements: requirements,
          status: formData.status,
        });
        setSuccess('Job posting updated successfully');
      } else {
        await careersAPI.create({
          title: formData.title,
          department: formData.department,
          location: formData.location,
          description: formData.description,
          requirements: requirements,
          status: formData.status,
        });
        setSuccess('Job posting created successfully');
      }

      setShowForm(false);
      setEditingJob(null);
      setFormData({
        title: '',
        department: '',
        location: '',
        description: '',
        requirements: '',
        status: 'active',
      });
      loadData();
    } catch (error: any) {
      setError(error.message || 'Failed to save job posting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewJob = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      department: '',
      location: '',
      description: '',
      requirements: '',
      status: 'active',
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      await applicationsAPI.updateStatus(applicationId, status);
      setSuccess('Application status updated');
      loadData();
    } catch (error: any) {
      setError(error.message || 'Failed to update application status');
    }
  };

  const getResumeUrl = (resumePath: string) => {
    return `${API_BASE_ENDPOINT}${resumePath}`;
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner message="Loading careers data..." fullScreen={false} />
      </div>
    );
  }

  // Show error state but still allow viewing/managing if data exists
  if (error && jobs.length === 0 && applications.length === 0) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
          <br />
          <small className="text-red-600">Please check if the backend server is running on port 3001</small>
          <br />
          <small className="text-red-600">Make sure the careers route is registered in server.js</small>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Briefcase className="mr-2" size={28} />
          Career Management
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowApplications(!showApplications)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {showApplications ? 'View Jobs' : `View Applications (${applications.length})`}
          </button>
          <button
            onClick={handleNewJob}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus size={20} className="mr-2" />
            New Job Posting
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
          <br />
          <small className="text-red-600">Please check if the backend server is running on port 3001</small>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
          <CheckCircle size={20} className="mr-2" />
          {success}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-6 border rounded-lg" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingJob(null);
                setError(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Department *</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg ${
                  isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Requirements (one per line)</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg ${
                  isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Bachelor's degree in relevant field&#10;3+ years of experience&#10;Strong communication skills"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingJob ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingJob(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showApplications ? (
        <div>
          <h3 className="text-xl font-bold mb-4">Job Applications ({applications.length})</h3>
          {applications.length === 0 ? (
            <p className="text-gray-500">No applications yet.</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className={`p-4 border rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{app.name}</h4>
                      <p className="text-sm text-gray-600">{app.jobTitle}</p>
                      <p className="text-sm">{app.email} | {app.phone}</p>
                    </div>
                    <select
                      value={app.status}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                      className={`px-3 py-1 border rounded ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                  {app.coverLetter && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold mb-1">Cover Letter:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{app.coverLetter}</p>
                    </div>
                  )}
                  <a
                    href={getResumeUrl(app.resume)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FileText size={16} className="mr-1" />
                    View Resume
                  </a>
                  <p className="text-xs text-gray-500 mt-2">
                    Applied on: {new Date(app.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-bold mb-4">Job Postings ({jobs.length})</h3>
          {jobs.length === 0 ? (
            <p className="text-gray-500">No job postings yet. Create your first one!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-4 border rounded-lg ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{job.title}</h4>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        job.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Building size={14} className="mr-1" />
                    {job.department}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin size={14} className="mr-1" />
                    {job.location}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(job)}
                      className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Edit size={14} className="inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

