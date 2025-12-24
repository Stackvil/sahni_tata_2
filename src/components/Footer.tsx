import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { normalizeImageUrl } from '../services/api';

interface FooterProps {
  setCurrentPage: (page: string) => void;
}

export default function Footer({ setCurrentPage }: FooterProps) {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="flex items-center mb-4 space-x-3">
              <div className="bg-white p-2 rounded-lg shadow-md flex-shrink-0">
                <img
                  src={normalizeImageUrl('/images/GROUP (1).png')}
                  alt="Sahni Group Logo"
                  className="h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 object-contain"
                  style={{ maxHeight: '72px', maxWidth: '72px' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-logo-footer')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'fallback-logo-footer bg-red-600 text-white h-14 w-14 sm:h-16 sm:w-16 rounded-lg flex items-center justify-center font-black text-xl sm:text-2xl';
                      fallback.textContent = 'S';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col">
                <div className="text-lg sm:text-xl font-black text-white leading-tight brand-name">SAHNI</div>
              </div>
            </div>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              Your Trusted Partner for Vehicles, Lubricants & Automotive Solutions
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/sahniautopvtltd/" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Instagram size={20} />
              </a>
              <a href="https://www.facebook.com/SAHNITATA/" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Facebook size={20} />
              </a>
              <a href="https://www.youtube.com/@sahniautopvtltd" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-4 uppercase">Company</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://wa.me/919281029456"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-red-500 transition-colors text-left block py-2 min-h-[44px] flex items-center"
                >
                  Get a Quote
                </a>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentPage('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-gray-300 hover:text-red-500 transition-colors text-left block py-2 min-h-[44px] w-full text-left"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentPage('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-gray-300 hover:text-red-500 transition-colors text-left block py-2 min-h-[44px] w-full text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentPage('journey'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-gray-300 hover:text-red-500 transition-colors text-left block py-2 min-h-[44px] w-full text-left"
                >
                  Our Journey
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-4 uppercase">Services</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => { setCurrentPage('fuel-stations'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-gray-300 hover:text-red-500 transition-colors text-left block py-2 min-h-[44px] w-full text-left"
                >
                  Fuel Stations
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentPage('institutional-sales'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-gray-300 hover:text-red-500 transition-colors text-left block py-2 min-h-[44px] w-full text-left"
                >
                  Institutional Sales
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setCurrentPage('careers'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-gray-300 hover:text-red-500 transition-colors text-left block py-2 min-h-[44px] w-full text-left"
                >
                  Careers
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-4 uppercase">Find Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={20} className="mr-3 mt-1 flex-shrink-0" />
                <a
                  href="https://www.google.com/maps/dir//Sahni+Complex,+2nd+Cross+Rd,+Auto+Nagar,+Vijayawada,+Andhra+Pradesh+520007/@16.4984631,80.675735,17z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3a35fad90b21e801:0x8433da71029209b3!2m2!1d80.675735!2d16.4984631?entry=ttu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-red-500 transition-colors text-sm break-words leading-relaxed"
                >
                  Sahni Complex, 2nd Cross Rd, Auto Nagar, Vijayawada, Andhra Pradesh 520007
                </a>
              </li>
              <li className="flex items-center min-h-[44px]">
                <Phone size={20} className="mr-3 flex-shrink-0" />
                <a href="tel:+919281029456" className="text-gray-300 hover:text-red-500 transition-colors text-sm">+91 92810 29456</a>
              </li>
              <li className="flex items-start">
                <Mail size={20} className="mr-3 mt-1 flex-shrink-0" />
                <a href="mailto:sahniauto@gmail.com" className="text-gray-300 hover:text-red-500 transition-colors text-sm break-all">
                  sahniauto@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-300 text-sm">
          <p>&copy; {new Date().getFullYear()} by Sahni Group. All rights reserved.</p>
          <p className="mt-2">Founded in 1965 by Late Shri Harvinder Singh Sahni</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => { setCurrentPage('privacy-policy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-gray-400 hover:text-red-500 transition-colors text-xs underline min-h-[44px] px-4 py-2"
            >
              Privacy Policy
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => { setCurrentPage('terms-and-conditions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-gray-400 hover:text-red-500 transition-colors text-xs underline min-h-[44px] px-4 py-2"
            >
              Terms & Conditions
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => { setCurrentPage('admin-login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-gray-400 hover:text-red-500 transition-colors text-xs underline min-h-[44px] px-4 py-2"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
