import { firestore } from "firebase-admin"
import { ProgressWorkload } from "./models"

export class ProgressDetailPublisher {

  public jobPayload: Partial<{
    status: 'in-progress' | 'initializing'
    message: string
    totalProgress: number
    currentProgress: number
  }> = {}

  protected workloads: ProgressWorkload = {}

  constructor(
    protected readonly publishHandler: (jobPayload: any, workloads: ProgressWorkload) => Promise<any>,
  ) {
  }

  public setStatus(status: 'in-progress' | 'initializing'): this {
    this.jobPayload.status = status
    return this
  }

  public setMessage(message: string): this {
    this.jobPayload.message = message
    return this
  }

  public withWorkload(workloads: ProgressWorkload): this {
    this.workloads = workloads
    return this
  }

  public setManualProgress(current: number, total: number): this {
    this.jobPayload.totalProgress = total
    this.jobPayload.currentProgress = current
    return this
  }

  public setTotalProgress(total: number): this {
    this.jobPayload.totalProgress = total
    return this
  }

  public setCurrentProgress(current: number): this {
    this.jobPayload.currentProgress = current
    return this
  }

  public async publish(): Promise<void> {
    // actually publish the progress.
    const jobPayload = {
      ...this.jobPayload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    }
    return this.publishHandler(
      jobPayload,
      this.workloads,
    )
  }
}
