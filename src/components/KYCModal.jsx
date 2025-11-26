import { useState } from 'react';
import { X, Upload, Phone, CheckCircle, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function KYCModal({ isOpen, onClose, onSuccess }) {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Upload, 2: Phone, 3: Pending
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [citizenshipFile, setCitizenshipFile] = useState(null);
    const [citizenshipPreview, setCitizenshipPreview] = useState('');
    const [citizenshipNumber, setCitizenshipNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setCitizenshipFile(file);
            setCitizenshipPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const uploadCitizenship = async () => {
        const fileExt = citizenshipFile.name.split('.').pop();
        const fileName = `${user.id}/citizenship.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('kyc-documents')
            .upload(fileName, citizenshipFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('kyc-documents')
            .getPublicUrl(fileName);

        return data.publicUrl;
    };

    const handleStep1Submit = async () => {
        if (!citizenshipFile || !citizenshipNumber) {
            setError('Please upload citizenship and enter number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const photoUrl = await uploadCitizenship();

            // Save to KYC table
            const { error: kycError } = await supabase
                .from('kyc_verifications')
                .upsert({
                    user_id: user.id,
                    citizenship_photo_url: photoUrl,
                    citizenship_number: citizenshipNumber,
                    status: 'pending'
                });

            if (kycError) throw kycError;

            setStep(2);
        } catch (err) {
            setError(err.message || 'Failed to upload citizenship');
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Submit = async () => {
        if (!phoneNumber) {
            setError('Please enter phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Generate OTP (in production, use SMS service)
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

            // Update KYC with phone number
            const { error: updateError } = await supabase
                .from('kyc_verifications')
                .update({
                    phone_number: phoneNumber,
                    otp_code: generatedOtp,
                    otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
                })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // In production, send SMS here
            alert(`OTP sent to ${phoneNumber}: ${generatedOtp}`);
            setStep(3);
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async () => {
        if (!otp) {
            setError('Please enter OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Verify OTP
            const { data: kycData, error: fetchError } = await supabase
                .from('kyc_verifications')
                .select('otp_code')
                .eq('user_id', user.id)
                .single();

            if (fetchError) throw fetchError;

            if (kycData.otp_code !== otp) {
                throw new Error('Invalid OTP');
            }

            // Mark as submitted (pending admin approval)
            const { error: updateError } = await supabase
                .from('kyc_verifications')
                .update({ status: 'pending' })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            setStep(4); // Success/Pending state
        } catch (err) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-br from-sky-500 to-sky-600 px-6 py-5 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Verify Your Identity</h2>
                            <p className="text-sky-100 text-sm">Required to post properties</p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex gap-2 mt-4">
                        {[1, 2, 3].map(s => (
                            <div
                                key={s}
                                className={`flex-1 h-1 rounded-full ${step >= s ? 'bg-white' : 'bg-white/30'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Upload Citizenship */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    नागरिकता प्रमाणपत्र (Citizenship Certificate)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {citizenshipPreview ? (
                                        <img src={citizenshipPreview} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-3">
                                                <Upload size={28} />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">Upload Citizenship Photo</p>
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG (max. 5MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Citizenship Number
                                </label>
                                <input
                                    type="text"
                                    value={citizenshipNumber}
                                    onChange={(e) => setCitizenshipNumber(e.target.value)}
                                    placeholder="e.g. 12-34-56-78901"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleStep1Submit}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white py-3 rounded-xl font-bold hover:from-sky-600 hover:to-sky-700 transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Continue'
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Phone Verification */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Phone size={28} />
                                </div>
                                <h3 className="font-bold text-gray-900">Verify Phone Number</h3>
                                <p className="text-sm text-gray-600">We'll send you an OTP</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="98XXXXXXXX"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleStep2Submit}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white py-3 rounded-xl font-bold hover:from-sky-600 hover:to-sky-700 transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Send OTP'
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 3: OTP Verification */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Phone size={28} />
                                </div>
                                <h3 className="font-bold text-gray-900">Enter OTP</h3>
                                <p className="text-sm text-gray-600">Sent to {phoneNumber}</p>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-center text-2xl font-bold tracking-widest"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleOtpVerify}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white py-3 rounded-xl font-bold hover:from-sky-600 hover:to-sky-700 transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify OTP'
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 4: Pending Approval */}
                    {step === 4 && (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Submitted!</h3>
                            <p className="text-gray-600 mb-6">
                                Your documents are under review. We'll notify you once approved (usually within 24 hours).
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
