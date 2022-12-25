# InCart's Firebase Task

A Firebase Task written in TypeScript.

Using node v14 to build with `tsup`. (But Exported for Node12 (es5)).

## To Build

```bash
npm run build
```

## To Test

Make sure you have placed your Firebase's service account.json file at `.cred/firebase-admin-service-account.json`. Once placed also making sure your Firestore Database is already configured and being ready to update by the paths.

The Test using inCart's paths configurations. You can implement your own if needed.

```bash
# before run make sure you have a Service Account's JSON file installed.
npm run test
```