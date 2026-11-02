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
 * Check if a line is a bullet point (- , • , * )
 */
function isBulletLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
}

/**
 * Check if a line represents the start of a Callout / Advisor Insight Card
 */
function isCalloutHeader(line: string): boolean {
  const trimmed = line.trim();
  const emojiPrefix = /^(💡|⭐|📌|🔑|🎯|⚡)/;
  if (emojiPrefix.test(trimmed)) {
    return true;
  }
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

    if (!line) {
      i++;
      continue;
    }

    // 1. Check if this line is the start of a Markdown table
    if (line.includes('|') && i + 1 < rawLines.length) {
      const nextLine = rawLines[i + 1].trim();
      const isSeparator = /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(nextLine);

      if (isSeparator) {
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
          return 'right' as const;
        });

        const rows: string[][] = [];
        i += 2;

        while (i < rawLines.length && rawLines[i].trim().includes('|')) {
          const rowData = parseRow(rawLines[i].trim());
          if (rowData.length > 0 && rowData.some((c) => c.length > 0)) {
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

    // 2. Check if this line is a Callout / Advisor Card Header
    // Only collects immediate bullet points so follow-up questions/paragraphs stay outside!
    if (isCalloutHeader(line)) {
      let icon = '💡';
      const emojiMatch = line.match(/^(💡|⭐|📌|🔑|🎯|⚡)/);
      if (emojiMatch) {
        icon = emojiMatch[1];
      }
      const cleanHeader = line.replace(/^(💡|⭐|📌|🔑|🎯|⚡)\s*/, '');
      const items: string[] = [];
      i++;

      while (i < rawLines.length) {
        const cur = rawLines[i].trim();
        if (!cur) {
          // Peek ahead: only continue callout if the next non-empty line is also a bullet
          let nextNonEmpty = i + 1;
          while (nextNonEmpty < rawLines.length && !rawLines[nextNonEmpty].trim()) {
            nextNonEmpty++;
          }
          if (nextNonEmpty < rawLines.length && isBulletLine(rawLines[nextNonEmpty])) {
            i = nextNonEmpty;
            continue;
          }
          break;
        }

        if (isBulletLine(cur)) {
          items.push(cur.replace(/^[-•*]\s+/, ''));
          i++;
        } else {
          // Stop callout as soon as a non-bullet line (e.g., numbered list or closing question) appears
          break;
        }
      }

      blocks.push({
        type: 'callout',
        icon,
        header: cleanHeader,
        items,
      });
      continue;
    }

    // 3. Collect normal lines until a table or callout header
    const normalLines: string[] = [];
    while (i < rawLines.length) {
      const cur = rawLines[i].trim();
      if (
        cur.includes('|') &&
        i + 1 < rawLines.length &&
        /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(rawLines[i + 1].trim())
      ) {
        break;
      }
      if (isCalloutHeader(cur)) {
        break;
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
    <div className="space-y-3 text-[13px] sm:text-sm leading-relaxed text-slate-800 dark:text-zinc-200 font-sans">
      {blocks.map((block, bIdx) => {
        // 1. Table Block: Mobile Mini-Cards + Desktop Full Table
        if (block.type === 'table') {
          return (
            <div key={`table_${bIdx}`} className="my-3">
              {/* Mobile View (sm:hidden): Clean Structured Cards (Zero vertical word wrapping!) */}
              <div className="space-y-2.5 sm:hidden">
                {block.rows.map((row, rIdx) => {
                  const primaryTitle = row[0] || '—';
                  const detailPairs = block.headers
                    .slice(1)
                    .map((h, idx) => ({ label: h, value: row[idx + 1] || '—' }))
                    .filter((pair) => pair.value && pair.value !== '—');

                  return (
                    <div
                      key={rIdx}
                      className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 p-3 shadow-2xs"
                    >
                      {/* Card Header: Index + Full Project Title */}
                      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-200/70 dark:border-zinc-800/80">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black">
                          {rIdx + 1}
                        </span>
                        <div className="font-black text-xs text-slate-900 dark:text-white leading-snug">
                          {formatInlineText(primaryTitle)}
                        </div>
                      </div>

                      {/* Specs Grid (2 columns on mobile so nothing wraps awkwardly) */}
                      <div className="grid grid-cols-2 gap-2">
                        {detailPairs.map((pair, pIdx) => {
                          const isPrice = /سعر|قسط|مقدم|price|down/i.test(pair.label);
                          return (
                            <div
                              key={pIdx}
                              className="flex flex-col rounded-lg bg-white/80 dark:bg-zinc-900/70 px-2.5 py-1.5 border border-slate-100 dark:border-zinc-800/60"
                            >
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-400">
                                {formatInlineText(pair.label)}
                              </span>
                              <span
                                className={`text-xs font-bold mt-0.5 ${
                                  isPrice
                                    ? 'text-amber-600 dark:text-amber-400 font-black'
                                    : 'text-slate-800 dark:text-zinc-200'
                                }`}
                              >
                                {formatInlineText(pair.value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View (hidden sm:block): Full Table */}
              <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/90 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-start text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-950/70">
                        {block.headers.map((h, hIdx) => (
                          <th
                            key={hIdx}
                            className="py-2.5 px-3.5 font-black text-slate-900 dark:text-amber-300 text-start whitespace-nowrap"
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
                          className="transition hover:bg-amber-500/5 dark:hover:bg-amber-500/5 odd:bg-transparent even:bg-slate-50/50 dark:even:bg-zinc-800/20"
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`py-2.5 px-3.5 font-medium text-slate-800 dark:text-zinc-200 ${
                                cIdx > 0 ? 'whitespace-nowrap' : ''
                              }`}
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
            </div>
          );
        }

        // 2. Callout / Broker Note Block (Sleek, Compact & Non-greedy)
        if (block.type === 'callout') {
          return (
            <div
              key={`callout_${bIdx}`}
              className="my-3 rounded-xl border border-amber-500/25 border-s-4 border-s-amber-500 bg-amber-500/[0.06] dark:bg-zinc-950/70 px-3.5 py-3 shadow-2xs"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm leading-none">{block.icon || '💡'}</span>
                <h4 className="font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                  {formatInlineText(block.header)}
                </h4>
              </div>

              {block.items.length > 0 && (
                <div className="space-y-1.5 pr-1">
                  {block.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex items-start gap-2 text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-zinc-200"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span className="flex-1">{formatInlineText(item)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // 3. Normal Block Lines
        return (
          <div key={`norm_${bIdx}`} className="space-y-2">
            {block.lines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (!trimmed) {
                return <div key={lIdx} className="h-1" />;
              }

              // Horizontal Rule
              if (trimmed === '---' || trimmed === '***') {
                return <hr key={lIdx} className="my-2.5 border-slate-200 dark:border-zinc-800" />;
              }

              // Blockquote: > text
              if (trimmed.startsWith('> ')) {
                const quoteContent = trimmed.replace(/^>\s*/, '');
                return (
                  <div
                    key={lIdx}
                    className="my-2 rounded-xl border-s-4 border-amber-500 bg-amber-500/10 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:bg-amber-500/10 dark:text-zinc-100"
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
                    className="mt-3.5 mb-1 flex items-center gap-2 text-xs sm:text-sm font-black text-slate-900 dark:text-white"
                  >
                    <span className="h-3.5 w-1 rounded-full bg-amber-500" />
                    <span>{formatInlineText(trimmed.replace('### ', ''))}</span>
                  </h3>
                );
              }

              // Header 2
              if (trimmed.startsWith('## ')) {
                return (
                  <h2
                    key={lIdx}
                    className="mt-4 mb-1.5 text-sm sm:text-base font-black text-amber-600 dark:text-amber-400"
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
                    className="mt-4 mb-2 text-base sm:text-lg font-black text-slate-900 dark:text-white"
                  >
                    {formatInlineText(trimmed.replace('# ', ''))}
                  </h1>
                );
              }

              // Numbered list: 1. text -> Clean pill row
              const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
              if (numMatch) {
                const [, num, itemContent] = numMatch;
                return (
                  <div
                    key={lIdx}
                    className="flex items-center gap-2.5 my-1.5 rounded-xl bg-slate-100/80 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-800 px-3 py-2 text-xs sm:text-[13px]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black">
                      {num}
                    </span>
                    <span className="flex-1 font-medium text-slate-800 dark:text-zinc-200">
                      {formatInlineText(itemContent)}
                    </span>
                  </div>
                );
              }

              // Bullet points: - text, * text, • text
              if (isBulletLine(trimmed)) {
                const bulletContent = trimmed.replace(/^[-•*]\s+/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 my-1.5 pr-1 text-xs sm:text-[13px] leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span className="flex-1 text-slate-700 dark:text-zinc-200">
                      {formatInlineText(bulletContent)}
                    </span>
                  </div>
                );
              }

              // Sub-prompt / introductory line ending with ':' (e.g. "عشان أرشحلك الأنسب بدقة، قولي:")
              if (trimmed.endsWith(':')) {
                return (
                  <p
                    key={lIdx}
                    className="mt-2.5 mb-1 font-bold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm"
                  >
                    {formatInlineText(trimmed)}
                  </p>
                );
              }

              // Standard paragraph
              return (
                <p key={lIdx} className="font-normal text-slate-700 dark:text-zinc-200 text-xs sm:text-[13.5px] leading-relaxed">
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
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
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

    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-slate-950 dark:text-white">
          {boldContent}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded-md bg-amber-500/10 px-1.5 py-0.5 font-mono text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/20"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
