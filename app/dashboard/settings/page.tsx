"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Image, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMyProfile, useUpdateProfile, useDeleteProfile } from "@/hooks/use-profile"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be at most 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be at most 50 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters"),
  avatar: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
}

export default function SettingsPage() {
  const { data: user, isLoading } = useMyProfile()
  const updateMutation = useUpdateProfile()
  const deleteMutation = useDeleteProfile()
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const avatarUrl = watch("avatar")

  useEffect(() => {
    if (user?.profile) {
      const profile = user.profile
      setValue("firstName", profile.firstName || "")
      setValue("lastName", profile.lastName || "")
      setValue("username", profile.username || "")
      setValue("avatar", profile.avatar || "")
      setAvatarPreview(profile.avatar || null)
    }
  }, [user, setValue])

  useEffect(() => {
    if (avatarUrl) {
      setAvatarPreview(avatarUrl)
    }
  }, [avatarUrl])

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data, {
      onSuccess: (updatedProfile) => {
        // Update local preview
        if (updatedProfile.avatar) {
          setAvatarPreview(updatedProfile.avatar)
        }
      },
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const displayName = user?.profile?.username || `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || "User"

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your profile information</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-2 border-primary/20 shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-shadow duration-300 overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Profile Preview */}
              <motion.div
                className="flex items-center gap-6 mb-8 p-4 bg-muted/50 rounded-xl"
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex-shrink-0">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt={displayName} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="h-20 w-20 text-lg font-semibold bg-gradient-to-br from-primary to-accent text-white">
                      {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold truncate">{displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Profile preview</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("avatar", "")}
                  className="gap-1 text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </Button>
              </motion.div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar URL Input */}
                <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" variants={fieldVariants}>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="avatar">Profile Picture URL</Label>
                    <Input
                      id="avatar"
                      placeholder="https://example.com/avatar.jpg"
                      {...register("avatar")}
                      className={cn(errors.avatar ? "border-destructive" : "")}
                    />
                    {errors.avatar && <p className="text-sm text-destructive">{errors.avatar.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="sr-only">Preview</Label>
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-20 object-cover rounded-lg border-2 border-muted"
                        onError={() => setAvatarPreview(null)}
                      />
                    ) : (
                      <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        <Image className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Name Fields */}
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={fieldVariants}>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      {...register("firstName")}
                      className={cn(errors.firstName ? "border-destructive" : "")}
                    />
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      {...register("lastName")}
                      className={cn(errors.lastName ? "border-destructive" : "")}
                    />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                  </div>
                </motion.div>

                <motion.div className="space-y-2" variants={fieldVariants}>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    {...register("username")}
                    className={cn(errors.username ? "border-destructive" : "")}
                  />
                  {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                </motion.div>

                <motion.div className="space-y-2" variants={fieldVariants}>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                </motion.div>

                <motion.div variants={fieldVariants}>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 ease-in-out shadow-lg hover:shadow-primary/20"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="mt-8 pt-6 border-t bg-destructive/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-destructive flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Danger Zone
                </h3>
                <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-300 ease-in-out border-destructive/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-background border-destructive/20">
                    <DialogHeader>
                      <DialogTitle className="text-destructive">Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account, notes, and all associated data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-start gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setOpenDeleteDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={handleDelete}
                        className="gap-2"
                      >
                        {deleteMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Yes, delete account
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}