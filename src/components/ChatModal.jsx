import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Smile, MoreVertical, Edit2, Trash2, Search, Volume2, VolumeX, Check, CheckCheck, Reply, Download, Image as ImageIcon } from 'lucide-react';
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

    // Premium Features State
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showReactions, setShowReactions] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
    const reactionMap = { '👍': 'like', '❤️': 'love', '😂': 'laugh', '😮': 'wow', '😢': 'sad', '😡': 'angry' };

    // Get seller's online status
    const sellerStatus = getUserStatus(sellerId);
    const sellerOnline = isUserOnline(sellerId);

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

    // Get or create conversation
    const initializeChat = async () => {
        if (!user || !listing) return;
        // Fetch seller profile data
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
        try {
            setLoading(true);

            // Check existing conversation
            let { data: existingConv, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('listing_id', listing.id)
                .eq('buyer_id', user.id)
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

            // Fetch messages with reactions
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select(`
                    *,
                    message_reactions (
                        id,
                        reaction,
                        user_id,
                        created_at
                    )
                `)
                .eq('conversation_id', existingConv.id)
                .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;

            setMessages(messagesData || []);

            // Mark messages as read
            await supabase.rpc('mark_messages_as_read', {
                conversation_uuid: existingConv.id
            });

            // Get unread count
            const { data: count } = await supabase.rpc('get_unread_count', {
                conversation_uuid: existingConv.id
            });
            setUnreadCount(count || 0);

        } catch (error) {
            console.error('Error initializing chat:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !user || !listing) return;

        initializeChat();
    }, [isOpen, user, listing]);

    useEffect(() => {
        if (isOpen && sellerId) {
            fetchSellerProfile();
        }
    }, [isOpen, sellerId]);

    // 🔥 REALTIME SUBSCRIPTIONS
    useEffect(() => {
        if (!conversation) return;

        const channel = supabase.channel(`chat-${conversation.id}`);

        // Subscribe to new messages
        channel
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, async (payload) => {
                console.log('💬 New message:', payload);

                // Fetch message with reactions
                const { data } = await supabase
                    .from('messages')
                    .select(`*, message_reactions (*)`)
                    .eq('id', payload.new.id)
                    .single();

                setMessages(prev => [...prev, data]);

                // Play sound if from other user
                if (payload.new.sender_id !== user.id) {
                    playNotificationSound();
                }
            })
            // Subscribe to message updates (edits/deletes)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversation.id}`
            }, async (payload) => {
                const { data } = await supabase
                    .from('messages')
                    .select(`*, message_reactions (*)`)
                    .eq('id', payload.new.id)
                    .single();

                setMessages(prev => prev.map(m =>
                    m.id === data.id ? data : m
                ));
            })
            // Subscribe to reactions
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'message_reactions'
            }, async (payload) => {
                // Refresh message reactions
                const messageId = payload.new?.message_id || payload.old?.message_id;
                if (!messageId) return;

                const { data } = await supabase
                    .from('messages')
                    .select(`*, message_reactions (*)`)
                    .eq('id', messageId)
                    .single();

                setMessages(prev => prev.map(m =>
                    m.id === data.id ? data : m
                ));
            })
            // Subscribe to typing indicators
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.userId !== user.id) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 3000);
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [conversation, user, sellerId, soundEnabled]);

    // Handle typing indicator broadcast
    const handleTyping = () => {
        if (!conversation) return;

        const channel = supabase.channel(`chat-${conversation.id}`);
        channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id }
        });

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            // Typing stopped
        }, 1000);
    };

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

    // Add reaction
    const handleAddReaction = async (messageId, emoji) => {
        try {
            const reactionType = reactionMap[emoji];

            // Check if already reacted
            const message = messages.find(m => m.id === messageId);
            const existingReaction = message.message_reactions?.find(
                r => r.user_id === user.id && r.reaction === reactionType
            );

            if (existingReaction) {
                // Remove reaction
                await supabase
                    .from('message_reactions')
                    .delete()
                    .eq('id', existingReaction.id);
            } else {
                // Add reaction
                await supabase
                    .from('message_reactions')
                    .insert({
                        message_id: messageId,
                        user_id: user.id,
                        reaction: reactionType
                    });
            }

            setShowReactions(null);
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    // Delete message
    const handleDeleteMessage = async (messageId) => {
        if (!confirm('Delete this message?')) return;

        try {
            await supabase
                .from('messages')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString()
                })
                .eq('id', messageId);
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    // File upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

    // Filtered messages for search
    const filteredMessages = searchQuery
        ? messages.filter(m =>
            m.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : messages;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                                {sellerProfile?.full_name?.[0] || listing?.profiles?.full_name?.[0] || 'S'}
                            </div>
                            {/* Online Status Indicator using our component */}
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
                                {sellerProfile?.full_name || listing?.profiles?.full_name || 'Seller'}
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
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <Search size={20} className="text-gray-600" />
                        </button>
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            {soundEnabled ? (
                                <Volume2 size={20} className="text-gray-600" />
                            ) : (
                                <VolumeX size={20} className="text-gray-400" />
                            )}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
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
                            <p>{searchQuery ? 'No messages found' : 'No messages yet. Start the conversation!'}</p>
                        </div>
                    ) : (
                        filteredMessages.map((msg) => {
                            const isOwn = msg.sender_id === user.id;
                            const isDeleted = msg.is_deleted;

                            return (
                                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
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
                                                    : 'bg-gray-200 text-gray-900 rounded-tl-none'
                                                    } ${isDeleted ? 'italic opacity-60' : ''}`}
                                            >
                                                {isDeleted ? (
                                                    <span className="text-sm">This message was deleted</span>
                                                ) : (
                                                    <>
                                                        {/* Image attachment */}
                                                        {msg.attachment_url && msg.attachment_type?.startsWith('image/') && (
                                                            <img
                                                                src={msg.attachment_url}
                                                                alt={msg.attachment_name}
                                                                className="rounded-lg mb-2 max-w-full"
                                                            />
                                                        )}
                                                        {/* File attachment */}
                                                        {msg.attachment_url && !msg.attachment_type?.startsWith('image/') && (
                                                            <a
                                                                href={msg.attachment_url}
                                                                download
                                                                className="flex items-center gap-2 p-2 bg-white/10 rounded-lg mb-2"
                                                            >
                                                                <Paperclip size={16} />
                                                                <span className="text-sm">{msg.attachment_name}</span>
                                                                <Download size={14} />
                                                            </a>
                                                        )}
                                                        <p className="text-sm">{msg.content}</p>
                                                        {msg.edited_at && (
                                                            <span className="text-xs opacity-70">(edited)</span>
                                                        )}
                                                    </>
                                                )}

                                                {/* Timestamp & Read status */}
                                                <span className={`text-xs mt-1 block ${isOwn ? 'text-sky-100' : 'text-gray-500'}`}>
                                                    {formatTime(msg.created_at)}
                                                    {isOwn && (
                                                        msg.read_at ? (
                                                            <CheckCheck size={12} className="inline ml-1 text-blue-300" />
                                                        ) : (
                                                            <Check size={12} className="inline ml-1" />
                                                        )
                                                    )}
                                                </span>
                                            </div>

                                            {/* Message actions */}
                                            {!isDeleted && (
                                                <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} top-0 -translate-x-full group-hover:opacity-100 opacity-0 transition-opacity flex gap-1`}>
                                                    <button
                                                        onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                                                        className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                                    >
                                                        <Smile size={16} className="text-gray-600" />
                                                    </button>
                                                    {isOwn && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMessage(msg);
                                                                    setNewMessage(msg.content);
                                                                }}
                                                                className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                                            >
                                                                <Edit2 size={16} className="text-gray-600" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMessage(msg.id)}
                                                                className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                                            >
                                                                <Trash2 size={16} className="text-red-500" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => setReplyingTo(msg)}
                                                        className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                                                    >
                                                        <Reply size={16} className="text-gray-600" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Reaction picker */}
                                            {showReactions === msg.id && (
                                                <div className="absolute bottom-full mb-2 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-10">
                                                    {reactions.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleAddReaction(msg.id, emoji)}
                                                            className="text-xl hover:scale-125 transition-transform"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Reactions display */}
                                        {msg.message_reactions && msg.message_reactions.length > 0 && (
                                            <div className="flex gap-1 flex-wrap px-2">
                                                {Object.entries(
                                                    msg.message_reactions.reduce((acc, r) => {
                                                        const emoji = Object.keys(reactionMap).find(k => reactionMap[k] === r.reaction);
                                                        if (!acc[emoji]) acc[emoji] = [];
                                                        acc[emoji].push(r);
                                                        return acc;
                                                    }, {})
                                                ).map(([emoji, reactions]) => (
                                                    <div
                                                        key={emoji}
                                                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                                                    >
                                                        <span>{emoji}</span>
                                                        <span className="font-medium">{reactions.length}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span>Typing...</span>
                        </div>
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
                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
                    >
                        {uploadingFile ? (
                            <div className="animate-spin w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full"></div>
                        ) : (
                            <Paperclip size={20} className="text-gray-600" />
                        )}
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full outline-none focus:border-sky-500"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || (!newMessage.trim() && !editingMessage)}
                        className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}