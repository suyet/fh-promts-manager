import { diffLines } from "diff";

export type DiffPartType = "same" | "added" | "removed";

export interface DiffPart {
  type: DiffPartType;
  text: string;
}

export interface VersionDiff {
  historyLabel: string;
  latestLabel: string;
  parts: DiffPart[];
}

export const diffService = {
  compareHistoryToLatest(input: {
    historyLabel: string;
    latestLabel: string;
    historyContent: string;
    latestContent: string;
  }): VersionDiff {
    const parts = diffLines(input.historyContent, input.latestContent)
      .filter((part) => part.value.length > 0)
      .map<DiffPart>((part) => ({
        type: part.added ? "added" : part.removed ? "removed" : "same",
        text: part.value
      }));
    return {
      historyLabel: input.historyLabel,
      latestLabel: input.latestLabel,
      parts
    };
  }
};
