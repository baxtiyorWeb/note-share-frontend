"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import NextLink from "next/link";
import dynamic from "next/dynamic";

const MonacoEditorWrapper = dynamic(() => import("./../MonacoEditorWrapper"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] flex items-center justify-center dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
      Kod muharriri yuklanmoqda...
    </div>
  ),
});

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

import { useCreateNote, useUpdateNote, useNote } from "@/hooks/use-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  Link2,
  BookOpen,
  Sparkles,
  Wand2,
  Moon,
  Sun,
  Focus,
  X,
  Code,
  Calendar,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { uz } from "date-fns/locale";

const noteSchema = z.object({
  title: z.string().min(1, "Sarlavha kiritilishi shart"),
});
type NoteFormData = z.infer<typeof noteSchema>;

const templates = [
  {
    title: "Grammar Rule",
    content: `<div class="bg-blue-50 p-4 rounded-lg"><h3 class="font-bold">Rule: Present Simple</h3><p><strong>Use:</strong> Habits, facts</p><ul class="list-disc pl-5"><li>I <u>go</u> to school.</li><li>Water <u>boils</u> at 100°C.</li></ul></div>`,
  },
  {
    title: "Speaking Topic",
    content: `<div class="bg-pink-50 p-4 rounded-lg"><h3 class="font-bold">Topic: My Favorite Hobby</h3><ol class="list-decimal pl-5"><li>What is your hobby?</li><li>Why do you like it?</li><li>How often do you do it?</li></ol></div>`,
  },
  {
    title: "Writing Task",
    content: `<div class="bg-amber-50 p-4 rounded-lg"><h3 class="font-bold">Task: Write an email to a friend</h3><p>Invite your friend to your birthday party. Include: date, time, place, what to bring.</p></div>`,
  },
];

const ToolbarButton = ({ isActive, onClick, children, title }: any) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-lg",
          isActive ? "bg-indigo-100 text-indigo-600" : "text-gray-600 hover:bg-indigo-50",
        )}
        onClick={onClick}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{title}</TooltipContent>
  </Tooltip>
);

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const applyHighlights = (html: string, plainText: string, errors: any[]) => {
  let result = html;
  errors.forEach((err, idx) => {
    const wrong = plainText.substring(err.offset, err.offset + err.length);
    if (!wrong.trim()) return;
    const safeWrong = escapeRegExp(wrong);
    const regex = new RegExp(safeWrong, "");
    result = result.replace(
      regex,
      `<span class="grammar-error" data-idx="${idx}">${wrong}</span>`,
    );
  });
  return result;
};

