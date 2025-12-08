import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Smile, MoreVertical, Edit2, Trash2, Search, Volume2, VolumeX, Check, CheckCheck, Reply, Download, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ChatView({ listing, sellerId, initialConversation, onBack }) {
    const { user } = useAuth();
    const [sellerProfile, setSellerProfile] = useState(null);
    const [conversation, setConversation] = useState(initialConversation || null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);

    // Determine effective sellerId
    const effectiveSellerId = sellerId || (conversation ?
        (conversation.participant_1_id === user?.id ? conversation.participant_2_id : conversation.participant_1_id)
        : null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        if (!user) return;

        try {
            setLoading(true);
            let currentConv = conversation;

            if (!currentConv) {
                if (!listing) return;

                // SIMPLIFIED QUERY TO FIX 400 ERROR
                // 1. Fetch all conversations for this listing involved with this user
                // 2. Filter in JS to find the specific pair
                const { data: potentialConvs, error: preciseError } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('listing_id', listing.id)
                    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);

                if (preciseError) throw preciseError;

                let existingConv = null;
                if (potentialConvs && potentialConvs.length > 0) {
                    existingConv = potentialConvs.find(c =>
                        (c.participant_1_id === user.id && c.participant_2_id === effectiveSellerId) ||
                        (c.participant_1_id === effectiveSellerId && c.participant_2_id === user.id)
                    );
                }

                if (!existingConv) {
                    // Create new conversation
                    console.log('Creating new conversation for', { user: user.id, seller: effectiveSellerId, listing: listing.id });

                    const { data: newConv, error: createError } = await supabase
                        .from('conversations')
                        .insert({
                            listing_id: listing.id,
                            participant_1_id: user.id,
                            participant_2_id: effectiveSellerId
                        })
                        .select()
                        .single();

                    if (createError) throw createError;
                    existingConv = newConv;
                }
                currentConv = existingConv;
                setConversation(currentConv);
            }

            // Fetch messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', currentConv.id)
                .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;

            setMessages(messagesData || []);

        } catch (error) {
            console.error('Chat init error:', error);
            alert('Could not load chat. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            initializeChat();
        }
    }, [user, listing, initialConversation]);

    // Mark as read when messages are loaded
    useEffect(() => {
        const markAsRead = async () => {
            if (!messages.length || !user || !conversation) return;

            const unreadIds = messages
                .filter(m => !m.is_read && m.sender_id !== user.id)
                .map(m => m.id);

            if (unreadIds.length > 0) {
                await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .in('id', unreadIds);
            }
        };

        markAsRead();
    }, [messages, user, conversation]);

    useEffect(() => {
        if (effectiveSellerId) {
            fetchSellerProfile();
        }
    }, [effectiveSellerId, initialConversation]);

    // REALTIME SUBSCRIPTIONS
    useEffect(() => {
        if (!conversation) return;

        const channel = supabase.channel(`chat-${conversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, async (payload) => {
                console.log('💬 New message:', payload);

                const { data } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('id', payload.new.id)
                    .single();

                setMessages(prev => [...prev, data]);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, async (payload) => {
                const { data } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('id', payload.new.id)
                    .single();

                setMessages(prev => prev.map(m =>
                    m.id === data.id ? data : m
                ));
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [conversation, user]);

    // Send message
    const handleSendMessage = async (e) => {
        e?.preventDefault();

        if (!user) {
            alert("Please log in to send a message.");
            return;
        }

        if (!newMessage.trim()) return;

        if (!conversation) {
            console.error("No conversation initialized. User:", user?.id, "Listing:", listing?.id);
            alert("Chat not ready yet. Please wait or reload.");
            // Try initializing again?
            initializeChat();
            return;
        }

        console.log('Attempting to send message...', { conversationId: conversation.id, userId: user.id });

        try {
            setSending(true);
            const content = newMessage.trim(); // Capture before clearing

            // Optimistic Update: Show message immediately
            const processingId = 'temp-' + Date.now();
            const tempMsg = {
                id: processingId,
                conversation_id: conversation.id,
                sender_id: user.id,
                content: content,
                reply_to_id: replyingTo?.id || null,
                created_at: new Date().toISOString(),
                is_read: false
            };

            // Add temp message to UI immediately
            setMessages(prev => [...prev, tempMsg]);
            setNewMessage(''); // Clear input immediately
            setReplyingTo(null);

            if (editingMessage) {
                // Update existing message
                const { error } = await supabase
                    .from('messages')
                    .update({
                        content: content,
                        edited_at: new Date().toISOString()
                    })
                    .eq('id', editingMessage.id);

                if (error) throw error;
                setEditingMessage(null);
            } else {
                // Insert new message
                const { data, error } = await supabase
                    .from('messages')
                    .insert({
                        conversation_id: conversation.id,
                        sender_id: user.id,
                        content: content,
                        reply_to_id: replyingTo?.id || null
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Replace temp message with real one (if needed, but Realtime subscription usually handles this)
                // We map to replace ID if the content matches, or just let Realtime dedupe handled by useEffect
                // Actually, simplest is to let Realtime add the "verified" one. 
                // But since we have the data, we can swap it in to be safe against Realtime lag.
                setMessages(prev => prev.map(m => m.id === processingId ? data : m));
            }

            console.log('✅ Message sent successfully');

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
            // Revert optimistic update? For now keep it simple.
            // setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
        } finally {
            setSending(false);
        }
    };

    // Delete message
    const handleDeleteMessage = async (messageId) => {
        if (!confirm('Delete this message?')) return;

        try {
            await supabase
                .from('messages')
                .delete()
                .eq('id', messageId);
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                        {sellerProfile?.full_name?.[0] || 'S'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {sellerProfile?.full_name || 'Seller'}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {listing?.title || 'Property Chat'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Send size={48} className="mb-2" />
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender_id === user.id;

                        return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] flex flex-col gap-1`}>
                                    {/* Reply indicator */}
                                    {msg.reply_to_id && (
                                        <div className="text-xs text-gray-500 italic px-3">
                                            <Reply size={12} className="inline mr-1" />
                                            Replying to message
                                        </div>
                                    )}

                                    <div className="relative group">
                                        {/* Message bubble */}
                                        <div
                                            className={`px-4 py-2 rounded-2xl ${isOwn
                                                ? 'bg-sky-500 text-white rounded-tr-none'
                                                : 'bg-white text-gray-900 rounded-tl-none border border-gray-100 shadow-sm'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            {msg.edited_at && (
                                                <span className="text-xs opacity-70 block mt-1">(edited)</span>
                                            )}

                                            {/* Timestamp */}
                                            <span className={`text-[10px] mt-1 block text-right ${isOwn ? 'text-sky-100' : 'text-gray-400'}`}>
                                                {formatTime(msg.created_at)}
                                                {isOwn && (
                                                    msg.is_read ? (
                                                        <CheckCheck size={12} className="inline ml-1 text-sky-200" />
                                                    ) : (
                                                        <Check size={12} className="inline ml-1" />
                                                    )
                                                )}
                                            </span>
                                        </div>

                                        {/* Message actions */}
                                        <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} top-0 -translate-x-full group-hover:opacity-100 opacity-0 transition-opacity flex gap-1 px-2`}>
                                            {isOwn && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditingMessage(msg);
                                                            setNewMessage(msg.content);
                                                        }}
                                                        className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                                    >
                                                        <Edit2 size={14} className="text-gray-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                                    >
                                                        <Trash2 size={14} className="text-red-500" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setReplyingTo(msg)}
                                                className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                            >
                                                <Reply size={14} className="text-gray-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Reply indicator */}
            {replyingTo && (
                <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        <Reply size={14} className="inline mr-1" />
                        Replying to: {replyingTo.content?.substring(0, 50)}...
                    </div>
                    <button onClick={() => setReplyingTo(null)}>
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>
            )}

            {/* Edit indicator */}
            {editingMessage && (
                <div className="px-4 py-2 bg-yellow-50 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        <Edit2 size={14} className="inline mr-1" />
                        Editing message
                    </div>
                    <button onClick={() => { setEditingMessage(null); setNewMessage(''); }}>
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-full outline-none focus:ring-2 focus:ring-sky-500"
                    disabled={sending}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-200"
                >
                    {sending ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>
        </div>
    );
}