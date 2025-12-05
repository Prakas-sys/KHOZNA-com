// src/hooks/useUserPresence.js
// Hook for managing user online/offline status (100% FREE with Supabase)

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useUserPresence(userId) {
    const [userStatuses, setUserStatuses] = useState({});
    const heartbeatInterval = useRef(null);
    const presenceChannel = useRef(null);

    // Set current user as online
    const setOnline = async () => {
        if (!userId) return;

        try {
            await supabase.rpc('set_user_online', { p_user_id: userId });
        } catch (error) {
            console.error('Error setting user online:', error);
        }
    };

    // Set current user as offline
    const setOffline = async () => {
        if (!userId) return;

        try {
            await supabase.rpc('set_user_offline', { p_user_id: userId });
        } catch (error) {
            console.error('Error setting user offline:', error);
        }
    };

    // Fetch initial presence data
    const fetchPresence = async () => {
        try {
            const { data, error } = await supabase
                .from('user_presence')
                .select('user_id, status, last_seen, updated_at');

            if (error) throw error;

            const statusMap = {};
            data.forEach(presence => {
                statusMap[presence.user_id] = {
                    status: presence.status,
                    lastSeen: presence.last_seen,
                    updatedAt: presence.updated_at
                };
            });

            setUserStatuses(statusMap);
        } catch (error) {
            console.error('Error fetching presence:', error);
        }
    };

    // Subscribe to real-time presence changes
    const subscribeToPresence = () => {
        presenceChannel.current = supabase
            .channel('user_presence_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_presence'
                },
                (payload) => {
                    const { new: newRecord, old: oldRecord, eventType } = payload;

                    setUserStatuses(prev => {
                        const updated = { ...prev };

                        if (eventType === 'INSERT' || eventType === 'UPDATE') {
                            updated[newRecord.user_id] = {
                                status: newRecord.status,
                                lastSeen: newRecord.last_seen,
                                updatedAt: newRecord.updated_at
                            };
                        } else if (eventType === 'DELETE') {
                            delete updated[oldRecord.user_id];
                        }

                        return updated;
                    });
                }
            )
            .subscribe();
    };

    // Heartbeat to keep user online (every 30 seconds)
    const startHeartbeat = () => {
        heartbeatInterval.current = setInterval(async () => {
            if (userId) {
                await setOnline();
            }
        }, 30000); // 30 seconds
    };

    const stopHeartbeat = () => {
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }
    };

    // Handle page visibility (tab switch, minimize)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setOffline();
                stopHeartbeat();
            } else {
                setOnline();
                startHeartbeat();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [userId]);

    // Handle beforeunload (user closes tab/browser)
    useEffect(() => {
        const handleBeforeUnload = () => {
            setOffline();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [userId]);

    // Main effect: Initialize presence system
    useEffect(() => {
        if (!userId) return;

        // Set user online immediately
        setOnline();

        // Fetch initial presence data
        fetchPresence();

        // Subscribe to real-time changes
        subscribeToPresence();

        // Start heartbeat
        startHeartbeat();

        // Cleanup on unmount
        return () => {
            setOffline();
            stopHeartbeat();
            if (presenceChannel.current) {
                supabase.removeChannel(presenceChannel.current);
            }
        };
    }, [userId]);

    // Get status for a specific user
    const getUserStatus = (targetUserId) => {
        return userStatuses[targetUserId] || { status: 'offline', lastSeen: null };
    };

    // Check if user is online
    const isUserOnline = (targetUserId) => {
        return userStatuses[targetUserId]?.status === 'online';
    };

    // Get formatted "last seen" text
    const getLastSeenText = (targetUserId) => {
        const status = userStatuses[targetUserId];
        if (!status) return 'Unknown';
        if (status.status === 'online') return 'Online now';

        if (!status.lastSeen) return 'Long time ago';

        const now = new Date();
        const lastSeen = new Date(status.lastSeen);
        const diffMs = now - lastSeen;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return 'Long time ago';
    };

    return {
        userStatuses,
        getUserStatus,
        isUserOnline,
        getLastSeenText,
        setOnline,
        setOffline
    };
}