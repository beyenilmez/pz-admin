function identifierTokens(identifier) {
  return [
    ...identifier.matchAll(/[A-Z]+(?=[A-Z][a-z]|\d|$)|[A-Z]?[a-z]+|\d+/g),
  ].map((match) => ({
    end: match.index + match[0].length,
    value: match[0],
  }));
}

function commonTokenPrefix(identifiers) {
  const tokenSets = identifiers.map(({ local }) => identifierTokens(local));
  const first = tokenSets[0];
  let count = 0;
  while (
    count < first.length &&
    tokenSets.every((tokens) => tokens[count]?.value === first[count].value)
  ) {
    count += 1;
  }
  if (count === 0) return null;

  return {
    end: first[count - 1].end,
    length: first
      .slice(0, count)
      .reduce((sum, token) => sum + token.value.length, 0),
  };
}

function splitId(id) {
  const separator = id.indexOf(".");
  return separator === -1
    ? { local: id, module: "" }
    : { local: id.slice(separator + 1), module: id.slice(0, separator) };
}

function related(left, right) {
  if (left.module !== right.module) return false;
  return (commonTokenPrefix([left, right])?.length ?? 0) >= 4;
}

function relatedGroups(ids) {
  const remaining = new Set(ids);
  const groups = [];

  while (remaining.size > 0) {
    const first = remaining.values().next().value;
    const group = [first];
    remaining.delete(first);

    for (let index = 0; index < group.length; index += 1) {
      for (const candidate of remaining) {
        if (!related(group[index], candidate)) continue;
        group.push(candidate);
        remaining.delete(candidate);
      }
    }

    if (group.length > 1) groups.push(group);
  }

  return groups;
}

function formatSuffix(suffix) {
  const formatted = suffix
    .replace(/[-_.]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return formatted.replace(/^\p{Ll}/u, (character) => character.toUpperCase());
}

// Adds ID-derived suffixes only to related items that share a display name.
export function disambiguateItemNames(entries) {
  const idsByName = new Map();
  for (const { id, name } of entries) {
    const ids = idsByName.get(name) ?? [];
    ids.push(id);
    idsByName.set(name, ids);
  }

  const names = new Map(entries.map(({ id, name }) => [id, name]));
  for (const [name, ids] of idsByName) {
    if (ids.length < 2) continue;

    const identifiers = ids.map((id) => ({ id, ...splitId(id) }));
    for (const group of relatedGroups(identifiers)) {
      const prefix = commonTokenPrefix(group);
      if (!prefix || prefix.length < 4) continue;

      for (const { id, local } of group) {
        const suffix = local.slice(prefix.end).replace(/^[-_.\s]+/, "");
        if (suffix) names.set(id, `${name} (${formatSuffix(suffix)})`);
      }
    }

    const renamedIdsByName = new Map();
    for (const id of ids) {
      const renamed = names.get(id);
      if (renamed === name) continue;
      const renamedIds = renamedIdsByName.get(renamed) ?? [];
      renamedIds.push(id);
      renamedIdsByName.set(renamed, renamedIds);
    }
    for (const renamedIds of renamedIdsByName.values()) {
      if (renamedIds.length < 2) continue;
      for (const id of renamedIds) names.set(id, name);
    }
  }

  return names;
}
