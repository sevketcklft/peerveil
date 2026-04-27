import React, { useState } from 'react';
import { usePeer } from '../context/PeerContext';
import { Radio, RadioReceiver, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Lobby: React.FC = () => {
    const { myId, joinRoom, createRoom, error } = usePeer();
    const [inviteCode, setInviteCode] = useState('');
    const [nickname, setNickname] = useState('');

    React.useEffect(() => {
        const stored = localStorage.getItem('chat_nickname');
        if (stored) setNickname(stored);
    }, []);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteCode.trim()) {
            if (nickname.trim()) {
                localStorage.setItem('chat_nickname', nickname.trim());
            }

            joinRoom(inviteCode.trim(), undefined, nickname.trim());
        }
    };

    const handleCreate = () => {
        if (nickname.trim()) {
            localStorage.setItem('chat_nickname', nickname.trim());
        }
        createRoom(undefined, nickname.trim());
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md p-8 space-y-8 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl">
            <div className="text-center space-y-2">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex p-4 bg-indigo-600/20 rounded-full mb-4"
                >
                    <RadioReceiver size={48} className="text-indigo-500" />
                </motion.div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    PeerVeil
                </h1>
                <p className="text-gray-400">Sunucusuz Sesli Sohbet</p>
            </div>

            <div className="w-full space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-200 bg-red-900/40 border border-red-800 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <div className="p-4 bg-gray-800 rounded-xl space-y-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KİMLİĞİNİZ (ID)</label>
                    <div className="flex items-center justify-between font-mono text-sm bg-black/30 p-3 rounded-lg border border-gray-700">
                        <span className="truncate">{myId || (error ? "Bağlantı bekleniyor..." : "Ağa bağlanılıyor...")}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(myId)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 ml-2"
                        >
                            Kopyala
                        </button>
                    </div>
                </div>



                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KULLANICI ADI (OPSIYONEL)</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Adınız (Örn: Ahmet)"
                        className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-600"
                    />
                </div>



                <button
                    onClick={handleCreate}
                    disabled={!myId}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Radio size={20} />
                    <span>Yeni Oda Oluştur</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <form onSubmit={handleJoin} className="flex gap-2">
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Davet Kodu Giriniz"
                        className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-600"
                    />
                    <button
                        type="submit"
                        disabled={!inviteCode || !myId}
                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-indigo-400 px-6 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        Katıl
                    </button>
                </form>
            </div>
        </div>

    );
};
