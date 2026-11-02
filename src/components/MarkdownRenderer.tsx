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

interface CalloutBlock {
  type: 'callout';
  icon: string;
  header: string;
  items: string[];
}

interface NormalBlock {
  type: 'normal';
  lines: string[];
}

type ParsedBlock = TableBlock | CalloutBlock | NormalBlock;

/**
 * Check if a line represents the start of a Callout / Advisor Insight Card
 */
function isCalloutHeader(line: string): boolean {
  const trimmed = line.trim();
  // 1. Specific insight / advisor emojis at start of line
  const emojiPrefix = /^(💡|⭐|📌|🔑|🎯|⚡)/;
  if (emojiPrefix.test(trimmed)) {
    return true;
  }
  // 2. Keyword patterns with colon (e.g. "ملاحظة سريعة مني كبروكر:", "نصيحة البروكر:", "رأيي كبروكر:")
  const keywordsWithColon = /^(ملاحظة|نصيحة|رأي البروكر|رأيي كبروكر|رأيي المحايد|خلاصة البروكر|توصية البروكر|توصية|خلاصة المقارنة|نصيحة هامة|معلومة سريعة|نصيحة الاستثمار|نظرة عامة|التقييم الفني|نظرة سريعة):/i;
  return keywordsWithColon.test(trimmed);
}

/**
 * Split raw markdown into structured blocks (detecting tables, callouts, and regular text)
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

    // Check if this line is a Callout / Advisor Card Header
    if (isCalloutHeader(line)) {
      let icon = '💡';
      const emojiMatch = line.match(/^(💡|⭐|📌|🔑|🎯|⚡)/);
      if (emojiMatch) {
        icon = emojiMatch[1];
      }
      const cleanHeader = line.replace(/^(💡|⭐|📌|🔑|🎯|⚡)\s*/, '');
      const items: string[] = [];
      i++; // Move past header

      // Collect bullet items or lines belonging to this callout
      while (i < rawLines.length) {
        const cur = rawLines[i].trim();
        if (!cur) {
          // Empty line: check if next line continues or is a new block
          if (
            i + 1 < rawLines.length &&
            (rawLines[i + 1].trim().startsWith('#') ||
              rawLines[i + 1].trim().startsWith('|') ||
              isCalloutHeader(rawLines[i + 1].trim()))
          ) {
            break;
          }
          i++;
          continue;
        }

        // Stop if table, header, or next callout
        if (cur.startsWith('|') || cur.startsWith('#') || isCalloutHeader(cur)) {
          break;
        }

        // Extract bullet text
        if (cur.startsWith('• ') || cur.startsWith('- ') || cur.startsWith('* ')) {
          items.push(cur.replace(/^[-•*]\s+/, ''));
        } else {
          // Normal continuation line in callout
          items.push(cur);
        }
        i++;
      }

      blocks.push({
        type: 'callout',
        icon,
        header: cleanHeader,
        items,
      });
      continue;
    }

    // Collect normal lines until a table or callout header
    const normalLines: string[] = [];
    while (i < rawLines.length) {
      const cur = rawLines[i].trim();
      if (
        cur.includes('|') &&
        i + 1 < rawLines.length &&
        /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(rawLines[i + 1].trim())
      ) {
        break; // Next block is a table
      }
      if (isCalloutHeader(cur)) {
        break; // Next block is a callout
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
        // Table Block
        if (block.type === 'table') {
          return (
            <div
              key={`table_${bIdx}`}
              className="my-3.5 overflow-hidden rounded-2xl border border-amber-500/30 bg-white/70 shadow-xs backdrop-blur-xs dark:border-amber-500/25 dark:bg-zinc-900/90"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-start text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-amber-500/25 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/5 dark:from-amber-500/20 dark:via-zinc-800/90 dark:to-zinc-900">
                      {block.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="py-2.5 sm:py-3 px-3 sm:px-4 font-black text-slate-900 dark:text-amber-300 text-start whitespace-nowrap text-xs sm:text-sm"
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
                        className="transition hover:bg-amber-500/5 dark:hover:bg-amber-500/10 odd:bg-transparent even:bg-amber-500/[0.02] dark:even:bg-zinc-800/30"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-2 sm:py-2.5 px-3 sm:px-4 font-medium text-slate-800 dark:text-zinc-200 text-xs sm:text-sm"
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

        // Callout / Advisor Card Block
        if (block.type === 'callout') {
          return (
            <div
              key={`callout_${bIdx}`}
              className="my-3.5 overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/12 via-amber-500/5 to-zinc-900/60 p-4 sm:p-5 shadow-xs backdrop-blur-md dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-amber-500/15 dark:via-zinc-900/80 dark:to-zinc-950/90"
            >
              {/* Header with badge icon and luxury golden styling */}
              <div className="flex items-center gap-2.5 pb-2.5 mb-3 border-b border-amber-500/20">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-base shadow-inner border border-amber-500/30">
                  {block.icon || '💡'}
                </span>
                <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-amber-300 tracking-tight">
                  {formatInlineText(block.header)}
                </h4>
              </div>

              {/* Items or Content */}
              {block.items.length > 0 ? (
                <div className="space-y-2.5 pr-1">
                  {block.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex items-start gap-3 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-zinc-200"
                    >
                      <span className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-amber-400 ring-4 ring-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      <span className="flex-1 font-medium">{formatInlineText(item)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-zinc-200 font-medium">
                  {formatInlineText(block.header)}
                </div>
              )}
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

              // Modern Bullet points: - text, * text, • text
              if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
                const bulletContent = trimmed.replace(/^[-•*]\s+/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-3 my-2 pr-1 text-xs sm:text-sm leading-relaxed">
                    <span className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-amber-500 ring-4 ring-amber-500/20 shadow-2xs" />
                    <span className="flex-1 font-medium text-slate-800 dark:text-zinc-200">
                      {formatInlineText(bulletContent)}
                    </span>
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
