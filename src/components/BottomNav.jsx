import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, MessageCircleHeart, LayoutList, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function BottomNav() {
    const location = useLocation();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [lastSeenId, setLastSeenId] = useState(localStorage.getItem(`lastSeenNotif_${user?.uid || 'guest'}`));

    useEffect(() => {
        const handleRead = () => setLastSeenId(localStorage.getItem(`lastSeenNotif_${user?.uid || 'guest'}`));
        window.addEventListener('notificationsRead', handleRead);
        handleRead(); 
        return () => window.removeEventListener('notificationsRead', handleRead);
    }, [user?.uid]);

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

    const unreadTypes = new Set();
    if (notifications.length > 0) {
        for (const notif of notifications) {
            if (notif.id === lastSeenId) break;
            if (notif.type) unreadTypes.add(notif.type);
        }
    }

    const navItems = [
        { name: 'Home', icon: Home, path: '/' },
        { name: 'Groups', icon: Users, path: '/groups', notifType: 'group' },
        { name: 'Chat', icon: MessageCircleHeart, path: '/chat', notifType: 'chat' },
        { name: 'Forum', icon: LayoutList, path: '/forum', notifType: 'forum' },
        { name: 'Docs', icon: BookOpen, path: '/resources' },
    ];

    return (
        <div className="fixed bottom-0 w-full bg-white border-t border-slate-200 safe-area-bottom md:hidden z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const hasUnread = item.notifType && unreadTypes.has(item.notifType);

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all relative
                ${isActive ? 'text-primary-500' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <div className="relative">
                                <item.icon size={24} className={isActive ? 'fill-primary-50 stroke-primary-500' : ''} />
                                {hasUnread && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                                )}
                            </div>
                            <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
