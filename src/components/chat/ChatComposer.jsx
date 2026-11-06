import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Mention } from "@tiptap/extension-mention";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Paper, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import CodeIcon from "@mui/icons-material/Code";
import LinkIcon from "@mui/icons-material/Link";
import SendIcon from "@mui/icons-material/Send";
import { createChatMentionSuggestion } from "./mentionSuggestion.js";
import { isEmptyChatDoc, safeChatHref } from "../../utils/chat.js";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

const MentionWithKind = Mention.extend({
  addAttributes() {
    return { ...this.parent?.(), kind: { default: "user" } };
  },
});

function Tool({ title, active = false, disabled, onClick, children }) {
  return <Tooltip title={title}><span><IconButton size="small" aria-label={title} color={active ? "primary" : "default"} disabled={disabled} onClick={onClick}>{children}</IconButton></span></Tooltip>;
}

export default function ChatComposer({ projectId, editMessage, disabled, status, onSend, onEdit, onCancel }) {
  const [, forceRender] = useState(0);
  const [error, setError] = useState("");
  const [linkDialog, setLinkDialog] = useState(false);
  const [href, setHref] = useState("");
  const suggestion = useMemo(() => createChatMentionSuggestion(projectId), [projectId]);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, underline: false }),
      Underline,
      TiptapLink.configure({ openOnClick: false, autolink: false }),
      MentionWithKind.configure({
        suggestion,
        renderText: ({ node }) => `@${node.attrs.label || node.attrs.id}`,
        HTMLAttributes: { class: "chat-mention" },
      }),
    ],
    content: editMessage?.content || EMPTY_DOC,
    editable: !disabled,
    editorProps: {
      attributes: { "aria-label": editMessage ? "Edit chat message" : "New chat message", role: "textbox" },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          document.getElementById("project-chat-submit")?.click();
          return true;
        }
        return false;
      },
    },
    onUpdate: () => { forceRender((value) => value + 1); setError(""); },
  }, [suggestion]);
  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);
  // Re-mount ChatComposer with a new key when switching between drafting and editing.
  const blank = !editor || isEmptyChatDoc(editor.getJSON());
  const tooLong = Boolean(editor && editor.getText({ blockSeparator: "\n" }).length > 10000);
  const offline = status !== "connected";

  const submit = (event) => {
    event.preventDefault();
    if (!editor || disabled || offline || blank || tooLong) return;
    try {
      const content = editor.getJSON();
      if (editMessage) onEdit(editMessage.id, content);
      else onSend(content);
      if (editMessage) onCancel();
      else editor.commands.clearContent();
      setError("");
    } catch (err) {
      setError(err.message || "Could not send the message.");
    }
  };
  const openLink = () => { setHref(editor?.getAttributes("link")?.href || ""); setLinkDialog(true); };
  const saveLink = () => {
    if (!editor) return;
    if (!href.trim()) editor.chain().focus().unsetLink().run();
    else if (safeChatHref(href.trim())) editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
    else { setError("Only http, https and mailto links are allowed."); return; }
    setLinkDialog(false);
  };

  return <Box component="form" onSubmit={submit} sx={{ mt: 1 }}>
    {editMessage && <Typography variant="subtitle2" sx={{ mb: 1 }}>Editing your message</Typography>}
    <Paper className="chat-editor" variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", opacity: disabled ? .65 : 1 }}>
      <Stack direction="row" flexWrap="wrap" sx={{ px: 1, py: .5, borderBottom: 1, borderColor: "divider" }}>
        <Tool title="Bold" active={editor?.isActive("bold")} disabled={disabled} onClick={() => editor?.chain().focus().toggleBold().run()}><FormatBoldIcon fontSize="small" /></Tool>
        <Tool title="Italic" active={editor?.isActive("italic")} disabled={disabled} onClick={() => editor?.chain().focus().toggleItalic().run()}><FormatItalicIcon fontSize="small" /></Tool>
        <Tool title="Underline" active={editor?.isActive("underline")} disabled={disabled} onClick={() => editor?.chain().focus().toggleUnderline().run()}><FormatUnderlinedIcon fontSize="small" /></Tool>
        <Tool title="Strike" active={editor?.isActive("strike")} disabled={disabled} onClick={() => editor?.chain().focus().toggleStrike().run()}><FormatStrikethroughIcon fontSize="small" /></Tool>
        <Tool title="Bullet list" active={editor?.isActive("bulletList")} disabled={disabled} onClick={() => editor?.chain().focus().toggleBulletList().run()}><FormatListBulletedIcon fontSize="small" /></Tool>
        <Tool title="Numbered list" active={editor?.isActive("orderedList")} disabled={disabled} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><FormatListNumberedIcon fontSize="small" /></Tool>
        <Tool title="Quote" active={editor?.isActive("blockquote")} disabled={disabled} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><FormatQuoteIcon fontSize="small" /></Tool>
        <Tool title="Inline code" active={editor?.isActive("code")} disabled={disabled} onClick={() => editor?.chain().focus().toggleCode().run()}><CodeIcon fontSize="small" /></Tool>
        <Tool title="Insert link" active={editor?.isActive("link")} disabled={disabled} onClick={openLink}><LinkIcon fontSize="small" /></Tool>
      </Stack>
      <EditorContent editor={editor} />
    </Paper>
    <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
      <Typography variant="caption" color={tooLong ? "error" : "text.secondary"}>
        {disabled ? "Read-only chat" : "Type @ to mention a member or team · Ctrl+Enter to send"}
        {tooLong && " · Maximum 10,000 characters"}
      </Typography>
      <Stack direction="row" spacing={1}>
        {editMessage && <Button onClick={onCancel} size="small">Cancel</Button>}
        <Button id="project-chat-submit" type="submit" size="small" variant="contained" startIcon={<SendIcon />} disabled={disabled || offline || blank || tooLong}>
          {editMessage ? "Save edit" : "Send"}
        </Button>
      </Stack>
    </Stack>
    {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    <Dialog open={linkDialog} onClose={() => setLinkDialog(false)} fullWidth maxWidth="xs">
      <DialogTitle>Insert link</DialogTitle>
      <DialogContent><TextField autoFocus margin="dense" fullWidth size="small" label="URL (http, https, mailto)" value={href} onChange={(event) => setHref(event.target.value)} /></DialogContent>
      <DialogActions><Button onClick={() => setLinkDialog(false)}>Cancel</Button><Button onClick={saveLink}>Apply</Button></DialogActions>
    </Dialog>
  </Box>;
}
