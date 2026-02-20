import { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, HelpCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Forum() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [isPosting, setIsPosting] = useState(false);
    const [likingPosts, setLikingPosts] = useState(new Set());

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const topics = ['Periods & Puberty', 'Mental Health Support', 'School Pressure', 'Violence & Rights'];
    const [topic, setTopic] = useState(topics[0]);

    useEffect(() => {
        const q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tempPosts = [];
            snapshot.forEach((doc) => {
                tempPosts.push({ id: doc.id, ...doc.data() });
            });
            setPosts(tempPosts);
        });
        return unsubscribe;
    }, []);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        try {
            const docRef = await addDoc(collection(db, 'forumPosts'), {
                title,
                content,
                topic,
                author: user?.displayName || 'Anonymous',
                authorId: user?.uid,
                likes: 0,
                likedBy: [],
                comments: 0,
                // Assign a color dynamically based on topic
                color: topic === 'Periods & Puberty' ? 'rose' : topic === 'Mental Health Support' ? 'emerald' : 'blue',
                createdAt: serverTimestamp()
            });

            await addDoc(collection(db, 'notifications'), {
                message: `${user?.displayName || 'Someone'} created a new post: "${title}"`,
                type: 'forum',
                link: `/forum/${docRef.id}`,
                createdAt: serverTimestamp()
            });

            setIsPosting(false);
            setTitle('');
            setContent('');
            setTopic('Periods & Puberty');
        } catch (error) {
            console.error("Error adding post: ", error);
        }
    };

    const handleLike = async (postId, likedBy) => {
        if (!user || likingPosts.has(postId)) return;

        setLikingPosts(prev => {
            const next = new Set(prev);
            next.add(postId);
            return next;
        });

        try {
            const hasLiked = likedBy && likedBy.includes(user.uid);
            const postRef = doc(db, 'forumPosts', postId);
            await updateDoc(postRef, {
                likes: increment(hasLiked ? -1 : 1),
                likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });
        } finally {
            setLikingPosts(prev => {
                const next = new Set(prev);
                next.delete(postId);
                return next;
            });
        }
    };

    const filteredPosts = activeTab === 'All' ? posts : posts.filter(p => p.topic === activeTab);

    return (
        <div className="max-w-md mx-auto px-4 py-6 md:py-10 bg-slate-50 min-h-screen relative">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Community</h1>
                    <p className="text-slate-500 text-sm">Ask anonymously, get support</p>
                </div>
                {!isPosting && (
                    <button
                        onClick={() => {
                            setIsPosting(true);
                            setTopic(activeTab === 'All' ? topics[0] : activeTab);
                        }}
                        className="bg-primary-500 hover:bg-primary-600 text-white p-2.5 rounded-full shadow-md shadow-primary-200 transition-colors"
                    >
                        <HelpCircle size={24} />
                    </button>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-4">
                <button
                    onClick={() => setActiveTab('All')}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'All'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    All Discussions
                </button>
                {topics.map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === t
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {isPosting && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handlePost}
                        className="bg-white p-5 rounded-2xl border border-primary-100 shadow-md mb-6 overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Create a Post</h3>
                            <button type="button" onClick={() => setIsPosting(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full mb-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                        />
                        <textarea
                            placeholder="Share your experience or ask a question..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={3}
                            className="w-full mb-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                        />
                        <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
                            {topics.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTopic(t)}
                                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${topic === t
                                        ? 'bg-primary-500 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={!title.trim() || !content.trim()}
                            className="w-full bg-primary-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500 transition-colors"
                        >
                            <Send size={16} /> Post
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="space-y-4">
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
                        <MessageCircle size={48} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-slate-500 font-medium">No posts in this category yet.</p>
                        <p className="text-slate-400 text-sm mt-1">Be the first to ask a question!</p>
                    </div>
                ) : (
                    filteredPosts.map((post, i) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 border border-slate-200">
                                        {post.author ? post.author[0].toUpperCase() : 'A'}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700">{post.author}</h3>
                                        <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded mt-0.5 bg-${post.color || 'slate'}-50 text-${post.color || 'slate'}-600 border border-${post.color || 'slate'}-100`}>
                                            {post.topic}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h2 className="font-bold text-slate-800 mb-1 leading-tight">{post.title}</h2>
                            <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">{post.content}</p>

                            <div className="flex border-t border-slate-50 pt-3 gap-6 text-slate-400 text-sm font-medium">
                                <button
                                    onClick={() => handleLike(post.id, post.likedBy)}
                                    disabled={likingPosts.has(post.id)}
                                    className={`flex items-center gap-1.5 transition-colors ${likingPosts.has(post.id) ? 'opacity-50' : ''} ${post.likedBy?.includes(user?.uid) ? 'text-primary-500' : 'hover:text-primary-400'}`}
                                >
                                    <ThumbsUp size={16} /> {post.likedBy ? post.likedBy.length : (post.likes || 0)}
                                </button>
                                <button
                                    onClick={() => navigate(`/forum/${post.id}`)}
                                    className="flex items-center gap-1.5 hover:text-primary-500 transition-colors"
                                >
                                    <MessageCircle size={16} /> {post.comments}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
