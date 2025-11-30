import { useState } from 'react';
import { X, Upload, DollarSign, MapPin, Home, Tag, Loader2, Video, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CreateListingModal({ isOpen, onClose, onSuccess }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Media State
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        location: '',
        price: '',
        category: 'apartment',
        type: 'rent',
        description: '',
        customAmenities: '',
        selectedAmenities: []
    });

    const COMMON_AMENITIES = ['Wifi', 'Parking', 'Water', 'Electricity', 'Kitchen', 'AC', 'TV'];

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => {
            const current = prev.selectedAmenities;
            if (current.includes(amenity)) {
                return { ...prev, selectedAmenities: current.filter(a => a !== amenity) };
            } else {
                return { ...prev, selectedAmenities: [...current, amenity] };
            }
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + imageFiles.length > 10) {
            setError('Maximum 10 images allowed');
            return;
        }

        const newFiles = [];
        const newPreviews = [];

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                setError(`Image ${file.name} is too large (max 5MB)`);
                return;
            }
            newFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        setImageFiles(prev => [...prev, ...newFiles]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setError('');
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit for video
                setError('Video size must be less than 50MB');
                return;
            }
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const removeVideo = () => {
        setVideoFile(null);
        setVideoPreview('');
    };

    const uploadFile = async (file, bucket = 'listings') => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const validateContentWithAI = async (title, description) => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("Gemini API Key not found, skipping AI validation.");
            return true;
        }

        const prompt = `
        You are a content moderator for a rental property platform called KHOZNA.
        Analyze the following title and description for a new listing.
        
        Title: "${title}"
        Description: "${description}"
        
        Task: Determine if this content is related to renting or selling a property (apartment, house, room, office, hotel) or a travel experience/stay.
        If it is related, respond with "SAFE".
        If it is unrelated (e.g., selling a bike, personal rant, spam, inappropriate content), respond with "UNSAFE".
        Only respond with one word: SAFE or UNSAFE.
        `;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                }
            );

            if (!response.ok) throw new Error('AI Validation Failed');
            const data = await response.json();
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();

            return result === 'SAFE';
        } catch (error) {
            console.error("AI Validation Error:", error);
            return true;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!user) throw new Error('You must be logged in to post a property.');
            if (imageFiles.length === 0) throw new Error('Please upload at least one image.');

            // 0. AI Content Moderation
            const isSafe = await validateContentWithAI(formData.title, formData.description);
            if (!isSafe) {
                throw new Error('Your listing appears to be unrelated to property rentals. Please ensure your post is relevant to KHOZNA.');
            }

            // 1. Upload Images
            const imageUrls = await Promise.all(imageFiles.map(file => uploadFile(file)));
            const mainImageUrl = imageUrls[0];

            // 2. Upload Video (if any)
            let videoUrl = null;
            if (videoFile) {
                videoUrl = await uploadFile(videoFile);
            }

            // 3. Prepare Amenities
            const customAmenitiesArray = formData.customAmenities.split(',').map(item => item.trim()).filter(i => i);
            const allAmenities = [...formData.selectedAmenities, ...customAmenitiesArray];

            // 4. Insert Listing
            const { error: insertError } = await supabase
                .from('listings')
                .insert([
                    {
                        title: formData.title,
                        location: formData.location,
                        price: parseFloat(formData.price),
                        category: formData.category,
                        type: formData.type,
                        description: formData.description,
                        image_url: mainImageUrl,
                        images: imageUrls, // Requires schema update
                        video_url: videoUrl, // Requires schema update
                        amenities: allAmenities,
                        user_id: user.id
                    }
                ]);

            if (insertError) throw insertError;

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Error posting property:', err);
            setError(err.message || 'Failed to post property');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">
                        तपाईंको घर/जग्गा पोस्ट गर्नुहोस्
                        <span className="block text-sm font-normal text-gray-500 mt-1">Post Your Property</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    सम्पत्तिको शीर्षक (Property Title)
                                </label>
                                <div className="relative">
                                    <Home size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                        placeholder="Ex: Modern Apartment in Thamel"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    स्थान (Location)
                                </label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="location"
                                        required
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                        placeholder="Ex: Kathmandu"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Price & Category */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    मूल्य (Price)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">Rs.</span>
                                    <input
                                        type="number"
                                        name="price"
                                        required
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    श्रेणी (Category)
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                                >
                                    <option value="apartment">Apartment (अपार्टमेन्ट)</option>
                                    <option value="house">House (घर)</option>
                                    <option value="single">Single Room (एउटा कोठा)</option>
                                    <option value="office">Office Space (अफिस)</option>
                                    <option value="hotel">Hotel (होटल)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    प्रकार (Type)
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                                >
                                    <option value="rent">For Rent (भाडामा)</option>
                                    <option value="sale">For Sale (बिक्रीमा)</option>
                                </select>
                            </div>
                        </div>

                        {/* Media Upload Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Images */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    फोटोहरू (Photos) - Max 10
                                </label>
                                <div className="space-y-3">
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative h-32 flex flex-col items-center justify-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            disabled={imageFiles.length >= 10}
                                        />
                                        <Upload size={24} className="text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500">Click to upload images</p>
                                    </div>

                                    {/* Image Previews */}
                                    {imagePreviews.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {imagePreviews.map((src, index) => (
                                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                                                    <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Video */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    भिडियो (Video) - Optional
                                </label>
                                <div className="space-y-3">
                                    {!videoPreview ? (
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative h-32 flex flex-col items-center justify-center">
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={handleVideoChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <Video size={24} className="text-gray-400 mb-2" />
                                            <p className="text-xs text-gray-500">Click to upload video</p>
                                        </div>
                                    ) : (
                                        <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center group">
                                            <video src={videoPreview} className="w-full h-full object-contain" controls />
                                            <button
                                                type="button"
                                                onClick={removeVideo}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                विवरण (Description)
                            </label>
                            <textarea
                                name="description"
                                required
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                                placeholder="Describe your property..."
                            />
                        </div>

                        {/* Amenities */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                सुविधाहरू (Amenities)
                            </label>

                            {/* Common Amenities Checkboxes */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {COMMON_AMENITIES.map(amenity => (
                                    <button
                                        key={amenity}
                                        type="button"
                                        onClick={() => handleAmenityToggle(amenity)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${formData.selectedAmenities.includes(amenity)
                                                ? 'bg-sky-100 text-sky-700 border-sky-200'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {amenity}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Amenities Input */}
                            <div className="relative">
                                <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="customAmenities"
                                    value={formData.customAmenities}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                    placeholder="Other amenities (comma separated)..."
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-sky-500 text-white py-3 rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    'पोस्ट गर्नुहोस् (Post Property)'
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
