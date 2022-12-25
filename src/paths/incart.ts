import type { PathProvider } from './base'

const rootPath = (stageName: string) => {
  switch (stageName) {
    case 'production': return ['prodzone', 'prod']
    case 'qa': return ['safezone', 'qa']
    case 'alpha': return ['safezone', 'alpha']
    default: return ['safezone', 'local']
  }
}

export const inCartFirebaseTaskPaths = (stageName: string, storeId: string): PathProvider => {
  const storePath = [...rootPath(stageName), 'stores', storeId]
  return {
    storePath: () => storePath.join('/'),
    activeJobsCollection: () => [...storePath, 'activeJobs'].join('/'),
    activeJobsDocument: (jobId: string) => [...storePath, 'activeJobs', jobId].join('/'),
    activeJobsMetaDocument: (jobId: string, metaKey: string) => [...storePath, 'activeJobs', jobId, 'metas', metaKey].join('/'),
    activeJobSubTasksCollection: (jobId: string) => [...storePath, 'activeJobs', jobId, 'tasks'].join('/'),
    activeJobSubTaskDocument: (jobId: string, taskId: string) => [...storePath, 'activeJobs', jobId, 'tasks', taskId].join('/'),
  }
}