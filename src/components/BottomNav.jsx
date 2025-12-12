import React from 'react';
import { Search, Play, Plus, MessageCircle, UserCircle2 } from 'lucide-react';

const BottomNav = ({ currentView, onNavigate, onPostProperty }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
            {/* Simple white container with top border and safe area padding */}
            <div className="bg-white border-t border-gray-100 shadow-lg pb-safe pt-2 px-6 pointer-events-auto h-[80px] flex items-end pb-4">
                <div className="flex justify-between items-end w-full px-2">

                    {/* Explore */}
                    <button
                        onClick={() => onNavigate('explore')}
                        className={`flex flex-col items-center gap-1 transition-colors w-12 ${currentView === 'explore' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <Search size={26} strokeWidth={currentView === 'explore' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium tracking-wide">Explore</span>
                    </button>

                    {/* Reels */}
                    <button
                        onClick={() => onNavigate('reels')}
                        className={`flex flex-col items-center gap-1 transition-colors w-12 ${currentView === 'reels' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <div className={`w-7 h-7 rounded-full border-[2px] flex items-center justify-center ${currentView === 'reels' ? 'border-[#00A8E8] text-[#00A8E8]' : 'border-gray-400 text-gray-400'} p-0.5`}>
                            <Play size={12} className="fill-current ml-0.5" />
                        </div>
                        <span className="text-[10px] font-medium tracking-wide">Reels</span>
                    </button>

                    {/* Add Button - Floating & Large */}
                    <div className="relative -top-6 mx-2">
                        <button
                            onClick={onPostProperty}
                            className="bg-[#00A8E8] text-white w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95 ring-[5px] ring-white"
                        >
                            <Plus size={32} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Messages - Airbnb Style (MessageCircle) */}
                    <button
                        onClick={() => onNavigate('messages')}
                        className={`flex flex-col items-center gap-1 transition-colors w-12 ${currentView === 'messages' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <MessageCircle size={26} strokeWidth={currentView === 'messages' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium tracking-wide">Message</span>
                    </button>

                    {/* Profile */}
                    <button
                        onClick={() => onNavigate('profile')}
                        className={`flex flex-col items-center gap-1 transition-colors w-12 ${currentView === 'profile' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <UserCircle2 size={26} strokeWidth={currentView === 'profile' ? 2.5 : 2} />
                        <span className="text-[10px] font-medium tracking-wide">Profile</span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default BottomNav;
