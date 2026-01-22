"use client";

import { cn } from "@/lib/utils";
import { FileText, X } from "lucide-react";
import { documentIconClassName } from "@/components/ui/document-style";

type DocumentChipProps = {
  name: string;
  href?: string;
  onOpen?: () => void;
  onDelete?: () => void;
  className?: string;
  disabled?: boolean;
};

export function DocumentChip({ name, href, onOpen, onDelete, className, disabled }: DocumentChipProps) {
  const displayName = String(name || "Documento");
  const interactive = !!href || !!onOpen;

  const content = (
    <div className="flex items-center gap-2 min-w-0">
      <FileText className={cn(documentIconClassName, "text-muted-foreground flex-shrink-0")} />
      <span className="text-sm font-medium text-foreground truncate" title={displayName}>
        {displayName}
      </span>
    </div>
  );

  return (
    <div
      className={cn(
        "group inline-flex w-full min-w-0 shrink items-center gap-2 overflow-hidden rounded-md border border-border bg-muted/40 px-3 py-2 shadow-sm max-w-full",
        disabled ? "opacity-60 pointer-events-none" : "",
        className
      )}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("min-w-0 flex-1", interactive ? "cursor-pointer" : "")}
        >
          {content}
        </a>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          disabled={disabled || !onOpen}
          className={cn("min-w-0 flex-1 text-left", interactive ? "cursor-pointer" : "")}
        >
          {content}
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          aria-label="Remover documento"
          title="Remover documento"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
