# DevSecOps-Jenkins
Jenkins를 활용해 웹서버를 자동으로 배포하는 DevSecOps 프로젝트입니다

Dev, Sec, Ops 등 3단계로 나뉘어져있습니다.

![Project Outline](/architecture.png)

# Dev
## Step1. AWS EC2 인스턴스 배포
Ubuntu 22.04 버전의 AWS t2.large EC2 인스턴스를 실행하고

SSH를 통해 연결합니다.

## Step 2. 업데이트 및 웹 애플리케이션 코드 클론
`sudo apt-get update`

`sudo apt-get upgrade`

`git clone https://github.com/chang9906/DevSecOps-Jenkins.git`

## Step 3. Docker 설치 및 설정
`sudo apt-get install docker.io -y`

`sudo usermod -aG docker $USER  # Replace with System's username`

`newgrp docker`

## Step 4. 컨테이너를 활용해 웹앱 실행
`docker build -t webapp .`

`docker run -d --name webapp -p 8081:80 webapp:latest`

애플리케이션 확인 전, 해당 EC2의 Security Group 에 8081포트 Allow Any

`http://<EC2_PublicIP:8081>`

## Step 5. CI/CD Setup (Jenkins 설치)
`#Java`

`sudo apt update`

`sudo apt install fontconfig openjdk-17-jre`

`java -version`

`openjdk version "17.0.8" 2023-07-18`

`OpenJDK Runtime Environment (build 17.0.8+7-Debian-1deb12u1)`

`OpenJDK 64-Bit Server VM (build 17.0.8+7-Debian-1deb12u1, mixed mode, sharing)`

`#jenkins`

`sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \`

`https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key`

`echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \`

`https://pkg.jenkins.io/debian-stable binary/ | sudo tee \`

`/etc/apt/sources.list.d/jenkins.list > /dev/null`

`sudo apt-get update`

`sudo apt-get install jenkins`

`sudo systemctl start jenkins`

`sudo systemctl enable jenkins`

Jenkins Console 접근

`<Public_IP:8080>`

Passworkd 는 아래를 통해 확인 가능합니다.

`sudo cat var/lib/jenkins/secrets/initialAdminPassword`

## Step 6. Jenkins 플러그인 설치

1. *Manage Jenkins | Plugins | Available Plugins* 
2. 해당 플러그인 설치
    1. Eclipse Temurin Installer
    2. SonarQube Scanner
    3. NodeJS Plugin
    4. Email Extension Plugin
3. Configure Tools
    1. Manage Jenkins | Tools
        1. Auto installation for both JDK and NodeJs
        2. Name them as jdk17, and node16

# Sec
## Step 1. SonarQube 설치 (코드 취약점 분석 툴)

`docker run -d -name sonar -p 9000:9000 sonarqube:lts-community`

`<EC2_Public_IP:9000>`

By default, 아이디와 패스워드는 `admin`입니다.

## Step 2. Trivy 설치 (Docker Image 취약점 스캔 툴)

`sudo apt-get install wget apt-transport-https gnupg lsb-release`

`wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -`

`echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list`

`sudo apt-get update`

`sudo apt-get install trivy`

Test Scanning Docker Image

`trivy image <image_id>`

## Step 3. SonarQube 토큰 생성 
1. SonarQube 대시보드 접속
2. Administration | Security | Users | Token
3. Token 이름 `jenkins`로 지정후, 토큰 복사
4. Jenkins 대시보드 접속
5. Manage Jenkins | Credentials | System | Add Credentials
6. Kind 는 Secret text로 지정후 토큰 붙여넣기

## Step 4. SonarQube 설정
1. Manage Jenkins | Sytsem | SonarQube servers
2. Name: `sonar-server`
3. Server URL: `http://<sonarqubeserverip:9000>/`
4. Authentication Token: `Sonar-token`
5. Manage Jenkins | Tools | SonarQube Scanner
6. Name: `sonar-scanner`
7. Install automatically, and version as default

## Step 5. Pipeline 구축

