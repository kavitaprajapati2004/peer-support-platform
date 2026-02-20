import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Login() {
    const { user, signInWithGoogle } = useAuth();

    // If already logged in, redirect to the dashboard/home
    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-rose-50 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-rose-200/50 text-center border border-rose-100"
            >
                <div className="bg-primary-100 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner ring-4 ring-rose-50">
                    <span className="text-3xl">💖</span>
                </div>

                <h1 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Welcome to Safespace</h1>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed px-4">
                    A secure, private community where you can find support, join groups, and learn together.
                </p>

                <button
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    Continue with Google
                </button>

                <p className="mt-6 text-xs text-slate-400 font-medium pb-2 border-b border-slate-100 max-w-[80%] mx-auto">
                    We never post without your permission.
                </p>
            </motion.div>
        </div>
    );
}
