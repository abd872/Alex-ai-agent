export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string; // e.g., "11:34 AM"
  status?: "sending" | "sent" | "delivered" | "read";
  image?: {
    data: string; // base64 string
    mimeType: string;
  } | null;
}

export interface ChatSession {
  id: string;
  name: string;
  description: string;
  avatarColor: string; // Tailwind bg color class
  verified: boolean;
  systemInstruction: string;
  messages: Message[];
  statusText: "online" | "typing..." | string;
  unreadCount: number;
}

export interface QuickStarter {
  label: string;
  prompt: string;
  category: string;
}
