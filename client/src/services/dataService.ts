import api from '../lib/api';

export const dataService = {
  async importData(
    projectId: string,
    entity: string,
    records: Record<string, unknown>[]
  ): Promise<{ success: boolean; message: string; count: number }> {
    const res = await api.post(`/api/data/projects/${projectId}/import`, {
      entity,
      records,
    });
    return res.data;
  },
};
