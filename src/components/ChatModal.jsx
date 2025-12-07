
export default function ChatModal({ isOpen, onClose, listing }) {
    console.log('🟢 ChatModal rendered', { isOpen, listing });

    const { user } = useAuth(); import React, { useState, useEffect, useRef } from 'react';
    import { X, Send, Check, CheckCheck } from 'lucide-react';
    import { supabase } from '../lib/supabase';
    import { useAuth } from '../contexts/AuthContext';

    export default function ChatModal({ isOpen, onClose, listing }) {
        const { user } = useAuth();
        const [conversation, setConversation] = useState(null);
        const [messages, setMessages] = useState([]);
        const [newMessage, setNewMessage] = useState('');
        const [otherUser, setOtherUser] = useState(null);
        const [loading, setLoading] = useState(true);
        const [sending, setSending] = useState(false);
        const messagesEndRef = useRef(null);

        // Auto-scroll to bottom
        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        };

        useEffect(() => {
            scrollToBottom();
        }, [messages]);

        // Initialize chat
        useEffect(() => {
            if (!isOpen || !user || !listing) return;
            initializeChat();
        }, [isOpen, user, listing]);

        // Real-time subscription
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
                        markAsRead();
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }, [conversation, user]);

        const initializeChat = async () => {
            console.log('🔵 initializeChat START', { user, listing });
            try {
                setLoading(true);

                // Determine participants
                console.log('🔵 Participants:', { propertyOwnerId, currentUserId: user.id });
                const currentUserId = user.id;

                // Property owner is always participant_1
                const participant1 = propertyOwnerId;
                const participant2 = currentUserId;

                // Get or create conversation
                let { data: existingConv, error: convError } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('listing_id', listing.id)
                    .or(`and(participant_1_id.eq.${participant1},participant_2_id.eq.${participant2}),and(participant_1_id.eq.${participant2},participant_2_id.eq.${participant1})`)
                    .single();

                if (convError && convError.code !== 'PGRST116') throw convError;

                if (!existingConv) {
                    // Create new conversation
                    const { data: newConv, error: createError } = await supabase
                        .from('conversations')
                        .insert({
                            listing_id: listing.id,
                            participant_1_id: participant1,
                            participant_2_id: participant2
                        })
                        .select()
                        .single();

                    if (createError) throw createError;
                    existingConv = newConv;
                }

                setConversation(existingConv);

                // Get messages
                const { data: messagesData, error: messagesError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', existingConv.id)
                    .order('created_at', { ascending: true });

                if (messagesError) throw messagesError;
                setMessages(messagesData || []);

                // Get other user's profile
                const otherUserId = existingConv.participant_1_id === user.id
                    ? existingConv.participant_2_id
                    : existingConv.participant_1_id;

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .eq('id', otherUserId)
                    .single();

                setOtherUser(profileData);

                // Mark as read
                await markAsRead();

            } catch (error) {
                console.error('Error initializing chat:', error);
            } finally {
                setLoading(false);
            }
        };

        const markAsRead = async () => {
            if (!conversation || !user) return;
            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('conversation_id', conversation.id)
                .neq('sender_id', user.id)
                .is('read_at', null);
        };

        const handleSendMessage = async (e) => {
            e.preventDefault();
            if (!newMessage.trim() || !conversation) return;

            try {
                setSending(true);

                const { error } = await supabase
                    .from('messages')
                    .insert({
                        conversation_id: conversation.id,
                        sender_id: user.id,
                        content: newMessage.trim()
                    });

                if (error) throw error;

                // Update conversation timestamp
                await supabase
                    .from('conversations')
                    .update({ last_message_at: new Date().toISOString() })
                    .eq('id', conversation.id);

                setNewMessage('');
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Failed to send message');
            } finally {
                setSending(false);
            }
        };

        const formatTime = (timestamp) => {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);

            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            return date.toLocaleDateString();
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold">
                                {otherUser?.full_name?.[0] || listing.profiles?.full_name?.[0] || 'U'}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    {otherUser?.full_name || listing.profiles?.full_name || 'User'}
                                </h3>
                                <p className="text-xs text-gray-500">{listing.title}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X size={20} />
                        </button>
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
                                <p>Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isOwn = msg.sender_id === user.id;
                                return (
                                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] flex flex-col gap-1`}>
                                            <div className={`px-4 py-2 rounded-2xl ${isOwn
                                                ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-tr-none'
                                                : 'bg-gray-200 text-gray-900 rounded-tl-none'
                                                }`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <span className={`text-xs mt-1 block ${isOwn ? 'text-sky-100' : 'text-gray-500'}`}>
                                                    {formatTime(msg.created_at)}
                                                    {isOwn && (
                                                        msg.read_at
                                                            ? <CheckCheck size={12} className="inline ml-1" />
                                                            : <Check size={12} className="inline ml-1" />
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

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
                            className="p-3 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        );
    }