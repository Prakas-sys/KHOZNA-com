import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Smile, Edit2, Trash2, Search, Volume2, VolumeX, Check, CheckCheck, Reply, Download, ChevronLeft } from 'lucide-react';
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
    const [replyingTo, setReplyingTo] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef(null);

    // Determine effective sellerId
    const effectiveSellerId = sellerId || (conversation ? (conversation.buyer_id === user?.id ? conversation.seller_id : conversation.buyer_id) : null);

    // Get seller's online status
    const sellerStatus = getUserStatus(effectiveSellerId);
    const sellerOnline = isUserOnline(effectiveSellerId);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Play notification sound
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

    // Format timestamp
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

    // Fetch seller profile data
    const fetchSellerProfile = async () => {
        if (!effectiveSellerId) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, phone')
                .eq('id', effectiveSellerId)
                .single();

            if (error) throw error;
            setSellerProfile(data);
        } catch (error) {
            console.error('Error fetching seller profile:', error);
        }
    };

    // Get or create conversation
    const initializeChat = async () => {
        if (!user || !isOpen) return;

        try {
            setLoading(true);
            let existingConv = null;

            if (listing) {
                // Check existing conversation
                let { data: conv, error: convError } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('listing_id', listing.id)
                    .eq('buyer_id', user.id)
                    .single();

                if (convError && convError.code !== 'PGRST116') throw convError;
                existingConv = conv;

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
            }

            setConversation(existingConv);

            if (existingConv) {
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
            }

        } catch (error) {
            console.error('Error initializing chat:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            initializeChat();
            fetchSellerProfile();
        }
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
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation, user]);

    // Send message
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !replyingTo) || !conversation) return;

        try {
            setSending(true);

            const messageData = {
                conversation_id: conversation.id,
                sender_id: user.id,
                content: editingMessage ? newMessage.trim() : newMessage.trim(),
                reply_to_id: replyingTo?.id || null
            };

            if (editingMessage) {
                // Update existing message
                const { error } = await supabase
                    .from('messages')
                    .update({
                        content: newMessage.trim(),
                        edited_at: new Date().toISOString()
                    })
                    .eq('id', editingMessage.id);

                if (error) throw error;
                setEditingMessage(null);

                // Update local state
                setMessages(prev => prev.map(m =>
                    m.id === editingMessage.id ? { ...m, content: newMessage.trim(), edited_at: new Date().toISOString() } : m
                ));
            } else {
                // Insert new message
                const { error } = await supabase
                    .from('messages')
                    .insert(messageData);

                if (error) throw error;
            }

            setNewMessage('');
            setReplyingTo(null);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // File upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !conversation) return;

        try {
            setUploadingFile(true);

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `chat-attachments/${conversation.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath);

            // Send message with attachment
            await supabase
                .from('messages')
                .insert({
                    conversation_id: conversation.id,
                    sender_id: user.id,
                    content: file.type.startsWith('image/') ? '' : file.name,
                    attachment_url: publicUrl,
                    attachment_type: file.type,
                    attachment_name: file.name
                });

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        } finally {
            setUploadingFile(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md h-[600px] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-white px-4 py-3 border-b flex items-center justify-between shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                                {sellerProfile?.full_name?.[0] || 'S'}
                            </div>
                            <div className="absolute -bottom-1 -right-1">
                                <OnlineStatus
                                    isOnline={sellerOnline}
                                    lastSeen={sellerStatus.lastSeen}
                                    size="sm"
                                />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {sellerProfile?.full_name || 'Seller'}
                                <span className="text-[10px] text-gray-400 ml-2 font-mono">({sellerId})</span>
                            </h3>
                            <p className="text-xs text-gray-500">
                                {sellerOnline ? (
                                    <span className="text-green-600 font-medium">● Online</span>
                                ) : (
                                    <span>{getLastSeenText(effectiveSellerId)}</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <Search size={20} className="text-gray-600" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Send size={48} className="mb-2" />
                            <p>No messages yet. Say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = msg.sender_id === user.id;
                            return (
                                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isOwn
                                        ? 'bg-sky-500 text-white rounded-tr-none'
                                        : 'bg-white text-gray-900 rounded-tl-none border border-gray-100 shadow-sm'
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                        <span className={`text-[10px] mt-1 block text-right ${isOwn ? 'text-sky-100' : 'text-gray-400'}`}>
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-full outline-none focus:ring-2 focus:ring-sky-500"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-200"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}