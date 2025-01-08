import { Thread, ThreadState } from "@langchain/langgraph-sdk";
import { HumanInterrupt, ThreadData } from "../types";

// TODO: Delete this once interrupt issue fixed.
export const tmpCleanInterrupts = (interrupts: Record<string, any[]>) => {
  return Object.fromEntries(
    Object.entries(interrupts).map(([k, v]) => {
      if (Array.isArray(v[0] && v[0]?.[1])) {
        return [k, v?.[0][1]];
      }
      return [k, v];
    })
  );
};

export function getInterruptFromThread(
  thread: Thread
): HumanInterrupt[] | undefined {
  if (thread.interrupts && Object.values(thread.interrupts).length > 0) {
    return Object.values(thread.interrupts).flatMap((interrupt) => {
      if (Array.isArray(interrupt[0])) {
        if (!interrupt[0]?.[1]) {
          throw new Error("Interrupt is an array but has no value");
        }
        return interrupt[0][1].value as HumanInterrupt;
      } else {
        return interrupt.flatMap((i) => i.value as HumanInterrupt);
      }
    });
    // return Object.values(thread.interrupts).flatMap((interrupt) =>
    //   interrupt.flatMap((i) => i.value as HumanInterrupt)
    // );
  }
  return undefined;
}

export function processInterruptedThread<
  ThreadValues extends Record<string, any>,
>(thread: Thread<ThreadValues>): ThreadData<ThreadValues> | undefined {
  const interrupts = getInterruptFromThread(thread);
  if (interrupts) {
    return {
      thread,
      interrupts,
      status: "interrupted",
    };
  }
  return undefined;
}

export function processThreadWithoutInterrupts<
  ThreadValues extends Record<string, any>,
>(
  thread: Thread<ThreadValues>,
  state: { thread_state: ThreadState<ThreadValues>; thread_id: string }
): ThreadData<ThreadValues> {
  const lastTask =
    state.thread_state.tasks[state.thread_state.tasks.length - 1];
  const lastInterrupt = lastTask.interrupts[lastTask.interrupts.length - 1];

  if (!lastInterrupt || !("value" in lastInterrupt)) {
    return {
      status: "interrupted",
      thread,
      interrupts: undefined,
    };
  }

  return {
    status: "interrupted",
    thread,
    interrupts: lastInterrupt.value as HumanInterrupt[],
  };
}
