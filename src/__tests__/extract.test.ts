import { describe, it } from "node:test";
import assert from "node:assert";
import { extractFacts, extractFromSummary, type ExtractedMemory } from "../hooks/extract.js";

describe("Memory Extraction", () => {
  describe("extractFacts", () => {
    it("should extract preferences", () => {
      const content = "I prefer using TypeScript over JavaScript for this project.";
      const facts = extractFacts(content);

      assert.ok(facts.length > 0);
      const preference = facts.find(f => f.type === "preference");
      assert.ok(preference);
      assert.ok(preference.content.includes("TypeScript"));
    });

    it("should extract decisions", () => {
      const content = "We decided to use React for the frontend.";
      const facts = extractFacts(content);

      assert.ok(facts.length > 0);
      const decision = facts.find(f => f.type === "decision");
      assert.ok(decision);
      assert.ok(decision.content.includes("React"));
    });

    it("should extract errors/solutions", () => {
      const content = "The build failed because of missing dependencies. Fixed by running npm install.";
      const facts = extractFacts(content);

      assert.ok(facts.length > 0);
      const error = facts.find(f => f.type === "error");
      assert.ok(error);
    });

    it("should extract people references", () => {
      const content = "Contact @john for questions about the API.";
      const facts = extractFacts(content);

      assert.ok(facts.length > 0);
      const person = facts.find(f => f.type === "person");
      assert.ok(person);
    });

    it("should deduplicate by title", () => {
      const content = "I prefer React. I prefer React for the UI.";
      const facts = extractFacts(content);

      // Should not have duplicate entries
      const uniqueTitles = new Set(facts.map(f => f.title));
      assert.strictEqual(facts.length, uniqueTitles.size);
    });
  });

  describe("extractFromSummary", () => {
    it("should extract decisions from summaries", () => {
      const summary = "Decided to use a microservices architecture for the backend.";
      const facts = extractFromSummary(summary);

      assert.ok(facts.length > 0);
      const decision = facts.find(f => f.type === "decision");
      assert.ok(decision);
    });

    it("should extract project facts", () => {
      const summary = "The project uses Docker for containerization.";
      const facts = extractFromSummary(summary);

      assert.ok(facts.length > 0);
      const fact = facts.find(f => f.type === "fact");
      assert.ok(fact);
    });
  });
});
