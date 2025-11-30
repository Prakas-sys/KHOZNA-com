import React, { useState } from 'react';
import { Globe, Menu, User, X } from 'lucide-react';
import KhoznaLogo from './KhoznaLogo';

const Navbar = ({ user, onPostProperty, onProfileClick }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-2 cursor-pointer">
                            <KhoznaLogo size={32} color="#0EA5E9" />
                            <span className="text-2xl font-bold text-[#00A8E8] tracking-tight">KHOZNA</span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#" className="text-gray-800 hover:text-[#00A8E8] transition font-medium">Places to stay</a>
                            <a href="#" className="text-gray-800 hover:text-[#00A8E8] transition font-medium">Experiences</a>
                            <a href="#" className="text-gray-800 hover:text-[#00A8E8] transition font-medium">Online Experiences</a>
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
                            <a href="#" className="block text-gray-800 hover:text-[#00A8E8] font-medium py-2">Places to stay</a>
                            <a href="#" className="block text-gray-800 hover:text-[#00A8E8] font-medium py-2">Experiences</a>
                            <a href="#" className="block text-gray-800 hover:text-[#00A8E8] font-medium py-2">Online Experiences</a>
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
