import React from 'react';
import { Globe, Menu, User } from 'lucide-react';
import KhoznaLogo from './KhoznaLogo';

const Navbar = ({ user, onPostProperty, onProfileClick }) => {
    return (
        <nav className="bg-white py-4 px-6 md:px-12 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer">
                <KhoznaLogo size={32} color="#0EA5E9" />
                <span className="text-xl font-bold text-sky-500 tracking-tight">KHOZNA</span>
            </div>

            {/* Center Links - Hidden on mobile, visible on md+ */}
            <div className="hidden md:flex items-center gap-8 text-gray-600 font-medium">
                <button className="hover:text-gray-900 transition-colors">Places to stay</button>
                <button className="hover:text-gray-900 transition-colors">Experiences</button>
                <button className="hover:text-gray-900 transition-colors">Online Experiences</button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onPostProperty}
                    className="hidden md:block text-sm font-medium text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors"
                >
                    Become a Host
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Globe size={18} className="text-gray-600" />
                </button>

                {/* Profile Menu */}
                <button
                    onClick={onProfileClick}
                    className="flex items-center gap-2 border border-gray-300 rounded-full p-1 pl-3 hover:shadow-md transition-shadow"
                >
                    <Menu size={18} className="text-gray-600" />
                    <div className="bg-gray-500 text-white rounded-full p-1">
                        <User size={18} className="fill-current" />
                    </div>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
