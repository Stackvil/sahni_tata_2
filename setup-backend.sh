#!/bin/bash

# Backend Setup Script for Sahni Tata Project
# This script helps set up the backend Docker container

echo "=== Sahni Backend Setup ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running. Please start Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Stop existing container if running
if docker ps -a | grep -q sahni-backend; then
    echo -e "${YELLOW}Stopping existing sahni-backend container...${NC}"
    docker stop sahni-backend 2>/dev/null
    docker rm sahni-backend 2>/dev/null
    echo -e "${GREEN}✓ Existing container removed${NC}"
fi

# Pull Docker image
echo ""
echo -e "${YELLOW}Pulling Docker image: luffyzolo/stackvil:dhoni${NC}"
docker pull luffyzolo/stackvil:dhoni

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to pull Docker image${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker image pulled successfully${NC}"

# Run Docker container
echo ""
echo -e "${YELLOW}Starting backend container...${NC}"
docker run -d \
  -p 8000:8000 \
  --name sahni-backend \
  --restart unless-stopped \
  -e PYTHONUNBUFFERED=1 \
  luffyzolo/stackvil:dhoni

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to start Docker container${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend container started${NC}"

# Wait for container to be ready
echo ""
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
sleep 5

# Check if container is running
if docker ps | grep -q sahni-backend; then
    echo -e "${GREEN}✓ Container is running${NC}"
else
    echo -e "${RED}Error: Container is not running. Check logs:${NC}"
    docker logs sahni-backend
    exit 1
fi

# Test the API
echo ""
echo -e "${YELLOW}Testing backend API...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs | grep -q "200"; then
    echo -e "${GREEN}✓ Backend API is accessible at http://localhost:8000${NC}"
else
    echo -e "${YELLOW}⚠ Backend might still be starting. Wait a few seconds and check:${NC}"
    echo "  curl http://localhost:8000/docs"
fi

# Show container info
echo ""
echo -e "${GREEN}=== Backend Setup Complete ===${NC}"
echo ""
echo "Container Name: sahni-backend"
echo "Port: 8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Useful commands:"
echo "  View logs:    docker logs -f sahni-backend"
echo "  Stop:         docker stop sahni-backend"
echo "  Start:        docker start sahni-backend"
echo "  Restart:      docker restart sahni-backend"
echo "  Remove:       docker stop sahni-backend && docker rm sahni-backend"
echo ""

