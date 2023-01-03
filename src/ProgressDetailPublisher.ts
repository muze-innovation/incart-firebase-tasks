import { firestore } from "firebase-admin"
import { ProgressWorkload } from "./models"

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

export class ProgressDetailPublisher {

  // For Progress only
  public jobPayload: Partial<{
    status: 'in-progress' | 'initializing'
    message: string
    /**
     * Total Bar Length
     */
    totalProgress: number | firestore.FieldValue
    /**
     * Finished Bar Length
     */
    currentProgress: number | firestore.FieldValue
    /**
     * (For Future Release)
     * number of task that the system currently working on.
     */
    inFlightProgress: number | firestore.FieldValue
    /**
     * (For Future Release)
     * number of tasks that the system currently worked on but failed. This number is included in current bar as well
     * which means it can be discarded by UI as total/current is already suffice to display the total progress.
     */
    errorProgress: number
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

  public setManualProgress(current: number, total: number, inFlight: number = 0): this {
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

  public incCurrentProgress(delta: number): this {
    this.jobPayload.currentProgress = firestore.FieldValue.increment(delta)
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
