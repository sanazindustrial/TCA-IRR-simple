#!/bin/bash

# Variables
IMAGE_NAME="tcaapi"
TAG="latest"
DOCKER_REGISTRY=" tcairrresgistry-a4bahwbpegfve2gq.azurecr.io"

# Build the Docker image
echo "Building Docker image..."
docker build -t $IMAGE_NAME:$TAG .

# Tag the Docker image
echo "Tagging Docker image..."
docker tag $IMAGE_NAME:$TAG $DOCKER_REGISTRY/$IMAGE_NAME:$TAG

# Push the Docker image to the registry
echo "Pushing Docker image to registry..."
docker push $DOCKER_REGISTRY/$IMAGE_NAME:$TAG

echo "Docker image build and push complete."