import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import { Box, Button, ButtonGroup, Paper } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import CodeIcon from "@mui/icons-material/Code";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import { createMentionSuggestion } from "./mentionSuggestion";

const RichTextEditor = ({ content, onChange, projectId, placeholder = "Write something..." }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
            }),
            Mention.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        kind: { default: "user", parseHTML: (el) => el.getAttribute("data-kind"), renderHTML: (attrs) => ({ "data-kind": attrs.kind }) },
                    };
                },
            }).configure({
                HTMLAttributes: { class: "mention" },
                suggestion: createMentionSuggestion(projectId),
            }),
        ],
        content: content ? (typeof content === "string" ? JSON.parse(content) : content) : "",
        onUpdate: ({ editor }) => {
            onChange(JSON.stringify(editor.getJSON()));
        },
    });

    if (!editor) return null;

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", p: 0.5, bgcolor: "action.hover" }}>
                <ButtonGroup size="small" variant="text" color="inherit">
                    <Button onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive("bold") ? "primary" : "inherit"}><FormatBoldIcon fontSize="small" /></Button>
                    <Button onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive("italic") ? "primary" : "inherit"}><FormatItalicIcon fontSize="small" /></Button>
                    <Button onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive("underline") ? "primary" : "inherit"}><FormatUnderlinedIcon fontSize="small" /></Button>
                    <Button onClick={() => editor.chain().focus().toggleStrike().run()} color={editor.isActive("strike") ? "primary" : "inherit"}><StrikethroughSIcon fontSize="small" /></Button>
                    <Button onClick={() => editor.chain().focus().toggleCode().run()} color={editor.isActive("code") ? "primary" : "inherit"}><CodeIcon fontSize="small" /></Button>
                    <Button onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive("bulletList") ? "primary" : "inherit"}><FormatListBulletedIcon fontSize="small" /></Button>
                    <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive("orderedList") ? "primary" : "inherit"}><FormatListNumberedIcon fontSize="small" /></Button>
                </ButtonGroup>
            </Box>
            <Box sx={{ p: 1.5, minHeight: 100, "& .ProseMirror": { outline: "none" } }}>
                <EditorContent editor={editor} placeholder={placeholder} />
            </Box>
        </Paper>
    );
};

export default RichTextEditor;