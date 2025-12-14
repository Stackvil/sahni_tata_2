import { normalizeImageUrl } from '../services/api';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = "Thank you for visiting us. Please wait...", 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const containerClass = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50"
    : "py-20 flex items-center justify-center";
  
  return (
    <div className={containerClass}>
      <div className="text-center max-w-md mx-auto px-4">
        {/* Animated Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 animate-ping">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full border-4 border-red-600 opacity-20"></div>
            </div>
            {/* Rotating ring animation */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full border-4 border-transparent border-t-red-600 opacity-30"></div>
            </div>
            {/* Logo with scale animation */}
            <div className="relative">
              <img
                src={normalizeImageUrl('/images/logo.jpg')}
                alt="Sahni Group Logo"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain rounded-lg shadow-xl"
                style={{ 
                  animation: 'logoPulse 2s ease-in-out infinite'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.fallback-logo-loading')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-logo-loading bg-red-600 text-white w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-lg flex items-center justify-center font-black text-4xl sm:text-5xl md:text-6xl shadow-xl';
                    fallback.textContent = 'S';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        {/* SAHNI GROUP - Big and Bold */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-4 tracking-tight">
          SAHNI GROUP
        </h1>
        
        {/* Loading Dots Animation */}
        <div className="flex justify-center space-x-2 mt-6">
          <div className="h-3 w-3 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-3 w-3 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-3 w-3 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

