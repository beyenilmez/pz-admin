import { Highlight } from "@mantine/core";

interface OptionSearchHighlightProps {
  children: string;
  query?: string;
}

export function OptionSearchHighlight({
  children,
  query,
}: OptionSearchHighlightProps) {
  if (!query) return children;

  return (
    <Highlight component="span" highlight={query} inherit>
      {children}
    </Highlight>
  );
}
