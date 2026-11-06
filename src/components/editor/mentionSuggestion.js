import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { getMentionables } from "../../api/mentionsApi";
import MentionList from "./MentionList";

export const createMentionSuggestion = (projectId) => ({
    items: async ({ query }) => {
        try {
            const data = await getMentionables(projectId, query);
            const users = (data.users || []).map((u) => ({
                id: String(u.id),
                label: u.name,
                kind: "user",
                sub: u.email,
            }));
            const teams = (data.teams || []).map((t) => ({
                id: String(t.id),
                label: t.name,
                kind: "team",
                sub: `team · ${t.membersInProject} people`,
            }));
            return [...users, ...teams];
        } catch {
            return [];
        }
    },

    render: () => {
        let component;
        let popup;

        return {
            onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy("body", {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: "manual",
                    placement: "bottom-start",
                });
            },

            onUpdate(props) {
                component?.updateProps(props);
                if (props.clientRect) {
                    popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect });
                }
            },

            onKeyDown(props) {
                if (props.event.key === "Escape") {
                    popup?.[0]?.hide();
                    return true;
                }
                return component?.ref?.onKeyDown(props);
            },

            onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
            },
        };
    },
});