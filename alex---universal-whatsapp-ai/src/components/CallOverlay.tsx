import { useEffect, useState } from "react";
import { Phone, Video, PhoneOff, MicOff, Volume2, Shield } from "lucide-react";

interface CallOverlayProps {
  isOpen: boolean;
  type: "voice" | "video";
  contactName: string;
  avatarColor: string;
  onHangUp: () => void;
  onCallSuccessMessage: (msg: string) => void;
}

export default function CallOverlay({
  isOpen,
  type,
  contactName,
  avatarColor,
  onHangUp,
  onCallSuccessMessage,
}: CallOverlayProps) {
  const [status, setStatus] = useState<"Calling..." | "Ringing..." | "Connecting..." | "Connected" | "Ended">("Calling...");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setStatus("Calling...");
    setSeconds(0);

    const ringTimeout = setTimeout(() => {
      setStatus("Ringing...");
    }, 1500);

    const connectTimeout = setTimeout(() => {
      setStatus("Connecting...");
    }, 3500);

    const activeTimeout = setTimeout(() => {
      setStatus("Connected");
      // Simulate Alex giving an interactive voice reply
      const simulatedText = `📞 [Simulated Call] "Hey! It's Alex. I'm actually a text-based AI assistant, so I can't talk live yet, but I can hear your request! Let's continue chatting here over text—I'm ready for your questions!"`;
      onCallSuccessMessage(simulatedText);
    }, 5500);

    return () => {
      clearTimeout(ringTimeout);
      clearTimeout(connectTimeout);
      clearTimeout(activeTimeout);
    };
  }, [isOpen]);

  useEffect(() => {
    if (status !== "Connected") return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 bg-[#0b141a] text-white z-50 flex flex-col justify-between p-8 md:p-12 animate-in fade-in duration-300">
      {/* Encryption Banner */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-2">
        <Shield className="w-3.5 h-3.5 text-[#00a884]" />
        <span>End-to-end encrypted</span>
      </div>

      {/* Main Calling Profile */}
      <div className="flex flex-col items-center justify-center flex-grow space-y-6">
        {/* Avatar Area with Pulsing Rings */}
        <div className="relative flex items-center justify-center">
          {status !== "Connected" && (
            <>
              <div className="pulse-ring" style={{ animationDelay: "0s" }} />
              <div className="pulse-ring" style={{ animationDelay: "0.7s" }} />
              <div className="pulse-ring" style={{ animationDelay: "1.4s" }} />
            </>
          )}

          {type === "video" && status === "Connected" ? (
            <div className="w-32 h-32 md:w-44 md:h-44 bg-slate-800 rounded-xl overflow-hidden border-2 border-[#00a884] flex items-center justify-center relative shadow-lg">
              <Video className="w-16 h-16 text-gray-500 animate-pulse" />
              <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-0.5 rounded">
                Camera Feed Active
              </div>
            </div>
          ) : (
            <div className={`w-28 h-28 md:w-36 md:h-36 ${avatarColor} rounded-full flex items-center justify-center text-white text-4xl md:text-5xl font-semibold shadow-lg z-10 border border-white/10`}>
              {contactName.charAt(0)}
            </div>
          )}
        </div>

        {/* Name and Status */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{contactName}</h2>
          <p className="text-sm font-medium text-[#00a884]">
            {status === "Connected" ? `WhatsApp ${type === "voice" ? "Voice" : "Video"} Call • ${formatTime(seconds)}` : status}
          </p>
        </div>

        {status === "Connected" && (
          <div className="max-w-md bg-white/10 backdrop-blur-md border border-white/5 rounded-xl p-4 text-center text-xs md:text-sm text-gray-200 mt-4 leading-relaxed animate-in fade-in slide-in-from-bottom-4">
            🤖 <span className="font-semibold text-white">Alex is responding:</span> "Hey! I can't talk live over audio yet, but I've left a note in our text chat. Let's continue chatting there!"
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col items-center space-y-6 pb-4">
        <div className="flex items-center gap-6 md:gap-8">
          {/* Speaker button */}
          <button
            onClick={() => setSpeakerOn(!speakerOn)}
            className={`p-4 rounded-full transition-all ${
              speakerOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white/5 text-gray-500"
            }`}
            title="Speaker"
          >
            <Volume2 className="w-6 h-6" />
          </button>

          {/* Mute button */}
          <button
            onClick={() => setMuted(!muted)}
            className={`p-4 rounded-full transition-all ${
              muted ? "bg-[#00a884] text-white" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title="Mute Microphone"
          >
            <MicOff className="w-6 h-6" />
          </button>

          {/* Hang up button */}
          <button
            onClick={onHangUp}
            className="p-4 bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 text-white rounded-full transition-all shadow-md shadow-red-900/30"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}
