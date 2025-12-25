import { normalizeImageUrl } from '../services/api';

interface PromotersProps {
  setCurrentPage?: (page: string) => void;
}

const Promoters = ({ setCurrentPage }: PromotersProps) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-gray-50 via-red-50 to-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 text-center">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="bg-red-600 p-4 sm:p-6 rounded-full shadow-lg">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 uppercase tracking-tight mb-4 sm:mb-6">
            Promoters of the Group
          </h1>
          <div className="w-24 sm:w-32 md:w-40 h-1 bg-red-600 mx-auto mb-6 sm:mb-8"></div>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            The visionary founders and promoters who built Sahni Group into a trusted name since 1965
          </p>
        </div>
      </section>

      {/* Promoters Section */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            {/* Promoter Card 1 */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 overflow-hidden">
              <div className="flex flex-col items-center p-6 sm:p-8">
                <div className="relative mb-6">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-red-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <img
                      src={normalizeImageUrl('/images/promoters/gurjeeth.png')}
                      alt="Gurjeet Singh Sahni"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="150" cy="150" r="150" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">Sahni Group</text></svg>`)}`;
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
                  Gurjeet Singh Sahni
                </h3>
                <p className="text-base sm:text-lg text-gray-600 text-center leading-relaxed">
                <b>  Chairman & Managing Director </b>
                </p>
                <p className="text-sm sm:text-base text-gray-500 text-center mt-3 leading-relaxed">
                  Visionary leader who is Leading Sahni Group and guiding its growth across multiple business verticals.
                </p>
              </div>
            </div>

            {/* Promoter Card 2 */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 overflow-hidden">
              <div className="flex flex-col items-center p-6 sm:p-8">
                <div className="relative mb-6">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-red-200 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-gray-100">
                    <img
                      src={normalizeImageUrl('/images/promoters/ybbcas.jpeg')}
                      alt="Amandeep Kaur Sahni"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-red-600 text-white text-sm font-bold">A.K.S</div>';
                        }
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 text-center" style={{ lineHeight: '1.2' }}>
                  Amandeep Kaur Sahni
                </h3>
                <p className="text-base sm:text-lg text-gray-600 text-center leading-relaxed">
                 <b> Director </b>
                </p>
                <p className="text-sm sm:text-base text-gray-500 text-center mt-3 leading-relaxed">
                Strategic Partner Driving Group Backend Management and Operational Excellence
                </p>
              </div>
            </div>

            {/* Promoter Card 3 */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 overflow-hidden">
              <div className="flex flex-col items-center p-6 sm:p-8">
                <div className="relative mb-6">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-red-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <img
                      src={normalizeImageUrl('/images/promoters/madam1.jpeg')}
                      alt="madam2"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml,${encodeURIComponent(`<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg"><circle cx="150" cy="150" r="150" fill="#DC2626"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">Sahni Group</text></svg>`)}`;
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
                  Bhupinder Kaur Sahni
                </h3>
                <p className="text-base sm:text-lg text-gray-600 text-center leading-relaxed">
                 <b> Director </b>
                </p>
                <p className="text-sm sm:text-base text-gray-500 text-center mt-3 leading-relaxed">
                Key Contributor in the Group’s Petroleum Operations and Philanthropic Activities.
                </p>
              </div>
            </div>
          </div>

          {/* Legacy Section */}
          <div className="mt-16 sm:mt-20 md:mt-24">
            <div className="bg-gradient-to-r from-red-50 to-gray-50 rounded-xl shadow-lg border-2 border-red-100 p-8 sm:p-10 md:p-12">
              <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                  A Legacy of Excellence
                </h2>
                <div className="w-24 sm:w-32 md:w-40 h-1 bg-red-600 mx-auto mb-6 sm:mb-8"></div>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                  Since 1965, Sahni Group has been built on the foundation of trust, integrity, and commitment to excellence. 
                  Our promoters have been the driving force behind our growth, establishing strong relationships with leading 
                  brands like Tata Motors, Massey Ferguson, HP Lubricants, and many others.
                </p>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
                  Their vision and leadership have transformed Sahni Group into one of the most trusted names in the 
                  automotive and lubricants industry across Andhra Pradesh and Telangana.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Promoters;

