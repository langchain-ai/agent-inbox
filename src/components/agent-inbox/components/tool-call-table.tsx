import { ToolCall } from "@langchain/core/messages/tool";
import { unknownToPrettyDate } from "../utils";

export function ToolCallTable({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="min-w-[300px] max-w-full border rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left px-2 py-0 bg-gray-100 text-sm" colSpan={2}>
              {toolCall.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(toolCall.args).map(([key, value]) => {
            let valueStr = "";
            if (["string", "number"].includes(typeof value)) {
              valueStr = value.toString();
            }

            const date = unknownToPrettyDate(value);
            if (date) {
              valueStr = date;
            }

            try {
              valueStr = valueStr || JSON.stringify(value, null);
            } catch (_) {
              // failed to stringify, just assign an empty string
              valueStr = "";
            }

            return (
              <tr key={key} className="border-t">
                <td className="px-2 py-1 font-medium w-1/3 text-xs">{key}</td>
                <td className="px-2 py-1 font-mono text-xs">{valueStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
