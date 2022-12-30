import { firestore } from 'firebase-admin';

interface PathProvider {
    /**
     * Base Path
     */
    storePath(): string;
    /**
     * (Col) Active Jobs/
     */
    activeJobsCollection(): string;
    /**
     * (Doc) Active Jobs/:jobId
     * @param jobId
     */
    activeJobsDocument(jobId: string): string;
    /**
     * (COL) Active Jobs/:jobId/:metaKey
     *
     * @param jobId
     * @param metaKey
     */
    activeJobsMetaDocument(jobId: string, metaKey: string): string;
    /**
     * (COL) Active Jobs/:jobId/tasks
     * @param jobId
     */
    activeJobSubTasksCollection(jobId: string): string;
    /**
     * (DOC) Active Jobs/:jobId/tasks/:taskId
     *
     * @param jobId
     * @param taskId
     */
    activeJobSubTaskDocument(jobId: string, taskId: string): string;
}

declare const inCartFirebaseTaskPaths: (stageName: string, storeId: string) => PathProvider;

interface ProgressDetail {
    status: 'in-progress' | 'initializing';
    currentProgress?: number;
    totalProgress?: number;
    message?: string;
}
type Workload = {
    $set: string[];
    $remove: string[];
    $add: string[];
};
type ProgressWorkload = Record<string, Workload>;
interface CancelRequest {
    status: 'technical-cancel' | 'user-cancel';
    reason: string;
}
interface DoneFinishedRequest {
    status: 'finished';
    message?: string;
    reportUrl?: string;
    reportUrlExpiredAt?: number;
}
interface DoneFinisihedWithErrorRequest {
    status: 'finished-with-error' | 'error';
    errorMessage: string;
}
type DoneRequest = DoneFinishedRequest | DoneFinisihedWithErrorRequest;
type TaskStatus = 'initializing' | 'in-progress' | 'finished' | 'finished-with-error' | 'error' | 'technical-cancel' | 'user-cancel';
declare const assertValidTaskStatus: (status: string) => status is TaskStatus;
/**
 * Base content of FirebaseTask
 */
interface FirebaseTaskContent {
    message: string;
    author: string;
}

declare const helpers: {
    /**
     * Compute given workloads change request to Firestore Update Query statement
     *
     * @param {{
     *    $set: string[],
     *    $remove: string[],
     *    $add: string[],
     * }} workload
     * @param {string} workloadKey
     */
    toFirestoreWorkload(workload: Workload, workloadKey: string): any;
    /**
     * Compute given workloads change request to Firestore Update Query statement
     *
     * @param workloads
     */
    toFirestoreWorkloads(workloads: ProgressWorkload): {};
};
declare class BackendFirebaseTask<T extends FirebaseTaskContent> {
    protected parentJob: BackendFirebaseJob;
    protected absPath: string;
    readonly taskId: string;
    /**
     * @param firestore
     * @param absPath
     * @param taskId
     */
    constructor(parentJob: BackendFirebaseJob, absPath: string, taskId: string);
    /**
     * !Deprecated, in favor of `publishProgress`
     *
     * @param detail
     */
    publishSubTask(detail: T): Promise<void>;
    /**
     *
     * update task details. Keep calling this API until your ChildFirebaseTask is finished.
     */
    publishProgress(detail: T): Promise<void>;
    /**
     * terminate itself as 'success'
     */
    publishSuccess(): Promise<void>;
    /**
     * terminate itself as 'failed' with specific reason.
     *
     * @param failureReason
     */
    publishFailed(failureReason: string): Promise<void>;
}
declare class BackendFirebaseJob {
    readonly firestore: firestore.Firestore;
    readonly paths: PathProvider;
    readonly jobId: string;
    readonly workloadMetaKey: string;
    /**
     * Create a brand new Backend Firebase Job object
     *
     * @param firestore
     * @param pathProvider
     * @param storeId
     * @param jobId
     * @param workloadMetaKey
     */
    constructor(firestore: firestore.Firestore, paths: PathProvider, jobId: string, workloadMetaKey?: string);
    /**
     * @param detail
     * @param workloads update information about workloads.
     * @returns
     */
    publishProgress(detail: ProgressDetail, workloads?: ProgressWorkload): Promise<void>;
    /**
     * Active Job's child task.
     *
     * @param label readable task description
     * @param detail detail of the tasks.
     * @returns
     */
    activateTask<T extends FirebaseTaskContent>(label: string, detail: T | null): Promise<BackendFirebaseTask<T>>;
    /**
     * Update the status of the task. And mark it as 'deactive';
     * Also reduce the Job's activeTaskCount by 1.
     *
     * It will also update `failedTaskCount` and `successTaskCount` based on given deactivate's reason.
     *
     * @param task
     * @param reason
     * @param error
     * @returns
     */
    deactivateTask(task: BackendFirebaseTask<any>, reason: 'failed' | 'success', error?: string): Promise<void>;
    /**
     * Query number of active tasks at the given moment
     *
     * @returns
     */
    getActiveTasksCount(): Promise<number>;
    /**
     * Get current the workload object via workloadsKey
     *
     * @returns {Record<string, string[]> | null}
     */
    getWorkloads(): Promise<Record<string, string[]> | null>;
    /**
     * @param detail
     */
    cancel(detail: CancelRequest): Promise<void>;
    /**
     * @param detail
     * @returns {Promise<void>}
     */
    publishDone(detail: DoneRequest): Promise<void>;
    /**
     * Check if job has been cancelled?
     *
     * @returns
     */
    isJobCancelled(): Promise<boolean>;
    /**
     * Check if job exists?
     *
     * @returns
     */
    isExist(): Promise<boolean>;
    static createNew(fs: firestore.Firestore, paths: PathProvider, jobSlug: string, optionalMessage?: null): Promise<BackendFirebaseJob>;
    /**
     * Create Firebase Job Instasnce from existing JobId on specific store (if specified.)
     *
     * @param jobId specific firebase jobId
     * @throws InvalidJobId error when given jobId is not exists.
     */
    static loadJob(fs: firestore.Firestore, paths: PathProvider, jobId: string): Promise<BackendFirebaseJob>;
}

export { BackendFirebaseJob, BackendFirebaseTask, CancelRequest, DoneFinishedRequest, DoneFinisihedWithErrorRequest, DoneRequest, FirebaseTaskContent, PathProvider, ProgressDetail, ProgressWorkload, TaskStatus, Workload, assertValidTaskStatus, helpers, inCartFirebaseTaskPaths };
