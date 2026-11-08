import test from "node:test";
import assert from "node:assert/strict";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  attachmentKind,
  fileExtension,
  filterAttachments,
  formatFileSize,
  sortAttachments,
} from "../src/utils/attachment.js";
import { validateAttachments } from "../src/utils/validation.js";

const file = (name, size = 100) => ({ name, size });
const attachment = (id, fileName, sizeBytes = 100, uploadedAt = "2026-11-07T10:00:00Z") => ({ id, fileName, sizeBytes, uploadedAt });
const ids = (list) => list.map((a) => a.id);

test("fileExtension ignores case and only reads the last part", () => {
  assert.equal(fileExtension("Report.PDF"), "pdf");
  assert.equal(fileExtension("archive.tar.zip"), "zip");
  assert.equal(fileExtension("README"), "");
});

test("the picker accepts every type on the backend's list", () => {
  assert.equal(ATTACHMENT_ACCEPT, ".pdf,.docx,.xlsx,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip");
});

test("attachmentKind names the type by the file name", () => {
  assert.equal(attachmentKind({ fileName: "Requirements v2.pdf" }), "pdf");
  assert.equal(attachmentKind({ fileName: "plan.docx" }), "word");
  assert.equal(attachmentKind({ fileName: "budget.XLSX" }), "excel");
  assert.equal(attachmentKind({ fileName: "deck.pptx" }), "powerpoint");
  assert.equal(attachmentKind({ fileName: "notes.md" }), "text");
  assert.equal(attachmentKind({ fileName: "login.webp" }), "image");
  assert.equal(attachmentKind({ fileName: "logs.zip" }), "zip");
  assert.equal(attachmentKind({ fileName: "unknown" }), "file");
});

test("filterAttachments groups images, documents and the rest", () => {
  const list = [attachment(1, "a.webp"), attachment(2, "b.pdf"), attachment(3, "c.csv"), attachment(4, "d.zip")];
  assert.deepEqual(ids(filterAttachments(list, "all")), [1, 2, 3, 4]);
  assert.deepEqual(ids(filterAttachments(list, "images")), [1]);
  assert.deepEqual(ids(filterAttachments(list, "documents")), [2, 3]);
  assert.deepEqual(ids(filterAttachments(list, "other")), [4]);
});

test("sortAttachments is newest first by default, like the backend, and leaves the list as it was", () => {
  const list = [
    attachment(1, "b.pdf", 300, "2026-11-05T10:00:00Z"),
    attachment(2, "a.pdf", 100, "2026-11-07T10:00:00Z"),
    attachment(3, "c.pdf", 200, "2026-11-07T10:00:00Z"),
  ];
  assert.deepEqual(ids(sortAttachments(list)), [3, 2, 1]);
  assert.deepEqual(ids(sortAttachments(list, { by: "date", direction: "asc" })), [1, 2, 3]);
  assert.deepEqual(ids(sortAttachments(list, { by: "size", direction: "desc" })), [1, 3, 2]);
  assert.deepEqual(ids(sortAttachments(list, { by: "name", direction: "asc" })), [2, 1, 3]);
  assert.deepEqual(ids(list), [1, 2, 3]);
});

test("sortAttachments puts numbers in file names in their natural order", () => {
  const list = [attachment(1, "shot 10.png"), attachment(2, "Shot 2.png")];
  assert.deepEqual(ids(sortAttachments(list, { by: "name", direction: "asc" })), [2, 1]);
});

test("formatFileSize picks the unit", () => {
  assert.equal(formatFileSize(512), "512 B");
  assert.equal(formatFileSize(395264), "386 KB");
  assert.equal(formatFileSize(3250586), "3.1 MB");
  assert.equal(formatFileSize(1048575), "1.0 MB");
});

test("validateAttachments accepts what the backend takes", () => {
  assert.deepEqual(validateAttachments([file("a.pdf"), file("B.PNG"), file("c.zip", MAX_ATTACHMENT_BYTES)]), {});
});

test("validateAttachments refuses all the files for one bad file", () => {
  assert.equal(validateAttachments([]).files, "Choose at least one file to upload.");
  assert.equal(validateAttachments(Array.from({ length: 6 }, (_, i) => file(`${i}.pdf`))).files, "You can upload at most 5 files at once.");
  assert.equal(validateAttachments([file("a.pdf"), file("setup.exe")]).files, "setup.exe: this file type is not allowed.");
  assert.equal(validateAttachments([file("page.html")]).files, "page.html: this file type is not allowed.");
  assert.equal(validateAttachments([file("logo.svg")]).files, "logo.svg: this file type is not allowed.");
  assert.equal(validateAttachments([file("old.doc")]).files, "old.doc: this file type is not allowed.");
  assert.equal(validateAttachments([file("noextension")]).files, "noextension: this file type is not allowed.");
  assert.equal(validateAttachments([file("x.pdf", 0)]).files, "x.pdf is empty.");
  assert.equal(validateAttachments([file("big.zip", MAX_ATTACHMENT_BYTES + 1)]).files, "big.zip: file too large (max 20 MB).");
});
