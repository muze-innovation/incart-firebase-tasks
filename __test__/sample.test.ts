// it needs FirebaseAdmin
import firebaseAdmin from 'firebase-admin'
import { BackendFirebaseJob, inCartFirebaseTaskPaths } from '../src'

firebaseAdmin.initializeApp()

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
      } else {
        await job.publishDone({
          status: 'finished-with-error',
          errorMessage: 'There is something wrong with the system :('
        })
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
    })

    it('can create a job with 10 child-task', async () => {
      const job = await BackendFirebaseJob.createNew(
        firebaseAdmin.firestore(),
        inCartFirebaseTaskPaths('local', 'jested'),
        'fake-job-slug-with-task',
      )

      const oneToN = [...Array(10).keys()]
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

      await job.publishDone({
        status: 'finished',
      })
    })

    it('can create a job with 10 child-task using batch operation', async () => {
      const job = await BackendFirebaseJob.createNew(
        firebaseAdmin.firestore(),
        inCartFirebaseTaskPaths('local', 'jested'),
        'fake-job-slug-with-task-using-batch-op',
      )

      const oneToN = [...Array(10).keys()]
      const tasks = await job.activateTaskBatch(oneToN.map((n) => ({
        label: `my-child-task-label-batch-${n}`,
        detail: null,
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

      await Promise.all(messageConsumers)

      await job.publishDone({
        status: 'finished',
      })
    })
  })
})