"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { marked } from "marked";
import { evaluate } from "mathjs";
import Editor from "@monaco-editor/react";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Extension } from '@tiptap/core';
import { Mention } from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import type { Editor as EditorType, Range } from "@tiptap/core";

import { useCreateNote, useUpdateNote, useNote, useShareNote } from "@/hooks/use-note";
import { useProfileByUsername } from "@/hooks/use-profile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import {
  ArrowLeft, Save, Loader2, FileText, Bold, Italic, Underline as UnderlineIcon,
  Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, ImageIcon, Quote,
  Code2, Maximize, Minimize, Calculator, Sparkles, Clock, TerminalSquare, Upload, GitBranch, Users, Zap, Cloud, Check,
  Table as TableIcon, Trash, Pilcrow, AlignLeft, AlignCenter, AlignRight, Share2, Copy, Download, HelpCircle,
  Search, AlertTriangle, CheckCircle, Minus
} from "lucide-react";

import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import Link from "next/link";

const noteSchema = z.object({ title: z.string().min(1, "Title is required") });
type NoteFormData = z.infer<typeof noteSchema>;
const imageSchema = z.object({ url: z.string().url("A valid URL is required") });
type ImageFormData = z.infer<typeof imageSchema>;
const shareSchema = z.object({ username: z.string().min(1, "Username is required") });
type ShareFormData = z.infer<typeof shareSchema>;

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface SuggestionProps {
  editor: EditorType;
  range: Range;
  query: string;
}

const MenuList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
    if (event.key === "ArrowUp") {
      setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
      return true;
    }
    if (event.key === "ArrowDown") {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
      return true;
    }
    if (event.key === "Enter") {
      selectItem(selectedIndex);
      return true;
    }
    return false;
  };

  useImperativeHandle(ref, () => ({ onKeyDown }));

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg border p-1 w-64">
      {props.items.length ? props.items.map((item: any, index: number) => (
        <button key={index} onClick={() => selectItem(index)} className={cn("p-2 w-full text-left rounded flex items-center gap-2", "dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700", index === selectedIndex && "bg-slate-100 dark:bg-slate-700")}>
          {item.title}
        </button>
      )) : <div className="p-2 text-slate-500">No result</div>}
    </div>
  );
});
MenuList.displayName = "MenuList";

const CalculatorExtension = Extension.create({});

