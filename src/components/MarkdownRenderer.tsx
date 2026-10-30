'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800 dark:text-zinc-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Horizontal Rule
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="my-3 border-slate-200 dark:border-zinc-800" />;
        }

        // Header 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="mt-3 text-base font-black text-slate-900 dark:text-white">
              {formatInlineText(trimmed.replace('### ', ''))}
            </h3>
          );
        }

        // Header 2
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="mt-4 text-lg font-black text-slate-900 dark:text-white">
              {formatInlineText(trimmed.replace('## ', ''))}
            </h2>
          );
        }

        // Header 1
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="mt-4 text-xl font-black text-slate-900 dark:text-white">
              {formatInlineText(trimmed.replace('# ', ''))}
            </h1>
          );
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.replace(/^[-•*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pr-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>{formatInlineText(bulletContent)}</span>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx}>
            {formatInlineText(line)}
          </p>
        );
      })}
    </div>
  );
}

function formatInlineText(text: string): React.ReactNode {
  // Regex matches:
  // 1. Markdown Links: [label](url)
  // 2. Bold text: **text**
  // 3. Inline code: `text`
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    // Markdown link: [label](url)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const [, label, url] = match;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-amber-600 underline decoration-amber-500/50 underline-offset-2 transition hover:text-amber-500 dark:text-amber-400 dark:decoration-amber-400/50 dark:hover:text-amber-300"
          >
            <span>{label}</span>
          </a>
        );
      }
    }

    // Bold text: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-black text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Inline code: `text`
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-amber-600 dark:bg-zinc-800 dark:text-amber-400">
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
