import React, { useRef, useEffect, useState } from 'react';
import { usePeer } from '../context/PeerContext';
import { Send, X, MessageSquare } from 'lucide-react';

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose }) => {
    const { messages, sendMessage, myId } = usePeer();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (inputValue.trim()) {
            sendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <div
            className={`fixed inset-y-0 right-0 w-full md:w-80 bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            {}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <MessageSquare size={18} />
                    Sohbet
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10 text-sm">
                        Henüz mesaj yok.
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.isSystem ? 'items-center' : (msg.senderId === myId ? 'items-end' : 'items-start')}`}
                    >
                        {msg.isSystem ? (
                            <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">{msg.text}</span>
                        ) : (
                            <div className={`max-w-[85%] rounded-2xl p-3 ${msg.senderId === myId
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-gray-800 text-gray-200 rounded-bl-none'
                                }`}>
                                <p className="text-sm break-words">{msg.text}</p>
                                <span className="text-[10px] opacity-70 mt-1 block text-right">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                        {!msg.isSystem && msg.senderId !== myId && (
                            <span className="text-[10px] text-gray-500 mt-1 ml-1">{msg.senderId.slice(0, 5)}</span>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Bir mesaj yaz..."
                        className="flex-1 bg-gray-800 border-none rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};
