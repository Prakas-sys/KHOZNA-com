import { useState } from 'react'
import { X, Phone, User as UserIcon, ArrowRight, Mail, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function AuthModal({ isOpen, onClose, mode: initialMode = 'login' }) {
    const [mode, setMode] = useState(initialMode) // 'login' or 'signup'
    const [authMethod, setAuthMethod] = useState('email') // 'email' or 'phone'
    const [step, setStep] = useState('input') // 'input' or 'otp'

    // Email fields
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')

    // Phone fields
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { signInWithPhone, verifyOtp } = useAuth()

    if (!isOpen) return null

    // Google Sign In
    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError('')
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'https://khozna-com.vercel.app'
                }
            })
            if (error) throw error
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    // Email/Password Login
    const handleEmailLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            if (error) throw error
            onClose()
            resetForm()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Email/Password Signup
    const handleEmailSignup = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName }
                }
            })
            if (error) throw error
            alert('Check your email to verify your account!')
            onClose()
            resetForm()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Phone OTP
    const handleSendOtp = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            let formattedPhone = phone.trim().replace(/\D/g, '')
            if (formattedPhone.length > 10) {
                formattedPhone = formattedPhone.slice(-10)
            }
            formattedPhone = `+977${formattedPhone}`
            await signInWithPhone(formattedPhone, mode === 'signup' ? fullName : null)
            setPhone(formattedPhone)
            setStep('otp')
        } catch (err) {
            if (err.message.includes('Unsupported phone provider')) {
                setError('SMS login is not enabled. Please use Email or Google login.')
            } else {
                setError(err.message)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await verifyOtp(phone, otp)
            onClose()
            resetForm()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setStep('input')
        setEmail('')
        setPassword('')
        setPhone('')
        setOtp('')
        setFullName('')
        setError('')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {step === 'otp' ? 'Verify Phone' : (mode === 'login' ? 'Welcome Back' : 'Create Account')}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {step === 'input' && (
                        <>
                            {/* Google Sign In Button */}
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="font-medium text-gray-700">Continue with Google</span>
                            </button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            {/* Method Selector */}
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                <button
                                    onClick={() => setAuthMethod('email')}
                                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${authMethod === 'email'
                                        ? 'bg-white text-sky-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Mail size={16} className="inline mr-2" />
                                    Email
                                </button>
                                <button
                                    onClick={() => setAuthMethod('phone')}
                                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${authMethod === 'phone'
                                        ? 'bg-white text-sky-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Phone size={16} className="inline mr-2" />
                                    Phone
                                </button>
                            </div>

                            {/* Email Form */}
                            {authMethod === 'email' && (
                                <form onSubmit={mode === 'login' ? handleEmailLogin : handleEmailSignup} className="space-y-4">
                                    {mode === 'signup' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                            <div className="relative">
                                                <UserIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                                    placeholder="Full Name"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <div className="relative">
                                            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                        <div className="relative">
                                            <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">
                                            {error}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                                    </button>
                                </form>
                            )}

                            {/* Phone Form */}
                            {authMethod === 'phone' && (
                                <form onSubmit={handleSendOtp} className="space-y-4">
                                    {mode === 'signup' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                            <div className="relative">
                                                <UserIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                                    placeholder="Full Name"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent overflow-hidden">
                                            <div className="bg-gray-50 px-3 py-3 border-r border-gray-200 flex items-center gap-2 text-gray-600 font-medium">
                                                <span>🇳🇵</span>
                                                <span>+977</span>
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '')
                                                    if (val.length <= 10) setPhone(val)
                                                }}
                                                className="w-full px-4 py-3 outline-none"
                                                placeholder="98XXXXXXXX"
                                                required
                                            />
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">
                                            {error}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Please wait...' : 'Send OTP'}
                                        {!loading && <ArrowRight size={18} />}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    {/* OTP Verification */}
                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                />
                                <p className="text-sm text-center text-gray-500 mt-4">
                                    Sent to {phone}{' '}
                                    <button type="button" onClick={() => setStep('input')} className="text-sky-500 hover:underline">
                                        Change
                                    </button>
                                </p>
                            </div>
                            {error && (
                                <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">
                                    {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Please wait...' : 'Verify & Sign In'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                {step === 'input' && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-600">
                            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                            <button
                                onClick={() => {
                                    setMode(mode === 'login' ? 'signup' : 'login')
                                    setError('')
                                }}
                                className="text-sky-500 font-semibold hover:text-sky-600"
                            >
                                {mode === 'login' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}