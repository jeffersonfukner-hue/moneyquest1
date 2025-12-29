import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Gamepad2, Sparkles } from 'lucide-react';

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

    const { error } = isLogin 
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isLogin ? 'Welcome back!' : 'Account created!', description: 'Let the quest begin! 🎮' });
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary animate-float">
            <Gamepad2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold text-gradient-primary">MoneyQuest</h1>
          <p className="text-muted-foreground mt-2">Level up your finances</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-lg animate-scale-in">
          <div className="flex gap-2 mb-6">
            <Button variant={isLogin ? 'default' : 'outline'} className="flex-1" onClick={() => setIsLogin(true)}>
              Login
            </Button>
            <Button variant={!isLogin ? 'default' : 'outline'} className="flex-1" onClick={() => setIsLogin(false)}>
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full bg-gradient-hero hover:opacity-90" disabled={loading}>
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? 'Loading...' : isLogin ? 'Start Quest' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
