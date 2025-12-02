import React from 'react';
import { Search, Home, Heart } from 'lucide-react';

const Hero = ({ searchQuery, setSearchQuery, onSearch }) => {
    return (
        <section className="bg-gradient-to-b from-[#90E0EF] to-[#CAF0F8] pt-16 pb-16 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
                    Find your next stay
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                    Search deals on Homes, hotels, and much more...
                </p>

                {/* Search Bar */}
                <div className="bg-white rounded-full shadow-lg p-2 flex items-center max-w-3xl mx-auto">
                    <div className="flex-1 flex items-center px-4">
                        <div className="flex items-center gap-2 mr-3">
                            <Search className="w-5 h-5 text-gray-400" />
                            <Home className="w-5 h-5 text-gray-400" />
                            <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
                        </div>
                        <input
                            type="text"
                            placeholder="Where to stay?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                            className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                        />
                    </div>
                    <button
                        onClick={onSearch}
                        className="bg-[#00A8E8] text-white px-8 py-3 rounded-full hover:bg-[#0077B6] transition font-medium"
                    >
                        Search
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Hero;
