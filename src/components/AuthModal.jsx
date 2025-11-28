import { useState } from 'react'
import { X, Phone, User as UserIcon, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthModal({ isOpen, onClose, mode: initialMode = 'login' }) {
    const [mode, setMode] = useState(initialMode) // 'login' or 'signup'
    const [step, setStep] = useState('phone') // 'phone' or 'otp'
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { signInWithPhone, verifyOtp } = useAuth()

    if (!isOpen) return null

    const handleSendOtp = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await signInWithPhone(phone, mode === 'signup' ? fullName : null)
            setStep('otp')
        } catch (err) {
            setError(err.message)
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
            // Reset state after successful login
            setStep('phone')
            setPhone('')
            setOtp('')
            setFullName('')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {step === 'phone'
                            ? (mode === 'login' ? 'Welcome Back' : 'Create Account')
                            : 'Verify Phone'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={step === 'phone' ? handleSendOtp : handleVerifyOtp} className="p-6 space-y-4">
                    {step === 'phone' && (
                        <>
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <UserIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                            placeholder="Prakash Balayar"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                        placeholder="+977 9800000000"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +977)</p>
                            </div>
                        </>
                    )}

                    {step === 'otp' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter OTP
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                />
                            </div>
                            <p className="text-sm text-center text-gray-500 mt-4">
                                Sent to {phone} <button type="button" onClick={() => setStep('phone')} className="text-sky-500 hover:underline">Change</button>
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Please wait...' : step === 'phone' ? 'Send OTP' : 'Verify & Sign In'}
                        {!loading && step === 'phone' && <ArrowRight size={18} />}
                    </button>
                </form>

                {/* Footer */}
                {step === 'phone' && (
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
