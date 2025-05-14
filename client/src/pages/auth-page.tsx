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
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-lg overflow-hidden h-[550px]">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* Left column - Login form */}
          <div className="p-6 overflow-y-auto">
            <div className="mb-5">
              <div className="flex items-center mb-4">
                <img 
                  src="/Logomark.png" 
                  alt="Fincra Logo" 
                  className="h-8 w-8 mr-2" 
                />
                <h2 className="text-lg font-semibold">Fincra Ideas Hub</h2>
              </div>
              <h1 className="text-xl font-bold">Welcome back</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Where ideas come to life. Log in to shape the future with your contributions.
              </p>
            </div>

            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
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
                    onClick={() => window.location.href = '/api/auth/google'}
                    type="button"
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
                        onClick={() => window.location.href = '/api/auth/google'}
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          <path d="M1 1h22v22H1z" fill="none"/>
                        </svg>
                        Sign up with Google
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - Image */}
          <div className="hidden md:block bg-gradient-to-br from-indigo-50 to-purple-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/20 z-0"></div>
            <div className="relative z-10 p-8 flex flex-col justify-center h-full">
              <div className="max-w-md mx-auto text-center">
                <h2 className="text-xl font-bold text-indigo-800 mb-4">Idea Management System</h2>
                
                {/* Featured graphics/charts - using a more sophisticated visualization */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Ideas Journey</h3>
                    <div className="flex justify-center">
                      <div className="w-full bg-white rounded-lg p-4">
                        {/* Process flow visualization */}
                        <div className="relative py-2">
                          {/* Connection line */}
                          <div className="absolute top-1/2 left-0 right-0 h-1 bg-indigo-200 -translate-y-1/2"></div>
                          
                          {/* Process steps */}
                          <div className="relative flex justify-between items-center">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md text-xs">
                                1
                              </div>
                              <div className="mt-1 text-xs font-medium">Submit</div>
                            </div>
                            
                            {/* Step 2 */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md text-xs">
                                2
                              </div>
                              <div className="mt-1 text-xs font-medium">Review</div>
                            </div>
                            
                            {/* Step 3 */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-md text-xs">
                                3
                              </div>
                              <div className="mt-1 text-xs font-medium">Implement</div>
                            </div>
                            
                            {/* Step 4 */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold shadow-md text-xs">
                                4
                              </div>
                              <div className="mt-1 text-xs font-medium">Impact</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Categories */}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="p-2 bg-indigo-100 border border-indigo-200 rounded-md">
                            <div className="text-xs font-medium text-indigo-700">Ideas</div>
                            <div className="text-center text-xl font-bold text-indigo-800 mt-1">20</div>
                          </div>
                          <div className="p-2 bg-blue-100 border border-blue-200 rounded-md">
                            <div className="text-xs font-medium text-blue-700">Challenges</div>
                            <div className="text-center text-xl font-bold text-blue-800 mt-1">15</div>
                          </div>
                          <div className="p-2 bg-red-100 border border-red-200 rounded-md">
                            <div className="text-xs font-medium text-red-700">Pain Points</div>
                            <div className="text-center text-xl font-bold text-red-800 mt-1">12</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-indigo-900/80">
                  <p className="text-base font-medium mb-2">Transform your ideas into innovation</p>
                  <p className="text-xs">Capture, organize, and implement great ideas from across your organization. Drive creativity and collaboration in one unified platform.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
