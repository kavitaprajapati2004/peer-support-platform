import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, MessageCircleHeart, Users, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function Home() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(15));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const temp = [];
            snapshot.forEach((doc) => {
                temp.push({ id: doc.id, ...doc.data() });
            });
            setNotifications(temp);
        });
        return unsubscribe;
    }, []);

    const lastSeenId = localStorage.getItem(`lastSeenNotif_${user?.uid || 'guest'}`);
    const unreadTypes = new Set();
    if (notifications.length > 0) {
        for (const notif of notifications) {
            if (notif.id === lastSeenId) break;
            if (notif.type) unreadTypes.add(notif.type);
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    // Extract first name (or display anonymous wrapper)
    const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'friend';

    return (
        <div className="max-w-md mx-auto px-4 py-6 md:py-10 space-y-8 min-h-[calc(100vh-4rem)] bg-slate-50">

            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-2">
                    <Shield size={14} className="text-primary-500" /> Safe Space Verified
                </div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    Hello, <span className="text-primary-500 capitalize">{firstName}</span> 👋
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Welcome to your private sanctuary. You are not alone. Express yourself, find support, or learn something new today.
                </p>
            </motion.div>

            {/* Quick Actions */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-4"
            >
                <motion.div variants={itemVariants} className="relative">
                    <Link to="/chat" className="block p-5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-primary-200 text-white hover:scale-105 transition-transform">
                        <MessageCircleHeart size={32} strokeWidth={1.5} className="mb-3" />
                        <h2 className="font-bold text-lg mb-1">Talk Privately</h2>
                        <p className="text-primary-100 text-xs">Message a peer or mentor</p>
                    </Link>
                    {unreadTypes.has('chat') && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce shadow-sm"></span>
                    )}
                </motion.div>

                <motion.div variants={itemVariants} className="relative">
                    <Link to="/groups" className="block p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-800 hover:border-primary-300 hover:shadow-md transition-all">
                        <Users size={32} strokeWidth={1.5} className="mb-3 text-secondary-500" />
                        <h2 className="font-bold text-lg mb-1">Join a Group</h2>
                        <p className="text-slate-400 text-xs">Discuss topics together</p>
                    </Link>
                    {unreadTypes.has('group') && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce shadow-sm"></span>
                    )}
                </motion.div>

                <motion.div variants={itemVariants} className="col-span-2 relative">
                    <Link to="/forum" className="flex items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary-300 hover:shadow-md transition-all h-full">
                        <div className="bg-orange-50 p-3 rounded-full mr-4">
                            <HelpCircle size={28} className="text-orange-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Support Forums</h2>
                            <p className="text-slate-500 text-xs">Ask questions, share experiences</p>
                        </div>
                    </Link>
                    {unreadTypes.has('forum') && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce shadow-sm"></span>
                    )}
                </motion.div>
            </motion.section>

            {/* Resources Highlights */}
            <motion.section
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Featured Resources</h2>
                    <Link to="/resources" className="text-primary-600 text-sm font-semibold flex items-center pr-1 hover:text-primary-700">
                        View All <ArrowRight size={16} className="ml-1" />
                    </Link>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                    {/* Card 1 */}
                    <Link to="/resources#menstruation" className="min-w-[200px] snap-center bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-28 bg-rose-100 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply"></div>
                            <span className="text-4xl">🩸</span>
                        </div>
                        <div className="p-3">
                            <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Health</span>
                            <h3 className="font-bold text-slate-800 text-sm mt-1">Periods & Puberty</h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">Your body is changing, and that's perfectly normal.</p>
                        </div>
                    </Link>
                    {/* Card 2 */}
                    <Link to="/resources#mental-health" className="min-w-[200px] snap-center bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-28 bg-emerald-100 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply"></div>
                            <span className="text-4xl">🧘‍♀️</span>
                        </div>
                        <div className="p-3">
                            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Wellbeing</span>
                            <h3 className="font-bold text-slate-800 text-sm mt-1">Mental Health 101</h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">Coping strategies for anxiety and school pressure.</p>
                        </div>
                    </Link>
                </div>
            </motion.section>
        </div>
    );
}

