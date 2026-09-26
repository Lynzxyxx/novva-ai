export type ChatMode = 'chat' | 'image';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  mode?: ChatMode; // 'image' berarti content adalah URL/data-URI gambar
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}
