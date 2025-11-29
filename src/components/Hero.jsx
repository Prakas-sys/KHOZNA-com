import React from 'react';
import { Search, MapPin } from 'lucide-react';

const Hero = ({ searchQuery, setSearchQuery, onSearch }) => {
    return (
        <div className="bg-sky-300 w-full py-20 px-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Background Pattern/Gradient could go here if needed, but solid color matches design */}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
                Find your next stay
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl">
                Search deals on Homes , hotels, and much more...
            </p>

            {/* Search Bar Container */}
            <div className="bg-white rounded-full p-2 shadow-xl flex flex-col md:flex-row items-center w-full max-w-4xl mx-auto">

                {/* Where to stay? */}
                <div className="flex-1 w-full md:w-auto px-6 py-3 border-b md:border-b-0 md:border-r border-gray-200 flex items-center gap-3">
                    <div className="text-gray-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 10V15H4V10C4 6.68629 6.68629 4 10 4H14C17.3137 4 20 6.68629 20 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4 15H20V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 12H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Where to stay?"
                        className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Popular destinations */}
                <div className="flex-1 w-full md:w-auto px-6 py-3 flex items-center gap-3">
                    <MapPin className="text-gray-400" size={24} />
                    <input
                        type="text"
                        placeholder="Popular destinations"
                        className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                    />
                </div>

                {/* Search Button */}
                <button
                    onClick={onSearch}
                    className="bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-full transition-colors shadow-lg m-1"
                >
                    <Search size={24} />
                </button>
            </div>
        </div>
    );
};

export default Hero;
