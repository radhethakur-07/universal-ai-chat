import { useProjectStore } from '../store/projectStore';

export function useProject() {
  const { projects, selectedProject, setSelectedProject, setProjects } = useProjectStore();
  return { projects, selectedProject, setSelectedProject, setProjects };
}
