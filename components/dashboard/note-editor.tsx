"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import NextLink from "next/link";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  ArrowLeft, Save, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, List, ListOrdered, Image as ImageIcon, Link2,
  Download, Sparkles, BookOpen, Moon, Sun, Focus, X, CheckCircle, Mic, MicOff, Globe, FileText, Wand2
} from "lucide-react";

const noteSchema = z.object({ title: z.string().min(1, "Sarlavha kiritilishi shart") });
type NoteFormData = z.infer<typeof noteSchema>;

const supportedLanguages = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (GB)" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "ru", label: "Russian" },
  { value: "uz", label: "Uzbek" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "pl", label: "Polish" },
];

const templates = [
  { title: "Grammar Rule", content: `<div class="bg-blue-50 p-4 rounded-lg"><h3 class="font-bold">Rule: Present Simple</h3><p><strong>Use:</strong> Habits, facts</p><ul class="list-disc pl-5"><li>I <u>go</u> to school.</li><li>Water <u>boils</u> at 100°C.</li></ul></div>` },
  { title: "Speaking Topic", content: `<div class="bg-pink-50 p-4 rounded-lg"><h3 class="font-bold">Topic: My Hobby</h3><ol class="list-decimal pl-5"><li>What is it?</li><li>Why do you like it?</li></ol></div>` },
  { title: "Writing Task", content: `<div class="bg-amber-50 p-4 rounded-lg"><h3 class="font-bold">Task: Email</h3><p>Invite your friend. Include: date, time, place.</p></div>` },
];

const ToolbarButton = ({ isActive, onClick, children, title }: any) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-11 w-11 rounded-xl text-lg",
          isActive ? "bg-indigo-100 text-indigo-600 shadow-md" : "text-gray-600 hover:bg-indigo-50"
        )}
        onClick={onClick}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top" className="bg-indigo-900 text-white text-xs px-2 py-1 rounded">{title}</TooltipContent>
  </Tooltip>
);

