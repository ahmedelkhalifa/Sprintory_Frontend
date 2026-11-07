import test from "node:test";
import assert from "node:assert/strict";
import { deletedComment, mergeComments } from "../src/utils/comment.js";
import {
  EMPTY_DOC,
  docText,
  isEmptyDoc,
  isRichTextError,
  mentionName,
  richTextValue,
  safeHref,
  toDoc,
} from "../src/utils/richText.js";

const doc = (...content) => ({ type: "doc", content });
const paragraph = (...content) => ({ type: "paragraph", content });
const text = (value) => ({ type: "text", text: value });
const mention = (id, label, kind = "user") => ({ type: "mention", attrs: { kind, id, label } });

test("toDoc opens JSON strings, documents, old plain text and nothing", () => {
  const stored = doc(paragraph(text("Hi")));
  assert.deepEqual(toDoc(JSON.stringify(stored)), stored);
  assert.deepEqual(toDoc(stored), stored);
  assert.deepEqual(toDoc(null), EMPTY_DOC);
  assert.deepEqual(toDoc("Steps:\n\n1. open"), doc(paragraph(text("Steps:")), { type: "paragraph" }, paragraph(text("1. open"))));
  // JSON that isn't a document is shown as the text it is
  assert.deepEqual(toDoc("42"), doc(paragraph(text("42"))));
});

test("an empty document is no description; a mention alone is not empty", () => {
  assert.equal(isEmptyDoc(EMPTY_DOC), true);
  assert.equal(isEmptyDoc(doc(paragraph(text("   ")))), true);
  assert.equal(isEmptyDoc(doc(paragraph(mention("4", "Jane")))), false);
  assert.equal(richTextValue(doc(paragraph(text("  ")))), "");
  const filled = doc(paragraph(text("Done")));
  assert.equal(richTextValue(filled), JSON.stringify(filled));
});

test("docText puts blocks on their own lines and mentions as @name", () => {
  const value = doc(paragraph(text("Ask "), mention("4", "Jane")), { type: "bulletList", content: [{ type: "listItem", content: [paragraph(text("one"))] }] });
  assert.equal(docText(value), "Ask @Jane\none");
});

test("only http, https and mailto links are kept", () => {
  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("data:text/html,hi"), null);
  assert.equal(safeHref("not a url"), null);
  assert.equal(safeHref("https://example.com/a"), "https://example.com/a");
  assert.equal(safeHref("mailto:a@b.c"), "mailto:a@b.c");
});

test("a mention shows the current name, matched by kind and id, else its label", () => {
  const mentions = [{ kind: "user", id: 4, name: "Jane Doe" }, { kind: "team", id: 4, name: "Backend" }];
  assert.equal(mentionName(mention("4", "Jane"), mentions), "Jane Doe");
  assert.equal(mentionName(mention("4", "Old", "team"), mentions), "Backend");
  assert.equal(mentionName(mention("9", "Gone"), mentions), "Gone");
});

test("refused rich text and mentions are recognised by code", () => {
  assert.equal(isRichTextError({ response: { data: { code: "INVALID_MENTION" } } }), true);
  assert.equal(isRichTextError({ response: { data: { code: "INVALID_RICH_TEXT" } } }), true);
  assert.equal(isRichTextError({ response: { data: { code: "VALIDATION_ERROR" } } }), false);
});

test("comments merge by id, the later copy wins, in the backend's order", () => {
  const c = (id, createdAt, body = "x") => ({ id, createdAt, body });
  const merged = mergeComments([c(2, "2026-11-05T10:00:00Z"), c(1, "2026-11-05T09:00:00Z")], [c(2, "2026-11-05T10:00:00Z", "edited"), c(3, "2026-11-05T11:00:00Z")]);
  assert.deepEqual(merged.map((m) => [m.id, m.body]), [
    [1, "x"],
    [2, "edited"],
    [3, "x"],
  ]);
  const gone = deletedComment({ id: 1, body: "secret", mentions: [{}], canEdit: true, canDelete: true });
  assert.equal(gone.deleted, true);
  assert.equal(gone.body, null);
  assert.deepEqual(gone.mentions, []);
  assert.equal(gone.canDelete, false);
});
