import { firestore } from "firebase-admin"
import { ProgressWorkload } from "./models"

/**
 * ProgressDetailPublisher will manage these values
 * 
 * ```
 * |------------------------------------------------------------>| total progress
 * |---------------------------->| current progress
 *                               |--->| inFlight progress
 * ```
 */

export class ProgressDetailPublisher {

  // For Progress only
  public jobPayload: Partial<{
    status: 'in-progress' | 'initializing'
    message: string
    /**
     * Total Bar Length
     */
    totalProgress: number
    /**
     * Finished Bar Length
     */
    currentProgress: number
    /**
     * Almost Finished Bar Length
     */
    inFlightProgress: number
  }> = {}

  protected workloads: ProgressWorkload = {}

  /**
   * Create an instance of ProgressDetailPublisher which uses Builder pattern.
   * @param publishHandler 
   */
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

  public setManualProgress(current: number, total: number, inFlight: number): this {
    this.jobPayload.totalProgress = total
    this.jobPayload.currentProgress = current
    this.jobPayload.inFlightProgress = inFlight
    return this
  }

  public setInFlightProgress(inFlight: number): this {
    this.jobPayload.inFlightProgress = inFlight
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
