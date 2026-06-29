import { useState } from "react";
import { ChatSession } from "../types";
import { Search, MessageSquarePlus, RotateCcw, ShieldAlert, CheckCheck, Trash2, UserCog } from "lucide-react";

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onOpenProfile: () => void;
  onResetAll: () => void;
  onClearHistory: (chatId: string) => void;
  userProfile: {
    name: string;
    phone: string;
    status: string;
    avatarEmoji: string;
  };
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onOpenProfile,
  onResetAll,
  onClearHistory,
  userProfile,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] h-full flex flex-col border-r border-gray-200 bg-white">
      {/* Sidebar Header */}
      <div className="bg-[#00A884] text-white px-5 py-4 flex items-center justify-between border-b border-emerald-700/30 shadow-xs z-10 shrink-0">
        {/* User Profile */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 group text-left focus:outline-none hover:bg-white/10 p-1.5 rounded-xl transition-all"
          title="Click to edit profile"
        >
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
            {userProfile.avatarEmoji}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white line-clamp-1 flex items-center gap-1">
              {userProfile.name}
              <UserCog className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
            </h4>
            <p className="text-[11px] text-emerald-100 line-clamp-1 font-medium">{userProfile.status}</p>
          </div>
        </button>

        {/* Global Control Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onResetAll}
            className="p-2 text-white/85 hover:text-white hover:bg-white/15 rounded-full transition-all"
            title="Reset All Conversations"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onClearHistory(activeChatId)}
            className="p-2 text-white/85 hover:text-white hover:bg-white/15 rounded-full transition-all"
            title="Clear Current Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Info Box */}
      <div className="bg-emerald-50/60 px-4 py-2 border-b border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800">
        <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="leading-tight">
          Alex is offline-simulated in your browser and secure. No real WhatsApp data is exposed.
        </span>
      </div>

      {/* Search Input */}
      <div className="px-3 py-2 bg-white border-b border-gray-100">
        <div className="relative flex items-center bg-[#f0f2f5] rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00a884] transition-all">
          <Search className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search topics or chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-[10px] font-bold text-gray-400 px-2 pb-1 uppercase tracking-widest">Recent Topics</div>
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm space-y-1">
            <p>No chats found</p>
            <p className="text-xs text-gray-400">Try searching for "Alex" or tutoring terms.</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isActive = chat.id === activeChatId;

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 rounded-xl transition-all focus:outline-none border border-transparent ${
                  isActive ? "bg-[#f0f2f5] border-gray-200/50 shadow-xs" : "hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                {/* Contact Avatar with status dot */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full ${chat.avatarColor} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                    {chat.name.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00e676] border-2 border-white rounded-full" />
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-800 text-sm truncate leading-tight">
                        {chat.name}
                      </span>
                      {chat.verified && (
                        <span className="inline-flex shrink-0 text-[#00a884]" title="Verified Business Account">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0">
                      {lastMsg ? lastMsg.timestamp : "9:00 AM"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-1 mb-1 font-normal">
                    {chat.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate font-normal flex items-center gap-1 pr-2">
                      {lastMsg && lastMsg.role === "user" && (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                      )}
                      {lastMsg ? (
                        lastMsg.image ? (
                          <span className="text-emerald-600 font-medium flex items-center gap-1 text-[11px]">
                            📷 Photo
                          </span>
                        ) : (
                          lastMsg.text
                        )
                      ) : (
                        "No messages"
                      )}
                    </p>

                    {chat.unreadCount > 0 && !isActive && (
                      <span className="shrink-0 bg-[#25d366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 h-4 flex items-center justify-center animate-pulse">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-3 text-center border-t border-gray-100 bg-[#f0f2f5]/40">
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
          Alex Chatbot • Built with Gemini AI
        </span>
      </div>
    </div>
  );
}
