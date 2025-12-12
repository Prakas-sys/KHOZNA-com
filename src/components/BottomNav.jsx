import React from 'react';
import { Search, PlayCircle, Plus, MessageSquare, UserCircle } from 'lucide-react';

const BottomNav = ({ currentView, onNavigate, onPostProperty }) => {
    return (
        <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
            {/* Background container with rounded corners and shadow */}
            <div className="bg-white rounded-t-[30px] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe pt-3 px-6 pointer-events-auto h-[85px] flex items-end pb-5">
                <div className="flex justify-between items-end w-full px-2">

                    {/* Explore */}
                    <button
                        onClick={() => onNavigate('explore')}
                        className={`flex flex-col items-center gap-1.5 transition-colors w-12 ${currentView === 'explore' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <Search size={26} strokeWidth={currentView === 'explore' ? 2.5 : 2} />
                        <span className="text-[11px] font-medium tracking-wide">Explore</span>
                    </button>

                    {/* Reels */}
                    <button
                        onClick={() => onNavigate('reels')}
                        className={`flex flex-col items-center gap-1.5 transition-colors w-12 ${currentView === 'reels' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <PlayCircle size={26} strokeWidth={currentView === 'reels' ? 2.5 : 2} />
                        <span className="text-[11px] font-medium tracking-wide">Reels</span>
                    </button>

                    {/* Add Button - Floating & Large - NO STROKE */}
                    <div className="relative -top-8 mx-2">
                        <button
                            onClick={onPostProperty}
                            className="bg-[#00A8E8] text-white w-[64px] h-[64px] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95"
                        >
                            <Plus size={34} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Messages */}
                    <button
                        onClick={() => onNavigate('messages')}
                        className={`flex flex-col items-center gap-1.5 transition-colors w-12 ${currentView === 'messages' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <MessageSquare size={26} strokeWidth={currentView === 'messages' ? 2.5 : 2} />
                        <span className="text-[11px] font-medium tracking-wide">Message</span>
                    </button>

                    {/* Profile */}
                    <button
                        onClick={() => onNavigate('profile')}
                        className={`flex flex-col items-center gap-1.5 transition-colors w-12 ${currentView === 'profile' ? 'text-[#00A8E8]' : 'text-gray-400'
                            }`}
                    >
                        <UserCircle size={28} strokeWidth={currentView === 'profile' ? 2.5 : 2} />
                        <span className="text-[11px] font-medium tracking-wide">Profile</span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default BottomNav;
