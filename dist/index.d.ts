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

/**
 * ProgressDetailPublisher will manage these values
 *
 * ```
 * |------------------------------------------------------------>| total
 * |---------------------------->|                                 current
 *                               |--->|                            inFlight
 * |-->|                                                           error
 * ```
 */
declare class ProgressDetailPublisher {
    protected readonly publishHandler: (jobPayload: any, workloads: ProgressWorkload) => Promise<any>;
    jobPayload: Partial<{
        status: 'in-progress' | 'initializing';
        message: string;
        /**
         * Total Bar Length
         */
        totalProgress: number | firestore.FieldValue;
        /**
         * Finished Bar Length
         */
        currentProgress: number | firestore.FieldValue;
        /**
         * (For Future Release)
         * number of task that the system currently working on.
         */
        inFlightProgress: number | firestore.FieldValue;
        /**
         * (For Future Release)
         * number of tasks that the system currently worked on but failed. This number is included in current bar as well
         * which means it can be discarded by UI as total/current is already suffice to display the total progress.
         */
        errorProgress: number;
    }>;
    protected workloads: ProgressWorkload;
    /**
     * Create an instance of ProgressDetailPublisher which uses Builder pattern.
     * @param publishHandler
     */
    constructor(publishHandler: (jobPayload: any, workloads: ProgressWorkload) => Promise<any>);
    setStatus(status: 'in-progress' | 'initializing'): this;
    setMessage(message: string): this;
    withWorkload(workloads: ProgressWorkload): this;
    setManualProgress(current: number, total: number, inFlight?: number): this;
    setInFlightProgress(inFlight: number): this;
    setTotalProgress(total: number): this;
    incCurrentProgress(delta: number): this;
    setCurrentProgress(current: number): this;
    publish(): Promise<void>;
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
    protected options: {
        workloadMetaKey: string;
        useSubTaskProgress: boolean;
    };
    /**
     * Create a brand new Backend Firebase Job object
     *
     * @param firestore
     * @param pathProvider
     * @param storeId
     * @param jobId
     * @param options - customize Job's behavior
     */
    constructor(firestore: firestore.Firestore, paths: PathProvider, jobId: string, options?: {
        workloadMetaKey?: string;
        useSubTaskProgress?: boolean;
    });
    /**
     * New API to report progress.
     *
     * Usage
     *
     * ```ts
     * await job.makeProgress()
     *  .setStatus('in-progress')
     *  .setManualProgress(30, 100)
     *  .setMessage('all good')
     *  .publish()
     * ```
     *
     * @returns a progress maker
     */
    makeProgress(): ProgressDetailPublisher;
    /**
     * !Backward compat API
     *
     * Update the progress report manually.
     * If `options.useSubTaskProgress` is true, the system will discard currentProgress and totalProgress information.
     *
     * @param detail
     * @param workloads update information about workloads.
     * @returns
     */
    publishProgress(detail: ProgressDetail, workloads?: ProgressWorkload): Promise<void>;
    /**
     * Use this method to create the BackendFirebaseTask with specific taskId. This assumes that you have activate the task with
     * either: `activateTaskBatch` or `activateTask` method.
     *
     * @param taskId
     * @returns
     */
    getActiveTask<T extends FirebaseTaskContent>(taskId: string): BackendFirebaseTask<T>;
    /**
     * Enable subTask as progress.
     *
     * Once enable deactiveTask will increment current progress.
     *
     * @param enable
     */
    enableSubTaskProgress(numberOfSubTasks: number): Promise<void>;
    disableSubTaskProgress(): Promise<void>;
    /**
     * Same as activeTaskBatch but will save writeOperation charges with batch operation.
     *
     * @param items
     * @param chunkSize
     * @returns
     */
    activateTaskBatch<T extends FirebaseTaskContent>(items: {
        label: string;
        detail: T | null;
        taskId?: string;
    }[], chunkSize?: number): Promise<BackendFirebaseTask<T>[]>;
    /**
     * Active Job's child task.
     *
     * @param label readable task description
     * @param detail detail of the tasks.
     * @param taskId manually specific taskId instead of using `col.doc()`
     * @returns
     */
    activateTask<T extends FirebaseTaskContent>(label: string, detail: T | null, taskId?: string): Promise<BackendFirebaseTask<T>>;
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
