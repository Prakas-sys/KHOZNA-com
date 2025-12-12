import React from 'react';
import { Play, Plus, UserCircle } from 'lucide-react';

const BottomNav = ({ currentView, onNavigate, onPostProperty }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
            {/* Main Container - Airbnb Style: Clean, White, Top Border, Subtle Shadow */}
            <div className="bg-white border-t border-gray-100/50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-t-[32px] pointer-events-auto pb-safe pt-1 px-4 h-[85px] flex items-end pb-5">
                <div className="flex justify-between items-end w-full max-w-lg mx-auto px-1">

                    {/* Explore - Custom PNG */}
                    <button
                        onClick={() => onNavigate('explore')}
                        className="flex flex-col items-center gap-1 w-14 group cursor-pointer"
                    >
                        <img
                            src="/nav search icon.png"
                            alt="Explore"
                            className="w-[26px] h-[26px] object-contain transition-all duration-300 group-active:scale-95"
                            style={{
                                filter: currentView === 'explore'
                                    ? 'invert(47%) sepia(96%) saturate(1845%) hue-rotate(177deg) brightness(98%) contrast(101%)' // Khozna Blue #00A8E8
                                    : 'grayscale(100%) opacity(0.4)' // Gray
                            }}
                        />
                        <span className={`text-[10px] tracking-wide transition-colors duration-300 ${currentView === 'explore' ? 'text-[#00A8E8] font-semibold' : 'text-gray-400 font-medium'
                            }`}>
                            Explore
                        </span>
                    </button>

                    {/* Reels - Lucide Icon (Clean) */}
                    <button
                        onClick={() => onNavigate('reels')}
                        className="flex flex-col items-center gap-1 w-14 group cursor-pointer"
                    >
                        <div className={`transition-all duration-300 group-active:scale-95 ${currentView === 'reels' ? 'text-[#00A8E8]' : 'text-gray-400 opacity-50'
                            }`}>
                            <Play size={28} strokeWidth={currentView === 'reels' ? 2.5 : 2} className={currentView === 'reels' ? 'fill-current' : ''} />
                        </div>
                        <span className={`text-[10px] tracking-wide transition-colors duration-300 ${currentView === 'reels' ? 'text-[#00A8E8] font-semibold' : 'text-gray-400 font-medium'
                            }`}>
                            Reels
                        </span>
                    </button>

                    {/* Add Button - Floating, Clean, Premium */}
                    <div className="relative -top-8">
                        <button
                            onClick={onPostProperty}
                            className="bg-[#00A8E8] text-white w-[68px] h-[68px] rounded-full flex items-center justify-center shadow-xl shadow-sky-200 hover:scale-105 active:scale-95 transition-all duration-300"
                        >
                            <Plus size={36} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Message - Custom PNG */}
                    <button
                        onClick={() => onNavigate('messages')}
                        className="flex flex-col items-center gap-1 w-14 group cursor-pointer"
                    >
                        <img
                            src="/nav message.png"
                            alt="Message"
                            className="w-[26px] h-[26px] object-contain transition-all duration-300 group-active:scale-95"
                            style={{
                                filter: currentView === 'messages'
                                    ? 'invert(47%) sepia(96%) saturate(1845%) hue-rotate(177deg) brightness(98%) contrast(101%)'
                                    : 'grayscale(100%) opacity(0.4)'
                            }}
                        />
                        <span className={`text-[10px] tracking-wide transition-colors duration-300 ${currentView === 'messages' ? 'text-[#00A8E8] font-semibold' : 'text-gray-400 font-medium'
                            }`}>
                            Message
                        </span>
                    </button>

                    {/* Profile - Lucide Icon (Clean) */}
                    <button
                        onClick={() => onNavigate('profile')}
                        className="flex flex-col items-center gap-1 w-14 group cursor-pointer"
                    >
                        <div className={`transition-all duration-300 group-active:scale-95 ${currentView === 'profile' ? 'text-[#00A8E8]' : 'text-gray-400 opacity-50'
                            }`}>
                            <UserCircle size={28} strokeWidth={currentView === 'profile' ? 2.5 : 2} className={currentView === 'profile' ? 'fill-current' : ''} />
                        </div>
                        <span className={`text-[10px] tracking-wide transition-colors duration-300 ${currentView === 'profile' ? 'text-[#00A8E8] font-semibold' : 'text-gray-400 font-medium'
                            }`}>
                            Profile
                        </span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default BottomNav;
