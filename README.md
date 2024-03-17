# DevSecOps-Jenkins
Jenkins를 활용해 웹서버를 자동으로 배포하는 DevSecOps 프로젝트입니다

## Step1. AWS EC2 인스턴스 배포
Ubuntu 22.04 버전의 AWS t2.large EC2 인스턴스를 실행하고
SSH를 통해 연결합니다.

## Step 2. 업데이트 및 웹 애플리케이션 코드 클론
`sudo apt-get update`
`sudo apt-get upgrade`
`git clone https://
