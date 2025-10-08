"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, Lock } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Form validatsiyasi uchun schema
const loginSchema = z.object({
  email: z.string().email({ message: "Iltimos, to'g'ri email kiriting." }),
  password: z.string().min(6, { message: "Parol kamida 6 belgidan iborat bo'lishi kerak." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Form submit bo'lganda ishlaydigan funksiya
  function onSubmit(data: LoginFormValues) {
    console.log(data)
    // Bu yerda API ga so'rov yuborish logikasini yozasiz
    // Masalan: loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Xush Kelibsiz!</CardTitle>
          <CardDescription>Davom etish uchun hisobingizga kiring</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* --- Ijtimoiy Tarmoq Tugmalari --- */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline">
              <GoogleIcon className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline">
              <FacebookIcon className="mr-2 h-4 w-4" />
              Facebook
            </Button>
            <Button variant="outline">
              <TelegramIcon className="mr-2 h-4 w-4" />
              Telegram
            </Button>
          </div>

          {/* --- "OR" Ajratuvchisi --- */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                YOKI
              </span>
            </div>
          </div>

          {/* --- Asosiy Login Formasi --- */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="siz@email.com" {...field} className="pl-10" />
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
                      <FormLabel>Parol</FormLabel>
                      <Link href="#" className="text-sm font-medium text-primary hover:underline">
                        Parolni unutdingizmi?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Kirilmoqda..." : "Kirish"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>
            Hisobingiz yo'qmi?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Ro'yxatdan o'tish
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}


// --- Ikonka Komponentlari (alohida faylga chiqarsa ham bo'ladi) ---
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.98-4.48 1.98-3.52 0-6.48-2.91-6.48-6.48s2.96-6.48 6.48-6.48c1.98 0 3.06.83 3.74 1.48l2.82-2.78C18.11 2.51 15.65 1.5 12.48 1.5c-5.48 0-9.98 4.48-9.98 9.98s4.5 9.98 9.98 9.98c2.93 0 5.23-1 6.9-2.65 1.78-1.74 2.33-4.27 2.33-6.52 0-.6-.05-1.2-.15-1.78Z"
        fill="currentColor"
      />
    </svg>
  )
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33V21.878C18.343 21.128 22 16.991 22 12Z"
        fill="currentColor"
      />
    </svg>
  )
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.17.9-.502 1.2-1.032 1.23-.816.05-1.443-.54-2.214-1.056-1.258-.855-1.958-1.378-3.119-2.228-.994-.727-.354-1.127.234-1.811.14-.165 2.632-2.43 2.634-2.433.004-.003.116-.104.03-.204-.085-.099-.236-.03-.35.03-.138.073-2.383 1.5-3.275 2.14-.76.54-1.38.74-1.82.72-.4-.02-1.022-.15-1.502-.33-.562-.21-1.02-.32-1.01-.7.003-.38 2-1.664 2.95-5.013.293-1.05.77-1.43 1.28-1.442.41-.01 1 .09 1.25.16"
        fill="currentColor"
      />
    </svg>
  )
}