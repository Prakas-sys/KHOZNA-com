import React from 'react';
import { Play, Plus, User } from 'lucide-react';

const BottomNav = ({ currentView, onNavigate, onPostProperty }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
            {/* Background container with rounded corners and shadow */}
            <div className="bg-white rounded-t-[35px] shadow-[0_-5px_25px_rgba(0,0,0,0.08)] pb-safe pt-2 px-5 pointer-events-auto h-[90px] flex items-end pb-5">
                <div className="flex justify-between items-end w-full px-1">

                    {/* Explore - Custom Icon */}
                    <button
                        onClick={() => onNavigate('explore')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-200 w-14 ${currentView === 'explore' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <img
                            src="/nav search icon.png"
                            alt="Explore"
                            className={`w-[28px] h-[28px] object-contain transition-all ${currentView === 'explore' ? 'brightness-100 scale-110' : 'grayscale opacity-50'
                                }`}
                        />
                        <span className={`text-[11px] tracking-wide ${currentView === 'explore' ? 'font-bold' : 'font-medium'}`}>Explore</span>
                    </button>

                    {/* Reels - Filled Circle Look */}
                    <button
                        onClick={() => onNavigate('reels')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-200 w-14 ${currentView === 'reels' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-all ${currentView === 'reels' ? 'bg-[#00A8E8] shadow-md shadow-sky-200' : 'bg-gray-400'
                            }`}>
                            <Play size={12} className="fill-white text-white ml-0.5" />
                        </div>
                        <span className={`text-[11px] tracking-wide ${currentView === 'reels' ? 'font-bold' : 'font-medium'}`}>Reels</span>
                    </button>

                    {/* Add Button - Floating & Large - NO STROKE - Perfectly Centered Pop-up */}
                    <div className="relative -top-10 mx-1">
                        <button
                            onClick={onPostProperty}
                            className="bg-[#00A8E8] text-white w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-lg shadow-[#00A8E8]/30 hover:scale-105 transition-transform duration-200 active:scale-95"
                        >
                            <Plus size={36} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Messages - Custom Icon */}
                    <button
                        onClick={() => onNavigate('messages')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-200 w-14 ${currentView === 'messages' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <img
                            src="/nav message.png"
                            alt="Message"
                            className={`w-[26px] h-[26px] object-contain transition-all ${currentView === 'messages' ? 'brightness-100 scale-110' : 'grayscale opacity-50'
                                }`}
                        />
                        <span className={`text-[11px] tracking-wide ${currentView === 'messages' ? 'font-bold' : 'font-medium'}`}>Message</span>
                    </button>

                    {/* Profile - Filled Circle Look */}
                    <button
                        onClick={() => onNavigate('profile')}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-200 w-14 ${currentView === 'profile' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center overflow-hidden transition-all ${currentView === 'profile' ? 'bg-[#00A8E8] shadow-md shadow-sky-200' : 'bg-gray-400'
                            }`}>
                            <User size={28} className="fill-white text-white translate-y-1" />
                        </div>
                        <span className={`text-[11px] tracking-wide ${currentView === 'profile' ? 'font-bold' : 'font-medium'}`}>Profile</span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default BottomNav;
