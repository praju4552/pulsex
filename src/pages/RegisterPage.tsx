import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, User } from 'lucide-react';
import { XPulseLogo } from '../app/components/XPulseIcon';
import roboticsBg from '../assets/robotics-background.png';
import { API_BASE_URL } from '../api/config';
import { useGoogleLogin } from '@react-oauth/google';

export function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const { login: contextLogin } = useAuth(); // rename to avoid conflict
    const navigate = useNavigate();

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Fetch info from Google
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();

                // Send to backend
                const response = await fetch(`${API_BASE_URL}/prototyping-auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ googlePayload: userInfo }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Google auth failed via backend');

                // Same logic as handleRegister success
                contextLogin(data.token, data.user);
                // Also store prototyping style for compat if needed
                localStorage.setItem('prototypingUser', JSON.stringify({ ...data.user, token: data.token }));
                localStorage.setItem('prototypingToken', data.token);

                if (data.user.role === 'SUPER_ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } catch (err: any) {
                setError(err.message);
            }
        },
        onError: () => setError('Google Login Failed'),
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                console.error('Failed to parse JSON response:', text);
                throw new Error(`Invalid server response: ${text.slice(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Auto-login
            contextLogin(data.token, data.user);
            localStorage.setItem('prototypingUser', JSON.stringify({ ...data.user, token: data.token }));
            localStorage.setItem('prototypingToken', data.token);

            if (data.user.role === 'SUPER_ADMIN') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
    };

    return (
        <div className="relative h-screen w-full bg-slate-900 overflow-hidden text-text-primary">
            {/* Full Background Image */}
            <img
                src={roboticsBg}
                alt="Platform Background"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            {/* Translucent overlay maintaining Emerald theme but making image highly visible */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/80 via-[#007F5F]/40 to-[#007F5F]/10" />

            {/* Main Outer Centering Container */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center px-6 sm:px-8 lg:px-12 xl:px-16 py-6 lg:py-12">

                {/* Flex wrapper for the two blocks to perfectly align their bottoms */}
                <div className="flex flex-col lg:flex-row items-center lg:items-end justify-start gap-6 lg:gap-8 w-full">

                    {/* Left Side: Registration Card */}
                    <div className="w-full max-w-[420px] bg-[#FAF9F6] rounded-[24px] shadow-2xl flex flex-col px-6 sm:px-8 py-5 border border-border-color max-h-[92vh] overflow-y-auto scrollbar-hide shrink-0 text-black z-20">

                        {/* Logo / Brand */}
                        <div className="mb-5 text-center">
                            <div className="w-10 h-10 bg-[#007F5F]/10 rounded-xl flex items-center justify-center mb-2 mx-auto border border-[#007F5F]/20">
                                <User className="w-5 h-5 text-[#007F5F]" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h1>
                            <p className="text-gray-500 mt-1 text-[11px] font-medium flex items-center justify-center gap-1">
                                Join <XPulseLogo textClassName="text-[11px] font-bold" iconClassName="w-3 h-3" /> today. Start your journey.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-2.5 rounded-xl mb-4 text-xs font-medium border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-3 flex-grow lg:flex-grow-0" style={{ maxHeight: '100%' }}>
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007F5F]/20 focus:border-[#007F5F] outline-none transition-all shadow-sm text-sm text-gray-900 placeholder-gray-400"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007F5F]/20 focus:border-[#007F5F] outline-none transition-all shadow-sm text-sm text-gray-900 placeholder-gray-400"
                                    placeholder="name@company.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">Password</label>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007F5F]/20 focus:border-[#007F5F] outline-none transition-all shadow-sm text-sm text-gray-900 placeholder-gray-400"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">Confirm</label>
                                    <div className="relative group">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#007F5F]/20 focus:border-[#007F5F] outline-none transition-all shadow-sm text-sm text-gray-900 placeholder-gray-400"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-1">
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-[#007F5F] text-text-primary rounded-lg text-sm font-bold hover:bg-[#00664C] hover:shadow-lg hover:shadow-[#007F5F]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center"
                                >
                                    Create Account
                                </button>

                                <div className="relative flex items-center py-1">
                                    <div className="flex-grow border-t border-gray-200"></div>
                                    <span className="flex-shrink-0 mx-3 text-gray-400 text-[10px] uppercase font-semibold">Or submit via</span>
                                    <div className="flex-grow border-t border-gray-200"></div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => googleLogin()}
                                    className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 hover:shadow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Register with Google
                                </button>
                            </div>
                        </form>

                        <div className="mt-3 text-center">
                            <p className="text-gray-500 text-[10px]">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[#007F5F] font-bold hover:text-[#00664C] transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Info Block (Beside registration block, bottom aligned to it) */}
                    <div className="hidden lg:flex flex-col max-w-[320px] text-text-primary relative z-10 mb-2">
                        <div className="bg-slate-900/40 backdrop-blur-md border border-border-glass p-5 rounded-3xl shadow-xl">
                            <div className="inline-block px-3 py-1 bg-[#007F5F]/90 rounded-full text-[9px] font-bold tracking-wider uppercase mb-3 text-text-primary border border-[#007F5F]/40 shadow-sm">
                                Learning Platform
                            </div>
                            <h2 className="text-xl font-bold mb-2 leading-snug">Empower your robotics journey.</h2>
                            <p className="text-text-primary/90 leading-relaxed text-[10px] font-medium">
                                Access premium templates, organize your curriculum, and build the future with PULSE X's extensive hardware library. New users get 20 free credits!
                            </p>
                        </div>
                    </div>

                </div> {/* End Flex Wrapper */}
            </div> {/* End Centering Container */}

            {/* Absolute Footer */}
            <div className="absolute bottom-4 right-6 text-text-primary/50 text-[10px] font-medium tracking-wide z-10 pointer-events-none hidden sm:block">
                &copy; {new Date().getFullYear()} <XPulseLogo textClassName="text-[10px] font-bold" iconClassName="w-3 h-3" />. All rights reserved.
            </div>
        </div>
    );
}
