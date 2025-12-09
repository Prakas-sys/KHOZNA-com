import React, { useState } from 'react';
import { Menu, User, X, MessageCircle } from 'lucide-react';

const Navbar = ({ user, onPostProperty, onProfileClick, onNavigate, onCategorySelect, selectedCategory }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Fixed Header Container */}
            <div className="fixed w-full top-0 z-50 bg-white shadow-sm transition-all duration-200">
                {/* Top Row: Logo - Search - Profile */}
                <div className="border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
                        <div className="flex justify-between items-center h-20">
                            {/* Logo - Marvel Style */}
                            <div className="flex items-center cursor-pointer">
                                <div className="border-2 border-[#00A8E8] px-3 py-0.5 rounded">
                                    <span className="text-xl font-black text-[#00A8E8] tracking-wider">KHOZNA</span>
                                </div>
                            </div>

                            {/* Desktop Right Side */}
                            <div className="hidden md:flex items-center space-x-4">
                                <button
                                    onClick={onPostProperty}
                                    className="text-gray-800 hover:text-[#00A8E8] text-sm font-medium transition"
                                >
                                    Become a Host
                                </button>

                                <button
                                    onClick={onProfileClick}
                                    className="flex items-center space-x-2 border border-gray-300 rounded-full px-4 py-2 hover:shadow-md transition"
                                >
                                    <Menu className="w-4 h-4" />
                                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                                        <User size={18} className="text-white" />
                                    </div>
                                </button>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                className="md:hidden p-2 rounded-full hover:bg-gray-100"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Categories (Airbnb Style) */}
                <div className="hidden md:block bg-white pb-2">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
                        <div className="flex items-center justify-center gap-16 pt-4 pb-2">
                            {/* House */}
                            <button
                                onClick={() => onCategorySelect('house')}
                                className={`group flex flex-col items-center gap-2 min-w-[64px] cursor-pointer transition-all duration-200 border-b-2 ${selectedCategory === 'house' ? 'border-black pb-2 opacity-100' : 'border-transparent pb-2 opacity-60 hover:opacity-100 hover:border-gray-200'}`}
                            >
                                <img
                                    src="/House PNG.png"
                                    alt="House"
                                    className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
                                />
                                <span className="text-xs font-semibold text-gray-800">House</span>
                            </button>

                            {/* Apartment */}
                            <button
                                onClick={() => onCategorySelect('apartment')}
                                className={`group flex flex-col items-center gap-2 min-w-[64px] cursor-pointer transition-all duration-200 border-b-2 ${selectedCategory === 'apartment' ? 'border-black pb-2 opacity-100' : 'border-transparent pb-2 opacity-60 hover:opacity-100 hover:border-gray-200'}`}
                            >
                                <img
                                    src="/Apartment png.png"
                                    alt="Apartment"
                                    className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
                                />
                                <span className="text-xs font-semibold text-gray-800">Apartment</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 h-screen overflow-y-auto pb-40">
                        <div className="px-4 py-4 space-y-4">
                            {/* House - Mobile */}
                            <div
                                onClick={() => {
                                    onCategorySelect('house');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-all border ${selectedCategory === 'house' ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-transparent'}`}
                            >
                                <img src="/House PNG.png" alt="House" className="w-10 h-10 object-contain" />
                                <span className={`text-lg font-semibold ${selectedCategory === 'house' ? 'text-sky-600' : 'text-gray-800'}`}>House</span>
                            </div>

                            {/* Apartment - Mobile */}
                            <div
                                onClick={() => {
                                    onCategorySelect('apartment');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-all border ${selectedCategory === 'apartment' ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-transparent'}`}
                            >
                                <img src="/Apartment png.png" alt="Apartment" className="w-10 h-10 object-contain" />
                                <span className={`text-lg font-semibold ${selectedCategory === 'apartment' ? 'text-sky-600' : 'text-gray-800'}`}>Apartment</span>
                            </div>

                            <div className="border-t border-gray-100 my-4 pt-4">
                                <button
                                    onClick={() => {
                                        onPostProperty();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full text-left text-gray-800 font-semibold py-3 px-2 hover:bg-gray-50 rounded-lg"
                                >
                                    Become a Host
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Spacer to prevent content from going under fixed navbar */}
            {/* Height needs to cover TopRow (h-20 = 80px) + BottomRow (approx 80px) = 160px */}
            <div className={`h-[150px] md:h-[160px] transition-all duration-200`}></div>
        </>
    );
};

export default Navbar;