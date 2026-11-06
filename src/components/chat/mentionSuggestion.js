import { getProjectMentionables } from "../../api/chatApi.js";

// Only query the project's mentionables endpoint: never offer a global user search.
export const createChatMentionSuggestion = (projectId) => ({
  char: "@",
  allowSpaces: true,
  items: async ({ query }) => {
    try {
      const data = await getProjectMentionables(projectId, query);
      const users = (data.users || []).map((user) => ({
        kind: "user", id: String(user.id), label: user.name, detail: "Member",
      }));
      const teams = (data.teams || []).map((team) => ({
        kind: "team", id: String(team.id), label: team.name, detail: "Team",
      }));
      return [...users, ...teams].slice(0, 12);
    } catch {
      return [];
    }
  },
  command: ({ editor, range, props }) => {
    editor.chain().focus().insertContentAt(range, [
      { type: "mention", attrs: { id: props.id, kind: props.kind, label: props.label } },
      { type: "text", text: " " },
    ]).run();
  },
  render: () => {
    let popup;
    let props;
    let selectedIndex = 0;

    const updatePosition = () => {
      const rect = props?.clientRect?.();
      if (!rect || !popup) return;
      popup.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 350))}px`;
      popup.style.top = `${rect.bottom + 5 > window.innerHeight - 260 ? Math.max(8, rect.top - 250) : rect.bottom + 5}px`;
    };
    const redraw = () => {
      if (!popup) return;
      popup.replaceChildren();
      if (!props?.items?.length) {
        const empty = document.createElement("div");
        empty.textContent = "No matching project members or teams";
        empty.style.padding = "8px 10px";
        popup.appendChild(empty);
      }
      props?.items?.forEach((item, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chat-suggestion-option";
        button.dataset.selected = String(selectedIndex === index);
        button.textContent = item.label;
        const detail = document.createElement("small");
        detail.textContent = item.detail;
        button.appendChild(detail);
        button.onmousedown = (event) => event.preventDefault();
        button.onclick = () => props.command(item);
        popup.appendChild(button);
      });
      updatePosition();
    };
    return {
      onStart: (next) => {
        props = next;
        selectedIndex = 0;
        popup = document.createElement("div");
        popup.className = "chat-suggestion-popup";
        popup.setAttribute("role", "listbox");
        document.body.appendChild(popup);
        redraw();
      },
      onUpdate: (next) => { props = next; selectedIndex = 0; redraw(); },
      onKeyDown: ({ event }) => {
        if (event.key === "Escape") { popup?.remove(); popup = null; return true; }
        if (!props?.items?.length) return false;
        if (event.key === "ArrowDown") { selectedIndex = (selectedIndex + 1) % props.items.length; redraw(); return true; }
        if (event.key === "ArrowUp") { selectedIndex = (selectedIndex + props.items.length - 1) % props.items.length; redraw(); return true; }
        if (event.key === "Enter") { props.command(props.items[selectedIndex]); return true; }
        return false;
      },
      onExit: () => { popup?.remove(); popup = null; props = null; },
    };
  },
});
