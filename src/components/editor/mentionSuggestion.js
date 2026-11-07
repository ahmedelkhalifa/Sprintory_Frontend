import { ReactRenderer } from "@tiptap/react";
import MentionList from "./MentionList";
import { getMentionables } from "../../api/mentionsApi";
import { isAbort } from "../../utils/apiError";

const DEBOUNCE_MS = 200;
const POPUP_HEIGHT = 270; // about MentionList's max height, to decide whether it fits below the caret

// the endpoint's people and teams as suggestion items (people first, as mentions-docs §6 asks)
const toItems = ({ users = [], teams = [] }) => [
  ...users.map((user) => ({ kind: "user", id: String(user.id), label: user.name, detail: user.email })),
  ...teams.map((team) => ({
    kind: "team",
    id: String(team.id),
    label: team.name,
    detail: `${team.membersInProject} ${team.membersInProject === 1 ? "person" : "people"} in this project`,
  })),
];

// TipTap's `suggestion` option for the Mention extension: typing "@" asks the project's /mentionables (after a
// short pause, the previous request aborted) and shows MentionList under the caret. Only this project's members and
// teams can be mentioned, so there is never a global user search.
export const mentionSuggestion = (projectId) => {
  let timer;
  let controller;

  return {
    char: "@",
    allowSpaces: true,
    items: ({ query }) =>
      new Promise((resolve) => {
        clearTimeout(timer);
        controller?.abort();
        // a superseded call never resolves: TipTap shows the newest list only
        timer = setTimeout(async () => {
          controller = new AbortController();
          try {
            resolve(toItems(await getMentionables(projectId, query, controller.signal)));
          } catch (err) {
            if (!isAbort(err)) resolve([]);
          }
        }, DEBOUNCE_MS);
      }),
    // a space after the mention, so typing goes on as text
    command: ({ editor, range, props }) => {
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          { type: "mention", attrs: { kind: props.kind, id: props.id, label: props.label } },
          { type: "text", text: " " },
        ])
        .run();
    },
    render: () => {
      let component;
      let popup;

      const place = (clientRect) => {
        const rect = clientRect?.();
        if (!rect || !popup) return;
        const below = rect.bottom + 4 + POPUP_HEIGHT < window.innerHeight;
        popup.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 296))}px`;
        popup.style.top = below ? `${rect.bottom + 4}px` : `${Math.max(8, rect.top - POPUP_HEIGHT - 4)}px`;
      };

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, { props, editor: props.editor });
          popup = document.createElement("div");
          // above dialogs and drawers (MUI's modal z-index is 1300)
          Object.assign(popup.style, { position: "fixed", zIndex: "1500" });
          popup.appendChild(component.element);
          document.body.appendChild(popup);
          place(props.clientRect);
        },
        onUpdate: (props) => {
          component?.updateProps(props);
          place(props.clientRect);
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            popup?.remove();
            popup = null;
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          popup?.remove();
          popup = null;
          component?.destroy();
          component = null;
        },
      };
    },
  };
};
