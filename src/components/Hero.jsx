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
                                <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 3C9.5 3 7.5 4.5 7.5 7.5V9.5C5 10 3 12.5 3 15.5V19C3 20.5 4.5 22 6 22H18C19.5 22 21 20.5 21 19V15.5C21 12.5 19 10 16.5 9.5V7.5C16.5 4.5 14.5 3 12 3Z" />
                                    <path d="M12 10C10 10 8.5 11.5 8.5 13.5C8.5 16 12 18.5 12 18.5C12 18.5 15.5 16 15.5 13.5C15.5 11.5 14 10 12 10Z" fill="white" />
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
