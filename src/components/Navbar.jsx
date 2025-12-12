import React, { useState } from 'react';
import { Menu, User, X } from 'lucide-react';

const Navbar = ({ user, onPostProperty, onProfileClick, onNavigate, onCategorySelect, selectedCategory }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="bg-white shadow-sm fixed w-full top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center cursor-pointer shrink-0" onClick={() => onNavigate('explore')}>
                            <span className="text-xl font-black text-[#00A8E8] tracking-wider uppercase">KHOZNA</span>
                        </div>

                        {/* Mobile Menu Button - Right Aligned as per screenshot */}
                        <button
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {isMobileMenuOpen && (
                        <div className="absolute top-16 right-0 left-0 bg-white border-t border-gray-100 shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="p-4 space-y-4">
                                <div
                                    onClick={() => { onNavigate('profile'); setIsMobileMenuOpen(false); }}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 bg-gray-50"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <User size={20} className="text-gray-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{user?.user_metadata?.full_name || 'Guest User'}</p>
                                        <p className="text-xs text-gray-500">View Profile</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 pt-2">
                                    <button
                                        onClick={() => {
                                            onPostProperty();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full text-center bg-[#00A8E8] text-white font-semibold py-3 rounded-lg hover:bg-sky-600 transition"
                                    >
                                        Post a Property
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
            {/* Spacer */}
            <div className="h-16"></div>
        </>
    );
};

export default Navbar;