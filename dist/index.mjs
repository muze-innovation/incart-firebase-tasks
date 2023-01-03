// src/paths/incart.ts
var rootPath = (stageName) => {
  switch (stageName) {
    case "production":
      return ["prodzone", "prod"];
    case "qa":
      return ["safezone", "qa"];
    case "alpha":
      return ["safezone", "alpha"];
    default:
      return ["safezone", "local"];
  }
};
var inCartFirebaseTaskPaths = (stageName, storeId) => {
  const storePath = [...rootPath(stageName), "stores", storeId];
  return {
    storePath: () => storePath.join("/"),
    activeJobsCollection: () => [...storePath, "activeJobs"].join("/"),
    activeJobsDocument: (jobId) => [...storePath, "activeJobs", jobId].join("/"),
    activeJobsMetaDocument: (jobId, metaKey) => [...storePath, "activeJobs", jobId, "metas", metaKey].join("/"),
    activeJobSubTasksCollection: (jobId) => [...storePath, "activeJobs", jobId, "tasks"].join("/"),
    activeJobSubTaskDocument: (jobId, taskId) => [...storePath, "activeJobs", jobId, "tasks", taskId].join("/")
  };
};

// src/models/index.ts
var TASK_STATUSES = {
  INITIALIZING: "initializing",
  IN_PROGRESS: "in-progress",
  FINISHED: "finished",
  FINISHED_WITH_ERROR: "finished-with-error",
  ERROR: "error",
  CANCEL_TECH: "technical-cancel",
  CANCEL_USER: "user-cancel"
};
var WHITELIST = new Set(Object.values(TASK_STATUSES));
var assertValidTaskStatus = (status) => {
  if (WHITELIST.has(status)) {
    return true;
  }
  throw new Error(`Invalid "status" value of ${status}. Expected ${[...Object.values(TASK_STATUSES)].join(", ")}`);
};

// src/BackendFirebaseJob.ts
import { firestore as firestore2 } from "firebase-admin";
import isEmpty from "lodash/isEmpty";
import reduce from "lodash/reduce";
import chunk from "lodash/chunk";

