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
                    Find Rooms & Apartments for Rent in Nepal
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                    Search for rental rooms, apartments, and houses across Nepal
                </p>

                {/* Search Bar */}
                <div className="relative max-w-3xl mx-auto">
                    <div className="bg-white rounded-full shadow-lg p-1.5 flex items-center">
                        <div className="flex-1 flex items-center px-4">
                            <div className="mr-3 flex items-center justify-center">
                                <img
                                    src="/Hom-icon.png"
                                    alt="Home"
                                    className="w-5 h-5 object-contain opacity-50"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Search here..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                                onFocus={() => searchQuery && setShowSuggestions(true)}
                                className="w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent text-lg"
                            />
                        </div>
                        <button
                            onClick={onSearch}
                            className="bg-[#00A8E8] w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#0077B6] transition shadow-md shrink-0"
                        >
                            <Search className="text-white w-6 h-6" strokeWidth={3} />
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
