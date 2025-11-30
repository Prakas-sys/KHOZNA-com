import React from 'react';

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
                            <li><a href="#" className="hover:underline">Contact us</a></li>
                            <li><a href="#" className="hover:underline">Careers</a></li>
                        </ul>
                    </div>

                    {/* Column 2 - Support */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:underline">Help Center</a></li>
                            <li><a href="#" className="hover:underline">Safety</a></li>
                        </ul>
                    </div>

                    {/* Column 3 - Community */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Community</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:underline">Blog</a></li>
                            <li><a href="#" className="hover:underline">Forum</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm">
                    © 2024 KHOZNA. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