// src/ProgressDetailPublisher.ts
import { firestore } from "firebase-admin";
var ProgressDetailPublisher = class {
  constructor(publishHandler) {
    this.publishHandler = publishHandler;
    this.jobPayload = {};
    this.workloads = {};
  }
  setStatus(status) {
    this.jobPayload.status = status;
    return this;
  }
  setMessage(message) {
    this.jobPayload.message = message;
    return this;
  }
  withWorkload(workloads) {
    this.workloads = workloads;
    return this;
  }
  setManualProgress(current, total, inFlight = 0) {
    this.jobPayload.totalProgress = total;
    this.jobPayload.currentProgress = current;
    this.jobPayload.inFlightProgress = inFlight;
    return this;
  }
  setInFlightProgress(inFlight) {
    this.jobPayload.inFlightProgress = inFlight;
    return this;
  }
  setTotalProgress(total) {
    this.jobPayload.totalProgress = total;
    return this;
  }
  incCurrentProgress(delta, withErrorMessages = []) {
    this.jobPayload.currentProgress = firestore.FieldValue.increment(delta);
    if (withErrorMessages && withErrorMessages.length > 0) {
      if (withErrorMessages.length > delta) {
        console.warn("the error message should not exceeds the delta of incremented progress.");
      }
      return this.appendErrors(withErrorMessages);
    }
    return this;
  }
  appendErrors(error) {
    this.jobPayload.errors = firestore.FieldValue.arrayUnion(...error);
    return this;
  }
  setCurrentProgress(current) {
    this.jobPayload.currentProgress = current;
    return this;
  }
  setLastTaskToken(token) {
    this.jobPayload.lastTaskToken = token;
    return this;
  }
  async publish() {
    const jobPayload = {
      ...this.jobPayload,
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    return this.publishHandler(
      jobPayload,
      this.workloads
    );
  }
};

// src/BackendFirebaseJob.ts
var FieldValue = firestore2.FieldValue;
var helpers = {
  toFirestoreWorkload(workload, workloadKey) {
    if (isEmpty(workload)) {
      return {};
    }
    if (workload["$set"]) {
      return {
        [workloadKey]: workload["$set"]
      };
    }
    if (workload["$remove"]) {
      return {
        [workloadKey]: FieldValue.arrayRemove(...workload["$remove"])
      };
    }
    if (workload["$add"]) {
      return {
        [workloadKey]: FieldValue.arrayUnion(...workload["$add"])
      };
    }
    throw new Error(`Invalid usage of "toFirestoreWorkloads". Invalid workloads object: ${JSON.stringify(workload)}`);
  },
  toFirestoreWorkloads(workloads) {
    if (isEmpty(workloads)) {
      return {};
    }
    return reduce(workloads, (res, val, key) => {
      const computed = helpers.toFirestoreWorkload(val, key);
      return {
        ...res,
        ...computed
      };
    }, {});
  }
};
var BackendFirebaseTask = class {
  constructor(parentJob, absPath, taskId) {
    this.parentJob = parentJob;
    this.absPath = absPath;
    this.taskId = taskId;
  }
  async publishSubTask(detail) {
    return this.publishProgress(detail);
  }
  async publishProgress(detail) {
    await this.parentJob.firestore.doc(this.absPath).update({
      ...detail,
      updatedAt: FieldValue.serverTimestamp()
    });
  }
  async publishSuccess() {
    return this.parentJob.deactivateTask(this, "success");
  }
  async publishFailed(failureReason) {
    return this.parentJob.deactivateTask(this, "failed", failureReason);
  }
};
var BackendFirebaseJob = class {
  constructor(firestore3, paths, jobId, options = {}) {
    this.firestore = firestore3;
    this.paths = paths;
    this.jobId = jobId;
    this.options = {
      workloadMetaKey: options.workloadMetaKey || "workloads",
      useSubTaskProgress: options.useSubTaskProgress || false
    };
  }
  makeProgress() {
    const updateDocPath = this.paths.activeJobsDocument(this.jobId);
    const docRef = this.firestore.doc(updateDocPath);
    return new ProgressDetailPublisher(async (jobPayload, workloads) => {
      const batchOp = this.firestore.batch();
      batchOp.update(docRef, jobPayload);
      const computedWorkloadChanges = helpers.toFirestoreWorkloads(workloads);
      if (!isEmpty(computedWorkloadChanges)) {
        const workloadsPath = this.paths.activeJobsMetaDocument(this.jobId, this.options.workloadMetaKey);
        console.log("Updating job.workloads on", workloadsPath, computedWorkloadChanges);
        batchOp.set(this.firestore.doc(workloadsPath), {
          ...computedWorkloadChanges,
          updatedAt: FieldValue.serverTimestamp()
        }, {
          merge: true
        });
      }
      await batchOp.commit();
    });
  }
  async publishProgress(detail, workloads = {}) {
    const {
      status,
      currentProgress = 0,
      totalProgress = 100,
      message = ""
    } = detail;
    assertValidTaskStatus(status);
    return this.makeProgress().setManualProgress(currentProgress, totalProgress, 0).setStatus(status).setMessage(message).withWorkload(workloads).publish();
  }
  getActiveTask(taskId) {
    const o = new BackendFirebaseTask(
      this,
      this.paths.activeJobSubTaskDocument(this.jobId, taskId),
      taskId
    );
    return o;
  }
  async enableSubTaskProgress(numberOfSubTasks) {
    this.options.useSubTaskProgress = true;
    await this.firestore.doc(this.paths.activeJobsDocument(this.jobId)).update({
      "options.useSubTaskProgress": this.options.useSubTaskProgress,
      totalProgress: numberOfSubTasks,
      currentProgress: 0
    });
  }
  async disableSubTaskProgress() {
    this.options.useSubTaskProgress = false;
    await this.firestore.doc(this.paths.activeJobsDocument(this.jobId)).update({
      "options.useSubTaskProgress": this.options.useSubTaskProgress
    });
  }
  async getFinalizedTaskToken() {
    const doc = await this.firestore.doc(this.paths.activeJobsDocument(this.jobId)).get();
    const rawData = doc.data();
    if (!rawData) {
      return null;
    }
    if (rawData.totalProgress === rawData.currentProgress && !rawData.activeTaskCount) {
      return rawData.lastTaskToken || null;
    }
    return null;
  }
  async activateTaskBatch(items, chunkSize = 200) {
    if (chunkSize > 500 - 1) {
      throw new Error("Maximum batch operation exceeds.");
    }
    const batchOp = this.firestore.batch();
    const col = this.firestore.collection(this.paths.activeJobSubTasksCollection(this.jobId));
    const activeJobDocRef = this.firestore.doc(this.paths.activeJobsDocument(this.jobId));
    const result = [];
    const chunked = chunk(items, chunkSize);
    for (const batchOfItems of chunked) {
      const batchSize = batchOfItems.length;
      const resultOp = new Array(batchSize);
      for (let i = 0; i < batchSize; i++) {
        const item = batchOfItems[i];
        const docRef = item.taskId ? col.doc(item.taskId) : col.doc();
        batchOp.set(docRef, {
          ...item.detail,
          label: item.label,
          status: "active",
          beginAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        resultOp[i] = docRef;
      }
      batchOp.update(activeJobDocRef, {
        activeTaskCount: FieldValue.increment(batchSize),
        inFlightProgress: FieldValue.increment(batchSize)
      });
      await batchOp.commit();
      for (let i = 0; i < batchSize; i++) {
        const docRef = resultOp[i];
        const o = new BackendFirebaseTask(
          this,
          this.paths.activeJobSubTaskDocument(this.jobId, docRef.id),
          docRef.id
        );
        result.push(o);
      }
    }
    return result;
  }
  async activateTask(label, detail, taskId) {
    const col = this.firestore.collection(this.paths.activeJobSubTasksCollection(this.jobId));
    const docRef = taskId ? col.doc(taskId) : col.doc();
    await docRef.set({
      ...detail || {},
      label,
      status: "active",
      beginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    const o = new BackendFirebaseTask(
      this,
      this.paths.activeJobSubTaskDocument(this.jobId, docRef.id),
      docRef.id
    );
    console.log("ACTIVATE TASK", docRef.id);
    const updateDocPath = this.paths.activeJobsDocument(this.jobId);
    this.firestore.doc(updateDocPath).update({
      activeTaskCount: FieldValue.increment(1),
      inFlightProgress: FieldValue.increment(1)
    });
    return o;
  }
  async deactivateTask(task, reason, error) {
    console.log("DEACTIVATE TASK", task.taskId, reason, error);
    const taskDocPath = this.paths.activeJobSubTaskDocument(this.jobId, task.taskId);
    const payload = {
      reason,
      status: "deactive",
      endedAt: FieldValue.serverTimestamp()
    };
    if (error) {
      payload.error = error;
    }
    await this.firestore.doc(taskDocPath).update(payload);
    const aggregateKey = reason === "failed" ? "failedTaskCount" : "successTaskCount";
    const updateDocPath = this.paths.activeJobsDocument(this.jobId);
    const updatePayload = {
      activeTaskCount: FieldValue.increment(-1),
      inFlightProgress: FieldValue.increment(-1),
      [aggregateKey]: FieldValue.increment(1)
    };
    if (this.options.useSubTaskProgress) {
      updatePayload.currentProgress = FieldValue.increment(1);
      updatePayload.lastTaskToken = task.taskId;
    }
    await this.firestore.doc(updateDocPath).update(updatePayload);
    return task.taskId;
  }
  async getActiveTasksCount() {
    const jobId = this.jobId;
    const docPath = this.paths.activeJobsDocument(jobId);
    const doc = await this.firestore.doc(docPath).get();
    const rawData = doc.data() || {};
    return rawData.activeTaskCount || 0;
  }
  async getWorkloads() {
    const jobId = this.jobId;
    const docPath = this.paths.activeJobsMetaDocument(jobId, this.options.workloadMetaKey);
    const doc = await this.firestore.doc(docPath).get();
    if (!doc.exists) {
      return null;
    }
    const rawData = doc.data() || {};
    return rawData || null;
  }
  async cancel(detail) {
    assertValidTaskStatus(detail.status);
    const updateDocPath = this.paths.activeJobsDocument(this.jobId);
    console.log("Cancelled job on", updateDocPath);
    await this.firestore.doc(updateDocPath).update({
      ...detail,
      updatedAt: FieldValue.serverTimestamp(),
      cancelledAt: FieldValue.serverTimestamp()
    });
  }
  async publishDone(detail) {
    assertValidTaskStatus(detail.status);
    const updateDocPath = this.paths.activeJobsDocument(this.jobId);
    console.log("Job done on", updateDocPath);
    await this.firestore.doc(updateDocPath).update({
      jobId: this.jobId,
      ...detail,
      updatedAt: FieldValue.serverTimestamp(),
      .../^finished/.test(detail.status) ? { currentProgress: 100, totalProgress: 100, endedAt: FieldValue.serverTimestamp() } : {}
    });
  }
  async isJobCancelled() {
    const docPath = this.paths.activeJobsDocument(this.jobId);
    const docRef = this.firestore.doc(docPath);
    const snapshot = await docRef.get();
    const raw = snapshot.data();
    return raw && Boolean(raw.cancelledAt) || false;
  }
  async isExist() {
    const docPath = this.paths.activeJobsDocument(this.jobId);
    const docRef = this.firestore.doc(docPath);
    const snapshot = await docRef.get();
    return Boolean(snapshot.exists);
  }
  static async createNew(fs, paths, jobSlug, optionalMessage = null) {
    const col = paths.activeJobsCollection();
    console.log("Creating a new job on", col);
    const docRef = await fs.collection(col).add({
      slug: jobSlug,
      message: optionalMessage,
      beginAt: FieldValue.serverTimestamp()
    });
    return new BackendFirebaseJob(
      fs,
      paths,
      docRef.id,
      {}
    );
  }
  static async loadJob(fs, paths, jobId) {
    const docPath = paths.activeJobsDocument(jobId);
    const docRef = fs.doc(docPath);
    const snapshot = await docRef.get();
    if (!snapshot) {
      throw new Error(`"jobId" of value ${jobId} is unknown to given Firestore.`);
    }
    const data = snapshot.data();
    const job = new BackendFirebaseJob(
      fs,
      paths,
      jobId,
      data?.options
    );
    return job;
  }
};
export {
  BackendFirebaseJob,
  BackendFirebaseTask,
  assertValidTaskStatus,
  helpers,
  inCartFirebaseTaskPaths
};
