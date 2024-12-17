import React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Button } from "./button"; // Assuming Button is in the same directory

interface HelpCardProps {
  content: React.ReactNode;
  buttonText?: string;
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string; // For additional custom styling
}

export const HelpCard: React.FC<HelpCardProps> = ({
  content,
  buttonText = "?",
  buttonSize = "icon",
  buttonVariant = "link",
  className = "",
}) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize} className={`text-base ${className}`}>
          {buttonText}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="text-sm">
        {content}
      </HoverCardContent>
    </HoverCard>
  );
};