import { normalizeImageUrl } from '../services/api';

interface ManagementProps {
  setCurrentPage?: (page: string) => void;
}

const Management = ({ setCurrentPage }: ManagementProps) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 uppercase tracking-tight mb-4 sm:mb-6">
            Management Team
          </h1>
          <div className="w-24 sm:w-32 md:w-40 h-1 bg-red-600 mx-auto mb-6 sm:mb-8"></div>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Meet our experienced leadership team dedicated to excellence and innovation
          </p>
        </div>
      </section>

      {/* Management Team Section */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Top Section - 5 Team Members with Circular Portraits */}
          <div className="mb-12 sm:mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 md:gap-10 max-w-5xl mx-auto">
              {/* First Row - 2 members */}
              <div className="col-span-2 md:col-span-1 flex justify-center">
                <div className="flex flex-col items-center text-center w-full max-w-xs">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <img
                        src={normalizeImageUrl('/images/management/pv-satyanarayana.jpg')}
                        alt="Mr. P.V. Satyanarayana"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">P.V.S</text></svg>`)}`;
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Mr. P.V. Satyanarayana</h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">Varun Group, Varun Finance, Lakshmi Finance Pvt. Ltd.</p>
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 flex justify-center">
                <div className="flex flex-col items-center text-center w-full max-w-xs">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <img
                        src={normalizeImageUrl('/images/management/rc-raju.jpg')}
                        alt="Mr. R.C. Raju"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">R.C.R</text></svg>`)}`;
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Mr. R.C. Raju</h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">Varun Maruti Division</p>
                </div>
              </div>

              {/* Second Row - 3 members */}
              <div className="col-span-2 md:col-span-1 flex justify-center">
                <div className="flex flex-col items-center text-center w-full max-w-xs">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <img
                        src={normalizeImageUrl('/images/management/t-vinod-kumar.jpg')}
                        alt="Mr. T. Vinod Kumar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">T.V.K</text></svg>`)}`;
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Mr. T. Vinod Kumar</h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">Varun JCB Division</p>
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 flex justify-center">
                <div className="flex flex-col items-center text-center w-full max-w-xs">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <img
                        src={normalizeImageUrl('/images/management/v-subba-rao.jpg')}
                        alt="Mr. V. Subba Rao"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">V.S.R</text></svg>`)}`;
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Mr. V. Subba Rao</h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">Varun Trucking Division - Bharat Benz</p>
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 flex justify-center">
                <div className="flex flex-col items-center text-center w-full max-w-xs">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <img
                        src={normalizeImageUrl('/images/management/dk-raju.jpg')}
                        alt="Mr. D. K. Raju"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="100" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">D.K.R</text></svg>`)}`;
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Mr. D. K. Raju</h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">Varun Division & Maruti Suzuki Bangalore operating channel</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Management Team with Rectangular Portraits */}
          <div className="mt-12 sm:mt-16">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 uppercase tracking-tight mb-3 sm:mb-4">
                Management Team
              </h2>
              <div className="w-20 sm:w-24 md:w-32 h-1 bg-blue-600 mx-auto"></div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
              {/* Mr. G. V. P. Raju */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-40 sm:w-40 sm:h-48 md:w-48 md:h-56 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
                      <img
                        src={normalizeImageUrl('/images/management/gvp-raju.jpg')}
                        alt="Mr. G. V. P. Raju"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="250" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="250" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">G.V.P.R</text></svg>`)}`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Mr. G. V. P. Raju</h3>
                    <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold">Vice President - Group Finance</p>
                  </div>
                </div>
              </div>

              {/* Dr. Bangaru Raju */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-40 sm:w-40 sm:h-48 md:w-48 md:h-56 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
                      <img
                        src={normalizeImageUrl('/images/management/bangaru-raju.jpg')}
                        alt="Dr. Bangaru Raju"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="250" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="250" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">B.R</text></svg>`)}`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Dr. Bangaru Raju</h3>
                    <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold">Vice President - Varun Health Centers</p>
                  </div>
                </div>
              </div>

              {/* Naga Vinod Yalamarthy */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-40 sm:w-40 sm:h-48 md:w-48 md:h-56 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
                      <img
                        src={normalizeImageUrl('/images/management/naga-vinod-yalamarthy.jpg')}
                        alt="Naga Vinod Yalamarthy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="250" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="250" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">N.V.Y</text></svg>`)}`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Naga Vinod Yalamarthy</h3>
                    <p className="text-base sm:text-lg md:text-xl text-gray-700 font-semibold">Chief Finance Officer - Varun Group</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Management;