export function NoteEditor({ noteId }: { noteId?: string }) {
  const router = useRouter();
  const isEdit = !!noteId;

  const [editorContent, setEditorContent] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: note, isLoading: isNoteLoading } = useNote(noteId ? parseInt(noteId) : 0);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const shareMutation = useShareNote();

  const { register, handleSubmit, setValue, watch } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "" },
  });
  const { register: registerImage, handleSubmit: handleImageSubmit, reset: resetImage } = useForm<ImageFormData>({
    resolver: zodResolver(imageSchema),
  });
  const { register: registerShare, handleSubmit: handleShareSubmit, reset: resetShare, watch: watchShare } = useForm<ShareFormData>({
    resolver: zodResolver(shareSchema),
  });

  const titleWatch = watch("title");
  const watchedUsername = watchShare("username");
  const debouncedSearchTerm = useDebounce(watchedUsername || "", 500);
  const { data: targetProfile, isFetching: isFetchingProfile } = useProfileByUsername(debouncedSearchTerm);
  const userNotFound = debouncedSearchTerm && !isFetchingProfile && !targetProfile;

  const turndownService = useMemo(() => {
    const service = new TurndownService({ headingStyle: 'atx' });
    service.use(gfm);
    return service;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit, Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      TextStyle, Color, Highlight.configure({ multicolor: true }), Underline,
      TaskList, TaskItem.configure({ nested: true }), Image, HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: {
          items: ({ query }: { query: string }) => {
            return [
              { title: 'Heading 1' }, { title: 'Heading 2' }, { title: 'Bullet List' }, { title: 'Numbered List' },
              { title: 'Task List' }, { title: 'Table' }, { title: 'Code Block' }, { title: 'Blockquote' },
              { title: 'Image' }, { title: 'Horizontal Rule' }
            ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
          },
          render: () => {
            let component: any; let popup: any;
            return {
              onStart: (props: SuggestionProps) => {
                component = new ReactRenderer(MenuList, { props, editor: props.editor });
                popup = tippy(document.body, {
                  getReferenceClientRect: props.editor.storage.mention.referenceClientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },
              onUpdate: (props: SuggestionProps) => {
                component.updateProps(props);
                popup[0].setProps({ getReferenceClientRect: props.editor.storage.mention.referenceClientRect });
              },
              onKeyDown: (props: { event: KeyboardEvent }) => component.ref?.onKeyDown(props),
              onExit: () => {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
      ...(isBusinessMode ? [CalculatorExtension] : [])
    ],
    content: editorContent,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
      const text = editor.getText();
      setWordCount({
        words: text.trim().split(/\s+/).filter(Boolean).length,
        chars: text.length,
      });
    },
    editorProps: {
      attributes: { class: "prose prose-slate dark:prose-invert max-w-full focus:outline-none p-4" },
    },
  });

  useEffect(() => {
    if (isEdit && note && editor) {
      setValue("title", note.title);
      const content = note.content || "";
      if (content.startsWith('<pre><code')) {
        setIsCodeMode(true);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        setCodeContent(tempDiv.textContent || "");
      } else if (editor.isEmpty) {
        setEditorContent(content);
        editor.commands.setContent(content);
      }
    }
  }, [note, isEdit, setValue, editor]);

  const handleSave = () => {
    const finalContent = isCodeMode
      ? `<pre><code class="language-${codeLanguage}">${codeContent}</code></pre>`
      : editor?.getHTML() || "";
    const finalData = { title: titleWatch, content: finalContent };
    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(isEdit ? { id: parseInt(noteId!), data: finalData } : finalData, {
      onSuccess: (savedNote) => {
        toast.success(`Note ${isEdit ? 'updated' : 'created'}!`);
        router.push(isEdit ? `/dashboard` : `/dashboard/edit/${(savedNote as any).id}`);
      },
      onError: (err) => toast.error(`Failed to save: ${(err as Error).message}`),
    });
  };

  const autoSave = useCallback(() => {
    if (!isEdit || !titleWatch.trim() || (!editor && !isCodeMode)) return;
    const contentToSave = isCodeMode ? `<pre><code class="language-${codeLanguage}">${codeContent}</code></pre>` : editor?.getHTML() || "";
    updateMutation.mutate({ id: parseInt(noteId!), data: { title: titleWatch, content: contentToSave } }, {
      onSuccess: () => setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    });
  }, [isEdit, titleWatch, noteId, editor, isCodeMode, codeContent, codeLanguage, updateMutation]);

  useEffect(() => {
    const timer = setTimeout(autoSave, 15000);
    return () => clearTimeout(timer);
  }, [editorContent, codeContent, titleWatch, autoSave]);

  const handleFileOpenClick = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { setCodeContent(e.target?.result as string); toast.success(`File "${file.name}" loaded.`); };
      reader.readAsText(file);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = isCodeMode ? codeContent : editor?.getText() || "";
    navigator.clipboard.writeText(textToCopy).then(() => toast.success("Content copied to clipboard!"));
  };

  const downloadMarkdown = () => {
    const content = isCodeMode ? `\`\`\`${codeLanguage}\n${codeContent}\n\`\`\`` : turndownService.turndown(editorContent);
    const blob = new Blob([`# ${titleWatch || "Untitled"}\n\n${content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(titleWatch || "note").replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onShareSubmit = () => {
    if (!targetProfile || !noteId) return;
    shareMutation.mutate({ noteId: parseInt(noteId), targetProfileId: targetProfile.id }, {
      onSuccess: () => { toast.success(`Note shared with ${targetProfile.username}!`); setOpenShareDialog(false); resetShare(); },
      onError: (error: any) => toast.error(error.response?.data?.message || "Failed to share note."),
    });
  };

  if (isNoteLoading && isEdit) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <TooltipProvider>
      <div className={cn(" bg-slate-100 dark:bg-slate-900 font-sans transition-all duration-300", isFocusMode && '')}>
        <motion.header
          initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20", isFocusMode && 'opacity-0 sticky top-0 z-20 mb-5')}
        >
          <div className="container mx-auto px-4 flex items-center justify-between h-16">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link></Button>
              <Input placeholder="Note Title..." {...register("title")} className="text-lg font-bold border-none shadow-none focus-visible:ring-0 !ring-offset-0 flex-1" />
            </div>
            <div className="flex items-center gap-4">
              {lastSaved && <span className="text-xs text-slate-500 flex items-center gap-1.5"><Clock size={14} /> {lastSaved}</span>}
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-2">Save</span>
              </Button>
            </div>
          </div>
        </motion.header>
        <main className="">
          <motion.div
            layout
            transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
            className={cn("bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-4xl mx-auto", isFocusMode && 'max-w-full h-[calc(80vh)]', isCodeMode && '!bg-[#1e1e1e] border-slate-700 max-w-full ')}
          >
            <AnimatePresence mode="wait">
              {isCodeMode ? (
                <motion.div key="code-editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-2 bg-[#252526] border-b border-slate-700 text-white flex-shrink-0 rounded-t-xl">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-700 hover:text-white" onClick={handleFileOpenClick}><Upload size={14} className="mr-2" /> Open File</Button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".js,.ts,.tsx,.py,.html,.css,.md,.txt,.json" />
                      <div className="w-px h-6 bg-slate-600 mx-1" />
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="text-slate-400 cursor-not-allowed" disabled><Sparkles size={14} className="mr-2 text-yellow-500/50" /> AI Complete</Button></TooltipTrigger><TooltipContent><p className="flex items-center gap-2"><Zap size={14} /> Premium Feature</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="text-slate-400 cursor-not-allowed" disabled><Users size={14} className="mr-2 text-green-500/50" /> Live Share</Button></TooltipTrigger><TooltipContent><p className="flex items-center gap-2"><Zap size={14} /> Premium Feature</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="text-slate-400 cursor-not-allowed" disabled><Cloud size={14} className="mr-2 text-cyan-500/50" /> Cloud Sync</Button></TooltipTrigger><TooltipContent><p className="flex items-center gap-2"><Zap size={14} /> Premium Feature</p></TooltipContent></Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsCodeMode(false)} title="Switch to Text Editor"><FileText size={16} className="text-slate-300 hover:text-white" /></Button>
                    </div>
                  </div>
                  <div className="flex-grow min-h-[60vh] relative">
                    <Editor height="100%" language={codeLanguage} value={codeContent} onChange={(value) => setCodeContent(value || "")} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true }} />
                  </div>
                  <div className="flex items-center justify-between px-3 h-6 bg-[#007acc] text-white text-xs font-mono flex-shrink-0 rounded-b-xl">
                    <div className="flex items-center gap-4">
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-full px-1 text-xs"><GitBranch size={12} className="mr-1" /> main</Button></TooltipTrigger><TooltipContent>Version Control (Premium)</TooltipContent></Tooltip>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                        <SelectTrigger className="h-full bg-transparent border-none text-xs focus:ring-0 w-auto gap-1"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                          <SelectItem value="javascript">JavaScript</SelectItem><SelectItem value="python">Python</SelectItem><SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="css">CSS</SelectItem><SelectItem value="json">JSON</SelectItem><SelectItem value="markdown">Markdown</SelectItem>
                        </SelectContent>
                      </Select>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-full px-1 text-xs gap-1" disabled><Check size={14} /> Prettier</Button></TooltipTrigger><TooltipContent>Code Formatter (Premium)</TooltipContent></Tooltip>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="text-editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={cn("p-2 border-b flex items-center justify-between flex-wrap gap-2 sticky bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg z-10 rounded-t-xl", isFocusMode && 'top-0')}>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button type="button" variant={editor?.isActive('bold') ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={16} /></Button>
                      <Button type="button" variant={editor?.isActive('italic') ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={16} /></Button>
                      <Button type="button" variant={editor?.isActive('underline') ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></Button>
                      <Button type="button" variant={editor?.isActive('strike') ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></Button>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                      <Button type="button" variant={editor?.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={16} /></Button>
                      <Button type="button" variant={editor?.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></Button>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                      <Button type="button" variant={editor?.isActive('bulletList') ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={16} /></Button>
                      <Button type="button" variant={editor?.isActive('orderedList') ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Button>
                      <Button type="button" variant={editor?.isActive('taskList') ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleTaskList().run()}><CheckSquare size={16} /></Button>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsImageModalOpen(true)}><ImageIcon size={16} /></Button>
                      <Button type="button" variant={editor?.isActive('blockquote') ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={16} /></Button>
                      <Button type="button" variant={editor?.isActive('codeBlock') ? 'secondary' : 'ghost'} size="icon" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><Code2 size={16} /></Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant={isBusinessMode ? 'secondary' : 'ghost'} size="icon" onClick={() => setIsBusinessMode(!isBusinessMode)} title="Business Mode"><Calculator size={16} /></Button>
                      <Button type="button" variant={isCodeMode ? 'secondary' : 'ghost'} size="icon" onClick={() => setIsCodeMode(true)} title="Code Mode"><TerminalSquare size={16} /></Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsFocusMode(!isFocusMode)} title="Focus Mode">{isFocusMode ? <Minimize size={16} /> : <Maximize size={16} />}</Button>
                    </div>
                  </div>
                  {editor && <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bg-slate-800 text-white rounded-lg p-1 flex items-center gap-1 shadow-xl">
                    <Button type="button" variant="ghost" size="sm" className="text-white hover:bg-slate-700 h-8 px-2" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Button>
                    <Button type="button" variant="ghost" size="sm" className="text-white hover:bg-slate-700 h-8 px-2" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Button>
                    <Popover>
                      <PopoverTrigger asChild><Button type="button" variant="ghost" size="sm" className="text-white hover:bg-slate-700 h-8 px-2"><Sparkles size={16} /></Button></PopoverTrigger>
                      <PopoverContent className="w-auto p-2 grid grid-cols-4 gap-1">
                        {['#fef9c3', '#dbeafe', '#fee2e2', '#dcfce7'].map(color => <button key={color} onClick={() => editor.chain().focus().toggleHighlight({ color }).run()} className="w-6 h-6 rounded border" style={{ backgroundColor: color }} />)}
                        <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().unsetHighlight().run()} className="col-span-4 mt-1">Reset</Button>
                      </PopoverContent>
                    </Popover>
                  </BubbleMenu>}
                  <div className={"p-4 sm:p-8 min-h-[60vh] "}><EditorContent editor={editor} /></div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>

        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent><DialogHeader><DialogTitle>Insert Image from URL</DialogTitle></DialogHeader>
            <form onSubmit={handleImageSubmit((data) => { editor?.chain().focus().setImage({ src: data.url }).run(); setIsImageModalOpen(false); resetImage(); })}>
              <div className="py-4"><Label htmlFor="imageUrl">Image URL</Label><Input id="imageUrl" {...registerImage("url")} placeholder="https://..." /></div>
              <DialogFooter><Button type="submit">Insert Image</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={openShareDialog} onOpenChange={setOpenShareDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Share Note</DialogTitle><DialogDescription>Enter a username to share this note with.</DialogDescription></DialogHeader>
            <form onSubmit={handleShareSubmit(onShareSubmit)}>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="username" {...registerShare("username")} className="pl-10" /></div>
                </div>
                <AnimatePresence mode="wait">
                  {isFetchingProfile && <motion.div key="loading" className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Searching...</motion.div>}
                  {userNotFound && <motion.div key="not-found" className="p-3 bg-destructive/10 text-destructive text-sm flex items-center gap-2 rounded-md"><AlertTriangle className="w-4 h-4" /> User not found.</motion.div>}
                  {targetProfile && <motion.div key="found" className="p-3 bg-green-500/10 border rounded-lg flex items-center gap-3">
                    <Avatar><AvatarImage src={targetProfile.avatar} /><AvatarFallback>{targetProfile.username?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div><p className="font-semibold">{targetProfile.username}</p><p className="text-xs text-muted-foreground">{targetProfile.firstName} {targetProfile.lastName}</p></div>
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                  </motion.div>}
                </AnimatePresence>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpenShareDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={!targetProfile || shareMutation.isPending}>{shareMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Share</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showHelp} onOpenChange={setShowHelp}>
          <DialogContent>
            <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle></DialogHeader>
            <ul className="space-y-2 text-sm list-disc list-inside p-4">
              <li><kbd>Ctrl+S</kbd>: Save</li><li><kbd>Ctrl+B</kbd>: Bold</li><li><kbd>Ctrl+I</kbd>: Italic</li>
              <li><kbd>Ctrl+U</kbd>: Underline</li><li>...and more standard shortcuts.</li>
            </ul>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}