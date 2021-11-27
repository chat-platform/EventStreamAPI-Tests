# EventStreamAPI Test Harness

This repository is designed to integration test images of the EventStreamAPI with CucumberJS to ensure they work as intended.

> Note: This also tests the JS SDK for the EventStreamAPI, as it uses it to make the needed requests.

## Requirements
- Minikube
- npm

## Process

0. Install NPM dependencies: `npm install`
1. Run `./test.sh`:
   1. Starts minikube if needed
   2. Applies deployments
   3. Wipes the database if needed (ensures idempotency)
   4. Applies DB migrations
   5. Launches CucumberJS test suite

### Clean environment

Much of the contents of the k8s cluster will auto clean between test runs, buf if you want a full wipe you can run the following between runs:
```bash
minikube delete
```

> Note: This will require downloading k8s, which can take a little while on a slow network connection.