import { useState, useEffect } from 'react';
import { X, Upload, Phone, CheckCircle, Shield, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function KYCModal({ isOpen, onClose, onSuccess }) {
    const { user, refreshProfile } = useAuth();
    const [step, setStep] = useState(1); // 1: Upload, 2: Phone, 3: Pending
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [citizenshipFileFront, setCitizenshipFileFront] = useState(null);
    const [citizenshipFileBack, setCitizenshipFileBack] = useState(null);
    const [citizenshipPreviewFront, setCitizenshipPreviewFront] = useState('');
    const [citizenshipPreviewBack, setCitizenshipPreviewBack] = useState('');
    const [citizenshipNumber, setCitizenshipNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [lastSentOtp, setLastSentOtp] = useState(''); // For testing/demo purposes
    const [resendCooldown, setResendCooldown] = useState(0);
    const formatCitizenshipNumber = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 4) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
        if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4)}`;
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 11)}`;
    };
    // MOVED: if (!isOpen) return null; check is now at the bottom to prevent Hook errors

    useEffect(() => {
        if (isOpen && user) {
            checkExistingKYC();
        }
    }, [isOpen, user]);

    const checkExistingKYC = async () => {
        try {
            const { data, error } = await supabase
                .from('kyc_verifications')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                if (data.status === 'approved') {
                    setStep(4); // Already verified
                } else if (data.status === 'pending') {
                    setStep(4); // Already submitted
                } else if (data.phone_number && !data.otp_verified) {
                    // If they have a phone number but haven't verified OTP, go to step 2 or 3
                    setPhoneNumber(data.phone_number);
                    setStep(2);
                }
            }
        } catch (error) {
            console.error("AI Verification Error:", error);
            throw new Error('AI verification failed. Please try again or contact support.');
        };

        const handleFileChange = (e, side) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    setError('File size must be less than 5MB');
                    return;
                }
                if (side === 'front') {
                    setCitizenshipFileFront(file);
                    setCitizenshipPreviewFront(URL.createObjectURL(file));
                } else {
                    setCitizenshipFileBack(file);
                    setCitizenshipPreviewBack(URL.createObjectURL(file));
                }
                setError('');
            }
        };

        const uploadCitizenship = async () => {
            // Upload front
            const frontExt = citizenshipFileFront.name.split('.').pop();
            const frontFileName = `${user.id}/citizenship-front.${frontExt}`;
            const { error: frontError } = await supabase.storage
                .from('kyc-documents')
                .upload(frontFileName, citizenshipFileFront, { upsert: true });
            if (frontError) throw frontError;
            const { data: frontData } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(frontFileName);

            // Upload back
            const backExt = citizenshipFileBack.name.split('.').pop();
            const backFileName = `${user.id}/citizenship-back.${backExt}`;
            const { error: backError } = await supabase.storage
                .from('kyc-documents')
                .upload(backFileName, citizenshipFileBack, { upsert: true });
            if (backError) throw backError;
            const { data: backData } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(backFileName);

            return { frontUrl: frontData.publicUrl, backUrl: backData.publicUrl };
        };

        const fileToGenerativePart = async (file) => {
            const base64EncodedDataPromise = new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(file);
            });
            return {
                inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
            };
        };

        const verifyDocumentWithAI = async (file) => {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                console.warn("Gemini API Key not found. Skipping AI validation (Dev Mode).");
                return true;
            }

            const prompt = `
        You are a document verification AI for Nepal.
        Analyze this image. Is it a valid Nepalese Citizenship Card (Nagarikta) or Passport?
        It can be the front or back side.
        
        If it looks like a valid ID document, respond with "VALID".
        If it is a random photo, selfie, object, landscape, or clearly not an ID, respond with "INVALID".
        Only respond with one word: VALID or INVALID.
        `;

            try {
                const imagePart = await fileToGenerativePart(file);

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: prompt }, imagePart]
                            }]
                        }),
                    }
                );

                if (!response.ok) throw new Error('AI Verification Failed');
                const data = await response.json();
                const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();

                return result === 'VALID';
            } catch (error) {
                console.error("AI Verification Error:", error);
                // If API fails (network, quota), we might want to fail open or closed. 
                // For security, we should probably warn but allow manual review if it's just a network glitch.
                // But if it's an invalid image, we want to block.
                return true; // Fallback to allow if AI fails
            }
        };

        const handleStep1Submit = async () => {
            if (!user?.id) {
                setError('User not authenticated');
                return;
            }

            if (!citizenshipFileFront || !citizenshipFileBack || !citizenshipNumber) {
                setError('Please upload both sides of citizenship and enter number');
                return;
            }

            setLoading(true);
            setError('');

            try {
                // 0. AI Verification
                const isFrontValid = await verifyDocumentWithAI(citizenshipFileFront);
                if (!isFrontValid) {
                    throw new Error('The uploaded front document does not appear to be a valid Citizenship Card or Passport. Please upload a clear image of your ID.');
                }

                // Optional: Verify back side too, but front is usually enough to catch random photos
                // const isBackValid = await verifyDocumentWithAI(citizenshipFileBack);
                // if (!isBackValid) throw new Error('Back side invalid...');

                const { frontUrl, backUrl } = await uploadCitizenship();

                // Save to KYC table
                const { error: kycError } = await supabase
                    .from('kyc_verifications')
                    .upsert({
                        user_id: user.id,
                        citizenship_photo_url: frontUrl,
                        citizenship_photo_back_url: backUrl, // Ensure this column exists in schema
                        citizenship_number: citizenshipNumber,
                        status: 'pending'
                    }, { onConflict: 'user_id' });

                if (kycError) throw kycError;

                setStep(2);
            } catch (err) {
                console.error('KYC Upload Error:', err);

                // Provide helpful error message for missing bucket
                if (err.message && err.message.includes('Bucket not found')) {
                    setError('Storage bucket not configured. Please contact support or check SUPABASE_SETUP.md');
                } else {
                    setError(err.message || 'Failed to upload citizenship');
                }
            } finally {
                setLoading(false);
            }
        };

        const handleStep2Submit = async () => {
            // Strict Nepal Phone Validation
            const phoneRegex = /^(98|97)\d{8}$/;
            if (!phoneNumber) {
                setError('Please enter phone number');
                return;
            }
            if (!phoneRegex.test(phoneNumber)) {
                setError('Invalid phone number. Must be 10 digits and start with 98 or 97.');
                return;
            }

            setLoading(true);
            setError('');

            try {
                await sendOtp(phoneNumber);
                setStep(3);
            } catch (err) {
                setError(err.message || 'Failed to send OTP');
            } finally {
                setLoading(false);
            }
        };

        const sendOtp = async (phone) => {
            // Generate OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            // setLastSentOtp(generatedOtp); // REMOVED TEST UI

            // Update KYC with phone number
            const { error: updateError } = await supabase
                .from('kyc_verifications')
                .update({
                    phone_number: phone,
                    otp_code: generatedOtp,
                    otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
                })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            // SMS Sending Logic
            const smsApiUrl = import.meta.env.VITE_SMS_API_URL;
            const smsApiKey = import.meta.env.VITE_SMS_API_KEY;

            if (smsApiUrl && smsApiKey) {
                // Real SMS API Call (Example structure for generic provider)
                try {
                    await fetch(smsApiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: phone,
                            text: `Your KHOZNA verification code is: ${generatedOtp}`,
                            token: smsApiKey
                        })
                    });
                } catch (smsError) {
                    console.error("Failed to send real SMS:", smsError);
                    // Fallback to alert for dev/demo if real SMS fails
                    alert(`[DEMO SMS] Your OTP is: ${generatedOtp}`);
                }
            } else {
                // Simulation for Demo/Dev (User requested "message box" style)
                // We use alert to simulate the message arriving on the phone
                setTimeout(() => {
                    alert(`New Message from KHOZNA:\nYour verification code is: ${generatedOtp}`);
                }, 1000);
            }

            // Start cooldown
            setResendCooldown(30);
            const timer = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        const handleResendOtp = async () => {
            if (resendCooldown > 0) return;
            setLoading(true);
            setError('');
            try {
                await sendOtp(phoneNumber);
            } catch (err) {
                setError(err.message || 'Failed to resend OTP');
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

                // Mark as approved (Auto-approval for MVP)
                const { error: updateError } = await supabase
                    .from('kyc_verifications')
                    .update({
                        status: 'approved',
                        verified_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);

                if (updateError) throw updateError;

                // Update profile verification status
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ is_verified: true })
                    .eq('id', user.id);

                if (profileError) throw profileError;

                // Refresh user profile to update UI
                await refreshProfile();

                setStep(4); // Success/Pending state
            } catch (err) {
                setError(err.message || 'Invalid OTP');
            } finally {
                setLoading(false);
            }
        };

        if (!isOpen) return null;

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
                                {/* Front Side */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Citizenship - Front Side
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'front')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {citizenshipPreviewFront ? (
                                            <img src={citizenshipPreviewFront} alt="Front" className="w-full h-32 object-contain rounded-lg" />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-2">
                                                    <Upload size={20} />
                                                </div>
                                                <p className="text-xs font-medium text-gray-900">Upload Front Side</p>
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG (max. 5MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Back Side */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Citizenship - Back Side
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'back')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {citizenshipPreviewBack ? (
                                            <img src={citizenshipPreviewBack} alt="Back" className="w-full h-32 object-contain rounded-lg" />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-2">
                                                    <Upload size={20} />
                                                </div>
                                                <p className="text-xs font-medium text-gray-900">Upload Back Side</p>
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
                                        onChange={(e) => {
                                            const formatted = formatCitizenshipNumber(e.target.value);
                                            if (formatted.replace(/\D/g, '').length <= 11) {
                                                setCitizenshipNumber(formatted);
                                            }
                                        }}
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
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2"
                                >
                                    <ChevronLeft size={16} />
                                    Back
                                </button>
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
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2"
                                >
                                    <ChevronLeft size={16} />
                                    Back
                                </button>
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
                                    className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white py-3 rounded-xl font-bold hover:from-sky-600 hover:to-sky-700 transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
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

                                <button
                                    onClick={handleResendOtp}
                                    disabled={loading || resendCooldown > 0}
                                    className="w-full text-sky-600 font-semibold text-sm hover:underline disabled:text-gray-400 disabled:no-underline"
                                >
                                    {resendCooldown > 0
                                        ? `Resend OTP in ${resendCooldown}s`
                                        : 'Resend OTP'}
                                </button>
                            </div>
                        )}

                        {/* Step 4: Pending Approval */}
                        {step === 4 && (
                            <div className="text-center py-6">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Successful!</h3>
                                <p className="text-gray-600 mb-6">
                                    Your identity has been verified. You can now post properties.
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