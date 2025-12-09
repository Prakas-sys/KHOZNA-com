import React, { useState, useMemo, useEffect } from 'react';
import {
    UserCircle2, BellDot, LogOut, Heart, Star, Map as MapIcon, MessageCircle,
    Building, Building2, HomeIcon, Briefcase, MapPin, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { NEPAL_LOCATIONS } from '../data/locations';
import KhoznaLogo from './KhoznaLogo';
import Navbar from './Navbar';
import Hero from './Hero';
import SiteFooter from './SiteFooter';

// Fix Leaflet marker icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const ExploreView = ({
    user,
    signOut,
    setAuthMode,
    setShowAuthModal,
    searchQuery,
    setSearchQuery,
    selectedPropertyType,
    setSelectedPropertyType,
    listingType,
    setListingType,
    listings,
    loadingListings,
    handlePostProperty,
    handleCardClick,
    favorites,
    toggleFavorite,
    handleOpenChat,
    onNavigate
}) => {
    const [showMap, setShowMap] = useState(false);
    const [showAutocomplete, setShowAutocomplete] = useState(false);


    const propertyTypes = [
        { id: 'all', label: 'All', icon: Building },
        { id: 'single', label: 'Single', icon: HomeIcon },
        { id: 'double', label: 'Double', icon: Building2 },
        { id: 'apartment', label: 'Apartment', icon: Building },
        { id: 'house', label: 'House', icon: HomeIcon },
        { id: 'office', label: 'Office', icon: Briefcase },
    ];

    const filteredLocations = useMemo(() => {
        if (!searchQuery) return [];
        return NEPAL_LOCATIONS.filter(loc =>
            loc.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
    }, [searchQuery]);

    const filteredListings = useMemo(() => {
        console.log('🔍 ExploreView filtering:', listings.length, 'listings');
        return listings.filter(item => {
            const matchesSearch = item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = selectedPropertyType === 'all' || item.category === selectedPropertyType;

            // Handle missing type (default to 'rent') and ensure case-insensitive comparison
            const itemType = (item.type || 'rent').toLowerCase();
            const currentType = listingType.toLowerCase();
            const matchesListingType = itemType === currentType;

            return matchesSearch && matchesType && matchesListingType;
        });
    }, [listings, searchQuery, selectedPropertyType, listingType]);

    const handleLocationSelect = (location) => {
        setSearchQuery(location);
        setShowAutocomplete(false);
    };

    // Scroll to listings when search is performed
    const handleSearch = () => {
        const listingsSection = document.getElementById('listings-section');
        if (listingsSection) {
            listingsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24">
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

            <div id="listings-section" className="max-w-7xl mx-auto px-4 py-12">
                {/* Listing Controls (Map Toggle) - REMOVED */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {listingType === 'rent' ? 'Properties for Rent' : 'Properties for Sale'}
                    </h2>
                </div>

                {/* Content Area (List or Map) */}
                <div className="min-h-[500px]">
                    {loadingListings ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                        </div>
                    ) : showMap ? (
                        <div className="h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
                            <MapContainer center={[27.7172, 85.3240]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {filteredListings.map(listing => (
                                    <Marker
                                        key={listing.id}
                                        position={[27.7172 + (Math.random() - 0.5) * 0.1, 85.3240 + (Math.random() - 0.5) * 0.1]}
                                    >
                                        <Popup>
                                            <div className="w-40">
                                                <img src={listing.image_url || listing.image} className="w-full h-24 object-cover rounded-lg mb-2" />
                                                <h3 className="font-bold text-sm">{listing.title}</h3>
                                                <p className="text-sky-600 font-bold">Rs. {listing.price.toLocaleString()}</p>
                                                <button
                                                    onClick={() => handleCardClick(listing)}
                                                    className="mt-2 w-full bg-sky-500 text-white text-xs py-1 rounded"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    ) : filteredListings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredListings.map(listing => (
                                <div
                                    key={listing.id}
                                    onClick={() => handleCardClick(listing)}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                                >
                                    <div className="relative">
                                        <img
                                            src={listing.image_url || listing.image}
                                            alt={listing.title}
                                            className="w-full h-44 object-cover"
                                        />
                                        {/* Heart Icon - Top Right */}
                                        <button
                                            onClick={(e) => toggleFavorite(e, listing.id)}
                                            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
                                        >
                                            <Heart
                                                size={16}
                                                className={favorites.includes(listing.id) ? "fill-red-500 text-red-500" : "text-gray-700"}
                                            />
                                        </button>
                                        {/* Map Icon - Top Left - RESTORED */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Could open map view or show location
                                            }}
                                            className="absolute top-3 left-3 p-2 rounded-full bg-sky-500/90 backdrop-blur-sm hover:bg-sky-600 transition-colors shadow-md"
                                        >
                                            <MapIcon size={16} className="text-white" />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 text-lg truncate">{listing.title}</h3>
                                        {/* Location with Icon */}
                                        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                                            <MapPin size={14} className="text-sky-500" />
                                            <span>{listing.location}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1 mb-3">
                                            <span className="font-bold text-gray-900">Rs. {listing.price.toLocaleString()}</span>
                                            <span className="text-gray-500 text-sm">/ month</span>
                                        </div>

                                        {/* Contact Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenChat(listing);
                                            }}
                                            className="mt-3 w-full bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle size={16} />
                                            Contact
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Search size={48} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                            <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedPropertyType('all');
                                }}
                                className="text-sky-600 font-semibold hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>


            <SiteFooter />
        </div >
    );
};

export default ExploreView;
