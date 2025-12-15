import { useEffect, useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageCircle } from 'lucide-react';
import { showroomsAPI, normalizeImageUrl } from '../services/api';

interface PrimaryShowroom {
  city: string;
  address: string;
  phone: string;
  email: string;
  image?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [primaryShowroom, setPrimaryShowroom] = useState<PrimaryShowroom | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    const loadPrimaryShowroom = async () => {
      try {
        const response = await showroomsAPI.getAll();
        const items = Array.isArray(response)
          ? response
          : (response as any)?.showrooms || (response as any)?.data || [];

        if (!Array.isArray(items) || items.length === 0) {
          return;
        }

        const main =
          items.find((s: any) => s.is_main === true || s.isMain === true) ||
          items[0];

        setPrimaryShowroom({
          city: main.city || 'Vijayawada',
          address:
            main.address ||
            '#48-16-7/5A, Mahanadu Road, Vijayawada - 520008',
          phone: main.phone || '+91 98485 29755',
          email: main.email || 'sahniauto@gmail.com',
          image: main.image || (Array.isArray(main.images) ? main.images[0] : undefined),
        });
      } catch (error) {
        // On error, fall back to static defaults
        console.warn('[Contact] Failed to load showrooms for contact info:', error);
      }
    };

    loadPrimaryShowroom();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build WhatsApp message with form data
    const whatsappMessage = `Hello Sahni Auto Group,

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}
Subject: ${formData.subject || 'General Inquiry'}

Message:
${formData.message}`;
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Redirect to WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/919848529755?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    // Reset form after a short delay
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white pattern-diamond">
      {/* Header Section */}
      <section className="relative h-[300px] sm:h-[400px] md:h-[500px] bg-gray-900 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={
              heroImageError
                ? 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&h=1080&fit=crop'
                : normalizeImageUrl(
                    primaryShowroom?.image || '/images/95cdfeef.jpg'
                  )
            }
            alt="Contact Us"
            className="w-full h-full object-cover"
            onError={(e) => {
              setHeroImageError(true);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-red-600 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg mb-4 sm:mb-6 inline-block shadow-xl">
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white uppercase tracking-wide">Contact Us</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-2 sm:mb-4 text-white px-2">Get In Touch</h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 px-2">We're Here to Help You</p>
          </div>
        </div>
      </section>

      {/* Contact Information and Form */}
      <section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Get in Touch</h2>
              <div className="w-16 sm:w-20 md:w-24 h-1 bg-red-600 mb-4 sm:mb-6"></div>
              <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8">
                Have questions about our products or services? Want to explore partnership opportunities? Our team is ready to assist you.
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <div className="bg-red-600 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                    <Phone className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Phone</h3>
                    <a
                      href={`tel:${(primaryShowroom?.phone || '+91 98485 29755')
                        .replace(/\s/g, '')}`}
                      className="text-red-600 hover:text-red-700 transition-colors text-base sm:text-lg font-semibold block break-all"
                    >
                      {primaryShowroom?.phone || '+91 98485 29755'}
                    </a>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">Mon - Sat: 9:00 AM - 7:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <div className="bg-red-600 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                    <Mail className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Email</h3>
                    <a
                      href={`mailto:${primaryShowroom?.email || 'sahniauto@gmail.com'}`}
                      className="text-red-600 hover:text-red-700 transition-colors text-base sm:text-lg font-semibold block break-all"
                    >
                      {primaryShowroom?.email || 'sahniauto@gmail.com'}
                    </a>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <div className="bg-red-600 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                    <MapPin className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Head Office</h3>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        primaryShowroom?.address ||
                          '#48-16-7/5A, Mahanadu Road, Vijayawada - 520008'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 text-base sm:text-lg hover:text-red-600 transition-colors block"
                    >
                      {(primaryShowroom?.address ||
                        '#48-16-7/5A, Mahanadu Road, Vijayawada - 520008')
                        .split('\n')
                        .map((line, idx) => (
                          <span key={idx}>
                            {line}
                            <br />
                          </span>
                        ))}
                    </a>
                  </div>
                </div>

                <div className="flex items-start bg-gray-50 p-4 sm:p-6 rounded-lg">
                  <div className="bg-red-600 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                    <MessageCircle className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">WhatsApp</h3>
                    <a
                      href="https://wa.me/919848529755"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-700 transition-colors text-base sm:text-lg font-semibold block"
                    >
                      Chat with us on WhatsApp
                    </a>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">Quick response for urgent queries</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-xl border-2 border-blue-100">
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-4 sm:mb-6">Send Us a Message</h2>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-blue-900 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-blue-900 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-blue-900 mb-2">
                        Subject *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                      >
                        <option value="">Select a subject</option>
                        <option value="fuel-stations">Fuel Stations</option>
                        <option value="lubricants">Lubricants Distribution</option>
                        <option value="aftermarket">Aftermarket Sales</option>
                        <option value="institutional">Institutional Sales</option>
                        <option value="dealership">Vehicle Dealerships</option>
                        <option value="partnership">Partnership Opportunities</option>
                        <option value="other">Other Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-blue-900 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                        placeholder="Tell us how we can help you..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg hover:bg-red-700 transition-colors flex items-center justify-center min-h-[44px]"
                    >
                      <MessageCircle className="mr-2" size={20} />
                      <span className="text-sm sm:text-base">Send Message via WhatsApp</span>
                    </button>
                  </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Find Us on the Map</h2>
              <div className="w-16 sm:w-20 md:w-24 h-1 bg-red-600 mx-auto"></div>
          </div>

          <div className="rounded-lg overflow-hidden shadow-xl border-2 sm:border-4 border-red-600">
            <iframe
              src="https://www.google.com/maps?q=16.5128133,80.6725531&hl=en&z=16&output=embed"
              width="100%"
              height="300"
              className="sm:h-[400px] md:h-[450px]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Sahni Group Head Office Location"
            ></iframe>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <a
              href="https://wa.me/919848529755?text=Hi,%20I%20need%20directions%20to%20your%20location"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 sm:px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl min-h-[44px] text-sm sm:text-base"
            >
              <MessageCircle className="mr-2" size={20} />
              <span className="hidden sm:inline">Get Directions via WhatsApp</span>
              <span className="sm:hidden">Get Directions</span>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">We're Always Available</h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 px-2">
            Whether you have a question, need support, or want to explore business opportunities, the Sahni Group team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <a
              href="tel:+919848529755"
              className="bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-red-700 transition-colors inline-flex items-center justify-center min-h-[44px]"
            >
              <Phone className="mr-2" size={20} />
              Call Now
            </a>
            <a
              href="https://wa.me/919848529755"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-green-600 transition-colors inline-flex items-center justify-center min-h-[44px]"
            >
              <MessageCircle className="mr-2" size={20} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
