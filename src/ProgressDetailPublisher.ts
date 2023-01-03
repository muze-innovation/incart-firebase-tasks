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
     * Error published during the running process
     */
    errors: string[] | firestore.FieldValue
    /**
     * The last object that use to notify that the one whom responsible for completing the whole progress
     * is a specific task/progress/sub-routine.
     * 
     * Set this by child process. And let each child process query this value back to check if it is the
     * one whom acutally finalized the last bit.
     */
    lastTaskToken: string
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

  /**
   * Tell the Firebase that some part of the work has been finished.
   * Optionally, also provide the critical error message within some finished works.
   *
   * @param delta 
   * @param withErrorMessages 
   * @returns 
   */
  public incCurrentProgress(delta: number, withErrorMessages: string[] = []): this {
    this.jobPayload.currentProgress = firestore.FieldValue.increment(delta)
    if (withErrorMessages && withErrorMessages.length > 0) {
      if (withErrorMessages.length > delta) {
        console.warn('the error message should not exceeds the delta of incremented progress.')
      }
      return this.appendErrors(withErrorMessages)
    }
    return this
  }

  public appendErrors(error: string[]): this {
    this.jobPayload.errors = firestore.FieldValue.arrayUnion(...error)
    return this
  }

  public setCurrentProgress(current: number): this {
    this.jobPayload.currentProgress = current
    return this
  }

  public setLastTaskToken(token: string): this {
    this.jobPayload.lastTaskToken = token
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
