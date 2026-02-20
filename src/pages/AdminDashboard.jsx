import { useState, useEffect } from 'react';
import { ShieldCheck, Users, MessageSquare, Trash2, Edit2, Plus, UserCog } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const isAdmin = userData?.isAdmin === true;

    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }

        // Listen to Users
        const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Listen to Groups
        const unsubGroups = onSnapshot(collection(db, 'groups'), snap => {
            setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Listen to Forum Posts
        const unsubPosts = onSnapshot(collection(db, 'forumPosts'), snap => {
            setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubUsers();
            unsubGroups();
            unsubPosts();
        };
    }, [isAdmin, navigate]);

    if (!isAdmin) return null;

    const handleDeleteUser = async (uid) => {
        if (window.confirm("Are you sure you want to remove this user profile?")) {
            await deleteDoc(doc(db, 'users', uid));
        }
    };

    const handleToggleAdmin = async (id, currentStatus) => {
        if (window.confirm(`Are you sure you want to make this user ${!currentStatus ? 'an Admin' : 'a regular User'}?`)) {
            await updateDoc(doc(db, 'users', id), { isAdmin: !currentStatus });
        }
    };

    const handleDeleteGroup = async (id) => {
        if (window.confirm("Delete this group completely?")) {
            await deleteDoc(doc(db, 'groups', id));
        }
    };

    const handleAddGroup = async () => {
        const title = window.prompt("Enter new group title:");
        if (title && title.trim()) {
            const docRef = await addDoc(collection(db, 'groups'), { title: title.trim(), members: 0, active: true, memberIds: [] });
            await addDoc(collection(db, 'notifications'), {
                message: `New support group "${title.trim()}" has been created!`,
                type: 'group',
                link: `/groups/${docRef.id}`,
                createdAt: serverTimestamp()
            });
        }
    };

    const handleEditGroup = async (id, currentTitle) => {
        const newTitle = window.prompt("Edit group title:", currentTitle);
        if (newTitle && newTitle.trim() && newTitle !== currentTitle) {
            await updateDoc(doc(db, 'groups', id), { title: newTitle.trim() });
        }
    };

    const handleDeletePost = async (id) => {
        if (window.confirm("Delete this post?")) {
            await deleteDoc(doc(db, 'forumPosts', id));
        }
    };

    const handleEditPost = async (id, currentTitle) => {
        const newTitle = window.prompt("Edit post title:", currentTitle);
        if (newTitle && newTitle.trim() && newTitle !== currentTitle) {
            await updateDoc(doc(db, 'forumPosts', id), { title: newTitle.trim() });
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-6 md:py-10 bg-slate-50 min-h-screen pb-24">
            <div className="mb-6 border-b border-primary-200 pb-4">
                <div className="flex items-center gap-2 mb-1 text-primary-600">
                    <ShieldCheck size={28} />
                    <h1 className="text-2xl font-extrabold tracking-tight">Admin Console</h1>
                </div>
                <p className="text-slate-500 text-sm">Manage users, groups, and content</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                    <Users size={20} className="mx-auto text-primary-500 mb-1" />
                    <div className="text-lg font-bold text-slate-800">{users.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Users</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                    <ShieldCheck size={20} className="mx-auto text-emerald-500 mb-1" />
                    <div className="text-lg font-bold text-slate-800">{groups.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Groups</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
                    <MessageSquare size={20} className="mx-auto text-blue-500 mb-1" />
                    <div className="text-lg font-bold text-slate-800">{posts.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Posts</div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Users Section */}
                <section>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                        <h2 className="text-lg font-bold text-slate-700">Registered Users</h2>
                    </div>
                    <div className="space-y-2">
                        {users.map(u => (
                            <div key={u.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt="pic" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                                    <div>
                                        <p className="font-bold text-sm text-slate-800 leading-tight">{u.displayName}</p>
                                        <p className="text-xs text-slate-400">{u.isAdmin ? <span className="text-emerald-500 font-bold">Admin</span> : 'User'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleToggleAdmin(u.id, u.isAdmin)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100" title="Toggle Admin">
                                        <UserCog size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100" title="Delete User">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Groups Section */}
                <section>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                        <h2 className="text-lg font-bold text-slate-700">Active Groups</h2>
                        <button onClick={handleAddGroup} className="text-xs font-bold bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-primary-100">
                            <Plus size={14} /> Add Group
                        </button>
                    </div>
                    <div className="space-y-2">
                        {groups.map(g => (
                            <div key={g.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                                <div>
                                    <p className="font-bold text-sm text-slate-800">{g.title}</p>
                                    <p className="text-xs text-slate-400">{g.memberIds?.length || g.members || 0} Members</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditGroup(g.id, g.title)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Edit Group">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteGroup(g.id)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100" title="Delete Group">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Posts Section */}
                <section>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                        <h2 className="text-lg font-bold text-slate-700">Forum Posts</h2>
                    </div>
                    <div className="space-y-2">
                        {posts.map(p => (
                            <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-2 justify-between shadow-sm">
                                <div className="flex-1 truncate pr-2">
                                    <p className="font-bold text-sm text-slate-800 truncate">{p.title}</p>
                                    <p className="text-[10px] bg-slate-100 inline-block px-2 py-0.5 rounded text-slate-500 font-bold">{p.topic}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditPost(p.id, p.title)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Edit Post">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeletePost(p.id)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 whitespace-nowrap" title="Delete Post">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
