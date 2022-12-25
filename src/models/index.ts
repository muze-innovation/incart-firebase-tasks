export interface ProgressDetail {
  status: 'in-progress' | 'initializing'
  currentProgress?: number
  totalProgress?: number
  message?: string
}

export type Workload = {
  $set: string[],
  $remove: string[],
  $add: string[],
}

export type ProgressWorkload = Record<string, Workload>

export interface CancelRequest {
  status: 'technical-cancel' | 'user-cancel'
  reason: string
}

export interface DoneFinishedRequest {
  status: 'finished'
  message?: string
  reportUrl?: string
  reportUrlExpiredAt?: number
}

export interface DoneFinisihedWithErrorRequest {
  status: 'finished-with-error' | 'error'
  errorMessage: string
}

export type DoneRequest = DoneFinishedRequest | DoneFinisihedWithErrorRequest

export type TaskStatus = 'initializing'
  | 'in-progress'
  | 'finished'
  | 'finished-with-error'
  | 'error'
  | 'technical-cancel'
  | 'user-cancel'

const TASK_STATUSES: Record<string, TaskStatus> = {
  INITIALIZING: 'initializing',
  IN_PROGRESS: 'in-progress',
  FINISHED: 'finished',
  FINISHED_WITH_ERROR: 'finished-with-error',
  ERROR: 'error',
  CANCEL_TECH: 'technical-cancel',
  CANCEL_USER: 'user-cancel',
}

const WHITELIST = new Set(Object.values(TASK_STATUSES))

export const assertValidTaskStatus = (status: string): status is TaskStatus => {
  if (WHITELIST.has(<any>status)) {
    return true
  }
  throw new Error(`Invalid "status" value of ${status}. Expected ${[...Object.values(TASK_STATUSES)].join(', ')}`)
}

export interface PublishSubTaskRequest {
  message: string
  author: string
}