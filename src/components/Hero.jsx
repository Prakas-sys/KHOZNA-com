import React, { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { NEPAL_LOCATIONS } from '../data/locations';

const Hero = ({ searchQuery, setSearchQuery, onSearch }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const filtered = NEPAL_LOCATIONS.filter(location =>
                location.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 8); // Show max 8 suggestions
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchQuery]);

    const handleSelectLocation = (location) => {
        setSearchQuery(location);
        setShowSuggestions(false);
        onSearch();
    };

    return (
        <section className="bg-[#90E0EF] pt-12 pb-16 px-6">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-black text-[#1d2d35] mb-3 tracking-tight">
                    Find your next home
                </h1>
                <p className="text-lg text-gray-600 font-medium mb-10 max-w-xs mx-auto leading-tight">
                    Search for rental place all across Nepal
                </p>

                {/* Search Bar */}
                <div className="relative max-w-xl mx-auto">
                    <div className="bg-white rounded-full shadow-md p-1.5 flex items-center">
                        <div className="flex-1 flex items-center px-4">
                            <Search className="w-5 h-5 text-gray-400 mr-3" />
                            <input
                                type="text"
                                placeholder="Search by city, Area, or Property Type"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                                onFocus={() => searchQuery && setShowSuggestions(true)}
                                className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm md:text-base truncate"
                            />
                        </div>
                        <button
                            onClick={onSearch}
                            className="bg-[#00A8E8] w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#0077B6] transition shadow-sm shrink-0"
                        >
                            <Search className="text-white w-5 h-5" strokeWidth={3} />
                        </button>
                    </div>

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl overflow-hidden z-50 text-left">
                            {suggestions.map((location, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSelectLocation(location)}
                                    className="px-6 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">{location}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Hero;
