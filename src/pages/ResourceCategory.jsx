import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Shield, HeartPulse, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

const categoryData = {
    menstruation: {
        title: "Menstruation & Health",
        icon: <HeartPulse className="text-rose-500" size={28} />,
        bg: "bg-rose-100",
        color: "text-rose-800",
        articles: [
            { id: 1, title: "Understanding Your Cycle", content: "Your menstrual cycle is completely natural. It typically lasts between 21 and 35 days. Tracking your cycle can help you understand your body better and anticipate changes in mood or energy." },
            { id: 2, title: "Managing Cramps", content: "Menstrual cramps are common. Staying hydrated, using a warm heating pad, light exercise, and over-the-counter pain relievers can help reduce discomfort." },
            { id: 3, title: "Hygiene Best Practices", content: "Change your pad or tampon every 4-8 hours to prevent infection. Always wash your hands before and after changing. Wear breathable cotton underwear." }
        ]
    },
    violence: {
        title: "Violence & Abuse",
        icon: <Shield className="text-indigo-500" size={28} />,
        bg: "bg-indigo-100",
        color: "text-indigo-800",
        articles: [
            { id: 4, title: "Identifying Emotional Abuse", content: "Emotional abuse involves attempts to frighten, control, or isolate you. It can include constant criticism, threats, or manipulation. Remember, abuse is never your fault." },
            { id: 5, title: "Setting Boundaries", content: "You have the right to set personal, physical, and emotional boundaries. If someone violates them, it's okay to walk away and seek help." },
            { id: 6, title: "Creating a Safety Plan", content: "If you are in an abusive situation, plan a safe exit strategy. Keep important documents, some money, and emergency contacts hidden but easily accessible." }
        ]
    },
    "mental-health": {
        title: "Mental Wellbeing",
        icon: <Brain className="text-emerald-500" size={28} />,
        bg: "bg-emerald-100",
        color: "text-emerald-800",
        articles: [
            { id: 7, title: "Coping with Anxiety", content: "Anxiety can feel overwhelming. Grounding techniques like the 5-4-3-2-1 method, deep breathing, and taking short walks can help bring you back to the present moment." },
            { id: 8, title: "Building Self-Esteem", content: "Start by challenging negative self-talk. Celebrate your small wins and practice self-compassion. Surround yourself with supportive people." },
            { id: 9, title: "When to Seek Help", content: "If your feelings are interfering with your daily life, sleep, or eating habits for more than a few weeks, it's a good idea to speak with a trusted adult or professional. Do not hesitate to use the emergency call if you are feeling completely overwhelmed." }
        ]
    },
    rights: {
        title: "Rights & Empowerment",
        icon: <BookOpen className="text-amber-500" size={28} />,
        bg: "bg-amber-100",
        color: "text-amber-800",
        articles: [
            { id: 10, title: "Knowing Your Basic Rights", content: "Every human has the right to live free from violence and discrimination. You have the right to bodily autonomy and to make decisions about your own life." },
            { id: 11, title: "How to Build Confidence", content: "Confidence comes from acting in alignment with your values and trying new things even when you might fail. Speak up for yourself in small scenarios first." },
            { id: 12, title: "Advocating for Yourself", content: "Self-advocacy means clearly communicating your needs and boundaries to others. Practice saying 'no' when you are uncomfortable." }
        ]
    }
};

export default function ResourceCategory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const data = categoryData[id];
    const [expandedArticle, setExpandedArticle] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!data) return (
        <div className="flex flex-col items-center justify-center p-4 h-[calc(100vh-8rem)] text-center text-slate-500">
            <h2 className="text-xl font-bold mb-2">Category Not Found</h2>
            <button onClick={() => navigate('/resources')} className="text-primary-500 font-bold hover:underline">Return to Knowledge Base</button>
        </div>
    );

    return (
        <div className="max-w-md mx-auto bg-slate-50 min-h-[calc(100vh-8rem)] pb-10">
            <div className={`px-4 py-8 ${data.bg} border-b border-white`}>
                <button onClick={() => navigate('/resources')} className="mb-4 w-10 h-10 bg-white/50 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-white/80 transition-colors shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm -rotate-6">
                        {data.icon}
                    </div>
                </div>
                <h1 className={`text-3xl font-extrabold ${data.color} tracking-tight`}>{data.title}</h1>
                <p className={`${data.color} opacity-80 mt-1 font-medium`}>Curated guides and information</p>
            </div>

            <div className="px-4 py-6 space-y-3">
                {data.articles.map((article) => {
                    const isExpanded = expandedArticle === article.id;
                    return (
                        <div key={article.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all">
                            <button
                                onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                                className="w-full flex items-center justify-between p-4 px-5 text-left hover:bg-slate-50 transition-colors"
                            >
                                <span className={`font-bold pr-4 flex-1 ${isExpanded ? 'text-primary-600' : 'text-slate-800'}`}>{article.title}</span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary-50 text-primary-500' : 'bg-slate-50 text-slate-400'}`}>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="p-5 pt-2 text-slate-600 text-[15px] leading-relaxed bg-white">
                                    {article.content}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="px-4 mt-6">
                <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border border-primary-200 text-center">
                    <h3 className="font-bold text-primary-800 mb-2">Need to talk to someone?</h3>
                    <p className="text-sm text-primary-600 mb-4 px-2">Join one of our Safe Groups to discuss this topic with peers or a mentor.</p>
                    <button onClick={() => navigate('/groups')} className="bg-primary-500 text-white font-bold py-2.5 px-6 rounded-full text-sm shadow-[0_4px_14px_0_rgba(244,114,182,0.39)] hover:shadow-[0_6px_20px_rgba(244,114,182,0.23)] hover:bg-primary-600 active:scale-95 transition-all w-full tracking-wide">
                        View Safe Groups
                    </button>
                </div>
            </div>
        </div>
    );
}
