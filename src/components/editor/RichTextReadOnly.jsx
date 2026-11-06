import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import { Box } from "@mui/material";

const parseContent = (content) => {
    if (!content) return "";
    try {
        return typeof content === "string" ? JSON.parse(content) : content;
    } catch {
        // Фоллбек для старых текстовых описаний
        return {
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: content }] }],
        };
    }
};

const RichTextReadOnly = ({ content, mentions = [] }) => {
    const parsedContent = parseContent(content);

    const editor = useEditor({
        editable: false,
        extensions: [
            StarterKit,
            Underline,
            Link.configure({ HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } }),
            Mention.extend({
                renderHTML({ node }) {
                    const matched = mentions.find((m) => String(m.id) === String(node.attrs.id) && m.kind === node.attrs.kind);
                    const displayName = matched ? matched.name : node.attrs.label || "User";
                    return ["span", { class: "mention-link", style: "color: #1976d2; font-weight: 600;" }, `@${displayName}`];
                },
            }),
        ],
        content: parsedContent,
    });

    return (
        <Box sx={{ "& .ProseMirror": { outline: "none" } }}>
            <EditorContent editor={editor} />
        </Box>
    );
};

export default RichTextReadOnly;