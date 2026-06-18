# EroArchive K3s 배포 가이드 (빠른 시작)

## 개요

이 가이드는 EroArchive를 K3s 클러스터에 배포하여 공인 IP로 접속 가능하게 하는 방법을 설명합니다.

**주요 개선사항:**
- ✅ Docker 멀티스테이지 빌드로 이미지 최적화
- ✅ K3s 기반 Kubernetes 배포
- ✅ Traefik Ingress로 공인 IP 접속 지원
- ✅ Let's Encrypt HTTPS 자동 설정
- ✅ 헬스 체크 및 자동 재시작
- ✅ 롤링 업데이트로 무중단 배포

## 빠른 시작 (5분)

### 1단계: 서버 준비

```bash
# Ubuntu 20.04 LTS 이상 필요
# SSH로 서버 접속
ssh ubuntu@YOUR_PUBLIC_IP

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y curl git docker.io
```

### 2단계: 코드 클론

```bash
# GitHub에서 코드 클론
git clone https://github.com/YOUR_USERNAME/erolabs-hub.git
cd erolabs-hub
```

### 3단계: 환경 설정

```bash
# 환경 변수 설정
export DOMAIN="your-domain.com"           # 실제 도메인으로 변경
export EMAIL="your-email@example.com"     # 실제 이메일로 변경
export REGISTRY="docker.io"               # Docker Hub 또는 다른 레지스트리
export IMAGE_NAME="your-username/erolabs" # 실제 이미지 이름으로 변경
export IMAGE_TAG="latest"

# 환경 변수 저장 (선택사항)
echo "export DOMAIN=$DOMAIN" >> ~/.bashrc
echo "export EMAIL=$EMAIL" >> ~/.bashrc
```

### 4단계: 자동 배포

```bash
# K3s 설치 및 배포 스크립트 실행
bash scripts/k3s-setup.sh

# 스크립트가 자동으로 다음을 수행합니다:
# 1. K3s 설치
# 2. cert-manager 설치 (HTTPS 지원)
# 3. Docker 이미지 빌드 및 푸시
# 4. Kubernetes 네임스페이스 생성
# 5. 애플리케이션 배포
# 6. Ingress 설정
# 7. HTTPS 인증서 자동 발급
```

### 5단계: DNS 설정

```bash
# 도메인 DNS A 레코드를 공인 IP로 설정
# 예: erolabs.example.com  A  YOUR_PUBLIC_IP

# DNS 전파 확인 (5-30분 소요)
nslookup erolabs.example.com
```

### 6단계: 접속 확인

```bash
# 브라우저에서 접속
# https://erolabs.example.com

# 또는 curl로 확인
curl https://erolabs.example.com
```

## 상세 설정

### Docker 이미지 빌드

```bash
# 로컬 빌드
docker build -t erolabs:latest .

# 레지스트리에 푸시
docker tag erolabs:latest your-registry/erolabs:latest
docker push your-registry/erolabs:latest
```

### Kubernetes 매니페스트 수정

**k8s/02-secrets.yaml** 수정 (필수):

```yaml
# 실제 값으로 변경
DATABASE_URL: "mysql://user:password@mysql-service:3306/erolabs"
JWT_SECRET: "your-actual-jwt-secret"
OAUTH_SERVER_URL: "https://your-oauth-server.com"
# ... 기타 설정값
```

**k8s/06-ingress.yaml** 수정:

```yaml
# 도메인 변경
- host: your-domain.com
- host: api.your-domain.com
```

### 수동 배포 (자동 스크립트 실패 시)

```bash
# 1. K3s 설치
curl -sfL https://get.k3s.io | K3S_KUBECONFIG_MODE=644 sh -

# 2. kubeconfig 설정
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# 3. Helm 설치
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 4. cert-manager 설치
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace --set installCRDs=true

# 5. Kubernetes 매니페스트 적용
kubectl apply -f k8s/

# 6. 상태 확인
kubectl get all -n erolabs
```

## 공인 IP 접속 문제 해결

### 문제: "연결할 수 없음" 오류

```bash
# 1. 방화벽 확인
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 2. LoadBalancer 상태 확인
kubectl get svc -n erolabs

# 3. Pod 상태 확인
kubectl get pods -n erolabs

# 4. 로그 확인
kubectl logs -f deployment/erolabs-app -n erolabs
```

