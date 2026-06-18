# EroArchive K3s Deployment Guide

이 가이드는 EroArchive를 K3s 클러스터에 배포하는 방법을 설명합니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [K3s 설치](#k3s-설치)
3. [자동 배포](#자동-배포)
4. [수동 배포](#수동-배포)
5. [공인 IP 접속 설정](#공인-ip-접속-설정)
6. [문제 해결](#문제-해결)
7. [모니터링](#모니터링)

## 사전 요구사항

### 시스템 요구사항

- **OS**: Ubuntu 20.04 LTS 이상 (또는 다른 Linux 배포판)
- **CPU**: 2 cores 이상
- **RAM**: 2GB 이상
- **Disk**: 20GB 이상
- **Network**: 공인 IP 주소

### 필수 도구

```bash
# K3s (자동 설치됨)
# kubectl (K3s에 포함됨)
# Docker (선택사항, 이미지 빌드용)
# Helm (cert-manager 설치용)

# 설치 확인
curl --version
docker --version  # 선택사항
```

## K3s 설치

### 1. 자동 설치 (권장)

```bash
cd /home/ubuntu/erolabs-hub

# 환경 변수 설정
export DOMAIN="your-domain.com"
export EMAIL="your-email@example.com"
export REGISTRY="docker.io"
export IMAGE_NAME="your-username/erolabs-hub"
export IMAGE_TAG="latest"

# 배포 스크립트 실행
bash scripts/k3s-setup.sh
```

### 2. 수동 설치

```bash
# K3s 설치
curl -sfL https://get.k3s.io | K3S_KUBECONFIG_MODE=644 sh -

# K3s 상태 확인
sudo k3s kubectl cluster-info

# kubeconfig 설정
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl cluster-info
```

## 자동 배포

```bash
# 1. 스크립트 실행
bash scripts/k3s-setup.sh

# 2. 스크립트가 자동으로 다음을 수행합니다:
#    - K3s 설치
#    - cert-manager 설치
#    - Docker 이미지 빌드 및 푸시
#    - Kubernetes 네임스페이스 생성
#    - ConfigMap 및 Secret 생성
#    - Deployment 배포
#    - Ingress 설정
#    - HTTPS 인증서 설정

# 3. 배포 상태 확인
kubectl get pods -n erolabs -w
```

## 수동 배포

### 1. Docker 이미지 빌드

```bash
cd /home/ubuntu/erolabs-hub

# 로컬에서 빌드
docker build -t erolabs:latest .

# 또는 레지스트리에 푸시
docker tag erolabs:latest your-registry/erolabs:latest
docker push your-registry/erolabs:latest
```

### 2. Kubernetes 매니페스트 적용

```bash
# 네임스페이스 및 ConfigMap 생성
kubectl apply -f k8s/01-namespace-configmap.yaml

# Secret 생성 (먼저 k8s/02-secrets.yaml 수정)
kubectl apply -f k8s/02-secrets.yaml

# Deployment 배포
kubectl apply -f k8s/03-deployment.yaml

# Service 생성
kubectl apply -f k8s/04-service.yaml

# RBAC 설정
kubectl apply -f k8s/05-rbac.yaml

# Ingress 설정 (먼저 k8s/06-ingress.yaml 수정)
kubectl apply -f k8s/06-ingress.yaml
```

### 3. 배포 상태 확인

```bash
# 모든 리소스 확인
kubectl get all -n erolabs

# Pod 로그 확인
kubectl logs -f deployment/erolabs-app -n erolabs

# 배포 상태 확인
kubectl rollout status deployment/erolabs-app -n erolabs
```

## 공인 IP 접속 설정

### 1. LoadBalancer IP 확인

```bash
kubectl get svc -n erolabs

# 출력 예:
# NAME           TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)
# erolabs-lb     LoadBalancer   10.43.x.x      YOUR_PUBLIC_IP   80:30080/TCP
```

### 2. DNS 설정

공인 IP를 도메인에 연결:

```bash
# DNS A 레코드 추가
# erolabs.example.com  A  YOUR_PUBLIC_IP
# api.erolabs.example.com  A  YOUR_PUBLIC_IP
```

### 3. 방화벽 설정

```bash
# HTTP/HTTPS 포트 열기
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 또는 클라우드 보안 그룹에서 설정
# - 인바운드: 80 (HTTP), 443 (HTTPS)
# - 아웃바운드: 모든 포트
```

### 4. 접속 확인

```bash
# HTTP (자동으로 HTTPS로 리다이렉트)
curl http://erolabs.example.com

# HTTPS
curl https://erolabs.example.com

# 브라우저에서
# https://erolabs.example.com
```

## 문제 해결

### 1. Pod가 시작되지 않음

```bash
# Pod 상태 확인
kubectl describe pod <pod-name> -n erolabs

# Pod 로그 확인
kubectl logs <pod-name> -n erolabs

# 이전 Pod 로그 확인
kubectl logs <pod-name> -n erolabs --previous
```

### 2. 데이터베이스 연결 실패

```bash
# 데이터베이스 서비스 확인
kubectl get svc -n erolabs

# 데이터베이스 연결 테스트
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  sh -c "nc -zv mysql-service 3306"
```

### 3. HTTPS 인증서 발급 실패

```bash
# Certificate 상태 확인
kubectl describe certificate erolabs-cert -n erolabs

# cert-manager 로그 확인
kubectl logs -f deployment/cert-manager -n cert-manager

# ClusterIssuer 상태 확인
kubectl describe clusterissuer letsencrypt-prod
```

### 4. Ingress 접속 불가

```bash
# Ingress 상태 확인
kubectl describe ingress erolabs-ingress -n erolabs

# Traefik 로그 확인
kubectl logs -f deployment/traefik -n kube-system

# DNS 확인
nslookup erolabs.example.com
```

### 5. 공인 IP로 접속 안 됨

```bash
# 1. 방화벽 확인
sudo ufw status
sudo iptables -L -n

# 2. 포트 확인
sudo netstat -tlnp | grep 80
sudo netstat -tlnp | grep 443

# 3. LoadBalancer 상태 확인
kubectl get svc -n erolabs

# 4. 노드 포트 확인
kubectl get nodes -o wide

# 5. 외부에서 접속 테스트
curl -v http://YOUR_PUBLIC_IP
```

## 모니터링

### 1. 기본 모니터링

```bash
# Pod 모니터링
kubectl get pods -n erolabs -w

# 리소스 사용량 확인
kubectl top nodes
kubectl top pods -n erolabs

# 이벤트 확인
kubectl get events -n erolabs --sort-by='.lastTimestamp'
```

### 2. 로그 확인

```bash
# 실시간 로그
kubectl logs -f deployment/erolabs-app -n erolabs

# 특정 Pod 로그
kubectl logs <pod-name> -n erolabs

# 모든 Pod 로그
kubectl logs -f -l app=erolabs -n erolabs
```

### 3. 상태 확인

```bash
# 전체 상태
kubectl get all -n erolabs

# 상세 정보
kubectl describe deployment erolabs-app -n erolabs
kubectl describe pod <pod-name> -n erolabs
```

## 스케일링

### Pod 수 조정

```bash
# 3개에서 5개로 증가
kubectl scale deployment erolabs-app --replicas=5 -n erolabs

# 현재 상태 확인
kubectl get deployment erolabs-app -n erolabs
```

## 업데이트

### 새 버전 배포

```bash
# 1. 새 이미지 빌드 및 푸시
docker build -t your-registry/erolabs:v1.1.0 .
docker push your-registry/erolabs:v1.1.0

# 2. Deployment 업데이트
kubectl set image deployment/erolabs-app \
  erolabs=your-registry/erolabs:v1.1.0 \
  -n erolabs

# 3. 배포 상태 확인
kubectl rollout status deployment/erolabs-app -n erolabs

# 4. 이전 버전으로 롤백 (필요시)
kubectl rollout undo deployment/erolabs-app -n erolabs
```

## 유용한 명령어

```bash
# 네임스페이스 확인
kubectl get ns

# 리소스 확인
kubectl get pods,svc,ingress -n erolabs

# Pod 접속
kubectl exec -it <pod-name> -n erolabs -- sh

# 포트 포워딩
kubectl port-forward svc/erolabs-service 3000:80 -n erolabs

# 설정 확인
kubectl get configmap erolabs-config -n erolabs -o yaml
kubectl get secret erolabs-secrets -n erolabs -o yaml

# 삭제
kubectl delete namespace erolabs
```

## 보안 모범 사례

1. **Secret 관리**: 실제 프로덕션에서는 Sealed Secrets 또는 External Secrets Operator 사용
2. **RBAC**: 최소 권한 원칙 적용
3. **네트워크 정책**: NetworkPolicy로 트래픽 제어
4. **이미지 스캔**: 컨테이너 이미지 보안 스캔
5. **로그 모니터링**: 중앙 집중식 로깅 구성

## 참고 자료

- [K3s 공식 문서](https://docs.k3s.io/)
- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [Traefik 문서](https://doc.traefik.io/traefik/)
- [cert-manager 문서](https://cert-manager.io/docs/)
