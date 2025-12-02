import React, { useState, useEffect } from 'react';
import { Search, MapPin, Home, Heart } from 'lucide-react';
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
        <section className="bg-gradient-to-b from-[#90E0EF] to-[#CAF0F8] pt-16 pb-16 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
                    Find your next stay
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                    Search deals on Homes, hotels, and much more...
                </p>

                {/* Search Bar */}
                <div className="relative max-w-3xl mx-auto">
                    <div className="bg-white rounded-full shadow-lg p-2 flex items-center">
                        <div className="flex-1 flex items-center px-4">
                            <div className="mr-3">
                                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                    {/* Tapered House Shape: Wide Top, Narrow Bottom */}
                                    <path d="M12 2L4 8L6.5 20C6.8 21.2 7.8 22 9 22H15C16.2 22 17.2 21.2 17.5 20L20 8L12 2Z" />
                                    {/* Perfect Heart Cutout - Centered Lower */}
                                    <path d="M12 11C10.5 11 9.25 12 9.25 13.75C9.25 16 12 18 12 18C12 18 14.75 16 14.75 13.75C14.75 12 13.5 11 12 11Z" fill="white" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Where to stay?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                                onFocus={() => searchQuery && setShowSuggestions(true)}
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

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl overflow-hidden z-50">
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
