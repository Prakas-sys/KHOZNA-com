import React from 'react';
import { Play, Plus, User } from 'lucide-react';

const BottomNav = ({ currentView, onNavigate, onPostProperty }) => {
    const navItems = [
        { id: 'explore', label: 'Explore', type: 'image', src: '/nav search icon.png' },
        { id: 'reels', label: 'Reels', type: 'icon', icon: Play },
        { id: 'add', label: '', type: 'icon', icon: Plus, isSpecial: true },
        { id: 'messages', label: 'Message', type: 'image', src: '/nav message.png' },
        { id: 'profile', label: 'Profile', type: 'icon', icon: User }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            <div className="bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] px-6 py-3 pointer-events-auto pb-safe">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    {navItems.map((item) => {
                        const isActive = currentView === item.id;

                        // Handle Special Add Button
                        if (item.isSpecial) {
                            return (
                                <button
                                    key={item.id}
                                    onClick={onPostProperty}
                                    className="relative -mt-12 group"
                                >
                                    <div className="w-16 h-16 bg-[#00A8E8] rounded-full flex items-center justify-center shadow-lg shadow-sky-200 hover:scale-105 transition-transform active:scale-95">
                                        <item.icon size={32} className="text-white" strokeWidth={3} />
                                    </div>
                                </button>
                            );
                        }

                        // Handle Regular Items
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className="flex flex-col items-center justify-center transition-all w-12"
                            >
                                {item.type === 'image' ? (
                                    <img
                                        src={item.src}
                                        alt={item.label}
                                        className="w-7 h-7 mb-1 object-contain transition-all"
                                        style={{
                                            // If active, apply the user's specific filter to turn it blue. If inactive, grayscale it.
                                            filter: isActive
                                                ? 'invert(47%) sepia(96%) saturate(1845%) hue-rotate(177deg) brightness(98%) contrast(101%)'
                                                : 'grayscale(100%) opacity(0.5)'
                                        }}
                                    />
                                ) : (
                                    <item.icon
                                        size={28}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`mb-1 transition-all ${isActive ? 'text-[#00A8E8] fill-[#00A8E8]/10' : 'text-gray-400 opacity-50'
                                            }`}
                                    />
                                )}

                                <span
                                    className={`text-[10px] transition-all font-medium ${isActive
                                            ? 'text-[#00A8E8]'
                                            : 'text-gray-400'
                                        }`}
                                >
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