`pipeline1.yml` 참고

## Step 6. Docker, OWASP Dependency Check 플러그인 설치
1. Manage Jenkins | Plugins | Available Plugins
    1. OWASQP Dependency-Check
    2. Docker
    3. Docker Commons
    4. Docker Pipeline
    5. Docker API
    6. Docker-build-step

## Step 7. Jenkins Credential 설정 (Dockerhub)
1. Manage Jenkins | Credentials | System | Global Credentials | Add Credentials
2. Dockerhub `ID`와 `패스워드` 

## Step 8. Dependency Check & Docker 설정
1. Manage Jenkins | Tools | Dependency-Check installations
    1. Name: DP-Check
    2. Install Auto from Github
2. Docker
    1. Name: docker
    2. Install Auto from docker.com

## Step 9. 파이프라인 수정
이번 수정 사항은 pipeline 이 trivy를 활용하여 Docker Image를 스캔하고, Dependency를 체크하고, Image 생성 후 Docker hub에 Push, 마지막으로 컨테이너를 작동시키는 부분을 추가합니다.

`pipeline2.yml` 참고

Pipeline 돌리기 전, Jenkins가 docker 커맨드를 사용할 수 있도록 권한을 부여해야합니다

`sudo su`

`sudo usermod -aG docker jenkins`

`sudo systsemctl restart jenkins`

# Ops
## Step 1. EC2 인스턴스 배포 (monitoring 용)

모니터링용으로 사용할 t2.medium 리눅스 설치

## Step 2. Prometheus 설치 및 구성(Monitors System Performance)

`sudo apt update`

`sudo apt upgrate`

`sudo useradd --system --no-create-home --shell /bin/false prometheus`

`wget https://github.com/prometheus/prometheus/releases/download/v2.47.1/prometheus-2.47.1.linux-amd64.tar.gz`

`tar -xvf prometheus-2.47.1.linux-amd64.tar.gz`

`cd prometheus-2.47.1.linux-amd64/`

`sudo mkdir -p /data /etc/prometheus`

Prometheus 와 promtool 을 이동시켜 어느 경로에서든 전체 경로를 입력하지 않아도 실행되게끔 합니다

`sudo mv prometheus promtool /usr/local/bin/`

`sudo mv consoles/ console_libraries/ /etc/prometheus/`

`sudo mv prometheus.yml /etc/prometheus/prometheus.yml`

Set Ownership

`sudo chown -R prometheus:prometheus /etc/prometheus/ /data/`

systemd unit configuration 파일 생성

`sudo nano /etc/systemd/system/prometheus.service`

prometheus.service 파일 구성

`prom1.txt` 참고

## Step 3. Prometheus 실행
`sudo systemctl enable prometheus`

`sudo systemctl start prometheus`

해당 경로로 접속
`http://<serverIP:9090>`

## Step 4. Node Exporter 설치

Node exporter 하드웨어 및 OS Metrics을 수집하여 Prometheus 인스턴스에서 스크랩할 수 있는 형식으로 내보내는 서버입니다. 기본적으로 노드 익스포터는 CPU, 메모리, 디스크 사용량과 같은 세부 시스템 메트릭을 수집하여 시스템의 성능과 상태를 모니터링할 수 있게 해줍니다.

`sudo useradd --system --no-create-home --shell /bin/false node_exporter`

`wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz`

`tar -xvf node_exporter-1.6.1.linux-amd64.tar.gz`

`sudo mv node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/`

`rm -rf node_exporter*`

Node Exporter systemd unit config 파일 생성

`sudo nano /etc/systemd/system/node_exporter.service`

node_exporter.service 구성

`node_exporter.txt` 참고

## Step 5. Node Exporter 실행

`sudo systemctl enable node_exporter`

`sudo systemctl start node_exporter`

## Step 6. Pipeline을 모니터링하도록 Prometheus job 추가 (prometheus.yml 수정)

`prom2.txt` 참고

Config Validity 체크

`promtool check config /etc/prometheus/prometheus.yml`

