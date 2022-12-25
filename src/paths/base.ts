export interface PathProvider {
  /**
   * Base Path
   */
  storePath(): string
  /**
   * (Col) Active Jobs/
   */
  activeJobsCollection(): string
  /**
   * (Doc) Active Jobs/:jobId
   * @param jobId 
   */
  activeJobsDocument(jobId: string): string,
  /**
   * (COL) Active Jobs/:jobId/:metaKey
   *  
   * @param jobId 
   * @param metaKey 
   */
  activeJobsMetaDocument(jobId: string, metaKey: string): string
  /**
   * (COL) Active Jobs/:jobId/tasks
   * @param jobId 
   */
  activeJobSubTasksCollection(jobId: string): string
  /**
   * (DOC) Active Jobs/:jobId/tasks/:taskId
   * 
   * @param jobId 
   * @param taskId 
   */
  activeJobSubTaskDocument(jobId: string, taskId: string): string
}
