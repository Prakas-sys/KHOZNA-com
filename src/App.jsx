import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, MapPin, Star, Heart, Filter,
    Wifi, Car, Coffee, Tv, Wind, ChevronLeft,
    CheckCircle, User, Menu, Globe, DollarSign, Calendar,
    Home, Film, PlusCircle, Send, Sparkles, X, BellDot,
    SlidersHorizontal, Building, Building2, HomeIcon, Briefcase, UserCircle2, LogOut
} from 'lucide-react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import CreateListingModal from './components/CreateListingModal';
import { supabase } from './lib/supabase';

// --- API Configuration ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

// --- Mock Data ---
const LISTINGS = [
    {
        id: 1,
        title: "Apartment in Kathmandu",
        location: "Kathmandu",
        category: "apartment",
        price: 3500,
        rating: 4.9,
        reviews: 128,
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        description: "Experience Kathmandu like a local in this stunning modern apartment in the heart of Thamel.",
        amenities: ["Wifi", "Kitchen", "Washer", "AC"],
        host: { name: "Rajesh S.", joined: "2019" },
        type: "rent"
    },
    {
        id: 2,
        title: "Lakeside Villa",
        location: "Pokhara",
        category: "house",
        price: 8500,
        rating: 5.0,
        reviews: 84,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        description: "Wake up to stunning views of Phewa Lake and the Annapurna range.",
        amenities: ["Wifi", "Lake View", "Mountain View", "Garden"],
        host: { name: "Sita M.", joined: "2017" },
        type: "sale"
    },
    {
        id: 3,
        title: "Mountain Lodge",
        location: "Nagarkot",
        category: "house",
        price: 4200,
        rating: 4.8,
        reviews: 156,
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
        description: "Nestled in the hills with breathtaking sunrise views over the Himalayas.",
        amenities: ["Wifi", "Fireplace", "Hiking", "Heating"],
        host: { name: "Pemba T.", joined: "2020" },
        type: "rent"
    },
    {
        id: 4,
        title: "Safari Resort",
        location: "Chitwan",
        category: "apartment",
        price: 6000,
        rating: 4.95,
        reviews: 92,
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        description: "Experience the wild side of Nepal in Chitwan National Park.",
        amenities: ["Wifi", "Safari Tours", "Restaurant"],
        host: { name: "Binod K.", joined: "2021" },
        type: "rent"
    },
];

// --- Components ---

const Badge = ({ children, className = "" }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        {children}
    </span>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false }) => {
    const baseStyles = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95";
    const variants = {
        primary: "bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/30",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        outline: "border border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-50",
        ghost: "text-gray-600 hover:bg-gray-100",
        ai: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {Icon && <Icon size={18} />}
            {children}
        </button>
    );
};

// --- Main Application Component ---

export default function RentEaseApp() {
    return (
        <AuthProvider>
            <RentEaseAppContent />
        </AuthProvider>
    );
}

