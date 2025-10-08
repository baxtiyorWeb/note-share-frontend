"use client";

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Share2, Loader2, Search, CheckCircle, AlertTriangle, FileText, Bold, Italic, Heading1, List, Copy, Download, Settings, HelpCircle, Clock, Code2, Play, Terminal, Sparkles, Bot, Paintbrush, Eye, CheckSquare, Minus, ImageIcon, Quote } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateNote, useUpdateNote, useNote, useShareNote } from "@/hooks/use-note";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useProfileByUsername } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BubbleMenu, useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Mention } from "@tiptap/extension-mention";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";
import { createLowlight, all } from "lowlight";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import TurndownService from "turndown";
import { marked } from "marked";
import type { Editor } from "@tiptap/react";
import type { Range } from "@tiptap/core";

interface SuggestionProps {
  editor: Editor;
  range: Range;
  query: string;
  text: string;
  clientRect?: DOMRect;
  event: KeyboardEvent;
}
import { Editor as MonacoEditor } from "@monaco-editor/react";

const lowlight = createLowlight(all);

const MenuList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
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

  useImperativeHandle(ref, () => ({
    onKeyDown,
  }));

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded border border-slate-200 dark:border-slate-700 p-2">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            className={cn(
              "p-2 w-full text-left rounded",
              "dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700",
              index === selectedIndex ? "bg-blue-100 dark:bg-blue-900" : ""
            )}
          >
            {item.title}
          </button>
        ))
      ) : (
        <div className="p-2 text-slate-500">No result</div>
      )}
    </div>
  );
});

MenuList.displayName = "MenuList";

interface NoteEditorProps {
  noteId?: string;
}

const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string(),
});
type NoteFormData = z.infer<typeof noteSchema>;

const shareSchema = z.object({
  username: z.string().min(1, "Username is required"),
});
type ShareFormData = z.infer<typeof shareSchema>;

const imageSchema = z.object({
  url: z.string().url("Valid URL is required"),
  width: z.number().min(10, "Width must be at least 10px").max(1000, "Width must not exceed 1000px").default(300),
  height: z.number().min(10, "Height must be at least 10px").max(1000, "Height must not exceed 1000px").default(200),
});
type ImageFormData = z.infer<typeof imageSchema>;

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// !!! XAVFSIZLIK OGOHLANTIRISHI: API kalitingizni kodda to'g'ridan-to'g'ri qoldirmang!
// Uni .env.local fayliga NEXT_PUBLIC_OPENROUTER_API_KEY nomi bilan joylashtiring.
const OPENROUTER_API_KEY = "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const FORMAT_MODEL = "mistralai/mistral-7b-instruct";
const CODE_MODEL = "mistralai/mistral-7b-instruct";
const SUMMARIZE_MODEL = "mistralai/mistral-7b-instruct";

const callOpenRouterApi = async (prompt: string, model: string): Promise<string> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Please set your OpenRouter API key.");
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": typeof window !== "undefined" ? window.location.host : "http://localhost:3000",
      "X-Title": "NoteShare AI",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.choices?.[0]?.message?.content?.trim() || "";
};

