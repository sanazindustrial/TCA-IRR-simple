#!/bin/bash

# Variables
IMAGE_NAME="tcaapi"
TAG="latest"
DOCKER_REGISTRY=" tcairrresgistry-a4bahwbpegfve2gq.azurecr.io"

# Build the Docker image
echo "do 'az login' first if not logged in"

echo "Building Docker image..."
docker build -t $IMAGE_NAME:$TAG .

# Tag the Docker image
echo "Tagging Docker image..."
docker tag $IMAGE_NAME:$TAG $DOCKER_REGISTRY/$IMAGE_NAME:$TAG

# Push the Docker image to the registry
echo "Pushing Docker image to registry..."
docker push $DOCKER_REGISTRY/$IMAGE_NAME:$TAG

echo "Docker image build and push complete."

echo "Deploying UI"


az webapp deploy --name TCA-IRR --resource-group DEV  --src-path .\ui.zip 

7z a -tzip ui.zip . -xr!.azure -xr!__pycache__ -xr!.github -xr!.git -xr!snapshots -xr!.vscode -xr!node_modules #-xr!excluded_file
