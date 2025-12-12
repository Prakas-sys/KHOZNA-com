import React, { useState, useMemo, useEffect } from 'react';
import {
    UserCircle2, BellDot, LogOut, Heart, Star, Map as MapIcon, MessageCircle,
    Building, Building2, HomeIcon, Briefcase, MapPin, Search, BedDouble, Wifi, Droplets
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NEPAL_LOCATIONS } from '../data/locations';
import Navbar from './Navbar';
import Hero from './Hero';
import SiteFooter from './SiteFooter';
import BottomNav from './BottomNav';

const ExploreView = ({
    user,
    setAuthMode,
    setShowAuthModal,
    searchQuery,
    setSearchQuery,
    selectedPropertyType,
    setSelectedPropertyType,
    listingType,
    listings,
    loadingListings,
    handlePostProperty,
    handleCardClick,
    favorites,
    toggleFavorite,
    handleOpenChat,
    onNavigate
}) => {

    const filteredListings = useMemo(() => {
        return listings.filter(item => {
            const matchesSearch = item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = selectedPropertyType === 'all' || item.category === selectedPropertyType;
            return matchesSearch && matchesType;
        });
    }, [listings, searchQuery, selectedPropertyType]);

    // Scroll to listings when search is performed
    const handleSearch = () => {
        const listingsSection = document.getElementById('listings-section');
        if (listingsSection) {
            listingsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24 font-sans">
            <Navbar
                user={user}
                onPostProperty={handlePostProperty}
                onNavigate={onNavigate}
                onCategorySelect={setSelectedPropertyType}
                selectedCategory={selectedPropertyType}
                onProfileClick={() => {
                    if (!user) {
                        setAuthMode('login');
                        setShowAuthModal(true);
                    } else {
                        onNavigate('profile');
                    }
                }}
            />

            <Hero
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={handleSearch}
            />

            <div id="listings-section" className="max-w-7xl mx-auto px-4 pt-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        Discover your Place
                    </h2>
                    {/* Navigation Arrows could go here if needed, keeping it simple for now as per design */}
                </div>

                {loadingListings ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[#00A8E8] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredListings.length > 0 ? (
                    <div className="flex overflow-x-auto pb-8 gap-4 px-1 -mx-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 scrollbar-hide snap-x">
                        {filteredListings.map(listing => (
                            <div
                                key={listing.id}
                                onClick={() => handleCardClick(listing)}
                                className="min-w-[300px] w-[300px] md:w-full shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden snap-center group hover:shadow-md transition-all duration-300"
                            >
                                {/* Image Container */}
                                <div className="relative h-48 w-full bg-gray-100">
                                    <img
                                        src={listing.image_url || listing.image}
                                        alt={listing.title}
                                        className="w-full h-full object-cover"
                                    />

                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className="bg-[#00A8E8] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">New</span>
                                        <span className="bg-white/90 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Verified
                                        </span>
                                    </div>

                                    {/* Heart Icon */}
                                    <button
                                        onClick={(e) => toggleFavorite(e, listing.id)}
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors group-heart"
                                    >
                                        <Heart
                                            size={16}
                                            className={favorites.includes(listing.id) ? "fill-white text-white" : "text-white group-heart-hover:text-red-500"}
                                        />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{listing.title}</h3>
                                        <p className="text-[#0077B6] font-bold text-sm whitespace-nowrap">
                                            Rs.{listing.price.toLocaleString()}<span className="text-[10px] text-gray-400 font-normal">/M</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                                        <MapPin size={12} className="stroke-[2.5]" />
                                        <span className="truncate">{listing.location}</span>
                                        <span className="mx-1">•</span>
                                        <div className="flex items-center gap-0.5 text-gray-800 font-bold">
                                            <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                            {listing.rating || '4.5'}/5
                                        </div>
                                    </div>

                                    {/* Amenities + Action Row */}
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex gap-3 text-gray-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <BedDouble size={18} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex flex-col items-center justify-center">
                                                <Wifi size={18} strokeWidth={1.5} />
                                            </div>
                                            <div className="flex flex-col items-center justify-center">
                                                <Droplets size={18} strokeWidth={1.5} />
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenChat(listing);
                                            }}
                                            className="bg-[#00A8E8] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#0096D1] transition shadow-sm shadow-blue-200"
                                        >
                                            <MessageCircle size={16} className="fill-white/20" />
                                            Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                        <Search size={40} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No properties match your search.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedPropertyType('all'); }}
                            className="text-[#00A8E8] text-sm font-bold mt-2"
                        >
                            View All
                        </button>
                    </div>
                )}
            </div>

            <SiteFooter />
            {/* Bottom Nav will be handled by App.jsx globally to persist state, but if we need it here, we will render it. 
               However, usually BottomNav should be outside of specific views to keep state. 
               I will assume for now I will add it to App.jsx. 
            */}
        </div>
    );
};

export default ExploreView;
