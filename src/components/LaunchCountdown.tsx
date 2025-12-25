import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
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

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const launchTime = new Date();
      
      // Always set launch time to tomorrow at 12:30 PM (local time)
      launchTime.setDate(now.getDate() + 1);
      launchTime.setHours(12, 30, 0, 0);
      launchTime.setSeconds(0);
      launchTime.setMilliseconds(0);

      const difference = launchTime.getTime() - now.getTime();

      if (difference <= 0) {
        setIsLaunched(true);
        onLaunch();
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
      
      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        clearInterval(interval);
        setIsLaunched(true);
        onLaunch();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onLaunch]);

  if (isLaunched) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
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
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          <p className="text-sm sm:text-base md:text-lg font-normal">
            Launching on {(() => {
              const launchDate = new Date();
              launchDate.setDate(launchDate.getDate() + 1);
              return launchDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
            })()} at 12:30 PM
          </p>
        </div>
      </div>
    </div>
  );
}

