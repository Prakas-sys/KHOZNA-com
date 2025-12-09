import React, { useState, useEffect } from 'react';
import { Send, Search, MessageCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ChatModal from './ChatModal';

export default function ConversationsView() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConversation, setSelectedConversation] = useState(null);

    useEffect(() => {
        if (!user) return;
        fetchConversations();

        // Real-time subscription for new messages
        const channel = supabase
            .channel('conversations_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages'
            }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchConversations = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Get all conversations where user is a participant
            const { data: convData, error: convError } = await supabase
                .from('conversations')
                .select(`
                    id,
                    listing_id,
                    participant_1_id,
                    participant_2_id,
                    last_message_at,
                    last_message_at,
                    created_at,
                    deleted_by
                `)
                .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (convError) throw convError;

            if (!convData || convData.length === 0) {
                setConversations([]);
                setLoading(false);
                return;
            }

            // FILTER: Hide conversations deleted by this user
            const activeConversations = convData.filter(c =>
                !c.deleted_by || !c.deleted_by.includes(user.id)
            );

            if (activeConversations.length === 0) {
                setConversations([]);
                setLoading(false);
                return;
            }

            // Get unique listing IDs from ACTIVE conversations
            const listingIds = [...new Set(activeConversations.map(c => c.listing_id))];

            // Fetch listings
            const { data: listingsData } = await supabase
                .from('listings')
                .select('id, title, image_url')
                .in('id', listingIds);

            const listingsMap = (listingsData || []).reduce((acc, l) => {
                acc[l.id] = l;
                return acc;
            }, {});

            // Get unique user IDs (other participants)
            const userIds = activeConversations.map(c =>
                c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id
            );

            // Fetch profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

            const profilesMap = (profilesData || []).reduce((acc, p) => {
                acc[p.id] = p;
                return acc;
            }, {});

            // Get last message for each conversation
            const convIds = activeConversations.map(c => c.id);
            const { data: messagesData } = await supabase
                .from('messages')
                .select('id, conversation_id, content, created_at, sender_id, read_at')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });

            // Group messages by conversation and get the latest
            const lastMessagesMap = {};
            const unreadCountMap = {};

            messagesData?.forEach(msg => {
                if (!lastMessagesMap[msg.conversation_id]) {
                    lastMessagesMap[msg.conversation_id] = msg;
                }
                // Count unread messages from other person
                if (msg.sender_id !== user.id && !msg.read_at) {
                    unreadCountMap[msg.conversation_id] = (unreadCountMap[msg.conversation_id] || 0) + 1;
                }
            });

            // Combine everything
            const enrichedConversations = activeConversations.map(conv => {
                const otherUserId = conv.participant_1_id === user.id
                    ? conv.participant_2_id
                    : conv.participant_1_id;

                return {
                    ...conv,
                    listing: listingsMap[conv.listing_id] || { title: 'Property', image_url: null },
                    otherUser: profilesMap[otherUserId] || { full_name: 'User', avatar_url: null },
                    lastMessage: lastMessagesMap[conv.id] || null,
                    unreadCount: unreadCountMap[conv.id] || 0
                };
                setConversations(enrichedConversations);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        const handleDeleteConversation = async (e, conversationId) => {
            e.stopPropagation();
            if (!window.confirm('Delete this conversation? It will be removed from your list.')) return;

            try {
                // Call RPC function to soft delete for this user
                const { error } = await supabase.rpc('delete_conversation_for_user', {
                    conversation_id: conversationId,
                    user_id: user.id
                });

                if (error) throw error;

                // Optimistic update
                setConversations(prev => prev.filter(c => c.id !== conversationId));
            } catch (error) {
                console.error('Error deleting conversation:', error);
                alert('Failed to delete conversation. Please try again.');
            }
        };

        const formatTime = (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(timestamp);

            const filteredConversations = conversations.filter(conv =>
                conv.otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conv.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (!user) {
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6">
                        <MessageCircle size={64} className="text-gray-300 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view messages</h2>
                        <p className="text-gray-500 text-center">Log in to start chatting with property owners</p>
                    </div>
                );
            }

            return (
                <div className="flex flex-col h-screen bg-gray-50 pb-20">
                    {/* Header */}
                    <div className="bg-white border-b sticky top-0 z-10">
                        <div className="p-4">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
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
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="p-4 flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                {conv.otherUser?.avatar_url ? (
                                                    <img
                                                        src={conv.otherUser.avatar_url}
                                                        alt={conv.otherUser.full_name}
                                                        className="w-14 h-14 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {conv.otherUser?.full_name?.[0] || '?'}
                                                    </div>
                                                )}
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
                                                    📍 {conv.listing?.title || 'Property'}
                                                </p>

                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => handleDeleteConversation(e, conv.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Delete conversation"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Modal */}
                    {
                        selectedConversation && (
                            <ChatModal
                                isOpen={!!selectedConversation}
                                onClose={() => {
                                    setSelectedConversation(null);
                                    fetchConversations(); // Refresh list when closing
                                }}
                                listing={{
                                    ...selectedConversation.listing,
                                    user_id: selectedConversation.participant_1_id === user.id
                                        ? selectedConversation.participant_2_id
                                        : selectedConversation.participant_1_id,
                                    profiles: selectedConversation.otherUser
                                }}
                            />
                        )
                    }
                </div >
            );
        }