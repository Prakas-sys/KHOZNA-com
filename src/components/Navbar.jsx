import React, { useState } from 'react';
import { Globe, Menu, User, X, MessageCircle } from 'lucide-react';

const Navbar = ({ user, onPostProperty, onProfileClick }) => {
                                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm" style={{
                                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.2)'
                                }}>
                                    <img src="/Apartment png.png" alt="Apartment" className="w-7 h-7 object-contain" />
                                </div>
                                <span className="text-gray-800 font-semibold">Apartment</span>
                            </div >

    <button
        onClick={() => {
            onPostProperty();
            setIsMobileMenuOpen(false);
        }}
        className="block w-full text-left text-gray-800 hover:text-[#00A8E8] font-medium py-2"
    >
        Become a Host
    </button>
                        </div >
                    </div >
                )}
            </nav >
    {/* Spacer to prevent content from going under fixed navbar */ }
    < div className = "h-28" ></div > {/* Back to h-20 */ }
        </>
    );
};

export default Navbar;