export function NoteEditor({ noteId }: NoteEditorProps) {
  const router = useRouter();
  const isEdit = !!noteId;
  const { data: note, isLoading: isNoteLoading } = useNote(noteId ? parseInt(noteId) : 0);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const shareMutation = useShareNote();
  const [editorContent, setEditorContent] = useState("");
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isSummarizeModalOpen, setIsSummarizeModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(2);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [codeContent, setCodeContent] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [summarizeText, setSummarizeText] = useState("");
  const [summarizePrompt, setSummarizePrompt] = useState("");
  const codeEditorRef = useRef<any>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "" },
  });

  const { register: registerShare, handleSubmit: handleShareSubmit, formState: { errors: shareErrors }, reset: resetShare, watch: watchShare } = useForm<ShareFormData>({
    resolver: zodResolver(shareSchema),
  });

  const { register: registerImage, handleSubmit: handleImageSubmit, formState: { errors: imageErrors }, reset: resetImage } = useForm<ImageFormData>({
    resolver: zodResolver(imageSchema),
    defaultValues: { url: "", width: 300, height: 200 },
  });

  const [openShareDialog, setOpenShareDialog] = useState(false);

  const watchedUsername = watchShare("username");
  const debouncedSearchTerm = useDebounce(watchedUsername || "", 500);
  const { data: targetProfile, isFetching: isFetchingProfile } = useProfileByUsername(debouncedSearchTerm,);
  const userNotFound = debouncedSearchTerm && !isFetchingProfile && !targetProfile;

  const titleWatch = watch("title");

  const editor = useEditor({
    extensions: [
      Color,
      TextStyle,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "prose-table",
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      HorizontalRule,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          char: "/",
          items: ({ query }: { query: string }) => {
            return [
              {
                title: "Heading 1",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
                },
              },
              {
                title: "Heading 2",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
                },
              },
              {
                title: "Paragraph",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).setNode("paragraph").run();
                },
              },
              {
                title: "Bullet List",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).toggleBulletList().run();
                },
              },
              {
                title: "Task List",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).toggleTaskList().run();
                },
              },
              {
                title: "Code Block",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).setNode("codeBlock").run();
                },
              },
              {
                title: "Table",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                },
              },
              {
                title: "Horizontal Rule",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).setHorizontalRule().run();
                },
              },
              {
                title: "Image",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).run();
                  setIsImageModalOpen(true);
                },
              },
              {
                title: "Quote",
                command: ({ editor, range }: { editor: Editor; range: Range }) => {
                  editor.chain().focus().deleteRange(range).toggleBlockquote().run();
                },
              },
            ]
              .filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
              .slice(0, 10);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: SuggestionProps) => {
                component = new ReactRenderer(MenuList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy(document.body, {
                  getReferenceClientRect: () => props.clientRect as DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },
              onUpdate(props: SuggestionProps) {
                component.updateProps(props);
                if (!props.clientRect) return;
                popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect });
              },
              onKeyDown(props: SuggestionProps) {
                if (props.event.key === "Escape") {
                  popup?.[0]?.hide();
                  return true;
                }
                return component.ref?.onKeyDown(props);
              },
              onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content: editorContent,
    onUpdate: ({ editor }: { editor: Editor }) => {
      setEditorContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[50vh] focus:outline-none prose prose-slate dark:prose-invert max-w-none",
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setOptions({ editable: !isFullPreview });
    }
  }, [isFullPreview, editor]);

  useEffect(() => {
    if (isEdit && note && editor) {
      setValue("title", note.title);
      // Ensure content is set only once after editor is ready
      if (editor.isEmpty) {
        const parsedContent = marked.parse(note.content || "");
        setEditorContent(parsedContent as string);
        editor.commands.setContent(parsedContent);
      }
    }
  }, [note, isEdit, setValue, editor]);

  const handleCodeEditorMount = useCallback((editor: any) => {
    codeEditorRef.current = editor;
  }, []);

  const handleAiFormat = useCallback(async () => {
    if (!editor) return;
    setAiLoading(true);
    try {
      const selection = editor.state.selection;
      const textToFormat = selection.empty ? editor.getText() : editor.state.doc.textBetween(selection.from, selection.to, "\n");

      if (!textToFormat.trim()) {
        toast.error("No text selected or available to format.");
        return;
      }

      const prompt = `
Rewrite the following text in a well-formatted HTML style, making it more structured and engaging.
Use colored text with HTML <span style="color: #hex"> where appropriate (e.g., red for emphasis, blue for headings).
Include at least one table if the content allows for structured data representation.

Text: "${textToFormat}"

Formatted version:
`;

      const aiResponse = await callOpenRouterApi(prompt, FORMAT_MODEL);

      if (!selection.empty) {
        editor.chain().focus().deleteRange(selection).insertContent(aiResponse).run();
      } else {
        editor.chain().focus().setContent(aiResponse).run();
      }
      toast.success("Formatted with AI! ✨");
    } catch (error: any) {
      console.error("AI Error:", error);
      toast.error(`AI formatting failed: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  }, [editor]);

  const handleAiGenerateCode = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error("Enter a prompt for AI code generation.");
      return;
    }
    setAiLoading(true);
    try {
      const prompt = `
You are a code generator AI.
Generate ONLY raw ${selectedLanguage} code for the following task: "${aiPrompt}"

⚠️ Rules:
- DO NOT explain anything.
- DO NOT add greetings or comments like "I'm happy to help".
- DO NOT wrap the code in triple backticks or markdown.
- Just output the pure code.

Code:
`;

      let aiResponse = await callOpenRouterApi(prompt, CODE_MODEL);

      // Cleanup response to get raw code
      const codeBlockRegex = new RegExp("```(" + selectedLanguage + ")?\\n([\\s\\S]*?)\\n```", "s");
      const match = aiResponse.match(codeBlockRegex);
      if (match && match[2]) {
        aiResponse = match[2].trim();
      } else {
        aiResponse = aiResponse.replace(/```[\s\S]*?```/g, "").replace(/```/g, "").trim();
      }

      setCodeContent(aiResponse);
      toast.success("✅ Code generated with AI!");
    } catch (error: any) {
      console.error("AI Error:", error);
      toast.error(`AI code generation failed: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, selectedLanguage]);

  const handleAiSummarize = useCallback(async () => {
    if (!summarizeText.trim()) {
      toast.error("Enter text to summarize.");
      return;
    }
    setAiLoading(true);
    try {
      const aiPromptText = summarizePrompt.trim() ? `\nAdditional instructions: ${summarizePrompt}` : "";
      const prompt = `
Summarize the following text in a structured, beautiful HTML format.
Use colored text with HTML <span style="color: #hex"> for emphasis (e.g., red for key points, blue for headings).
Include a table if the content can be represented as structured data.
Suggest a title at the top as <h1>Title</h1> if appropriate.

Text to summarize: "${summarizeText}"${aiPromptText}

Output ONLY the summarized HTML content. No explanations.
`;

      const aiResponse = await callOpenRouterApi(prompt, SUMMARIZE_MODEL);

      const parser = new DOMParser();
      const doc = parser.parseFromString(aiResponse, "text/html");
      const firstH1 = doc.querySelector("h1");
      if (firstH1 && !titleWatch.trim()) {
        setValue("title", firstH1.textContent?.trim() || "");
      }
      const summaryContent = aiResponse.replace(/<h1>.*?<\/h1>/, "").trim();

      if (editor) {
        editor.chain().focus().setContent(summaryContent).run();
      }

      toast.success("✅ Summarized with AI! Content updated.");
    } catch (error: any) {
      console.error("AI Summarize Error:", error);
      toast.error(`AI summarization failed: ${error.message}`);
    } finally {
      setAiLoading(false);
      setIsSummarizeModalOpen(false);
      setSummarizeText("");
      setSummarizePrompt("");
    }
  }, [summarizeText, summarizePrompt, titleWatch, setValue, editor]);

  const openSummarizeModal = useCallback(() => {
    if (!editor) return;
    const selection = editor.state.selection;
    const text = selection.empty ? editor.getText() : editor.state.doc.textBetween(selection.from, selection.to, "\n");
    setSummarizeText(text);
    setIsSummarizeModalOpen(true);
  }, [editor]);

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setOutput("");
    try {
      if (selectedLanguage === "javascript") {
        const workerCode = `
          self.onmessage = function(e) {
            try {
              const consoleLogs = [];
              const originalLog = console.log;
              console.log = (...args) => {
                consoleLogs.push(args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" "));
                originalLog.apply(console, args);
              };
              eval(e.data.code);
              self.postMessage({ output: consoleLogs.join("\\n") });
            } catch (err) {
              self.postMessage({ error: err.message });
            }
          };
        `;
        const workerBlob = new Blob([workerCode], { type: "application/javascript" });
        const workerURL = URL.createObjectURL(workerBlob);
        const worker = new Worker(workerURL);

        const timeout = setTimeout(() => {
          worker.terminate();
          URL.revokeObjectURL(workerURL);
          setOutput("❌ Error: Execution timed out after 5 seconds.");
          setIsRunning(false);
        }, 5000);

        worker.postMessage({ code: codeContent });

        worker.onmessage = (e) => {
          clearTimeout(timeout);
          if (e.data.error) {
            setOutput(`❌ Error: ${e.data.error}`);
          } else {
            setOutput(e.data.output || "No console output. Check your code for logs.");
          }
          setIsRunning(false);
          worker.terminate();
          URL.revokeObjectURL(workerURL);
        };

        worker.onerror = (error) => {
          clearTimeout(timeout);
          setOutput(`❌ Error: ${error.message}`);
          setIsRunning(false);
          worker.terminate();
          URL.revokeObjectURL(workerURL);
        };
      } else {
        const res = await fetch("[https://emkc.org/api/v2/piston/execute](https://emkc.org/api/v2/piston/execute)", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: selectedLanguage,
            version: "*",
            files: [{ content: codeContent }],
          }),
        });

        if (!res.ok) throw new Error("Failed to run code via Piston API");

        const data = await res.json();
        const outputText = data.run?.output || "";
        const stderr = data.run?.stderr;

        if (stderr) {
          setOutput(`⚠️ Error:\n${stderr}`);
        } else {
          setOutput(outputText.trim() ? `✅ Output:\n${outputText}` : "No output received.");
        }
      }
    } catch (error: any) {
      setOutput(`❌ Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [selectedLanguage, codeContent]);

  const insertCodeBlock = useCallback(() => {
    if (!editor || !codeContent) return;

    editor.chain().focus().insertContent(`<pre><code class="language-${selectedLanguage}">${codeContent}</code></pre>`).run();

    toast.success("Code block inserted!");
    setIsCodeModalOpen(false);
    setCodeContent("");
    setOutput("");
    setAiPrompt("");
  }, [editor, selectedLanguage, codeContent]);


  const handleInsertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setIsTableModalOpen(false);
  }, [editor, tableRows, tableCols]);

  const handleInsertImage = useCallback(
    (data: ImageFormData) => {
      if (!editor) return;

      editor
        .chain()
        .focus()
        .setImage({ src: data.url }) // ✅ faqat ruxsat etilgan atribut
        .updateAttributes("image", {
          style: `width: ${data.width}px; height: ${data.height}px;`,
        })
        .run();

      setIsImageModalOpen(false);
      resetImage();
    },
    [editor, resetImage]
  );

  const handleList = () => editor?.chain().focus().toggleBulletList().run();
  const handleQuote = () => editor?.chain().focus().toggleBlockquote().run();

  const autoSave = useCallback(() => {
    const contentToSave = new TurndownService().turndown(editorContent);
    if (isEdit && noteId) {
      updateMutation.mutate(
        { id: parseInt(noteId), data: { title: titleWatch, content: contentToSave } },
        { onSuccess: () => setLastSaved(new Date().toLocaleTimeString()) }
      );
    }
  }, [editorContent, titleWatch, noteId, isEdit, updateMutation]);

  useEffect(() => {
    if (!isEdit || !titleWatch.trim()) return;
    const timer = setTimeout(() => {
      autoSave();
    }, 5000); // Autosave every 5 seconds
    return () => clearTimeout(timer);
  }, [editorContent, titleWatch, autoSave, isEdit]);

  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      setWordCount({ words, chars });
    }
  }, [editorContent, editor]);

  const onSubmit = async (data: NoteFormData) => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error("Please fill in the title!");
      return;
    }

    const finalContent = new TurndownService().turndown(editorContent);
    const finalData = { ...data, content: finalContent };

    if (isEdit && noteId) {
      updateMutation.mutate(
        { id: parseInt(noteId), data: finalData },
        {
          onSuccess: () => {
            toast.success("Note updated successfully!");
            router.push("/dashboard");
          },
          onError: () => toast.error("Failed to update note."),
        }
      );
    } else {
      createMutation.mutate(finalData, {
        onSuccess: (newNote) => {
          toast.success("Note created successfully!");
          router.push(`/dashboard/edit/${newNote.id}`);
        },
        onError: () => toast.error("Failed to create note."),
      });
    }
  };

  const onShareSubmit = () => {
    if (!targetProfile || !noteId) return;
    shareMutation.mutate(
      { noteId: parseInt(noteId), targetProfileId: targetProfile.id },
      {
        onSuccess: () => {
          toast.success(`Note shared with ${targetProfile.username}!`);
          setOpenShareDialog(false);
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || "Failed to share note.";
          toast.error(errorMessage);
        },
      }
    );
  };

  useEffect(() => {
    if (!openShareDialog) {
      resetShare();
    }
  }, [openShareDialog, resetShare]);

  const handleCode = useCallback(() => {
    if (!editor) return;
    const selection = editor.state.selection;
    setCodeContent(selection.empty ? "" : editor.state.doc.textBetween(selection.from, selection.to, "\n"));
    setIsCodeModalOpen(true);
  }, [editor]);

  const handleBold = () => editor?.chain().focus().toggleBold().run();
  const handleItalic = () => editor?.chain().focus().toggleItalic().run();
  const handleHeading = () => editor?.chain().focus().toggleHeading({ level: 1 }).run();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${titleWatch || "Untitled"}\n\n${editor?.getText() || ""}`).then(() => toast.success("Copied to clipboard!"));
  };

  const downloadMarkdown = () => {
    const td = new TurndownService();
    const markdown = td.turndown(editorContent);
    const blob = new Blob([`# ${titleWatch || "Untitled"}\n\n${markdown}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(titleWatch || "note").replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s": e.preventDefault(); handleSubmit(onSubmit)(); break;
          case "p": e.preventDefault(); setIsFullPreview((prev) => !prev); break;
          case "m": e.preventDefault(); setIsMarkdownPreview((prev) => !prev); break;
          case "t": e.preventDefault(); setIsDark((prev) => !prev); break;
          case "b": e.preventDefault(); handleBold(); break;
          case "i": e.preventDefault(); handleItalic(); break;
          case "`": e.preventDefault(); handleCode(); break;
          case "q": e.preventDefault(); handleQuote(); break;
        }
      }
    }, [handleSubmit, onSubmit, handleBold, handleItalic, handleCode, handleQuote]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (isNoteLoading && isEdit) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading note...</p>
        </motion.div>
      </div>
    );
  }

  const languageOptions = [
    { value: "html", label: "HTML" }, { value: "css", label: "CSS" },
    { value: "javascript", label: "JavaScript" }, { value: "java", label: "Java" },
    { value: "python", label: "Python" }, { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" }, { value: "c", label: "C" },
  ];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        "min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 p-2 sm:p-4",
        isDark && "dark"
      )}
    >
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-shrink-0 mb-4 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10 flex-shrink-0">
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <Input
            type="text"
            placeholder="Note title..."
            {...register("title")}
            className={cn(
              "text-xl sm:text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent h-auto flex-1",
              errors.title && "border-destructive"
            )}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <div className="sm:hidden flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-700/50 rounded-lg flex-wrap">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFullPreview(!isFullPreview)} className="gap-2 h-10">
              <Eye className="w-4 h-4" /> {isFullPreview ? "Edit" : "Preview"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsMarkdownPreview(!isMarkdownPreview)} className="gap-2 h-10">
              <FileText className="w-4 h-4" /> MD
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2 h-10" disabled={!isEdit} onClick={() => setOpenShareDialog(true)}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadMarkdown} className="h-10 gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleAiFormat} disabled={aiLoading} title="AI Format">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={openSummarizeModal} disabled={aiLoading} title="AI Summarize">
            <Bot className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
            <Settings className="w-4 h-4" />
          </Button>
          <Dialog open={showHelp} onOpenChange={setShowHelp}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Help & Shortcuts">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
              </DialogHeader>
              <ul className="space-y-2 text-sm list-disc list-inside">
                <li><kbd>Ctrl+S</kbd>: Save</li>
                <li><kbd>Ctrl+B</kbd>: Bold</li>
                <li><kbd>Ctrl+I</kbd>: Italic</li>
                <li><kbd>Ctrl+`</kbd>: Code Block</li>
                <li><kbd>Ctrl+P</kbd>: Toggle Preview</li>
                <li><kbd>Ctrl+M</kbd>: Toggle Markdown</li>
                <li><kbd>Ctrl+T</kbd>: Toggle Theme</li>
                <li><kbd>Ctrl+Q</kbd>: Toggle Quote</li>
              </ul>
            </DialogContent>
          </Dialog>
          <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending} className="gap-2 h-10 bg-primary text-primary-foreground">
            {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Note"}
          </Button>
        </div>
      </motion.header>

      <div className="flex-1 border rounded-xl overflow-hidden shadow-lg min-h-0 bg-white dark:bg-slate-800 flex">
        <AnimatePresence mode="wait">
          <motion.div
            key="editor-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("overflow-y-auto p-4 sm:p-6", isMarkdownPreview ? "w-full md:w-1/2" : "w-full")}
          >
            {editor && (
              <BubbleMenu
                editor={editor}
                tippyOptions={{ duration: 100 }}
                shouldShow={({ editor, state }) => {
                  if (isFullPreview) return false;
                  const { from, to } = state.selection;
                  return from !== to;
                }}
              >
                <div className="flex items-center gap-1 p-1 rounded shadow border bg-white dark:bg-slate-700">
                  <Button type="button" variant="ghost" size="sm" onClick={handleBold} className={cn("h-8 w-8 p-0", editor.isActive("bold") ? "bg-slate-200 dark:bg-slate-600" : "")} title="Bold (Ctrl+B)"> <Bold className="w-4 h-4" /> </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleItalic} className={cn("h-8 w-8 p-0", editor.isActive("italic") ? "bg-slate-200 dark:bg-slate-600" : "")} title="Italic (Ctrl+I)"> <Italic className="w-4 h-4" /> </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleHeading} className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 1 }) ? "bg-slate-200 dark:bg-slate-600" : "")} title="Heading 1"> <Heading1 className="w-4 h-4" /> </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleList} className={cn("h-8 w-8 p-0", editor.isActive("bulletList") ? "bg-slate-200 dark:bg-slate-600" : "")} title="Bullet List"> <List className="w-4 h-4" /> </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleQuote} className={cn("h-8 w-8 p-0", editor.isActive("blockquote") ? "bg-slate-200 dark:bg-slate-600" : "")} title="Quote (Ctrl+Q)"> <Quote className="w-4 h-4" /> </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleCode} className="h-8 w-8 p-0" title="Code Block (Ctrl+`)"> <Code2 className="w-4 h-4" /> </Button>
                </div>
              </BubbleMenu>
            )}
            <EditorContent editor={editor} />
          </motion.div>
          {isMarkdownPreview && (
            <motion.div
              key="markdown-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden md:block w-1/2 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700"
            >
              <h2 className="text-lg font-semibold mb-2">Markdown Preview</h2>
              <pre className="text-sm whitespace-pre-wrap p-3 bg-white dark:bg-slate-900 rounded-md">
                <code>{new TurndownService().turndown(editorContent)}</code>
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="hidden sm:flex flex-col gap-2 p-2 w-16 border-l bg-white/80 dark:bg-slate-800/80 shadow-lg">
          <Button type="button" variant="ghost" size="icon" onClick={() => setIsFullPreview(!isFullPreview)} title={isFullPreview ? "Edit" : "Full Preview"}> <Eye className="w-4 h-4" /> </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setIsMarkdownPreview(!isMarkdownPreview)} title={isMarkdownPreview ? "Hide Markdown" : "Markdown Preview"}> <FileText className="w-4 h-4" /> </Button>
          <Button type="button" variant="ghost" size="icon" disabled={!isEdit} title="Share" onClick={() => setOpenShareDialog(true)}> <Share2 className="w-4 h-4" /> </Button>
          <Button type="button" variant="ghost" size="icon" onClick={copyToClipboard} title="Copy Content"> <Copy className="w-4 h-4" /> </Button>
          <Button type="button" variant="ghost" size="icon" onClick={downloadMarkdown} title="Export as Markdown"> <Download className="w-4 h-4" /> </Button>
        </div>
      </div>

      <motion.footer
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-3 mt-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-4 flex-wrap">
          {(updateMutation.isPending) && <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-primary" /> Auto-saving...</span>}
          {lastSaved && !updateMutation.isPending && <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Last saved: {lastSaved}</span>}
          <span>{wordCount.words} words, {wordCount.chars} chars</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowHelp(true)}>Shortcuts</Button>
      </motion.footer>

      {/* MODALS */}
      <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Code Editor & Runner</DialogTitle></DialogHeader>
          <div className="flex-1 flex flex-col overflow-hidden gap-2">
            <div className="p-2 border-b">
              <div className="flex items-center gap-2 mb-2"><Bot className="w-4 h-4" /><Label>AI Code Generation</Label></div>
              <div className="flex gap-2">
                <Textarea placeholder="Describe the code you need..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="flex-1" rows={1} />
                <Button type="button" onClick={handleAiGenerateCode} disabled={!aiPrompt.trim() || aiLoading} className="gap-1">
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate
                </Button>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden">
              <div className="h-full overflow-hidden border-r">
                <MonacoEditor height="100%" language={selectedLanguage} value={codeContent} onChange={(value) => setCodeContent(value || "")} onMount={handleCodeEditorMount} theme={isDark ? "vs-dark" : "vs-light"} options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on", automaticLayout: true }} />
              </div>
              <div className="h-full overflow-y-auto p-4 bg-slate-100 dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium"><Terminal className="w-4 h-4" /> Output</div>
                <pre className="text-sm bg-white dark:bg-black p-3 rounded overflow-x-auto min-h-[100px]">{isRunning ? "Running..." : output || "Click 'Run' to see the output."}</pre>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-between w-full items-center">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>{languageOptions.map((lang) => (<SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>))}</SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleRunCode} disabled={isRunning || aiLoading} className="gap-2">
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run
                </Button>
                <Button type="button" onClick={insertCodeBlock} disabled={!codeContent.trim()}>Insert into Note</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSummarizeModalOpen} onOpenChange={setIsSummarizeModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>AI Summarize</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Text to Summarize</Label><Textarea value={summarizeText} onChange={(e) => setSummarizeText(e.target.value)} className="min-h-[150px]" /></div>
            <div><Label>Custom Prompt (Optional)</Label><Input value={summarizePrompt} onChange={(e) => setSummarizePrompt(e.target.value)} placeholder="e.g., 'Make it concise'" /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSummarizeModalOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleAiSummarize} disabled={!summarizeText.trim() || aiLoading} className="gap-2">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Summarize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Create Table</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div><Label>Rows</Label><Input type="number" min="1" value={tableRows} onChange={(e) => setTableRows(Math.max(1, Number(e.target.value)))} /></div>
            <div><Label>Columns</Label><Input type="number" min="1" value={tableCols} onChange={(e) => setTableCols(Math.max(1, Number(e.target.value)))} /></div>
          </div>
          <DialogFooter><Button type="button" onClick={handleInsertTable}>Insert Table</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Insert Image</DialogTitle></DialogHeader>
          <form onSubmit={handleImageSubmit(handleInsertImage)} className="space-y-4 py-4">
            <div><Label>Image URL</Label><Input {...registerImage("url")} placeholder="https://..." className={cn(imageErrors.url && "border-destructive")} />{imageErrors.url && <p className="text-sm text-destructive mt-1">{imageErrors.url.message}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Width (px)</Label><Input type="number" {...registerImage("width", { valueAsNumber: true })} className={cn(imageErrors.width && "border-destructive")} />{imageErrors.width && <p className="text-sm text-destructive mt-1">{imageErrors.width.message}</p>}</div>
              <div><Label>Height (px)</Label><Input type="number" {...registerImage("height", { valueAsNumber: true })} className={cn(imageErrors.height && "border-destructive")} />{imageErrors.height && <p className="text-sm text-destructive mt-1">{imageErrors.height.message}</p>}</div>
            </div>
            <DialogFooter><Button type="submit">Insert Image</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openShareDialog} onOpenChange={setOpenShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Share Note</DialogTitle><DialogDescription>Enter the username to share this note with.</DialogDescription></DialogHeader>
          <form onSubmit={handleShareSubmit(onShareSubmit)}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="username" {...registerShare("username")} className="pl-10" placeholder="Start typing..." /></div>
                {shareErrors.username && <p className="text-sm text-destructive mt-1">{shareErrors.username.message}</p>}
              </div>
              <AnimatePresence mode="wait">
                {isFetchingProfile && <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Searching...</motion.div>}
                {userNotFound && <motion.div key="not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 bg-destructive/10 text-destructive text-sm flex items-center gap-2 rounded-md"><AlertTriangle className="w-4 h-4" /> User not found.</motion.div>}
                {targetProfile && <motion.div key="found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                  <Avatar><AvatarImage src={targetProfile.avatar} /><AvatarFallback>{targetProfile.username?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div><p className="font-semibold">{targetProfile.username}</p><p className="text-xs text-muted-foreground">{targetProfile.firstName} {targetProfile.lastName}</p></div>
                  <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                </motion.div>}
              </AnimatePresence>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenShareDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={!targetProfile || shareMutation.isPending}>
                {shareMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Share
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
}