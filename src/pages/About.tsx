import { useEffect, useState } from 'react';
import { Target, Eye, Award, Users } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { aboutAPI, normalizeImageUrl } from '../services/api';

interface AboutEntry {
  id: string;
  title: string;
  description: string;
  link?: string;
  image?: string;
}

const normalizeAboutEntries = (items: any[]): AboutEntry[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => {
    // Check if link is actually an image path
    const linkValue = item?.link || item?.cta || '';
    const isImagePath = linkValue && (
      linkValue.includes('/images/') ||
      linkValue.endsWith('.png') ||
      linkValue.endsWith('.jpg') ||
      linkValue.endsWith('.jpeg') ||
      linkValue.endsWith('.webp') ||
      linkValue.endsWith('.gif') ||
      linkValue.endsWith('.svg')
    );

    // Read possible image keys from backend (including 'file' which backend uses)
    const rawImage =
      item?.file ||
      item?.image ||
      item?.image_url ||
      item?.photo ||
      item?.banner ||
      item?.thumbnail ||
      (isImagePath ? linkValue : '');

    return {
      id: String(item?.id || item?.about_id || item?.uuid || index),
      title: item?.title || item?.heading || `Highlight ${index + 1}`,
      description: item?.description || item?.details || '',
      // Only set link if it's not an image path
      link: isImagePath ? undefined : (linkValue || undefined),
      // Store final, normalized image URL here
      image: rawImage ? normalizeImageUrl(rawImage) : undefined,
    };
  });
};

interface AboutProps {
  setCurrentPage?: (page: string) => void;
  setSelectedAboutEntryId?: (id: string | null) => void;
}

