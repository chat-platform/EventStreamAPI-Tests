#!/bin/bash

# Ensure minikube is started
minikube start --driver=docker

# Install test k8s resources
minikube kubectl -- apply -f k8s/

# wait for services to be ready
echo "Waiting for services to be online..."
minikube kubectl -- wait --for=condition=available --timeout=120s deployment/api-test

# run migrations
minikube kubectl -- exec -it service/api-test -- /application/bin/console doctrine:schema:drop --full-database --force
minikube kubectl -- exec -it service/api-test -- /application/bin/console doctrine:migrations:migrate --no-interaction
minikube kubectl -- exec -it service/api-test -- /application/bin/console esa:create-transport "test-transport" "$TRANSPORT_PUBLIC_KEY"

# ensure test runner is started
minikube kubectl -- wait --for=condition=available --timeout=120s deployment/behavioral-tests

# copy tests to runner
minikube kubectl -- exec deploy/behavioral-tests -- mkdir -p behavioral
tar cf - behavioral | minikube kubectl -- exec -i  deploy/behavioral-tests -- tar xf - -C ./

# Run tests
minikube kubectl -- exec -it deploy/behavioral-tests -- /bin/bash -c "cd behavioral && npm install && ./node_modules/.bin/cucumber-js features/ -r steps/ --publish-quiet"
