import React from 'react';
import { Play, Plus, User } from 'lucide-react';

const BottomNav = ({ currentView, onNavigate, onPostProperty }) => {
    const navItems = [
        { id: 'explore', label: 'Explore', type: 'image', src: '/nav search icon.png' },
        { id: 'reels', label: 'Reels', type: 'filled-icon', icon: Play },
        { id: 'add', label: '', type: 'special', icon: Plus },
        { id: 'messages', label: 'Message', type: 'image', src: '/nav message.png' },
        { id: 'profile', label: 'Profile', type: 'filled-icon', icon: User }
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
            {/* 
         Responsive Container:
         - Full width on mobile/desktop
         - Rounded top corners
         - White background with shadow
      */}
            <div className="bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[24px] md:rounded-none w-full pointer-events-auto pb-safe pt-2 h-[80px] flex items-end pb-4">

                {/* Inner Content - Spaced properly, max-width constrained for web alignment */}
                <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-6 md:px-12">
                    {navItems.map((item) => {
                        const isActive = currentView === item.id;

                        // Handle Special Add Button
                        if (item.type === 'special') {
                            return (
                                <button
                                    key={item.id}
                                    onClick={onPostProperty}
                                    className="relative -top-8 group"
                                    aria-label="Post Property"
                                >
                                    <div className="w-[70px] h-[70px] bg-[#00A8E8] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95">
                                        <item.icon size={36} className="text-white" strokeWidth={3} />
                                    </div>
                                </button>
                            );
                        }

                        // Handle Reels & Profile (Filled Circles from Screenshot)
                        if (item.type === 'filled-icon') {
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className="flex flex-col items-center justify-center gap-1 min-w-[60px]"
                                >
                                    <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-colors duration-200 ${isActive ? 'bg-[#00A8E8] shadow-md shadow-sky-200' : 'bg-gray-300'
                                        }`}>
                                        <item.icon size={14} className="text-white fill-current ml-0.5" strokeWidth={3} />
                                    </div>
                                    <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-[#00A8E8]' : 'text-gray-400'
                                        }`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }

                        // Handle Explore & Message (Outline Images from Screenshot)
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className="flex flex-col items-center justify-center gap-1 min-w-[60px]"
                            >
                                <img
                                    src={item.src}
                                    alt={item.label}
                                    className="w-[26px] h-[26px] object-contain transition-all"
                                    style={{
                                        filter: isActive
                                            ? 'invert(47%) sepia(96%) saturate(1845%) hue-rotate(177deg) brightness(98%) contrast(101%)' // Blue
                                            : 'grayscale(100%) opacity(0.5)' // Grey
                                    }}
                                />
                                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-[#00A8E8]' : 'text-gray-400'
                                    }`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BottomNav;
