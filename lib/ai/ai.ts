export interface AIProvider {
  /**
   * Generate a full response string for the given prompt.
   * context: optional injected knowledge (cv.md + experience.md + research)
   */
  generate(prompt: string, context?: string, options?: Record<string, any>): Promise<string>;

  /** Optional streaming API for progressive UI updates */
  stream?: (
    prompt: string,
    context: string | undefined,
    onChunk: (chunk: string) => void,
    options?: Record<string, any>
  ) => Promise<void>;
}

