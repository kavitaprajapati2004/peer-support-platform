import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, ThumbsUp, Send, Trash2, Edit2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function ForumPost() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLiking, setIsLiking] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');

    useEffect(() => {
        if (!id) return;
        const unsub = onSnapshot(doc(db, 'forumPosts', id), (docSnap) => {
            if (docSnap.exists()) {
                setPost({ id: docSnap.id, ...docSnap.data() });
            } else {
                navigate('/forum');
            }
        });
        return unsub;
    }, [id, navigate]);

    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, 'forumPosts', id, 'comments'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const temp = [];
            snapshot.forEach((doc) => {
                temp.push({ id: doc.id, ...doc.data() });
            });
            setComments(temp);
        });
        return unsubscribe;
    }, [id]);

    const handleLike = async () => {
        if (!user || !post || isLiking) return;
        setIsLiking(true);
        try {
            const hasLiked = post.likedBy && post.likedBy.includes(user.uid);
            const postRef = doc(db, 'forumPosts', id);
            await updateDoc(postRef, {
                likes: increment(hasLiked ? -1 : 1),
                likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });
        } finally {
            setIsLiking(false);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user || !post) return;

        const text = newComment;
        setNewComment('');

        try {
            await addDoc(collection(db, 'forumPosts', id, 'comments'), {
                text,
                author: user.displayName || 'Anonymous',
                authorId: user.uid,
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'forumPosts', id), {
                comments: increment(1)
            });
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!user || !window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await deleteDoc(doc(db, 'forumPosts', id, 'comments', commentId));
            await updateDoc(doc(db, 'forumPosts', id), {
                comments: increment(-1)
            });
        } catch (error) {
            console.error("Error deleting comment: ", error);
        }
    };

    const handleSaveEdit = async (commentId) => {
        if (!user || !editCommentText.trim()) return;
        try {
            await updateDoc(doc(db, 'forumPosts', id, 'comments', commentId), {
                text: editCommentText.trim()
            });
            setEditingCommentId(null);
            setEditCommentText('');
        } catch (error) {
            console.error("Error updating comment: ", error);
        }
    };

    if (!post) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-md mx-auto bg-slate-50 relative">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center sticky top-0 z-10 shadow-sm cursor-pointer hover:bg-slate-50" onClick={() => navigate('/forum')}>
                <button className="p-1 -ml-2 text-slate-500 hover:text-primary-500 rounded-full mr-2">
                    <ArrowLeft size={22} />
                </button>
                <h2 className="font-bold text-slate-800 text-[15px]">Discussion</h2>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
                {/* Main Post Content */}
                <div className="bg-white p-5 border-b border-slate-200 shadow-sm mb-3">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 border border-slate-200">
                            {post.author ? post.author[0].toUpperCase() : 'A'}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{post.author}</h3>
                            <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded mt-0.5 bg-${post.color || 'slate'}-50 text-${post.color || 'slate'}-600 border border-${post.color || 'slate'}-100`}>
                                {post.topic}
                            </span>
                        </div>
                    </div>

                    <h1 className="text-xl font-bold text-slate-900 mb-2 leading-snug">{post.title}</h1>
                    <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    <div className="flex mt-6 gap-6 text-slate-400 text-sm font-medium">
                        <button
                            onClick={handleLike}
                            disabled={isLiking}
                            className={`flex items-center gap-1.5 transition-colors ${isLiking ? 'opacity-50' : ''} ${post.likedBy?.includes(user?.uid) ? 'text-primary-500' : 'hover:text-primary-400'}`}
                        >
                            <ThumbsUp size={16} /> {post.likedBy ? post.likedBy.length : (post.likes || 0)}
                        </button>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <MessageCircle size={16} /> {post.comments || 0} Responses
                        </div>
                    </div>
                </div>

                {/* Comments List */}
                <div className="px-4 space-y-3">
                    {comments.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm mt-6">No comments yet. Be the first to reply!</p>
                    ) : (
                        comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                        {comment.author ? comment.author[0].toUpperCase() : 'A'}
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-700">{comment.author}</h4>
                                    <span className="text-[10px] text-slate-400 ml-auto flex-shrink-0">
                                        {comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                                    </span>
                                </div>
                                {editingCommentId === comment.id ? (
                                    <div className="mt-2 pl-8 pr-2">
                                        <textarea
                                            value={editCommentText}
                                            onChange={(e) => setEditCommentText(e.target.value)}
                                            rows={2}
                                            className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none text-slate-600"
                                        />
                                        <div className="flex gap-2 justify-end mt-2">
                                            <button
                                                onClick={() => setEditingCommentId(null)}
                                                className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSaveEdit(comment.id)}
                                                disabled={!editCommentText.trim() || editCommentText === comment.text}
                                                className="px-3 py-1 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-lg disabled:opacity-50 transition-colors"
                                            >
                                                Save Edit
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-slate-600 pl-8 leading-relaxed whitespace-pre-wrap">
                                            {comment.text}
                                        </p>
                                        {user && user.uid === comment.authorId && (
                                            <div className="flex gap-4 mt-2 ml-8">
                                                <button
                                                    onClick={() => {
                                                        setEditingCommentId(comment.id);
                                                        setEditCommentText(comment.text);
                                                    }}
                                                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-500 font-medium transition-colors"
                                                >
                                                    <Edit2 size={12} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-600 font-medium transition-colors"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Comment Input */}
            <div className="p-3 bg-white border-t border-slate-200 mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <form onSubmit={handleComment} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a supportive comment..."
                        className="flex-1 bg-slate-100 rounded-full px-5 py-3 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute right-1.5 top-1.5 w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-50 hover:bg-primary-600 transition-colors disabled:hover:bg-primary-500"
                    >
                        <Send size={16} className="ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
