import { Building2, Award, Shield, CheckCircle } from 'lucide-react';

interface InstitutionalSalesProps {
  setCurrentPage?: (page: string) => void;
}

interface InstitutionalClient {
  id: string;
  acronym: string;
  fullName: string;
}

const InstitutionalSales = ({ setCurrentPage }: InstitutionalSalesProps) => {
  const clients: InstitutionalClient[] = [
    {
      id: 'apsrtc',
      acronym: 'APSRTC',
      fullName: 'Andhra Pradesh State Road Transport Corporation',
    },
    {
      id: 'tgsrtc',
      acronym: 'TGSRTC',
      fullName: 'Telangana State Road Transport Corporation',
    },
    {
      id: 'shar',
      acronym: 'SHAR (ISRO)',
      fullName: 'Satish Dhawan Space Centre, ISRO',
    },
    {
      id: 'postal',
      acronym: 'POSTAL DPT',
      fullName: 'Postal Department',
    },
    {
      id: 'sccl',
      acronym: 'SCCL',
      fullName: 'Singareni Collieries Company Limited',
    },
    {
      id: 'other-psu',
      acronym: 'OTHER PSU\'s',
      fullName: 'Other Public Sector Undertakings',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Yellow Banner Section */}
      <section className="bg-yellow-400 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-black uppercase tracking-tight">
              INSTITUTIONAL SALES
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading Section */}
          <div className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight max-w-5xl">
              Distributors for Andhra & Telangana for Tata Motors CV Spare Parts Institutional Govenance
            </h2>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed max-w-4xl">
              Distributors for Andhra Pradesh and Telangana for Tata Motors CV Spare Parts Institutional Govenance. We serve major government and institutional clients with customized solutions.
            </p>
          </div>

          {/* Clients Grid Section */}
          <div className="mb-12 sm:mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="group relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-2xl p-8 sm:p-10 border-2 border-dashed border-blue-600/50 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] overflow-hidden"
                >
                  {/* Decorative Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon and Badge */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl shadow-lg">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-full">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Client Information */}
                    <div>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                        {client.acronym}
                      </h3>
                      <div className="h-1 w-16 bg-white/30 rounded-full mb-4"></div>
                      <p className="text-base sm:text-lg md:text-xl text-white/95 leading-relaxed font-medium">
                        {client.fullName}
                      </p>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Credentials Section */}
          <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-3xl shadow-2xl border border-gray-200 p-8 sm:p-10 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
              {/* Sole Distributor Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl shadow-lg flex-shrink-0">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      Sole Distributors
                    </h3>
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                      Authorized and exclusive distributors for Andhra Pradesh and Telangana, ensuring direct access to genuine Tata Motors CV spare parts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trusted Partners Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-red-100 hover:border-red-300 transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-xl shadow-lg flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      Trusted Partners
                    </h3>
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                      Serving major government and institutional clients with customized solutions, ensuring reliable operations and optimal performance.
                    </p>
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

export default InstitutionalSales;

