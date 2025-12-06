// src/components/ConversationsView.jsx
// Shows list of all conversations for the Messages page

import React, { useState, useEffect } from 'react';
import { Send, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserPresence } from '../hooks/useUserPresence';
import OnlineStatus from './OnlineStatus';

export default function ConversationsView({ onSelectChat }) {
    const { user } = useAuth();
    const { isUserOnline, getLastSeenText, getUserStatus } = useUserPresence(user?.id);

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all conversations
    const fetchConversations = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Get conversations where user is buyer or seller
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    id,
                    listing_id,
                    buyer_id,
                    seller_id,
                    created_at,
                    updated_at,
                    listings (
                        id,
                        title,
                        photo_url
                    ),
                    messages (
                        id,
                        content,
                        created_at,
                        sender_id,
                        read_at
                    )
                `)
                .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            // For each conversation, get the other user's profile
            const conversationsWithProfiles = await Promise.all(
                data.map(async (conv) => {
                    const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, phone')
                        .eq('id', otherUserId)
                        .single();

                    // Get last message
                    const lastMessage = conv.messages?.[conv.messages.length - 1];

                    // Count unread messages
                    const unreadCount = conv.messages?.filter(
                        m => m.sender_id !== user.id && !m.read_at
                    ).length || 0;

                    return {
                        ...conv,
                        otherUser: profile,
                        lastMessage,
                        unreadCount
                    };
                })
            );

            setConversations(conversationsWithProfiles);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [user]);

    // Subscribe to new messages
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('conversations_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages'
            }, () => {
                fetchConversations(); // Refresh on any message change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    // Filter conversations by search
    const filteredConversations = conversations.filter(conv =>
        conv.otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.listings?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="p-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-sky-500"
                        />
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Send size={48} className="mb-3" />
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm">Start a conversation by contacting a property owner</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredConversations.map((conv) => {
                            const isOnline = isUserOnline(conv.otherUser?.id);
                            const otherUserStatus = getUserStatus(conv.otherUser?.id);

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelectChat && onSelectChat(conv)}
                                    className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="p-4 flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            {conv.otherUser?.avatar_url ? (
                                                <img
                                                    src={conv.otherUser.avatar_url}
                                                    alt={conv.otherUser.full_name}
                                                    className="w-14 h-14 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-lg">
                                                    {conv.otherUser?.full_name?.[0] || '?'}
                                                </div>
                                            )}

                                            {/* Online Status */}
                                            <div className="absolute bottom-0 right-0">
                                                <OnlineStatus
                                                    isOnline={isOnline}
                                                    lastSeen={otherUserStatus.lastSeen}
                                                    size="sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Conversation Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {conv.otherUser?.full_name || 'Unknown User'}
                                                </h3>
                                                {conv.lastMessage && (
                                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                        {formatTime(conv.lastMessage.created_at)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-600 truncate">
                                                    {conv.lastMessage?.content || 'No messages yet'}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <div className="flex-shrink-0 ml-2 bg-sky-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                        {conv.unreadCount}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Property Title */}
                                            <p className="text-xs text-gray-400 mt-1 truncate">
                                                📍 {conv.listings?.title || 'Property'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}