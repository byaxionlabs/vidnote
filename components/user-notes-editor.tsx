"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Highlighter,
    Code,
    List,
    ListOrdered,
    ListChecks,
    Quote,
    Minus,
    Heading1,
    Heading2,
    Heading3,
    Undo2,
    Redo2,
    CheckCircle2,
    Loader2,
    FileCode,
    PenLine,
} from "lucide-react";

const lowlight = createLowlight(common);

interface UserNotesEditorProps {
    videoId: string;
    initialContent?: string | null;
}

export default function UserNotesEditor({
    videoId,
    initialContent,
}: UserNotesEditorProps) {
    const [saveStatus, setSaveStatus] = useState<
        "idle" | "saving" | "saved" | "error"
    >("idle");
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedContentRef = useRef<string | null>(initialContent ?? null);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                codeBlock: false, // replaced by CodeBlockLowlight
            }),
            Placeholder.configure({
                placeholder: "Write your personal notes here…",
            }),
            Highlight.configure({ multicolor: false }),
            Underline,
            TaskList,
            TaskItem.configure({ nested: true }),
            CodeBlockLowlight.configure({ lowlight }),
        ],
        content: initialContent ? JSON.parse(initialContent) : undefined,
        editorProps: {
            attributes: {
                class: "user-notes-editor-content",
            },
        },
        onUpdate: ({ editor }) => {
            // Debounced auto-save
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            setSaveStatus("idle");
            saveTimeoutRef.current = setTimeout(() => {
                saveNotes(editor.getJSON());
            }, 1500);
        },
    });

    const saveNotes = useCallback(
        async (content: object) => {
            const json = JSON.stringify(content);
            // Skip if unchanged
            if (json === lastSavedContentRef.current) return;

            setSaveStatus("saving");
            try {
                const res = await fetch(`/api/videos/${videoId}/notes`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userNotes: json }),
                });
                if (!res.ok) throw new Error("Save failed");
                lastSavedContentRef.current = json;
                setSaveStatus("saved");
            } catch {
                setSaveStatus("error");
            }
        },
        [videoId]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // Save on Ctrl+S
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                if (editor) {
                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                    saveNotes(editor.getJSON());
                }
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [editor, saveNotes]);

    if (!editor) return null;

    return (
        <div className="user-notes-editor-wrapper">
            {/* Toolbar */}
            <div className="user-notes-toolbar">
                <div className="user-notes-toolbar-group">
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 1 }).run()
                        }
                        active={editor.isActive("heading", { level: 1 })}
                        title="Heading 1"
                    >
                        <Heading1 size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 2 }).run()
                        }
                        active={editor.isActive("heading", { level: 2 })}
                        title="Heading 2"
                    >
                        <Heading2 size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 3 }).run()
                        }
                        active={editor.isActive("heading", { level: 3 })}
                        title="Heading 3"
                    >
                        <Heading3 size={16} />
                    </ToolbarButton>
                </div>

                <div className="user-notes-toolbar-divider" />

                <div className="user-notes-toolbar-group">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive("bold")}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive("italic")}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        active={editor.isActive("underline")}
                        title="Underline (Ctrl+U)"
                    >
                        <UnderlineIcon size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        active={editor.isActive("strike")}
                        title="Strikethrough"
                    >
                        <Strikethrough size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        active={editor.isActive("highlight")}
                        title="Highlight"
                    >
                        <Highlighter size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        active={editor.isActive("code")}
                        title="Inline Code"
                    >
                        <Code size={16} />
                    </ToolbarButton>
                </div>

                <div className="user-notes-toolbar-divider" />

                <div className="user-notes-toolbar-group">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive("bulletList")}
                        title="Bullet List"
                    >
                        <List size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive("orderedList")}
                        title="Ordered List"
                    >
                        <ListOrdered size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        active={editor.isActive("taskList")}
                        title="Task List"
                    >
                        <ListChecks size={16} />
                    </ToolbarButton>
                </div>

                <div className="user-notes-toolbar-divider" />

                <div className="user-notes-toolbar-group">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        active={editor.isActive("blockquote")}
                        title="Blockquote"
                    >
                        <Quote size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        active={editor.isActive("codeBlock")}
                        title="Code Block"
                    >
                        <FileCode size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                    >
                        <Minus size={16} />
                    </ToolbarButton>
                </div>

                <div className="user-notes-toolbar-divider" />

                <div className="user-notes-toolbar-group">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={16} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo2 size={16} />
                    </ToolbarButton>
                </div>

                {/* Save status indicator */}
                <div className="ml-auto flex items-center gap-2">
                    {saveStatus === "saving" && (
                        <span className="user-notes-status saving">
                            <Loader2 size={14} className="animate-spin" />
                            Saving…
                        </span>
                    )}
                    {saveStatus === "saved" && (
                        <span className="user-notes-status saved">
                            <CheckCircle2 size={14} />
                            Saved
                        </span>
                    )}
                    {saveStatus === "error" && (
                        <span className="user-notes-status error">Failed to save</span>
                    )}
                </div>
            </div>

            {/* Bubble Menu — appears on text selection */}
            <BubbleMenu
                editor={editor}
                className="user-notes-bubble-menu"
            >
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive("bold")}
                    title="Bold"
                >
                    <Bold size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive("italic")}
                    title="Italic"
                >
                    <Italic size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive("underline")}
                    title="Underline"
                >
                    <UnderlineIcon size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    active={editor.isActive("highlight")}
                    title="Highlight"
                >
                    <Highlighter size={14} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    active={editor.isActive("code")}
                    title="Code"
                >
                    <Code size={14} />
                </ToolbarButton>
            </BubbleMenu>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}

// ─── Toolbar Button Helper ──────────────────────────────────────────────────

function ToolbarButton({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`user-notes-toolbar-btn ${active ? "active" : ""}`}
        >
            {children}
        </button>
    );
}
