import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Tooltip,
} from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import CodeIcon from "@mui/icons-material/Code";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import LinkIcon from "@mui/icons-material/Link";
import { richTextExtensions } from "./richTextExtensions";
import { richTextSx } from "./richTextSx";
import { safeHref, toDoc } from "../../utils/richText";

const TOOLS = [
  { mark: "bold", label: "Bold", Icon: FormatBoldIcon, run: (chain) => chain.toggleBold() },
  { mark: "italic", label: "Italic", Icon: FormatItalicIcon, run: (chain) => chain.toggleItalic() },
  { mark: "underline", label: "Underline", Icon: FormatUnderlinedIcon, run: (chain) => chain.toggleUnderline() },
  { mark: "strike", label: "Strikethrough", Icon: StrikethroughSIcon, run: (chain) => chain.toggleStrike() },
  { mark: "code", label: "Inline code", Icon: CodeIcon, run: (chain) => chain.toggleCode() },
  { mark: "bulletList", label: "Bulleted list", Icon: FormatListBulletedIcon, run: (chain) => chain.toggleBulletList() },
  { mark: "orderedList", label: "Numbered list", Icon: FormatListNumberedIcon, run: (chain) => chain.toggleOrderedList() },
  { mark: "blockquote", label: "Quote", Icon: FormatQuoteIcon, run: (chain) => chain.toggleBlockquote() },
];

// "Insert link": http, https and mailto only (the backend refuses the rest); an empty address removes the link
const LinkDialog = ({ initial, onApply, onClose }) => {
  const [href, setHref] = useState(initial);
  const [error, setError] = useState("");

  const apply = () => {
    const value = href.trim();
    if (value && !safeHref(value)) {
      setError("Use an http, https or mailto address.");
      return;
    }
    onApply(value ? safeHref(value) : "");
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Insert link</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          margin="dense"
          label="Address"
          placeholder="https://"
          value={href}
          error={Boolean(error)}
          helperText={error || "Leave it empty to remove the link."}
          onChange={(e) => {
            setHref(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={apply} variant="contained">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * The rich-text editor for task descriptions, comments and the project chat (TipTap, backend mentions-docs.md):
 * a toolbar, @mentions of this project's people and teams (`projectId`), Ctrl/⌘+Enter for `onSubmit`.
 * `value` is only the starting content (a JSON string, a document, an old plain text or nothing); every change
 * calls `onChange(doc)` with the document (richTextValue(doc) turns it into what a form sends). `ref` gives
 * { clear(), focus() }, e.g. to empty a comment box after posting. `error` outlines it in red.
 */
const RichTextEditor = ({
  ref,
  value,
  onChange,
  onSubmit,
  projectId,
  placeholder = "",
  disabled = false,
  autoFocus = false,
  minHeight = 96,
  error = false,
  ariaLabel = "Text",
}) => {
  const [link, setLink] = useState(null); // the link dialog's starting address while it is open
  // the editor is created once (per project): it calls the latest callbacks through this ref
  const callbacks = useRef({ onChange, onSubmit });
  useEffect(() => {
    callbacks.current = { onChange, onSubmit };
  });

  const editor = useEditor(
    {
      extensions: richTextExtensions({ projectId, placeholder }),
      content: toDoc(value),
      editable: !disabled,
      autofocus: autoFocus ? "end" : false,
      editorProps: {
        attributes: { "aria-label": ariaLabel, "aria-multiline": "true", role: "textbox" },
        handleKeyDown: (_view, event) => {
          const submit = callbacks.current.onSubmit;
          if (submit && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            submit();
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: current }) => callbacks.current.onChange?.(current.getJSON()),
    },
    // a new project means other people to mention
    [projectId],
  );

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => editor?.commands.clearContent(true),
      focus: () => editor?.commands.focus("end"),
    }),
    [editor],
  );

  // TipTap 3 doesn't re-render on every keystroke: read the active marks for the toolbar this way
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      Object.fromEntries([...TOOLS.map((tool) => tool.mark), "link"].map((mark) => [mark, current?.isActive(mark) ?? false])),
  });

  const applyLink = (href) => {
    const chain = editor.chain().focus().extendMarkRange("link");
    (href ? chain.setLink({ href }) : chain.unsetLink()).run();
    setLink(null);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        borderColor: error ? "error.main" : undefined,
        opacity: disabled ? 0.7 : 1,
        "&:focus-within": { borderColor: error ? "error.main" : "primary.main" },
      }}
    >
      <Box
        role="toolbar"
        aria-label="Formatting"
        sx={{ display: "flex", flexWrap: "wrap", px: 0.5, py: 0.25, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}
      >
        {TOOLS.map(({ mark, label, Icon, run }) => (
          <Tooltip key={mark} title={label}>
            <span>
              <IconButton
                size="small"
                aria-label={label}
                aria-pressed={Boolean(active?.[mark])}
                color={active?.[mark] ? "primary" : "default"}
                disabled={disabled || !editor}
                onClick={() => run(editor.chain().focus()).run()}
              >
                <Icon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ))}
        <Tooltip title="Link">
          <span>
            <IconButton
              size="small"
              aria-label="Link"
              aria-pressed={Boolean(active?.link)}
              color={active?.link ? "primary" : "default"}
              disabled={disabled || !editor}
              onClick={() => setLink(editor.getAttributes("link").href ?? "")}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Box
        sx={(theme) => ({
          ...richTextSx(theme),
          "& .tiptap": { minHeight, maxHeight: 360, overflowY: "auto", px: 1.5, py: 1, outline: "none" },
          // the Placeholder extension marks the empty first paragraph
          "& .tiptap p.is-editor-empty:first-of-type::before": {
            content: "attr(data-placeholder)",
            color: "text.disabled",
            float: "left",
            height: 0,
            pointerEvents: "none",
          },
          "& .tiptap .ProseMirror-selectednode": { outline: `2px solid ${alpha(theme.palette.primary.main, 0.4)}` },
        })}
      >
        <EditorContent editor={editor} />
      </Box>
      {link !== null && <LinkDialog initial={link} onApply={applyLink} onClose={() => setLink(null)} />}
    </Paper>
  );
};

export default RichTextEditor;
