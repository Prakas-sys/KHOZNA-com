import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, MapPin, SlidersHorizontal, Building, HomeIcon, Building2, Briefcase,
    UserCircle2, BellDot, LogOut, Heart, Star, Map as MapIcon, List
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { NEPAL_LOCATIONS } from '../data/locations';
import KhoznaLogo from './KhoznaLogo';
import Navbar from './Navbar';
import Hero from './Hero';
import Footer from './Footer';

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
    toggleFavorite
}) => {
    const [showMap, setShowMap] = useState(false);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch notifications
    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const markAsRead = async (notificationId) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        fetchNotifications();
    };

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
                onProfileClick={() => {
                    if (!user) {
                        setAuthMode('login');
                        setShowAuthModal(true);
                    } else {
                        // If user is logged in, maybe show a dropdown or navigate to profile
                        // For now, let's just log or alert, or maybe trigger the profile view via parent if possible
                        // But ExploreView doesn't control 'view' state of App.jsx directly other than via callbacks if provided.
                        // We can use a simple alert or console log for now as the Profile is accessible via Bottom Nav.
                        console.log("Profile clicked");
                    }
                }}
            />

            <Hero
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={handleSearch}
            />

            <div id="listings-section" className="max-w-7xl mx-auto px-4 py-12">
                {/* Destinations Section */}
                <div className="mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">Explore nearby stays</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                name: 'Kathmandu, Nepal',
                                properties: 856,
                                image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop'
                            },
                            {
                                name: 'Pokhara, Nepal',
                                properties: 423,
                                image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop'
                            },
                            {
                                name: 'Chitwan, Nepal',
                                properties: 187,
                                image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=300&fit=crop'
                            },
                            {
                                name: 'Lumbini, Nepal',
                                properties: 97,
                                image: 'https://images.unsplash.com/photo-1570701564993-e00652af8aa7?w=400&h=300&fit=crop'
                            }
                        ].map((dest) => (
                            <div
                                key={dest.name}
                                onClick={() => {
                                    setSearchQuery(dest.name.split(',')[0]);
                                    handleSearch();
                                }}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                            >
                                <img
                                    src={dest.image}
                                    alt={dest.name}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-800 text-lg">{dest.name}</h3>
                                    <p className="text-gray-500 text-sm">{dest.properties} properties</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Listing Controls (Rent/Sale, Sort, Map Toggle) */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setListingType('rent')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${listingType === 'rent'
                                ? 'bg-sky-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            For Rent
                        </button>
                        <button
                            onClick={() => setListingType('sale')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${listingType === 'sale'
                                ? 'bg-sky-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            For Sale
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className={`p-2 rounded-full shadow-sm border transition-colors ${showMap ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            title={showMap ? "Show List" : "Show Map"}
                        >
                            {showMap ? <List size={20} /> : <MapIcon size={20} />}
                        </button>
                    </div>
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
                                                <p className="text-sky-600 font-bold">₹{listing.price.toLocaleString()}</p>
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
                                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group border border-gray-100"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={listing.image_url || listing.image}
                                            alt={listing.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <button
                                            onClick={(e) => toggleFavorite(e, listing.id)}
                                            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                                        >
                                            <Heart
                                                size={18}
                                                className={favorites.includes(listing.id) ? "fill-red-500 text-red-500" : "text-gray-700"}
                                            />
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-gray-900 truncate flex-1 pr-2">{listing.location}</h3>
                                            <div className="flex items-center gap-1">
                                                <Star size={14} className="fill-gray-900 text-gray-900" />
                                                <span className="text-sm font-medium">{listing.rating || 'New'}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-2 truncate">{listing.title}</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-bold text-gray-900">₹{listing.price.toLocaleString()}</span>
                                            <span className="text-gray-500 text-sm"> night</span>
                                        </div>
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

            <Footer />
        </div>
    );
};

export default ExploreView;
