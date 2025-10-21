"use client"

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Image, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMyProfile, useUpdateProfile, useDeleteProfile } from "@/hooks/use-profile";
import { UploadService } from "@/services/upload-service";
const profileSchema = z.object({
  firstName: z.string().min(1, "Ism kiritilishi shart").max(50),
  lastName: z.string().min(1, "Familiya kiritilishi shart").max(50),
  username: z.string().min(3, "Username kamida 3 belgidan iborat bo'lishi kerak").max(20),
  avatar: z.string().url("Iltimos, to'g'ri URL kiriting").optional().or(z.literal("")),
  coverImage: z.string().url("Iltimos, to'g'ri URL kiriting").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function SettingsPage() {
  const { data: user, isLoading } = useMyProfile();
  const updateMutation = useUpdateProfile();
  const deleteMutation = useDeleteProfile();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", username: "", avatar: "", coverImage: "" }
  });

  useEffect(() => {
    if (user?.profile) {
      const profile = user.profile;
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        username: profile.username || "",
        avatar: profile.avatar || "",
        coverImage: profile.coverImage || ""
      });
      setAvatarPreview(profile.avatar || null);
      setCoverImagePreview(profile.coverImage || null);
    }
  }, [user, form.reset]);

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setIsAvatarUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await UploadService.uploadAvatar(formData);
        form.setValue("avatar", response.avatarUrl, { shouldValidate: true });
        toast.success("Avatar yuklandi");
      } catch (error) {
        toast.error("Avatarni yuklashda xatolik");
        setAvatarPreview(user?.profile?.avatar || null);
      } finally {
        setIsAvatarUploading(false);
      }
    }
  };

  const handleCoverImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverImagePreview(URL.createObjectURL(file));
      setIsCoverUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await UploadService.uploadCoverImage(formData); // Buni o'zingizni servisingizga moslang
        form.setValue("coverImage", response.coverImageUrl, { shouldValidate: true });
        toast.success("Muqova rasmi yuklandi");
      } catch (error) {
        toast.error("Muqova rasmini yuklashda xatolik");
        setCoverImagePreview(user?.profile?.coverImage || null);
      } finally {
        setIsCoverUploading(false);
      }
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    toast.promise(updateMutation.mutateAsync(data), {
      loading: "Profil yangilanmoqda...",
      success: "Profil muvaffaqiyatli yangilandi!",
      error: "Profilni yangilashda xatolik yuz berdi"
    });
  };

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync(), {
      loading: "Hisob o'chirilmoqda...",
      success: "Hisobingiz muvaffaqiyatli o'chirildi",
      error: "Hisobni o'chirishda xatolik yuz berdi"
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  if (isLoading) return <>loading ...</>

  return (
    <DashboardLayout>
      <motion.div className="p-6 sm:p-8 md:p-10 space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Sozlamalar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">O'z profilingiz ma'lumotlarini boshqaring</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <CardContent className="p-0">
                  <div className="relative p-6 h-48 flex items-end bg-slate-100 dark:bg-slate-800/50">
                    {coverImagePreview && (
                      <img src={coverImagePreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => coverImageInputRef.current?.click()} disabled={isCoverUploading} className="bg-black/20 hover:bg-black/40 text-white border-white/30 h-8">
                        {isCoverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">O&apos;zgartirish</span>
                      </Button>
                      <input type="file" ref={coverImageInputRef} onChange={handleCoverImageFileChange} accept="image/*" className="hidden" />
                      {coverImagePreview && (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            form.setValue("coverImage", "");
                            setCoverImagePreview(null);
                          }}
                          className="bg-black/20 hover:bg-black/40 text-white border-white/30 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="relative flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-slate-900 border-2 border-slate-300 dark:border-slate-600" >
                          <AvatarImage src={avatarPreview || undefined} />
                          <AvatarFallback className="text-2xl bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        {isAvatarUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full"><Loader2 className="animate-spin text-white" /></div>}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white drop-shadow-md">{user?.profile?.username || "User"}</h2>
                        <p className="text-sm text-slate-300 drop-shadow-sm">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex justify-center sm:justify-start -mt-20 sm:ml-32">
                      <Button type="button" size="sm" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={isAvatarUploading} className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                        <Image className="h-4 w-4 mr-2" /> Avatar o'zgartirish
                      </Button>
                      <input type="file" ref={avatarInputRef} onChange={handleAvatarFileChange} accept="image/*" className="hidden" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel className="text-slate-700 dark:text-slate-300">Ism</FormLabel><FormControl><Input {...field} className="bg-transparent dark:bg-slate-800 border-slate-300 dark:border-slate-700" /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel className="text-slate-700 dark:text-slate-300">Familiya</FormLabel><FormControl><Input {...field} className="bg-transparent dark:bg-slate-800 border-slate-300 dark:border-slate-700" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="username" render={({ field }) => (<FormItem><FormLabel className="text-slate-700 dark:text-slate-300">Username</FormLabel><FormControl><Input {...field} className="bg-transparent dark:bg-slate-800 border-slate-300 dark:border-slate-700" /></FormControl><FormMessage /></FormItem>)} />

                    <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-violet-600 dark:text-white dark:hover:bg-violet-500" disabled={updateMutation.isPending || isAvatarUploading || isCoverUploading}>
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Saqlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </motion.div>


        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Danger Zone
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 pt-1">This action cannot be undone. Be careful.</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 dark:border-transparent">Hisobni o'chirish</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-red-600 dark:text-red-400">Are you really sure?</DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                      This action cannot be undone. It will permanently delete your account and your data will be removed from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2">
                    <DialogTrigger asChild><Button type="button" variant="outline" className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button></DialogTrigger>
                    <Button type="button" variant="destructive" disabled={deleteMutation.isPending} onClick={handleDelete}>
                      {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Yes, delete account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
