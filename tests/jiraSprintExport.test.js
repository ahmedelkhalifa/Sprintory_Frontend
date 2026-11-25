import test from "node:test";
import assert from "node:assert/strict";
import { jiraSprintExportUrl } from "../src/utils/jiraSprintExport.js";

const expected = "https://example.atlassian.net/rest/agile/1.0/board/42/sprint?startAt=0&maxResults=50";

test("builds Jira sprint export URL, ignoring board filters and fragments", () => {
  assert.equal(jiraSprintExportUrl(" https://example.atlassian.net/jira/software/projects/ABC/boards/42?filter=1#card "), expected);
});
test("accepts company-managed and legacy board links", () => {
  assert.equal(jiraSprintExportUrl("https://example.atlassian.net/jira/software/c/projects/ABC/boards/42/backlog"), expected);
  assert.equal(jiraSprintExportUrl("https://example.atlassian.net/secure/RapidBoard.jspa?rapidView=42"), expected);
});
test("rejects malformed, non-board and unsafe URLs", () => {
  for (const value of [null, "", "example.atlassian.net", "javascript:alert(1)",
    "https://example.atlassian.net.evil.com/jira/software/projects/A/boards/42",
    "https://example.atlassian.net@evil.com/jira/software/projects/A/boards/42",
    "https://user@example.atlassian.net/jira/software/projects/A/boards/42",
    "http://example.atlassian.net/jira/software/projects/A/boards/42",
    "https://example.atlassian.net:444/jira/software/projects/A/boards/42",
    "https://example.atlassian.net/browse/ABC-42",
    "https://example.atlassian.net/jira/software/projects/A/boards/0",
    "https://example.atlassian.net/secure/RapidBoard.jspa?rapidView=42&rapidView=99"]) {
    assert.equal(jiraSprintExportUrl(value), null, String(value));
  }
});
