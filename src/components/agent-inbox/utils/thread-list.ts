import { ThreadData, ThreadStatusWithAll } from "../types";

export function filterThreadsForInbox<
  T extends Record<string, any> = Record<string, any>,
>(
  threadData: ThreadData<T>[],
  selectedInbox: ThreadStatusWithAll
): ThreadData<T>[] {
  return threadData.filter((t) => {
    if (selectedInbox === "all") return true;
    return t.status === selectedInbox;
  });
}

export function getAdjacentThreadId<
  T extends Record<string, any> = Record<string, any>,
>(
  threads: ThreadData<T>[],
  currentThreadId: string,
  direction: "prev" | "next"
): string | undefined {
  const index = threads.findIndex(
    (t) => t.thread.thread_id === currentThreadId
  );
  if (index === -1) return undefined;
  const nextIndex = direction === "prev" ? index - 1 : index + 1;
  return threads[nextIndex]?.thread.thread_id;
}
