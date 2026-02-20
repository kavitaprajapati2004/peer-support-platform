import { motion } from 'framer-motion';
import { BookOpen, Shield, HeartPulse, Brain, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Resources() {
    const navigate = useNavigate();
    const categories = [
        { title: "Menstruation & Health", icon: <HeartPulse className="text-rose-500" />, bg: "bg-rose-100", id: "menstruation" },
        { title: "Violence & Abuse", icon: <Shield className="text-indigo-500" />, bg: "bg-indigo-100", id: "violence" },
        { title: "Mental Wellbeing", icon: <Brain className="text-emerald-500" />, bg: "bg-emerald-100", id: "mental-health" },
        { title: "Rights & Empowerment", icon: <BookOpen className="text-amber-500" />, bg: "bg-amber-100", id: "rights" },
    ];

    return (
        <div className="max-w-md mx-auto px-4 py-8 bg-slate-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Knowledge Base</h1>
                <p className="text-slate-500 text-sm">Empower yourself with trusted, curated information.</p>
            </div>

            <div className="space-y-4">
                {categories.map((cat, i) => (
                    <motion.div
                        onClick={() => navigate(`/resources/${cat.id}`)}
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                    >
                        <div className={`w-12 h-12 rounded-full ${cat.bg} flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                            {cat.icon}
                        </div>
                        <div className="flex-1">
                            <h2 className="font-bold text-slate-800 text-lg group-hover:text-primary-600 transition-colors">{cat.title}</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Explore articles & guides</p>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border border-primary-200 text-center">
                <h3 className="font-bold text-primary-800 mb-2">Need immediate help?</h3>
                <p className="text-sm text-primary-600 mb-4 px-2">If you are in danger or need urgent support, please reach out to emergency services.</p>
                <button className="bg-white text-rose-600 font-bold py-2.5 px-6 rounded-full text-sm shadow-sm hover:shadow active:scale-95 transition-all w-full border border-rose-200 uppercase tracking-widest">
                    Emergency Call
                </button>
            </div>
        </div>
    );
}
