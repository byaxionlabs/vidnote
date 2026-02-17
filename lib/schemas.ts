import { z } from "zod";

// Schema for actionable points
export const actionablePointSchema = z.object({
    content: z.string().describe("The actionable insight or key takeaway"),
    category: z
        .enum(["action", "remember", "insight"])
        .describe(
            "Type of point: action (do something), remember (key fact), insight (aha moment)",
        ),
    timestamp: z
        .number()
        .optional()
        .describe("Timestamp in seconds where this point is discussed"),
});

export const actionablePointsSchema = z.object({
    points: z
        .array(actionablePointSchema)
        .describe("Array of actionable points extracted from the video"),
});

export type ActionablePoint = z.infer<typeof actionablePointSchema>;
export type ActionablePointsResult = z.infer<typeof actionablePointsSchema>;
