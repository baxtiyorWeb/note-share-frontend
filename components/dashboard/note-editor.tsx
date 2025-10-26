"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import NextLink from "next/link";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TiptapImage from "@tiptap/extension-image";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import { useCreateNote, useUpdateNote, useNote, useShareNote } from "@/hooks/use-note";
import { useProfileByUsername } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Save, Loader2, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, Pilcrow, List, ListOrdered, ImageIcon, Quote,
  Minus, Maximize, Minimize, BookOpen, Crop, AlignLeft, AlignCenter, AlignRight, Share2, Search,
  AlertTriangle, CheckCircle, Link2, Code2, Palette, Grid, Menu, Type, AlignJustify
} from "lucide-react";

const noteSchema = z.object({ title: z.string().min(1, "Sarlavha kiritilishi shart") });
const shareSchema = z.object({ username: z.string().min(1, "Username kiritilishi shart") });
type NoteFormData = z.infer<typeof noteSchema>;
type ShareFormData = z.infer<typeof shareSchema>;

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const grammarTemplates = [
  { title: "Basic Grammar Rule", content: `<div class="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded-lg mb-4"><h3 class="text-blue-900 dark:text-blue-200 mt-0 font-bold">Rule: [Rule Name]</h3><p class="text-gray-700 dark:text-gray-200"><strong>Explanation:</strong> [Brief explanation]</p><ul class="list-disc pl-5"><li class="text-green-600 dark:text-green-300"><strong>Correct:</strong> [Correct example]</li><li class="text-red-600 dark:text-red-300"><strong>Incorrect:</strong> [Incorrect example]</li></ul></div>` },
];
const topicTemplates = [
  { title: "General Topic Overview", content: `<div class="bg-cyan-50 dark:bg-cyan-900/30 border-l-4 border-cyan-500 dark:border-cyan-400 p-4 rounded-lg mb-4"><h2 class="text-cyan-900 dark:text-cyan-200 mt-0 font-bold">Topic: [Topic Name]</h2><ol class="list-decimal pl-5 text-gray-700 dark:text-gray-200"><li>[Question 1]</li><li>[Question 2]</li></ol></div>` },
];
const skillTemplates = {
  speaking: [{ title: "Speaking Practice", content: `<div class="bg-pink-50 dark:bg-pink-900/30 border-l-4 border-pink-500 dark:border-pink-400 p-4 rounded-lg mb-4"><h3 class="text-pink-900 dark:text-pink-200 mt-0 font-bold">Speaking Topic: [Topic]</h3></div>` }],
  reading: [{ title: "Reading Comprehension", content: `<div class="bg-teal-50 dark:bg-teal-900/30 border-l-4 border-teal-500 dark:border-teal-400 p-4 rounded-lg mb-4"><h3 class="text-teal-900 dark:text-teal-200 mt-0 font-bold">Passage Title: [Title]</h3></div>` }],
  writing: [{ title: "Writing Prompt", content: `<div class="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 dark:border-amber-400 p-4 rounded-lg mb-4"><h3 class="text-amber-900 dark:text-amber-200 mt-0 font-bold">Writing Task: [Task Type]</h3></div>` }],
};

const ToolbarButton = ({ isActive, onClick, children, title }: any) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-full transition-all duration-200",
          isActive
            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-800/50 dark:text-indigo-200 shadow-md"
            : "text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-100 hover:shadow-sm"
        )}
        onClick={onClick}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top" className="bg-indigo-900 text-white px-3 py-1 rounded-full shadow-lg"><p>{title}</p></TooltipContent>
  </Tooltip>
);

