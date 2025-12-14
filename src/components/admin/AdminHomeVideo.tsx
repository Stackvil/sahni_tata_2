import { useState, useEffect } from 'react';
import { Upload, Video, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { homeAPI, normalizeImageUrl } from '../../services/api';

interface AdminHomeVideoProps {
  isDarkMode?: boolean;
}

export default function AdminHomeVideo({ isDarkMode = false }: AdminHomeVideoProps) {
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadCurrentVideo();
  }, []);

  const loadCurrentVideo = async () => {
    try {
      setLoading(true);
      const url = await homeAPI.getVideo();
      if (url) {
        // Backend now returns CloudFront URLs, but normalizeImageUrl handles both cases
        const fullVideoUrl = normalizeImageUrl(url);
        setCurrentVideoUrl(fullVideoUrl);
        setPreviewUrl(fullVideoUrl);
      } else {
        setCurrentVideoUrl('');
        setPreviewUrl(null);
      }
    } catch (error: any) {
      console.error('Error loading current video:', error);
      setMessage({ type: 'error', text: 'Failed to load current video' });
      setCurrentVideoUrl('');
      setPreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setMessage({ type: 'error', text: 'Please select a video file' });
      return;
    }

    // Check file size (warn if > 50MB)
    if (file.size > 50 * 1024 * 1024) {
      const proceed = confirm(
        `The selected video is ${(file.size / 1024 / 1024).toFixed(2)} MB. Large files may take time to upload and may cause timeout errors. Do you want to continue?`
      );
      if (!proceed) {
        return;
      }
    }

    setSelectedFile(file);
    setMessage(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a video file first' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const uploadedUrl = await homeAPI.uploadVideo(selectedFile);
      // Backend now returns CloudFront URLs, but normalizeImageUrl handles both cases
      const fullVideoUrl = normalizeImageUrl(uploadedUrl);
      setCurrentVideoUrl(fullVideoUrl);
      setPreviewUrl(fullVideoUrl);
      setSelectedFile(null);
      setMessage({ type: 'success', text: 'Video uploaded successfully!' });
      
      // Clear file input
      const fileInput = document.getElementById('video-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading video:', error);
      let errorMessage = error.message || 'Failed to upload video. Please try again.';
      
      // Format multi-line error messages for better display
      if (errorMessage.includes('\n')) {
        errorMessage = errorMessage.split('\n').join(' • ');
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    // Reset preview to current video if it exists
    if (currentVideoUrl) {
      setPreviewUrl(currentVideoUrl);
    } else {
      setPreviewUrl(null);
    }
    setMessage(null);
    
    // Clear file input
    const fileInput = document.getElementById('video-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Home Page Video
        </h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Upload or update the video displayed on the home page. The video will automatically play and loop.
        </p>
      </div>

      {loading ? (
        <div className={`flex items-center justify-center py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl`}>
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Video Display */}
          {currentVideoUrl && (
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6`}>
              <h3 className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Current Video
              </h3>
              <div className="relative w-full max-w-4xl mx-auto">
                <video
                  src={previewUrl || currentVideoUrl}
                  controls
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: '500px' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
            <h3 className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentVideoUrl ? 'Update Video' : 'Upload Video'}
            </h3>

            <div className="space-y-4">
              {/* File Input */}
              <div>
                <label
                  htmlFor="video-file-input"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Select Video File
                </label>
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="video-file-input"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Upload size={18} />
                    <span>Choose File</span>
                  </label>
                  <input
                    id="video-file-input"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile && (
                    <div className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-sm ml-2 opacity-70">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              {previewUrl && selectedFile && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Preview
                  </label>
                  <div className="relative w-full max-w-2xl">
                    <video
                      src={previewUrl}
                      controls
                      className="w-full h-auto rounded-lg"
                      style={{ maxHeight: '300px' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {/* Message */}
              {message && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : message.type === 'error'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 size={18} />
                  ) : message.type === 'error' ? (
                    <XCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              {/* Action Buttons */}
              {selectedFile && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                      uploading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Video size={18} />
                        <span>Upload Video</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={uploading}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className={`${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} size={18} />
              <div className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                <p className="font-medium mb-1">Video Guidelines:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Recommended formats: MP4, WebM, MOV</li>
                  <li>Maximum file size: 50MB (larger files may cause timeout)</li>
                  <li>The video will automatically play and loop on the home page</li>
                  <li>For best results, use videos with 16:9 aspect ratio</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advertisement Video Section */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Advertisement Video
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Upload or update the advertisement video displayed on the home page.
          </p>
        </div>

        <AdvertisementVideoUpload isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

// Advertisement Video Upload Component
function AdvertisementVideoUpload({ isDarkMode }: { isDarkMode: boolean }) {
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadCurrentVideo();
  }, []);

  const loadCurrentVideo = async () => {
    try {
      setLoading(true);
      const url = await homeAPI.getAdvertisementVideo();
      if (url) {
        // Backend now returns CloudFront URLs, but normalizeImageUrl handles both cases
        const fullVideoUrl = normalizeImageUrl(url);
        setCurrentVideoUrl(fullVideoUrl);
        setPreviewUrl(fullVideoUrl);
      } else {
        setCurrentVideoUrl('');
        setPreviewUrl(null);
      }
    } catch (error: any) {
      console.error('Error loading current advertisement video:', error);
      setMessage({ type: 'error', text: 'Failed to load current advertisement video' });
      setCurrentVideoUrl('');
      setPreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setMessage({ type: 'error', text: 'Please select a video file' });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      const proceed = confirm(
        `The selected video is ${(file.size / 1024 / 1024).toFixed(2)} MB. Large files may take time to upload. Do you want to continue?`
      );
      if (!proceed) {
        return;
      }
    }

    setSelectedFile(file);
    setMessage(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a video file first' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const uploadedUrl = await homeAPI.uploadAdvertisementVideo(selectedFile);
      // Backend now returns CloudFront URLs, but normalizeImageUrl handles both cases
      const fullVideoUrl = normalizeImageUrl(uploadedUrl);
      setCurrentVideoUrl(fullVideoUrl);
      setPreviewUrl(fullVideoUrl);
      setSelectedFile(null);
      setMessage({ type: 'success', text: 'Advertisement video uploaded successfully!' });
      
      const fileInput = document.getElementById('ad-video-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading advertisement video:', error);
      let errorMessage = error.message || 'Failed to upload advertisement video. Please try again.';
      
      if (errorMessage.includes('\n')) {
        errorMessage = errorMessage.split('\n').join(' • ');
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    // Reset preview to current video if it exists
    if (currentVideoUrl) {
      setPreviewUrl(currentVideoUrl);
    } else {
      setPreviewUrl(null);
    }
    setMessage(null);
    
    const fileInput = document.getElementById('ad-video-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl`}>
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentVideoUrl && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6`}>
          <h3 className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Current Advertisement Video
          </h3>
          <div className="relative w-full max-w-4xl mx-auto">
            <video
              src={previewUrl || currentVideoUrl}
              controls
              className="w-full h-auto rounded-lg"
              style={{ maxHeight: '500px' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
        <h3 className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {currentVideoUrl ? 'Update Advertisement Video' : 'Upload Advertisement Video'}
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="ad-video-file-input"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Select Video File
            </label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="ad-video-file-input"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Upload size={18} />
                <span>Choose File</span>
              </label>
              <input
                id="ad-video-file-input"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile && (
                <div className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-sm ml-2 opacity-70">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              )}
            </div>
          </div>

          {previewUrl && selectedFile && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Preview
              </label>
              <div className="relative w-full max-w-2xl">
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: '300px' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : message.type === 'error' ? (
                <XCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {selectedFile && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Video size={18} />
                    <span>Upload Video</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={uploading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

