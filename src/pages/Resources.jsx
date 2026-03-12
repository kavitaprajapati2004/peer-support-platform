import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Shield, HeartPulse, Brain, ChevronRight, Phone, AlertCircle, X, Copy, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Resources() {
    const navigate = useNavigate();
    const categories = [
        { title: "Menstruation & Health", icon: <HeartPulse className="text-rose-500" />, bg: "bg-rose-100", id: "menstruation" },
        { title: "Violence & Abuse", icon: <Shield className="text-indigo-500" />, bg: "bg-indigo-100", id: "violence" },
        { title: "Mental Wellbeing", icon: <Brain className="text-emerald-500" />, bg: "bg-emerald-100", id: "mental-health" },
        { title: "Rights & Empowerment", icon: <BookOpen className="text-amber-500" />, bg: "bg-amber-100", id: "rights" },
    ];

    const [showEmergency, setShowEmergency] = useState(false);
    const [copiedNumber, setCopiedNumber] = useState(null);

    const emergencyContacts = [
        { name: "National Emergency Number", number: "112", desc: "For all immediate emergencies" },
        { name: "Women Helpline (All India)", number: "1091", desc: "Women in distress" },
        { name: "Domestic Abuse Helpline", number: "181", desc: "Support against domestic violence" },
        { name: "Student/Mental Health Crisis", number: "14499", desc: "KIRAN mental health helpline" }
    ];

    const handleEmergencyCall = () => {
        // Attempt to trigger the native dialer instantly with the primary number
        window.location.href = 'tel:112';
        // Display the modal as a fallback or for providing alternative numbers
        setShowEmergency(true);
    };

    const copyToClipboard = async (number) => {
        try {
            await navigator.clipboard.writeText(number);
            setCopiedNumber(number);
            setTimeout(() => setCopiedNumber(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

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

            <div className="mt-8 p-6 bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl border border-rose-200 text-center relative overflow-hidden">
                <div className="absolute -top-4 -right-4 bg-rose-200 rounded-full w-24 h-24 opacity-20 blur-2xl"></div>
                <div className="absolute -bottom-4 -left-4 bg-rose-300 rounded-full w-24 h-24 opacity-20 blur-2xl"></div>
                
                <h3 className="font-extrabold text-rose-800 mb-2 flex items-center justify-center gap-2">
                    <AlertCircle size={20} className="text-rose-600 animate-pulse" /> Need immediate help?
                </h3>
                <p className="text-sm text-rose-700 mb-5 px-2 font-medium">If you are in danger or need urgent support, please reach out to emergency services.</p>
                <button 
                    onClick={handleEmergencyCall}
                    className="bg-rose-600 text-white font-extrabold py-3.5 px-6 rounded-full text-sm shadow-md shadow-rose-200 hover:bg-rose-700 hover:shadow-lg active:scale-95 transition-all w-full border border-rose-500 uppercase tracking-widest flex justify-center items-center gap-2 relative z-10"
                >
                    <Phone size={18} /> Emergency Call
                </button>
            </div>

            {/* Emergency Modal */}
            <AnimatePresence>
                {showEmergency && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
                        >
                            <div className="bg-rose-600 p-5 flex justify-between items-center text-white relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="bg-white/20 p-2 rounded-full">
                                        <AlertCircle size={24} className="animate-pulse" />
                                    </div>
                                    <h2 className="font-extrabold text-lg tracking-tight">Emergency Contacts</h2>
                                </div>
                                <button 
                                    onClick={() => setShowEmergency(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors relative z-10"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
                                <p className="text-sm font-medium text-slate-600 mb-4 text-center">Tap a number to call immediately or copy it to your dialer.</p>
                                
                                {emergencyContacts.map((contact, idx) => (
                                    <div key={idx} className="bg-slate-50 border border-rose-100 rounded-2xl p-4 transition-all hover:bg-rose-50 hover:border-rose-200 group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-slate-800 leading-tight">{contact.name}</h3>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">{contact.desc}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200/60">
                                            <a 
                                                href={`tel:${contact.number}`}
                                                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                                            >
                                                <Phone size={15} /> Dial {contact.number}
                                            </a>
                                            <button 
                                                onClick={() => copyToClipboard(contact.number)}
                                                className={`px-4 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all ${
                                                    copiedNumber === contact.number 
                                                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                                }`}
                                                title="Copy to clipboard"
                                            >
                                                {copiedNumber === contact.number ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                <button 
                                    onClick={() => setShowEmergency(false)}
                                    className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
                                >
                                    Close Window
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
