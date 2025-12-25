import { useState, useEffect } from 'react';
import { Award, Trophy, Star, Sparkles } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { normalizeImageUrl } from '../services/api';

interface AwardsProps {
  setCurrentPage?: (page: string) => void;
}

interface AwardItem {
  id: number;
  image: string;
  title: string;
  description: string;
  year?: string;
}

const Awards = ({ setCurrentPage: _setCurrentPage }: AwardsProps) => {
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAwards();
  }, []);

  const loadAwards = async () => {
    setLoading(true);
    try {
      // Load awards directly from JSON file
      const response = await fetch('/awards.json');
      if (!response.ok) {
        throw new Error('Failed to load awards.json');
      }
      const data = await response.json();
      const awardsData = data.awards || [];
      
      if (awardsData.length > 0) {
        // Map JSON data to AwardItem format with CloudFront URLs
        const mappedAwards: AwardItem[] = awardsData.map((award: any, index: number) => {
          // Convert image URL to CloudFront URL
          const imagePath = award.logo_url || award.image || '';
          const normalizedImage = imagePath ? normalizeImageUrl(imagePath) : '';
          
          return {
            id: parseInt(award.id) || index + 1,
            image: normalizedImage,
            title: award.award_text || award.title || `Award ${index + 1}`,
            description: `Recognized for ${award.award_text || 'excellence'} in ${award.brand || 'the industry'}.`,
            year: award.year || '2024'
          };
        });
        setAwards(mappedAwards);
      } else {
        // Fallback to static data if JSON is empty
        setAwards(getFallbackAwards());
      }
    } catch (error) {
      console.error('Failed to load awards:', error);
      // Fallback to static data on error
      setAwards(getFallbackAwards());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackAwards = (): AwardItem[] => {
    // Fallback awards with CloudFront URLs
    return [
      {
        id: 1,
        image: normalizeImageUrl('/images/awards/IMG_20251209_124404 - Edited.webp'),
        title: 'TATA MOTORS , TATA CUSTOMER SUPPORT WINNER (LIMITED RANGE) FY 25-26 SAHNI AUTO VIJAYAWADA',
        description: 'Recognized for outstanding customer support performance in the limited range category.',
        year: '2025'
      },
      {
        id: 2,
        image: normalizeImageUrl('/images/awards/IMG_20251209_124421 - Edited.webp'),
        title: 'TATA MOTORS TATA CUSTOMER SUPPORT WINNER (LIMITED RANGE) FY 25-26 SAHNI AUTO VIJAYAWADA',
        description: 'Awarded for achieving excellence in customer support in the limited range segment.',
        year: '2025'
      },
      {
        id: 3,
        image: normalizeImageUrl('/images/awards/IMG_20251209_124431 - Edited.webp'),
        title: 'TATA MOTORS TATA MD AWARD TATA INTRA FY 25-26 SAHNI AUTO VIJAYAWADA',
        description: 'Recognized with the MD Award for outstanding performance in TATA INTRA segment.',
        year: '2025'
      },
      {
        id: 4,
        image: normalizeImageUrl('/images/awards/IMG_20251209_124556 - Edited.webp'),
        title: 'TATA MOTORS BEST INTRA DEALER CHAMPION For the Month of October 2023 SAHNI AUTO PVT LTD.',
        description: 'Awarded as Best INTRA Dealer Champion for outstanding performance in October 2023.',
        year: '2023'
      },
      {
        id: 5,
        image: normalizeImageUrl('/images/awards/IMG_20251209_124810 - Edited.webp'),
        title: 'TATA MOTORS TATA 13K PROJECT-WINNER TATA INTRA FY 22-23 SAHNI AUTO PVT LTD VIJAYAWADA',
        description: 'Recognized as winner of the 13K Project in TATA INTRA segment for FY 22-23.',
        year: '2023'
      },
      {
        id: 6,
        image: normalizeImageUrl('/images/awards/IMG_20251209_125043 - Edited.webp'),
        title: 'CERTIFICATE OF APPRECIATION TATA FY24-25 July-Sept',
        description: 'This certificate is proudly presented to SAHNI AUTO PVT. LTD. In recognition of the outstanding performance for New Business in Commercial Vehicle Segment (SCV) in the South region',
        year: '2024'
      },
      {
        id: 7,
        image: normalizeImageUrl('/images/awards/IMG_20251209_125136 - Edited.webp'),
        title: 'CERTIFICATE OF APPRECIATION TATA FY24-25 July-Sept',
        description: 'This certificate is proudly presented to SAHNI AUTO PVT. LTD. In recognition of the outstanding performance for New Business in Commercial Vehicle Segment (SCV) in the South region',
        year: '2024'
      },
      {
        id: 8,
        image: normalizeImageUrl('/images/awards/IMG_20251209_125334 - Edited.webp'),
        title: 'INTRA V50 CHAMPIONS FY 2025 SAHNI TEAM',
        description: 'Recognized as INTRA V50 Champions for the financial year 2025.',
        year: '2025'
      },
      {
        id: 9,
        image: normalizeImageUrl('/images/awards/IMG_20251209_125354 - Edited.webp'),
        title: 'TATA INTRA Micro Market ODO Champion Winner Mr. JAKEER Sahni Auto Pvt Ltd',
        description: 'Recognized as Micro Market ODO Champion Winner for outstanding performance.',
        year: '2024'
      },
      {
        id: 11,
        image: normalizeImageUrl('/images/awards/lubricants/1__2_-removebg-preview.png'),
        title: 'HIGHEST VOLUME- MCO APR 24-FEB 25 M/S SAHNI AUTO AGENCIES VISAKH LUBE RO',
        description: 'Awarded for achieving highest volume in MCO category from April 2024 to February 2025.',
        year: '2025'
      },
      {
        id: 12,
        image: normalizeImageUrl('/images/awards/lubricants/1__3_-removebg-preview.png'),
        title: 'Automobile Mechanics Association President GANDHAM VENKATESWARAO (Konda) Garu 10-07-2025',
        description: 'Recognition from Automobile Mechanics Association.',
        year: '2025'
      },
      {
        id: 13,
        image: normalizeImageUrl('/images/awards/lubricants/1__4_-removebg-preview.png'),
        title: 'M/s Sahni Auto Agencies Visakh Lubes Region Performance Champion FY 2023-24',
        description: 'Silver Jubilee Channel Partners Meet December 15th-16th, 2024 Goa',
        year: '2024'
      },
      {
        id: 14,
        image: normalizeImageUrl('/images/awards/lubricants/1__5_-removebg-preview.png'),
        title: 'Award For Outstanding Performance - 16 YEARS as Lube Distributor',
        description: 'Presented to M/s. SAHNI AUTO AGENCIES VIJAYAWADA in Recognition of completing (16 YEARS) as Lube Distributor of HP Lubricants 23.05.22',
        year: '2022'
      },
      {
        id: 15,
        image: normalizeImageUrl('/images/awards/lubricants/1__6_-removebg-preview.png'),
        title: 'HP LUBRICANTS Award For Outstanding Performance - 16 YEARS',
        description: 'Presented to M/s. SAHNI AUTO AGENCIES VIJAYAWADA in Recognition of completing 16 YEARS Lube Distributor of HP Lubricants',
        year: '2022'
      },
      {
        id: 16,
        image: normalizeImageUrl('/images/awards/lubricants/1__7_-removebg-preview.png'),
        title: 'HP LUBRICANTS SECUNDERABAD LUBE RO Excellence Award BLD Channel 2023-24',
        description: 'Gear Oils Series Sama Trading',
        year: '2024'
      },
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading awards..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section with Animation */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-red-600 via-red-700 to-red-800 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8 animate-fade-in-up">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative bg-white p-6 sm:p-8 rounded-full shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-red-600" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up animation-delay-200 uppercase tracking-tight">
            Our Awards & Achievements
          </h1>
          
          <div className="w-32 sm:w-40 md:w-48 h-1.5 bg-yellow-400 mx-auto mb-8 animate-slide-in animation-delay-400"></div>
          
          <p className="text-lg sm:text-xl md:text-2xl text-yellow-100 max-w-3xl mx-auto animate-fade-in-up animation-delay-600 leading-relaxed">
            Celebrating excellence, innovation, and outstanding performance across all our business verticals
          </p>

          {/* Floating Icons */}
          <div className="absolute top-20 left-10 animate-float">
            <Sparkles className="w-8 h-8 text-yellow-300 opacity-60" />
          </div>
          <div className="absolute bottom-20 right-10 animate-float animation-delay-2000">
            <Star className="w-10 h-10 text-yellow-300 opacity-60 fill-current" />
          </div>
        </div>
      </section>

      {/* Awards Gallery Section - Alternating Left/Right Layout */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Recognition & Honors
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Each award represents our commitment to excellence and dedication to serving our customers
            </p>
          </div>
        </div>

        {/* Awards List - Alternating Layout */}
        <div className="space-y-0">
            {awards.map((award, index) => {
              const isEven = index % 2 === 0;
              const isLeft = isEven;
              
              return (
                <div
                  key={award.id}
                  className={`group flex flex-col ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-stretch animate-fade-in-up`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Award Image */}
                  <div className={`w-full lg:w-1/4 relative overflow-hidden`}>
                    <img
                      src={normalizeImageUrl(award.image)}
                      alt={award.title}
                      className="w-full h-full min-h-[150px] sm:min-h-[180px] lg:min-h-[220px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Try fallback image
                        const fallbackImage = normalizeImageUrl('/images/awards/IMG_20251209_124404 - Edited.webp');
                        if (target.src !== fallbackImage) {
                          target.src = fallbackImage;
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  </div>

                  {/* Award Content */}
                  <div className={`w-full lg:w-3/4 flex flex-col justify-center p-8 sm:p-12 lg:p-16 ${isLeft ? 'lg:pl-12' : 'lg:pr-12'}`}>
                    {/* Award Number Badge */}
                    <div className="inline-flex items-center gap-2 text-red-600 px-4 py-2 text-sm font-bold mb-6">
                      <Trophy className="w-4 h-4" />
                      <span>AWARD #{String(award.id).padStart(2, '0')}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 group-hover:text-red-600 transition-colors duration-300 leading-tight">
                      {award.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed mb-8">
                      {award.description}
                    </p>

                    {/* Award Details */}
                    <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-gray-300">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold">Recognition Award</span>
                      </div>
                      {award.year && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Award className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-semibold">Year: {award.year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      </section>

      {/* Stats Section with Animation */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 via-red-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-gray-100 hover:border-red-500 transform hover:scale-105 transition-all duration-300 animate-fade-in-up">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-red-600 to-red-700 p-5 rounded-full shadow-lg">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3">
                {awards.length}+
              </div>
              <div className="text-lg sm:text-xl font-semibold text-gray-600 uppercase tracking-wide">
                Total Awards
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-gray-100 hover:border-blue-500 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-200">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-full shadow-lg">
                    <Star className="w-10 h-10 text-white fill-current" />
                  </div>
                </div>
              </div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3">
                100%
              </div>
              <div className="text-lg sm:text-xl font-semibold text-gray-600 uppercase tracking-wide">
                Excellence Rate
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-gray-100 hover:border-yellow-500 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-400">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-yellow-600 to-yellow-700 p-5 rounded-full shadow-lg">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3">
                60+
              </div>
              <div className="text-lg sm:text-xl font-semibold text-gray-600 uppercase tracking-wide">
                Years of Excellence
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom CSS for Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-in {
          animation: slide-in 1s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Awards;

