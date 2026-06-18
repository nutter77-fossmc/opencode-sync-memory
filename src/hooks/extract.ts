import type { Shell } from "../types";
import { saveMemory } from "../storage";
import { ensureDailyNote, appendToDailyNote } from "../tiers/daily";
import { getHostname } from "../machine";
import { commitAll, rebasePull, push, hasRemote, getRemoteUrl } from "../git";

let captureBuffer: string[] = [];

export function bufferActivity(summary: string): void {
  captureBuffer.push(summary);
  if (captureBuffer.length > 20) {
    captureBuffer = captureBuffer.slice(-10);
  }
}

export async function flushCaptureBuffer(
  $: Shell,
  sessionId: string,
  remoteUrl?: string,
): Promise<void> {
  if (captureBuffer.length === 0) return;

  const date = new Date().toISOString().slice(0, 10);
  const hostname = getHostname();
  const summary = captureBuffer.join("\n");

  await appendToDailyNote(
    $,
    "Activity Summary",
    `\n${summary}\n`,
  );

  captureBuffer = [];
}

// NEW: Extract structured memories from text
export interface ExtractedMemory {
  type: "preference" | "decision" | "fact" | "error" | "person";
  title: string;
  content: string;
  confidence: number;
  tags: string[];
  importance: "low" | "medium" | "high";
}

export function extractFacts(content: string): ExtractedMemory[] {
  const facts: ExtractedMemory[] = [];
  
  // Patterns for preferences
  const prefPatterns = [
    /(?:I|we)\s+(?:prefer|like|use|want|need)\s+(.+?)(?:\.|,|;|$)/gi,
    /(?:my|our)\s+(?:preferred|favorite|default)\s+(?:is|are)\s+(.+?)(?:\.|,|;|$)/gi,
    /(?:always|never)\s+(?:use|do)\s+(.+?)(?:\.|,|;|$)/gi,
  ];
  
  for (const pattern of prefPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      facts.push({
        type: "preference",
        title: match[0].slice(0, 100),
        content: match[0],
        confidence: 0.7,
        tags: extractTags(match[0]),
        importance: "medium",
      });
    }
  }
  
  // Patterns for decisions
  const decPatterns = [
    /(?:we\s+decided|let's|going\s+with|chosen|selected)\s+(?:to\s+)?(.+?)(?:\.|,|;|$)/gi,
    /(?:decision|chose|selected)\s*:\s*(.+?)(?:\.|,|;|$)/gi,
    /(?:will|shall)\s+(?:use|implement|adopt)\s+(.+?)(?:\.|,|;|$)/gi,
  ];
  
  for (const pattern of decPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      facts.push({
        type: "decision",
        title: match[0].slice(0, 100),
        content: match[0],
        confidence: 0.8,
        tags: extractTags(match[0]),
        importance: "high",
      });
    }
  }
  
  // Patterns for errors/solutions
  const errPatterns = [
    /(?:failed|error|bug|issue)\s+(?:because|due to|with|in)\s+(.+?)(?:\.|,|;|$)/gi,
    /(?:fixed|solved|resolved)\s+(?:by|with|using)\s+(.+?)(?:\.|,|;|$)/gi,
    /(?:workaround|solution|fix)\s*:\s*(.+?)(?:\.|,|;|$)/gi,
  ];
  
  for (const pattern of errPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      facts.push({
        type: "error",
        title: match[0].slice(0, 100),
        content: match[0],
        confidence: 0.6,
        tags: extractTags(match[0]),
        importance: "medium",
      });
    }
  }
  
  // Patterns for people
  const peoplePatterns = [
    /(?:@|contact|email|reach)\s+(.+?)\s+(?:for|regarding|about)\s+(.+?)(?:\.|,|;|$)/gi,
    /(.+?)\s+(?:is|are)\s+(?:responsible|in charge|lead)\s+(?:for|of)\s+(.+?)(?:\.|,|;|$)/gi,
  ];
  
  for (const pattern of peoplePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      facts.push({
        type: "person",
        title: match[0].slice(0, 100),
        content: match[0],
        confidence: 0.7,
        tags: extractTags(match[0]),
        importance: "medium",
      });
    }
  }
  
  // Deduplicate by title
  const seen = new Set<string>();
  return facts.filter(f => {
    const key = f.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const techKeywords = [
    "react", "vue", "angular", "node", "python", "rust", "go", "typescript",
    "javascript", "docker", "kubernetes", "aws", "azure", "git", "npm", "yarn",
    "pnpm", "bun", "deno", "fastapi", "express", "next", "nuxt", "svelte",
  ];
  
  const lowerText = text.toLowerCase();
  for (const keyword of techKeywords) {
    if (lowerText.includes(keyword)) {
      tags.push(keyword);
    }
  }
  
  return tags;
}

// NEW: Extract from compaction summaries
export function extractFromSummary(summary: string): ExtractedMemory[] {
  const facts: ExtractedMemory[] = [];
  
  // Look for key decisions in summaries
  const decisionPatterns = [
    /(?:decided|chosen|selected|adopted)\s+(?:to\s+)?(.+?)(?:\.|,|;|$)/gi,
    /(?:architecture|design|pattern)\s*:\s*(.+?)(?:\.|,|;|$)/gi,
  ];
  
  for (const pattern of decisionPatterns) {
    let match;
    while ((match = pattern.exec(summary)) !== null) {
      facts.push({
        type: "decision",
        title: `Architecture: ${match[0].slice(0, 80)}`,
        content: match[0],
        confidence: 0.9,
        tags: ["architecture", ...extractTags(match[0])],
        importance: "high",
      });
    }
  }
  
  // Look for key facts
  const factPatterns = [
    /(?:uses?|using|employs?)\s+(.+?)(?:\.|,|;|$)/gi,
    /(?:project|codebase|repo)\s+(?:uses?|has)\s+(.+?)(?:\.|,|;|$)/gi,
  ];
  
  for (const pattern of factPatterns) {
    let match;
    while ((match = pattern.exec(summary)) !== null) {
      facts.push({
        type: "fact",
        title: `Project fact: ${match[0].slice(0, 80)}`,
        content: match[0],
        confidence: 0.8,
        tags: ["project", ...extractTags(match[0])],
        importance: "medium",
      });
    }
  }
  
  return facts;
}

// NEW: Auto-save extracted memories
export async function saveExtractedMemory(
  $: Shell,
  memory: ExtractedMemory,
  project?: string,
): Promise<void> {
  const category = memoryToCategory(memory.type);
  const title = memory.title.slice(0, 100);
  
  await saveMemory(category, title, memory.content, {
    tags: memory.tags.join(", "),
    importance: memory.importance,
    source: "auto-extract",
    project,
  });
}

function memoryToCategory(type: ExtractedMemory["type"]): string {
  const map: Record<ExtractedMemory["type"], string> = {
    preference: "preferences",
    decision: "technical",
    fact: "technical",
    error: "technical",
    person: "people",
  };
  return map[type] || "notes";
}
