import { marked } from "marked";
import { useMemo } from "react";

const PARSE_LIMIT = 40_000;

// Configure marked for GFM
marked.setOptions({ gfm: true, breaks: true });

// Basic tag sanitizer — strip anything that's not in our allowlist
const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
  "span",
  "div",
]);

function sanitize(html: string): string {
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    const lower = tag.toLowerCase();
    if (ALLOWED_TAGS.has(lower)) {
      return match;
    }
    return "";
  });
}

export default function MarkdownRenderer({ content }: { content: string }) {
  const html = useMemo(() => {
    if (!content) {
      return "";
    }
    if (content.length > PARSE_LIMIT) {
      return null; // fallback to <pre>
    }
    try {
      return sanitize(marked.parse(content, { async: false }) as string);
    } catch {
      return null;
    }
  }, [content]);

  if (!content) {
    return null;
  }

  if (html === null) {
    return (
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        {content}
      </pre>
    );
  }

  return (
    <>
      <style>{markdownStyles}</style>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized markdown output */}
      <div className="md-content" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

const markdownStyles = `
.md-content {
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  color: #e8e0d0;
}
.md-content p { margin: 0 0 8px 0; }
.md-content p:last-child { margin-bottom: 0; }
.md-content h1, .md-content h2, .md-content h3, .md-content h4 {
  color: #f4a261;
  margin: 12px 0 6px 0;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}
.md-content h1 { font-size: 18px; }
.md-content h2 { font-size: 16px; }
.md-content h3 { font-size: 14px; }
.md-content h4 { font-size: 13px; }
.md-content strong, .md-content b { color: #f4a261; }
.md-content em, .md-content i { color: #5dade2; }
.md-content code {
  font-family: 'Courier New', monospace;
  color: #2ecc71;
  background: rgba(10,22,40,0.8);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
}
.md-content pre {
  background: rgba(10,22,40,0.95);
  border: 1px solid rgba(244,162,97,0.2);
  border-radius: 4px;
  padding: 10px 12px;
  overflow-x: auto;
  margin: 8px 0;
}
.md-content pre code {
  background: none;
  padding: 0;
  color: #e8e0d0;
  font-size: 12px;
}
.md-content blockquote {
  border-left: 3px solid #f4a261;
  margin: 8px 0;
  padding: 4px 12px;
  color: #c0b8a8;
  background: rgba(244,162,97,0.05);
}
.md-content ul, .md-content ol {
  margin: 6px 0;
  padding-left: 20px;
}
.md-content li { margin: 2px 0; }
.md-content a {
  color: #5dade2;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.md-content a:hover { color: #7ec8f0; }
.md-content hr {
  border: none;
  border-top: 1px solid rgba(244,162,97,0.2);
  margin: 12px 0;
}
.md-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 12px;
}
.md-content th, .md-content td {
  border: 1px solid rgba(244,162,97,0.25);
  padding: 5px 8px;
  text-align: left;
}
.md-content th {
  background: rgba(244,162,97,0.12);
  color: #f4a261;
  font-weight: bold;
}
.md-content del { color: #6a8090; }
`;
