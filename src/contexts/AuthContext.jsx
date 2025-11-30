import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setUser(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {

        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id);
            }
            setLoading(false);
        });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithPhone = async (phone, fullName = null) => {
        // DEV MODE: Check if SMS is enabled, if not use dev mode
        const isDev = import.meta.env.DEV;

        try {
            const options = fullName ? { data: { full_name: fullName } } : {};
            const { data, error } = await supabase.auth.signInWithOtp({
                phone,
                options,
            });
            if (error) throw error;
            return data;
        } catch (error) {
            // If SMS provider not configured, use dev mode
            if (isDev && error.message?.includes('Unsupported phone provider')) {
                console.warn('📱 DEV MODE: SMS not configured, using simulated OTP');

                // Generate OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();

                // Store in localStorage for verification
                localStorage.setItem('dev_otp', otp);
                localStorage.setItem('dev_phone', phone);
                localStorage.setItem('dev_fullName', fullName || '');

                // Show OTP to user
                setTimeout(() => {
                    alert(`📱 DEV MODE - Your OTP is: ${otp}\n\nPhone: ${phone}`);
                }, 500);

                return { session: null };
            }
            throw error;
        }
    };

    const verifyOtp = async (phone, token) => {
        // DEV MODE: Check if we're using simulated OTP
        const isDev = import.meta.env.DEV;
        const devOtp = localStorage.getItem('dev_otp');
        const devPhone = localStorage.getItem('dev_phone');

        if (isDev && devOtp && devPhone === phone) {
            if (token === devOtp) {
                // Create a mock user session
                const userId = `dev-user-${Date.now()}`;
                const fullName = localStorage.getItem('dev_fullName') || 'Test User';

                // Clear dev storage
                localStorage.removeItem('dev_otp');
                localStorage.removeItem('dev_phone');
                localStorage.removeItem('dev_fullName');

                // Create profile in Supabase
                // Note: This won't create an auth user, but we'll simulate it
                console.log('📱 DEV MODE: OTP verified successfully');
                alert('✅ DEV MODE: Login successful!\n\nNote: This is a simulated session for testing.');

                // For dev mode, we need to use email auth as fallback
                // Let's create a dev email based on phone
                const devEmail = `${phone.replace(/\+/g, '')}@dev.khozna.local`;

                try {
                    // Try to sign up with email (password is phone number)
                    const { data, error } = await supabase.auth.signUp({
                        email: devEmail,
                        password: phone,
                        options: {
                            data: { full_name: fullName }
                        }
                    });

                    if (error && !error.message.includes('already registered')) {
                        throw error;
                    }

                    // Sign in
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: devEmail,
                        password: phone,
                    });

                    if (signInError) throw signInError;

                    return signInData;
                } catch (err) {
                    console.error('Dev mode auth error:', err);
                    throw new Error('Dev mode authentication failed. Please check console.');
                }
            } else {
                throw new Error('Invalid OTP');
            }
        }

        // Production mode: use real Supabase OTP
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const value = {
        signInWithPhone,
        verifyOtp,
        signOut,
        user,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
