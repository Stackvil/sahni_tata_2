import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Play } from 'lucide-react';
import { normalizeImageUrl } from '../services/api';

interface LaunchCountdownProps {
  onLaunch: () => void;
}

export default function LaunchCountdown({ onLaunch }: LaunchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLaunched, setIsLaunched] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const launchTimeRef = useRef<Date | null>(null);
  
  // Check if running on localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleLaunch = useCallback(() => {
    setIsLaunched(true);
    setShowVideo(true);
    // Play video when it's ready
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(console.error);
      }
    }, 100);
  }, []);

  const handleVideoEnd = () => {
    setShowVideo(false);
    onLaunch();
  };

  useEffect(() => {
    // Set launch time once when component mounts
    if (!launchTimeRef.current) {
      const now = new Date();
      let launchTime: Date;
      
      // Clear old stored launch time to force recalculation
      localStorage.removeItem('sahni_launch_time');
      
      // Calculate new launch time: 2:20 PM today
      launchTime = new Date();
      launchTime.setHours(14, 20, 0, 0);
      launchTime.setSeconds(0);
      launchTime.setMilliseconds(0);
      
      // If current time is past 2:00 PM today, set to tomorrow
      if (now.getTime() >= launchTime.getTime()) {
        launchTime.setDate(launchTime.getDate() + 1);
      }
      
      // Store the new launch time
      localStorage.setItem('sahni_launch_time', launchTime.getTime().toString());
      launchTimeRef.current = launchTime;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const launchTime = launchTimeRef.current!;
      const difference = launchTime.getTime() - now.getTime();

      if (difference <= 0) {
        // Timer reached 0, stop countdown and show button (don't auto-launch)
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // When timer reaches 0, stop the interval (button will appear)
      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        clearInterval(interval);
        // Don't auto-launch, just stop the timer
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocalhost]);

  const handleLaunchNow = () => {
    handleLaunch();
  };

  // Show video if launched
  if (showVideo) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onEnded={handleVideoEnd}
          onError={(e) => {
            console.error('Video error:', e);
            // If video fails, proceed to website
            handleVideoEnd();
          }}
          onCanPlay={() => {
            // Auto-play when video can play
            if (videoRef.current) {
              videoRef.current.play().catch((error) => {
                console.error('Video play error:', error);
              });
            }
          }}
          onLoadedMetadata={() => {
            // Try to play when metadata is loaded
            if (videoRef.current) {
              videoRef.current.play().catch(console.error);
            }
          }}
          playsInline
          autoPlay
        >
          <source src={normalizeImageUrl('/videos/Product Launch Video.mp4')} type="video/mp4" />
          <source src="/videos/Product Launch Video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (isLaunched && !showVideo) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-y-auto py-4 sm:py-6 md:py-8">
      <div className="text-center px-4 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto">
        {/* Logo/Brand Section */}
        <div className="mb-12 sm:mb-16 md:mb-20">
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <img
              src={normalizeImageUrl('/images/GROUP (1).png')}
              alt="Sahni Group Logo"
              className="h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-logo-countdown')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'fallback-logo-countdown bg-red-600 text-white h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 w-24 sm:w-32 md:w-40 lg:w-48 xl:w-56 rounded-lg flex items-center justify-center font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl shadow-xl';
                  fallback.textContent = 'S';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 uppercase tracking-tight">
            Sahni Group
          </h1>
          <div className="w-32 sm:w-40 md:w-48 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 font-normal">
            The website opening in
          </p>
        </div>

        {/* Countdown Timer - Clean Minimalist Style */}
        <div className="mb-12 sm:mb-16 md:mb-20">
          <div className="flex items-baseline justify-center gap-2 sm:gap-3 md:gap-4">
            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-2 leading-none">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 uppercase tracking-wide font-normal">
                Days
              </div>
            </div>

            {/* Separator */}
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mx-1 sm:mx-2">:</div>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-2 leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 uppercase tracking-wide font-normal">
                Hours
              </div>
            </div>

            {/* Separator */}
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mx-1 sm:mx-2">:</div>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-2 leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 uppercase tracking-wide font-normal">
                Minutes
              </div>
            </div>

            {/* Separator */}
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mx-1 sm:mx-2">:</div>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-2 leading-none">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 uppercase tracking-wide font-normal">
                Seconds
              </div>
            </div>
          </div>
        </div>

        {/* Launch Time Info */}
        <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          <p className="text-sm sm:text-base md:text-lg font-normal">
            Launching at 2:00 PM
          </p>
        </div>

        {/* Launch Now Button - Only show when timer reaches 0 */}
        {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 && (
          <div className="mt-6 mb-6 animate-fadeIn">
            <button
              onClick={handleLaunchNow}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 sm:py-4 sm:px-12 rounded-lg text-base sm:text-lg md:text-xl uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              Launch Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

