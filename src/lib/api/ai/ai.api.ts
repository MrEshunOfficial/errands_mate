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

}

export const aiAPI = new AIAPI();
