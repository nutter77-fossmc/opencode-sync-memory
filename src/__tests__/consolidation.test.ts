import { describe, it } from "node:test";
import assert from "node:assert";
import { findDuplicates, isSimilarTitle } from "../consolidation.js";

describe("Consolidation Module", () => {
  describe("isSimilarTitle", () => {
    it("should detect exact matches", () => {
      assert.ok(isSimilarTitle("React Setup", "React Setup"));
    });

    it("should detect similar titles", () => {
      assert.ok(isSimilarTitle("React Configuration", "React Config"));
    });

    it("should detect case-insensitive matches", () => {
      assert.ok(isSimilarTitle("react setup", "React Setup"));
    });

    it("should detect one containing the other", () => {
      assert.ok(isSimilarTitle("React", "React Setup"));
    });

    it("should reject dissimilar titles", () => {
      assert.ok(!isSimilarTitle("React Setup", "Vue Configuration"));
    });
  });

  describe("findDuplicates", () => {
    it("should find duplicate memories", () => {
      const memories = [
        {
          path: "technical/react-setup.md",
          title: "React Setup",
          content: "How to set up React",
          tags: ["react"],
          created: "2024-01-01",
          modified: "2024-01-01",
          confidence: 0.8,
          importance: "medium" as const,
        },
        {
          path: "technical/react-configuration.md",
          title: "React Configuration",
          content: "How to configure React",
          tags: ["react"],
          created: "2024-01-02",
          modified: "2024-01-02",
          confidence: 0.9,
          importance: "high" as const,
        },
        {
          path: "technical/vue-setup.md",
          title: "Vue Setup",
          content: "How to set up Vue",
          tags: ["vue"],
          created: "2024-01-03",
          modified: "2024-01-03",
          confidence: 0.7,
          importance: "medium" as const,
        },
      ];

      const duplicates = findDuplicates(memories);

      // Should find one group of duplicates (React Setup + React Configuration)
      assert.strictEqual(duplicates.length, 1);
      assert.strictEqual(duplicates[0].length, 2);
    });

    it("should not find duplicates when none exist", () => {
      const memories = [
        {
          path: "technical/react-setup.md",
          title: "React Setup",
          content: "How to set up React",
          tags: ["react"],
          created: "2024-01-01",
          modified: "2024-01-01",
          confidence: 0.8,
          importance: "medium" as const,
        },
        {
          path: "technical/vue-setup.md",
          title: "Vue Setup",
          content: "How to set up Vue",
          tags: ["vue"],
          created: "2024-01-02",
          modified: "2024-01-02",
          confidence: 0.7,
          importance: "medium" as const,
        },
      ];

      const duplicates = findDuplicates(memories);

      assert.strictEqual(duplicates.length, 0);
    });
  });
});
