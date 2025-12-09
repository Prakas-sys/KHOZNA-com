import React, { useState, useEffect, useRef } from "react";
import { X, Send, Check, CheckCheck, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function ChatModal({ isOpen, onClose, listing }) {
    const { user } = useAuth();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [otherUser, setOtherUser] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!isOpen || !user || !listing) return;
        initializeChat();
    }, [isOpen]);

    useEffect(() => {
        if (!conversation) return;

        const channel = supabase
            .channel("chat-" + conversation.id)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversation.id}`,
                },
                (payload) => {
                    // Prevent duplicates
                    setMessages((prev) => {
                        const exists = prev.some(m => m.id === payload.new.id);
                        if (exists) return prev;
                        return [...prev, payload.new];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversation]);

    const initializeChat = async () => {
        try {
            setLoading(true);

            const ownerId = listing?.user_id;
            const currentUserId = user?.id;

            console.log("🚀 InitChat Starting:", {
                listingId: listing?.id,
                ownerId,
                currentUserId,
                listingObj: listing
            });

            if (!listing) {
                throw new Error("Listing data is missing completely.");
            }

            if (!ownerId || !currentUserId) {
                console.error("Missing user IDs", { ownerId, currentUserId });
                alert(`Cannot start chat. Missing Info: Owner=${ownerId}, You=${currentUserId}`);
                return;
            }

            // STEP 1: Find or create conversation
            // SIMPLIFIED QUERY TO FIX 400 ERROR
            const { data: potentialConvs, error: preciseError } = await supabase
                .from('conversations')
                .select('*')
                .eq('listing_id', listing.id)
                .or(`participant_1_id.eq.${currentUserId},participant_2_id.eq.${currentUserId}`);

            if (preciseError) throw preciseError;

            let conv = null;
            if (potentialConvs && potentialConvs.length > 0) {
                conv = potentialConvs.find(c =>
                    (c.participant_1_id === currentUserId && c.participant_2_id === ownerId) ||
                    (c.participant_1_id === ownerId && c.participant_2_id === currentUserId)
                );
            }

            if (!conv) {
                const { data: newConv, error } = await supabase
                    .from("conversations")
                    .insert({
                        listing_id: listing.id,
                        participant_1_id: ownerId,
                        participant_2_id: currentUserId,
                    })
                    .select()
                    .single();

                if (error) throw error;
                conv = newConv;
            }

            setConversation(conv);

            // STEP 2: Load messages
            const { data: msgs } = await supabase
                .from("messages")
                .select("*")
                .eq("conversation_id", conv.id)
                .order("created_at", { ascending: true });

            setMessages(msgs || []);

            // STEP 3: Load other user's profile
            const otherId =
                conv.participant_1_id === currentUserId
                    ? conv.participant_2_id
                    : conv.participant_1_id;

            const { data: profile } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url")
                .eq("id", otherId)
                .single();

            setOtherUser(profile);

        } catch (err) {
            console.error("Chat init CRITICAL ERROR:", err);
            // SHOW THE REAL ERROR TO THE USER
            alert(`Debug Error: ${err.message || JSON.stringify(err)}`);
        } finally {
            setLoading(false);
        }
    };

    // Mark as read when messages load
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

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!user) {
            alert("Please log in to chat.");
            return;
        }

        if (!newMessage.trim()) return;

        if (!conversation) {
            alert("Chat loading... please wait.");
            initializeChat();
            return;
        }

        try {
            setSending(true);
            const content = newMessage.trim();

            // Optimistic Update
            const processingId = 'temp-' + Date.now();
            const tempMsg = {
                id: processingId,
                conversation_id: conversation.id,
                sender_id: user.id,
                content: content,
                created_at: new Date().toISOString(),
                is_read: false
            };

            setMessages(prev => [...prev, tempMsg]);
            setNewMessage("");

            const { data, error } = await supabase.from("messages").insert({
                conversation_id: conversation.id,
                sender_id: user.id,
                content: content,
            }).select().single();

            if (error) throw error;

            // Replace temp with real
            setMessages(prev => prev.map(m => m.id === processingId ? data : m));

            await supabase
                .from("conversations")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", conversation.id);

        } catch (err) {
            console.error("Send error:", err);
            alert("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Delete this message?")) return;

        // Optimistic remove
        setMessages(prev => prev.filter(m => m.id !== messageId));

        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete message");
            initializeChat(); // Revert on failure
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `chat_uploads/${conversation.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-uploads')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-uploads')
                .getPublicUrl(filePath);

            // Send message with image
            const { error: msgError } = await supabase.from('messages').insert({
                conversation_id: conversation.id,
                sender_id: user.id,
                content: '📷 Image',
                file_url: publicUrl,
                file_type: 'image'
            });

            if (msgError) throw msgError;

        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image. Make sure 'chat-uploads' bucket exists.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold">
                            {(otherUser?.full_name?.[0] || "U").toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {otherUser?.full_name || "User"}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {listing?.title || "Listing"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
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
                                <div
                                    key={msg.id}
                                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                >
                                    <div className="max-w-[70%] group relative">
                                        {isOwn && (
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-full"
                                                title="Delete message"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        <div
                                            className={`px-4 py-2 rounded-2xl ${isOwn
                                                ? "bg-sky-600 text-white rounded-tr-none"
                                                : "bg-white text-gray-900 rounded-tl-none shadow-sm"
                                                }`}
                                        >
                                            {msg.file_url ? (
                                                <div className="mb-2">
                                                    <img
                                                        src={msg.file_url}
                                                        alt="Attachment"
                                                        className="rounded-lg max-h-48 object-cover border-2 border-white/20"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ) : null}
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t bg-white flex items-center gap-2"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || loading}
                        className="p-3 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors"
                    >
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                        disabled={sending || loading}
                    />

                    <button
                        type="submit"
                        disabled={sending || loading || !newMessage.trim()}
                        className="p-3 bg-sky-600 text-white rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
