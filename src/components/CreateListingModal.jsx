import { useState } from 'react';
import { X, Upload, DollarSign, MapPin, Home, Tag, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CreateListingModal({ isOpen, onClose, onSuccess }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        location: '',
        price: '',
        category: 'apartment',
        type: 'rent',
        description: '',
        amenities: '' // comma separated string for input
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size must be less than 5MB');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const uploadImage = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('listings')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('listings')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const validateContentWithAI = async (title, description) => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("Gemini API Key not found, skipping AI validation.");
            return true; // Allow if no key (dev mode fallback) or handle as error
        }

        const prompt = `
        You are a content moderator for a rental property platform called KHOZNA.
        Analyze the following title and description for a new listing.
        
        Title: "${title}"
        Description: "${description}"
        
        Task: Determine if this content is related to renting or selling a property (apartment, house, room, office) or a travel experience/stay.
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
            // In case of AI error, maybe allow or block? Let's allow but log, or block if strict.
            // For this demo, let's assume safe if AI fails to avoid blocking users due to API issues.
            return true;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!user) throw new Error('You must be logged in to post a property.');
            if (!imageFile) throw new Error('Please upload an image for your property.');

            // 0. AI Content Moderation
            const isSafe = await validateContentWithAI(formData.title, formData.description);
            if (!isSafe) {
                throw new Error('Your listing appears to be unrelated to property rentals. Please ensure your post is relevant to KHOZNA.');
            }

            // 1. Upload Image
            const imageUrl = await uploadImage(imageFile);

            // 2. Insert Listing
            const amenitiesArray = formData.amenities.split(',').map(item => item.trim()).filter(i => i);

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
                        image_url: imageUrl,
                        amenities: amenitiesArray,
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

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
                                        placeholder="उदाहरण: ठमेलमा आधुनिक अपार्टमेन्ट"
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
                                        placeholder="उदाहरण: काठमाडौं"
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

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                फोटो (Property Image)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {imagePreview ? (
                                    <div className="relative h-48 w-full">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                            <p className="text-white font-medium">Click to change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-4">
                                        <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mb-2">
                                            <Upload size={24} />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">फोटो अपलोड गर्न क्लिक गर्नुहोस्</p>
                                        <p className="text-xs text-gray-500">Click to upload image</p>
                                        <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
                                    </div>
                                )}
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
                                placeholder="तपाईंको सम्पत्तिको बारेमा लेख्नुहोस्... (Describe your property)"
                            />
                        </div>

                        {/* Amenities */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                सुविधाहरू (Amenities)
                            </label>
                            <div className="relative">
                                <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="amenities"
                                    value={formData.amenities}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                                    placeholder="Wifi, Parking, Kitchen (comma separated)"
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
