import React, { useState, useEffect, useRef } from "react";
import { X, Send, Check, CheckCheck } from "lucide-react";
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
                    setMessages((prev) => [...prev, payload.new]);
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

            const ownerId = listing.user_id;
            const currentUserId = user.id;

            if (!ownerId || !currentUserId) {
                console.error("Missing user IDs");
                alert("Cannot start chat: Missing user information.");
                return;
            }

            // STEP 1: Find or create conversation
            let { data: conv } = await supabase
                .from("conversations")
                .select("*")
                .or(
                    `and(participant_1_id.eq.${ownerId},participant_2_id.eq.${currentUserId}),
           and(participant_1_id.eq.${currentUserId},participant_2_id.eq.${ownerId})`
                )
                .maybeSingle();

            if (!conv) {
                const { data: newConv, error } = await supabase
                    .from("conversations")
                    .insert({
                        participant_1_id: ownerId,
                        participant_2_id: currentUserId,
                        listing_id: listing.id,
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
            console.error("Chat init error:", err);
            alert("Could not load chat.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversation) return;

        try {
            setSending(true);

            const { error } = await supabase.from("messages").insert({
                conversation_id: conversation.id,
                sender_id: user.id,
                content: newMessage.trim(),
            });

            if (error) throw error;

            await supabase
                .from("conversations")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", conversation.id);

            setNewMessage("");
        } catch (err) {
            console.error("Send error:", err);
            alert("Failed to send message.");
        } finally {
            setSending(false);
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
                                    <div className="max-w-[70%]">
                                        <div
                                            className={`px-4 py-2 rounded-2xl ${isOwn
                                                ? "bg-sky-600 text-white rounded-tr-none"
                                                : "bg-white text-gray-900 rounded-tl-none shadow-sm"
                                                }`}
                                        >
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
