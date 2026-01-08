#!/bin/bash

# Install production dependencies
npm install --production

# Create deployment package
zip -r book-reader-backend.zip . -x "*.git*" "node_modules/.cache/*" "*.env*"

echo "Deployment package created: book-reader-backend.zip"
echo "Upload this to AWS Lambda manually"