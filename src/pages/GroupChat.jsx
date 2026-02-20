import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, ShieldCheck, Users } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function GroupChat() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const endRef = useRef(null);

    // Fetch Group Details
    useEffect(() => {
        if (!id) return;
        const fetchGroup = async () => {
            const docSnap = await getDoc(doc(db, 'groups', id));
            if (docSnap.exists()) {
                setGroup({ id: docSnap.id, ...docSnap.data() });
            } else {
                navigate('/groups');
            }
        };
        fetchGroup();
    }, [id, navigate]);

    // Fetch Messages
    useEffect(() => {
        if (!id || !user) return;
        const msgQ = query(collection(db, 'groups', id, 'messages'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(msgQ, snap => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [id, user]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !user || !id) return;

        const text = messageInput;
        setMessageInput('');

        try {
            const msgRef = collection(db, 'groups', id, 'messages');
            await addDoc(msgRef, {
                text,
                senderId: user.uid,
                senderName: user.displayName || 'Anonymous',
                senderPhoto: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!group) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-md mx-auto bg-slate-50 relative">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm cursor-pointer hover:bg-slate-50" onClick={() => navigate('/groups')}>
                <div className="flex items-center gap-3">
                    <button className="p-1 -ml-2 text-slate-500 hover:text-primary-500 rounded-full">
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h2 className="font-bold text-slate-800 text-[15px]">{group.title}</h2>
                        <div className="flex items-center text-primary-500 text-xs gap-1 font-medium">
                            <ShieldCheck size={12} /> Safe Moderated Group
                        </div>
                    </div>
                </div>
                <div className="text-slate-400 flex items-center gap-1 text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg">
                    <Users size={12} /> {group.memberIds?.length || group.members || 0}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center mt-10 text-slate-400 text-sm">
                        <ShieldCheck size={40} className="mx-auto text-slate-200 mb-2" />
                        <p>Welcome to {group.title}.</p>
                        <p>Be kind, supportive, and respectful!</p>
                    </div>
                )}
                {messages.map((msg, i) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <div
                            key={msg.id || i}
                            className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                            {!isMe && (
                                <div className="flex items-center gap-2 mb-1 pl-1">
                                    <img src={msg.senderPhoto} alt="pic" className="w-5 h-5 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{msg.senderName}</span>
                                </div>
                            )}
                            <div className={`p-3 rounded-2xl shadow-sm text-[15px] leading-relaxed relative ${isMe
                                ? 'bg-primary-500 text-white rounded-tr-sm'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                                }`}>
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 mx-1 font-medium select-none">{msg.time}</span>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 bg-white border-t border-slate-200 mt-auto">
                <form onSubmit={sendMessage} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Message the group..."
                        className="flex-1 bg-slate-100 rounded-full px-5 py-3 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                    <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="absolute right-1.5 top-1.5 w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-50 hover:bg-primary-600 transition-colors disabled:hover:bg-primary-500"
                    >
                        <Send size={16} className="ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
