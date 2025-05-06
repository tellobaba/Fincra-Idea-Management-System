import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, Link } from "wouter";
import { useState } from "react";
import { Loader2, Eye, Mail, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const registerSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  displayName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  department: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      department: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left column - Login form */}
          <div className="p-8 lg:p-12">
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <img 
                  src="/Logomark.png" 
                  alt="Fincra Logo" 
                  className="h-10 w-10 mr-3" 
                />
                <h2 className="text-xl font-semibold">Fincra Ideas Hub</h2>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Welcome back</h1>
              <p className="text-muted-foreground mt-2">
                Where ideas come to life. Log in to shape the future with your contributions.
              </p>
            </div>

            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input 
                                placeholder="hello@fincra.com" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                className="pl-10 pr-10"
                                {...field} 
                              />
                              <button 
                                type="button"
                                className="absolute right-3 top-3 text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            </div>
                          </FormControl>
                          <div className="flex justify-end mt-1">
                            <Link href="#" className="text-sm text-primary hover:underline">
                              Forgot Password?
                            </Link>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-white py-2.5"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      <path d="M1 1h22v22H1z" fill="none"/>
                    </svg>
                    Sign in with Google
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@fincra.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Engineering, Product, Finance, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"}
                                className="pr-10"
                                {...field} 
                              />
                              <button 
                                type="button"
                                className="absolute right-3 top-3 text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - Image */}
          <div className="hidden md:block bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/20 z-0"></div>
            <div className="relative z-10 p-12 flex flex-col justify-center h-full">
              <div className="max-w-md mx-auto text-center">
                <h2 className="text-2xl font-bold text-blue-800 mb-6">Idea Management System</h2>
                
                {/* Featured graphics/charts */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-5 mb-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Submissions by Category</h3>
                    <div className="flex justify-center">
                      <div className="w-full h-40 bg-white rounded-lg flex items-end justify-around px-4 pt-4 pb-2">
                        <div className="w-1/4 bg-green-500 rounded-t-lg" style={{ height: '70%' }}>
                          <div className="text-xs font-medium text-white text-center mt-2">Ideas</div>
                        </div>
                        <div className="w-1/4 bg-blue-500 rounded-t-lg" style={{ height: '40%' }}>
                          <div className="text-xs font-medium text-white text-center mt-2">Challenges</div>
                        </div>
                        <div className="w-1/4 bg-red-500 rounded-t-lg" style={{ height: '30%' }}>
                          <div className="text-xs font-medium text-white text-center mt-2">Pain Points</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-blue-900/80">
                  <p className="text-lg font-medium mb-4">Transform your ideas into innovation</p>
                  <p className="text-sm">Capture, organize, and implement great ideas from across your organization. Drive creativity and collaboration in one unified platform.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
