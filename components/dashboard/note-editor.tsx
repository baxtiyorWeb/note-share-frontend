"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import NextLink from "next/link";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Dynamic Imports
const MonacoEditorWrapper = dynamic(() => import("@/components/MonacoEditorWrapper"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Editor yuklanmoqda...</p>
      </div>
    </div>
  ),
});

// Tiptap
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";

// Custom Hooks
import { useCreateNote, useUpdateNote, useNote } from "@/hooks/use-note";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";

// Icons
import {
  ArrowLeft,
  Save,
  Loader2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Image as ImageIcon,
  BookOpen,
  Sparkles,
  Wand2,
  Code,
  Calendar as CalendarIcon,
  Settings,
  MessageSquare,
  Globe,
  Twitter,
  Tag,
  Link as LinkIcon,
  Eye,
  Lock,
  Users,
  X,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

// --- Zod Schema ---
const noteSchema = z.object({
  title: z.string().min(1, "Sarlavha kiritilishi shart"),
  visibility: z.enum(["public", "private", "link-only"]).default("private"),
  allowComments: z.boolean().default(false),
  shareToTwitter: z.boolean().default(false),
  tags: z.string().optional(),
  seoSlug: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

// --- Templates ---
const templates = [
  {
    title: "Grammar Rule",
    content: `<div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-200">
      <h3 class="text-lg font-bold text-blue-900">Rule: Present Simple</h3>
      <p class="mt-2 text-blue-800"><strong>Istifoda:</strong> Odatiy holatlar, faktlar</p>
      <ul class="mt-3 space-y-1 list-disc pl-6 text-blue-700">
        <li>I <u>go</u> to school every day.</li>
        <li>Water <u>boils</u> at 100°C.</li>
      </ul>
    </div>`,
  },
  {
    title: "Speaking Topic",
    content: `<div class="bg-gradient-to-r from-pink-50 to-rose-50 p-5 rounded-xl border border-pink-200">
      <h3 class="text-lg font-bold text-pink-900">Topic: My Favorite Hobby</h3>
      <ol class="mt-3 space-y-2 list-decimal pl-6 text-pink-700">
        <li>What is your hobby?</li>
        <li>Why do you like it?</li>
        <li>How often do you do it?</li>
      </ol>
    </div>`,
  },
  {
    title: "Writing Task",
    content: `<div class="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200">
      <h3 class="text-lg font-bold text-amber-900">Task: Write an email</h3>
      <p class="mt-2 text-amber-800">Invite your friend to your birthday party. Include: date, time, place, what to bring.</p>
    </div>`,
  },
];

// --- Toolbar Button ---
const ToolbarButton = ({ isActive, onClick, children, title, disabled = false }: any) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={cn(
          "h-9 w-9 rounded-lg transition-all",
          isActive
            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={onClick}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{title}</TooltipContent>
  </Tooltip>
);

// --- Helper Functions ---
const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const applyHighlights = (html: string, plainText: string, errors: any[]) => {
  let result = html;
  errors.forEach((err, idx) => {
    const wrong = plainText.substring(err.offset, err.offset + err.length);
    if (!wrong.trim()) return;
    const safeWrong = escapeRegExp(wrong);
    const regex = new RegExp(`(${safeWrong})`, "g");
    result = result.replace(regex, `<span class="grammar-error" data-idx="${idx}">$1</span>`);
  });
  return result;
};

const detectTimeInContent = (text: string, setReminderTime: any, setLastDetectedTime: any, lastDetectedTime: string | null) => {
  const timeRegex = /(\d{1,2}):(\d{2})(?:\s?(AM|PM))?(?:\s*[-–]\s*(\d{1,2}):(\d{2})(?:\s?(AM|PM))?)?/gi;
  const matches = [...text.matchAll(timeRegex)];
  if (matches.length === 0) return;

  const match = matches[matches.length - 1];
  const [fullMatch, h1, m1] = match;

  if (fullMatch === lastDetectedTime) return;

  try {
    const hour = parseInt(h1, 10).toString().padStart(2, "0");
    const minute = m1 || "00";
    const timeString = `${hour}:${minute}`;

    setReminderTime(timeString);
    setLastDetectedTime(fullMatch);
    toast.success(`Vaqt aniqlandi: ${fullMatch} → ${timeString}`);
  } catch { }
};

// --- Main Component ---
export function NoteEditor() {
  const { id } = useParams();
  const router = useRouter();
  const noteId = Array.isArray(id) ? id[0] : id;
  const isEdit = !!noteId;

  // State
  const [isMobile, setIsMobile] = useState(false);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [grammarErrors, setGrammarErrors] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState<string>("");
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderAt, setReminderAt] = useState<string | null>(null);
  const [lastDetectedTime, setLastDetectedTime] = useState<string | null>(null);

  // Hooks
  const { data: note, isLoading: isNoteLoading } = useNote(isEdit ? Number(noteId) : 0);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      visibility: "private",
      allowComments: false,
      shareToTwitter: false,
      tags: "",
      seoSlug: "",
    },
  });

  const watched = watch();

  // --- Editor ---
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true, allowBase64: true }),
      Placeholder.configure({ placeholder: "Yozishni boshlang..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-full focus:outline-none min-h-[50vh] p-5 prose-lg",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      detectTimeInContent(text, setReminderTime, setLastDetectedTime, lastDetectedTime);
    },
  });

  // --- Effects ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load from LocalStorage
  useEffect(() => {
    if (!editor) return;
    const saved = localStorage.getItem(`note-draft-${noteId || "new"}`);
    if (saved) {
      const data = JSON.parse(saved);
      Object.keys(data).forEach((key) => setValue(key as any, data[key]));
      if (data.isCode) {
        setIsCodeMode(true);
        setCodeContent(data.content);
        setCodeLanguage(data.codeLang || "javascript");
      } else {
        editor.commands.setContent(data.content);
      }
      if (data.reminder) {
        const date = new Date(data.reminder);
        setReminderAt(data.reminder);
        setReminderDate(date);
        setReminderTime(format(date, "HH:mm"));
      }
    }
  }, [editor, noteId, setValue]);

  // Auto-save to LocalStorage
  useEffect(() => {
    if (!editor) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(
        `note-draft-${noteId || "new"}`,
        JSON.stringify({
          ...watched,
          content: isCodeMode ? codeContent : editor.getHTML(),
          isCode: isCodeMode,
          codeLang: codeLanguage,
          reminder: reminderAt,
        })
      );
    }, 1000);
    return () => clearTimeout(timeout);
  }, [watched, editor, isCodeMode, codeContent, codeLanguage, reminderAt, noteId]);

  // Load from server (edit mode)
  useEffect(() => {
    if (!editor || !isEdit || !note) return;
    setValue("title", note.title);
    setValue("tags", note.tags || "");
    setValue("seoSlug", note.seo_slug || "");

    // Normalize visibility from server (map legacy "unlisted" -> "link-only")
    const rawVisibility = note.visibility as string | undefined;
    const normalizedVisibility =
      rawVisibility === "unlisted"
        ? "link-only"
        : rawVisibility === "public"
          ? "public"
          : rawVisibility === "private"
            ? "private"
            : rawVisibility === "link-only"
              ? "link-only"
              : "private";
    setValue("visibility", normalizedVisibility as any);

    setValue("allowComments", note.allow_comments || false);
    setValue("shareToTwitter", note.share_to_twitter || false);

    if (note.is_code_mode) {
      setIsCodeMode(true);
      setCodeContent(note.content || "");
      setCodeLanguage(note.code_language || "javascript");
    } else {
      editor.commands.setContent(note.content || "");
    }

    if (note.reminder_at) {
      const date = new Date(note.reminder_at);
      setReminderAt(note.reminder_at);
      setReminderDate(date);
      setReminderTime(format(date, "HH:mm"));
    }
  }, [note, isEdit, editor, setValue]);

  // --- Core Functions ---
  const getCleanHtml = useCallback(() => {
    if (!editor) return "";
    return editor
      .getHTML()
      .replace(/<span class="grammar-error"[^>]*>/g, "")
      .replace(/<\/span>/g, "");
  }, [editor]);

  const toggleCodeMode = () => {
    setGrammarErrors([]);
    if (isCodeMode) {
      editor?.commands.setContent(codeContent);
    } else {
      setCodeContent(getCleanHtml());
    }
    setIsCodeMode(!isCodeMode);
  };

  const handleSave = (data: NoteFormData) => {
    if (!editor && !isCodeMode) return;

    const payload = {
      title: data.title,
      content: isCodeMode ? codeContent : getCleanHtml(),
      is_code_mode: isCodeMode,
      code_language: isCodeMode ? codeLanguage : null,
      reminder_at: reminderAt,
      tags: data.tags,
      seo_slug: data.seoSlug,
      visibility: data.visibility,
      allow_comments: data.allowComments,
      share_to_twitter: data.shareToTwitter,
    };

    const mutation = isEdit ? updateMutation : createMutation;
    const args = isEdit ? { id: Number(noteId), data: payload } : payload;

    toast.promise(mutation.mutateAsync(args as any), {
      loading: "Saqlanmoqda...",
      success: (res: any) => {
        localStorage.removeItem(`note-draft-${noteId || "new"}`);
        if (!isEdit) router.push(`/dashboard/edit/${res.id}`);
        return "Muvaffaqiyatli saqlandi!";
      },
      error: "Xatolik yuz berdi.",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => editor.chain().focus().setImage({ src: reader.result as string }).run();
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const checkGrammar = async () => {
    if (!editor) return;
    const text = editor.getText().trim();
    if (!text) return toast.error("Matn kiritilmagan");

    setIsAiLoading(true);
    setProgress(0);
    setGrammarErrors([]);

    const interval = setInterval(() => setProgress((p) => (p < 90 ? p + Math.random() * 10 : p)), 300);

    try {
      const res = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        body: new URLSearchParams({ text, language: "en-US", level: "picky" }),
      });
      const data = await res.json();
      clearInterval(interval);
      setProgress(100);

      if (!data.matches?.length) {
        toast.success("Xato topilmadi");
        setGrammarErrors([]);
      } else {
        setGrammarErrors(data.matches);
        const highlighted = applyHighlights(editor.getHTML(), text, data.matches);
        editor.commands.setContent(highlighted);
        toast.error(`${data.matches.length} ta xato topildi`);
      }
    } catch (e) {
      toast.error("AI xizmati bilan bog‘lanishda xatolik");
    } finally {
      setTimeout(() => setIsAiLoading(false), 600);
    }
  };

  const autoFixAll = () => {
    if (!editor || !grammarErrors.length) return;
    let text = editor.getText();
    const sorted = [...grammarErrors].sort((a, b) => b.offset - a.offset);
    sorted.forEach((err) => {
      const suggestion = err.replacements?.[0]?.value;
      if (!suggestion) return;
      text = text.slice(0, err.offset) + suggestion + text.slice(err.offset + err.length);
    });
    editor.commands.setContent(text);
    setGrammarErrors([]);
    toast.success("Barcha xatolar tuzatildi");
  };

  const insertTemplate = (content: string) => {
    editor?.chain().focus().insertContent(content).run();
    setIsTemplatesOpen(false);
  };

  const setReminder = () => {
    if (!reminderDate || !reminderTime) return toast.error("Sana va vaqtni tanlang");
    const [h, m] = reminderTime.split(":").map(Number);
    const full = new Date(reminderDate);
    full.setHours(h, m, 0, 0);
    const iso = full.toISOString();
    setReminderAt(iso);
    setIsReminderOpen(false);
    toast.success(`Eslatma: ${format(full, "PPP pp", { locale: uz })}`);
  };

  const clearReminder = () => {
    setReminderAt(null);
    setReminderDate(undefined);
    setReminderTime("");
    toast.success("Eslatma o‘chirildi");
  };

  // --- Loading ---
  if (isNoteLoading && isEdit) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit(handleSave)} className="min-h-screen flex flex-col">
        <style jsx global>{`
          .grammar-error {
            text-decoration-line: underline;
            text-decoration-style: wavy;
            text-decoration-color: #ef4444;
            text-underline-offset: 3px;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>

        {/* HEADER */}
        <header className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="flex items-center justify-between p-3 gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button variant="ghost" size="icon" asChild>
                <NextLink href="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </NextLink>
              </Button>
              <Input
                placeholder="Sarlavha..."
                {...register("title")}
                className="text-xl font-bold border-none bg-transparent flex-1 min-w-0"
              />
            </div>

            <div className="hidden md:flex items-center gap-2">
              {isCodeMode && (
                <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["javascript", "typescript", "html", "css", "json", "markdown", "python", "java", "csharp"].map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <ToolbarButton onClick={toggleCodeMode} title={isCodeMode ? "WYSIWYG" : "Code"}>
                {isCodeMode ? <BookOpen className="w-5 h-5" /> : <Code className="w-5 h-5" />}
              </ToolbarButton>

              <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={isMobile ? "bottom" : "right"} className={cn(isMobile ? "h-[90vh] rounded-t-2xl" : "w-full max-w-md")}>
                  <SettingsPanel watch={watch} setValue={setValue} control={control} />
                </SheetContent>
              </Sheet>

              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Saqlash
              </Button>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {errors.title && <p className="text-red-600 text-sm px-4 pb-2">{errors.title.message}</p>}
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 bg-gradient-to-br from-indigo-50/50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
          <div className="max-w-5xl mx-auto bg-white dark:bg-gray-950 rounded-2xl shadow-xl overflow-hidden">
            {isCodeMode ? (
              <div className="h-[calc(100vh-12rem)]">
                <MonacoEditorWrapper
                  value={codeContent}
                  onChange={(value) => setCodeContent(value ?? "")}
                  language={codeLanguage}
                />
              </div>
            ) : (
              <div className="min-h-[60vh]">{editor && <EditorContent editor={editor} />}</div>
            )}

            {/* AI Progress */}
            <AnimatePresence>
              {isAiLoading && !isCodeMode && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4">
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-white" style={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-center mt-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">AI tekshiruv: {Math.round(progress)}%</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grammar Errors */}
            {!isCodeMode && grammarErrors.length > 0 && (
              <div className="m-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-semibold text-red-700 dark:text-red-400">{grammarErrors.length} ta xato</p>
                  <Button size="sm" onClick={autoFixAll} className="gap-2">
                    <Wand2 className="w-4 h-4" /> Tuzatish
                  </Button>
                </div>
                <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {grammarErrors.map((e, i) => {
                    const wrong = editor?.getText().substring(e.offset, e.offset + e.length) || "";
                    const sug = e.replacements?.[0]?.value || "";
                    return (
                      <div key={i} className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <span className="font-mono bg-red-100 dark:bg-red-800 px-1 rounded">"{wrong}"</span>
                        <span className="text-xs">→ {sug}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* TOOLBARS */}
        {!isCodeMode && editor && (
          <>
            {/* Mobile Toolbar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-3 flex gap-2 justify-center z-40 md:hidden">
              <ToolbarButton isActive={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Qalin">
                <Bold className="w-5 h-5" />
              </ToolbarButton>
              <ToolbarButton isActive={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Kursiv">
                <Italic className="w-5 h-5" />
              </ToolbarButton>
              <ToolbarButton onClick={checkGrammar} disabled={isAiLoading} title="Grammar">
                {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </ToolbarButton>
              <Popover open={isReminderOpen} onOpenChange={setIsReminderOpen}>
                <PopoverTrigger asChild>
                  <ToolbarButton title="Eslatma">
                    <CalendarIcon className={cn("w-5 h-5", reminderAt && "text-indigo-600")} />
                  </ToolbarButton>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <ReminderPopover reminderDate={reminderDate} setReminderDate={setReminderDate} reminderTime={reminderTime} setReminderTime={setReminderTime} setReminder={setReminder} clearReminder={clearReminder} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Desktop Toolbar */}
            <div className="hidden md:flex fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-4 justify-center z-40">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-xl">
                <ToolbarButton isActive={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
                  <Bold />
                </ToolbarButton>
                <ToolbarButton isActive={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
                  <Italic />
                </ToolbarButton>
                <ToolbarButton isActive={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
                  <UnderlineIcon />
                </ToolbarButton>
                <Separator orientation="vertical" className="h-8 mx-1" />
                <ToolbarButton isActive={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1">
                  <Heading1 />
                </ToolbarButton>
                <ToolbarButton isActive={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">
                  <Heading2 />
                </ToolbarButton>
                <Separator orientation="vertical" className="h-8 mx-1" />
                <ToolbarButton isActive={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Ro‘yxat">
                  <List />
                </ToolbarButton>
                <ToolbarButton isActive={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Raqamli">
                  <ListOrdered />
                </ToolbarButton>
                <ToolbarButton onClick={checkGrammar} disabled={isAiLoading} title="Grammar Check">
                  {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles />}
                </ToolbarButton>
                <Popover open={isReminderOpen} onOpenChange={setIsReminderOpen}>
                  <PopoverTrigger asChild>
                    <ToolbarButton title="Eslatma">
                      <CalendarIcon className={cn("w-5 h-5", reminderAt && "text-indigo-600")} />
                    </ToolbarButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <ReminderPopover reminderDate={reminderDate} setReminderDate={setReminderDate} reminderTime={reminderTime} setReminderTime={setReminderTime} setReminder={setReminder} clearReminder={clearReminder} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        )}

        {/* Hidden Input */}
        <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
      </form>
    </TooltipProvider>
  );
}

// --- Settings Panel ---
const SettingsPanel = ({ watch, setValue }: any) => (
  <div className="p-6 space-y-8 overflow-y-auto h-full">
    <SheetHeader>
      <SheetTitle className="text-2xl font-bold flex items-center gap-3">
        <Settings className="w-6 h-6" /> Post Sozlamalari
      </SheetTitle>
      <p className="text-sm text-gray-500">Ko‘rinish, interaksiya va SEO</p>
    </SheetHeader>

    <div className="space-y-6">
      <div>
        <Label>Ko‘rinish</Label>
        <Select value={watch("visibility")} onValueChange={(v) => setValue("visibility", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public"><Globe className="w-4 h-4 inline mr-2" />Hamma</SelectItem>
            <SelectItem value="link-only"><LinkIcon className="w-4 h-4 inline mr-2" />Link orqali</SelectItem>
            <SelectItem value="private"><Lock className="w-4 h-4 inline mr-2" />Shaxsiy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="comments" className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Sharhlar</Label>
          <Switch id="comments" checked={watch("allowComments")} onCheckedChange={(v) => setValue("allowComments", v)} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="twitter" className="flex items-center gap-2"><Twitter className="w-4 h-4" /> Twitterda ulashish</Label>
          <Switch id="twitter" checked={watch("shareToTwitter")} onCheckedChange={(v) => setValue("shareToTwitter", v)} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Teglar</Label>
        <Input placeholder="grammatika, ingliz tili" value={watch("tags")} onChange={(e) => setValue("tags", e.target.value)} />
      </div>

      <div className="space-y-3">
        <Label>SEO Slug</Label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-sm text-gray-500">/post/</span>
          <Input className="pl-20" placeholder="present-simple" value={watch("seoSlug")} onChange={(e) => setValue("seoSlug", e.target.value)} />
        </div>
      </div>
    </div>
  </div>
);

// --- Reminder Popover ---
const ReminderPopover = ({ reminderDate, setReminderDate, reminderTime, setReminderTime, setReminder, clearReminder }: any) => (
  <div className="space-y-4">
    <Calendar mode="single" selected={reminderDate} onSelect={setReminderDate} locale={uz} className="rounded-md border" />
    <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
    <div className="flex gap-2">
      <Button onClick={setReminder} className="flex-1"><Check className="w-4 h-4 mr-1" /> O‘rnatish</Button>
      <Button variant="destructive" onClick={clearReminder} className="flex-1"><X className="w-4 h-4 mr-1" /> O‘chirish</Button>
    </div>
  </div>
);