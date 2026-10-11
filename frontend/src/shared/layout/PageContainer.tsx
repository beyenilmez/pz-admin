import { Container, type ContainerProps } from "@mantine/core";

export type PageContentWidth = "fluid" | "narrow" | "standard" | "wide";

const containerSizes = {
  narrow: "sm",
  standard: "md",
  wide: "xl",
} as const;

interface PageContainerProps extends Omit<ContainerProps, "fluid" | "size"> {
  contentWidth?: PageContentWidth;
}

export function PageContainer({
  contentWidth = "standard",
  ...props
}: PageContainerProps) {
  return contentWidth === "fluid" ? (
    <Container fluid w="100%" {...props} />
  ) : (
    <Container size={containerSizes[contentWidth]} w="100%" {...props} />
  );
}