Reload Prometheus

`curl -X POST http://localhost:9090/-/reload`

Prometheus Targets 확인

`http://<your-prometheus-ip>:9090/targets`

## Step 7. Grafana 설치 및 구성 (Query metrics from data sources suchas Prometheus, 시각화)

`sudo apt-get update`

`sudo apt-get install -y apt-transport-https software-properties-common`

`wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -`

`echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list`

`sudo apt-get update`

`sudo apt-get -y install grafana`

## Step 8. Grafana 실행

`sudo systemctl enable grafana-server`

`sudo systemctl start grafana-server`

Grafana 대시보드 접속

`http://<your-server-ip>:3000`

## Step 9. Grafana에 Data Source (Prometheus) 추가

1. 왼쪽 사이드바 기어 아이콘 | Configuration

2. Data Sources | Add data source

3. Prometheus as data source type

4. URL: `http://localhost:9090` 

## Step 10. Pre-configured Jenkins 대시보드 Import
(+) icon | Create | Dashboard | Import

대시보드 코드 입력 (e.g., 9964 for Jenkins)

Load | Prometheus | Import

## Step 11. 이메일 Notification 설정

Gmail 2FA 활성화

3rd Party Application (Jenkins)에 사용될 Gmail App Password 생성

Manage Jenkins | System | E-mail Notifications

SMTP Server : `smtp.gmail.com`

Default user e-mail suffix: `my-email`

Advanced | Use SMTP Authentication | Use SSL

Username: `my-email`

Password: `App Password from Google`

SMTP Port: `465`

Extended E-mail Notification

SMTP Server: `smtp.gmail.com`

SMTP Port: `465`

Credential: `Added credential`

Use SSL

Default Content Type: `HTML`

Triggers: `원하는 알림 기능 설정`

## Step 12. Pipeline에 Post Emails 추가

`pipeline3.yml` 참고

## Step 13. AWS EKS 배포

배포후, 데스크톱 Terminal 열어서 해당 EKS에 kubectl 커맨드 사용하도록 지정

`aws eks update-kubeconfig - -name webapp - -region us-east-1`

## Step 14. ArgoCD 설치 (Local 데스크탑)

## Step 15. Helm 설치 

## Step 16. K8s yaml 파일 구성

`Kubernetes 폴더 내 yml파일 참고`

## Step 16. Prometheus Community Helm Repository 추가

`helm repo add prometheus-community https://prometheus-community.github.io/helm-charts`

## Step 17. Node Exporter의 Namespace 생성

`kubectl create namespace prometheus-node-exporter

## Step 18. Helm을 활용해 Node Exporter 설치

`helm install prometheus-node-exporter prometheus-community/prometheus-node-exporter --namespace prometheus-node-exporter`

## Step 19. Prometheus Configuration 업데이트 (Scraping Metrics from node)

`prom3.txt` 참고

Reload Prometheus

`curl -X POST http://localhost:9090/-/reload`

## Step 20. ArgoCD Server 배포

해당 커맨드 이후, LoadBalancer가 생성될때까지 3분정도 기다려야합니다

`kubectl patch svc argocd-server -n argocd -p ‘{”spec”: {”type”: “LoadBalancer”}}’`

`export ARGOCD_SERVER=’kubectl get svc argocd-server -n argocd -o json | jq --raw-output ‘.status.loadBalancer.ingress[0].hostname’’`

ArgoCD Endpoint 확인

`echo $ARGOCD_SERVER`

ArgoCD Paswword 확인

`echo $ARGO_PWD`

## Step 21. ArgoCD Application 생성
ArgoCD 대시보드에서 git repo 연결

Create ArgoCD Application 

- destination: 어플리케이션 배포 될 목적지

- source: 어플리케이션 source, (GithHub Repo)

- path: K8s yaml 파일 경로 (Kubernetes)

- Destination Namespace: default (`kubectl get ns`)

- syncPolicy: Configure sync policy

Sync 눌러 애플리케이션 배포
