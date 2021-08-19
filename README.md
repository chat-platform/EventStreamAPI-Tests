# EventStreamAPI Test Harness

This repository is designed to integration test images of the EventStreamAPI with CucumberJS to ensure they work as intended.

> Note: This also tests the JS SDK for the EventStreamAPI, as it uses it to make the needed requests.

## Requirements
- Minikube with a latest tagged event-stream-api image loaded in
- npm

> An image will not need to be pushed once public images are available.
> In the meantime this will build an image in minikube:
> ```bash
> cd EventStreamAPI/
> eval $(minikube -p minikube docker-env)
> docker build -t event-stream-api:latest .
> ```

## Process

0. Install NPM dependencies and push an image to minikube (WIP)
1. Run test.sh:
   1. Starts minikube if needed
   2. Applies deployments
   3. Wipes the database if needed (ensures idempotency)
   4. Applies DB migrations
   5. Launches CucumberJS test suite