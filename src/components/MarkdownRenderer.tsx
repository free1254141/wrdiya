'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

interface TableBlock {
  type: 'table';
  headers: string[];
  alignments: Array<'right' | 'left' | 'center'>;
  rows: string[][];
}

interface NormalBlock {
  type: 'normal';
  lines: string[];
}

type ParsedBlock = TableBlock | NormalBlock;

/**
 * Split raw markdown into structured blocks (detecting tables and regular text)
 */
function parseBlocks(content: string): ParsedBlock[] {
  const rawLines = content.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    // Check if this line looks like the start of a Markdown table:
    // It contains '|' and the next line is a separator like '|---|---|'
    if (line.includes('|') && i + 1 < rawLines.length) {
      const nextLine = rawLines[i + 1].trim();
      const isSeparator = /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(nextLine);

      if (isSeparator) {
        // Parse table headers
        const parseRow = (rowStr: string) =>
          rowStr
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim());

        const headers = parseRow(line);
        const sepCols = parseRow(nextLine);
        const alignments = sepCols.map((col) => {
          if (col.startsWith(':') && col.endsWith(':')) return 'center' as const;
          if (col.endsWith(':')) return 'left' as const;
          return 'right' as const; // Default for Arabic RTL
        });

        const rows: string[][] = [];
        i += 2; // Move past header and separator

        // Collect all table rows
        while (i < rawLines.length && rawLines[i].trim().includes('|')) {
          const rowData = parseRow(rawLines[i].trim());
          if (rowData.length > 0 && rowData.some((c) => c.length > 0)) {
            // Pad or trim row to match headers count
            while (rowData.length < headers.length) rowData.push('');
            rows.push(rowData.slice(0, headers.length));
          }
          i++;
        }

        blocks.push({
          type: 'table',
          headers,
          alignments,
          rows,
        });
        continue;
      }
    }

    // Collect normal lines
    const normalLines: string[] = [];
    while (i < rawLines.length) {
      const cur = rawLines[i].trim();
      if (cur.includes('|') && i + 1 < rawLines.length && /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(rawLines[i + 1].trim())) {
        break; // Next block is a table
      }
      normalLines.push(rawLines[i]);
      i++;
    }

    if (normalLines.length > 0) {
      blocks.push({
        type: 'normal',
        lines: normalLines,
      });
    }
  }

  return blocks;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-800 dark:text-zinc-200 font-sans">
      {blocks.map((block, bIdx) => {
        if (block.type === 'table') {
          return (
            <div
              key={`table_${bIdx}`}
              className="my-3 overflow-hidden rounded-2xl border border-amber-500/30 bg-white/70 shadow-xs backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/90"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-start text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/5 dark:from-amber-500/15 dark:via-zinc-800/80 dark:to-transparent">
                      {block.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="py-3 px-4 font-black text-slate-900 dark:text-amber-300 text-start whitespace-nowrap"
                        >
                          {formatInlineText(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/70">
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="transition hover:bg-amber-500/5 dark:hover:bg-amber-500/5"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-2.5 px-4 font-medium text-slate-800 dark:text-zinc-200"
                          >
                            {formatInlineText(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        // Render Normal Block lines
        return (
          <div key={`norm_${bIdx}`} className="space-y-2">
            {block.lines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (!trimmed) {
                return <div key={lIdx} className="h-1.5" />;
              }

              // Horizontal Rule
              if (trimmed === '---' || trimmed === '***') {
                return <hr key={lIdx} className="my-3 border-slate-200 dark:border-zinc-800" />;
              }

              // Callout / Blockquote: > text
              if (trimmed.startsWith('> ')) {
                const quoteContent = trimmed.replace(/^>\s*/, '');
                return (
                  <div
                    key={lIdx}
                    className="my-2.5 rounded-2xl border-r-4 border-amber-500 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 shadow-2xs dark:bg-amber-500/15 dark:text-zinc-100"
                  >
                    {formatInlineText(quoteContent)}
                  </div>
                );
              }

              // Highlighted Broker Verdict paragraph: e.g. "رأي البروكر:" or "رأيي المحايد:"
              if (/^(رأي البروكر|رأيي المحايد|خلاصة البروكر|نصيحة البروكر):/i.test(trimmed)) {
                return (
                  <div
                    key={lIdx}
                    className="my-2.5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-400/5 to-transparent px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-xs dark:text-zinc-100"
                  >
                    {formatInlineText(trimmed)}
                  </div>
                );
              }

              // Header 3
              if (trimmed.startsWith('### ')) {
                return (
                  <h3
                    key={lIdx}
                    className="mt-4 mb-1.5 flex items-center gap-2 text-sm sm:text-base font-black text-slate-900 dark:text-white"
                  >
                    <span className="h-4 w-1 rounded-full bg-amber-500" />
                    <span>{formatInlineText(trimmed.replace('### ', ''))}</span>
                  </h3>
                );
              }

              // Header 2
              if (trimmed.startsWith('## ')) {
                return (
                  <h2
                    key={lIdx}
                    className="mt-5 mb-2 text-base sm:text-lg font-black text-amber-600 dark:text-amber-400"
                  >
                    {formatInlineText(trimmed.replace('## ', ''))}
                  </h2>
                );
              }

              // Header 1
              if (trimmed.startsWith('# ')) {
                return (
                  <h1
                    key={lIdx}
                    className="mt-5 mb-2.5 text-lg sm:text-xl font-black text-slate-900 dark:text-white"
                  >
                    {formatInlineText(trimmed.replace('# ', ''))}
                  </h1>
                );
              }

              // Numbered list: 1. text
              const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
              if (numMatch) {
                const [, num, itemContent] = numMatch;
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 my-1.5 pr-1">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500 text-black text-[10px] font-black mt-0.5 shadow-2xs">
                      {num}
                    </span>
                    <span className="flex-1 font-medium">{formatInlineText(itemContent)}</span>
                  </div>
                );
              }

              // Bullet points: - text, * text, • text
              if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
                const bulletContent = trimmed.replace(/^[-•*]\s+/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 my-1.5 pr-1">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    <span className="flex-1 font-medium">{formatInlineText(bulletContent)}</span>
                  </div>
                );
              }

              // Standard paragraph
              return (
                <p key={lIdx} className="font-normal text-slate-800 dark:text-zinc-200 text-sm leading-relaxed">
                  {formatInlineText(line)}
                </p>
              );
            })}
          </div>
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
      const boldContent = part.slice(2, -2);
      return (
        <strong key={index} className="font-black text-slate-950 dark:text-white">
          {boldContent}
        </strong>
      );
    }

    // Inline code: `text`
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded-lg bg-amber-500/10 px-1.5 py-0.5 font-mono text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/20"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
