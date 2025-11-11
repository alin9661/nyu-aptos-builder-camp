# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the NYU Aptos Backend to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured to access your cluster
- Container registry access (Docker Hub, GCR, ECR, etc.)
- Ingress controller installed (nginx-ingress recommended)
- cert-manager installed (optional, for TLS certificates)

## Quick Start

### 1. Create Namespace and Resources

```bash
# Create namespace with resource quotas and limits
kubectl apply -f namespace.yaml

# Create ConfigMap and Secrets
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# Deploy PostgreSQL and Redis
kubectl apply -f postgres.yaml

# Deploy the backend application
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

### 2. Verify Deployment

```bash
# Check all resources in the namespace
kubectl get all -n nyu-aptos

# Check pod status
kubectl get pods -n nyu-aptos

# View logs
kubectl logs -f deployment/nyu-aptos-backend -n nyu-aptos

# Check service endpoints
kubectl get endpoints -n nyu-aptos
```

### 3. Access the Application

```bash
# Port forward for local testing
kubectl port-forward -n nyu-aptos svc/nyu-aptos-backend 3001:80

# Access the application
curl http://localhost:3001/health
```

## Configuration

### Secrets Management

**IMPORTANT:** The default secrets in `secrets.yaml` are base64-encoded placeholders. You MUST update them before deploying to production.

#### Option 1: Manual Secret Creation

```bash
# Create secret from literal values
kubectl create secret generic nyu-aptos-secrets \
  --from-literal=db_user=postgres \
  --from-literal=db_password='your-secure-password' \
  --from-literal=api_key='your-api-key' \
  --from-literal=jwt_secret='your-jwt-secret' \
  -n nyu-aptos
```

#### Option 2: Using External Secrets Operator

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace

# Configure SecretStore (example for AWS Secrets Manager)
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: nyu-aptos
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: nyu-aptos-backend
EOF
```

#### Option 3: Using Sealed Secrets

```bash
# Install Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create and seal a secret
echo -n 'your-password' | kubectl create secret generic nyu-aptos-secrets --dry-run=client --from-file=db_password=/dev/stdin -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml

# Apply sealed secret
kubectl apply -f sealed-secret.yaml -n nyu-aptos
```

### ConfigMap Updates

Update `configmap.yaml` with your environment-specific values:

```yaml
data:
  # Update these values
  cors_origin: "https://your-frontend-domain.com"
  aptos_network: "mainnet"
  aptos_node_url: "https://fullnode.mainnet.aptoslabs.com/v1"
  # ... other values
```

Apply changes:

```bash
kubectl apply -f configmap.yaml
kubectl rollout restart deployment/nyu-aptos-backend -n nyu-aptos
```

## Scaling

### Manual Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment/nyu-aptos-backend --replicas=5 -n nyu-aptos
```

### Horizontal Pod Autoscaler

The HPA is configured in `service.yaml` and will automatically scale based on CPU and memory usage.

```bash
# Check HPA status
kubectl get hpa -n nyu-aptos

# Describe HPA for details
kubectl describe hpa nyu-aptos-backend-hpa -n nyu-aptos
```

## Monitoring

### View Logs

```bash
# Stream logs from all backend pods
kubectl logs -f -l app=nyu-aptos-backend -n nyu-aptos

# View logs from specific pod
kubectl logs -f <pod-name> -n nyu-aptos

# View previous container logs (if pod crashed)
kubectl logs <pod-name> --previous -n nyu-aptos
```

### Health Checks

```bash
# Check health endpoint
kubectl exec -it deployment/nyu-aptos-backend -n nyu-aptos -- curl localhost:3001/health

# Check from outside the cluster
curl https://api.nyuaptos.example.com/health
```

### Resource Usage

```bash
# Top pods
kubectl top pods -n nyu-aptos

# Top nodes
kubectl top nodes

# Describe deployment to see resource requests/limits
kubectl describe deployment nyu-aptos-backend -n nyu-aptos
```

## Database Management

### PostgreSQL Access

```bash
# Port forward to PostgreSQL
kubectl port-forward -n nyu-aptos svc/postgres-service 5432:5432

# Connect using psql
psql -h localhost -U postgres -d nyu_aptos_prod

# Execute SQL commands
kubectl exec -it statefulset/postgres -n nyu-aptos -- psql -U postgres -d nyu_aptos_prod
```

### Database Backup

```bash
# Create backup
kubectl exec -it statefulset/postgres -n nyu-aptos -- \
  pg_dump -U postgres nyu_aptos_prod > backup-$(date +%Y%m%d).sql

# Restore backup
cat backup-20240101.sql | kubectl exec -i statefulset/postgres -n nyu-aptos -- \
  psql -U postgres nyu_aptos_prod
```

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n nyu-aptos

# Check pod logs
kubectl logs <pod-name> -n nyu-aptos

# Get pod events
kubectl get events -n nyu-aptos --sort-by='.lastTimestamp'
```

### Service Not Accessible

```bash
# Check service
kubectl get svc -n nyu-aptos
kubectl describe svc nyu-aptos-backend -n nyu-aptos

# Check endpoints
kubectl get endpoints -n nyu-aptos

# Check ingress
kubectl describe ingress nyu-aptos-backend-ingress -n nyu-aptos
```

### Database Connection Issues

```bash
# Test database connectivity from backend pod
kubectl exec -it deployment/nyu-aptos-backend -n nyu-aptos -- \
  sh -c 'apt-get update && apt-get install -y postgresql-client && \
  psql -h postgres-service -U postgres -d nyu_aptos_prod'
```

## Updates and Rollbacks

### Rolling Update

```bash
# Update image
kubectl set image deployment/nyu-aptos-backend backend=nyu-aptos-backend:v2.0.0 -n nyu-aptos

# Check rollout status
kubectl rollout status deployment/nyu-aptos-backend -n nyu-aptos

# View rollout history
kubectl rollout history deployment/nyu-aptos-backend -n nyu-aptos
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/nyu-aptos-backend -n nyu-aptos

# Rollback to specific revision
kubectl rollout undo deployment/nyu-aptos-backend --to-revision=2 -n nyu-aptos
```

## Cleanup

```bash
# Delete all resources in namespace
kubectl delete namespace nyu-aptos

# Or delete specific resources
kubectl delete -f service.yaml
kubectl delete -f deployment.yaml
kubectl delete -f postgres.yaml
kubectl delete -f configmap.yaml
kubectl delete -f secrets.yaml
kubectl delete -f namespace.yaml
```

## Production Checklist

- [ ] Update all secrets with secure values
- [ ] Configure external database (or ensure PostgreSQL has proper backups)
- [ ] Set up external secret management
- [ ] Configure TLS certificates for Ingress
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Set appropriate resource limits
- [ ] Configure pod disruption budgets
- [ ] Set up backup strategy
- [ ] Configure network policies
- [ ] Review security policies
- [ ] Set up CI/CD pipeline
- [ ] Configure autoscaling thresholds
- [ ] Test disaster recovery procedures

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [External Secrets Operator](https://external-secrets.io/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [cert-manager](https://cert-manager.io/)
