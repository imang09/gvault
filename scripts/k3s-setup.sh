#!/bin/bash

# K3s Setup Script for EroArchive
# This script sets up a K3s cluster and deploys the EroArchive application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
K3S_VERSION="${K3S_VERSION:-latest}"
DOMAIN="${DOMAIN:-erolabs.example.com}"
EMAIL="${EMAIL:-admin@example.com}"
REGISTRY="${REGISTRY:-docker.io}"
IMAGE_NAME="${IMAGE_NAME:-erolabs/erolabs-hub}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
NAMESPACE="erolabs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker is not installed. K3s will use containerd."
    fi
    
    log_success "Prerequisites check passed"
}

# Install K3s
install_k3s() {
    log_info "Installing K3s..."
    
    if command -v k3s &> /dev/null; then
        log_warning "K3s is already installed"
        return
    fi
    
    curl -sfL https://get.k3s.io | K3S_KUBECONFIG_MODE=644 sh -
    
    # Wait for K3s to be ready
    log_info "Waiting for K3s to be ready..."
    sleep 10
    
    # Verify K3s is running
    if ! kubectl cluster-info &> /dev/null; then
        log_error "K3s failed to start"
        exit 1
    fi
    
    log_success "K3s installed successfully"
}

# Install cert-manager for HTTPS
install_cert_manager() {
    log_info "Installing cert-manager..."
    
    # Add Jetstack Helm repository
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    
    # Install or upgrade cert-manager
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --set installCRDs=true \
        --set global.leaderElection.namespace=cert-manager
    
    # Wait for cert-manager to be ready
    kubectl wait --for=condition=ready pod \
        -l app.kubernetes.io/instance=cert-manager \
        -n cert-manager \
        --timeout=300s
    
    log_success "cert-manager installed successfully"
}

# Create ClusterIssuer for Let's Encrypt
create_cluster_issuer() {
    log_info "Creating ClusterIssuer for Let's Encrypt..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${EMAIL}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: traefik
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: ${EMAIL}
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
      - http01:
          ingress:
            class: traefik
EOF
    
    log_success "ClusterIssuer created successfully"
}

# Build Docker image and load directly into K3s
build_and_load_image() {
    log_info "Building Docker image..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Cannot build image."
        exit 1
    fi
    
    docker build -t erolabs:latest .
    
    log_info "Loading Docker image into K3s (No external registry needed)..."
    docker save erolabs:latest | k3s ctr images import -
    
    log_success "Docker image built and loaded into K3s successfully"
}

# Create namespace and secrets
setup_namespace_and_secrets() {
    log_info "Setting up namespace and secrets..."
    
    # Create namespace
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply ConfigMap and Secrets
    log_info "Applying ConfigMap..."
    kubectl apply -f k8s/01-namespace-configmap.yaml
    
    log_info "Applying Secrets..."
    # Note: You should manually update k8s/02-secrets.yaml with real values
    # or use a secret management tool
    kubectl apply -f k8s/02-secrets.yaml
    
    log_success "Namespace and secrets created"
}

# Deploy application
deploy_application() {
    log_info "Deploying EroArchive application..."
    
    # Using local image, no need to replace image name in deployment
    # sed -i "s|erolabs:latest|${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}|g" k8s/03-deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/03-deployment.yaml
    kubectl apply -f k8s/04-service.yaml
    kubectl apply -f k8s/05-rbac.yaml
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    kubectl rollout status deployment/erolabs-app -n ${NAMESPACE} --timeout=5m
    
    log_success "Application deployed successfully"
}

# Setup Ingress
setup_ingress() {
    log_info "Setting up Ingress..."
    
    # Update domain in ingress
    sed -i "s|erolabs.example.com|${DOMAIN}|g" k8s/06-ingress.yaml
    sed -i "s|api.erolabs.example.com|api.${DOMAIN}|g" k8s/06-ingress.yaml
    
    # Apply Ingress
    kubectl apply -f k8s/06-ingress.yaml
    
    log_success "Ingress configured successfully"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pods
    log_info "Checking pods..."
    kubectl get pods -n ${NAMESPACE}
    
    # Check services
    log_info "Checking services..."
    kubectl get svc -n ${NAMESPACE}
    
    # Check ingress
    log_info "Checking ingress..."
    kubectl get ingress -n ${NAMESPACE}
    
    # Get LoadBalancer IP
    log_info "Getting LoadBalancer IP..."
    EXTERNAL_IP=$(kubectl get svc erolabs-lb -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    
    if [ "$EXTERNAL_IP" != "pending" ]; then
        log_success "Application is accessible at http://${EXTERNAL_IP}"
    else
        log_warning "LoadBalancer IP is still pending. Check with: kubectl get svc -n ${NAMESPACE}"
    fi
    
    log_success "Deployment verified"
}

# Show status
show_status() {
    log_info "Cluster Status:"
    echo "==============="
    kubectl get nodes
    echo ""
    echo "Namespace: ${NAMESPACE}"
    kubectl get all -n ${NAMESPACE}
    echo ""
    echo "Ingress:"
    kubectl get ingress -n ${NAMESPACE}
}

# Main execution
main() {
    log_info "Starting K3s setup for EroArchive..."
    echo ""
    
    check_prerequisites
    install_k3s
    install_cert_manager
    create_cluster_issuer
    build_and_load_image
    setup_namespace_and_secrets
    deploy_application
    setup_ingress
    verify_deployment
    show_status
    
    log_success "K3s setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update your domain DNS to point to the LoadBalancer IP"
    echo "2. Wait for Let's Encrypt certificate to be issued (check: kubectl get certificate -n ${NAMESPACE})"
    echo "3. Access your application at https://${DOMAIN}"
    echo ""
    echo "Useful commands:"
    echo "  kubectl get pods -n ${NAMESPACE} -w                    # Watch pods"
    echo "  kubectl logs -f deployment/erolabs-app -n ${NAMESPACE} # View logs"
    echo "  kubectl describe pod <pod-name> -n ${NAMESPACE}        # Describe pod"
    echo "  kubectl exec -it <pod-name> -n ${NAMESPACE} -- sh      # Shell into pod"
}

# Run main function
main "$@"
