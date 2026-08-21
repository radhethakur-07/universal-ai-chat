import api from '../lib/api';
import { Project } from '../types';

export const projectService = {
  async getProjects(): Promise<{ projects: Project[] }> {
    const res = await api.get('/api/projects');
    return res.data;
  },

  async getProject(id: string): Promise<{ project: Project }> {
    const res = await api.get(`/api/projects/${id}`);
    return res.data;
  },
};
