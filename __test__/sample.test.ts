// it needs FirebaseAdmin
import firebaseAdmin from 'firebase-admin'
import { BackendFirebaseJob, inCartFirebaseTaskPaths } from '../src'

firebaseAdmin.initializeApp()

describe('Samples', () => {
  describe('01_simple', () => {
    it('can create a task and close it', async () => {
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
      await job.publishDone({
        status: 'finished',
        message: 'all good',
      })
    })
  })
})