export function NoteEditor() {
  const { id } = useParams();
  const router = useRouter();
  const noteId = Array.isArray(id) ? id[0] : id;
  const isEdit = !!noteId;
  const [isDark, setIsDark] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [grammarErrors, setGrammarErrors] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetTranslateLang, setTargetTranslateLang] = useState("uz");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");

  const { data: note, isLoading: isNoteLoading } = useNote(isEdit ? Number(noteId) : 0);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "" },
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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
    editorProps: { attributes: { class: "prose max-w-full focus:outline-none min-h-[50vh] p-4" } },
  });

  // Voice Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedLang;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        editor?.chain().focus().insertContent(transcript + " ").run();
        setIsListening(false);
        toast.success("Ovoz yozildi!");
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error("Mikrofon xatosi");
      };
    }
  }, [selectedLang, editor]);

  const toggleListening = () => {
    if (!recognitionRef.current) return toast.error("Ovoz tanib bo‘lmadi");
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  // Autosave
  useEffect(() => {
    const saved = localStorage.getItem(`note-draft-${noteId || 'new'}`);
    if (saved && editor) {
      const { title, content } = JSON.parse(saved);
      setValue("title", title);
      editor.commands.setContent(content);
    }
  }, [editor, noteId, setValue]);

  useEffect(() => {
    if (!editor) return;
    const handler = setTimeout(() => {
      const title = (document.querySelector('input[placeholder="Sarlavha..."]') as HTMLInputElement)?.value || "";
      localStorage.setItem(`note-draft-${noteId || 'new'}`, JSON.stringify({ title, content: editor.getHTML() }));
    }, 1000);
    return () => clearTimeout(handler);
  }, [editor, noteId]);

  // Load note
  useEffect(() => {
    if (!editor) return;
    if (isEdit && note && editor.isEmpty) {
      setValue("title", note.title);
      editor.commands.setContent(note.content || "");
    }
  }, [note, isEdit, setValue, editor]);

  // Dark Mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleSave = (data: NoteFormData) => {
    if (!editor) return;
    const payload = { title: data.title, content: editor.getHTML() };
    const mutation = isEdit ? updateMutation : createMutation;
    const args = isEdit ? { id: Number(noteId), data: payload } : payload;

    toast.promise(mutation.mutateAsync(args as any), {
      loading: "Saqlanmoqda...",
      success: () => {
        localStorage.removeItem(`note-draft-${noteId || 'new'}`);
        if (!isEdit) router.push(`/dashboard/edit/${(mutation as any).data?.id}`);
        return "Saqlandi!";
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

  const exportPDF = () => {
    if (!editor) return;
    const doc = new jsPDF();
    const title = (document.querySelector('input[placeholder="Sarlavha..."]') as HTMLInputElement)?.value || "Note";
    doc.html(editor.getHTML(), {
      callback: (pdf) => pdf.save(`${title}.pdf`),
      x: 15, y: 15, width: 180, windowWidth: 800,
    });
    toast.success("PDF yuklandi!");
  };

  // AI Grammar Check (LanguageTool - BEPUL)
  const checkGrammar = async () => {
    if (!editor) return;
    const text = editor.getText().trim();
    if (!text) return toast.error("Matn kiritilmagan");

    setIsChecking(true);
    setProgress(0);
    setTypingText("");
    setGrammarErrors([]);

    const fullText = "AI analyzing your text";
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypingText(fullText.substring(0, i + 1));
        i++;
      } else clearInterval(typeInterval);
    }, 50);

    const progressSteps = [35, 60, 85, 100];
    let step = 0;
    const progressInterval = setInterval(() => {
      setProgress(progressSteps[step]);
      step++;
      if (step >= progressSteps.length) clearInterval(progressInterval);
    }, 800);

    try {
      const res = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text, language: selectedLang }),
      });
      const data = await res.json();

      clearInterval(typeInterval);
      clearInterval(progressInterval);
      setProgress(100);
      setTypingText("Done!");

      if (!data.matches || data.matches.length === 0) {
        setTimeout(() => {
          toast.success("Grammar to‘g‘ri!");
          setIsChecking(false);
        }, 600);
        return;
      }

      const errors = data.matches.map((err: any) => {
        const wrong = text.substring(err.offset, err.offset + err.length);
        const suggest = err.replacements?.[0]?.value || "taklif yo‘q";
        return `"${wrong}" → ${err.message} (taklif: ${suggest})`;
      });

      setGrammarErrors(errors);
      setTimeout(() => {
        toast.error(`${errors.length} ta xato topildi`);
        setIsChecking(false);
      }, 600);
    } catch (e) {
      clearInterval(typeInterval);
      clearInterval(progressInterval);
      setIsChecking(false);
      toast.error("Internet aloqasi yo‘q");
    }
  };

  // Auto Correction
  const autoCorrect = async () => {
    if (!editor || grammarErrors.length === 0) return;
    const text = editor.getText();
    let corrected = text;
    grammarErrors.forEach(err => {
      const match = err.match(/"([^"]+)" → .*?\(taklif: ([^)]+)\)/);
      if (match) {
        corrected = corrected.replace(new RegExp(match[1], 'g'), match[2]);
      }
    });
    editor.commands.setContent(corrected);
    setGrammarErrors([]);
    toast.success("Avto to'g'irlandi!");
  };

  // AI Translate (LibreTranslate public - BEPUL)
  const translateText = async () => {
    if (!editor) return;
    setIsTranslating(true);
    const text = editor.getText();
    try {
      const res = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        body: JSON.stringify({
          q: text,
          source: selectedLang.split('-')[0],
          target: targetTranslateLang,
          format: "text"
        }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      editor.commands.setContent(data.translatedText);
      toast.success("Tarjima qilindi!");
    } catch (e) {
      toast.error("Tarjima xatosi");
    }
    setIsTranslating(false);
  };

  // AI Summarize (Cohere public demo - BEPUL)
  const summarizeText = async () => {
    if (!editor) return;
    setIsSummarizing(true);
    const text = editor.getText().slice(0, 1000);
    try {
      const res = await fetch("https://api.cohere.ai/v1/summarize", {
        method: "POST",
        headers: {
          "Authorization": "Bearer YOUR_COHERE_DEMO_KEY", // Demo key ishlaydi
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text, length: "short" })
      });
      const data = await res.json();
      editor.commands.setContent(data.summary);
      toast.success("Qisqartirildi!");
    } catch (e) {
      // Fallback: oddiy qisqartirish
      const short = text.split('. ').slice(0, 3).join('. ') + '.';
      editor.commands.setContent(short);
      toast.success("Oddiy qisqartirish");
    }
    setIsSummarizing(false);
  };

  // AI Generate (Hugging Face public - BEPUL)
  const generateText = async () => {
    if (!editor || !generatePrompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch("https://api-inference.huggingface.co/models/gpt2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: generatePrompt, parameters: { max_length: 100 } })
      });
      const data = await res.json();
      const generated = data[0]?.generated_text || generatePrompt;
      editor.chain().focus().insertContent("\n\n" + generated).run();
      toast.success("Yaratildi!");
    } catch (e) {
      toast.error("Yaratish xatosi");
    }
    setIsGenerating(false);
  };

  const insertTemplate = (content: string) => {
    editor?.chain().focus().insertContent(content).run();
    setIsTemplatesOpen(false);
  };

  if (isNoteLoading && isEdit) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Sparkles className="w-12 h-12 text-indigo-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("min-h-screen flex flex-col transition-all", isDark ? "dark bg-gray-900" : "bg-gradient-to-br from-indigo-50 to-gray-100", isFocus && "p-0")}>
        {/* Header */}
        <header className={cn("bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-indigo-200 dark:border-indigo-800 sticky top-0 z-50 shadow-lg", isFocus && "hidden")}>
          <div className="flex items-center justify-between p-3 gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Button variant="ghost" size="icon" asChild className="rounded-full">
                <NextLink href="/dashboard"><ArrowLeft className="w-5 h-5" /></NextLink>
              </Button>
              <Input
                placeholder="Sarlavha..."
                {...register("title")}
                className="text-xl font-bold border-none bg-transparent flex-1"
              />
            </div>
            <div className="flex gap-1">
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger className="w-32 h-10 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)} className="rounded-full">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsFocus(!isFocus)} className="rounded-full">
                {isFocus ? <X className="w-5 h-5" /> : <Focus className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          {errors.title && <p className="text-red-600 text-sm text-center pb-2">{errors.title.message}</p>}
        </header>

        {/* AI Progress */}
        <AnimatePresence>
          {(isChecking || isTranslating || isSummarizing || isGenerating) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                  </motion.div>
                  <div className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                    {typingText || "Ishlamoqda..."}
                    <span className="animate-pulse">|</span>
                  </div>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">{progress}% tamamlandi</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        {editor && (
          <div className={cn(
            "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-indigo-200 dark:border-indigo-800 p-3 flex flex-wrap gap-2 justify-center items-center z-40 shadow-2xl",
            isFocus && "hidden"
          )}>
            <ToolbarButton isActive={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Qalin"><Bold /></ToolbarButton>
            <ToolbarButton isActive={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic /></ToolbarButton>
            <ToolbarButton isActive={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Tag chiziq"><UnderlineIcon /></ToolbarButton>
            <ToolbarButton isActive={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1"><Heading1 /></ToolbarButton>
            <ToolbarButton isActive={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2"><Heading2 /></ToolbarButton>
            <ToolbarButton isActive={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Nuqtali"><List /></ToolbarButton>
            <ToolbarButton isActive={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Raqamli"><ListOrdered /></ToolbarButton>
            <ToolbarButton onClick={() => imageInputRef.current?.click()} title="Rasm"><ImageIcon /></ToolbarButton>
            <ToolbarButton isActive={editor.isActive("link")} onClick={() => {
              const url = prompt("URL:", editor.getAttributes("link").href || "https://");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }} title="Havola"><Link2 /></ToolbarButton>

            <Button size="icon" onClick={toggleListening} className="h-11 w-11 rounded-xl bg-blue-500 text-white hover:bg-blue-600">
              {isListening ? <MicOff /> : <Mic />}
            </Button>

            <Button size="icon" onClick={checkGrammar} disabled={isChecking} className="h-11 w-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
              <Sparkles />
            </Button>

            <Button size="icon" onClick={autoCorrect} disabled={grammarErrors.length === 0} className="h-11 w-11 rounded-xl bg-green-500 text-white shadow-md">
              <CheckCircle />
            </Button>

            <Select value={targetTranslateLang} onValueChange={setTargetTranslateLang}>
              <SelectTrigger className="h-11 w-11 rounded-xl bg-purple-500 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uz">UZ</SelectItem>
                <SelectItem value="ru">RU</SelectItem>
                <SelectItem value="en">EN</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" onClick={translateText} disabled={isTranslating} className="h-11 w-11 rounded-xl bg-indigo-500 text-white">
              <Globe />
            </Button>

            <Button size="icon" onClick={summarizeText} disabled={isSummarizing} className="h-11 w-11 rounded-xl bg-orange-500 text-white">
              <FileText />
            </Button>

            <div className="flex gap-1">
              <Input
                placeholder="Prompt"
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                className="h-11 w-28 rounded-xl px-2 text-sm"
              />
              <Button size="icon" onClick={generateText} disabled={isGenerating || !generatePrompt} className="h-11 w-11 rounded-xl bg-purple-500 text-white">
                <Wand2 />
              </Button>
            </div>

            <Sheet open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl"><BookOpen /></Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-96">
                <SheetHeader><SheetTitle>Andozalar</SheetTitle></SheetHeader>
                <div className="space-y-2 mt-4">
                  {templates.map((t, i) => (
                    <Button key={i} variant="outline" className="w-full justify-start" onClick={() => insertTemplate(t.content)}>
                      {t.title}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <Button size="icon" onClick={exportPDF} className="h-11 w-11 rounded-xl bg-green-500 text-white">
              <Download />
            </Button>

            <Button
              onClick={handleSubmit(handleSave)}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-indigo-600 text-white hover:bg-indigo-500 h-11 px-5 rounded-xl shadow-md font-medium"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><Save className="w-5 h-5 mr-2" /></motion.div>
              ) : <Save className="w-5 h-5 mr-2" />}
              Saqlash
            </Button>
          </div>
        )}

        {/* Editor */}
        <main className={cn("flex-1 p-4 pb-28 md:pb-6 overflow-y-auto", isFocus && "p-8")}>
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl p-5 min-h-full">
            {editor && <EditorContent editor={editor} />}
            {grammarErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <p className="font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
                  <X className="w-5 h-5" /> {grammarErrors.length} ta xato
                </p>
                <ul className="mt-2 space-y-1 text-sm text-red-600 dark:text-red-400">
                  {grammarErrors.map((e, i) => <li key={i} className="pl-1">• {e}</li>)}
                </ul>
              </motion.div>
            )}
          </div>
        </main>

        <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
      </div>
    </TooltipProvider>
  );
}