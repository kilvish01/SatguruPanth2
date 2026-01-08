#!/bin/bash

# Script to get AWS API Gateway URL from deployed serverless application

cd "$(dirname "$0")/AWS_Backend"

echo "Fetching AWS API Gateway URL..."
echo ""

# Get the API Gateway URL
serverless info --verbose 2>/dev/null | grep "ServiceEndpoint:" | awk '{print $2}'

echo ""
echo "Copy this URL and update it in: src/config/api.config.ts"
