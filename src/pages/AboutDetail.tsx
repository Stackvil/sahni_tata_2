import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { aboutAPI, normalizeImageUrl } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface AboutEntry {
  id: string;
  title: string;
  description: string;
  link?: string;
  image?: string;
}

interface AboutDetailProps {
  entryId: string;
  onBack: () => void;
}

export default function AboutDetail({ entryId, onBack }: AboutDetailProps) {
  const [entry, setEntry] = useState<AboutEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntry = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await aboutAPI.getAll();
        const entries = Array.isArray(data) ? data : [];
        
        // Find entry by ID
        const foundEntry = entries.find((item: any) => 
          String(item?.id || item?.about_id || item?.uuid) === entryId
        );
        
        if (foundEntry) {
          // Check if link is actually an image path
          const linkValue = foundEntry?.link || foundEntry?.cta || '';
          const isImagePath = linkValue && (
            linkValue.includes('/images/') ||
            linkValue.endsWith('.png') ||
            linkValue.endsWith('.jpg') ||
            linkValue.endsWith('.jpeg') ||
            linkValue.endsWith('.webp') ||
            linkValue.endsWith('.gif') ||
            linkValue.endsWith('.svg')
          );

          // Read possible image keys from backend
          const rawImage =
            foundEntry?.image ||
            foundEntry?.image_url ||
            foundEntry?.photo ||
            foundEntry?.banner ||
            foundEntry?.thumbnail ||
            (isImagePath ? linkValue : '');
          
          setEntry({
            id: String(foundEntry.id || foundEntry.about_id || foundEntry.uuid || entryId),
            title: foundEntry.title || foundEntry.heading || 'Untitled',
            description: foundEntry.description || foundEntry.details || '',
            // Only set link if it's not an image path
            link: isImagePath ? undefined : (linkValue || undefined),
            image: rawImage ? normalizeImageUrl(rawImage) : undefined,
          });
        } else {
          setError('Entry not found');
        }
      } catch (err: any) {
        console.error('Error loading about entry:', err);
        setError('Failed to load entry. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (entryId) {
      loadEntry();
    }
  }, [entryId]);

  if (loading) {
    return (
      <LoadingSpinner 
        message="Loading article..." 
        fullScreen={true} 
      />
    );
  }

  if (error || !entry) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Entry Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested entry could not be found.'}</p>
          <button
            onClick={onBack}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center"
          >
            <ArrowLeft size={20} className="mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Split description into paragraphs
  const paragraphs = entry.description
    .split('\n')
    .filter(p => p.trim())
    .map(p => p.trim());

  return (
    <div className="bg-white min-h-screen">
      {/* Header with Back Button */}
      <section className="bg-gray-900 text-white py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center text-white hover:text-red-400 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to About Us</span>
          </button>
        </div>
      </section>

      {/* Blog Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title */}
        <header className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            {entry.title}
          </h1>
          <div className="flex items-center text-gray-600 text-sm sm:text-base">
            <Calendar size={16} className="mr-2" />
            <span>Published on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </header>

        {/* Featured Image */}
        {entry.image && entry.image.trim() !== '' && (
          <div className="mb-8 sm:mb-12">
            <div className="w-full overflow-hidden rounded-2xl shadow-xl bg-gray-100">
              <img
                src={entry.image}
                alt={entry.title}
                className="w-full h-auto object-cover"
                onLoad={() => {
                  console.log(`[AboutDetail] Image loaded successfully: ${entry.title}`);
                }}
                onError={(e) => {
                  console.error(`[AboutDetail] Image failed to load: ${entry.title}`, {
                    imageUrl: entry.image
                  });
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400 rounded-2xl">Image not available</div>';
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed space-y-4 sm:space-y-6">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 sm:mb-6">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Share Section */}
        <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: entry.title,
                    text: entry.description.substring(0, 200),
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      </article>

      {/* Related Articles / Back to About */}
      <section className="bg-gray-50 py-8 sm:py-12 mt-12 sm:mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="w-full sm:w-auto bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors border border-gray-200 inline-flex items-center justify-center"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to About Us
          </button>
        </div>
      </section>
    </div>
  );
}

