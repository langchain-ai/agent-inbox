import { cn } from "@/lib/utils";
import Markdown, { Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export interface MarkdownTextProps extends Options {}

export function MarkdownText({ children, ...props }: MarkdownTextProps) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        pre: ({ node: _node, ...props }) => (
          <pre
            {...props}
            className="my-4 rounded-lg bg-muted p-4 text-wrap break-words whitespace-pre-wrap"
          />
        ),
        code: ({ node: _node, ...props }) => {
          const isInline = !props.className;
          return (
            <code
              {...props}
              className={
                isInline
                  ? "rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
                  : "block font-mono text-sm"
              }
            />
          );
        },
        details: ({ node: _node, ...props }) => (
          <details {...props} className="my-4 rounded-lg border p-4" />
        ),
        summary: ({ node: _node, ...props }) => (
          <summary {...props} className="cursor-pointer font-medium" />
        ),
        h1: ({ node: _node, ...props }) => (
          <h1
            {...props}
            className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4"
          />
        ),
        h2: ({ node: _node, ...props }) => (
          <h2
            {...props}
            className="scroll-m-20 text-3xl font-semibold tracking-tight mb-3"
          />
        ),
        h3: ({ node: _node, ...props }) => (
          <h3
            {...props}
            className="scroll-m-20 text-2xl font-semibold tracking-tight mb-2"
          />
        ),
        h4: ({ node: _node, ...props }) => (
          <h4
            {...props}
            className="scroll-m-20 text-xl font-semibold tracking-tight mb-2"
          />
        ),
        h5: ({ node: _node, ...props }) => (
          <h5
            {...props}
            className="scroll-m-20 text-lg font-semibold tracking-tight mb-2"
          />
        ),
        h6: ({ node: _node, ...props }) => (
          <h6
            {...props}
            className="scroll-m-20 text-base font-semibold tracking-tight mb-2"
          />
        ),
        ul: ({ node: _node, ...props }) => (
          <ul {...props} className="my-6 ml-6 list-disc [&>li]:mt-2" />
        ),
        ol: ({ node: _node, ...props }) => (
          <ol {...props} className="my-6 ml-6 list-decimal [&>li]:mt-2" />
        ),
        li: ({ node: _node, ...props }) => <li {...props} className="ml-4" />,
        a: ({ node: _node, className, ...props }) => (
          <a
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "font-medium underline underline-offset-4 break-all",
              className
            )}
            {...props}
          />
        ),
      }}
      {...props}
    >
      {children}
    </Markdown>
  );
}
