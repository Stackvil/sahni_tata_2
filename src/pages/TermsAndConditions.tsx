import { FileText, Scale, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <section className="relative h-[300px] sm:h-[400px] bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Scale className="w-16 h-16 sm:w-20 sm:h-20 text-red-500" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4">Terms & Conditions</h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Please read these terms carefully before using our website and services.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="prose prose-lg max-w-none">
          {/* Last Updated */}
          <div className="bg-gray-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-sm text-gray-600 m-0">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-red-500" />
              Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to Sahni Group's website. These Terms and Conditions ("Terms") govern your access to and use of our website, products, and services. By accessing or using our website, you agree to be bound by these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you do not agree to these Terms, please do not use our website or services. We reserve the right to modify these Terms at any time, and such modifications shall be effective immediately upon posting.
            </p>
          </div>

          {/* Acceptance of Terms */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2 text-red-500" />
              Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing, browsing, or using this website, you acknowledge that you have read, understood, and agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any of these Terms, you are prohibited from using or accessing this website.
            </p>
          </div>

          {/* Use of Website */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Use of Website</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Permitted Use</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may use our website for lawful purposes only. You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Use the website in any way that violates any applicable law or regulation</li>
              <li>Transmit any malicious code, viruses, or harmful software</li>
              <li>Attempt to gain unauthorized access to any portion of the website</li>
              <li>Interfere with or disrupt the website or servers connected to the website</li>
              <li>Use automated systems to access the website without permission</li>
              <li>Copy, reproduce, or distribute content without authorization</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
            </ul>
          </div>

          {/* Intellectual Property */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All content on this website, including but not limited to text, graphics, logos, images, audio clips, digital downloads, and software, is the property of Sahni Group or its content suppliers and is protected by Indian and international copyright laws.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Reproduce, distribute, or create derivative works from our content</li>
              <li>Use our trademarks or logos without written permission</li>
              <li>Remove any copyright or proprietary notices</li>
              <li>Use our content for commercial purposes without authorization</li>
            </ul>
          </div>

          {/* Products and Services */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Products and Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The information about products and services on this website is provided for general informational purposes. We reserve the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Modify or discontinue any product or service at any time</li>
              <li>Change prices without notice</li>
              <li>Limit quantities of products or services</li>
              <li>Refuse service to anyone for any reason</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Product descriptions, images, and specifications are provided for informational purposes and may not be completely accurate. We do not warrant that product descriptions or other content on this website are accurate, complete, reliable, current, or error-free.
            </p>
          </div>

          {/* Pricing and Payment */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing and Payment</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All prices displayed on our website are subject to change without notice. Prices are in Indian Rupees (INR) unless otherwise stated. Final pricing will be confirmed at the time of order or quotation.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Payment terms will be specified in individual sales agreements or quotations. We reserve the right to refuse or cancel any order at our discretion.
            </p>
          </div>

          {/* Warranties and Disclaimers */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
              Warranties and Disclaimers
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>No Warranties:</strong> This website and its content are provided "as is" without warranties of any kind, either express or implied. We disclaim all warranties, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Merchantability and fitness for a particular purpose</li>
              <li>Accuracy, completeness, or reliability of content</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Freedom from viruses or other harmful components</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We do not warrant that the website will be available at all times or that it will be free from errors or defects.
            </p>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <XCircle className="w-6 h-6 mr-2 text-red-500" />
              Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To the fullest extent permitted by law, Sahni Group shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Your use or inability to use the website</li>
              <li>Any unauthorized access to or use of our servers</li>
              <li>Any interruption or cessation of transmission to or from the website</li>
              <li>Any bugs, viruses, or other harmful code</li>
              <li>Any errors or omissions in any content</li>
            </ul>
          </div>

          {/* Indemnification */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to indemnify, defend, and hold harmless Sahni Group, its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or relating to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Your use of the website</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Any content you submit or transmit through the website</li>
            </ul>
          </div>

          {/* Links to Third-Party Sites */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Links to Third-Party Sites</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our website may contain links to third-party websites that are not owned or controlled by Sahni Group. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our website, you expressly release Sahni Group from any and all liability arising from your use of any third-party website.
            </p>
          </div>

          {/* Termination */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right to terminate or suspend your access to our website immediately, without prior notice or liability, for any reason, including if you breach these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, your right to use the website will cease immediately. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
            </p>
          </div>

          {/* Governing Law */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or your use of the website shall be subject to the exclusive jurisdiction of the courts in Vijayawada, Andhra Pradesh, India.
            </p>
          </div>

          {/* Severability */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Severability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </div>

          {/* Changes to Terms */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By continuing to access or use our website after any revisions become effective, you agree to be bound by the revised terms.
            </p>
          </div>

          {/* Contact Information */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="text-gray-700 space-y-2">
              <p><strong>Sahni Group</strong></p>
              <p>#48-16-7/5A, Mahanadu Road</p>
              <p>Vijayawada - 520008, Andhra Pradesh, India</p>
              <p>Phone: <a href="tel:+919281029456" className="text-red-500 hover:underline">+91 92810 29456</a></p>
              <p>Email: <a href="mailto:sahniauto@gmail.com" className="text-red-500 hover:underline">sahniauto@gmail.com</a></p>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <p className="text-gray-700 leading-relaxed m-0">
              <strong>By using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


