import React, { useState } from 'react';
import { Mail, Key, Phone, User, Info, MessageCircle, ArrowRight, Chrome, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { PrototypingHeader } from './PrototypingHeader';
import { XPulseLogo } from '../XPulseIcon';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { API_BASE_URL } from '../../../api/config';
import { usePrototypingAuth } from '../../../context/PrototypingAuthContext';

export default function PrototypingAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'whatsapp'>('email');
  const [whatsappStep, setWhatsappStep] = useState<'phone' | 'otp'>('phone');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const { loginPrototyping } = usePrototypingAuth();

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError('');
    setAuthMethod('email');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSuccess = (data: any) => {
    // Store user + token in React memory only — no localStorage write.
    loginPrototyping(data.user, data.token);

    if (data.user.role === 'SUPER_ADMIN') {
      sessionStorage.setItem('cms_token', data.token);
      sessionStorage.setItem('cms_admin', JSON.stringify(data.user));
      navigate('/cms/dashboard');
    } else {
      navigate('/prototyping');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (authMethod === 'email') {
      const endpoint = isLogin ? `${API_BASE_URL}/prototyping-auth/login` : `${API_BASE_URL}/prototyping-auth/signup`;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Authentication failed');
        handleLoginSuccess(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else if (authMethod === 'whatsapp') {
      try {
        if (whatsappStep === 'phone') {
          // Request OTP
          const response = await fetch(`${API_BASE_URL}/prototyping-auth/whatsapp/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: formData.phone })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
          setSuccessMsg(data.devModeOtp ? `OTP sent! (Dev Mode OTP: ${data.devModeOtp})` : 'OTP sent! Please check your WhatsApp.');
          setWhatsappStep('otp');
        } else {
          // Verify OTP
          const response = await fetch(`${API_BASE_URL}/prototyping-auth/whatsapp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: formData.phone, otp: formData.otp })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Invalid OTP');
          handleLoginSuccess(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        // ✅ Send raw access_token to backend for server-side verification
        const response = await fetch(`${API_BASE_URL}/prototyping-auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Google auth failed via backend');
        handleLoginSuccess(data);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    },
    onError: () => setError('Google Login Failed')
  });

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col font-sans">
      <PrototypingHeader />
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-bg-surface rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          
          <div className="w-full md:w-2/5 p-12 flex flex-col justify-center items-center text-center bg-bg-secondary border-r border-border-glass">
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-6">
              {isLogin ? 'Sign in Or Register' : 'Already have an account?'}
            </h2>
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-3xl font-black text-text-primary">
                {isLogin ? 'New to' : 'Welcome to'}
              </span>
              <XPulseLogo textClassName="text-3xl font-black text-text-primary" iconClassName="w-8 h-8" />
            </div>
            <div className="w-24 h-1 bg-[#00cc55] rounded-full mb-10 mx-auto opacity-20" />
            
            <button
              onClick={handleToggle}
              className="px-8 py-3.5 bg-[#00cc55] hover:bg-[#00aa44] text-text-primary font-bold rounded-full transition-all shadow-lg hover:shadow-[#00cc55]/30 hover:-translate-y-0.5 active:scale-95"
            >
              {isLogin ? 'New here? Sign up' : 'I have an account'}
            </button>
          </div>

          {/* Right Side: Form */}
          <div className="w-full md:w-3/5 p-12 flex flex-col justify-center relative bg-bg-surface">
            <div className="mb-10">
              <h2 className="text-3xl font-black text-text-primary mb-2">
                {authMethod === 'whatsapp' ? 'WhatsApp Verify' : (isLogin ? 'Login' : 'Registration')}
              </h2>
              <div className="w-16 h-1 bg-[#00cc55] rounded-full" />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-[#00cc55] text-green-700 dark:text-[#00cc55] text-sm rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMethod === 'email' ? (
                <>
                  {!isLogin && (
                    <div className="group relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#00cc55] transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-4 bg-surface-100 border border-border-glass rounded-2xl text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-[#00cc55]/20 focus:border-[#00cc55] focus:bg-bg-surface transition-all"
                      />
                    </div>
                  )}

                  {!isLogin && (
                    <div className="group relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-[#00cc55] transition-colors" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="Enter mobile number"
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-4 bg-surface-100 border border-border-glass rounded-2xl text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-[#00cc55]/20 focus:border-[#00cc55] focus:bg-bg-surface transition-all"
                      />
                    </div>
                  )}

                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#00cc55] transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-4 bg-surface-100 border border-border-glass rounded-2xl text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-[#00cc55]/20 focus:border-[#00cc55] focus:bg-bg-surface transition-all"
                    />
                  </div>

                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400 group-focus-within:text-[#00cc55] transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-12 py-4 bg-surface-100 border border-border-glass rounded-2xl text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-[#00cc55]/20 focus:border-[#00cc55] focus:bg-bg-surface transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#00cc55] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-[#00cc55] transition-colors" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      disabled={whatsappStep === 'otp'}
                      placeholder="Enter WhatsApp mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`block w-full pl-12 pr-4 py-4 border border-border-glass rounded-2xl text-text-primary transition-all ${whatsappStep === 'otp' ? 'bg-bg-secondary opacity-70' : 'bg-surface-100 focus:ring-2 focus:ring-[#00cc55]/20 focus:border-[#00cc55] focus:bg-bg-surface'}`}
                    />
                  </div>
                  
                  {whatsappStep === 'otp' && (
                    <div className="group relative mt-4">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-gray-400 group-focus-within:text-[#00cc55] transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="otp"
                        required
                        placeholder="Enter 6-digit OTP"
                        value={formData.otp}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-4 bg-surface-100 border border-border-glass rounded-2xl text-text-primary focus:outline-none focus:ring-2 focus:ring-[#00cc55]/20 focus:border-[#00cc55] focus:bg-bg-surface transition-all"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="pt-2 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-48 py-4 bg-[#00cc55] hover:bg-[#00aa44] disabled:bg-gray-400 text-text-primary font-bold rounded-full transition-all flex items-center justify-center gap-2 group/btn active:scale-95 shadow-lg hover:shadow-[#00cc55]/30"
                >
                  {loading ? 'Processing...' : (authMethod === 'whatsapp' ? (whatsappStep === 'phone' ? 'Get OTP' : 'Verify OTP') : (isLogin ? 'Log in' : 'Create Account'))}
                  {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />}
                </button>
                
                {authMethod === 'whatsapp' && (
                  <button 
                    type="button" 
                    onClick={() => { setAuthMethod('email'); setError(''); setSuccessMsg(''); }}
                    className="text-text-muted hover:text-text-primary text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 flex flex-col gap-4">
              {isLogin && authMethod === 'email' && (
                <button className="text-text-muted hover:text-[#00cc55] text-sm font-medium transition-colors w-fit">
                  Forgot your password?
                </button>
              )}

              {/* Social Logins */}
              {authMethod === 'email' && (
                <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-border-glass">
                  <p className="text-xs font-bold text-text-placeholder uppercase tracking-widest mb-1 text-center">Or continue with</p>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => googleLogin()}
                      className="flex-1 py-3 px-4 rounded-2xl border border-border-glass hover:border-text-primary hover:bg-surface-100 transition-all flex items-center justify-center gap-2 text-sm font-bold text-text-primary"
                    >
                      <Chrome className="w-4 h-4 text-blue-500" />
                      Google
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setAuthMethod('whatsapp'); setWhatsappStep('phone'); setError(''); setSuccessMsg(''); setFormData({...formData, otp: ''}); }}
                      className="flex-1 py-3 px-4 rounded-2xl border border-border-glass hover:border-text-primary hover:bg-surface-100 transition-all flex items-center justify-center gap-2 text-sm font-bold text-text-primary"
                    >
                      <MessageCircle className="w-4 h-4 text-[#00cc55]" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      <style>{`
        body { background-color: var(--bg-primary); }
      `}</style>
    </div>
  );
}
