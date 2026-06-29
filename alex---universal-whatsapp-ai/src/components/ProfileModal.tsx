import React, { useState } from "react";
import { X, User, Phone, Info, Check } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
    phone: string;
    status: string;
    avatarEmoji: string;
  };
  onSave: (updated: { name: string; phone: string; status: string; avatarEmoji: string }) => void;
}

export default function ProfileModal({ isOpen, onClose, profile, onSave }: ProfileModalProps) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [status, setStatus] = useState(profile.status);
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatarEmoji);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, phone, status, avatarEmoji });
    onClose();
  };

  const emojis = ["👤", "👨‍💻", "👩‍💻", "🚀", "😎", "🌟", "🔥", "⚽", "🌍", "🐱", "🎧", "🍕"];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#008069] text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span>Your WhatsApp Profile</span>
          </h3>
          <button onClick={onClose} className="hover:bg-black/10 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Picker */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-medium text-gray-500">Choose Profile Icon</label>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl border border-gray-200 shadow-inner">
              {avatarEmoji}
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                    avatarEmoji === emoji
                      ? "border-[#008069] bg-emerald-50 scale-110"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" /> Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={40}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all"
                placeholder="Enter your name"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                This is not a username. This name will be visible to Alex in chats.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all"
                placeholder="+92 300 1234567"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-gray-400" /> About / Status
              </label>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all"
                placeholder="Hey there! I am using WhatsApp."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#008069] hover:bg-[#006e5a] text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
