import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { MarkdownText } from "./markdown-text";

test("applies className outside react-markdown", () => {
  const html = renderToStaticMarkup(
    <MarkdownText className="approval-description">
      **Review this**
    </MarkdownText>
  );

  assert.match(html, /^<div class="approval-description">/);
  assert.match(html, /<strong>Review this<\/strong>/);
});
