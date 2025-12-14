import { Calendar, TrendingUp } from 'lucide-react';

export default function Journey() {
  const milestones = [
    {
      year: '1965',
      event: 'Founded at Vijayawada by Late Harvinder Singh Sahni',
      color: 'bg-yellow-400',
      textColor: 'text-blue-900',
    },
    {
      year: '1980',
      event: 'Entered BPCL fuel retail (Sardar Singh Sahni & Sons)',
      color: 'bg-blue-900',
      textColor: 'text-white',
    },
    {
      year: '2004',
      event: 'HPCL lubricants distributorship at Vijayawada (Sahni Auto Agencies)',
      color: 'bg-yellow-400',
      textColor: 'text-blue-900',
    },
    {
      year: '2007',
      event: 'Expanded lubricants business to Hyderabad (Sama Trading & Co)',
      color: 'bg-blue-900',
      textColor: 'text-white',
    },
    {
      year: '2014',
      event: 'Added OES brands distribution (Dana, ZF, Continental, etc.)',
      color: 'bg-yellow-400',
      textColor: 'text-blue-900',
    },
    {
      year: '2015',
      event: 'Tata Motors spare parts distribution for Govt. & STUs (Sahni Automotives Pvt Ltd)',
      color: 'bg-blue-900',
      textColor: 'text-white',
    },
    {
      year: '2021',
      event: 'HPCL lubricants at Visakhapatnam (Synergy Distributors) & Tata Motors SCV dealership at Krishna District (Sahni Auto Pvt Ltd)',
      color: 'bg-yellow-400',
      textColor: 'text-blue-900',
    },
    {
      year: '2022',
      event: 'Entered into Mahindra Lubricants for Andhra Pradesh',
      color: 'bg-blue-900',
      textColor: 'text-white',
    },
    {
      year: '2023',
      event: 'Tata SCV Dealership for Guntur District',
      color: 'bg-yellow-400',
      textColor: 'text-blue-900',
    },
    {
      year: '2025',
      event: 'Partnered with Reliance Lubricants for Andhra and Telangana',
      color: 'bg-blue-900',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="bg-white pattern-diamond">
      {/* Header Section */}
      <section className="relative h-[500px] bg-gray-900 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1920&h=1080&fit=crop"
            alt="Journey & Milestones"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-red-600 px-8 py-4 rounded-lg mb-6 inline-block shadow-xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white uppercase">JOURNEY & MILESTONES</h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-200">Six Decades of Growth, Innovation, and Excellence</p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Calendar size={48} className="text-red-600 mx-auto mb-4" />
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              From our humble beginnings in 1965 to becoming a multi-vertical business leader, explore the key moments that shaped Sahni Group's journey.
            </p>
          </div>

          {/* Desktop Timeline */}
          <div className="hidden lg:block relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-yellow-400 via-blue-900 to-yellow-400"></div>
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={index}
                    className={`relative flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className={`flex-1 ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <div className={`${milestone.color} ${milestone.textColor} p-6 rounded-lg shadow-xl`}>
                        <div className={`text-3xl font-bold mb-2 ${milestone.textColor}`}>
                          {milestone.year}
                        </div>
                        <p className={`text-lg ${milestone.textColor} leading-relaxed`}>
                          {milestone.event}
                        </p>
                      </div>
                    </div>

                    <div className="relative z-10 w-16 h-16 flex items-center justify-center">
                      <div className={`${milestone.color} w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center`}>
                        <span className={`${milestone.textColor} font-bold text-lg`}>{index + 1}</span>
                      </div>
                    </div>

                    <div className="flex-1"></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Timeline */}
          <div className="lg:hidden space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="relative">
                <div className={`${milestone.color} ${milestone.textColor} p-6 rounded-lg shadow-xl`}>
                  <div className={`text-3xl font-bold mb-2 ${milestone.textColor}`}>
                    {milestone.year}
                  </div>
                  <p className={`text-lg ${milestone.textColor} leading-relaxed`}>
                    {milestone.event}
                  </p>
                </div>
                <div className={`absolute left-1/2 transform -translate-x-1/2 -bottom-4 ${milestone.color} w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center`}>
                  <span className={`${milestone.textColor} font-bold text-sm`}>{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-blue-900 text-white p-8 rounded-lg shadow-xl text-center">
              <div className="text-5xl font-bold mb-3">1965</div>
              <div className="text-xl">Year Founded</div>
            </div>

            <div className="bg-yellow-400 text-blue-900 p-8 rounded-lg shadow-xl text-center">
              <div className="text-5xl font-bold mb-3">60+</div>
              <div className="text-xl">Years of Excellence</div>
            </div>

            <div className="bg-blue-900 text-white p-8 rounded-lg shadow-xl text-center">
              <div className="text-5xl font-bold mb-3">5</div>
              <div className="text-xl">Business Verticals</div>
            </div>

            <div className="bg-yellow-400 text-blue-900 p-8 rounded-lg shadow-xl text-center">
              <div className="text-5xl font-bold mb-3">250+</div>
              <div className="text-xl">Team Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Looking Forward Section */}
      <section className="py-16 bg-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Looking Forward</h2>
          <p className="text-xl leading-relaxed mb-8">
            As we continue our journey, Sahni Group remains committed to our founding principles: building businesses that create employment, serving our customers with excellence, and contributing to the economic development of our region.
          </p>
          <p className="text-lg text-gray-200">
            The next chapter of our story is being written today, guided by the vision of our founder and the dedication of our team.
          </p>
        </div>
      </section>
    </div>
  );
}