export default function About({ setCurrentPage, setSelectedAboutEntryId }: AboutProps) {
  const [entries, setEntries] = useState<AboutEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  useEffect(() => {
    const loadAboutEntries = async () => {
      setLoadingEntries(true);
      setEntriesError(null);

      try {
        const data = await aboutAPI.getAll();
        const normalized = normalizeAboutEntries(data);
        setEntries(normalized);
        // If no entries, we show the static empty state below
      } catch (error: any) {
        console.warn('Failed to load about entries:', error);
        const errorMessage = error?.message || '';
        if (
          errorMessage.includes('Database connection') ||
          errorMessage.includes('could not translate host name') ||
          errorMessage.includes('OperationalError')
        ) {
          // Backend DB issue: don't show scary error to users
          setEntriesError(null);
        } else {
          setEntriesError(
            errorMessage ||
              'Unable to fetch the latest about highlights at the moment.'
          );
        }
      } finally {
        setLoadingEntries(false);
      }
    };

    loadAboutEntries();
  }, []);

  return (
    <div className="bg-white pattern-diamond">
      {/* Header Section */}
      <section className="relative h-[300px] sm:h-[400px] md:h-[500px] bg-gray-900 text-white overflow-hidden" style={{ zIndex: 1 }}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={normalizeImageUrl('/images/aboutus.png')}
            alt="About Sahni Group"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                'https://images.unsplash.com/photo-1556761175-b413dfb5e3d7?w=1920&h=1080&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-red-600 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg mb-4 sm:mb-6 inline-block shadow-xl">
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white uppercase tracking-wide">
                About Us
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-2 sm:mb-4 text-white px-2">
              OUR STORY
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto px-2">
              60+ Years of Excellence and Innovation
            </p>
          </div>
        </div>
      </section>


      {/* Dynamic Highlights Section */}
      <section className="py-6 sm:py-8 md:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingEntries && (
            <div className="py-8">
              <LoadingSpinner
                message="Loading latest highlights..."
                fullScreen={false}
              />
            </div>
          )}

          {!loadingEntries && entriesError && (
            <div className="bg-white border border-red-100 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">
                Unable to load highlights
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {entriesError}
              </p>
            </div>
          )}

          {!loadingEntries && !entriesError && entries.length > 0 && (
            <div className="space-y-6 sm:space-y-8">
              {entries.map((entry, index) => {
                console.log(`[About] Rendering entry ${index}:`, {
                  id: entry.id,
                  title: entry.title,
                  hasImage: !!entry.image,
                  imageUrl: entry.image,
                });

                const hasImage =
                  entry.image && entry.image.trim() !== '';

                return (
                  <div key={entry.id} className="flex justify-center">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 max-w-4xl w-full">
                      {/* Title */}
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        {entry.title}
                      </h3>

                      {/* Image + Text layout */}
                      {hasImage ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-4 sm:mb-6 items-start">
                          {/* Image */}
                          <div className="w-full">
                            <div className="w-full overflow-hidden rounded-lg shadow-md bg-gray-100">
                              <img
                                src={entry.image}
                                alt={entry.title}
                                className="w-full h-full max-h-72 object-cover block"
                                style={{ pointerEvents: 'none' }}
                                onLoad={() => {
                                  console.log(
                                    `[About] Image loaded successfully for entry: ${entry.title}`
                                  );
                                }}
                                onError={(e) => {
                                  console.error(
                                    `[About] Image failed to load for entry: ${entry.title}`,
                                    {
                                      imageUrl: entry.image,
                                    }
                                  );
                                  const target =
                                    e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML =
                                      '<div class="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400 rounded-lg text-sm">Image not available</div>';
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div className="text-base sm:text-lg text-gray-700 leading-relaxed">
                            {entry.description
                              .split('\n')
                              .filter((p) => p.trim()).length > 1 ? (
                              entry.description
                                .split('\n')
                                .map((paragraph, pIndex) =>
                                  paragraph.trim() ? (
                                    <p
                                      key={pIndex}
                                      className="mb-3 sm:mb-4"
                                    >
                                      {paragraph.trim()}
                                    </p>
                                  ) : null
                                )
                            ) : (
                              <p>{entry.description}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Only text if no image
                        <div className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                          {entry.description
                            .split('\n')
                            .filter((p) => p.trim()).length > 1 ? (
                            entry.description
                              .split('\n')
                              .map((paragraph, pIndex) =>
                                paragraph.trim() ? (
                                  <p
                                    key={pIndex}
                                    className="mb-3 sm:mb-4"
                                  >
                                    {paragraph.trim()}
                                  </p>
                                ) : null
                              )
                          ) : (
                            <p>{entry.description}</p>
                          )}
                        </div>
                      )}

                      {/* Learn More Link */}
                      <button
                        onClick={() => {
                          if (setCurrentPage && setSelectedAboutEntryId) {
                            setSelectedAboutEntryId(entry.id);
                            setCurrentPage('about-detail');
                          }
                        }}
                        className="inline-flex items-center text-red-600 font-semibold text-base sm:text-lg hover:text-red-700 transition-colors group"
                      >
                        LEARN MORE
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">
                          &gt;
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loadingEntries && !entriesError && entries.length === 0 && null}
        </div>
      </section>

      {/* About Section */}
      <section className="py-6 sm:py-8 md:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Our Story
              </h2>
              <div className="w-16 sm:w-20 md:w-24 h-1 bg-red-600 mb-4 sm:mb-6" />
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-3 sm:mb-4 leading-relaxed">
                Founded in 1965 at Vijayawada by Late Harvinder Singh
                Sahni, Sahni Group has grown into a diversified business
                with interests in fuel retail, lubricants distribution,
                aftermarket sales, institutional supplies, and vehicle
                dealerships.
              </p>
              <p className="text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed">
                With operations across Andhra Pradesh and Telangana, the
                group employs 300+ people and partners with leading global
                brands.
              </p>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                Over six decades, Sahni Group has evolved from a single
                venture into a diversified conglomerate spanning critical
                sectors of the automotive and energy industries, serving
                both retail customers and major institutional clients with
                equal dedication.
              </p>
            </div>

            <div className="relative">
              <img
                src={normalizeImageUrl('/images/aboutus.png')}
                alt="Sahni Group - Our Story"
                className="w-full h-auto rounded-2xl shadow-xl object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 to-transparent p-4 rounded-b-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-lg text-center border border-white/30">
                    <div className="text-2xl font-bold mb-1">60+</div>
                    <div className="text-xs text-gray-200">
                      Years Experience
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-lg text-center border border-white/30">
                    <div className="text-2xl font-bold mb-1">300+</div>
                    <div className="text-xs text-gray-200">
                      Skilled Professionals
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              OUR COMPANY&apos;S
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Vision */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="bg-gray-800 text-white px-6 py-4 flex items-center">
                <Eye size={32} className="mr-3" />
                <h3 className="text-2xl font-bold">VISION</h3>
              </div>
              <div className="p-8">
                <p className="text-lg text-gray-700 text-center leading-relaxed">
                  To be a trusted leader in automotive and energy
                  solutions, delivering value through innovation,
                  integrity, and customer-focused service excellence.
                </p>
              </div>
            </div>

            {/* Mission */}
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="bg-gray-800 text-white px-6 py-4 flex items-center">
                <Target size={32} className="mr-3" />
                <h3 className="text-2xl font-bold">MISSION</h3>
              </div>
              <div className="p-8">
                <p className="text-lg text-gray-700 text-center leading-relaxed">
                  Empowering growth with reliable products, strong
                  partnerships, and sustainable practices while creating
                  opportunities and contributing to communities we serve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <Award size={40} className="text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Integrity
              </h3>
              <p className="text-gray-700">
                We conduct business with the highest ethical standards,
                building trust with every interaction.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <Users size={40} className="text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                People First
              </h3>
              <p className="text-gray-700">
                Our employees, customers, and communities are at the heart
                of everything we do.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <Target size={40} className="text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Excellence
              </h3>
              <p className="text-gray-700">
                We strive for excellence in every aspect of our business,
                continuously improving and innovating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-6 sm:py-8 md:py-10 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Leadership
            </h2>
            <div className="w-16 sm:w-20 md:w-24 h-1 bg-red-600 mx-auto" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            {/* Gurjeet Singh Sahni */}
            <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-lg">
              <div className="text-center mb-4 sm:mb-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-yellow-400 shadow-xl">
                  <img
                    src={normalizeImageUrl('/images/gurjeeth.png')}
                    alt="Gurjeet Singh Sahni"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                Gurjeet Singh Sahni
              </h3>
              <p className="text-lg sm:text-xl mb-3 sm:mb-4 text-center text-gray-300">
                Managing Director
              </p>
              <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                {/* <p className="text-sm sm:text-base text-gray-300"></p> */}
                <p className="text-sm sm:text-base text-gray-300">
                  • Joint Secretary - Andhra Chamber of Commerce Industry and Federation.
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • General Secretary - NSM Old Students Association
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • Core Committee Member - Society for Vibrant Vijayawada
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • Executive Member - Andhra Motor Merchants Association
                  (AMMA)
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • Past President - BNI Alpha with All time Record of 100
                  Crore Business
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  • Director Community Service - Rotary Club of Vijayawada Mid-Town.
                </p>
                <p className="text-sm sm:text-base text-gray-300">
              
                </p>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-center mb-4 sm:mb-6">
                Leading Sahni Group into a new era while honoring the
                vision of founder Late Shri Harvinder Singh Sahni. Under his
                leadership, the group continues to expand its presence
                across multiple sectors, creating opportunities and
                building lasting value for the community.
              </p>
            </div>

            {/* Late Shri Harvinder Singh Sahni */}
            <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-lg">
              <div className="text-center mb-4 sm:mb-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-4 border-yellow-400 shadow-xl">
                  <img
                    src={normalizeImageUrl('/images/founder.png')}
                    alt="Late Shri Harvinder Singh Sahni"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                Late Shri Harvinder Singh Sahni
              </h3>
              <p className="text-lg sm:text-xl mb-3 sm:mb-4 text-center text-gray-300">
                Founder (1965)
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-center mb-3 sm:mb-4">
                A visionary entrepreneur who established Sahni Group in
                1965 with a clear mission: Building Businesses, Creating
                Employment.
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-center">
                His legacy of integrity, hard work, and community service
                continues to inspire our organization today. Starting from
                Vijayawada, his vision was clear: to build businesses that
                not only thrive but also create meaningful employment
                opportunities for the community.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