### 문제: HTTPS 인증서 발급 실패

```bash
# 1. Certificate 상태 확인
kubectl describe certificate erolabs-cert -n erolabs

# 2. cert-manager 로그 확인
kubectl logs -f deployment/cert-manager -n cert-manager

# 3. DNS 확인
nslookup erolabs.example.com

# 4. Let's Encrypt 상태 확인
kubectl describe clusterissuer letsencrypt-prod
```

### 문제: 데이터베이스 연결 실패

```bash
# 1. 데이터베이스 서비스 확인
kubectl get svc -n erolabs

# 2. 데이터베이스 연결 테스트
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  sh -c "nc -zv mysql-service 3306"

# 3. Secret 확인
kubectl get secret erolabs-secrets -n erolabs -o yaml
```

## 모니터링 및 관리

### 실시간 모니터링

```bash
# Pod 모니터링
kubectl get pods -n erolabs -w

# 로그 확인
kubectl logs -f deployment/erolabs-app -n erolabs

# 리소스 사용량
kubectl top pods -n erolabs
```

### 스케일링

```bash
# Pod 수 증가 (3개 → 5개)
kubectl scale deployment erolabs-app --replicas=5 -n erolabs

# 현재 상태 확인
kubectl get deployment erolabs-app -n erolabs
```

### 업데이트

```bash
# 새 이미지로 업데이트
kubectl set image deployment/erolabs-app \
  erolabs=your-registry/erolabs:v1.1.0 \
  -n erolabs

# 배포 상태 확인
kubectl rollout status deployment/erolabs-app -n erolabs

# 이전 버전으로 롤백
kubectl rollout undo deployment/erolabs-app -n erolabs
```

## 유용한 명령어

```bash
# 전체 상태 확인
kubectl get all -n erolabs

# Pod 접속
kubectl exec -it <pod-name> -n erolabs -- sh

# 포트 포워딩 (로컬 테스트용)
kubectl port-forward svc/erolabs-service 3000:80 -n erolabs

# 설정 확인
kubectl get configmap erolabs-config -n erolabs -o yaml

# 이벤트 확인
kubectl get events -n erolabs --sort-by='.lastTimestamp'

# 네임스페이스 삭제 (모든 리소스 제거)
kubectl delete namespace erolabs
```

## 성능 최적화

### 리소스 제한 조정

**k8s/03-deployment.yaml**에서 수정:

```yaml
resources:
  requests:
    cpu: 200m        # 최소 CPU
    memory: 256Mi    # 최소 메모리
  limits:
    cpu: 500m        # 최대 CPU
    memory: 512Mi    # 최대 메모리
```

### 자동 스케일링 (HPA)

```bash
# HPA 설정
kubectl autoscale deployment erolabs-app \
  --min=2 --max=10 \
  --cpu-percent=70 \
  -n erolabs

# HPA 상태 확인
kubectl get hpa -n erolabs
```

## 보안 모범 사례

1. **Secret 관리**: 프로덕션에서는 Sealed Secrets 또는 External Secrets Operator 사용
2. **RBAC**: 최소 권한 원칙 적용 (이미 설정됨)
3. **네트워크 정책**: NetworkPolicy로 트래픽 제어
4. **이미지 스캔**: 컨테이너 이미지 보안 스캔
5. **로그 모니터링**: 중앙 집중식 로깅 구성

## 다음 단계

1. **모니터링 추가**: Prometheus + Grafana 설치
2. **로깅 추가**: ELK Stack 또는 Loki 설치
3. **CI/CD 구성**: GitHub Actions로 자동 배포
4. **백업 설정**: 정기적인 데이터베이스 백업
5. **성능 최적화**: 캐싱, CDN 설정

## 참고 자료

- [K3s 공식 문서](https://docs.k3s.io/)
- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [Traefik 문서](https://doc.traefik.io/traefik/)
- [cert-manager 문서](https://cert-manager.io/docs/)

## 지원

문제가 발생하면:

1. 로그 확인: `kubectl logs -f deployment/erolabs-app -n erolabs`
2. 이벤트 확인: `kubectl get events -n erolabs`
3. Pod 상태 확인: `kubectl describe pod <pod-name> -n erolabs`
4. GitHub Issues에서 도움 요청
