import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import CallOverlay from "./components/CallOverlay";
import ProfileModal from "./components/ProfileModal";
import { ChatSession, Message } from "./types";
import { INITIAL_CHATS } from "./constants";

export default function App() {
  // 1. User Profile State (Defaulting to user's metadata/elegant placeholders)
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem("whatsapp_alex_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      name: "Muhammad Abdullah Ehsan",
      phone: "+92 300 1234567",
      status: "Hey there! I am using WhatsApp.",
      avatarEmoji: "👨‍💻",
    };
  });

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem("whatsapp_alex_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  // 2. Chat Sessions State
  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("whatsapp_alex_chats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CHATS;
  });

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem("whatsapp_alex_chats", JSON.stringify(chats));
  }, [chats]);

  // 3. UI and Calling State
  const [activeChatId, setActiveChatId] = useState("general");
  const [isSending, setIsSending] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    type: "voice" | "video";
    contactName: string;
    avatarColor: string;
  } | null>(null);

  // Clear unread counts on active chat select
  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === id ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  // Find active chat session object
  const activeSession = chats.find((chat) => chat.id === activeChatId) || chats[0];

  // 4. Send Message Handler (Communicating with Gemini Express backend)
  const handleSendMessage = async (
    text: string,
    image: { data: string; mimeType: string } | null
  ) => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text,
      timestamp: timeStr,
      status: "sending",
      image,
    };

    // Append user message immediately
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, userMsg],
            }
          : chat
      )
    );

    setIsSending(true);

    try {
      // Create previous turns context excluding the currently sent message
      const chatHistoryForContext = activeSession.messages
        .filter((m) => m.id !== "greet-1" && m.id !== "greet-2" && m.id !== "greet-3" && m.id !== "greet-4") // omit raw greetings for brevity
        .slice(-12) // Keep last 12 turns for context memory limits
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      // Append custom user profile context into the system instruction
      const customizedSystemInstruction = `${activeSession.systemInstruction}\n\nIMPORTANT: The user's name is ${userProfile.name}. Address them by their name periodically to make the WhatsApp interaction extremely personalized and highly natural.`;

      // Call Express server-side API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: chatHistoryForContext,
          systemInstruction: customizedSystemInstruction,
          image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Communication failure");
      }

      const alexMsg: Message = {
        id: `msg-${Date.now()}-alex`,
        role: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "read",
      };

      // Update both user message status to 'read' and append Alex response
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChatId) {
            // update status of userMsg and add response
            const updatedMsgs = chat.messages.map((m) =>
              m.id === userMsg.id ? { ...m, status: "read" as const } : m
            );
            return {
              ...chat,
              messages: [...updatedMsgs, alexMsg],
            };
          }
          return chat;
        })
      );
    } catch (error: any) {
      console.error("Error communicating with Alex:", error);
      
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        text: `⚠️ *[Connection Issue]* I'm having trouble connecting right now. Please verify your GEMINI_API_KEY is correctly set in **Settings > Secrets** inside AI Studio, and check that your local server is running smoothly!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "read",
      };

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChatId) {
            const updatedMsgs = chat.messages.map((m) =>
              m.id === userMsg.id ? { ...m, status: "sent" as const } : m
            );
            return {
              ...chat,
              messages: [...updatedMsgs, errorMsg],
            };
          }
          return chat;
        })
      );
    } finally {
      setIsSending(false);
    }
  };

  // 5. Simulated Call Action Handler
  const handleCall = (type: "voice" | "video") => {
    setActiveCall({
      isOpen: true,
      type,
      contactName: activeSession.name,
      avatarColor: activeSession.avatarColor,
    });
  };

  const handleCallSuccessMessage = (simulatedText: string) => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const callMsg: Message = {
      id: `msg-${Date.now()}-call`,
      role: "assistant",
      text: simulatedText,
      timestamp: timeStr,
      status: "read",
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, callMsg],
            }
          : chat
      )
    );
  };

  // 6. Reset & Clear Utilities
  const handleResetAll = () => {
    if (confirm("Are you sure you want to reset all chats and restore default settings?")) {
      localStorage.removeItem("whatsapp_alex_chats");
      localStorage.removeItem("whatsapp_alex_profile");
      setChats(INITIAL_CHATS);
      setUserProfile({
        name: "Muhammad Abdullah Ehsan",
        phone: "+92 300 1234567",
        status: "Hey there! I am using WhatsApp.",
        avatarEmoji: "👨‍💻",
      });
      setActiveChatId("general");
    }
  };

  const handleClearHistory = (chatId: string) => {
    if (confirm("Clear all message history in this chat?")) {
      const defaultGreeting = INITIAL_CHATS.find((c) => c.id === chatId)?.messages[0] || {
        id: `greet-${chatId}`,
        role: "assistant",
        text: "Hi, how can I help you today?",
        timestamp: "9:00 AM",
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [defaultGreeting],
              }
            : chat
        )
      );
    }
  };

  const handleSaveProfile = (updated: {
    name: string;
    phone: string;
    status: string;
    avatarEmoji: string;
  }) => {
    setUserProfile(updated);
  };

  return (
    <div className="w-screen h-screen bg-[#f0f2f5] flex items-center justify-center p-0 md:p-3 overflow-hidden font-sans antialiased select-none">
      {/* Outer frame matching real desktop layout */}
      <div className="w-full h-full md:max-w-[1600px] md:max-h-[950px] bg-white rounded-none md:rounded-lg shadow-xl border border-gray-200/50 flex overflow-hidden relative">
        
        {/* Left Side: Sidebar */}
        <div className="hidden md:block shrink-0">
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onOpenProfile={() => setIsProfileOpen(true)}
            onResetAll={handleResetAll}
            onClearHistory={handleClearHistory}
            userProfile={userProfile}
          />
        </div>

        {/* Mobile View Sidebar fallback */}
        <div className="flex md:hidden w-full h-full flex-row">
          {activeChatId === "" ? (
            <Sidebar
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              onOpenProfile={() => setIsProfileOpen(true)}
              onResetAll={handleResetAll}
              onClearHistory={handleClearHistory}
              userProfile={userProfile}
            />
          ) : (
            <div className="flex-1 flex flex-col h-full">
              {/* Back button on mobile */}
              <div className="bg-[#008069] text-white p-2.5 flex items-center gap-1">
                <button
                  onClick={() => handleSelectChat("")}
                  className="font-semibold text-sm hover:bg-black/10 px-2 py-1 rounded"
                >
                  ← Back to Chats
                </button>
                <div className="h-4 w-px bg-white/20 mx-1" />
                <span className="text-xs text-white/90">Chatting with {activeSession.name}</span>
              </div>
              <ChatArea
                session={activeSession}
                onSendMessage={handleSendMessage}
                onCall={handleCall}
                isSending={isSending}
                userProfile={userProfile}
              />
            </div>
          )}
        </div>

        {/* Right Side: Chat Panel for Desktop */}
        <div className="hidden md:flex flex-1 h-full min-w-0">
          <ChatArea
            session={activeSession}
            onSendMessage={handleSendMessage}
            onCall={handleCall}
            isSending={isSending}
            userProfile={userProfile}
          />
        </div>

        {/* 5. Call Overlay */}
        {activeCall && (
          <CallOverlay
            isOpen={activeCall.isOpen}
            type={activeCall.type}
            contactName={activeCall.contactName}
            avatarColor={activeCall.avatarColor}
            onHangUp={() => setActiveCall(null)}
            onCallSuccessMessage={handleCallSuccessMessage}
          />
        )}

        {/* 6. Profile Modal */}
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          profile={userProfile}
          onSave={handleSaveProfile}
        />
      </div>
    </div>
  );
}
