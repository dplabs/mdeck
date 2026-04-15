// Token types
export interface TextToken { type: 'text'; text: string }
export interface CodeToken { type: 'code'; text: string }
export interface FencesToken { type: 'fences'; text: string }
export interface DefToken { type: 'def'; id: string; href: string; title: string | undefined }
export interface MacroToken { type: 'macro'; name: string; args: string[]; obj: string | undefined }
export interface SeparatorToken { type: 'separator'; text: string }
export interface NotesSeparatorToken { type: 'notes_separator'; text: string }
export interface ContentStartToken { type: 'content_start'; classes: string[]; block: boolean }
export interface ContentEndToken { type: 'content_end'; block: boolean }

export type Token = TextToken | CodeToken | FencesToken | DefToken | MacroToken
  | SeparatorToken | NotesSeparatorToken | ContentStartToken | ContentEndToken;

const CODE = 1, INLINE_CODE = 2, CONTENT = 3, FENCES = 4, DEF = 5,
      DEF_HREF = 6, DEF_TITLE = 7, MACRO = 8, MACRO_ARGS = 9,
      MACRO_OBJ = 10, SLIDE_SEPARATOR = 11, FRAGMENT_SEPARATOR = 12, NOTES_SEPARATOR = 13;

const regexByName: Record<string, RegExp> = {
  CODE: /(?:^|\n\n)( {4}[^\n]+\n*)+/,
  INLINE_CODE: /`([^`].*?)`/,
  CONTENT: /(?:\\)?((?:\.[a-zA-Z_\-][a-zA-Z\-_0-9]*)+)\[/,
  FENCES: new RegExp('(?:^|\\n) *(`{3,}|~{3,}) *(?:\\S+)? *\\n(?:[\\s\\S]+?)\\s*\\1 *(?:\\n+|$)'),
  DEF: /(?:^|\n) *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  MACRO: /!\[:([^\] ]+)([^\]]*)\](?:\(([^\)]*)\))?/,
  SLIDE_SEPARATOR: /(?:^|\n)(---|<!--\s*break\s*-->)(?:\n|$)/,
  FRAGMENT_SEPARATOR: /(?:^|\n)(--)(?![^\n])/,
  NOTES_SEPARATOR: /(?:^|\n)(\?{3})(?:\n|$)/,
};

function replace(regex: RegExp, replacements: Record<string, RegExp>): RegExp {
  return new RegExp(regex.source.replace(/\w{2,}/g, (key) => {
    return replacements[key]?.source ?? key;
  }));
}

const blockRegex = replace(/CODE|INLINE_CODE|CONTENT|FENCES|DEF|MACRO|SLIDE_SEPARATOR|FRAGMENT_SEPARATOR|NOTES_SEPARATOR/, regexByName);
const inlineRegex = replace(/CODE|INLINE_CODE|CONTENT|FENCES|DEF|MACRO/, regexByName);

export class Lexer {
  lex(src: string): Token[] {
    const tokens = lexTokens(src.replace('\r', ''), blockRegex);
    for (let i = tokens.length - 2; i >= 0; i--) {
      if (tokens[i].type === 'text' && tokens[i + 1].type === 'text') {
        (tokens[i] as TextToken).text += (tokens[i + 1] as TextToken).text;
        tokens.splice(i + 1, 1);
      }
    }
    return tokens;
  }
}

function lexTokens(src: string, regex: RegExp, tokens: Token[] = []): Token[] {
  let cap: RegExpExecArray | null;

  while ((cap = regex.exec(src)) !== null) {
    if (cap.index > 0) {
      tokens.push({ type: 'text', text: src.substring(0, cap.index) });
    }

    if (cap[CODE]) {
      tokens.push({ type: 'code', text: cap[0] });
    } else if (cap[INLINE_CODE]) {
      tokens.push({ type: 'text', text: cap[0] });
    } else if (cap[FENCES]) {
      tokens.push({ type: 'fences', text: cap[0] });
    } else if (cap[DEF]) {
      tokens.push({ type: 'def', id: cap[DEF].toLowerCase(), href: cap[DEF_HREF], title: cap[DEF_TITLE] });
    } else if (cap[MACRO]) {
      tokens.push({
        type: 'macro',
        name: cap[MACRO],
        args: (cap[MACRO_ARGS] || '').split(',').map(trim),
        obj: cap[MACRO_OBJ] || undefined,
      });
    } else if (cap[SLIDE_SEPARATOR] || cap[FRAGMENT_SEPARATOR]) {
      tokens.push({ type: 'separator', text: cap[SLIDE_SEPARATOR] || cap[FRAGMENT_SEPARATOR] });
    } else if (cap[NOTES_SEPARATOR]) {
      tokens.push({ type: 'notes_separator', text: cap[NOTES_SEPARATOR] });
    } else if (cap[CONTENT]) {
      const text = getTextInBrackets(src, cap.index + cap[0].length);
      if (text !== undefined) {
        src = src.substring(text.length + 1);
        if (cap[0][0] !== '\\') {
          tokens.push({ type: 'content_start', classes: cap[CONTENT].substring(1).split('.'), block: text.indexOf('\n') !== -1 });
          lexTokens(text, inlineRegex, tokens);
          tokens.push({ type: 'content_end', block: text.indexOf('\n') !== -1 });
        } else {
          tokens.push({ type: 'text', text: cap[0].substring(1) + text + ']' });
        }
      } else {
        tokens.push({ type: 'text', text: cap[0] });
      }
    }

    src = src.substring(cap.index + cap[0].length);
  }

  if (src || (!src && tokens.length === 0)) {
    tokens.push({ type: 'text', text: src });
  }

  return tokens;
}

function trim(text: string): string {
  return typeof text === 'string' ? text.trim() : text;
}

function getTextInBrackets(src: string, offset: number): string | undefined {
  let depth = 1, pos = offset;
  while (depth > 0 && pos < src.length) {
    const chr = src[pos++];
    depth += (chr === '[' ? 1 : chr === ']' ? -1 : 0);
  }
  if (depth === 0) {
    return src.substr(offset, pos - offset - 1);
  }
  return undefined;
}
