const disclosurePattern = /\b(?:(?:this|the|a|an)\s+(?:report|paper|manuscript|article|study|text|content|analysis)\s+(?:was\s+)?(?:written|drafted|generated|created|produced|edited)\s+(?:in part\s+)?(?:by|with|using)\s+(?:an?\s+)?(?:AI|artificial intelligence|ChatGPT|Claude|Copilot|Gemini)|AI[- ]assisted\s+(?:writing|drafting|editing|analysis|content)|(?:ChatGPT|Claude|Copilot|Gemini)\s+(?:was|were)\s+used\s+to\s+(?:write|draft|generate|edit|analy[sz]e))\b/i;

export function findAiUseDisclosure(text: string): string | null {
  return text.split(/\n+/).map((line) => line.trim()).find((line) => disclosurePattern.test(line)) ?? null;
}
