import React from 'react';
import { PlayCircle, Plus, User, Search, MessageSquare } from 'lucide-react';

const BottomNav = ({ currentView, onNavigate, onPostProperty }) => {
    const navItems = [
        { id: 'explore', label: 'Explore', icon: Search },
        { id: 'reels', label: 'Reels', icon: PlayCircle },
        { id: 'add', label: '', type: 'special', icon: Plus },
        { id: 'messages', label: 'Message', icon: MessageSquare },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200 shadow-sm h-[65px] pb-safe">
            <div className="flex items-center justify-between w-full h-full px-6 md:px-12">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    const activeColor = '#00A8E8';
                    const inactiveColor = '#9CA3AF'; // gray-400

                    // Special Add Button
                    if (item.type === 'special') {
                        return (
                            <button
                                key={item.id}
                                onClick={onPostProperty}
                                className="relative -top-5"
                                aria-label="Post Property"
                            >
                                <div className="w-[56px] h-[56px] bg-[#00A8E8] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95">
                                    <item.icon size={30} className="text-white" strokeWidth={3} />
                                </div>
                            </button>
                        );
                    }

                    // Standard Icons (Explore, Reels, Message, Profile)
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className="flex flex-col items-center justify-center gap-1 min-w-[60px] h-full pt-2 group"
                        >
                            <item.icon
                                size={26} // Requested 26px size
                                strokeWidth={isActive ? 2.5 : 2}
                                color={isActive ? activeColor : inactiveColor}
                                className="transition-all duration-200 group-hover:scale-110 group-hover:text-gray-600"
                            />
                            <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${isActive ? 'text-[#00A8E8]' : 'text-gray-400 group-hover:text-gray-600'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
