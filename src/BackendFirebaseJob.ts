import { ProgressDetail, ProgressWorkload, CancelRequest, DoneRequest, TaskStatus, assertValidTaskStatus, Workload, PublishSubTaskRequest } from "./models"
import { firestore } from "firebase-admin"
import { PathProvider } from "./paths"
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'

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

export class BackendChildFirebaseTask {
  /**
   * @param firestore
   * @param absPath
   * @param taskId
   */
  constructor(
    protected firestore: firestore.Firestore,
    protected absPath: string,
    public readonly taskId: string) {
  }

  /**
   * @param detail
   * @returns
   */
  async publishSubTask(detail: PublishSubTaskRequest): Promise<void> {
    await this.firestore.doc(this.absPath).update({
      message: detail.message,
      author: detail.author,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}

export class BackendFirebaseJob {
  /**
   * Create a brand new Backend Firebase Job object
   *
   * @param firestore
   * @param pathProvider
   * @param storeId
   * @param jobId
   * @param workloadMetaKey
   */
  constructor(
    protected firestore: firestore.Firestore,
    protected paths: PathProvider,
    protected jobId: string,
    protected workloadMetaKey = 'workloads') {
    this.firestore = firestore
    this.workloadMetaKey = workloadMetaKey
  }

  /**
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
    const updateDocPath = this.paths.activeJobsDocument(jobId)
    console.log('Updating job on', updateDocPath)
    await this.firestore.doc(updateDocPath).update({
      jobId,
      status,
      currentProgress,
      totalProgress,
      message,
      updatedAt: FieldValue.serverTimestamp(),
    })
    const computedWorkloadChanges = helpers.toFirestoreWorkloads(workloads)
    if (!isEmpty(computedWorkloadChanges)) {
      const workloadsPath = this.paths.activeJobsMetaDocument(jobId, this.workloadMetaKey)
      console.log('Updating job.workloads on', workloadsPath, computedWorkloadChanges)
      await this.firestore.doc(workloadsPath).set({
        ...computedWorkloadChanges,
        updatedAt: FieldValue.serverTimestamp(),
      }, {
        merge: true,
      })
    }
  }

  /**
   * Active children job
   * @param label
   * @returns
   */
  async activateTask(label: string): Promise<BackendChildFirebaseTask> {
    const docRef = await this.firestore
      .collection(this.paths.activeJobSubTasksCollection(this.jobId))
      .add({
        label,
        status: 'active',
        beginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    const o = new BackendChildFirebaseTask(
      this.firestore,
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
   * @param task
   * @param reason
   * @param error
   * @returns
   */
  async deactivateTask(task: BackendChildFirebaseTask, reason: 'failed' | 'success', error?: string) {
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
    await this.firestore.doc(taskDocPath).update(payload)
    const updateDocPath = this.paths.activeJobsDocument(this.jobId)
    await this.firestore.doc(updateDocPath).update({
      activeTaskCount: FieldValue.increment(-1),
    })
  }

  /**
   * Query number of active tasks at the given moment
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
    const docPath = this.paths.activeJobsMetaDocument(jobId, this.workloadMetaKey)
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
   * @returns
   */
  async isExist(): Promise<boolean> {
    const docPath = this.paths.activeJobsDocument(this.jobId)
    const docRef = this.firestore.doc(docPath)
    const snapshot = await docRef.get()
    return Boolean(snapshot.exists)
  }

  public static async createNew(fs: firestore.Firestore, paths: PathProvider, jobSlug: string, optionalMessage = null) {
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
}