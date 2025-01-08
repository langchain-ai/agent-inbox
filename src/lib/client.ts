import { Client } from "@langchain/langgraph-sdk";

export const createClient = ({
  deploymentUrl,
  langchainApiKey,
}: {
  deploymentUrl: string;
  langchainApiKey: string;
}) => {
  return new Client({
    apiUrl: deploymentUrl,
    defaultHeaders: {
      "x-api-key": langchainApiKey,
    },
  });
};
