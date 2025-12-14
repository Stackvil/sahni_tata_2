import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get token from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        window.location.hash = '#admin-login';
      }, 3000);
    } catch (error: any) {
      const errorMessage = error?.message || error?.detail || 'Failed to reset password. The token may be invalid or expired.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            {success ? (
              <CheckCircle className="text-green-600" size={32} />
            ) : (
              <Lock className="text-green-600" size={32} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {success ? 'Password Reset Successful!' : 'Reset Password'}
          </h1>
          <p className="text-sm text-gray-600">
            {success 
              ? 'Your password has been reset successfully. Redirecting to login...'
              : 'Enter your new password below'
            }
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
              <p className="text-green-700 font-semibold">Password reset successful!</p>
              <p className="text-sm text-green-600 mt-2">You can now log in with your new password.</p>
            </div>
            <button
              onClick={() => window.location.hash = '#admin-login'}
              className="w-full bg-black hover:bg-gray-800 text-white py-3 px-6 rounded-xl font-bold text-base transition-all duration-300"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!token && (
              <div>
                <label htmlFor="resetToken" className="block text-sm font-semibold text-gray-700 mb-2">
                  Reset Token
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    id="resetToken"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                    placeholder="Enter reset token from email"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Check your email for the reset token</p>
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                  placeholder="Enter new password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-gray-900 placeholder-gray-400"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => window.location.hash = '#admin-login'}
              className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

