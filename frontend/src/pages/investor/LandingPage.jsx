import React from "react";
import { Link } from "react-router-dom";
import { 
  Shield, 
  TrendingUp, 
  FileText, 
  Users, 
  CheckCircle, 
  ArrowRight,
  BarChart3,
  Lock,
  Clock,
  DollarSign,
  PieChart,
  Bell
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">RTA</span>
              </div>
              <span className="font-bold text-xl text-gray-900">RTA Portal</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all hover:from-blue-700 hover:to-blue-800">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              <span>SEBI-Registered RTA Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Your Complete
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
                Mutual Fund Management
              </span>
              Platform
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Manage your mutual fund investments with ease. Track portfolios, execute transactions, 
              and access comprehensive reports—all in one secure, professional platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 flex items-center gap-2">
                  Start Investing Today
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link to="/login">
                <button className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl border-2 border-gray-200 transition-all transform hover:-translate-y-0.5">
                  Existing Investor Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Investors
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your mutual fund investments efficiently and securely
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Portfolio Management</h3>
              <p className="text-gray-600 leading-relaxed">
                View all your investments in one place with real-time portfolio valuation, 
                asset allocation, and performance tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-green-100 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Transactions</h3>
              <p className="text-gray-600 leading-relaxed">
                Purchase, redeem, switch, and manage SIP/SWP/STP plans with just a few clicks. 
                All transactions are processed securely and efficiently.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Reports</h3>
              <p className="text-gray-600 leading-relaxed">
                Generate capital gains reports, valuation statements, and download CAS 
                for tax filing and portfolio analysis.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-red-50 to-white p-8 rounded-2xl border border-red-100 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bank-Level Security</h3>
              <p className="text-gray-600 leading-relaxed">
                Your data is protected with enterprise-grade security, encryption, 
                and compliance with SEBI regulations.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-yellow-50 to-white p-8 rounded-2xl border border-yellow-100 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Asset Allocation</h3>
              <p className="text-gray-600 leading-relaxed">
                Visualize your portfolio distribution across asset classes and AMCs 
                with interactive charts and detailed breakdowns.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl border border-indigo-100 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Document Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload, store, and manage all your investment documents securely. 
                Access account statements and certificates anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Complete Investment Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive solutions for all your mutual fund investment needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Transaction Services</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Fresh Purchase & Additional Purchase</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Redemption (Partial & Full)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Switch Between Schemes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">SIP/SWP/STP Setup & Management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">IDCW Preferences</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Portfolio Services</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Real-time Portfolio Valuation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Asset Allocation Analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Capital Gains Reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">CAS Download</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Transaction History & Statements</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-12 lg:p-16 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="text-center lg:text-left">
                <div className="h-16 w-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Secure & Compliant</h3>
                <p className="text-blue-100 leading-relaxed">
                  SEBI-registered RTA platform with bank-level security and full regulatory compliance
                </p>
              </div>

              <div className="text-center lg:text-left">
                <div className="h-16 w-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">24/7 Access</h3>
                <p className="text-blue-100 leading-relaxed">
                  Access your portfolio anytime, anywhere. Check investments and execute transactions at your convenience
                </p>
              </div>

              <div className="text-center lg:text-left">
                <div className="h-16 w-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Expert Support</h3>
                <p className="text-blue-100 leading-relaxed">
                  Dedicated customer support team to assist you with all your investment queries and transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Manage Your Investments?
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Join thousands of investors who trust our platform for their mutual fund investments. 
            Get started in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 mx-auto">
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RTA</span>
                </div>
                <span className="font-bold text-white text-lg">RTA Portal</span>
              </div>
              <p className="text-sm leading-relaxed">
                Your trusted partner for mutual fund investment management. 
                SEBI-registered and fully compliant.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors">Investment Services</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Portfolio Management</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Reports & Statements</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Document Management</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Investment Guide</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Regulatory Disclosures</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">FAQs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Compliance</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Grievance Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} RTA Portal. All rights reserved. SEBI Registered.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
