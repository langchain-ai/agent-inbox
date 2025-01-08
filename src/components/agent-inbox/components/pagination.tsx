import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useThreadsContext } from "../contexts/ThreadContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryParams } from "../hooks/use-query-params";
import { ThreadStatusWithAll } from "../types";
import { useToast } from "@/hooks/use-toast";
import { INBOX_PARAM, LIMIT_PARAM, OFFSET_PARAM } from "../constants";

function DisplayLimitSelect() {
  const { searchParams, updateQueryParams } = useQueryParams();
  const { loading } = useThreadsContext();
  const fetchLimitOptions = ["10", "25", "50", "100"];
  const fetchLimitParam = Number(searchParams.get(LIMIT_PARAM) || 10);

  return (
    <Select
      disabled={loading}
      value={fetchLimitParam.toString()}
      onValueChange={async (v) => {
        updateQueryParams(LIMIT_PARAM, v);
      }}
    >
      <SelectTrigger className="w-[180px] h-8">
        <SelectValue>{fetchLimitParam}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Display Limit</SelectLabel>
          {fetchLimitOptions.map((option) => (
            <SelectItem key={`fetch-limit-${option}`} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function Pagination() {
  const { searchParams, getSearchParam, updateQueryParams } = useQueryParams();
  const { toast } = useToast();
  const { hasMoreThreads, loading } = useThreadsContext();

  const isPreviousDisabled =
    Number(searchParams.get(OFFSET_PARAM) || 0) === 0 || loading;
  const isNextDisabled = !hasMoreThreads || loading;

  const handleClickNext = async () => {
    const selectedInbox = getSearchParam(INBOX_PARAM) as
      | ThreadStatusWithAll
      | undefined;
    if (!selectedInbox) {
      toast({
        title: "Error",
        description: "No inbox selected",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const offsetParam = Number(searchParams.get(OFFSET_PARAM) || 0);
    const fetchLimitParam = Number(searchParams.get(LIMIT_PARAM) || 10);
    const newOffset = offsetParam + fetchLimitParam;
    updateQueryParams(OFFSET_PARAM, newOffset.toString());
  };

  const handleClickPrevious = async () => {
    const selectedInbox = getSearchParam(INBOX_PARAM) as
      | ThreadStatusWithAll
      | undefined;
    if (!selectedInbox) {
      toast({
        title: "Error",
        description: "No inbox selected",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const offsetParam = Number(getSearchParam(OFFSET_PARAM) || 0);
    const fetchLimitParam = Number(getSearchParam(LIMIT_PARAM) || 10);
    const newOffset = Math.max(offsetParam - fetchLimitParam, 0);
    updateQueryParams(OFFSET_PARAM, newOffset.toString());
  };

  return (
    <div className="flex gap-2 items-center">
      <DisplayLimitSelect />
      <div className="flex gap-1 items-center">
        <Button
          size="sm"
          className="flex gap-1 items-center"
          variant="outline"
          disabled={isPreviousDisabled}
          onClick={handleClickPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>
        <Button
          size="sm"
          className="flex gap-1 items-center"
          variant="outline"
          disabled={isNextDisabled}
          onClick={handleClickNext}
        >
          <ChevronRight className="w-4 h-4" />
          <span>Next</span>
        </Button>
      </div>
    </div>
  );
}
