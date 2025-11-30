import React from 'react';
import { Mail, Phone, Instagram, Video } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#0077B6] text-white py-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    {/* Column 1 - About */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">About</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:underline">How it works</a></li>
                            <li><a href="#" className="hover:underline">Careers</a></li>
                        </ul>
                    </div>

                    {/* Column 2 - Contact & Social */}
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="font-bold text-lg mb-4">Contact & Social</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a href="https://wa.me/9779705278379" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-sky-200 transition-colors">
                                    <Phone size={16} />
                                    <span>WhatsApp: 9705278379</span>
                                </a>
                            </li>
                            <li>
                                <a href="mailto:agentnepal850@gmail.com" className="flex items-center gap-2 hover:text-sky-200 transition-colors">
                                    <Mail size={16} />
                                    <span>agentnepal850@gmail.com</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://instagram.com/khozna_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-sky-200 transition-colors">
                                    <Instagram size={16} />
                                    <span>@khozna_</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://tiktok.com/@khozna_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-sky-200 transition-colors">
                                    <Video size={16} />
                                    <span>@khozna_ (TikTok)</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm">
                    © 2025 KHOZNA. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
