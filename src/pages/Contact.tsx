import { useEffect, useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { showroomsAPI, normalizeImageUrl } from '../services/api';

interface PrimaryShowroom {
  city: string;
  address: string;
  phone: string;
  email: string;
  image?: string;
  map_link?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  // Updated default details
  const [primaryShowroom, setPrimaryShowroom] = useState<PrimaryShowroom>({
    city: 'Vijayawada',
    address: 'Sahni Complex, 2nd Cross Rd, Auto Nagar, Vijayawada, Andhra Pradesh 520007',
    phone: '92810 29456',
    email: 'info.sahniauto@gmail.com',
  });
  
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    const loadPrimaryShowroom = async () => {
      try {
        const response = await showroomsAPI.getAll();
        const items = Array.isArray(response)
          ? response
          : (response as any)?.showrooms || (response as any)?.data || [];

        if (Array.isArray(items) && items.length > 0) {
          const main = items.find((s: any) => s.is_main === true || s.isMain === true) || items[0];
          
          setPrimaryShowroom({
            city: main.city || 'Vijayawada',
            address: main.address || 'Sahni Complex, 2nd Cross Rd, Auto Nagar, Vijayawada, Andhra Pradesh 520007',
            phone: main.phone || '92810 29456',
            email: main.email || 'info.sahniauto@gmail.com',
            image: main.image || (Array.isArray(main.images) ? main.images[0] : undefined),
            map_link: main.map_link || undefined,
          });
        }
      } catch (error) {
        console.warn('[Contact] Using requested default contact info:', error);
      }
    };

    loadPrimaryShowroom();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const whatsappMessage = `Hello Sahni Auto Group,\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'Not provided'}\nSubject: ${formData.subject || 'General Inquiry'}\n\nMessage:\n${formData.message}`;
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/919281029456?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white">
      {/* Header Section */}
      <section className="relative h-[300px] sm:h-[400px] md:h-[500px] bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImageError ? 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&h=1080&fit=crop' : normalizeImageUrl('https://tata-storagebucket.s3.ap-south-1.amazonaws.com/images/95cdfeef.jpg')}
            alt="Contact Us"
            className="w-full h-full object-cover opacity-60"
            onError={() => setHeroImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/40"></div>
        </div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Get In Touch</h1>
            <p className="text-xl text-gray-200">We're Here to Help You</p>
          </div>
        </div>
      </section>

      {/* Information Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Phone Card */}
            <div className="flex flex-col items-center text-center bg-gray-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-red-600 p-4 rounded-full mb-4">
                <Phone className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
              <a href="tel:+919281029456" className="text-red-600 text-2xl font-black block">
                {primaryShowroom.phone}
              </a>
              <p className="text-gray-500 mt-2 font-medium">Mon - Sat: 9:00 AM - 7:00 PM</p>
            </div>

            {/* Email Card */}
            <div className="flex flex-col items-center text-center bg-gray-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-red-600 p-4 rounded-full mb-4">
                <Mail className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
              <a href={`mailto:${primaryShowroom.email}`} className="text-red-600 text-lg font-bold break-all">
                {primaryShowroom.email}
              </a>
              <p className="text-gray-500 mt-2 font-medium">We'll respond within 24 hours</p>
            </div>

            {/* Address Card */}
            <div className="flex flex-col items-center text-center bg-gray-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-red-600 p-4 rounded-full mb-4">
                <MapPin className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Head Office</h3>
              <address className="not-italic text-gray-700 font-semibold leading-relaxed">
                {primaryShowroom.address}
              </address>
            </div>
            
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-blue-50">
            <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input type="text" name="name" placeholder="Full Name *" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" />
                <input type="email" name="email" placeholder="Email Address *" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" />
              </div>
              <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" />
              <select name="subject" required value={formData.subject} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none">
                <option value="">Select a subject</option>
                <option value="dealership">Dealership</option>
                <option value="service">Service</option>
                <option value="other">Other</option>
              </select>
              <textarea name="message" placeholder="Message *" required rows={5} value={formData.message} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" />
              <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-lg font-bold flex items-center justify-center hover:bg-red-700 transition-all text-lg shadow-lg">
                <MessageCircle size={22} className="mr-3" />
                Send via WhatsApp
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}