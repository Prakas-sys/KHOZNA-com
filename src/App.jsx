import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, MapPin, Star, Heart, Filter,
    Wifi, Car, Coffee, Tv, Wind, ChevronLeft,
    CheckCircle, User, Menu, Globe, DollarSign, Calendar,
    Home, Film, PlusCircle, Send, Sparkles, X, BellDot,
    SlidersHorizontal, Building, Building2, HomeIcon, Briefcase, UserCircle2,
    Edit, Trash2, MessageCircle, ChevronRight, Play, Pause, Shield, Flag, Phone,
    Settings, CreditCard, HelpCircle, Camera, Lock, LogOut as LogoutIcon
} from 'lucide-react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import CreateListingModal from './components/CreateListingModal';
import KYCModal from './components/KYCModal';
import ReportModal from './components/ReportModal';
import ExploreView from './components/ExploreView';
import ChatModal from './components/ChatModal';
import KhoznaLogo from './components/KhoznaLogo';
import LocationPermissionModal from './components/LocationPermissionModal';
import Toast from './components/Toast';
import ConversationsView from './components/ConversationsView';
import ChatView from './components/ChatView';
import { supabase } from './lib/supabase';



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
    const { user, signOut, refreshProfile } = useAuth();
    const [view, setView] = useState('explore');
    const [selectedListing, setSelectedListing] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [selectedPropertyType, setSelectedPropertyType] = useState('all');
    const [listingType, setListingType] = useState('rent'); // 'rent' or 'sale'
    const [bookingStep, setBookingStep] = useState(0);



    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showKYCModal, setShowKYCModal] = useState(false);
    const [showKYCDetails, setShowKYCDetails] = useState(false); // New state for read-only view
    const [showReportModal, setShowReportModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatListing, setChatListing] = useState(null);
    const [listings, setListings] = useState([]);
    const [userListings, setUserListings] = useState([]);
    const [currentReelIndex, setCurrentReelIndex] = useState(0);
    const [loadingListings, setLoadingListings] = useState(true);
    const [toast, setToast] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // --- Unread Messages Badge Logic ---
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        const fetchUnreadCount = async () => {
            try {
                // RLS ensures we only count messages in our conversations
                const { count, error } = await supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_read', false)
                    .neq('sender_id', user.id); // Only count messages sent by others

                if (!error) {
                    setUnreadCount(count || 0);
                }
            } catch (err) {
                console.error('Error fetching unread count:', err);
            }
        };

        fetchUnreadCount();

        // Subscribe to real-time changes to update badge immediately
        const channel = supabase.channel('global_unread_messages')
            .on('postgres_changes', {
                event: '*', // Listen to INSERT (new msg) and UPDATE (read status change)
                schema: 'public',
                table: 'messages'
            }, () => {
                // Simply refetch the count on any change for accuracy
                fetchUnreadCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    useEffect(() => {
        const handleShowOtpToast = (e) => {
            const { otp, phone } = e.detail;
            setToast({
                message: `🔐 OTP Code: ${otp} (sent to ${phone})`,
                type: 'info',
                duration: 10000
            });
        };

        window.addEventListener('show-otp-toast', handleShowOtpToast);
        return () => window.removeEventListener('show-otp-toast', handleShowOtpToast);
    }, []);

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
            console.log('🔄 Fetching listings from Supabase...');

            const { data: listingsData, error: listingsError } = await supabase
                .from('listings')
                .select('*')
                .order('created_at', { ascending: false });

            if (listingsError) throw listingsError;

            if (!listingsData || listingsData.length === 0) {
                setListings([]);
                return;
            }

            // Extract unique user IDs
            const userIds = [...new Set(listingsData.map(l => l.user_id))];

            // Batch fetch profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);

            if (profilesError) console.warn('Error fetching profiles:', profilesError);

            // Batch fetch KYC
            const { data: kycData, error: kycError } = await supabase
                .from('kyc_verifications')
                .select('user_id, phone_number')
                .in('user_id', userIds);

            if (kycError) console.warn('Error fetching KYC:', kycError);

            // Create lookup maps
            const profilesMap = (profilesData || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            // Handle potential duplicate KYC records by taking the first one found for each user
            const kycMap = (kycData || []).reduce((acc, k) => {
                if (!acc[k.user_id]) acc[k.user_id] = k;
                return acc;
            }, {});

            // Merge data
            const enrichedData = listingsData.map(listing => ({
                ...listing,
                profiles: profilesMap[listing.user_id] || { full_name: 'Unknown User' },
                kyc_verifications: kycMap[listing.user_id] || null
            }));

            setListings(enrichedData);
            console.log('✅ Listings fetched & enriched:', enrichedData.length);
            console.log('Latest listing:', enrichedData[0]); // Log the newest listing

        } catch (err) {
            console.error('❌ Error fetching listings:', err);
            setListings([]);
        } finally {
            setLoadingListings(false);
        }
    };

    // Check Supabase connection/RLS on mount
    useEffect(() => {
        const checkSystemHealth = async () => {
            try {
                // Try to fetch one public row (or just check connection)
                // We'll try to read from 'listings' as it should be public.
                const { error } = await supabase.from('listings').select('count', { count: 'exact', head: true });
                if (error) {
                    console.error('⚠️ Database connection issue:', error);
                    setToast({
                        message: 'Database connection issue. Check your internet or Supabase RLS policies.',
                        type: 'error',
                        duration: 5000
                    });
                } else {
                    console.log('✅ Supabase connected successfully.');
                }
            } catch (err) {
                console.error('Critical Database Error:', err);
            }
        };

        checkSystemHealth();
        fetchListings();
    }, []);

    // Check location permission on first visit
    useEffect(() => {
        const hasAskedLocation = localStorage.getItem('locationAsked');
        if (!hasAskedLocation) {
            setTimeout(() => {
                setShowLocationModal(true);
            }, 2000); // Show after 2 seconds
        }
    }, []);

    const toggleFavorite = (e, id) => {
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };




    const handleOpenChat = async (listing) => {
        if (!user) {
            setAuthMode('login');
            setShowAuthModal(true);
            return;
        }

        // Fetch owner's profile
        const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', listing.user_id)
            .single();

        // Attach profile to listing
        setChatListing({
            ...listing,
            profiles: ownerProfile || { full_name: 'Property Owner' }
        });
        setShowChatModal(true);
    };

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
        console.log('handlePostProperty called. User:', user);

        if (!user) {
            console.log('User not logged in, showing AuthModal');
            setAuthMode('signup');
            setShowAuthModal(true);
            return;
        }

        // Check if user is verified (explicit check for true)
        if (user.is_verified !== true) {
            console.log('User not verified, showing KYCModal');
            setShowKYCModal(true);
            return;
        }

        console.log('User verified, showing CreateModal');
        setShowCreateModal(true);
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

    // ExploreView is now imported


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
                            onClick={() => setShowReportModal(true)}
                            className="p-2 hover:bg-gray-100 rounded-full text-red-500"
                            title="Report Listing"
                        >
                            <Flag size={20} />
                        </button>
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
                                {['Wifi', 'Parking', 'Water', 'Electricity', 'Kitchen', 'AC', 'TV'].map((amenity) => {
                                    const hasAmenity = selectedListing.amenities?.includes(amenity);
                                    return (
                                        <div key={amenity} className="flex items-center gap-2">
                                            {hasAmenity ? (
                                                <CheckCircle size={18} className="text-green-500" />
                                            ) : (
                                                <X size={18} className="text-red-400" />
                                            )}
                                            <span className={`text-sm ${hasAmenity ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                                {amenity}: {hasAmenity ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    );
                                })}
                                {/* Show other custom amenities */}
                                {selectedListing.amenities?.filter(a => !['Wifi', 'Parking', 'Water', 'Electricity', 'Kitchen', 'AC', 'TV'].includes(a)).map((amenity, idx) => (
                                    <div key={`custom-${idx}`} className="flex items-center gap-2 text-gray-600">
                                        <CheckCircle size={18} className="text-sky-500" />
                                        <span className="text-sm">{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Host Profile Section */}
                        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
                            <h3 className="font-semibold text-lg mb-4">Contact Host</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xl font-bold">
                                    {(selectedListing.profiles?.full_name || 'H')[0].toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                        {selectedListing.profiles?.full_name || 'Property Owner'}
                                    </p>
                                    <p className="text-sm text-gray-500">Verified Host</p>
                                </div>
                            </div>
                            {selectedListing.kyc_verifications?.phone_number && (
                                <a
                                    href={`tel:${selectedListing.kyc_verifications.phone_number}`}
                                    className="flex items-center justify-center gap-2 w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 transition-colors"
                                >
                                    <Phone size={20} />
                                    {selectedListing.kyc_verifications.phone_number}
                                </a>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6">
                            <div className="flex justify-between items-baseline mb-4">
                                <div>
                                    <span className="text-3xl font-bold text-gray-900">₹{selectedListing.price.toLocaleString()}</span>
                                    <span className="text-gray-500 ml-2">/ month</span>
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
            </div>
        );
    };

    const ProfileView = () => {
        const [editMode, setEditMode] = useState(false);
        const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || '');
        const [userListings, setUserListings] = useState([]);
        const [showMyListings, setShowMyListings] = useState(false);
        const [showKYCDetails, setShowKYCDetails] = useState(false);
        const fileInputRef = useRef(null);

        // Use kycMap if available, otherwise fetch or use null. 
        // Since kycMap is local to fetchListings, we need to access it or fetch it.
        // For now, let's assume we fetch it or it's passed. 
        // Actually, we should probably store kycData in a state in RentEaseAppContent if we want to access it here easily without prop drilling.
        // But for now, let's just use the user object or fetch it if needed.
        // Wait, the previous code used `kycMap[user?.id]`. `kycMap` was defined in `fetchListings`.
        // We should probably lift `kycMap` to state or just fetch current user's KYC.
        // Let's add a `currentUserKYC` state to `RentEaseAppContent` and pass it or use it.
        // For simplicity in this fix, I will add `currentUserKYC` state.

        // FIX: Accessing kycMap from fetchListings scope is not possible here.
        // I will add a simple effect to fetch current user KYC in ProfileView.
        const [myKYC, setMyKYC] = useState(null);

        useEffect(() => {
            const fetchMyKYC = async () => {
                if (user) {
                    const { data } = await supabase.from('kyc_verifications').select('*').eq('user_id', user.id).single();
                    setMyKYC(data);
                }
            };
            fetchMyKYC();
        }, [user]);

        useEffect(() => {
            if (user) {
                const myListings = listings.filter(l => l.user_id === user.id);
                setUserListings(myListings);
                if (user.user_metadata?.full_name) {
                    setProfileName(user.user_metadata.full_name);
                }
            }
        }, [user, listings]);

        const handleUpdateProfile = async () => {
            try {
                const { error } = await supabase.auth.updateUser({
                    data: { full_name: profileName }
                });
                if (!error) {
                    setEditMode(false);
                    alert('Profile updated!');
                }
            } catch (err) {
                alert('Failed to update profile');
            }
        };

        const handleAvatarUpload = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                const { error: updateError } = await supabase.auth.updateUser({
                    data: { avatar_url: publicUrl }
                });

                if (updateError) throw updateError;
                alert('Avatar updated!');
            } catch (error) {
                console.error('Error uploading avatar:', error);
                alert('Failed to upload avatar');
            }
        };

        const handleDeleteListing = async (listingId) => {
            if (confirm('Delete this listing?')) {
                const { error } = await supabase
                    .from('listings')
                    .delete()
                    .eq('id', listingId);

                if (!error) {
                    setUserListings(prev => prev.filter(l => l.id !== listingId));
                    alert('Listing deleted!');
                }
            }
        };

        if (!user) {
            return (
                <div className="min-h-screen bg-white pb-24 flex flex-col items-center justify-center p-6">
                    <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mb-6">
                        <UserCircle2 size={48} className="text-sky-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Log in to view profile</h2>
                    <p className="text-gray-500 text-center mb-8 max-w-xs">
                        Join our community to manage your bookings, listings, and profile details.
                    </p>
                    <div className="w-full max-w-xs space-y-3">
                        <Button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="w-full py-3 text-lg">
                            Log In
                        </Button>
                        <Button variant="outline" onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }} className="w-full py-3 text-lg">
                            Create Account
                        </Button>
                    </div>

                    <div className="mt-12 grid grid-cols-3 gap-8 text-center w-full max-w-md">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <Shield size={20} className="text-green-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Verified</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                                <Sparkles size={20} className="text-purple-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">AI Trips</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                                <HomeIcon size={20} className="text-orange-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Hosting</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-white pb-24">
                {/* 1. Top Header (Airbnb Style) */}
                <div className="px-6 pt-12 pb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                </div>

                {/* 2. Profile Card */}
                <div className="px-6 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500 overflow-hidden border border-gray-100 shadow-sm">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-sky-600 transition-colors"
                            >
                                <Camera size={14} strokeWidth={2.5} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {user?.user_metadata?.full_name || user?.email || 'User'}
                            </h2>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                    </div>

                    {/* Airbnb-style Divider */}
                    <div className="h-px bg-gray-200 w-full my-6"></div>

                    {/* 3. Menu Options */}
                    <div className="space-y-2">
                        {/* Personal Info */}
                        <div className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-100 active:scale-[0.98] active:bg-gray-200 -mx-2 px-4 rounded-xl transition-all duration-200 group" onClick={() => setEditMode(true)}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                                    <User size={20} className="text-gray-600 group-hover:text-gray-900" />
                                </div>
                                <span className="text-gray-700 font-medium group-hover:text-gray-900">Personal Information</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* My Listings */}
                        <div
                            className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-100 active:scale-[0.98] active:bg-gray-200 -mx-2 px-4 rounded-xl transition-all duration-200 group"
                            onClick={() => setShowMyListings(true)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                                    <HomeIcon size={20} className="text-gray-600 group-hover:text-gray-900" />
                                </div>
                                <span className="text-gray-700 font-medium group-hover:text-gray-900">My Listings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {userListings.length > 0 && (
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{userListings.length}</span>
                                )}
                                <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>

                        {/* KYC / Trust */}
                        <div
                            className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-100 active:scale-[0.98] active:bg-gray-200 -mx-2 px-4 rounded-xl transition-all duration-200 group"
                            onClick={() => myKYC ? setShowKYCDetails(true) : setShowKYCModal(true)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                                    <Shield size={20} className="text-gray-600 group-hover:text-gray-900" />
                                </div>
                                <span className="text-gray-700 font-medium group-hover:text-gray-900">Identity Verification</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {myKYC ? (
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Verified</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">Required</span>
                                )}
                                <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>

                        {/* Payments (Mock) */}
                        <div className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-100 active:scale-[0.98] active:bg-gray-200 -mx-2 px-4 rounded-xl transition-all duration-200 group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                                    <CreditCard size={20} className="text-gray-600 group-hover:text-gray-900" />
                                </div>
                                <span className="text-gray-700 font-medium group-hover:text-gray-900">Payments & Payouts</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* Support (Mock) */}
                        <div className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-100 active:scale-[0.98] active:bg-gray-200 -mx-2 px-4 rounded-xl transition-all duration-200 group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                                    <HelpCircle size={20} className="text-gray-600 group-hover:text-gray-900" />
                                </div>
                                <span className="text-gray-700 font-medium group-hover:text-gray-900">Support</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-200 w-full my-6"></div>

                    {/* 4. Logout */}
                    <button
                        onClick={signOut}
                        className="w-full py-3 border border-gray-900 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogoutIcon size={18} />
                        Log Out
                    </button>
                </div>

                {/* Edit Profile Modal */}
                {editMode && (
                    <div className="fixed inset-0 bg-white z-50 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold">Edit Profile</h2>
                                <button onClick={() => setEditMode(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>
                                <Button onClick={handleUpdateProfile} className="w-full py-4 text-lg">
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Listings Modal */}
                {showMyListings && (
                    <div className="fixed inset-0 bg-white z-50 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">My Listings</h2>
                                <button onClick={() => setShowMyListings(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {userListings.length === 0 ? (
                                    <p className="text-gray-500 text-center py-10">No listings yet.</p>
                                ) : (
                                    userListings.map(listing => (
                                        <div key={listing.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                                            <img src={listing.image_url || listing.image} alt={listing.title} className="w-20 h-20 rounded-lg object-cover" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{listing.title}</h3>
                                                <p className="text-sm text-gray-500">₹{listing.price.toLocaleString()}</p>
                                                <button onClick={() => handleDeleteListing(listing.id)} className="text-red-500 text-sm mt-2">Delete</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* KYC Details Modal */}
                {showKYCDetails && myKYC && (
                    <div className="fixed inset-0 bg-white z-50 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Identity Verification</h2>
                                <button onClick={() => setShowKYCDetails(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle className="text-green-600" size={24} />
                                        <h3 className="font-bold text-green-800">Verified Identity</h3>
                                    </div>
                                    <p className="text-green-700 text-sm">Your identity has been verified. You can now post properties.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1">Full Name</p>
                                        <p className="font-medium">{myKYC.full_name}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                                        <p className="font-medium">{myKYC.phone_number}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-500 mb-1">Citizenship Number</p>
                                        <p className="font-medium">{myKYC.citizenship_number}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const ReelsView = () => {
        const handleSwipe = (direction) => {
            if (direction === 'up' && currentReelIndex < listings.length - 1) {
                setCurrentReelIndex(prev => prev + 1);
            } else if (direction === 'down' && currentReelIndex > 0) {
                setCurrentReelIndex(prev => prev - 1);
            }
        };

        const currentReel = listings[currentReelIndex];

        return (
            <div className="fixed inset-0 bg-black">
                {listings.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-white">
                        <div className="text-center">
                            <Film size={64} className="mx-auto mb-4 opacity-50" />
                            <p>No properties to show</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative h-full">
                        {/* Property Image */}
                        <img
                            src={currentReel?.image_url || currentReel?.image}
                            alt={currentReel?.title}
                            className="w-full h-full object-cover"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-10">
                            <button
                                onClick={() => setView('explore')}
                                className="p-2 hover:bg-white/20 rounded-full"
                            >
                                <X size={24} />
                            </button>
                            <span className="text-sm">
                                {currentReelIndex + 1} / {listings.length}
                            </span>
                        </div>

                        {/* Property Info */}
                        <div className="absolute bottom-20 left-0 right-0 p-6 text-white z-10">
                            <h2 className="text-2xl font-bold mb-2">{currentReel?.title}</h2>
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin size={16} />
                                <span>{currentReel?.location}</span>
                            </div>
                            <p className="text-3xl font-bold mb-4">₹{currentReel?.price.toLocaleString()}</p>
                            <button
                                onClick={() => {
                                    setSelectedListing(currentReel);
                                    setView('details');
                                }}
                                className="w-full bg-white text-sky-600 py-3 rounded-full font-bold"
                            >
                                View Details
                            </button>
                        </div>

                        {/* Swipe Indicators */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10">
                            <button
                                onClick={() => handleSwipe('down')}
                                disabled={currentReelIndex === 0}
                                className={`p-3 rounded-full ${currentReelIndex === 0 ? 'bg-white/20' : 'bg-white/40 hover:bg-white/60'}`}
                            >
                                <ChevronLeft size={24} className="text-white rotate-90" />
                            </button>
                            <button
                                onClick={(e) => toggleFavorite(e, currentReel?.id)}
                                className="p-3 bg-white/40 hover:bg-white/60 rounded-full"
                            >
                                <Heart
                                    size={24}
                                    className={favorites.includes(currentReel?.id) ? "fill-red-500 text-red-500" : "text-white"}
                                />
                            </button>
                            <button
                                onClick={() => handleSwipe('up')}
                                disabled={currentReelIndex === listings.length - 1}
                                className={`p-3 rounded-full ${currentReelIndex === listings.length - 1 ? 'bg-white/20' : 'bg-white/40 hover:bg-white/60'}`}
                            >
                                <ChevronRight size={24} className="text-white rotate-90" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const MessagesView = () => {
        const [selectedChat, setSelectedChat] = useState(null);

        if (selectedChat) {
            return (
                <ChatView
                    initialConversation={selectedChat}
                    onBack={() => setSelectedChat(null)}
                />
            );
        }

        return <ConversationsView onSelectChat={setSelectedChat} />;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {view === 'explore' && (
                <ExploreView
                    user={user}
                    signOut={signOut}
                    setAuthMode={setAuthMode}
                    setShowAuthModal={setShowAuthModal}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedPropertyType={selectedPropertyType}
                    setSelectedPropertyType={setSelectedPropertyType}
                    listingType={listingType}
                    setListingType={setListingType}
                    listings={listings}
                    loadingListings={loadingListings}
                    handlePostProperty={handlePostProperty}
                    handleCardClick={handleCardClick}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                    handleOpenChat={handleOpenChat}
                />
            )}

            {view === 'details' && <DetailsView />}
            {view === 'profile' && <ProfileView />}
            {view === 'reels' && <ReelsView />}
            {view === 'messages' && <MessagesView />}

            {/* Bottom Navigation */}
            {(view === 'explore' || view === 'profile' || view === 'reels' || view === 'messages') && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-50 h-[70px] shadow-lg">
                    <div
                        onClick={() => setView('explore')}
                        className={`flex flex-col items-center gap-1 cursor-pointer ${view === 'explore' ? 'text-sky-500' : 'text-gray-400 hover:text-sky-500'} transition-colors`}
                    >
                        <Search size={24} strokeWidth={view === 'explore' ? 2.5 : 2} />
                        <span className={`text-[10px] ${view === 'explore' ? 'font-semibold' : 'font-medium'}`}>Explore</span>
                    </div>

                    <div
                        onClick={() => setView('reels')}
                        className={`flex flex-col items-center gap-1 cursor-pointer ${view === 'reels' ? 'text-sky-500' : 'text-gray-400 hover:text-sky-500'} transition-colors`}
                    >
                        <Film size={24} strokeWidth={view === 'reels' ? 2.5 : 2} />
                        <span className={`text-[10px] ${view === 'reels' ? 'font-semibold' : 'font-medium'}`}>Reels</span>
                    </div>

                    <div className="relative -top-6">
                        <button
                            onClick={handlePostProperty}
                            className="w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-300 hover:scale-105 transition-transform active:scale-95"
                        >
                            <PlusCircle size={28} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div
                        onClick={() => setView('messages')}
                        className={`flex flex-col items-center gap-1 cursor-pointer ${view === 'messages' ? 'text-sky-500' : 'text-gray-400 hover:text-sky-500'} transition-colors relative`}
                    >
                        <div className="relative">
                            <Send size={24} strokeWidth={view === 'messages' ? 2.5 : 2} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white shadow-sm animate-pulse">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <span className={`text-[10px] ${view === 'messages' ? 'font-semibold' : 'font-medium'}`}>Messages</span>
                    </div>

                    <div
                        onClick={() => setView('profile')}
                        className={`flex flex-col items-center gap-1 cursor-pointer ${view === 'profile' ? 'text-sky-500' : 'text-gray-400 hover:text-sky-500'} transition-colors`}
                    >
                        <UserCircle2 size={24} strokeWidth={view === 'profile' ? 2.5 : 2} />
                        <span className={`text-[10px] ${view === 'profile' ? 'font-semibold' : 'font-medium'}`}>Profile</span>
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

            <KYCModal
                isOpen={showKYCModal}
                onClose={() => setShowKYCModal(false)}
                onSuccess={() => {
                    setShowKYCModal(false);
                    setShowCreateModal(true);
                }}
            />

            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                listing={selectedListing}
            />

            <ChatModal
                isOpen={showChatModal}
                onClose={() => setShowChatModal(false)}
                listing={chatListing}
                sellerId={chatListing?.user_id}
            />


            {showLocationModal && (
                <LocationPermissionModal
                    onAllow={() => {
                        localStorage.setItem('locationAsked', 'true');
                        if ('geolocation' in navigator) {
                            navigator.geolocation.getCurrentPosition(
                                () => {
                                    setShowLocationModal(false);
                                },
                                () => {
                                    setShowLocationModal(false);
                                }
                            );
                        }
                    }}
                    onDeny={() => {
                        localStorage.setItem('locationAsked', 'true');
                        setShowLocationModal(false);
                    }}
                />
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}