export function NoteEditor() {
  const { id } = useParams();
  const router = useRouter();
  const noteId = Array.isArray(id) ? id[0] : id;
  const isEdit = !!noteId;

  const [isDark, setIsDark] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [grammarErrors, setGrammarErrors] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState("en-US");
  const [translation, setTranslation] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptErrors, setPromptErrors] = useState<any[]>([]);
  const [isPromptLoading, setIsPromptLoading] = useState(false);

  // Reminder states
  const [reminderDate, setReminderDate] = useState<Date | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState<string>("");
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderAt, setReminderAt] = useState<string | null>(null); // ISO string

  const { data: note, isLoading: isNoteLoading } = useNote(isEdit ? Number(noteId) : 0);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "" },
  });

  const imageInputRef = useRef<HTMLInputElement>(null);

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
        class: "prose max-w-full focus:outline-none min-h-[50vh] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      detectTimeInContent(editor.getText());
    },
  });

  const detectTimeInContent = (text: string) => {
    const timeRegex = /(\d{1,2}):(\d{2})(–|\s*-\s*)(\d{1,2}):(\d{2})\s*(AM|PM)?/gi;
    const match = text.match(timeRegex);
    if (match) {
      const detectedTime = match[0];
      try {
        const [start, , , , end] = detectedTime.split(/[:–-]/);
        const parsedStart = parseInt(start.trim());
        const parsedEnd = parseInt(end.trim());
        const avgHour = Math.floor((parsedStart + parsedEnd) / 2);
        setReminderTime(`${avgHour.toString().padStart(2, '0')}:00`);
        toast.success(`Avtomatik vaqt aniqlandi: ${detectedTime} → ${reminderTime}`);
      } catch {
        // ignore
      }
    }
  };

  // Draft yuklash
  useEffect(() => {
    if (!editor) return;
    const saved = localStorage.getItem(`note-draft-${noteId || "new"}`);
    if (saved) {
      const { title, content, isCode, codeLang, reminder } = JSON.parse(saved);
      setValue("title", title);

      if (isCode) {
        setCodeContent(content);
        setIsCodeMode(true);
        setCodeLanguage(codeLang || "javascript");
      } else {
        editor.commands.setContent(content);
        setIsCodeMode(false);
      }

      if (reminder) {
        setReminderAt(reminder);
        const dateObj = new Date(reminder);
        setReminderDate(dateObj);
        setReminderTime(format(dateObj, "HH:mm"));
      }
    }
  }, [editor, noteId, setValue]);

  // Draft avtomatik saqlash
  useEffect(() => {
    if (!editor) return;
    const handler = setTimeout(() => {
      const title = (document.querySelector('input[placeholder="Sarlavha..."]') as HTMLInputElement)?.value || "";
      localStorage.setItem(
        `note-draft-${noteId || "new"}`,
        JSON.stringify({
          title,
          content: isCodeMode ? codeContent : editor.getHTML(),
          isCode: isCodeMode,
          codeLang: codeLanguage,
          reminder: reminderAt,
        }),
      );
    }, 1000);
    return () => clearTimeout(handler);
  }, [editor, noteId, isCodeMode, codeContent, codeLanguage, reminderAt]);

  // Backenddan note yuklash
  useEffect(() => {
    if (!editor) return;
    if (isEdit && note) {
      setValue("title", note.title);
      if (note.is_code_mode) {
        setIsCodeMode(true);
        setCodeContent(note.content || "");
        setCodeLanguage(note.code_language || "javascript");
      } else {
        setIsCodeMode(false);
        editor.commands.setContent(note.content || "");
      }
      if (note.reminder_at) {
        setReminderAt(note.reminder_at);
        const dateObj = new Date(note.reminder_at);
        setReminderDate(dateObj);
        setReminderTime(format(dateObj, "HH:mm"));
      }
    }
  }, [note, isEdit, setValue, editor]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const getCleanHtml = () => {
    if (!editor) return "";
    const raw = editor.getHTML();
    return raw
      .replace(/<span class="grammar-error"[^>]*>/g, "")
      .replace(/<\/span>/g, "");
  };

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
    if (!editor) return;

    const contentToSave = isCodeMode ? codeContent : getCleanHtml();

    const payload = {
      title: data.title,
      content: contentToSave,
      is_code_mode: isCodeMode,
      code_language: isCodeMode ? codeLanguage : null,
      reminder_at: reminderAt, // Backendga yuboriladi
    };

    const mutation = isEdit ? updateMutation : createMutation;
    const args = isEdit ? { id: Number(noteId), data: payload } : payload;

    toast.promise(mutation.mutateAsync(args as any), {
      loading: "Saqlanmoqda...",
      success: (res: any) => {
        localStorage.removeItem(`note-draft-${noteId || "new"}`);
        if (!isEdit) router.push(`/dashboard/edit/${res.id}`);
        return "Saqlandi!";
      },
      error: "Xatolik yuz berdi.",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () =>
      editor.chain().focus().setImage({ src: reader.result as string }).run();
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const checkGrammar = async () => {
    if (!editor) return;
    const plainText = editor.getText();
    if (!plainText.trim()) {
      toast.error("Matn kiritilmagan");
      return;
    }

    setIsAiLoading(true);
    setProgress(0);
    setGrammarErrors([]);

    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 8 : p));
    }, 300);

    try {
      const res = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          text: plainText,
          language,
          level: "picky",
          enabledOnly: "false",
        }),
      });

      const data = await res.json();
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setIsAiLoading(false), 600);

      if (!data.matches || data.matches.length === 0) {
        toast.success("Hech qanday xato topilmadi");
        setGrammarErrors([]);
        return;
      }

      setGrammarErrors(data.matches);
      const currentHtml = editor.getHTML();
      const highlightedHtml = applyHighlights(currentHtml, plainText, data.matches);
      editor.commands.setContent(highlightedHtml);
      toast.error(`${data.matches.length} ta xato topildi`);
    } catch (e) {
      console.error(e);
      clearInterval(interval);
      setIsAiLoading(false);
      toast.error("AI bilan bog‘lanishda xatolik");
    }
  };

  const autoFixAll = () => {
    if (!editor || grammarErrors.length === 0) return;
    let text = editor.getText();
    const sorted = [...grammarErrors].sort((a, b) => b.offset - a.offset);
    sorted.forEach((err) => {
      const suggestion = err.replacements?.[0]?.value;
      if (!suggestion) return;
      const start = err.offset;
      const end = start + err.length;
      text = text.slice(0, start) + suggestion + text.slice(end);
    });
    editor.commands.setContent(text);
    setGrammarErrors([]);
    toast.success("Barcha xatolar avtomatik tuzatildi");
  };

  const handleTranslate = async () => {
    if (!editor) return;
    const text = isCodeMode ? codeContent.trim() : editor.getText().trim();
    if (!text) {
      toast.error("Tarjima uchun matn yo‘q");
      return;
    }
    setIsTranslating(true);
    setTranslation("");

    try {
      const res = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "en",
          target: "uz",
          format: "text",
        }),
      });

      const data = await res.json();
      if (data?.translatedText) {
        setTranslation(data.translatedText);
      } else {
        toast.error("Tarjima olinmadi");
      }
    } catch (e) {
      console.error(e);
      toast.error("Tarjima xatosi");
    } finally {
      setIsTranslating(false);
    }
  };

  const checkPromptGrammar = async () => {
    const text = promptText.trim();
    if (!text) {
      toast.error("Prompt matni bo‘sh");
      return;
    }

    setIsPromptLoading(true);
    setPromptErrors([]);

    try {
      const res = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          text,
          language,
          level: "picky",
          enabledOnly: "false",
        }),
      });

      const data = await res.json();
      setPromptErrors(data.matches || []);
    } catch (e) {
      console.error(e);
      toast.error("Prompt AI tekshiruvda xatolik");
    } finally {
      setIsPromptLoading(false);
    }
  };

  const insertTemplate = (content: string) => {
    editor?.chain().focus().insertContent(content).run();
    setIsTemplatesOpen(false);
  };

  const setReminder = () => {
    if (!reminderDate || !reminderTime) {
      toast.error("Sana va vaqtni tanlang");
      return;
    }
    const [hours, minutes] = reminderTime.split(":").map(Number);
    const fullDate = new Date(reminderDate);
    fullDate.setHours(hours, minutes, 0, 0);
    const isoString = fullDate.toISOString();
    setReminderAt(isoString);
    setIsReminderOpen(false);
    toast.success(`Eslatma o'rnatildi: ${format(fullDate, "PPP pp", { locale: uz })}`);
  };

  const clearReminder = () => {
    setReminderAt(null);
    setReminderDate(undefined);
    setReminderTime("");
    toast.success("Eslatma o'chirildi");
  };

  if (isNoteLoading && isEdit) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "min-h-screen flex flex-col",
          isDark ? "dark bg-gray-900" : "bg-gradient-to-br from-indigo-50 to-gray-100",
        )}
      >
        <style jsx global>{`
          .grammar-error {
            text-decoration-line: underline;
            text-decoration-style: wavy;
            text-decoration-color: #ef4444;
            text-underline-offset: 3px;
          }
        `}</style>

        <header className="bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-indigo-200 dark:border-indigo-800 sticky top-0 z-10">
          <div className="flex items-center justify-between p-3 gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Button variant="ghost" size="icon" asChild>
                <NextLink href="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </NextLink>
              </Button>
              <Input
                placeholder="Sarlavha..."
                {...register("title")}
                className="text-xl font-bold border-none bg-transparent flex-1"
              />
            </div>

            <div className="flex items-center gap-2">
              {isCodeMode ? (
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="border border-indigo-200 dark:border-indigo-700 rounded-md px-2 py-1 text-sm dark:bg-gray-900 dark:text-white"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                </select>
              ) : (
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-indigo-200 dark:border-indigo-700 rounded-md px-2 py-1 text-sm dark:bg-gray-900 dark:text-white"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="ru-RU">Русский</option>
                  <option value="de-DE">Deutsch</option>
                  <option value="uz">O‘zbek</option>
                </select>
              )}

              <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCodeMode}
                title={isCodeMode ? "Note Editorga o‘tish" : "Code Editorga o‘tish"}
              >
                {isCodeMode ? <BookOpen className="w-5 h-5 text-indigo-600" /> : <Code className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          {errors.title && (
            <p className="text-red-600 text-sm text-center pb-2">{errors.title.message}</p>
          )}
        </header>

        <main className="flex-1 p-4 pb-24">
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg p-4 min-h-full">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                {isCodeMode ? (
                  <MonacoEditorWrapper
                    value={codeContent}
                    onChange={(value) => setCodeContent(value ?? "")}
                    language={codeLanguage}
                    isDark={isDark}
                  />
                ) : (
                  editor && <EditorContent editor={editor} />
                )}

                {!isCodeMode && (
                  <AnimatePresence>
                    {isAiLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-4"
                      >
                        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2 rounded-full overflow-hidden">
                          <motion.div
                            className="h-2 bg-white/70"
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "easeOut", duration: 0.3 }}
                          />
                        </div>
                        <motion.p
                          className="text-center mt-2 text-indigo-700 dark:text-indigo-300 font-medium"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          AI tekshiruv → {Math.round(progress)}%
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {!isCodeMode && grammarErrors.length > 0 && (
                  <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        {grammarErrors.length} ta xato topildi:
                      </p>
                      <Button
                        size="sm"
                        onClick={autoFixAll}
                        variant="outline"
                        className="gap-2"
                      >
                        <Wand2 className="w-4 h-4 text-indigo-600" />
                        Auto Fix All
                      </Button>
                    </div>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {grammarErrors.map((e, i) => {
                        const fullText = editor?.getText() || "";
                        const wrong = fullText.substring(e.offset, e.offset + e.length);
                        const suggestion = e.replacements?.[0]?.value || "taklif yo‘q";
                        return (
                          <li key={i}>
                            <span className="font-semibold text-red-500">“{wrong}”</span> →{" "}
                            {e.message}{" "}
                            <span className="text-indigo-600">(taklif: {suggestion})</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <aside className="w-full md:w-80 space-y-4">
                <div className="border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 bg-indigo-50/60 dark:bg-indigo-950/40">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-indigo-700 dark:text-indigo-200 text-sm">
                      Tarjima (English → Uzbek)
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleTranslate}
                      disabled={isTranslating}
                    >
                      {isTranslating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {translation ? (
                    <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                      {translation}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Matnni muharrirga yozing va yuqoridagi tugmani bosing.
                    </p>
                  )}
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
                  <p className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-100">
                    Prompt / Kichik matn uchun AI check
                  </p>
                  <textarea
                    className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 mb-2 resize-none h-20"
                    placeholder="Masalan: Yesterday I go to school with my friend..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="w-full mb-2"
                    variant="outline"
                    onClick={checkPromptGrammar}
                    disabled={isPromptLoading}
                  >
                    {isPromptLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Promptni tekshirish
                  </Button>
                  {promptErrors.length > 0 && (
                    <ul className="text-xs space-y-1 max-h-28 overflow-auto">
                      {promptErrors.map((e, i) => {
                        const w = promptText.substring(e.offset, e.offset + e.length);
                        const sug = e.replacements?.[0]?.value || "taklif yo‘q";
                        return (
                          <li key={i}>
                            <span className="font-semibold text-red-500">“{w}”</span> →{" "}
                            {e.message} (
                            <span className="text-indigo-600">{sug}</span>)
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </main>

        {editor && !isCodeMode && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-indigo-200 dark:border-indigo-800 p-2 flex flex-wrap gap-1 justify-center z-20">
            <ToolbarButton
              isActive={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Qalin"
            >
              <Bold />
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <Italic />
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Tag chiziq"
            >
              <UnderlineIcon />
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive("heading", { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="H1"
            >
              <Heading1 />
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="H2"
            >
              <Heading2 />
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Nuqtali ro‘yxat"
            >
              <List />
            </ToolbarButton>
            <ToolbarButton
              isActive={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Raqamli ro‘yxat"
            >
              <ListOrdered />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => imageInputRef.current?.click()}
              title="Rasm qo‘shish"
            >
              <ImageIcon />
            </ToolbarButton>

            <Sheet open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <BookOpen />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-96">
                <SheetHeader>
                  <SheetTitle>Andozalar</SheetTitle>
                </SheetHeader>
                <div className="space-y-2 mt-4">
                  {templates.map((t, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => insertTemplate(t.content)}
                    >
                      {t.title}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <Button
              size="icon"
              variant="ghost"
              onClick={checkGrammar}
              disabled={isAiLoading}
              className="h-10 w-10"
            >
              {isAiLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              ) : (
                <Sparkles />
              )}
            </Button>

            <Popover open={isReminderOpen} onOpenChange={setIsReminderOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  title="Eslatma o'rnatish"
                >
                  <Calendar className={cn("w-5 h-5", reminderAt && "text-indigo-600")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                  <CalendarComponent
                    mode="single"
                    selected={reminderDate}
                    onSelect={setReminderDate}
                    initialFocus
                    className="rounded-md border"
                  />
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button onClick={setReminder} className="flex-1">
                      O‘rnatish
                    </Button>
                    <Button variant="destructive" onClick={clearReminder} className="flex-1">
                      O‘chirish
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleSubmit(handleSave)}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 text-white hover:bg-indigo-500 h-10 px-4 ml-2"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Saqlash
            </Button>
          </div>
        )}

        {isCodeMode && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-indigo-200 dark:border-indigo-800 p-2 flex justify-end z-20">
            <Button
              onClick={handleSubmit(handleSave)}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 text-white hover:bg-indigo-500 h-10 px-4"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Saqlash
            </Button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </TooltipProvider>
  );
}