import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { Placeholder } from "@tiptap/extensions";
import { mentionSuggestion } from "./mentionSuggestion";

// TipTap's Mention with the `kind` attribute ("user" or "team", backend mentions-docs §2.3)
const MentionWithKind = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      kind: {
        default: "user",
        parseHTML: (element) => element.getAttribute("data-kind") || "user",
        renderHTML: (attributes) => ({ "data-kind": attributes.kind }),
      },
    };
  },
});

// The one editor setup for descriptions, comments and the chat (mentions-docs §6): StarterKit's nodes and marks
// (it already has Link and Underline in TipTap 3) limited to what the backend accepts, plus @mentions of this
// project's people and teams. Without a `projectId` there are no mentions.
export const richTextExtensions = ({ projectId, placeholder }) => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" } },
  }),
  Placeholder.configure({ placeholder }),
  ...(projectId
    ? [
        MentionWithKind.configure({
          HTMLAttributes: { class: "mention" },
          renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
          suggestion: mentionSuggestion(projectId),
        }),
      ]
    : []),
];
