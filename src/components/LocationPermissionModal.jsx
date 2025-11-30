import React from 'react';
import { MapPin, X } from 'lucide-react';

const LocationPermissionModal = ({ onAllow, onDeny }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">स्थान पहुँच चाहिन्छ</h2>
                            <p className="text-sm text-white/90">Location Access Required</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-700 mb-4 leading-relaxed">
                        तपाईंको नजिकको घर र सम्पत्ति खोज्न हामीलाई तपाईंको स्थान चाहिन्छ।
                    </p>
                    <p className="text-gray-600 text-sm mb-6">
                        We need your location to find perfect homes and properties nearby you.
                    </p>

                    {/* Benefits */}
                    <div className="bg-sky-50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <MapPin size={16} className="text-sky-600" />
                            फाइदाहरू (Benefits):
                        </h3>
                        <ul className="space-y-1 text-sm text-gray-600">
                            <li>• नजिकको सम्पत्तिहरू खोज्नुहोस्</li>
                            <li>• Find nearby properties</li>
                            <li>• सटीक दूरी र दिशा</li>
                            <li>• Accurate distance & directions</li>
                        </ul>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onDeny}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                        >
                            पछि (Later)
                        </button>
                        <button
                            onClick={onAllow}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl font-semibold hover:from-sky-600 hover:to-sky-700 transition shadow-lg"
                        >
                            अनुमति दिनुहोस् (Allow)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationPermissionModal;
