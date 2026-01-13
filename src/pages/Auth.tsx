import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error, isAdmin } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          navigate(isAdmin ? '/admin' : '/home');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created successfully!');
          navigate('/home');
        }
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.div className="flex flex-col items-center mb-10" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 glow-sm">
            <Music className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold gradient-text">Sonique</h1>
        </motion.div>

        {/* Form */}
        <motion.form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6" layout>
          <AnimatePresence mode="wait">
            <motion.div key={isLogin ? 'login' : 'signup'} initial={{ opacity: 0, x: isLogin ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isLogin ? 20 : -20 }}>
              <h2 className="text-2xl font-display font-bold mb-2">{isLogin ? 'Welcome back' : 'Create account'}</h2>
              <p className="text-muted-foreground text-sm mb-6">{isLogin ? 'Sign in to continue' : 'Start your music journey'}</p>
            </motion.div>
          </AnimatePresence>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 bg-muted/50 border-white/10" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 h-12 bg-muted/50 border-white/10" required minLength={6} />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 btn-premium" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{isLogin ? 'Sign In' : 'Create Account'}</span><ArrowRight className="w-5 h-5 ml-2" /></>}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Auth;
