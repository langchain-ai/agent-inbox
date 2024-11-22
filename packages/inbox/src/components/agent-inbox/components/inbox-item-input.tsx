import { cn } from "@/lib/utils";
import { ActionRequest, HumanInterrupt, HumanResponseWithEdits } from "../types";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import { prettifyText } from "../utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface InboxItemInputProps {
  interruptValue: HumanInterrupt;
  humanResponse: HumanResponseWithEdits[];
  streaming: boolean;
  setHumanResponse: React.Dispatch<React.SetStateAction<HumanResponseWithEdits[]>>;
}

export function InboxItemInput({
  interruptValue,
  humanResponse,
  streaming,
  setHumanResponse,
}: InboxItemInputProps) {
  const defaultRows = React.useRef<Record<string, number>>({});

  let responseOptional = React.useCallback(() => {
    const containsResponse = humanResponse.find((r) => r.type === "response");
    if (!containsResponse) {
      // No response option found, so no response is even possible. Return false.
      return false;
    }
    const allowsOtherAction = humanResponse.some((r) => r.type !== "response");
    return allowsOtherAction;
  }, [humanResponse]);

  return (
    <div
      className={cn(
        "w-full flex flex-col items-start justify-start gap-2",
        "shadow-sm"
      )}
    >
      {!interruptValue.config.allow_edit && (
        <div className="flex flex-col gap-1 items-start justify-start mr-auto">
          {Object.entries(interruptValue.action_request.args).map(([k, v]) => {
            let value = "";
            if (["string", "number"].includes(typeof v)) {
              value = v as string;
            } else {
              value = JSON.stringify(v, null);
            }

            return (
              <div
                key={`args-${k}`}
                className="p-2 rounded-lg items-center justify-start w-full bg-gray-50 border-[1px] border-gray-300"
              >
                <p className="text-sm text-gray-600 flex gap-1">
                  <strong>{prettifyText(k)}: </strong>
                  <Markdown remarkPlugins={[remarkGfm]}>{value}</Markdown>
                </p>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-2 items-start w-full">
        {humanResponse.map((response, idx) => (
          <div
            className="flex flex-col gap-1 items-start w-full"
            key={`human-res-${response.type}-${idx}`}
          >
            {typeof response.args === "object" && response.args && (
              <>
                {Object.entries(response.args.args).map(([k, v], idx) => {
                  const value = ["string", "number"].includes(typeof v)
                    ? v
                    : JSON.stringify(v, null);
                  // Calculate the default number of rows by the total length of the initial value divided by 30
                  // or 8, whichever is greater. Stored in a ref to prevent re-rendering.
                  if (
                    defaultRows.current[
                      k as keyof typeof defaultRows.current
                    ] === undefined
                  ) {
                    defaultRows.current[k as keyof typeof defaultRows.current] =
                      !v.length ? 3 : Math.max(v.length / 30, 7);
                  }
                  const numRows =
                    defaultRows.current[
                      k as keyof typeof defaultRows.current
                    ] || 8;

                  return (
                    <div
                      className="flex flex-col gap-1 items-start w-full h-full"
                      key={`allow-edit-args--${k}-${idx}`}
                    >
                      <p className="text-sm min-w-fit font-medium">{prettifyText(k)}: </p>
                      <Textarea
                        disabled={streaming}
                        className="h-full"
                        value={value}
                        onChange={(e) => {
                          setHumanResponse((prev) => {
                            if (
                              typeof response.args !== "object" ||
                              !response.args
                            ) {
                              console.error(
                                "Mismatched response type",
                                !!response.args,
                                typeof response.args
                              );
                              return prev;
                            }

                            const newEdit: HumanResponseWithEdits = {
                              type: response.type,
                              args: {
                                action: response.args.action,
                                args: {
                                  ...response.args.args,
                                  [k]: e.target.value,
                                },
                              },
                            };
                            if (
                              prev.find(
                                (p) =>
                                  p.type === response.type &&
                                  typeof p.args === "object" &&
                                  p.args?.action ===
                                    (response.args as ActionRequest).action
                              )
                            ) {
                              return prev.map((p) => {
                                if (
                                  p.type === response.type &&
                                  typeof p.args === "object" &&
                                  p.args?.action ===
                                    (response.args as ActionRequest).action
                                ) {
                                  if (p.acceptAllowed) {
                                    return {
                                      ...newEdit,
                                      acceptAllowed: true,
                                      editsMade: true,
                                    }
                                  }
                                  return newEdit;
                                }
                                return p;
                              });
                            } else {
                              throw new Error("No human response found for object response");
                            }
                          });
                        }}
                        rows={numRows}
                      />
                    </div>
                  );
                })}
              </>
            )}
            {typeof response.args === "string" && (
              <div className="flex flex-col gap-1 items-start w-full border-t-[1px] border-gray-200 mt-3 pt-3">
                <p className="text-sm min-w-fit font-medium flex items-center">Response{responseOptional() && <span className="text-xs font-normal text-gray-600 ml-1">{" "}(optional)</span>}:</p>
                <Textarea
                  disabled={streaming}
                  value={response.args}
                  onChange={(e) => {
                    setHumanResponse((prev) => {
                      const newResponse: HumanResponseWithEdits = {
                        type: response.type,
                        args: e.target.value,
                      };

                      if (prev.find((p) => p.type === response.type)) {
                        return prev.map((p) => {
                          if (p.type === response.type) {
                            if (p.acceptAllowed) {
                              return {
                                ...newResponse,
                                acceptAllowed: true,
                                editsMade: true,
                              }
                            }
                            return newResponse;
                          }
                          return p;
                        });
                      } else {
                        throw new Error("No human response found for string response");
                      }
                    });
                  }}
                  rows={8}
                  placeholder="Your response here..."
                />
              </div>
            )}
            {/* TODO: Handle accept/ignore. This should be okay to leave for now since the email assistant is setup to set `accept`/`ignore` to true alongside `edit`. */}
          </div>
        ))}
      </div>
    </div>
  );
}