function RentEaseAppContent() {
    const { user, signOut } = useAuth();
    const [view, setView] = useState('explore');
    const [selectedListing, setSelectedListing] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [selectedPropertyType, setSelectedPropertyType] = useState('all');
    const [listingType, setListingType] = useState('rent'); // 'rent' or 'sale'
    const [bookingStep, setBookingStep] = useState(0);

    const [showAIModal, setShowAIModal] = useState(false);
    const [aiContent, setAiContent] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [listings, setListings] = useState([]);
    const [loadingListings, setLoadingListings] = useState(true);

    const propertyTypes = [
        { id: 'all', label: 'All', icon: Building },
        { id: 'single', label: 'Single', icon: HomeIcon },
        { id: 'double', label: 'Double', icon: Building2 },
        { id: 'apartment', label: 'Apartment', icon: Building },
        { id: 'house', label: 'House', icon: HomeIcon },
        { id: 'office', label: 'Office', icon: Briefcase },
    ];

    // Fetch listings from Supabase
    const fetchListings = async () => {
        try {
            setLoadingListings(true);
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setListings(data || []);
        } catch (err) {
            console.error('Error fetching listings:', err);
        } finally {
            setLoadingListings(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const toggleFavorite = (e, id) => {
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const filteredListings = useMemo(() => {
        return listings.filter(item => {
            const matchesSearch = item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = selectedPropertyType === 'all' || item.category === selectedPropertyType;
            const matchesListingType = item.type === listingType;
            return matchesSearch && matchesType && matchesListingType;
        });
    }, [listings, searchQuery, selectedPropertyType, listingType]);

    const handleCardClick = (listing) => {
        setSelectedListing(listing);
        setView('details');
        setBookingStep(0);
    };

    const handleBack = () => {
        setView('explore');
        setTimeout(() => setSelectedListing(null), 300);
    };

    const handleBook = () => {
        setBookingStep(1);
        setTimeout(() => setBookingStep(2), 1500);
    };

    const handlePostProperty = () => {
        if (user) {
            setShowCreateModal(true);
        } else {
            setAuthMode('signup');
            setShowAuthModal(true);
        }
    };

    const handleGenerateItinerary = async () => {
        if (!selectedListing) return;
        setIsAiLoading(true);
        setShowAIModal(true);
        setAiContent('');

        const prompt = `Create a concise 3-day travel itinerary for ${selectedListing.location}, Nepal. Include hidden gems and popular spots. Format with Day 1, Day 2, Day 3 headers and emojis.`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                }
            );

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate content.";
            setAiContent(text);
        } catch (error) {
            setAiContent("Sorry, our AI travel agent is currently busy!");
        } finally {
            setIsAiLoading(false);
        }
    };

    // --- Sub-Views ---

    const ExploreView = () => (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* User Profile Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between">
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
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full relative">
                        <BellDot size={24} className="text-gray-700" />
                    </button>
                    {user && (
                        <button
                            onClick={() => signOut()}
                            className="p-2 hover:bg-gray-100 rounded-full"
                            title="Sign Out"
                        >
                            <LogOut size={20} className="text-gray-700" />
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-4 bg-white">
                <div className="flex gap-2">
                    <div className="flex-1 bg-sky-500 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
                        <Search size={20} className="text-white" />
                        <input
                            type="text"
                            placeholder="Search Location"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent text-white placeholder-white/80 outline-none"
                        />
                        <MapPin size={20} className="text-white" />
                    </div>
                    <button className="bg-sky-500 p-3 rounded-xl shadow-lg hover:bg-sky-600 transition-colors">
                        <SlidersHorizontal size={24} className="text-white" />
                    </button>
                </div>
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

            {/* Featured Listings */}
            <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Featured Listings</h2>
                    <button className="text-sky-500 text-sm font-medium flex items-center gap-1">
                        See All →
                    </button>
                </div>

                {loadingListings ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                    </div>
                ) : filteredListings.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {filteredListings.map(listing => (
                            <div
                                key={listing.id}
                                onClick={() => handleCardClick(listing)}
                                className="bg-white rounded-xl overflow-hidden shadow-md active:scale-95 transition-transform"
                            >
                                <div className="relative aspect-[4/3]">
                                    <img
                                        src={listing.image_url || listing.image} // Fallback for old mock data structure if needed
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

    const DetailsView = () => {
        if (!selectedListing) return null;

        return (
            <div className="min-h-screen bg-white pb-10">
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex justify-between items-center">
                    <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => toggleFavorite(e, selectedListing.id)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <Heart
                                size={20}
                                className={favorites.includes(selectedListing.id) ? "fill-sky-500 text-sky-500" : "text-gray-700"}
                            />
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="relative h-64 sm:h-96 w-full bg-gray-200">
                        <img
                            src={selectedListing.image_url || selectedListing.image}
                            alt={selectedListing.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="px-6 py-6">
                        <h1 className="text-2xl font-bold mb-2">{selectedListing.title}</h1>
                        <p className="text-gray-600 mb-4">{selectedListing.location}, Nepal</p>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-1">
                                <Star size={16} className="fill-sky-500 text-sky-500" />
                                <span className="font-semibold">{selectedListing.rating || 'New'}</span>
                                <span className="text-gray-500 text-sm">({selectedListing.reviews_count || 0} reviews)</span>
                            </div>
                        </div>

                        <Button
                            variant="ai"
                            onClick={handleGenerateItinerary}
                            className="w-full mb-6 rounded-full"
                            icon={Sparkles}
                        >
                            Plan Trip with AI
                        </Button>

                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3">About</h3>
                            <p className="text-gray-600 leading-relaxed">{selectedListing.description}</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3">Amenities</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {selectedListing.amenities && selectedListing.amenities.map((amenity, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-gray-600">
                                        <CheckCircle size={18} className="text-sky-500" />
                                        <span className="text-sm">{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex justify-between items-baseline mb-4">
                                <div>
                                    <span className="text-3xl font-bold text-gray-900">₹{selectedListing.price.toLocaleString()}</span>
                                    <span className="text-gray-500 ml-2">/ night</span>
                                </div>
                            </div>

                            {bookingStep === 0 && (
                                <Button onClick={handleBook} className="w-full py-3 text-lg">
                                    Reserve Now
                                </Button>
                            )}

                            {bookingStep === 1 && (
                                <div className="flex flex-col items-center py-6">
                                    <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-3"></div>
                                    <p className="text-gray-500 text-sm">Confirming...</p>
                                </div>
                            )}

                            {bookingStep === 2 && (
                                <div className="flex flex-col items-center py-4">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle size={28} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2">Request Sent!</h3>
                                    <p className="text-center text-sm text-gray-500 mb-4">Host will confirm within 24 hours</p>
                                    <Button variant="outline" onClick={() => setBookingStep(0)} className="w-full">
                                        Dismiss
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {showAIModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-violet-50 to-white">
                                <div className="flex items-center gap-2 text-violet-600">
                                    <Sparkles size={20} />
                                    <h3 className="font-bold">AI Travel Planner</h3>
                                </div>
                                <button onClick={() => setShowAIModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {isAiLoading ? (
                                    <div className="space-y-3 animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        <div className="h-20 bg-gray-100 rounded-xl mt-4"></div>
                                    </div>
                                ) : (
                                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{aiContent}</div>
                                )}
                            </div>

                            <div className="p-4 border-t bg-gray-50 flex justify-end">
                                <Button variant="outline" onClick={() => setShowAIModal(false)}>Close</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {view === 'explore' ? <ExploreView /> : <DetailsView />}

            {/* Bottom Navigation */}
            {view === 'explore' && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-50 h-[70px] shadow-lg">
                    <div className="flex flex-col items-center gap-1 text-sky-500 cursor-pointer">
                        <Home size={24} strokeWidth={2.5} />
                        <span className="text-[10px] font-semibold">Home</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-gray-400 cursor-pointer hover:text-sky-500 transition-colors">
                        <Film size={24} strokeWidth={2} />
                        <span className="text-[10px] font-medium">Reels</span>
                    </div>

                    <div className="relative -top-6">
                        <button
                            onClick={handlePostProperty}
                            className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-sky-300 border-4 border-white hover:scale-105 transition-transform active:scale-95"
                        >
                            <PlusCircle size={32} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-gray-400 cursor-pointer hover:text-sky-500 transition-colors">
                        <Send size={24} strokeWidth={2} />
                        <span className="text-[10px] font-medium">Messages</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-gray-400 cursor-pointer hover:text-sky-500 transition-colors">
                        <UserCircle2 size={24} strokeWidth={2} />
                        <span className="text-[10px] font-medium">Profile</span>
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                mode={authMode}
            />

            {/* Create Listing Modal */}
            <CreateListingModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchListings();
                    alert('Property posted successfully!');
                }}
            />
        </div>
    );
}

