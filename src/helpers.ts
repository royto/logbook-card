export function addSlashes(myString: string): string {
  return myString
    .replace(/\\/g, '\\\\')
    .replace(/\u0008/g, '\\b')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\f/g, '\\f')
    .replace(/\r/g, '\\r')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

/**
 * RegExp-escapes all characters in the given string.
 */
function regExpEscape(s: string): string {
  return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

// From https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f by donmccurdy
/**
 * Creates a RegExp from the given string, converting asterisks to .* expressions,
 * and escaping all other characters.
 */
export function wildcardToRegExp(s: string): RegExp {
  return new RegExp(
    '^' +
      s
        .split(/\*+/)
        .map(x => regExpEscape(x))
        .join('.*') +
      '$',
  );
}
