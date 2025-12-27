import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Car, Sun, Moon, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'inspector']),
});

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppRole>('inspector');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const validation = signupSchema.safeParse({ name, email, password, role });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, name, role);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please sign in.');
          } else {
            setError(error.message);
          }
        } else {
          toast.success('Account created successfully!');
          if (role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/inspector');
          }
        }
      } else {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          setError('Invalid email or password');
        } else {
          toast.success('Welcome back!');
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-forest opacity-90" />
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)"/>
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-primary-foreground">
          <div className="w-24 h-24 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center mb-8">
            <Car className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">
            Traffic Management System
          </h1>
          <p className="text-xl text-primary-foreground/80 text-center max-w-md">
            Sidama Region Transport Authority
          </p>
          <div className="mt-12 flex items-center gap-2 text-primary-foreground/60 text-sm">
            <span className="w-8 h-px bg-primary-foreground/30" />
            <span>Hawassa, Ethiopia</span>
            <span className="w-8 h-px bg-primary-foreground/30" />
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mb-4">
                <Car className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">TMS Admin</h1>
              <p className="text-sm text-muted-foreground">Sidama Region</p>
            </div>

            <Card variant="elevated" className="animate-fade-in">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">
                  {isSignUp ? 'Create Account' : 'Welcome back'}
                </CardTitle>
                <CardDescription>
                  {isSignUp 
                    ? 'Sign up to access the system' 
                    : 'Sign in to access the admin dashboard'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg animate-fade-in">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@sidama.gov.et"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="inspector">Inspector</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                      </span>
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                      }}
                      className="ml-1 text-primary hover:underline font-medium"
                    >
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
