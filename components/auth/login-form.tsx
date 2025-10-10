"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useLogin } from "@/hooks/use-auth"

const loginSchema = z.object({
  email: z.string().email("Iltimos, to'g'ri email manzil kiriting"),
  password: z.string().min(6, "Parol kamida 6 belgidan iborat bo'lishi kerak"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useLogin();

  function onSubmit(data: LoginFormValues) {
    setServerError(null);
    mutation.mutate(data, {
      onSuccess: () => {
        toast.success("Muvaffaqiyatli kirdingiz!");
        router.push('/dashboard');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || "Login yoki parol xato.";
        setServerError(errorMessage);
      },
    });
  }

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
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-50">Xush Kelibsiz!</CardTitle>
            <CardDescription className="text-slate-400">Davom etish uchun hisobingizga kiring</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-slate-100"><GoogleIcon className="mr-2 h-4 w-4" /> Google</Button>
              <Button variant="outline" className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-slate-100"><FacebookIcon className="mr-2 h-4 w-4" /> Facebook</Button>
              <Button variant="outline" className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-slate-100"><TelegramIcon className="mr-2 h-4 w-4" /> Telegram</Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900/60 px-2 text-slate-500">YOKI</span></div>
            </div>

            {serverError && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-300">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle>Xatolik</AlertTitle>
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
                          <Input placeholder="siz@email.com" {...field} className="pl-10 bg-slate-800/50 border-slate-600 focus:border-violet-500 placeholder:text-slate-500" />
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
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-slate-300">Parol</FormLabel>
                        <Link href="#" className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors">Parolni unutdingizmi?</Link>
                      </div>
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
                  {mutation.isPending ? "Kirilmoqda..." : "Kirish"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm">
            <p className="text-slate-400">Hisobingiz yo&apos;qmi?{" "}
              <Link href="/signup" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">Ro&apos;yxatdan o&apos;tish</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.98-4.48 1.98-3.52 0-6.48-2.91-6.48-6.48s2.96-6.48 6.48-6.48c1.98 0 3.06.83 3.74 1.48l2.82-2.78C18.11 2.51 15.65 1.5 12.48 1.5c-5.48 0-9.98 4.48-9.98 9.98s4.5 9.98 9.98 9.98c2.93 0 5.23-1 6.9-2.65 1.78-1.74 2.33-4.27 2.33-6.52 0-.6-.05-1.2-.15-1.78Z" fill="currentColor" /></svg>
  )
}
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33V21.878C18.343 21.128 22 16.991 22 12Z" fill="currentColor" /></svg>
  )
}
function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.17.9-.502 1.2-1.032 1.23-.816.05-1.443-.54-2.214-1.056-1.258-.855-1.958-1.378-3.119-2.228-.994-.727-.354-1.127.234-1.811.14-.165 2.632-2.43 2.634-2.433.004-.003.116-.104.03-.204-.085-.099-.236-.03-.35.03-.138.073-2.383 1.5-3.275 2.14-.76.54-1.38.74-1.82.72-.4-.02-1.022-.15-1.502-.33-.562-.21-1.02-.32-1.01-.7.003-.38 2-1.664 2.95-5.013.293-1.05.77-1.43 1.28-1.442.41-.01 1 .09 1.25.16" fill="currentColor" /></svg>
  )
}