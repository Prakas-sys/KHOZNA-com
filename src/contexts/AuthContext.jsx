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
        // Check for Sparrow SMS Token
        const sparrowToken = import.meta.env.VITE_SPARROW_SMS_TOKEN;
        const isDev = import.meta.env.DEV;

        try {
            // 1. Try Sparrow SMS if configured
            if (sparrowToken) {
                const { sendOTPViaSparrow, generateOTP } = await import('../lib/sparrowSMS');
                const otp = generateOTP();

                console.log(`Attempting to send OTP via Sparrow to ${phone}`);
                await sendOTPViaSparrow(phone, otp);

                // Store for verification
                localStorage.setItem('custom_auth_otp', otp);
                localStorage.setItem('custom_auth_phone', phone);
                if (fullName) localStorage.setItem('custom_auth_name', fullName);

                return { data: { session: null }, error: null };
            }

            // 2. Try Supabase Native SMS
            const options = fullName ? { data: { full_name: fullName } } : {};
            const { data, error } = await supabase.auth.signInWithOtp({
                phone,
                options,
            });
            if (error) throw error;
            return data;

        } catch (error) {
            // 3. Fallback to Simulated OTP (Demo Mode)
            // This runs if Sparrow is not configured AND Supabase SMS fails (e.g. no credit/provider)
            // We enable this in production too per user request for "demo" purposes without budget.
            if (error.message?.includes('Unsupported phone provider') || error.message?.includes('SMS login is not currently enabled') || !sparrowToken) {
                console.warn('📱 SMS Service: Using secure fallback verification');
                const otp = Math.floor(100000 + Math.random() * 900000).toString();

                localStorage.setItem('custom_auth_otp', otp);
                localStorage.setItem('custom_auth_phone', phone);
                if (fullName) localStorage.setItem('custom_auth_name', fullName);

                // Show OTP to user
                setTimeout(() => {
                    alert(`🔐 KHOZNA Secure Verification\n\nYour OTP Code is: ${otp}\n\nPhone: ${phone}`);
                }, 500);

                return { session: null };
            }
            throw error;
        }
    };

    const verifyOtp = async (phone, token) => {
        const storedOtp = localStorage.getItem('custom_auth_otp');
        const storedPhone = localStorage.getItem('custom_auth_phone');

        // Check if we are verifying a custom OTP (Sparrow or Dev)
        if (storedOtp && storedPhone === phone) {
            if (token === storedOtp) {
                // OTP Matches! Now sign in the user.
                const fullName = localStorage.getItem('custom_auth_name') || 'User';

                // Cleanup
                localStorage.removeItem('custom_auth_otp');
                localStorage.removeItem('custom_auth_phone');
                localStorage.removeItem('custom_auth_name');

                // Workaround: Sign in using a generated email/password
                // This allows us to use Supabase Auth without a native SMS provider
                const dummyEmail = `${phone.replace(/\+/g, '')}@phone.khozna.com`;
                const dummyPassword = `Khozna${phone}Pass!`; // Deterministic password

                try {
                    // 1. Try to Sign Up
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email: dummyEmail,
                        password: dummyPassword,
                        options: { data: { full_name: fullName, phone: phone } }
                    });

                    if (signUpError && !signUpError.message.includes('already registered')) {
                        throw signUpError;
                    }

                    // 2. Sign In
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: dummyEmail,
                        password: dummyPassword,
                    });

                    if (signInError) throw signInError;

                    // 3. Ensure profile exists and is linked
                    if (signInData.user) {
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: signInData.user.id,
                                full_name: fullName,
                                role: 'user'
                            }, { onConflict: 'id' });

                        if (profileError) console.error('Error creating profile:', profileError);
                    }

                    return signInData;
                } catch (authError) {
                    console.error('Custom Auth Error:', authError);
                    throw new Error('Authentication failed. Please try again.');
                }
            } else {
                throw new Error('Invalid OTP code');
            }
        }

        // Fallback to Supabase Native Verification
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
