import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Search, UserPlus, Check, X, MessageCircle, ArrowLeft, ShieldCheck, Clock, Users, Bell, Image as ImageIcon, Reply, Forward, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, doc, deleteDoc, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
    const { user } = useAuth();
    const [view, setView] = useState('list'); 

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [requests, setRequests] = useState([]);
    const [conversations, setConversations] = useState([]);

    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const endRef = useRef(null);

    // Advanced Chat States
    const [replyingTo, setReplyingTo] = useState(null);
    const [forwardingMsg, setForwardingMsg] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const convQ = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
        const unsubConv = onSnapshot(convQ, (snap) => {
            const arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            arr.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
            setConversations(arr);
        });

       
        const reqQ = query(collection(db, 'requests'), where('receiverId', '==', user.uid), where('status', '==', 'pending'));
        const unsubReq = onSnapshot(reqQ, (snap) => {
            setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubConv(); unsubReq(); };
    }, [user]);

  
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

   
    useEffect(() => {
        if (!user) return;
        const outReqQ = query(collection(db, 'requests'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
        const unsub = onSnapshot(outReqQ, (snap) => {
            setSentRequests(snap.docs.map(doc => doc.data().receiverId));
        });
        return () => unsub();
    }, [user]);

    const handleSearchChange = async (e) => {
        const queryText = e.target.value;
        setSearchTerm(queryText);
        setShowDropdown(true);
        
        if (!queryText.trim() || !user) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const results = [];

            const friendIds = conversations.map(c => c.participants.find(id => id !== user.uid));

            usersSnap.forEach(docSnap => {
                const u = docSnap.data();

                if (u.uid !== user.uid &&
                    (u.searchName?.includes(queryText.toLowerCase()) || u.displayName?.toLowerCase().includes(queryText.toLowerCase()))) {

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

    const sendMessage = async (e, imageUrl = null) => {
        if (e) e.preventDefault();
        if ((!messageInput.trim() && !imageUrl) || !user || !activeChat) return;

        const text = messageInput;
        setMessageInput('');
        
        const replyData = replyingTo ? { id: replyingTo.id, text: replyingTo.text, senderId: replyingTo.senderId } : null;
        setReplyingTo(null);

        try {
            const msgRef = collection(db, 'conversations', activeChat.id, 'messages');
            await addDoc(msgRef, {
                text,
                senderId: user.uid,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: serverTimestamp(),
                replyTo: replyData,
                imageUrl: imageUrl || null,
                isForwarded: false,
                isDeleted: false
            });
            await updateDoc(doc(db, 'conversations', activeChat.id), {
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending:", error);
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !user || !activeChat) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `chat_images/${activeChat.id}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            await sendMessage(null, url);
        } catch (error) {
            console.error("Error uploading image:", error);
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteForMe = async (msgId) => {
        await updateDoc(doc(db, 'conversations', activeChat.id, 'messages', msgId), {
            deletedFor: arrayUnion(user.uid)
        });
        setSelectedMessageId(null);
    };

    const handleDeleteForEveryone = async (msgId) => {
        await updateDoc(doc(db, 'conversations', activeChat.id, 'messages', msgId), {
            isDeleted: true,
            text: 'This message was deleted'
        });
        setSelectedMessageId(null);
    };

    const handleForwardSend = async (targetConv) => {
        if (!forwardingMsg || !user) return;
        try {
            const msgRef = collection(db, 'conversations', targetConv.id, 'messages');
            await addDoc(msgRef, {
                text: forwardingMsg.text,
                senderId: user.uid,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: serverTimestamp(),
                imageUrl: forwardingMsg.imageUrl || null,
                isForwarded: true,
                isDeleted: false
            });
            await updateDoc(doc(db, 'conversations', targetConv.id), {
                updatedAt: serverTimestamp()
            });
            setForwardingMsg(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReply = (msg) => {
        setReplyingTo(msg);
    };

    const getPeerInfo = (chat) => {
        if (!user || !chat) return { name: 'Unknown', photo: '' };
        const peerId = chat.participants.find(id => id !== user.uid);
        return {
            name: chat.participantNames?.[peerId] || 'User',
            photo: chat.participantPhotos?.[peerId] || `https://ui-avatars.com/api/?name=${chat.participantNames?.[peerId] || 'U'}`
        };
    };

   

    if (view === 'room' && activeChat) {
        const peer = getPeerInfo(activeChat);
        return (
            <div className="flex flex-col h-[calc(100vh-8rem)] max-w-md mx-auto bg-slate-50 relative">
               
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

              
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" onClick={() => setSelectedMessageId(null)}>
                    {messages.length === 0 && (
                        <div className="text-center mt-10 text-slate-400 text-sm">
                            <ShieldCheck size={40} className="mx-auto text-slate-200 mb-2" />
                            <p>You are now connected.</p>
                            <p>Say hello to your peer!</p>
                        </div>
                    )}
                    <AnimatePresence>
                        {messages.map((msg, i) => {
                            if (msg.deletedFor?.includes(user?.uid)) return null;
                            const isMe = msg.senderId === user?.uid;
                            const showOptions = selectedMessageId === msg.id;
                            
                            return (
                                <motion.div
                                    key={msg.id || i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`flex flex-col relative group ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                                >
                                    <div className={`p-2 rounded-2xl shadow-sm text-[15px] leading-relaxed relative max-w-[85%] min-w-[120px] cursor-pointer ${
                                        msg.isDeleted ? 'bg-slate-100 text-slate-400 italic border border-slate-200' :
                                        isMe ? 'bg-primary-500 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                                    }`} onClick={(e) => { e.stopPropagation(); setSelectedMessageId(showOptions ? null : msg.id); }}>
                                        
                                        {!msg.isDeleted && msg.isForwarded && (
                                            <div className={`text-[10px] mb-1 flex items-center gap-1 font-bold ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                                                <Forward size={10} /> Forwarded
                                            </div>
                                        )}
                                        {!msg.isDeleted && msg.replyTo && (
                                            <div className={`text-xs p-2 mb-2 rounded-lg border-l-4 ${isMe ? 'bg-primary-600/50 border-primary-200' : 'bg-slate-50 border-primary-400 text-slate-500'}`}>
                                                <p className="font-bold text-[10px] mb-0.5">{msg.replyTo.senderId === user.uid ? 'You' : peer.name}</p>
                                                <p className="line-clamp-2 truncate">{msg.replyTo.text || 'Photo'}</p>
                                            </div>
                                        )}
                                        {!msg.isDeleted && msg.imageUrl && (
                                            <img src={msg.imageUrl} alt="attached" className="rounded-xl w-full max-w-[240px] mb-1 object-cover" loading="lazy" />
                                        )}
                                        
                                        <div className="flex flex-wrap items-end justify-between gap-2">
                                            <span>{msg.text}</span>
                                            <span className={`text-[10px] select-none float-right mt-1.5 ${msg.isDeleted ? 'text-slate-400' : isMe ? 'text-primary-100' : 'text-slate-400'}`}>{msg.time}</span>
                                        </div>
                                    </div>

                                    {/* Message Options Modal */}
                                    {showOptions && !msg.isDeleted && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`absolute z-30 flex gap-1 p-1 bg-white rounded-xl shadow-xl border border-slate-100 top-full mt-1 ${isMe ? 'right-0' : 'left-0'}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button onClick={() => { handleReply(msg); setSelectedMessageId(null); }} className="p-2 text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-lg" title="Reply">
                                                <Reply size={16} />
                                            </button>
                                            <button onClick={() => { setForwardingMsg(msg); setSelectedMessageId(null); }} className="p-2 text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-lg" title="Forward">
                                                <Forward size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteForMe(msg.id)} className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete for me">
                                                <Trash2 size={16} />
                                            </button>
                                            {isMe && (
                                                <button onClick={() => handleDeleteForEveryone(msg.id)} className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border-l border-slate-100 ml-1 pl-3 font-bold text-xs whitespace-nowrap" title="Delete for everyone">
                                                    Delete for everyone
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={endRef} />
                </div>

               
                <div className="bg-white border-t border-slate-200 mt-auto flex flex-col relative">
                    {replyingTo && (
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center relative">
                            <div className="border-l-4 border-primary-500 pl-3">
                                <p className="text-xs font-bold text-primary-600 mb-0.5">Replying to {replyingTo.senderId === user.uid ? 'yourself' : peer.name}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[250px]">{replyingTo.text || 'Image'}</p>
                            </div>
                            <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    
                    <form onSubmit={(e) => sendMessage(e)} className="p-3 flex gap-2 items-end">
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="p-3 text-slate-400 hover:text-primary-500 bg-slate-100 rounded-full transition-colors disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                        </button>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                        />
                        <div className="flex-1 bg-slate-100 rounded-2xl flex relative overflow-hidden">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type a message..."
                                className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={(!messageInput.trim() && !isUploading) || isUploading}
                            className="w-11 h-11 shrink-0 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-50 hover:bg-primary-600 transition-colors"
                        >
                            <Send size={18} className="translate-x-[1px]" />
                        </button>
                    </form>
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

   
    return (
        <div className="max-w-md mx-auto px-4 py-6 md:py-10 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Private Chat</h1>
                    <p className="text-slate-500 text-sm">Connect securely with your peers</p>
                </div>
                <div className="flex gap-2">
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

            {/* Smart Search Bar */}
            <div className="mb-6 relative z-20">
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search users to connect..."
                        className="w-full bg-white pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 shadow-sm transition-shadow"
                    />
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    {searchTerm && (
                        <button 
                            onClick={() => { setSearchTerm(''); setSearchResults([]); setShowDropdown(false); }}
                            className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Dropdown Suggestions */}
                {searchTerm && showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-72 overflow-y-auto">
                        {isSearching ? (
                            <div className="p-5 text-center text-slate-400 text-sm font-medium">Searching...</div>
                        ) : searchResults.length > 0 ? (
                            <div className="p-2 space-y-1">
                                {searchResults.map((u) => (
                                    <div 
                                        key={u.uid} 
                                        onClick={async () => {
                                            if (u.connectionStatus === 'friend') {
                                                setShowDropdown(false);
                                                setSearchTerm('');
                                                const existingConv = conversations.find(c => c.participants.includes(u.uid));
                                                if (existingConv) {
                                                    setActiveChat(existingConv);
                                                    setView('room');
                                                }
                                            } else {
                                                // If not a friend, just keep dropdown open or update search text
                                                setSearchTerm(u.displayName);
                                            }
                                        }}
                                        className="bg-white p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt={u.displayName} className="w-10 h-10 rounded-full object-cover border border-slate-100" referrerPolicy="no-referrer" />
                                            <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">{u.displayName}</h3>
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    sendRequest(u);
                                                    setSearchResults(prev => prev.map(res => res.uid === u.uid ? { ...res, connectionStatus: 'requested' } : res));
                                                    setShowDropdown(false);
                                                }}
                                                className="bg-primary-50 text-primary-600 p-2 rounded-lg hover:bg-primary-100 transition-colors"
                                                title="Send Peer Request"
                                            >
                                                <UserPlus size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-5 text-center text-slate-400 text-sm font-medium">No results found for "{searchTerm}"</div>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {conversations.length === 0 ? (
                    <div className="text-center mt-12 mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <MessageCircle size={48} className="mx-auto text-primary-200 mb-4" />
                        <h3 className="font-bold text-slate-700 mb-1">No Active Chats</h3>
                        <p className="text-sm text-slate-500">Search above to find users and send a request to start talking.</p>
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

            {/* Forward Modal */}
            <AnimatePresence>
                {forwardingMsg && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setForwardingMsg(null)}>
                        <motion.div 
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-md p-5 rounded-t-3xl sm:rounded-3xl shadow-2xl h-[70vh] sm:h-[500px] flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-extrabold text-slate-800 text-lg">Forward Message</h2>
                                <button onClick={() => setForwardingMsg(null)} className="p-2 text-slate-400 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-sm text-slate-600 line-clamp-2 italic">
                                "{forwardingMsg.text || 'Image Attached'}"
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {conversations.length === 0 ? (
                                    <p className="text-center text-slate-400 mt-10">No peers to forward to.</p>
                                ) : conversations.map(c => {
                                    const peerInfo = getPeerInfo(c);
                                    return (
                                        <div key={c.id} onClick={() => handleForwardSend(c)} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-primary-200 cursor-pointer transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <img src={peerInfo.photo} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                                                <span className="font-bold text-slate-800 text-sm">{peerInfo.name}</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-500 flex justify-center items-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                                <Forward size={14} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
