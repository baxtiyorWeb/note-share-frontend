// src/components/SignUpForm.tsx
"use client"

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useRegister } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const mutation = useRegister();

  const onSubmit = (data: SignUpFormData) => {
    mutation.mutate(data, {
      onSuccess: () => {
        // Redirect to dashboard or login
        window.location.href = '/dashboard';
      },
      onError: (error) => {
        console.error("Sign up error:", error);
        // Handle error
      },
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className={cn(errors.email ? "border-destructive" : "")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className={cn(errors.password ? "border-destructive" : "")}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              className={cn(errors.confirmPassword ? "border-destructive" : "")}
            />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full transition-all duration-300 ease-in-out"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}