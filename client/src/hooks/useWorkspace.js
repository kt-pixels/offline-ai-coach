import { useWorkspaceContext } from '../features/workspace/WorkspaceProvider';

export function useWorkspace() {
  return useWorkspaceContext();
}
