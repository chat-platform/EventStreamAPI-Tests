#!/bin/bash

# Ensure minikube is started
minikube start --driver=docker

# Install test k8s resources
minikube kubectl -- apply -f k8s/

# wait for services to be ready
minikube kubectl -- wait --for=condition=available --timeout=120s deployment/api-test

# run migrations
minikube kubectl -- exec -it service/api-test -- /usr/bin/env DATABASE_URL="postgresql://postgres:1234@localhost:5432/postgres?serverVersion=13&charset=utf8" /application/bin/console doctrine:schema:drop --full-database --force
minikube kubectl -- exec -it service/api-test -- /usr/bin/env DATABASE_URL="postgresql://postgres:1234@localhost:5432/postgres?serverVersion=13&charset=utf8" /application/bin/console doctrine:migrations:migrate --no-interaction

# Start the proxy for our test service
serviceURL=$(minikube service api-test --url)

# Run cucumber
export TEST_TOKEN_A="eyJhbGciOiJSUzI1NiIsImtpZCI6Il9IWDN5UFMwZlJZLWphZVQ1VWl0OHBXRWxDM0RVbFZCbnUyZXNMMnZPVkkifQ.eyJpc3MiOiJ0ZXN0Iiwic3ViIjoidGVzdF9mYWtldGVzdHVzZXIiLCJhdWQiOiJ0ZXN0IiwiaWF0IjoxNjE4MjAxNTk2fQ.LCQwCCynR3trgEjhfDsPyaObqToIy33KNLmnbUoezyBzDzdLeg58xdLytKkB7cliZnQjua0KfZn4F0IX5STOSZGZYFmFYmK1_CXVe9wEWeSpsAvKeGW1uZfm8usAh377GA2wL5mfJARlpUbqtH1_HlhTDYysV7ZwWDQC_7jYRqSpGzAAc8rZlFAP7fEzpitHsb7AY2xcvmUaLedsszcG3HNpmwgIwPMGiJVgLmK95ydGRSGvL82bkOsu13_VVcsoiKydL_dJZ0j60GnCzIXQz5nI_m4qWuCxhLJDL4GKMMkn-0rZ8s36ehIc3jXgIAGIb36hoRh1GVIqa7WLazQ5ng"
export TEST_TOKEN_B="eyJhbGciOiJSUzI1NiIsImtpZCI6Il9IWDN5UFMwZlJZLWphZVQ1VWl0OHBXRWxDM0RVbFZCbnUyZXNMMnZPVkkifQ.eyJpc3MiOiJ0ZXN0Iiwic3ViIjoidGVzdF9vdGhlcmZha2V0ZXN0dXNlciIsImF1ZCI6InRlc3QiLCJpYXQiOjE2MTgyMDE1OTZ9.OohllG4vpFj66F0sHlCg_Hr5hL_SBckwq87QXNRNGCvckk3G5UiUr5Vaqh0QRo1bWICCkmiBy2KauMSS5eR0nEKRdqVjFDiPu6fO7tx3-kfH4XGGDJ0z_S_8HseUu6KgBPUe-Q2m1v216rVs0hFHQ_L-D1iA1aNPYdFpiwW4L2jUFhtvbCWTdMNPjWcqciZsjMV4hVZRtpJsrF8LJFO7rTTDKCNG67pkFM3tP9JBtOTqXCybvXiConw-rK-A-jS9GK3Zj2E1U15ABUOBAY3ljESqgRnoEgF8JsZJ7KQ_Vu1FH5_oZ6CuEeGf2Qobp-vbAzfpcIVVUrHFSUunj1FUng"
export TEST_TARGET="${serviceURL}/api/"

cd "$(dirname "$0")/behavioral" || exit
npm install && ./node_modules/.bin/cucumber-js features/ -r steps/

cd - || exit