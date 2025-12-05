import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, ArrowLeft, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ChatModal({ isOpen, onClose, listing, sellerId }) {
    const { user } = useAuth();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sellerProfile, setSellerProfile] = useState(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize conversation and listen for real-time updates
    useEffect(() => {
        if (!isOpen || !user || !listing) return;

        initializeChat();

        // 🔥 REAL-TIME SUBSCRIPTION (FREE!)
        // This listens for new messages instantly
        const channel = supabase
            .channel(`chat-${conversation?.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversation?.id}`
                },
                (payload) => {
                    console.log('💬 New message received:', payload);
                    setMessages(prev => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, user, listing, conversation?.id]);

    const initializeChat = async () => {
        try {
            setLoading(true);

            // Fetch seller profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', sellerId)
                .single();
            setSellerProfile(profile);

            // Get or create conversation
            let { data: existingConv } = await supabase
                .from('conversations')
                .select('*')
                .eq('listing_id', listing.id)
                .eq('buyer_id', user.id)
                .single();

            if (!existingConv) {
                // Create new conversation
                const { data: newConv, error } = await supabase
                    .from('conversations')
                    .insert({
                        listing_id: listing.id,
                        buyer_id: user.id,
                        seller_id: sellerId
                    })
                    .select()
                    .single();

                if (error) throw error;
                existingConv = newConv;
            }

            setConversation(existingConv);

            // Load existing messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', existingConv.id)
                .order('created_at', { ascending: true });

            setMessages(msgs || []);

            // Mark messages as read
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', existingConv.id)
                .neq('sender_id', user.id);

        } catch (error) {
            console.error('Error initializing chat:', error);
        } finally {
            setLoading(false);
        }
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

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                            {sellerProfile?.full_name?.[0] || 'S'}
                        </div>
                        <div>
                            <h3 className="font-semibold">{sellerProfile?.full_name || 'Seller'}</h3>
                            <p className="text-xs text-white/80">{listing?.title}</p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-white/20 rounded-full transition">
                        <Phone size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs">Start the conversation!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === user.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                                    ? 'bg-sky-500 text-white rounded-br-sm'
                                                    : 'bg-white text-gray-800 rounded-bl-sm shadow'
                                                }`}
                                        >
                                            <p className="text-sm break-words">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${isMe ? 'text-sky-100' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-sky-500"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="px-6 py-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
