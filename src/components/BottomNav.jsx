import React from 'react';
import { Search, PlayCircle, Plus, MessageSquare, User } from 'lucide-react';

const BottomNav = ({ currentView, onNavigate, onPostProperty }) => {
    const navItems = [
        { id: 'explore', label: 'Explore', icon: Search },
        { id: 'reels', label: 'Reels', icon: PlayCircle },
        { id: 'add', label: '', icon: Plus, isAction: true }, // Special action button
        { id: 'messages', label: 'Message', icon: MessageSquare },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-6 z-50">
            <div className="flex justify-between items-end pb-3">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;

                    if (item.isAction) {
                        return (
                            <button
                                key={item.id}
                                onClick={onPostProperty}
                                className="relative -top-5 bg-[#00A8E8] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-sky-200 hover:scale-105 transition active:scale-95"
                            >
                                <Plus size={28} strokeWidth={2.5} />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#00A8E8]' : 'text-gray-400'
                                }`}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
