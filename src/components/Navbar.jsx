import React, { useState } from 'react';
import { Globe, Menu, User, X } from 'lucide-react';

const Navbar = ({ user, onPostProperty, onProfileClick }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo - Marvel Style */}
                        <div className="flex items-center cursor-pointer">
                            <div className="border-2 border-[#00A8E8] px-3 py-0.5 rounded">
                                <span className="text-xl font-black text-[#00A8E8] tracking-wider">KHOZNA</span>
                            </div>
                        </div>

                        {/* Desktop Navigation - Professional 8-Point Grid System */}
                        <div className="hidden md:flex items-center gap-8">
                            {/* House - Golden Ratio Proportions */}
                            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl hover:bg-sky-50 transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-sky-100 hover:shadow-lg" style={{
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                                <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110" style={{
                                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)'
                                }}>
                                    <img
                                        src="/House PNG.png"
                                        alt="House"
                                        className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110"
                                    />
                                </div>
                                <span className="text-base font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">House</span>
                            </div>

                            {/* Apartment - Golden Ratio Proportions */}
                            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl hover:bg-sky-50 transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-sky-100 hover:shadow-lg" style={{
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                                <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110" style={{
                                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)'
                                }}>
                                    <img
                                        src="/Apartment png.png"
                                        alt="Apartment"
                                        className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110"
                                    />
                                </div>
                                <span className="text-base font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">Apartment</span>
                            </div>
                        </div>

                        {/* Desktop Right Side */}
                        <div className="hidden md:flex items-center space-x-6">
                            <button
                                onClick={onPostProperty}
                                className="text-gray-800 hover:text-[#00A8E8] text-sm font-medium transition"
                            >
                                Become a Host
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <Globe size={20} className="text-gray-800 hover:text-[#00A8E8]" />
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
                            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100">
                        <div className="px-4 py-4 space-y-3">
                            {/* House - Mobile */}
                            <div className="flex items-center gap-3 p-3 hover:bg-sky-50 rounded-lg transition-all border-2 border-transparent hover:border-sky-200">
                                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm" style={{
                                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.2)'
                                }}>
                                    <img src="/House PNG.png" alt="House" className="w-7 h-7 object-contain" />
                                </div>
                                <span className="text-gray-800 font-semibold">House</span>
                            </div>

                            {/* Apartment - Mobile */}
                            <div className="flex items-center gap-3 p-3 hover:bg-sky-50 rounded-lg transition-all border-2 border-transparent hover:border-sky-200">
                                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm" style={{
                                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.2)'
                                }}>
                                    <img src="/Apartment png.png" alt="Apartment" className="w-7 h-7 object-contain" />
                                </div>
                                <span className="text-gray-800 font-semibold">Apartment</span>
                            </div>

                            <button
                                onClick={() => {
                                    onPostProperty();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="block w-full text-left text-gray-800 hover:text-[#00A8E8] font-medium py-2"
                            >
                                Become a Host
                            </button>
                        </div>
                    </div>
                )}
            </nav>
            {/* Spacer to prevent content from going under fixed navbar */}
            <div className="h-20"></div>
        </>
    );
};

export default Navbar;
