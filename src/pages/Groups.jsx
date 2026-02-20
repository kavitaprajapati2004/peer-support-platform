import { useState, useEffect } from 'react';
import { Users, Lock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, writeBatch, doc, updateDoc, arrayUnion, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Groups() {
    const { userData } = useAuth();
    const isAdmin = userData?.isAdmin === true;
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newGroupTitle, setNewGroupTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const groupsRef = collection(db, 'groups');
        const q = query(groupsRef, orderBy('members', 'desc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const tempGroups = [];
            snapshot.forEach((doc) => {
                tempGroups.push({ id: doc.id, ...doc.data() });
            });
            setGroups(tempGroups);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [loading]);

    return (
        <div className="max-w-md mx-auto px-4 py-6 md:py-10 space-y-6 bg-slate-50 min-h-screen">
            <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Safe Groups</h1>
                <p className="text-slate-500 text-sm">Join moderated discussions with peers</p>
            </div>

            {isAdmin && (
                <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 flex gap-2 shadow-sm">
                    <input
                        type="text"
                        value={newGroupTitle}
                        onChange={e => setNewGroupTitle(e.target.value)}
                        placeholder="Admin: New Group Title..."
                        className="flex-1 bg-white rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-primary-300 outline-none"
                    />
                    <button
                        disabled={!newGroupTitle.trim() || isAdding}
                        onClick={async () => {
                            if (!newGroupTitle.trim()) return;
                            setIsAdding(true);
                            try {
                                const newDocRef = doc(collection(db, 'groups'));
                                await writeBatch(db).set(newDocRef, { title: newGroupTitle, members: 0, active: true, memberIds: [] }).commit();
                                await addDoc(collection(db, 'notifications'), {
                                    message: `New support group "${newGroupTitle}" has been created!`,
                                    type: 'group',
                                    link: `/groups/${newDocRef.id}`,
                                    createdAt: serverTimestamp()
                                });
                                setNewGroupTitle('');
                            } catch (e) { console.error(e); }
                            setIsAdding(false);
                        }}
                        className="bg-primary-500 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-primary-600 disabled:opacity-50"
                    >
                        Create
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {groups.map((group, i) => (
                    <div
                        key={group.id || i}
                        className={`p-5 rounded-2xl border ${group.active ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-primary-300' : 'bg-slate-100 border-slate-200 opacity-60 backdrop-blur-sm'} transition-all`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h2 className={`font-bold text-lg ${group.active ? 'text-slate-800' : 'text-slate-500'}`}>{group.title}</h2>
                            {group.active ? (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Active
                                </span>
                            ) : (
                                <span className="bg-slate-200 text-slate-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex gap-1 items-center leading-none">
                                    <Lock size={10} /> Full
                                </span>
                            )}
                        </div>

                        <div className="flex items-center text-slate-500 text-xs font-medium mb-4 gap-1.5">
                            <Users size={14} className="text-primary-400" /> {group.memberIds?.length || group.members || 0} Members
                        </div>

                        <button
                            disabled={!group.active}
                            onClick={async () => {
                                if (!group.active) return;
                                if (!group.memberIds?.includes(userData?.uid)) {
                                    try {
                                        await updateDoc(doc(db, 'groups', group.id), {
                                            memberIds: arrayUnion(userData.uid)
                                        });
                                    } catch (e) { console.error(e) }
                                }
                                navigate(`/groups/${group.id}`);
                            }}
                            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors uppercase tracking-wider
                ${group.active
                                    ? 'bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-500 hover:text-white hover:border-transparent cursor-pointer'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-transparent'
                                }`}
                        >
                            {group.active ? (group.memberIds?.includes(userData?.uid) ? 'Open Chat' : 'Join Group') : 'Group Full'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
