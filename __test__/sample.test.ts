// it needs FirebaseAdmin
import firebaseAdmin from 'firebase-admin'
import { BackendFirebaseJob, inCartFirebaseTaskPaths } from '../src'

firebaseAdmin.initializeApp()

const paths = inCartFirebaseTaskPaths('local', 'jested')

const getRawJobObject = async (jobId: string): Promise<FirebaseFirestore.DocumentData | null> => {
  const db = firebaseAdmin.firestore()
  const snpashot = await db
    .doc(paths.activeJobsDocument(jobId))
    .get()
  return snpashot.data() || null
}

describe('Samples', () => {
  describe('01_simple', () => {
    it.each`
      finalStatus
      ${'finished'}
      ${'finished-with-error'}
    `('can create a task and close it with $finalStatus', async ({ finalStatus }) => {
      const job = await BackendFirebaseJob.createNew(
        firebaseAdmin.firestore(),
        inCartFirebaseTaskPaths('local', 'jested'),
        'fake-job-slug',
      )

      // Do something
      await job.publishProgress({
        status: 'in-progress',
        currentProgress: 30,
        totalProgress: 150,
      })

      // something is done.
      if (finalStatus === 'finished') {
        await job.publishDone({
          status: 'finished',
          message: 'all good',
        })

        const data = await getRawJobObject(job.jobId)
        expect(data).toBeTruthy()
        expect(data!.status).toEqual('finished')
      } else {
        await job.publishDone({
          status: 'finished-with-error',
          errorMessage: 'There is something wrong with the system :('
        })

        const data = await getRawJobObject(job.jobId)
        expect(data).toBeTruthy()
        expect(data!.status).toEqual('finished-with-error')
      }
    })
  })

  describe('02 a Job with child task', () => {
    it('can create a job with 1 child-task', async () => {
      const job = await BackendFirebaseJob.createNew(
        firebaseAdmin.firestore(),
        inCartFirebaseTaskPaths('local', 'jested'),
        'fake-job-slug-with-task',
      )

      const task = await job.activateTask('my-child-task-label', null)
      await task.publishProgress({
        author: 'jester-the-tester',
        message: 'finding something to do',
      })

      await task.publishSuccess()

      await job.publishDone({
        status: 'finished',
      })

      const data = await getRawJobObject(job.jobId)
      expect(data).toBeTruthy()
      expect(data!.status).toEqual('finished')
    })

    it('can create a job with 10 child-task', async () => {
      const job = await BackendFirebaseJob.createNew(
        firebaseAdmin.firestore(),
        inCartFirebaseTaskPaths('local', 'jested'),
        'fake-job-slug-with-task',
      )
      const totalTasks = 10

      await job.enableSubTaskProgress(totalTasks)

      const beforeStart = await getRawJobObject(job.jobId)
      expect(beforeStart).toBeTruthy()
      expect(beforeStart!.currentProgress).toEqual(0)
      expect(beforeStart!.totalProgress).toEqual(totalTasks)

      const oneToN = [...Array(totalTasks).keys()]
      const tasks = oneToN.map(async (n) => {
        const task = await job.activateTask(`my-child-task-label-${n}`, null)

        await task.publishProgress({
          author: 'jester-the-tester',
          message: 'finding something to do',
        })

        const successFactor = Math.random()
        if (successFactor < 0.3) {
          await task.publishFailed(`successFactor is less than 0.3 (${successFactor.toFixed(2)})`)
        } else {
          await task.publishSuccess()
        }
      })

      await Promise.all(tasks)

      const data = await getRawJobObject(job.jobId)
      expect(data).toBeTruthy()
      expect(data!.currentProgress).toEqual(totalTasks)
      expect(data!.totalProgress).toEqual(totalTasks)
      expect(data!.inFlightProgress).toEqual(0)

      await job.publishDone({
        status: 'finished',
      })
    })

    it('can create a job with 35 child-task using batch operation', async () => {
      const job = await BackendFirebaseJob.createNew(
        firebaseAdmin.firestore(),
        inCartFirebaseTaskPaths('local', 'jested'),
        'fake-job-slug-with-task-using-batch-op',
      )
      const totalTasks = 35

      await job.enableSubTaskProgress(totalTasks)

      const beforeStart = await getRawJobObject(job.jobId)
      expect(beforeStart).toBeTruthy()
      expect(beforeStart!.currentProgress).toEqual(0)
      expect(beforeStart!.totalProgress).toEqual(totalTasks)

      const oneToN = [...Array(totalTasks).keys()]
      const tasks = await job.activateTaskBatch(oneToN.map((n) => ({
        label: `my-child-task-label-batch-${n}`,
        detail: null,
        taskId: `my-child-task-label-batch-${n}-id`,
      })))

      const messageConsumers = tasks.map(async (task) => {
        await task.publishProgress({
          author: 'jester-the-tester',
          message: 'finding something to do',
        })

        const successFactor = Math.random()
        if (successFactor < 0.3) {
          await task.publishFailed(`successFactor is less than 0.3 (${successFactor.toFixed(2)})`)
        } else {
          await task.publishSuccess()
        }
      })

      let subTaskId = await job.getFinalizedSubTaskId()
      expect(subTaskId).toBeNull()

      await Promise.all(messageConsumers)

      subTaskId = await job.getFinalizedSubTaskId()
      expect(subTaskId).toBeTruthy()
      expect(subTaskId).toMatch(/my-child-task-label-batch-\d{1,2}-id/)

      const data = await getRawJobObject(job.jobId)
      expect(data).toBeTruthy()
      expect(data!.currentProgress).toEqual(totalTasks)
      expect(data!.totalProgress).toEqual(totalTasks)
      expect(data!.inFlightProgress).toEqual(0)


      await job.publishDone({
        status: 'finished',
      })
    })
  })
})