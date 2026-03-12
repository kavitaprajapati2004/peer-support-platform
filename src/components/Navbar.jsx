import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HeartHandshake, Bell, LogOut, ArrowLeft, ShieldCheck, Users, MessageSquare, Home, MessageCircleHeart, LayoutList, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function Navbar() {
    const { user, userData, signInWithGoogle, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef();

    const lastSeenId = localStorage.getItem(`lastSeenNotif_${user?.uid || 'guest'}`);
    let hasUnread = false;
    const unreadTypes = new Set();

    if (notifications.length > 0) {
        for (const notif of notifications) {
            if (notif.id === lastSeenId) break;
            if (notif.type) unreadTypes.add(notif.type);
        }
        if (notifications[0].id !== lastSeenId) {
            hasUnread = true;
        }
    }

    const showBack = location.pathname !== '/';

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleNotifications = () => {
        if (!showNotifications && notifications.length > 0) {
            localStorage.setItem(`lastSeenNotif_${user?.uid || 'guest'}`, notifications[0].id);
            window.dispatchEvent(new Event('notificationsRead'));
        }
        setShowNotifications(!showNotifications);
    };

    const navItems = [
        { name: 'Home', icon: Home, path: '/' },
        { name: 'Groups', icon: Users, path: '/groups', notifType: 'group' },
        { name: 'Chat', icon: MessageCircleHeart, path: '/chat', notifType: 'chat' },
        { name: 'Forum', icon: LayoutList, path: '/forum', notifType: 'forum' },
        { name: 'Docs', icon: BookOpen, path: '/resources' },
    ];

    return (
        <nav className="fixed top-0 w-full bg-white border-b border-primary-100 shadow-sm z-50">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {showBack && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-slate-500 hover:text-primary-500 hover:bg-primary-50 rounded-full transition-colors md:hidden"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <Link to="/" className="flex items-center gap-2">
                        {!showBack && (
                            <div className="bg-primary-500 text-white p-1.5 rounded-xl shadow-inner">
                                <HeartHandshake size={24} />
                            </div>
                        )}
                        <span className="font-bold text-lg text-slate-800 tracking-tight">Safespace</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center ml-8 gap-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const itemHasUnread = item.notifType && unreadTypes.has(item.notifType);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all relative flex items-center gap-2
                                        ${isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-500 hover:text-primary-500 hover:bg-slate-50'}`}
                                >
                                    <item.icon size={18} className={isActive ? 'stroke-primary-600' : ''} />
                                    {item.name}
                                    {itemHasUnread && (
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-2 sm:gap-4 items-center">

                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={handleToggleNotifications}
                            className="text-slate-500 hover:text-primary-500 transition-colors relative p-2 rounded-full hover:bg-slate-50"
                            title="Notifications"
                        >
                            <Bell size={22} />
                            {hasUnread && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-50 rounded-full border-2 border-rose-500">
                                    <span className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-75"></span>
                                    <span className="absolute inset-0 bg-rose-500 rounded-full"></span>
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-3 w-[280px] sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 tracking-tight">Recent Activity</h3>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-sm">
                                            No new updates right now!
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => {
                                                    setShowNotifications(false);
                                                    navigate(notif.link);
                                                }}
                                                className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 items-start"
                                            >
                                                <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'group' ? 'bg-emerald-100 text-emerald-500' : 'bg-primary-100 text-primary-500'}`}>
                                                    {notif.type === 'group' ? <Users size={16} /> : <MessageSquare size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-700 leading-snug">{notif.message}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                                                        {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {userData?.isAdmin === true && (
                        <Link to="/admin" className="text-emerald-500 hover:text-emerald-600 transition-colors p-2 rounded-full hover:bg-slate-50" title="Admin Dashboard">
                            <ShieldCheck size={29} />
                        </Link>
                    )}

                    {user ? (
                        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                            <img
                                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=fbcfe8&color=be185d`}
                                alt="Profile"
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full border border-primary-200 object-cover shadow-sm"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=fbcfe8&color=be185d`;
                                }}
                            />
                            <button
                                onClick={logout}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                title="Log out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={signInWithGoogle}
                            className="ml-2 bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-primary-600 shadow-md shadow-primary-100 transition-all"
                        >
                            Log in
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

