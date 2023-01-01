import { ProgressDetail, ProgressWorkload, CancelRequest, DoneRequest, TaskStatus, assertValidTaskStatus, Workload, FirebaseTaskContent } from "./models"
import { firestore } from "firebase-admin"
import { PathProvider } from "./paths"
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import chunk from 'lodash/chunk'
import { ProgressDetailPublisher } from "./ProgressDetailPublisher"

// Shortcuts
const FieldValue = firestore.FieldValue

export const helpers = {
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
  toFirestoreWorkload(workload: Workload, workloadKey: string): any {
    if (isEmpty(workload)) {
      return {}
    }
    if (workload['$set']) {
      return {
        [workloadKey]: workload['$set'],
      }
    }
    if (workload['$remove']) {
      return {
        [workloadKey]: FieldValue.arrayRemove(...workload['$remove']),
      }
    }
    if (workload['$add']) {
      return {
        [workloadKey]: FieldValue.arrayUnion(...workload['$add']),
      }
    }
    throw new Error(`Invalid usage of "toFirestoreWorkloads". Invalid workloads object: ${JSON.stringify(workload)}`)
  },
  /**
   * Compute given workloads change request to Firestore Update Query statement
   *
   * @param workloads
   */
  toFirestoreWorkloads(workloads: ProgressWorkload) {
    if (isEmpty(workloads)) {
      return {}
    }
    return reduce(workloads, (res, val, key) => {
      const computed = helpers.toFirestoreWorkload(val, key)
      return {
        ...res,
        ...computed,
      }
    }, {})
  },
}

export class BackendFirebaseTask<T extends FirebaseTaskContent> {
  /**
   * @param firestore
   * @param absPath
   * @param taskId
   */
  constructor(
    protected parentJob: BackendFirebaseJob,
    protected absPath: string,
    public readonly taskId: string) {
  }

  /**
   * !Deprecated, in favor of `publishProgress`
   * 
   * @param detail
   */
  async publishSubTask(detail: T): Promise<void> {
    return this.publishProgress(detail)
  }

