import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, MapPin, SlidersHorizontal, Building, HomeIcon, Building2, Briefcase,
    UserCircle2, BellDot, LogOut, Heart, Star, Map as MapIcon, List
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { NEPAL_LOCATIONS } from '../data/locations';

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
            const matchesListingType = item.type === listingType;
            return matchesSearch && matchesType && matchesListingType;
        });
    }, [listings, searchQuery, selectedPropertyType, listingType]);

    const handleLocationSelect = (location) => {
        setSearchQuery(location);
        setShowAutocomplete(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* User Profile Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-lg">
                                <UserCircle2 size={28} strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Hello 👋</p>
                                <p className="font-bold text-gray-900">{user.user_metadata?.full_name || user.email}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserCircle2 size={28} strokeWidth={2} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Hello 👋</p>
                                <button
                                    onClick={() => {
                                        setAuthMode('login');
                                        setShowAuthModal(true);
                                    }}
                                    className="font-bold text-sky-500 hover:text-sky-600"
                                >
                                    Sign In
                                </button>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 hover:bg-gray-100 rounded-full relative"
                    >
                        <BellDot size={24} className="text-gray-700" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-14 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-bold text-gray-900">Notifications</h3>
                            </div>
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <BellDot size={48} className="mx-auto mb-2 text-gray-300" />
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                                                    <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(notif.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {!notif.is_read && (
                                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar & Map Toggle */}
            <div className="px-4 py-4 bg-white sticky top-[80px] z-20">
                <div className="flex gap-2 relative">
                    <div className="flex-1 bg-sky-500 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
                        <Search size={20} className="text-white" />
                        <input
                            type="text"
                            placeholder="Search Location"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowAutocomplete(true);
                            }}
                            onFocus={() => setShowAutocomplete(true)}
                            className="flex-1 bg-transparent text-white placeholder-white/80 outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-white/80 hover:text-white">
                                <span className="text-xs">✕</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowMap(!showMap)}
                        className={`p-3 rounded-xl shadow-lg transition-colors ${showMap ? 'bg-sky-600 text-white' : 'bg-white text-sky-500 border border-sky-100'}`}
                    >
                        {showMap ? <List size={24} /> : <MapIcon size={24} />}
                    </button>
                </div>

                {/* Autocomplete Dropdown */}
                {showAutocomplete && filteredLocations.length > 0 && (
                    <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30">
                        {filteredLocations.map((loc, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleLocationSelect(loc)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 border-b last:border-0"
                            >
                                <MapPin size={16} className="text-gray-400" />
                                {loc}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Property Type Filters */}
            <div className="px-4 py-4 bg-white">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {propertyTypes.map(type => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedPropertyType(type.id)}
                            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl min-w-[80px] transition-all ${selectedPropertyType === type.id
                                ? 'bg-sky-500 text-white shadow-lg'
                                : 'bg-white border border-gray-200 text-gray-600'
                                }`}
                        >
                            <type.icon size={24} />
                            <span className="text-xs font-medium whitespace-nowrap">{type.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Promotional Banner */}
            {!showMap && (
                <div className="px-4 py-4">
                    <div className="bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-white text-xl font-bold mb-2">
                            Post your Property for <span className="italic">Free</span>
                        </h3>
                        <button
                            onClick={handlePostProperty}
                            className="bg-white text-sky-600 px-6 py-2 rounded-full font-semibold text-sm mt-3 hover:bg-gray-50 transition-all"
                        >
                            Post Now
                        </button>
                    </div>
                </div>
            )}

            {/* Listing Controls */}
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setListingType('rent')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${listingType === 'rent'
                            ? 'bg-sky-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                            }`}
                    >
                        For Rent
                    </button>
                    <button
                        onClick={() => setListingType('sale')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${listingType === 'sale'
                            ? 'bg-sky-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                            }`}
                    >
                        For Sale
                    </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors">
                    <SlidersHorizontal size={16} />
                    Sort
                </button>
            </div>

            {/* Content Area (List or Map) */}
            <div className="px-4 py-3 h-[500px]">
                {loadingListings ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                    </div>
                ) : showMap ? (
                    <div className="h-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
                        <MapContainer center={[27.7172, 85.3240]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {filteredListings.map(listing => (
                                // Use random offset for demo since we don't have real coords
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
                    <div className="grid grid-cols-2 gap-4 pb-20">
                        {filteredListings.map(listing => (
                            <div
                                key={listing.id}
                                onClick={() => handleCardClick(listing)}
                                className="bg-white rounded-xl overflow-hidden shadow-md active:scale-95 transition-transform"
                            >
                                <div className="relative aspect-[4/3]">
                                    <img
                                        src={listing.image_url || listing.image}
                                        alt={listing.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={(e) => toggleFavorite(e, listing.id)}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm"
                                    >
                                        <Heart
                                            size={16}
                                            className={favorites.includes(listing.id) ? "fill-sky-500 text-sky-500" : "text-gray-700"}
                                        />
                                    </button>
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-gray-500 mb-1 truncate">{listing.title}</p>
                                    <h3 className="font-bold text-gray-900 text-sm mb-2 truncate">{listing.location}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sky-600 font-bold text-sm">₹{listing.price.toLocaleString()}</span>
                                        <div className="flex items-center gap-1">
                                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                            <span className="text-xs text-gray-600">{listing.rating || 'New'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <Search size={48} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No properties found</p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedPropertyType('all');
                            }}
                            className="mt-3 text-sky-500 text-sm font-medium"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExploreView;