const ColorPicker = ({ editor, type }: { editor: any, type: 'color' | 'highlight' }) => {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#ec4899', '#6b7280'];
  const title = type === 'color' ? 'Matn rangi' : 'Fon rangi';
  const command = type === 'color' ? (color: string) => editor.chain().focus().setColor(color).run() : (color: string) => editor.chain().focus().toggleHighlight({ color }).run();

  return (
    <Popover>
      <PopoverTrigger asChild><ToolbarButton title={title}><Palette size={18} /></ToolbarButton></PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-white dark:bg-gray-950 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-xl">
        <div className="grid grid-cols-4 gap-2">
          {colors.map(color => (
            <button key={color} onClick={() => command(color)} className="w-7 h-7 rounded-full border border-indigo-300 dark:border-indigo-700 hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
          ))}
          <button onClick={() => command('')} className="w-7 h-7 rounded-full border border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:scale-110 transition-transform">X</button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const CropModal = ({ isOpen, onClose, imageSrc, onConfirm }: any) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSize, setImageSize] = useState("medium");

  const onCropComplete = useCallback((_c: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = useCallback(async (imageSrc: string, pixelCrop: Area) => {
    const image = new (globalThis as any).Image() as HTMLImageElement;
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = () => resolve(true); });
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return canvas.toDataURL('image/jpeg');
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const width = { small: 200, medium: 500, large: 800 }[imageSize];
      onConfirm(croppedImage, imageSize);
      onClose();
    } catch {
      toast.error("Rasmni kesishda xatolik.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl bg-white dark:bg-gray-950 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-2xl">
        <DialogHeader><DialogTitle className="text-indigo-900 dark:text-indigo-100">Rasmni kesish va o'lchamini o'zgartirish</DialogTitle></DialogHeader>
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden shadow-inner">
          {imageSrc && <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={4 / 3} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div>
            <Label className="text-indigo-800 dark:text-indigo-200 mb-2">Kattalashtirish</Label>
            <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-indigo-200 dark:bg-indigo-800 rounded-lg accent-indigo-500 cursor-pointer" />
          </div>
          <div>
            <Label className="text-indigo-800 dark:text-indigo-200 mb-2">Rasm o'lchami</Label>
            <Select value={imageSize} onValueChange={setImageSize}>
              <SelectTrigger className="bg-white dark:bg-gray-950 border-indigo-300 dark:border-indigo-700 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-950 border-indigo-200 dark:border-indigo-800 rounded-lg">
                <SelectItem value="small">Kichik (200px)</SelectItem>
                <SelectItem value="medium">O'rta (500px)</SelectItem>
                <SelectItem value="large">Katta (800px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">Bekor qilish</Button>
          <Button onClick={handleConfirm} className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg"><Crop className="mr-2 h-4 w-4" /> Rasmni qo'yish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LinkModal = ({ isOpen, onClose, onConfirm, initialUrl }: { isOpen: boolean, onClose: () => void, onConfirm: (url: string) => void, initialUrl: string }) => {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = () => {
    if (url.trim()) onConfirm(url);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-md bg-white dark:bg-gray-950 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-indigo-900 dark:text-indigo-100">Havola qo'shish</DialogTitle>
          <DialogDescription className="text-indigo-700 dark:text-indigo-300">Havola URL manzilini kiriting.</DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <Label htmlFor="link-url" className="text-indigo-800 dark:text-indigo-200 mb-2">URL</Label>
          <Input id="link-url" value={url} onChange={(e) => setUrl(e.target.value)} className="bg-gray-100 dark:bg-gray-900 border-indigo-300 dark:border-indigo-700 focus:border-indigo-500 rounded-lg" />
        </div>
        <DialogFooter className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">Bekor qilish</Button>
          <Button onClick={handleSubmit} className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg"><Link2 className="mr-2 h-4 w-4" /> Qo'shish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ShareModal = ({ noteId, isOpen, onClose }: { noteId: number, isOpen: boolean, onClose: () => void }) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ShareFormData>({ resolver: zodResolver(shareSchema) });
  const watchedUsername = watch("username");
  const debouncedSearchTerm = useDebounce(watchedUsername || "", 500);
  const { data: targetProfile, isFetching: isFetchingProfile } = useProfileByUsername(debouncedSearchTerm);
  const shareMutation = useShareNote();
  const userNotFound = debouncedSearchTerm && !isFetchingProfile && !targetProfile;

  const onShareSubmit = (data: ShareFormData) => {
    if (!targetProfile) return toast.error("Foydalanuvchi topilmadi.");
    toast.promise(shareMutation.mutateAsync({ noteId, targetProfileId: targetProfile.id }), {
      loading: 'Eslatma ulashilmoqda...',
      success: () => { reset(); onClose(); return "Eslatma muvaffaqiyatli ulashildi!"; },
      error: "Ulashishda xatolik yuz berdi.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) reset(); onClose(); }}>
      <DialogContent className="max-w-xs sm:max-w-md bg-white dark:bg-gray-950 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-indigo-900 dark:text-indigo-100">Eslatmani ulashish</DialogTitle>
          <DialogDescription className="text-indigo-700 dark:text-indigo-300">Bu eslatmani boshqa foydalanuvchi bilan ulashing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onShareSubmit)} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="username" className="text-indigo-800 dark:text-indigo-200 mb-2">Foydalanuvchi nomi</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 dark:text-indigo-500" />
              <Input id="username" placeholder="masalan, john.doe" className="pl-10 bg-gray-100 dark:bg-gray-900 border-indigo-300 dark:border-indigo-700 focus:border-indigo-500 rounded-lg" {...register("username")} />
            </div>
            {errors.username && <p className="text-sm text-red-500 dark:text-red-400 mt-2">{errors.username.message}</p>}
          </div>
          <div className="min-h-[60px]">
            {isFetchingProfile && <div className="text-sm text-indigo-500 dark:text-indigo-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Qidirilmoqda...</div>}
            {userNotFound && <div className="text-sm text-red-500 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Foydalanuvchi topilmadi.</div>}
            {targetProfile && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-3 shadow-sm">
                <Avatar className="h-9 w-9"><AvatarImage src={targetProfile.avatar} /><AvatarFallback className="bg-indigo-200 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300">U</AvatarFallback></Avatar>
                <p className="font-medium text-indigo-800 dark:text-indigo-200">{targetProfile.username}</p>
                <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 ml-auto" />
              </motion.div>
            )}
          </div>
          <DialogFooter className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">Bekor qilish</Button>
            <Button type="submit" disabled={!targetProfile || shareMutation.isPending} className="bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 rounded-lg">
              {shareMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />} Ulashish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export function NoteEditor() {
  const { id } = useParams()
  const noteId = id?.toString()
  const router = useRouter();
  const isEdit = !!noteId;
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const { data: note, isLoading: isNoteLoading } = useNote(isEdit ? Number(noteId) : 0);

  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "" },
  });

  const CustomImage = TiptapImage.extend({
    addAttributes() {
      return {
        src: { default: null },
        alt: { default: null },
        title: { default: null },
        width: {
          default: null,
          parseHTML: (element) => element.getAttribute('width') || element.getAttribute('data-width'),
          renderHTML: (attrs) => (attrs.width ? { 'data-width': attrs.width, style: `width: ${attrs.width}px;` } : {}),
        },
        style: {
          default: null,
          parseHTML: (element) => element.getAttribute('style'),
          renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
        },
        class: {
          default: null,
          parseHTML: (element) => element.getAttribute('class'),
          renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
        },
      };
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      CustomImage.configure({ inline: true, allowBase64: true }),
      Placeholder.configure({ placeholder: 'Yozishni boshlang...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      HorizontalRule,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "",
    editorProps: {
      attributes: { class: "prose dark:prose-invert max-w-full focus:outline-none min-h-[50vh] p-4 md:p-6 text-gray-800 dark:text-gray-200" },
    },
    onUpdate: () => editor?.commands.focus(),
  });

  const setLink = useCallback((url: string) => {
    if (!editor) return;
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const openLinkModal = useCallback(() => {
    if (!editor) return '';
    const previousUrl = editor.getAttributes('link').href || '';
    setIsLinkModalOpen(true);
    return previousUrl;
  }, [editor]);

  useEffect(() => {
    if (isEdit && note && editor && editor.isEmpty) {
      setValue("title", note.title);
      editor.commands.setContent(note.content || "");
    }
  }, [note, isEdit, setValue, editor]);

  const handleSave = (data: NoteFormData) => {
    if (!editor) return;
    const finalData = { title: data.title, content: editor.getHTML() || "" };
    const mutation = isEdit ? updateMutation : createMutation;
    const mutationArgs = isEdit ? { id: parseInt(noteId!), data: finalData } : finalData;
    toast.promise(mutation.mutateAsync(mutationArgs as any), {
      loading: 'Saqlanmoqda...',
      success: (savedNote) => {
        if (!isEdit) router.push(`/dashboard/edit/${(savedNote as any).id}`);
        return `Eslatma ${isEdit ? 'yangilandi' : 'yaratildi'}!`;
      },
      error: (err) => `Saqlashda xatolik: ${(err as Error).message}`,
    });
  };

  const handleImageFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCropImageSrc(e.target?.result as string);
      reader.readAsDataURL(file);
      setIsCropModalOpen(true);
    }
    event.target.value = '';
  };

  const handleInsertCroppedImage = (croppedImage: string, size: 'small' | 'medium' | 'large') => {
    if (!editor) return;
    const width = { small: 200, medium: 500, large: 800 }[size];
    editor.chain().focus().setImage({
      src: croppedImage,
      alt: 'Cropped image',
    }).updateAttributes('image', {
      style: 'border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: ' + width + 'px; margin: 1rem auto; display: block;',
      width
    }).run();
  };

  const handleTemplateInsert = (content: string) => {
    if (!editor) {
      toast.error("Editor tayyor emas.");
      return;
    }
    editor.chain().focus().insertContent(content).run();
    editor.commands.focus();
  };

  if (isNoteLoading && isEdit) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100 dark:from-indigo-950 dark:to-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("bg-gradient-to-br from-indigo-50 to-gray-100 dark:from-indigo-950 dark:to-gray-900 min-h-screen flex flex-col", isFocusMode && "p-0")}>
        <motion.header
          initial={{ y: -80 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 120 }}
          className={cn(
            "bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-indigo-200 dark:border-indigo-900 sticky top-0 z-30 shadow-md",
            isFocusMode && "opacity-0 -mb-20 pointer-events-none transition-opacity duration-300"
          )}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="ghost" size="icon" asChild className="hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-full">
                <NextLink href="/dashboard">
                  <ArrowLeft className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </NextLink>
              </Button>
              <Input
                placeholder="Sarlavha..."
                {...register("title")}
                className="text-2xl font-extrabold border-none focus-visible:ring-0 ring-offset-0 flex-1 bg-transparent text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-400 dark:placeholder:text-indigo-500 tracking-tight"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {isEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShareModalOpen(true)}
                  className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-full px-4"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Ulashish
                </Button>
              )}
              <Button
                onClick={handleSubmit(handleSave)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 rounded-full px-6 shadow-md"
              >
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Saqlash
              </Button>
            </div>
          </div>
          {errors.title && (
            <div className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 text-sm text-center py-2 font-medium">
              {errors.title.message}
            </div>
          )}
        </motion.header>

        <main className="flex-grow flex flex-col px-2 sm:px-6 md:px-8 py-4 md:py-6 relative">
          <motion.div
            layout
            transition={{ duration: 0.4, type: "spring", bounce: 0.15 }}
            className={cn(
              "bg-white dark:bg-gray-950 rounded-3xl shadow-2xl dark:shadow-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 overflow-hidden",
              isFocusMode ? "w-full h-full" : "max-w-7xl mx-auto"
            )}
          >
            {editor && (
              <>
                {/* Bubble Menu for Selection */}
                <BubbleMenu editor={editor} tippyOptions={{ duration: 200, animation: 'fade' }} className="bg-white dark:bg-gray-950 border border-indigo-200 dark:border-indigo-800 rounded-full shadow-lg p-1 flex gap-1">
                  <ToolbarButton isActive={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={16} /></ToolbarButton>
                  <ToolbarButton isActive={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={16} /></ToolbarButton>
                  <ToolbarButton isActive={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon size={16} /></ToolbarButton>
                  <ToolbarButton isActive={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough size={16} /></ToolbarButton>
                  <ColorPicker editor={editor} type="color" />
                  <ColorPicker editor={editor} type="highlight" />
                </BubbleMenu>

                {/* Main Toolbar - Bottom on mobile, top on desktop */}
                <div className={cn(
                  "fixed bottom-0 left-0 right-0 md:static z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t md:border-b border-indigo-200 dark:border-indigo-800 flex items-center justify-center md:justify-between flex-wrap gap-2 p-3 md:p-4 transition-all duration-300",
                  isFocusMode && "translate-y-full md:translate-y-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto"
                )}>
                  <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                    <ToolbarButton title="Bold" isActive={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
                      <Bold size={18} />
                    </ToolbarButton>
                    <ToolbarButton title="Italic" isActive={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
                      <Italic size={18} />
                    </ToolbarButton>
                    <ToolbarButton title="Underline" isActive={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                      <UnderlineIcon size={18} />
                    </ToolbarButton>
                    <ToolbarButton title="Strikethrough" isActive={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
                      <Strikethrough size={18} />
                    </ToolbarButton>
                    <ToolbarButton title="Link" isActive={editor.isActive("link")} onClick={openLinkModal}>
                      <Link2 size={18} />
                    </ToolbarButton>
                    <ToolbarButton title="Bullet List" isActive={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                      <List size={18} />
                    </ToolbarButton>
                    <ToolbarButton title="Ordered List" isActive={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                      <ListOrdered size={18} />
                    </ToolbarButton>
                    <ToolbarButton title="Image" onClick={() => imageFileInputRef.current?.click()}>
                      <ImageIcon size={18} />
                    </ToolbarButton>
                    <ColorPicker editor={editor} type="color" />
                    <ColorPicker editor={editor} type="highlight" />
                  </div>
                  <div className="flex items-center gap-2 md:hidden">
                    <ToolbarButton title="More" onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}>
                      <Menu size={18} />
                    </ToolbarButton>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <ToolbarButton title={isFocusMode ? "Oddiy rejim" : "Fokus rejimi"} onClick={() => setIsFocusMode(!isFocusMode)}>
                      {isFocusMode ? <Minimize size={18} /> : <Maximize size={18} />}
                    </ToolbarButton>
                  </div>
                </div>

                {/* Secondary Toolbar - Above main on mobile (when expanded), below main on desktop */}
                <div className={cn(
                  "fixed bottom-[4.5rem] left-0 right-0 md:static z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t md:border-b border-indigo-200 dark:border-indigo-800 flex items-center justify-center flex-wrap gap-2 p-3 md:p-4 transition-all duration-300",
                  isFocusMode && "translate-y-full md:translate-y-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto",
                  isToolbarExpanded ? "block" : "hidden md:block"
                )}>
                  <Popover>

                    <PopoverContent className="w-auto p-3 bg-white dark:bg-gray-950 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-xl grid grid-cols-4 gap-2">
                      <ToolbarButton title="Paragraph" isActive={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
                        <Type size={18} />
                      </ToolbarButton>
                      <ToolbarButton title="Heading 1" isActive={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                        <Heading1 size={18} />
                      </ToolbarButton>
                      <ToolbarButton title="Heading 2" isActive={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                        <Heading2 size={18} />
                      </ToolbarButton>
                      <ToolbarButton title="Heading 3" isActive={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                        <Heading3 size={18} />
                      </ToolbarButton>
                      <ToolbarButton title="Heading 4" isActive={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
                        <span className="font-bold text-sm">H4</span>
                      </ToolbarButton>
                      <ToolbarButton title="Heading 5" isActive={editor.isActive("heading", { level: 5 })} onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}>
                        <span className="font-bold text-sm">H5</span>
                      </ToolbarButton>
                      <ToolbarButton title="Heading 6" isActive={editor.isActive("heading", { level: 6 })} onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>
                        <span className="font-bold text-sm">H6</span>
                      </ToolbarButton>
                    </PopoverContent>
                  </Popover>
                  <ToolbarButton title="Left Align" isActive={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                    <AlignLeft size={18} />
                  </ToolbarButton>
                  <ToolbarButton title="Center Align" isActive={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                    <AlignCenter size={18} />
                  </ToolbarButton>
                  <ToolbarButton title="Right Align" isActive={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                    <AlignRight size={18} />
                  </ToolbarButton>
                  <ToolbarButton title="Justify" isActive={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
                    <AlignJustify size={18} />
                  </ToolbarButton>
                  <ToolbarButton title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <Minus size={18} />
                  </ToolbarButton>
                  <ToolbarButton title="Blockquote" isActive={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                    <Quote size={18} />
                  </ToolbarButton>
                  <ToolbarButton title="Code" isActive={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
                    <Code2 size={18} />
                  </ToolbarButton>
                  <ToolbarButton title="Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                    <Grid size={18} />
                  </ToolbarButton>
                </div>

                {/* Side Panel for Additional Features (Templates) - Right side on desktop, full overlay on mobile */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: isSidePanelOpen ? 0 : "100%" }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  className={cn(
                    "fixed top-0 right-0 h-full w-80 md:w-96 bg-white dark:bg-gray-950 border-l border-indigo-200 dark:border-indigo-800 shadow-2xl z-30 p-6 overflow-y-auto",
                    isFocusMode && "hidden"
                  )}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Andozalar</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidePanelOpen(false)} className="text-indigo-600 dark:text-indigo-400">
                      <ArrowLeft size={20} />
                    </Button>
                  </div>
                  <Tabs defaultValue="grammar" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-1">
                      <TabsTrigger value="grammar" className="rounded-md">Grammar</TabsTrigger>
                      <TabsTrigger value="topics" className="rounded-md">Topics</TabsTrigger>
                      <TabsTrigger value="skills" className="rounded-md">Skills</TabsTrigger>
                    </TabsList>
                    <TabsContent value="grammar" className="mt-4 space-y-2">
                      {grammarTemplates.map((t, i) => (
                        <Button key={i} variant="outline" className="w-full justify-start h-auto text-left border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg py-3" onClick={() => { handleTemplateInsert(t.content); setIsSidePanelOpen(false); }}>
                          {t.title}
                        </Button>
                      ))}
                    </TabsContent>
                    <TabsContent value="topics" className="mt-4 space-y-2">
                      {topicTemplates.map((t, i) => (
                        <Button key={i} variant="outline" className="w-full justify-start h-auto text-left border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg py-3" onClick={() => { handleTemplateInsert(t.content); setIsSidePanelOpen(false); }}>
                          {t.title}
                        </Button>
                      ))}
                    </TabsContent>
                    <TabsContent value="skills" className="mt-4 space-y-4">
                      <Select onValueChange={setSelectedSkill}>
                        <SelectTrigger className="bg-white dark:bg-gray-950 border-indigo-200 dark:border-indigo-700 rounded-lg">
                          <SelectValue placeholder="Mahoratni tanlang" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-950 border-indigo-200 dark:border-indigo-800 rounded-lg">
                          <SelectItem value="speaking">Speaking</SelectItem>
                          <SelectItem value="reading">Reading</SelectItem>
                          <SelectItem value="writing">Writing</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedSkill && (skillTemplates as any)[selectedSkill].map((template: any, index: number) => (
                        <Button key={index} variant="outline" className="w-full justify-start h-auto text-left border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg py-3" onClick={() => { handleTemplateInsert(template.content); setIsSidePanelOpen(false); }}>
                          {template.title}
                        </Button>
                      ))}
                    </TabsContent>
                  </Tabs>
                </motion.div>

                {/* Editor Content */}
                <div className={cn("flex-grow overflow-y-auto", isFocusMode ? "p-6 md:p-12" : "p-4 md:p-8")}>
                  <EditorContent editor={editor} />
                </div>

                {/* Floating Button for Side Panel on Mobile/Desktop */}
                {!isFocusMode && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="fixed bottom-20 right-6 md:bottom-8 md:right-8 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-500 transition-all z-20"
                    onClick={() => setIsSidePanelOpen(true)}
                  >
                    <BookOpen size={24} />
                  </motion.button>
                )}
              </>
            )}
          </motion.div>
        </main>

        <input type="file" accept="image/*" ref={imageFileInputRef} onChange={handleImageFileUpload} className="hidden" />
        <CropModal isOpen={isCropModalOpen} onClose={() => setIsCropModalOpen(false)} imageSrc={cropImageSrc} onConfirm={handleInsertCroppedImage} />
        {isEdit && <ShareModal noteId={parseInt(noteId!)} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />}
        <LinkModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} onConfirm={setLink} initialUrl={editor?.getAttributes("link").href || ""} />
      </div>
    </TooltipProvider>
  );
}