  /**
   * 
   * update task details. Keep calling this API until your ChildFirebaseTask is finished.
   */
  public async publishProgress(detail: T): Promise<void> {
    // Update the internal documents.
    await this.parentJob.firestore.doc(this.absPath).update({
      ...detail,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  /**
   * terminate itself as 'success'
   */
  async publishSuccess(): Promise<void> {
    return this.parentJob.deactivateTask(this, 'success')
  }

  /**
   * terminate itself as 'failed' with specific reason.
   * 
   * @param failureReason
   */
  async publishFailed(failureReason: string): Promise<void> {
    return this.parentJob.deactivateTask(this, 'failed', failureReason)
  }
}

export class BackendFirebaseJob {
  // Default options
  public readonly options: { workloadMetaKey: string, useSubTaskProgress: boolean }

  /**
   * Create a brand new Backend Firebase Job object
   *
   * @param firestore
   * @param pathProvider
   * @param storeId
   * @param jobId
   * @param options - customize Job's behavior
   */
  constructor(
    public readonly firestore: firestore.Firestore,
    public readonly paths: PathProvider,
    public readonly jobId: string,
    options: { workloadMetaKey?: string, useSubTaskProgress?: boolean } = {}) {
    this.options = {
      workloadMetaKey: options.workloadMetaKey || 'workloads',
      useSubTaskProgress: options.useSubTaskProgress || false,
    }
  }

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
  public makeProgress(): ProgressDetailPublisher {
    const updateDocPath = this.paths.activeJobsDocument(this.jobId)
    const docRef = this.firestore.doc(updateDocPath)
    return new ProgressDetailPublisher(async (jobPayload, workloads) => {
      await docRef.update(jobPayload)
      const computedWorkloadChanges = helpers.toFirestoreWorkloads(workloads)
      if (!isEmpty(computedWorkloadChanges)) {
        const workloadsPath = this.paths.activeJobsMetaDocument(this.jobId, this.options.workloadMetaKey)
        console.log('Updating job.workloads on', workloadsPath, computedWorkloadChanges)
        await this.firestore.doc(workloadsPath).set({
          ...computedWorkloadChanges,
          updatedAt: FieldValue.serverTimestamp(),
        }, {
          merge: true,
        })
      }
    })
  }

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
  async publishProgress(detail: ProgressDetail, workloads: ProgressWorkload = {}): Promise<void> {
    const {
      status, currentProgress = 0, totalProgress = 100, message = '',
    } = detail
    const jobId = this.jobId
    assertValidTaskStatus(status)
    return this.makeProgress()
      .setManualProgress(currentProgress, totalProgress, 0)
      .setStatus(status)
      .setMessage(message)
      .withWorkload(workloads)
      .publish()
  }

  /**
   * Use this method to create the BackendFirebaseTask with specific taskId. This assumes that you have activate the task with
   * either: `activateTaskBatch` or `activateTask` method.
   * 
   * @param taskId 
   * @returns 
   */
  public getActiveTask<T extends FirebaseTaskContent>(taskId: string): BackendFirebaseTask<T> {
    const o = new BackendFirebaseTask<T>(
      this,
      this.paths.activeJobSubTaskDocument(this.jobId, taskId),
      taskId,
    )
    return o
  }

  /**
   * Same as activeTaskBatch but will save writeOperation charged with batch operations.
   * 
   * @param items 
   * @param chunkSize 
   * @returns 
   */
  async activateTaskBatch<T extends FirebaseTaskContent>(items: { label: string, detail: T | null }[], chunkSize: number = 200): Promise<BackendFirebaseTask<T>[]> {
    // Sanity check, Firebase's document only allow maximum of 500 operations, -1 is for activeTaskCount reduction.
    if (chunkSize > (500 - 1)) {
      throw new Error('Maximum batch operation exceeds.')
    }
    const batchOp = this.firestore.batch()
    const col = this.firestore
      .collection(this.paths.activeJobSubTasksCollection(this.jobId))
    const activeJobDocRef = this.firestore
      .doc(this.paths.activeJobsDocument(this.jobId))
    const result: BackendFirebaseTask<T>[] = []

    const chunked = chunk(items, 100)
    for(const batchOfItems of chunked) {
      // For each chunk
      const batchSize = batchOfItems.length
      const resultOp: firestore.DocumentReference<firestore.DocumentData>[] = new Array(batchSize)
      // (1) create new document
      for(let i=0;i<batchSize;i++) {
        const item = batchOfItems[i]
        const docRef = col.doc()
        batchOp.set(docRef, {
          ...(item.detail),
          label: item.label,
          status: 'active',
          beginAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        resultOp[i] = docRef
      }
      // (2) update activeTaskCount
      batchOp.update(activeJobDocRef, {
        activeTaskCount: FieldValue.increment(batchSize),
      })
      await batchOp.commit()
      for (let i=0;i<batchSize;i++) {
        const docRef = resultOp[i]
        const o = new BackendFirebaseTask<T>(
          this,
          this.paths.activeJobSubTaskDocument(this.jobId, docRef.id),
          docRef.id,
        )
        result.push(o)
      }
    }
    return result
  }

  /**
   * Active Job's child task.
   *
   * @param label readable task description
   * @param detail detail of the tasks.
   * @returns
   */
  async activateTask<T extends FirebaseTaskContent>(label: string, detail: T | null): Promise<BackendFirebaseTask<T>> {
    const docRef = await this.firestore
      .collection(this.paths.activeJobSubTasksCollection(this.jobId))
      .add({
        ...(detail || {}),
        label,
        status: 'active',
        beginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    const o = new BackendFirebaseTask<T>(
      this,
      this.paths.activeJobSubTaskDocument(this.jobId, docRef.id),
      docRef.id,
    )
    console.log('ACTIVATE TASK', docRef.id)
    const updateDocPath = this.paths.activeJobsDocument(this.jobId)
    this.firestore.doc(updateDocPath).update({
      activeTaskCount: FieldValue.increment(1),
    })
    return o
  }

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
  async deactivateTask(task: BackendFirebaseTask<any>, reason: 'failed' | 'success', error?: string) {
    console.log('DEACTIVATE TASK', task.taskId, reason, error)
    const taskDocPath = this.paths.activeJobSubTaskDocument(this.jobId, task.taskId)
    const payload: any = {
      reason,
      status: 'deactive',
      endedAt: FieldValue.serverTimestamp(),
    }
    if (error) {
      payload.error = error
    }
    const aggregateKey = reason === 'failed' ? 'failedTaskCount' : 'successTaskCount'
    await this.firestore.doc(taskDocPath).update(payload)
    const updateDocPath = this.paths.activeJobsDocument(this.jobId)
    await this.firestore.doc(updateDocPath).update({
      activeTaskCount: FieldValue.increment(-1),
      [aggregateKey]: FieldValue.increment(1),
    })
  }

  /**
   * Query number of active tasks at the given moment
   * 
   * @returns
   */
  async getActiveTasksCount(): Promise<number> {
    const jobId = this.jobId
    const docPath = this.paths.activeJobsDocument(jobId)
    const doc = await this.firestore.doc(docPath).get()
    const rawData = doc.data() || {}
    return rawData.activeTaskCount || 0
  }

  /**
   * Get current the workload object via workloadsKey
   * 
   * @returns {Record<string, string[]> | null}
   */
  async getWorkloads(): Promise<Record<string, string[]> | null> {
    const jobId = this.jobId
    const docPath = this.paths.activeJobsMetaDocument(jobId, this.options.workloadMetaKey)
    const doc = await this.firestore.doc(docPath).get()
    if (!doc.exists) {
      return null
    }
    const rawData = doc.data() || {}
    return rawData || null
  }

  /**
   * @param detail
   */
  async cancel(detail: CancelRequest): Promise<void> {
    assertValidTaskStatus(detail.status)
    const updateDocPath = this.paths.activeJobsDocument(this.jobId)
    console.log('Cancelled job on', updateDocPath)
    await this.firestore.doc(updateDocPath).update({
      ...detail,
      updatedAt: FieldValue.serverTimestamp(),
      cancelledAt: FieldValue.serverTimestamp(), // cancellation effective at.
    })
  }

  /**
   * @param detail
   * @returns {Promise<void>}
   */
  async publishDone(detail: DoneRequest): Promise<void> {
    assertValidTaskStatus(detail.status)
    const updateDocPath = this.paths.activeJobsDocument(this.jobId)
    console.log('Job done on', updateDocPath)
    await this.firestore.doc(updateDocPath).update({
      jobId: this.jobId,
      ...detail,
      updatedAt: FieldValue.serverTimestamp(),
      ...(
        /^finished/.test(detail.status)
          ? { currentProgress: 100, totalProgress: 100, endedAt: FieldValue.serverTimestamp() }
          : {}
      ),
    })
  }

  /**
   * Check if job has been cancelled?
   * 
   * @returns
   */
  async isJobCancelled(): Promise<boolean> {
    const docPath = this.paths.activeJobsDocument(this.jobId)
    const docRef = this.firestore.doc(docPath)
    const snapshot = await docRef.get()
    const raw = snapshot.data()
    return raw && Boolean(raw.cancelledAt) || false
  }

  /**
   * Check if job exists?
   * 
   * @returns
   */
  async isExist(): Promise<boolean> {
    const docPath = this.paths.activeJobsDocument(this.jobId)
    const docRef = this.firestore.doc(docPath)
    const snapshot = await docRef.get()
    return Boolean(snapshot.exists)
  }

  public static async createNew(fs: firestore.Firestore, paths: PathProvider, jobSlug: string, optionalMessage = null): Promise<BackendFirebaseJob> {
    const col = paths.activeJobsCollection()
    console.log('Creating a new job on', col)
    const docRef = await fs.collection(col).add({
      slug: jobSlug,
      message: optionalMessage,
      beginAt: FieldValue.serverTimestamp(),
    })
    return new BackendFirebaseJob(
      fs,
      paths,
      docRef.id,
    )
  }

  /**
   * Create Firebase Job Instasnce from existing JobId on specific store (if specified.)
   * 
   * @param jobId specific firebase jobId
   * @throws InvalidJobId error when given jobId is not exists.
   */
  public static async loadJob(fs: firestore.Firestore, paths:PathProvider, jobId: string): Promise<BackendFirebaseJob> {
    const job = new BackendFirebaseJob(
      fs,
      paths,
      jobId,
    )
    const exists = await job.isExist()
    if (!exists) {
      throw new Error(`"jobId" of value ${jobId} is unknown to given Firestore.`)
    } 
    return job
  }
}