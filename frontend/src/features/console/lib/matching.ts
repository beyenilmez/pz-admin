interface MatchRange {
  end: number;
  start: number;
}

interface MatchResult {
  ranges: MatchRange[];
  rank: number;
}

export interface ConsoleSuggestionSegment {
  matched: boolean;
  start: number;
  text: string;
}

function orderedPartRanges(candidate: string, query: string) {
  const parts = query.split(/[.\s_-]+/u).filter(Boolean);
  if (parts.length < 2) return null;

  let position = 0;
  const ranges: MatchRange[] = [];
  for (const part of parts) {
    const match = candidate.indexOf(part, position);
    if (match === -1) return null;
    ranges.push({ start: match, end: match + part.length });
    position = match + part.length;
  }
  return ranges;
}

function matchCandidate(candidate: string, query: string): MatchResult | null {
  if (candidate.startsWith(query)) {
    return { rank: 0, ranges: [{ start: 0, end: query.length }] };
  }

  const substringStart = candidate.indexOf(query);
  if (substringStart !== -1) {
    return {
      rank: 1,
      ranges: [{ start: substringStart, end: substringStart + query.length }],
    };
  }

  const ranges = orderedPartRanges(candidate, query);
  return ranges ? { rank: 2, ranges } : null;
}

export function rankedConsoleSuggestions(
  candidates: readonly string[],
  query: string,
  limit: number,
) {
  const normalizedQuery = query.toLowerCase();
  const rankedMatches: string[][] = [[], [], []];
  for (const candidate of candidates) {
    const result = matchCandidate(candidate.toLowerCase(), normalizedQuery);
    if (result && rankedMatches[result.rank].length < limit) {
      rankedMatches[result.rank].push(candidate);
    }
  }
  return rankedMatches.flat().slice(0, limit);
}

export function consoleSuggestionSegments(
  suggestion: string,
  query: string,
): ConsoleSuggestionSegment[] {
  if (!query) return [{ matched: false, start: 0, text: suggestion }];

  const result = matchCandidate(suggestion.toLowerCase(), query.toLowerCase());
  if (!result) return [{ matched: false, start: 0, text: suggestion }];

  const segments: ConsoleSuggestionSegment[] = [];
  let position = 0;
  for (const range of result.ranges) {
    if (range.start > position) {
      segments.push({
        matched: false,
        start: position,
        text: suggestion.slice(position, range.start),
      });
    }
    segments.push({
      matched: true,
      start: range.start,
      text: suggestion.slice(range.start, range.end),
    });
    position = range.end;
  }
  if (position < suggestion.length) {
    segments.push({
      matched: false,
      start: position,
      text: suggestion.slice(position),
    });
  }
  return segments;
}
