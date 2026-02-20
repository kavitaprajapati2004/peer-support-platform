import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Search, UserPlus, Check, X, MessageCircle, ArrowLeft, ShieldCheck, Clock, Users, Bell } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
    const { user } = useAuth();
    const [view, setView] = useState('list'); // 'list', 'search', 'requests', 'room'

    // Data states
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [requests, setRequests] = useState([]);
    const [conversations, setConversations] = useState([]);

    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const endRef = useRef(null);

    // Fetch conversations and incoming requests
    useEffect(() => {
        if (!user) return;

        // Listen to active conversations
        const convQ = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
        const unsubConv = onSnapshot(convQ, (snap) => {
            const arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort to avoid requiring composite indexes immediately
            arr.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
            setConversations(arr);
        });

        // Listen to incoming friend requests
        const reqQ = query(collection(db, 'requests'), where('receiverId', '==', user.uid), where('status', '==', 'pending'));
        const unsubReq = onSnapshot(reqQ, (snap) => {
            setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubConv(); unsubReq(); };
    }, [user]);

    // Fetch messages for active room
    useEffect(() => {
        if (view !== 'room' || !activeChat || !user) return;
        const msgQ = query(collection(db, 'conversations', activeChat.id, 'messages'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(msgQ, snap => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [view, activeChat, user]);

    const [sentRequests, setSentRequests] = useState([]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch outbound requests to know who we already requested
    useEffect(() => {
        if (!user) return;
        const outReqQ = query(collection(db, 'requests'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
        const unsub = onSnapshot(outReqQ, (snap) => {
            setSentRequests(snap.docs.map(doc => doc.data().receiverId));
        });
        return () => unsub();
    }, [user]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim() || !user) return;
        setIsSearching(true);
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const results = [];

            // Map our existing conversations into an array of peer IDs
            const friendIds = conversations.map(c => c.participants.find(id => id !== user.uid));

            usersSnap.forEach(docSnap => {
                const u = docSnap.data();

                // Show user if name matches (and not us)
                if (u.uid !== user.uid &&
                    (u.searchName?.includes(searchTerm.toLowerCase()) || u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()))) {

                    let status = 'none';
                    if (friendIds.includes(u.uid)) status = 'friend';
                    else if (sentRequests.includes(u.uid)) status = 'requested';

                    results.push({ ...u, connectionStatus: status });
                }
            });
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching users:", error);
        }
        setIsSearching(false);
    };

    const sendRequest = async (targetUser) => {
        if (!user) return;
        try {
            // Very simple check to ensure no duplicates. In production check thoroughly.
            await addDoc(collection(db, 'requests'), {
                senderId: user.uid,
                senderName: user.displayName || 'User',
                senderPhoto: user.photoURL || '',
                receiverId: targetUser.uid,
                receiverName: targetUser.displayName || 'User',
                receiverPhoto: targetUser.photoURL || '',
                status: 'pending',
                createdAt: serverTimestamp()
            });
            alert("Request sent successfully!");
        } catch (error) {
            console.error("Error sending request:", error);
        }
    };

    const acceptRequest = async (req) => {
        try {
            await addDoc(collection(db, 'conversations'), {
                participants: [req.senderId, req.receiverId],
                participantNames: {
                    [req.senderId]: req.senderName,
                    [req.receiverId]: req.receiverName
                },
                participantPhotos: {
                    [req.senderId]: req.senderPhoto,
                    [req.receiverId]: req.receiverPhoto
                },
                updatedAt: serverTimestamp()
            });
            // Delete the request after accepting
            await deleteDoc(doc(db, 'requests', req.id));
        } catch (error) {
            console.error("Error accepting request:", error);
        }
    };

    const declineRequest = async (reqId) => {
        try {
            await deleteDoc(doc(db, 'requests', reqId));
        } catch (error) {
            console.error("Error declining request:", error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !user || !activeChat) return;

        const text = messageInput;
        setMessageInput('');

        try {
            const msgRef = collection(db, 'conversations', activeChat.id, 'messages');
            await addDoc(msgRef, {
                text,
                senderId: user.uid,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending:", error);
        }
    };

    const getPeerInfo = (chat) => {
        if (!user || !chat) return { name: 'Unknown', photo: '' };
        const peerId = chat.participants.find(id => id !== user.uid);
        return {
            name: chat.participantNames?.[peerId] || 'User',
            photo: chat.participantPhotos?.[peerId] || `https://ui-avatars.com/api/?name=${chat.participantNames?.[peerId] || 'U'}`
        };
    };

    // -------------------------------------------------------------------------------- //
    // RENDER SCREENS
    // -------------------------------------------------------------------------------- //

    if (view === 'room' && activeChat) {
        const peer = getPeerInfo(activeChat);
        return (
            <div className="flex flex-col h-[calc(100vh-8rem)] max-w-md mx-auto bg-slate-50 relative">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm cursor-pointer hover:bg-slate-50" onClick={() => setView('list')}>
                    <button className="p-1 -ml-2 text-slate-500 hover:text-primary-500 rounded-full">
                        <ArrowLeft size={22} />
                    </button>
                    <img src={peer.photo} alt={peer.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                    <div>
                        <h2 className="font-bold text-slate-800 text-[15px]">{peer.name}</h2>
                        <div className="flex items-center text-primary-500 text-xs gap-1 font-medium">
                            <ShieldCheck size={12} /> Safe Space
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center mt-10 text-slate-400 text-sm">
                            <ShieldCheck size={40} className="mx-auto text-slate-200 mb-2" />
                            <p>You are now connected.</p>
                            <p>Say hello to your peer!</p>
                        </div>
                    )}
                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={msg.id || i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`flex flex-col max-w-[85%] ${msg.senderId === user?.uid ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                            >
                                <div className={`p-3 rounded-2xl shadow-sm text-[15px] leading-relaxed relative ${msg.senderId === user?.uid
                                    ? 'bg-primary-500 text-white rounded-tr-sm'
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 mx-1 font-medium select-none">{msg.time}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={endRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-white border-t border-slate-200 mt-auto">
                    <form onSubmit={sendMessage} className="flex gap-2 relative">
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type your message..."
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

    if (view === 'search') {
        return (
            <div className="max-w-md mx-auto h-[calc(100vh-8rem)] bg-slate-50 flex flex-col">
                <div className="bg-white p-4 shadow-sm border-b border-slate-200 flex items-center gap-3">
                    <button onClick={() => setView('list')} className="text-slate-500 hover:text-primary-500">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 relative">
                        <form onSubmit={handleSearch}>
                            <input
                                autoFocus
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search usernames..."
                                className="w-full bg-slate-100 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                            />
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <button hidden type="submit"></button>
                        </form>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isSearching ? (
                        <p className="text-center text-slate-400 mt-5">Searching...</p>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((u) => (
                            <div key={u.uid} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt={u.displayName} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                                    <h3 className="font-bold text-slate-800 text-sm">{u.displayName}</h3>
                                </div>
                                {u.connectionStatus === 'friend' ? (
                                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <Check size={14} /> Friend
                                    </span>
                                ) : u.connectionStatus === 'requested' ? (
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <Clock size={14} /> Requested
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => {
                                            sendRequest(u);
                                            // Optimistically update the UI to show requested state immediately
                                            setSearchResults(prev => prev.map(res => res.uid === u.uid ? { ...res, connectionStatus: 'requested' } : res));
                                        }}
                                        className="bg-primary-50 text-primary-600 p-2 rounded-lg hover:bg-primary-100 transition-colors"
                                        title="Send Peer Request"
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                )}
                            </div>
                        ))
                    ) : searchTerm && !isSearching ? (
                        <p className="text-center text-slate-400 mt-5 text-sm">No peers found. Try a different name.</p>
                    ) : (
                        <div className="text-center mt-10">
                            <Users size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 text-sm font-medium">Search for peers to start a safe chat.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'requests') {
        return (
            <div className="max-w-md mx-auto h-[calc(100vh-8rem)] bg-slate-50 flex flex-col">
                <div className="bg-white p-4 shadow-sm border-b border-slate-200 flex items-center gap-3">
                    <button onClick={() => setView('list')} className="text-slate-500 hover:text-primary-500">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-extrabold text-lg text-slate-800">Peer Requests</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {requests.length === 0 ? (
                        <div className="text-center mt-10">
                            <Clock size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 text-sm font-medium">You have no pending requests.</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-primary-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <img src={req.senderPhoto || `https://ui-avatars.com/api/?name=${req.senderName}`} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{req.senderName}</h3>
                                        <p className="text-xs text-slate-500">wants to connect with you securely.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => acceptRequest(req)}
                                        className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-1 hover:bg-emerald-600 transition-colors"
                                    >
                                        <Check size={16} /> Accept
                                    </button>
                                    <button
                                        onClick={() => declineRequest(req.id)}
                                        className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold flex justify-center items-center gap-1 hover:bg-slate-200 transition-colors"
                                    >
                                        <X size={16} /> Decline
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // LIST VIEW (Default)
    return (
        <div className="max-w-md mx-auto px-4 py-6 md:py-10 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Private Chat</h1>
                    <p className="text-slate-500 text-sm">Connect securely with your peers</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('search')}
                        className="bg-primary-50 text-primary-600 p-2.5 rounded-full shadow-sm hover:bg-primary-100 transition-colors"
                    >
                        <UserPlus size={20} />
                    </button>
                    <button
                        onClick={() => setView('requests')}
                        className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-full shadow-sm hover:bg-slate-50 transition-colors relative"
                    >
                        <Bell size={20} />
                        {requests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {requests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {conversations.length === 0 ? (
                    <div className="text-center mt-12 mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <MessageCircle size={48} className="mx-auto text-primary-200 mb-4" />
                        <h3 className="font-bold text-slate-700 mb-1">No Active Chats</h3>
                        <p className="text-sm text-slate-500">Tap the search icon to find users and send a request to start talking.</p>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const peer = getPeerInfo(conv);
                        return (
                            <motion.div
                                key={conv.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => { setActiveChat(conv); setView('room'); }}
                                className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 cursor-pointer flex items-center gap-4 hover:border-primary-200 hover:shadow-md transition-all group"
                            >
                                <img src={peer.photo} alt={peer.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 text-[15px] truncate group-hover:text-primary-600 transition-colors">{peer.name}</h3>
                                    <div className="flex items-center text-xs text-slate-400 font-medium gap-1">
                                        <ShieldCheck size={12} className="text-primary-400" /> Tap to open safe chat
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
