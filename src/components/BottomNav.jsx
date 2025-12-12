import React from 'react';
import { Play, Plus, User } from 'lucide-react';

const BottomNav = ({ currentView, onNavigate, onPostProperty }) => {
    const navItems = [
        { id: 'explore', label: 'Explore', type: 'image', src: '/nav search icon.png' },
        { id: 'reels', label: 'Reels', type: 'icon', icon: Play },
        { id: 'add', label: '', type: 'special', icon: Plus },
        { id: 'messages', label: 'Message', type: 'image', src: '/nav message.png' },
        { id: 'profile', label: 'Profile', type: 'icon', icon: User }
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-gray-200 shadow-sm h-[65px] pb-safe">
            <div className="flex items-center justify-between w-full h-full max-w-lg mx-auto px-4">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    const activeColor = '#00A8E8';
                    const inactiveColor = '#6B7280'; // gray-500

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

                    // Lucide Icons (Reels, Profile) - Standardized
                    if (item.type === 'icon') {
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className="flex flex-col items-center justify-center gap-1 min-w-[60px] h-full pt-2"
                            >
                                <item.icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    color={isActive ? activeColor : inactiveColor}
                                    className="transition-colors duration-200"
                                />
                                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-[#00A8E8]' : 'text-gray-500'
                                    }`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    }

                    // Image Icons (Explore, Message) - Standardized
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className="flex flex-col items-center justify-center gap-1 min-w-[60px] h-full pt-2"
                        >
                            <img
                                src={item.src}
                                alt={item.label}
                                className="w-[24px] h-[24px] object-contain transition-all duration-200"
                                style={{
                                    filter: isActive
                                        ? 'invert(47%) sepia(96%) saturate(1845%) hue-rotate(177deg) brightness(98%) contrast(101%)' // Matches #00A8E8
                                        : 'grayscale(100%) opacity(0.6)' // Matches gray-500 look
                                }}
                            />
                            <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-[#00A8E8]' : 'text-gray-500'
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
