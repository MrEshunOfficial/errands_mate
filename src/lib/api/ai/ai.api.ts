import { APIClient } from "../base/api-client";

class AIAPI extends APIClient {
  private readonly BASE = "/api/ai";

  async suggestTags(name: string, description: string): Promise<string[]> {
    const res = await this.post<{ success: boolean; tags: string[] }>(
      `${this.BASE}/suggest-tags`,
      { name, description },
    );
    return res.tags ?? [];
  }

  async generateDescription(
    entityType: string,
    title: string,
    category?: string,
    additionalContext?: string,
  ): Promise<string> {
    const res = await this.post<{ success: boolean; description: string }>(
      `${this.BASE}/generate-description`,
      { entityType, title, category, additionalContext },
    );
    return res.description ?? "";
  }
}

export const aiAPI = new AIAPI();
