import { useState } from 'react';
import { Lock, Mail, X, Eye, EyeOff } from 'lucide-react';
import { authAPI, normalizeImageUrl } from '../services/api';

interface AdminLoginProps {
  onLogin: () => void;
}

const SESSION_DURATION_HOURS = 3; // 3 hours session

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try backend authentication
      console.log('[AdminLogin] Attempting login with:', email);
      const response = await authAPI.login(email, password);
      console.log('[AdminLogin] Login response:', response);
      
      // Backend returns: { "access_token": "...", "token_type": "bearer" }
      // Check if we got a token (either access_token or token)
      const hasToken = response?.access_token || response?.token;
      
      if (hasToken) {
        // Backend authentication successful
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminLoginTime', new Date().toISOString());
        // Set expiry time (3 hours from now)
        const expiryTime = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
        localStorage.setItem('adminSessionExpiry', expiryTime.toISOString());
        console.log('[AdminLogin] Login successful, token stored, redirecting...');
        setTimeout(() => {
          onLogin();
        }, 500);
      } else {
        console.error('[AdminLogin] No token in response:', response);
        setError(response?.detail || 'Invalid email or password');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[AdminLogin] Login error:', err);
      const errorMessage = err?.message || err?.detail || 'Invalid email or password. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    setForgotPasswordLoading(true);
    
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Please enter your email address');
      setForgotPasswordLoading(false);
      return;
    }

    try {
      await authAPI.forgotPassword(forgotPasswordEmail);
      setForgotPasswordMessage('Password reset instructions have been sent to your email address.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setForgotPasswordMessage('');
      }, 3000);
    } catch (error: any) {
      const errorMessage = error?.message || error?.detail || 'Failed to send reset email. Please contact administrator.';
      setForgotPasswordMessage(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    // Validation
    if (!signupData.username || !signupData.email || !signupData.password) {
      setSignupError('Please fill in all fields');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    
    if (signupData.password.length < 6) {
      setSignupError('Password must be at least 6 characters long');
      return;
    }

    setSignupLoading(true);
    try {
      await authAPI.signup(signupData.username, signupData.email, signupData.password);
      setSignupSuccess(true);
      setSignupData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const errorMessage = error?.message || error?.detail || 'Failed to create account. Please try again.';
      setSignupError(errorMessage);
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Vehicle Image - Hidden on Mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden items-center justify-center">
        <img
          src={normalizeImageUrl('/images/sahni_vehicles/tata/tata_ace/ACE CNG 2.0(Bi-Fuel)/2.png')}
          alt="Tata Ace CNG 2.0"
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=1080&fit=crop&q=90';
          }}
        />
        {/* Logo and Tagline - Top Left */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center mb-4">
            <img 
              src={normalizeImageUrl('/images/logo.jpg')} 
              alt="Sahni Group Logo" 
              className="w-12 h-12 object-contain mr-3"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-12 h-12 bg-green-600 rounded flex items-center justify-center mr-3 hidden">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <div>
              <div className="text-white text-2xl font-semibold">Sahni Group</div>
            </div>
          </div>
          <p className="text-white text-sm font-medium">Find more than vehicles. Find your solution.</p>
        </div>
      </div>

      {/* Right Side - Login Form Panel - Mobile Optimized */}
      <div className="w-full lg:w-1/2 bg-white min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        {/* Header Bar - Mobile */}
        <div className="absolute top-0 left-0 right-0 lg:hidden bg-gradient-to-r from-gray-900 to-black z-10">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={normalizeImageUrl('/images/logo.jpg')} 
                alt="Sahni Group Logo" 
                className="w-10 h-10 object-contain mr-3"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center mr-3 hidden">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-white text-lg sm:text-xl font-semibold">Sahni Group</span>
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-md mt-20 sm:mt-24 lg:mt-0">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Welcome Back to Sahni Group!</h1>
            <p className="text-gray-600 text-sm sm:text-base">Login to your account to explore your next vehicle</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 sm:py-3.5 bg-white border border-gray-300 rounded-lg focus:border-black focus:ring-2 focus:ring-black transition-all text-base text-gray-900 placeholder-gray-400 min-h-[48px]"
                placeholder="Your email address"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 sm:py-3.5 bg-white border border-gray-300 rounded-lg focus:border-black focus:ring-2 focus:ring-black transition-all text-base text-gray-900 placeholder-gray-400 min-h-[48px]"
                placeholder="Your password"
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-gray-600 hover:text-black transition-colors mt-2 min-h-[44px] flex items-center"
              >
                Forgot your password?
              </button>
            </div>

            <div className="flex items-center min-h-[44px]">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 active:bg-gray-900 text-white py-3.5 sm:py-4 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="text-black font-medium hover:underline uppercase min-h-[44px] px-2"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal - Mobile Optimized */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordEmail('');
                setForgotPasswordMessage('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full">
                <Mail className="text-purple-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgotEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    id="forgotEmail"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {forgotPasswordMessage && (
                <div className={`p-3 rounded-xl text-sm ${
                  forgotPasswordMessage.includes('sent') 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {forgotPasswordMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={forgotPasswordLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-6 rounded-xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send Reset Instructions'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail('');
                  setForgotPasswordMessage('');
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal - Mobile Optimized */}
      {showSignup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowSignup(false);
                setSignupData({
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                });
                setSignupError('');
                setSignupSuccess(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <Lock className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-sm text-gray-600">
                Sign up to access the admin dashboard
              </p>
            </div>

            {signupSuccess ? (
              <div className="text-center py-8">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
                  <p className="text-green-700 font-semibold mb-2">Account created successfully!</p>
                  <p className="text-sm text-green-600">You can now log in with your credentials.</p>
                </div>
                <button
                  onClick={() => {
                    setShowSignup(false);
                    setSignupSuccess(false);
                  }}
                  className="w-full bg-black hover:bg-gray-800 text-white py-3 px-6 rounded-xl font-bold text-base transition-all duration-300"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label htmlFor="signupUsername" className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="signupUsername"
                    value={signupData.username}
                    onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label htmlFor="signupEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      id="signupEmail"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signupPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="signupPassword"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                      placeholder="Enter password (min 6 characters)"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      required
                      className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                {signupError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                    {signupError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signupLoading ? 'Creating Account...' : 'Sign Up'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSignup(false);
                    setSignupData({
                      username: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                    });
                    setSignupError('');
                    setSignupSuccess(false);
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
