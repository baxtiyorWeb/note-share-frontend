"use client"

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRegister } from "@/hooks/use-auth";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useRegister();

  const onSubmit = (data: SignUpFormData) => {
    setServerError(null);
    const { email, password, confirmPassword } = data;
    mutation.mutate({ email, password, confirmPassword }, {
      onSuccess: () => {
        toast.success("Account created successfully!");
        router.push('/dashboard');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || "An error occurred during registration.";
        setServerError(errorMessage);
      },
    });
  };

  return (
    <div className="relative min-h-full w-full flex items-center justify-center overflow-hidden bg-slate-900 p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] -z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full"
      >
        <Card className="w-full max-w-md mx-auto bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 shadow-2xl shadow-black/25 text-slate-50">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-50">Create Account</CardTitle>
            <CardDescription className="text-slate-400">Fill in the details to get started</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {serverError && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-300">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <FormControl>
                          <Input placeholder="you@email.com" {...field} className="pl-10 bg-slate-800/50 border-slate-600 focus:border-violet-500 placeholder:text-slate-500" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="pl-10 bg-slate-800/50 border-slate-600 focus:border-violet-500 placeholder:text-slate-500" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Confirm Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="pl-10 bg-slate-800/50 border-slate-600 focus:border-violet-500 placeholder:text-slate-500" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-violet-600 text-white hover:bg-violet-500 disabled:bg-slate-700" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mutation.isPending ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm">
            <p className="text-slate-400">Already have an account?{" "}
              <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">Login</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}