import { useEffect, useState } from 'react';
import { Briefcase, MapPin, Building, Calendar, Upload, X, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { careersAPI, applicationsAPI } from '../services/api';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements?: string[];
  status: string;
  created_at: string;
}

interface CareersProps {
  setCurrentPage?: (page: string) => void;
}

export default function Careers({ setCurrentPage: _setCurrentPage }: CareersProps) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
    resume: null as File | null,
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await careersAPI.getAll();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (job: JobPosting) => {
    setSelectedJob(job);
    setShowApplicationForm(false);
    setSubmitSuccess(false);
    setSubmitError(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      coverLetter: '',
      resume: null,
    });
  };

  const handleApplyClick = (job: JobPosting) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, resume: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedJob || !formData.resume) {
      setSubmitError('Please fill all required fields and upload your resume');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await applicationsAPI.submit({
        jobId: selectedJob.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        coverLetter: formData.coverLetter,
        resume: formData.resume,
      });

      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        coverLetter: '',
        resume: null,
      });

      // Reset form after 5 seconds
      setTimeout(() => {
        setShowApplicationForm(false);
        setSubmitSuccess(false);
        setSelectedJob(null);
      }, 5000);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Hero Section - Video Background Only */}
      <section className="relative w-full overflow-hidden min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh]">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Video load error:', e);
            const target = e.target as HTMLVideoElement;
            // Try fallback path
            const source = target.querySelector('source');
            if (source && !source.src.includes('cloudfront')) {
              source.src = '/videos/KISHORE.mp4';
            }
          }}
        >
          <source src="/videos/KISHORE.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </section>

      {/* Job Listings - Professional Card Design */}
      <section className="relative pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 md:pb-20 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-20">
              <LoadingSpinner message="Loading job openings..." fullScreen={false} />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-2xl mx-auto">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50"></div>
                <Briefcase size={72} className="relative text-blue-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">No Open Positions</h2>
              <p className="text-gray-600 text-lg sm:text-xl max-w-md mx-auto leading-relaxed">
                We don't have any open positions at the moment. Please check back later or send us your resume for future opportunities!
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-12 sm:mb-16 md:mb-20">
                <div className="inline-block mb-6">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                    Open Positions
                  </h2>
                  <div className="relative w-32 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 mx-auto rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-light">
                  Explore our current job openings and find the perfect role to advance your career with us.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {jobs.map((job, index) => (
                  <div
                    key={job.id}
                    className="group relative bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-200 cursor-pointer flex flex-col h-full transform hover:-translate-y-2"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => handleJobClick(job)}
                  >
                    {/* Gradient Top Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                    
                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-indigo-50/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:via-indigo-50/20 group-hover:to-purple-50/30 transition-all duration-500 pointer-events-none"></div>
                    
                    <div className="relative p-6 sm:p-8 flex flex-col flex-1 h-full z-10">
                      {/* Department Badge */}
                      <div className="absolute top-6 right-6 z-20">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                          {job.department}
                        </span>
                      </div>
                      
                      <div className="mb-6 flex-shrink-0 pr-24">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors duration-300 min-h-[3rem]">
                          {job.title}
                        </h3>
                        <div className="space-y-2.5">
                          <div className="flex items-center text-gray-600">
                            <div className="p-1.5 bg-blue-50 rounded-lg mr-3">
                              <MapPin size={16} className="text-blue-600" strokeWidth={2.5} />
                            </div>
                            <span className="text-sm font-medium">{job.location}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <div className="p-1.5 bg-gray-50 rounded-lg mr-3">
                              <Calendar size={16} className="text-gray-500" strokeWidth={2.5} />
                            </div>
                            <span className="text-xs">Posted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                        {job.description}
                      </p>
                      
                      <div className="mt-auto pt-6 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyClick(job);
                          }}
                          className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform group-hover:scale-[1.02] shadow-lg group-hover:shadow-xl"
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            Apply Now
                            <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Job Detail Modal / Application Form - Professional Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto relative shadow-2xl border border-gray-200 animate-scaleIn">
            {/* Gradient Top Bar */}
            <div className="sticky top-0 z-20 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedJob(null);
                setShowApplicationForm(false);
                setSubmitSuccess(false);
                setSubmitError(null);
              }}
              className="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-xl hover:bg-white hover:scale-110 transition-all duration-300 border border-gray-200"
              aria-label="Close"
            >
              <X size={20} className="text-gray-700" strokeWidth={2.5} />
            </button>

            {!showApplicationForm ? (
              /* Job Details View - Professional Design */
              <div className="p-8 md:p-10">
                <div className="mb-8 pb-8 border-b-2 border-gray-100">
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight">{selectedJob.title}</h2>
                  <div className="flex flex-wrap gap-4 sm:gap-6">
                    <div className="flex items-center px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                      <Building size={20} className="text-blue-600 mr-2.5" strokeWidth={2} />
                      <span className="font-semibold text-gray-800">{selectedJob.department}</span>
                    </div>
                    <div className="flex items-center px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                      <MapPin size={20} className="text-indigo-600 mr-2.5" strokeWidth={2} />
                      <span className="font-semibold text-gray-800">{selectedJob.location}</span>
                    </div>
                    <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                      <Calendar size={20} className="text-gray-600 mr-2.5" strokeWidth={2} />
                      <span className="text-sm font-medium text-gray-700">Posted {new Date(selectedJob.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full mr-4"></span>
                    Job Description
                  </h3>
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">{selectedJob.description}</p>
                  </div>
                </div>

                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full mr-4"></span>
                      Requirements
                    </h3>
                    <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <ul className="space-y-3">
                        {selectedJob.requirements.map((req, index) => (
                          <li key={index} className="flex items-start text-gray-700 leading-relaxed">
                            <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mr-3 mt-0.5">
                              <span className="text-white text-xs font-bold">✓</span>
                            </span>
                            <span className="flex-1">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Apply for This Position
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            ) : (
              /* Application Form - Professional Design */
              <div className="p-8 md:p-10">
                <div className="mb-8 pb-6 border-b-2 border-gray-100">
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Apply for {selectedJob.title}</h2>
                  <p className="text-gray-600 text-lg">Fill out the form below to submit your application. We'll review it and get back to you soon.</p>
                </div>

                {submitSuccess ? (
                  <div className="text-center py-16">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-green-200 rounded-full blur-2xl opacity-50 animate-ping"></div>
                      <CheckCircle size={80} className="relative text-green-500 mx-auto" strokeWidth={2} />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-4">Application Submitted Successfully!</h3>
                    <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                      Thank you for your interest in joining our team. We've received your application and will review it shortly. We'll be in touch soon!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300 text-gray-900 placeholder-gray-400"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">
                        Cover Letter <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <textarea
                        name="coverLetter"
                        value={formData.coverLetter}
                        onChange={handleInputChange}
                        rows={5}
                        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white hover:border-gray-300 text-gray-900 placeholder-gray-400 resize-none"
                        placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2.5">
                        Resume <span className="text-red-500">*</span>
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 bg-gray-50/50 group cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileChange}
                          required
                          className="hidden"
                          id="resume-upload"
                        />
                        <label
                          htmlFor="resume-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                            <Upload size={40} className="relative text-blue-600 group-hover:text-blue-700 group-hover:scale-110 transition-all duration-300" strokeWidth={2} />
                          </div>
                          <span className="text-base font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">
                            {formData.resume ? (
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                {formData.resume.name}
                              </span>
                            ) : (
                              'Click to upload resume'
                            )}
                          </span>
                          <span className="text-sm text-gray-500">
                            PDF, DOC, DOCX, or TXT (Max 10MB)
                          </span>
                        </label>
                      </div>
                    </div>

                    {submitError && (
                      <div className="bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-300 text-red-800 px-5 py-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-bold">⚠</span>
                          <span className="font-semibold">{submitError}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowApplicationForm(false);
                          setSubmitError(null);
                        }}
                        className="flex-1 bg-gray-100 text-gray-800 py-3.5 px-6 rounded-xl font-bold hover:bg-gray-200 transition-all duration-300 border-2 border-transparent hover:border-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-3.5 px-6 rounded-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg group"
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          {submitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Application
                              <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                            </>
                          )}
                        </span>
                        {!submitting && (
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

