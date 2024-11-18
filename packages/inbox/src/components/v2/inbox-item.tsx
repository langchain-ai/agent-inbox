import { cn } from "@/lib/utils";
import { HumanInterrupt } from "./types";
import { Textarea } from "../ui/textarea";
import React from "react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ThreadInterruptData } from "../inbox/types";
import { Input } from "../ui/input";
import { prettifyText } from "./utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { InboxItemStatuses } from "./components/statuses";

interface InboxItemInputProps {
  actionColor: { bg: string; border: string };
  interruptValue: HumanInterrupt;
  actionLetter: string;
}

function InboxItemInput({
  actionColor,
  interruptValue,
  actionLetter,
}: InboxItemInputProps) {
  const [value, setValue] = React.useState("");
  const [args, setArgs] = React.useState<Record<string, string>>(
    interruptValue.action_request.args
  );

  return (
    <div
      className={cn(
        "w-full p-3 flex flex-row items-start justify-start gap-4",
        "rounded-lg border-[1px] border-gray-100 shadow-sm"
      )}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] leading-3"
        style={{
          backgroundColor: actionColor.bg,
          borderWidth: "1px",
          borderColor: actionColor.border,
        }}
      >
        {actionLetter}
      </div>
      <div className="flex flex-col gap-2 items-start w-full">
        <div className="flex flex-col gap-1 items-start justify-start mr-auto">
          {Object.entries(interruptValue.action_request.args).map(([k, v]) => (
            <div
              key={`args-${k}`}
              className="p-2 rounded-lg items-center justify-start w-full bg-gray-50 border-[1px] border-gray-300"
            >
              <p className="text-sm text-gray-600">
                <strong>{prettifyText(k)}: </strong>
                {typeof v === "string" ? v : JSON.stringify(v, null)}
              </p>
            </div>
          ))}
        </div>
        {interruptValue.description && (
          <p className="text-sm font-medium">{interruptValue.description}</p>
        )}
        {interruptValue.config.allow_respond && (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            placeholder="Your response here..."
            className="w-full"
          />
        )}
        {interruptValue.config.allow_edit && (
          <div className="flex flex-col gap-2 items-start w-full">
            {Object.entries(interruptValue.action_request.args).map(
              ([k, v]) => (
                <div
                  className="flex gap-1 items-center justify-start"
                  key={`allow-edit-args-${k}`}
                >
                  <strong>{prettifyText(k)}: </strong>
                  <Input
                    value={args[k]}
                    onChange={(e) => setArgs({ ...args, [k]: e.target.value })}
                    className="w-full"
                  />
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface InboxItemProps {
  interruptData: ThreadInterruptData;
  threadContextRenderer?: React.ReactNode;
}

export function InboxItem({ interruptData }: InboxItemProps) {
  const { interrupt_value } = interruptData;
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [active, setActive] = React.useState(false);
  const actionTypeColorMap = {
    question: { bg: "#FCA5A5", border: "#EF4444" },
    notify: { bg: "#93C5FD", border: "#3B82F6" },
  };
  const actionType = interrupt_value[0].action_request.action;
  const actionColor =
    actionType.toLowerCase() in actionTypeColorMap
      ? actionTypeColorMap[
          actionType.toLowerCase() as keyof typeof actionTypeColorMap
        ]
      : { bg: "#FDBA74", border: "#F97316" };
  const actionLetter = actionType.slice(0, 1).toUpperCase();

  const isActionRequired = interrupt_value.some(
    (v) =>
      v.config.allow_respond || v.config.allow_accept || v.config.allow_edit
  );
  const isDone = interrupt_value.some(
    (v) => v.action_request.action.toLowerCase() === "notify"
  );
  const isIgnoreAllowed = interrupt_value.every((v) => v.config.allow_ignore);

  const updateQueryParam = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleToggleViewState = () => {
    const threadId = interruptData.thread_id;
    updateQueryParam("view_state_thread_id", threadId);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 items-start justify-start",
        "rounded-xl border-[1px] ",
        "p-6 w-[675px] min-h-[50px]",
        active ? "border-gray-200 shadow-md" : "border-gray-200/75"
      )}
    >
      <motion.span
        onClick={() => {
          if (!active) {
            setActive(true);
          }
        }}
        animate={{ marginBottom: active ? "0px" : "0px" }}
        className={cn(
          "flex flex-col gap-3 items-center justify-start w-full",
          !active && "cursor-pointer"
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-full flex items-center justify-start gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
              style={{
                backgroundColor: actionColor.bg,
                borderWidth: "1px",
                borderColor: actionColor.border,
              }}
            >
              {actionLetter}
            </div>
            <p className="font-semibold">
              {prettifyText(interrupt_value[0].action_request.action)}
            </p>
          </div>
          <InboxItemStatuses config={interrupt_value[0].config} />
        </div>

        {interrupt_value[0].description && (
          <p className="text-sm text-gray-500 mr-auto">
            <strong>Agent Response: </strong>
            {interrupt_value[0].description}
          </p>
        )}
      </motion.span>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6 items-start w-full overflow-hidden"
          >
            <div className="flex flex-col gap-4 items-start w-full">
              {interrupt_value.map((value, idx) => (
                <InboxItemInput
                  key={`inbox-item-input-${idx}`}
                  actionColor={actionColor}
                  actionLetter={actionLetter}
                  interruptValue={value}
                />
              ))}
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2 items-center justify-start">
                <p
                  onClick={() => handleToggleViewState()}
                  className="text-gray-700 hover:text-black transition-colors ease-in-out font-medium underline underline-offset-2 cursor-pointer"
                >
                  View State
                </p>
              </div>
              <div className="flex gap-2 items-center justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActive(false);
                    const currQueryParamThreadId = searchParams.get(
                      "view_state_thread_id"
                    );
                    if (currQueryParamThreadId === interruptData.thread_id) {
                      updateQueryParam("view_state_thread_id", "");
                    }
                  }}
                >
                  Close
                </Button>
                {isIgnoreAllowed && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // TODO: HANDLE IGNORE
                      setActive(false);
                    }}
                    className="border-red-500 text-red-500 hover:text-red-600"
                  >
                    Ignore
                  </Button>
                )}
                <Button
                  variant="default"
                  onClick={() => {
                    // TODO: HANDLE SUBMIT
                    toast({
                      title: "Success",
                      description: "Response submitted successfully.",
                      duration: 5000,
                    });
                    setActive(false);
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
