import React from 'react';
import { Facebook, Instagram, Twitter, TikTok, Mail, Phone, MapPin, Globe } from 'lucide-react';

export default function AppFooter() {
    return (
        <footer className="bg-sky-900 text-white pt-12 pb-24">
            {/* Updated Contact Info & Social Links */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <h2 className="text-2xl font-bold text-white mb-4">KHOZNA</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Your trusted partner for finding the perfect home, office, or vacation stay in Nepal.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-sky-400 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Safety Information</a></li>
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Cancellation Options</a></li>
                            <li><a href="#" className="hover:text-sky-400 transition-colors">Report a Concern</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-3">
                                <MapPin size={16} className="text-sky-500" />
                                <span>Kathmandu, Nepal</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={16} className="text-sky-500" />
                                <span>+977 9863590097</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={16} className="text-sky-500" />
                                <span>support@khozna.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} KHOZNA Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><TikTok size={20} /></a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook size={20} /></a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Globe size={20} /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
