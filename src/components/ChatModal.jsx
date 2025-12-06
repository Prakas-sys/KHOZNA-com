import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Edit2, Trash2, Search, Volume2, VolumeX, Check, CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useUserPresence } from '../hooks/useUserPresence';
import OnlineStatus from './OnlineStatus';

export default function ChatModal({ isOpen, onClose, listing, sellerId }) {
    const { user } = useAuth();
    const { isUserOnline, getLastSeenText, getUserStatus } = useUserPresence(user?.id);
    const [sellerProfile, setSellerProfile] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [editingMessage, setEditingMessage] = useState(null);

    const sellerStatus = getUserStatus(sellerId);
    const sellerOnline = isUserOnline(sellerId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const playNotificationSound = () => {
        if (!soundEnabled) return;
        try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { });
        } catch (error) {
            console.log('Could not play sound');
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const fetchSellerProfile = async () => {
        if (!sellerId) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, phone')
                .eq('id', sellerId)
                .single();
            if (error) throw error;
            setSellerProfile(data);
        } catch (error) {
            console.error('Error fetching seller profile:', error);
        }
    };

    const initializeChat = async () => {
        if (!user || !listing) return;

        try {
            setLoading(true);

            // Check existing conversation
            let { data: existingConv, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('listing_id', listing.id)
                .eq('buyer_id', user.id)
                .eq('seller_id', sellerId)
                .single();

            if (convError && convError.code !== 'PGRST116') throw convError;

            if (!existingConv) {
                // Create new conversation
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        listing_id: listing.id,
                        buyer_id: user.id,
                        seller_id: sellerId
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                existingConv = newConv;
            }

            setConversation(existingConv);

            // Fetch messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', existingConv.id)
                .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;
            setMessages(messagesData || []);

            // Mark as read
            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('conversation_id', existingConv.id)
                .is('read_at', null)
                .neq('sender_id', user.id);

        } catch (error) {
            console.error('Error initializing chat:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !user || !listing) return;
        initializeChat();
        fetchSellerProfile();
    }, [isOpen, user, listing, sellerId]);

    // Realtime subscription
    useEffect(() => {
        if (!conversation) return;

        const channel = supabase
            .channel(`chat-${conversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
                if (payload.new.sender_id !== user.id) {
                    playNotificationSound();
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, (payload) => {
                setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation, user, soundEnabled]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !conversation) return;

        try {
            setSending(true);

            if (editingMessage) {
                await supabase
                    .from('messages')
                    .update({ content: newMessage.trim() })
                    .eq('id', editingMessage.id);
                setEditingMessage(null);
            } else {
                await supabase
                    .from('messages')
                    .insert({
                        conversation_id: conversation.id,
                        sender_id: user.id,
                        content: newMessage.trim()
                    });

                // Update conversation timestamp
                await supabase
                    .from('conversations')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', conversation.id);
            }

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm('Delete this message?')) return;
        try {
            await supabase.from('messages').delete().eq('id', messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const filteredMessages = searchQuery
        ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold">
                                {sellerProfile?.full_name?.[0] || listing?.profiles?.full_name?.[0] || 'S'}
                            </div>
                            <div className="absolute -bottom-1 -right-1">
                                <OnlineStatus isOnline={sellerOnline} lastSeen={sellerStatus.lastSeen} size="sm" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {sellerProfile?.full_name || listing?.profiles?.full_name || 'Property Owner'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {sellerOnline ? (
                                    <span className="text-green-600 font-medium">● Online</span>
                                ) : (
                                    <span>{getLastSeenText(sellerId)}</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowSearch(!showSearch)} className="p-2 hover:bg-gray-100 rounded-full">
                            <Search size={20} className="text-gray-600" />
                        </button>
                        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 hover:bg-gray-100 rounded-full">
                            {soundEnabled ? <Volume2 size={20} className="text-gray-600" /> : <VolumeX size={20} className="text-gray-400" />}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                {showSearch && (
                    <div className="p-3 border-b">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="w-full px-4 py-2 border rounded-lg outline-none focus:border-sky-500"
                        />
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Send size={48} className="mb-2" />
                            <p>{searchQuery ? 'No messages found' : 'Start the conversation!'}</p>
                        </div>
                    ) : (
                        filteredMessages.map((msg) => {
                            const isOwn = msg.sender_id === user.id;
                            return (
                                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] flex flex-col gap-1`}>
                                        <div className="relative group">
                                            <div className={`px-4 py-2 rounded-2xl ${isOwn ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-tr-none' : 'bg-gray-200 text-gray-900 rounded-tl-none'}`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <span className={`text-xs mt-1 block ${isOwn ? 'text-sky-100' : 'text-gray-500'}`}>
                                                    {formatTime(msg.created_at)}
                                                    {isOwn && (msg.read_at ? <CheckCheck size={12} className="inline ml-1" /> : <Check size={12} className="inline ml-1" />)}
                                                </span>
                                            </div>

                                            {isOwn && (
                                                <div className="absolute left-0 top-0 -translate-x-full group-hover:opacity-100 opacity-0 transition-opacity flex gap-1">
                                                    <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); }} className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100">
                                                        <Edit2 size={16} className="text-gray-600" />
                                                    </button>
                                                    <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100">
                                                        <Trash2 size={16} className="text-red-500" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {editingMessage && (
                    <div className="px-4 py-2 bg-yellow-50 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <Edit2 size={14} className="inline mr-1" />Editing message
                        </div>
                        <button onClick={() => { setEditingMessage(null); setNewMessage(''); }}>
                            <X size={16} className="text-gray-500" />
                        </button>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="p-3 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}