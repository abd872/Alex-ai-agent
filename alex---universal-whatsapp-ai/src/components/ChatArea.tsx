import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Message, QuickStarter, ChatSession } from "../types";
import { QUICK_STARTERS } from "../constants";
import {
  Phone,
  Video,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Check,
  CheckCheck,
  User,
  Image as ImageIcon,
  ChevronRight,
  Info,
  MoreVertical,
} from "lucide-react";

interface ChatAreaProps {
  session: ChatSession;
  onSendMessage: (text: string, image: { data: string; mimeType: string } | null) => void;
  onCall: (type: "voice" | "video") => void;
  isSending: boolean;
  userProfile: { name: string };
}

// Browser speech recognition types
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default function ChatArea({
  session,
  onSendMessage,
  onCall,
  isSending,
  userProfile,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, isSending]);

  // Clean up Speech on unmount or chat change
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeakingMsgId(null);
  }, [session.id]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + " " + transcript : transcript));
        setIsRecording(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setSpeechError("Voice dictation error. Try speaking closer to the mic.");
        setIsRecording(false);
        setTimeout(() => setSpeechError(null), 4000);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Handle Send Message
  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;
    onSendMessage(inputText, selectedImage);
    setInputText("");
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Image upload handling
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file (PNG, JPG, WEBP, etc.)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        // Strip metadata prefix if any to extract pure base64
        const base64Pure = base64Data.split(",")[1];
        setSelectedImage({
          data: base64Pure,
          mimeType: file.type,
        });
        setImagePreviewUrl(base64Data);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input so same file can be re-selected if cancelled
    if (e.target) e.target.value = "";
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  // TTS (Text to Speech) Reading
  const toggleSpeech = (message: Message) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMsgId === message.id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    // Cancel anything playing
    window.speechSynthesis.cancel();

    // Clean text of markdown before speech
    const cleanText = message.text
      .replace(/[\*\#\`\_]/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Slightly friendly pitch

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(message.id);
    window.speechSynthesis.speak(utterance);
  };

  // Dictation Toggle
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice dictation is not supported or permitted in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // Filter Quick Starters for active session mode
  const activeStarters = QUICK_STARTERS.filter((qs) => {
    if (session.id === "general") return qs.category === "general";
    if (session.id === "coding") return qs.category === "coding";
    if (session.id === "languages") return qs.category === "languages";
    if (session.id === "homework") return qs.category === "homework";
    return false;
  });

  return (
    <div className="flex-1 h-full flex flex-col bg-[#E5DDD5] relative min-w-0">
      {/* Header */}
      <div className="bg-[#f0f2f5] px-5 py-3.5 flex items-center justify-between border-b border-gray-200/80 z-10 shrink-0 shadow-3xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full ${session.avatarColor} flex items-center justify-center text-white text-md font-bold shrink-0 shadow-xs`}>
            {session.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm md:text-base flex items-center gap-1 leading-tight">
              <span>{session.name}</span>
              {session.verified && (
                <span className="inline-flex shrink-0 text-[#00a884]" title="Verified Business Account">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </span>
              )}
            </h3>
            <p className="text-[11px] md:text-xs text-gray-500 truncate">
              {isSending ? "typing..." : speakingMsgId ? "speaking voice message..." : session.statusText}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => onCall("voice")}
            className="p-2 text-gray-600 hover:text-[#008069] hover:bg-gray-200/50 rounded-full transition-colors"
            title="Voice Call"
          >
            <Phone className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
          <button
            onClick={() => onCall("video")}
            className="p-2 text-gray-600 hover:text-[#008069] hover:bg-gray-200/50 rounded-full transition-colors"
            title="Video Call"
          >
            <Video className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
          <button
            onClick={() => setIsAboutOpen(!isAboutOpen)}
            className={`p-2 rounded-full transition-colors ${
              isAboutOpen ? "text-[#008069] bg-gray-200/50" : "text-gray-600 hover:text-[#008069] hover:bg-gray-200/50"
            }`}
            title="Session Info"
          >
            <Info className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Messages + Info Sidebar (if open) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Overlay Badge for Guidelines (Branding) */}
        {showCapabilities ? (
          <div className="absolute top-4 right-4 z-20 hidden lg:block animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-gray-200/80 w-56 relative">
              <button
                onClick={() => setShowCapabilities(false)}
                className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                title="Hide Guidelines"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-[#00A884] font-bold text-lg">⚡</span>
                <span className="text-xs font-bold uppercase tracking-tight text-gray-800">Capabilities</span>
              </div>
              <ul className="text-[11px] space-y-2 text-gray-600 font-medium">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 shrink-0"></span>
                  <span>Coding & Logic</span>
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 shrink-0"></span>
                  <span>General Knowledge</span>
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 shrink-0"></span>
                  <span>Math & Science</span>
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2 shrink-0"></span>
                  <span>Writing & Essays</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCapabilities(true)}
            className="absolute top-4 right-4 z-20 hidden lg:flex items-center gap-1.5 bg-white/90 hover:bg-white backdrop-blur-md rounded-full px-3 py-1.5 shadow-md border border-gray-200 text-[11px] font-semibold text-gray-600 transition-all hover:scale-105 active:scale-95"
            title="Show Guidelines"
          >
            <span>⚡ Capabilities</span>
          </button>
        )}

        {/* Messages scroll pane */}
        <div className="flex-1 whatsapp-bg overflow-y-auto px-4 py-4 md:px-8 space-y-4 flex flex-col">
          {/* Encrypted Notice bubble */}
          <div className="self-center bg-[#ffeecd] text-gray-700 text-[11px] font-medium py-1 px-3 rounded-lg shadow-xs text-center max-w-sm border border-[#f2ded1]">
            🔒 Messages with Alex are simulated through your secure local environment and powered by Google Gemini. Tap for more info.
          </div>

          {/* Render Speech Bubbles */}
          {session.messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const isSpeaking = speakingMsgId === msg.id;

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col max-w-[85%] md:max-w-[70%] ${
                  isUser ? "self-end items-end" : "self-start items-start"
                }`}
              >
                {/* Bubble card */}
                <div
                  className={`relative p-4 rounded-2xl shadow-xs text-[13.5px] md:text-[14px] leading-relaxed select-text ${
                    isUser
                      ? "bg-[#d9fdd3] text-gray-800 rounded-tr-none rounded-l-2xl rounded-br-2xl bubble-tail-right"
                      : "bg-white text-gray-800 rounded-tl-none rounded-r-2xl rounded-bl-2xl bubble-tail-left"
                  }`}
                >
                  {/* Attached Image inside User Bubble */}
                  {msg.image && (
                    <div className="mb-2 max-w-full rounded-lg overflow-hidden border border-gray-200/20 shadow-inner bg-black/5">
                      <img
                        src={`data:${msg.image.mimeType};base64,${msg.image.data}`}
                        alt="User attached file"
                        referrerPolicy="no-referrer"
                        className="max-h-60 object-contain mx-auto"
                      />
                    </div>
                  )}

                  {/* Message Markdown Body */}
                  <div className="markdown-body font-normal break-words prose max-w-none text-[13.5px] md:text-[14px]">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>

                  {/* Metadata: Speaker voice (for Alex) & Ticks (for User) & Time */}
                  <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-gray-500 font-medium select-none shrink-0">
                    <span>{msg.timestamp}</span>

                    {isUser ? (
                      <span className="text-[#53bdeb]">
                        {msg.status === "sending" ? (
                          <span className="animate-pulse">...</span>
                        ) : msg.status === "sent" ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5" />
                        )}
                      </span>
                    ) : (
                      /* Read Aloud button for Alex responses */
                      <button
                        onClick={() => toggleSpeech(msg)}
                        className={`p-1 rounded-full transition-colors ${
                          isSpeaking
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "hover:bg-gray-100 text-gray-400 hover:text-[#008069]"
                        }`}
                        title={isSpeaking ? "Pause reading" : "Read message aloud"}
                      >
                        {isSpeaking ? (
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-3.5 bg-emerald-700 animate-pulse rounded-full" />
                            <span className="w-1 h-4 bg-emerald-700 animate-pulse delay-75 rounded-full" />
                            <span className="w-1 h-2.5 bg-emerald-700 animate-pulse delay-150 rounded-full" />
                            <VolumeX className="w-3 h-3 text-emerald-800 ml-0.5" />
                          </div>
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Simulated typing indicator */}
          {isSending && (
            <div className="self-start flex flex-col items-start max-w-[70%]">
              <div className="bg-white px-4 py-2.5 rounded-xl rounded-tl-none shadow-xs text-sm text-gray-500 flex items-center gap-1.5 bubble-tail-left relative">
                <span className="font-semibold text-emerald-600 text-xs mr-0.5">Alex</span>
                <span className="flex gap-1 items-center mt-0.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}

          {/* Spacer anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Sidebar Info Panel */}
        {isAboutOpen && (
          <div className="w-80 border-l border-gray-200 bg-white p-5 space-y-6 hidden lg:block overflow-y-auto animate-in slide-in-from-right duration-200 shrink-0">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="font-semibold text-gray-800 text-sm">Contact Info</h4>
              <button onClick={() => setIsAboutOpen(false)} className="hover:bg-gray-100 p-1 rounded-full text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`w-20 h-20 rounded-full ${session.avatarColor} flex items-center justify-center text-white text-3xl font-bold shadow-md`}>
                {session.name.charAt(0)}
              </div>
              <div>
                <h5 className="font-bold text-gray-800 text-base flex items-center justify-center gap-1">
                  {session.name}
                  {session.verified && (
                    <span className="text-[#00a884] scale-110">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current inline">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </span>
                  )}
                </h5>
                <p className="text-xs text-[#00a884] font-medium mt-0.5">Verified Business Account</p>
              </div>
            </div>

            <div className="border-t border-b border-gray-100 py-3 text-xs text-gray-600 space-y-2">
              <p className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Description</p>
              <p className="text-gray-700 leading-relaxed">{session.description}</p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">System Persona Details</p>
              <div className="bg-gray-50 p-2.5 rounded-lg text-gray-600 max-h-48 overflow-y-auto font-mono text-[10.5px] border border-gray-200/50">
                {session.systemInstruction}
              </div>
            </div>

            <div className="text-[10px] text-gray-400 text-center leading-relaxed">
              This WhatsApp service connects securely to Gemini 3.5-flash to process responses. Responses are quick and tailored to the chat persona.
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts / Quick Starters Carousel */}
      {session.messages.length <= 1 && !isSending && (
        <div className="px-4 py-2.5 bg-[#f0f2f5]/80 border-t border-gray-200 shrink-0 z-10">
          <p className="text-xs text-gray-500 font-semibold mb-2 flex items-center gap-1 select-none">
            💡 Quick Starters (Tap to ask Alex immediately):
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 max-w-full">
            {activeStarters.map((qs, i) => (
              <button
                key={i}
                onClick={() => {
                  onSendMessage(qs.prompt, null);
                }}
                className="shrink-0 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-800 text-xs font-medium py-1.5 px-3 rounded-full shadow-2xs hover:shadow-xs transition-all duration-150 flex items-center gap-1.5"
              >
                <span>{qs.label}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dictation error indicator */}
      {speechError && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-4 py-2 rounded-full shadow-lg z-20 flex items-center gap-1.5 animate-bounce">
          <MicOff className="w-3.5 h-3.5" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Image attachment preview drawer if picked */}
      {imagePreviewUrl && (
        <div className="mx-4 my-2 p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-md relative animate-in slide-in-from-bottom duration-200 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative shrink-0">
              <img src={imagePreviewUrl} alt="Upload preview" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Image Attached</p>
              <p className="text-[10px] text-gray-400">Will be analyzed by Alex on send</p>
            </div>
          </div>
          <button
            onClick={removeImage}
            className="p-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-full transition-colors"
            title="Cancel attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="bg-[#f0f2f5] p-3 flex items-center gap-3 border-t border-gray-200 shrink-0 z-10">
        {/* Hidden File input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Attachment Button */}
        <div className="flex items-center gap-1.5 shrink-0 text-gray-500">
          <button
            onClick={handleAttachmentClick}
            disabled={isSending}
            className="p-2 hover:text-[#008069] disabled:opacity-50 hover:bg-gray-200/60 rounded-full transition-all shrink-0"
            title="Attach Image / Document"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        {/* Input Text Box in fully rounded background container */}
        <div className="flex-1 bg-white rounded-full px-5 py-2.5 flex items-center border border-gray-200/50 shadow-3xs">
          <input
            type="text"
            placeholder={isSending ? "Please wait..." : isRecording ? "Listening closely..." : "Type a message"}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending}
            className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-500 focus:outline-none"
          />
        </div>

        {/* Speak / Dictate Button or Send Button */}
        {inputText.trim() || selectedImage ? (
          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-12 h-12 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white rounded-full shadow-lg transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Send Message"
          >
            <Send className="w-5 h-5 translate-x-0.5" />
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            disabled={isSending}
            className={`w-12 h-12 rounded-full shadow-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                : "bg-white text-gray-500 hover:bg-gray-100 hover:text-[#008069]"
            }`}
            title={isRecording ? "Stop dictation" : "Voice dictation (Speech-to-text)"}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
