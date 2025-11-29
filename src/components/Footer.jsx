import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-[#0077B6] text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">

                {/* About */}
                <div>
                    <h3 className="font-bold text-lg mb-6">About</h3>
                    <ul className="space-y-4 text-white/90">
                        <li><a href="#" className="hover:underline">Contact us</a></li>
                        <li><a href="#" className="hover:underline">Careers</a></li>
                        <li><a href="#" className="hover:underline">How it works</a></li>
                    </ul>
                </div>

                {/* Support */}
                <div>
                    <h3 className="font-bold text-lg mb-6">Support</h3>
                    <ul className="space-y-4 text-white/90">
                        <li><a href="#" className="hover:underline">Help Center</a></li>
                        <li><a href="#" className="hover:underline">Safety</a></li>
                    </ul>
                </div>

                {/* Community */}
                <div>
                    <h3 className="font-bold text-lg mb-6">Community</h3>
                    <ul className="space-y-4 text-white/90">
                        <li><a href="#" className="hover:underline">Blog</a></li>
                        <li><a href="#" className="hover:underline">Forum</a></li>
                    </ul>
                </div>
            </div>

            <div className="text-center border-t border-white/20 pt-8 text-sm font-medium text-white/80">
                © 2025 KHOZNA. All rights reserved
            </div>
        </footer>
    );
};

export default Footer;
