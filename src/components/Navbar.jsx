import React, { useState } from 'react';
import { Menu, User, X, MessageCircle } from 'lucide-react';

const Navbar = ({ user, onPostProperty, onProfileClick, onNavigate, onCategorySelect, selectedCategory }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="bg-white shadow-sm fixed w-full top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
                    <div className="flex justify-between items-center h-16 max-h-16 overflow-hidden">
                        {/* Logo */}
                        <div className="flex items-center cursor-pointer shrink-0">
                            <div className="border-2 border-[#00A8E8] px-2 py-0.5 rounded">
                                <span className="text-lg font-black text-[#00A8E8] tracking-wider">KHOZNA</span>
                            </div>
                        </div>

                        {/* Center Illustrations - LOCKED & FITTED */}
                        <div className="hidden md:flex items-center justify-center gap-6 absolute left-1/2 transform -translate-x-1/2 h-full">
                            <button
                                onClick={() => onCategorySelect('house')}
                                className="group flex flex-col items-center justify-center gap-0 h-full px-3 cursor-pointer relative"
                            >
                                <img
                                    src="/House PNG.png"
                                    alt="House"
                                    className={`h-[52px] w-auto object-contain transition-transform duration-200 group-hover:scale-110 ${selectedCategory === 'house' ? 'scale-110' : ''}`}
                                />
                                <span className={`text-[10px] font-bold -mt-1.5 transition-colors ${selectedCategory === 'house' ? 'text-sky-600' : 'text-gray-600 group-hover:text-black'}`}>House</span>
                                {selectedCategory === 'house' && (
                                    <div className="absolute bottom-0 w-full h-0.5 bg-black rounded-t-full" />
                                )}
                            </button>

                            <button
                                onClick={() => onCategorySelect('apartment')}
                                className="group flex flex-col items-center justify-center gap-0 h-full px-3 cursor-pointer relative"
                            >
                                <img
                                    src="/Apartment png.png"
                                    alt="Apartment"
                                    className={`h-[52px] w-auto object-contain transition-transform duration-200 group-hover:scale-110 ${selectedCategory === 'apartment' ? 'scale-110' : ''}`}
                                />
                                <span className={`text-[10px] font-bold -mt-1.5 transition-colors ${selectedCategory === 'apartment' ? 'text-sky-600' : 'text-gray-600 group-hover:text-black'}`}>Apartment</span>
                                {selectedCategory === 'apartment' && (
                                    <div className="absolute bottom-0 w-full h-0.5 bg-black rounded-t-full" />
                                )}
                            </button>
                        </div>

                        {/* Right Side */}
                        <div className="hidden md:flex items-center space-x-3 shrink-0">
                            <button
                                onClick={onPostProperty}
                                className="text-gray-800 hover:text-[#00A8E8] text-xs font-bold transition px-3 py-1.5 rounded-full hover:bg-gray-100"
                            >
                                Become a Host
                            </button>

                            <button
                                onClick={onProfileClick}
                                className="flex items-center space-x-2 border border-gray-300 rounded-full px-2 py-1.5 hover:shadow-md transition ml-1"
                            >
                                <Menu className="w-4 h-4 text-gray-600" />
                                <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-white" />
                                </div>
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 rounded-full hover:bg-gray-100"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden bg-white border-t border-gray-100 h-screen overflow-y-auto pb-40">
                            <div className="px-4 py-4 space-y-4">
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
            </nav>
            {/* Spacer */}
            <div className="h-16"></div>
        </>
    );
};

export default Navbar;