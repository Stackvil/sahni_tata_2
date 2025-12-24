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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            {/* Shaik Jakker Basha */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 overflow-hidden">
              <div className="flex flex-col items-center p-6 sm:p-8">
                <div className="relative mb-6">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-red-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <img
                      src={normalizeImageUrl('/images/Management Team/uio.JPG')}
                      alt="Shaik Jakker Basha"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="150" cy="150" r="150" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">S.J.B</text></svg>`)}`;
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
                  Shaik Jakker Basha
                </h3>
                <p className="text-base sm:text-lg text-gray-600 text-center leading-relaxed">
                  G.M. Tata Vehicles & Institutional Sales
                </p>
              </div>
            </div>

            {/* Shaik Kareem */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 overflow-hidden">
              <div className="flex flex-col items-center p-6 sm:p-8">
                <div className="relative mb-6">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-red-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <img
                      src={normalizeImageUrl('/images/Management Team/gyu.jpeg')}
                      alt="Shaik Kareem"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="150" cy="150" r="150" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">S.K</text></svg>`)}`;
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
                  Shaik Kareem
                </h3>
                <p className="text-base sm:text-lg text-gray-600 text-center leading-relaxed">
                  G.M. Lubricants Distribution
                </p>
              </div>
            </div>

            {/* Venu Gopi K */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 overflow-hidden">
              <div className="flex flex-col items-center p-6 sm:p-8">
                <div className="relative mb-6">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-red-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <img
                      src={normalizeImageUrl('/images/Management Team/blank-avatar-photo-place-holder-600nw-1095249842.webp')}
                      alt="Venu Gopi K"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="150" cy="150" r="150" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">V.G.K</text></svg>`)}`;
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
                  Venu Gopi K
                </h3>
                <p className="text-base sm:text-lg text-gray-600 text-center leading-relaxed">
                  Manager - Accounts & Admin
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Management;

