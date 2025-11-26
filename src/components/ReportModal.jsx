import { useState } from 'react';
import { X, AlertTriangle, Flag, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ReportModal({ isOpen, onClose, listing }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const reasons = [
        { id: 'fake_listing', label: 'Fake Listing', desc: 'This property doesn\'t exist' },
        { id: 'scam', label: 'Scam/Fraud', desc: 'Suspicious or fraudulent activity' },
        { id: 'inappropriate', label: 'Inappropriate Content', desc: 'Offensive images or description' },
        { id: 'doesnt_exist', label: 'Property Doesn\'t Exist', desc: 'Location or property is fake' },
        { id: 'unresponsive', label: 'Unresponsive Owner', desc: 'Owner not responding to messages' },
    ];

    const handleSubmit = async () => {
        if (!selectedReason) {
            setError('Please select a reason');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: reportError } = await supabase
                .from('reports')
                .insert({
                    listing_id: listing.id,
                    reporter_id: user.id,
                    reason: selectedReason,
                    details: details,
                    status: 'pending'
                });

            if (reportError) throw reportError;

            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSubmitted(false);
        setSelectedReason('');
        setDetails('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {!submitted ? (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-5 text-white relative">
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <Flag size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Report Listing</h2>
                                    <p className="text-red-100 text-sm">Help us keep KHOZNA safe</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Listing Info */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <img
                                    src={listing?.image_url || listing?.image}
                                    alt={listing?.title}
                                    className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{listing?.title}</h3>
                                    <p className="text-sm text-gray-600">{listing?.location}</p>
                                </div>
                            </div>

                            {/* Reason Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Why are you reporting this?
                                </label>
                                <div className="space-y-2">
                                    {reasons.map(reason => (
                                        <label
                                            key={reason.id}
                                            className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${selectedReason === reason.id
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="reason"
                                                value={reason.id}
                                                checked={selectedReason === reason.id}
                                                onChange={(e) => setSelectedReason(e.target.value)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{reason.label}</div>
                                                <div className="text-sm text-gray-600">{reason.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Additional Details */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Additional Details (Optional)
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    rows={3}
                                    placeholder="Provide more information about this issue..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 resize-none"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    <AlertTriangle size={18} />
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !selectedReason}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Report'
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Success State */
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
                        <p className="text-gray-600 mb-6">
                            Thank you for helping keep KHOZNA safe. We'll review this report and take appropriate action.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
