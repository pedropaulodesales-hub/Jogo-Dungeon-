
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import RunePanel from './RunePanel';
import { STATIC_DUNGEON_IMAGE } from '../constants';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        await signInWithEmailAndPassword(auth, email, password);
        // Success is handled by the onAuthStateChanged listener in App.tsx
      } else {
        // --- REGISTRATION FLOW ---
        await createUserWithEmailAndPassword(auth, email, password);
        // Automatically logs in after creation
      }
    } catch (err: any) {
      // Thematic Error Messages
      let msg = err.message;
      if (msg.includes('auth/invalid-email')) msg = "The scribes do not recognize this email format.";
      if (msg.includes('auth/user-not-found') || msg.includes('auth/invalid-credential')) msg = "No soul with this mark exists.";
      if (msg.includes('auth/wrong-password')) msg = "The secret words are incorrect.";
      if (msg.includes('auth/weak-password')) msg = "Your password is too weak for the void.";
      if (msg.includes('auth/email-already-in-use')) msg = "This soul is already bound to the archives.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-slate-300 font-serif flex items-center justify-center p-4">
      {/* Background with Blur */}
      <div className="absolute inset-0 z-0 select-none overflow-hidden">
         <img src={STATIC_DUNGEON_IMAGE} className="w-full h-full object-cover opacity-30 blur-sm scale-110" alt="Background" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in duration-700">
        <RunePanel className="bg-black/80 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)] border-[#333]">
          <div className="text-center mb-8">
            <h1 className="text-4xl exocet-font text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-500 to-amber-700 tracking-[0.2em] uppercase mb-2">
              Runebound
            </h1>
            <p className="text-xs text-slate-500 font-black tracking-[0.4em] uppercase">Dark Descent</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Soul Signature (Email)</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-slate-700/50 p-3 text-amber-100 placeholder:text-slate-700 outline-none focus:border-amber-500/50 transition-all font-sans"
                placeholder="wanderer@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Secret Words (Password)</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-slate-700/50 p-3 text-amber-100 placeholder:text-slate-700 outline-none focus:border-amber-500/50 transition-all font-sans"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-xs text-center font-serif italic">
                "{error}"
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-4 ui-panel exocet-font text-xl tracking-[0.2em] text-amber-500 hover:text-amber-100 hover:border-amber-500/50 border-amber-900/30 transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              {loading ? 'Communing...' : (isLogin ? 'Enter the Abyss' : 'Bind Soul')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-xs text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors"
            >
              {isLogin ? "No pact yet? Create one." : "Already bound? Return."}
            </button>
          </div>
        </RunePanel>
      </div>
    </div>
  );
};

export default AuthScreen;
