import { Droplet, ArrowLeft } from 'lucide-react';

interface LubricantsCompaniesProps {
  setCurrentPage?: (page: string) => void;
  setSelectedCompany?: (company: string) => void;
}

export default function LubricantsCompanies({ setCurrentPage, setSelectedCompany }: LubricantsCompaniesProps) {
  const companies = [
    {
      id: 'hp',
      name: 'HP Lubricants',
      image: '/images/sahni verticals/HP_SULLI5.png',
      description: 'India\'s No. 1 Lubricants Marketer',
      type: 'retail',
    },
    {
      id: 'mahindra',
      name: 'Mahindra',
      image: '/images/sahni verticals/lubricant_brands/Mahindra1.png',
      description: 'Premium Automotive Lubricants',
      type: 'retail',
    },
    {
      id: 'jiobp',
      name: 'Jio-bp',
      image: '/images/sahni verticals/lubricant_brands/Jio-bp_logo.svg',
      description: 'Advanced Lubrication Solutions',
      type: 'retail',
    },
    {
      id: 'superline',
      name: 'SUPERLINE',
      image: '/images/sahni verticals/lubricant_brands/superline.png',
      description: 'Quality Engine Oils',
      type: 'retail',
    },
    {
      id: 'reliance',
      name: 'Reliance Lubricants',
      image: '/images/sahni verticals/lubricant_brands/reliance lubricants.avif',
      description: 'Trusted Industrial Lubricants',
      type: 'retail',
    },
    {
      id: 'balmerol',
      name: 'Balmerol Lubricants',
      image: '/images/sahni verticals/lubricant_brands/balmerol industrial.png',
      description: 'Industrial Grade Lubricants',
      type: 'industrial',
    },
  ];

  const handleCompanyClick = (companyId: string) => {
    if (setSelectedCompany) {
      setSelectedCompany(companyId);
    }
    if (setCurrentPage) {
      setCurrentPage('company-products');
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gray-900 text-white py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              if (setCurrentPage) {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center text-white hover:text-red-400 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </button>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Droplet size={48} className="text-blue-900 mr-4" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black uppercase tracking-tight">
              LUBRICANTS DISTRIBUTION
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            As authorized distributors for leading lubricant brands, we supply high-quality engine oils and lubricants to both retail and industrial markets.
          </p>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-black uppercase mb-4 tracking-tight">Our Partner Brands</h2>
            <p className="text-lg text-gray-700">Select a company to view their products</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanyClick(company.id)}
                className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-left"
              >
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={company.image}
                    alt={company.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-lg font-bold">${company.name}</div>`;
                      }
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{company.name}</h3>
                  <p className="text-gray-600 mb-4">{company.description}</p>
                  <div className="flex items-center text-blue-900 font-semibold group-hover:text-blue-700">
                    <span>View Products</span>
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

