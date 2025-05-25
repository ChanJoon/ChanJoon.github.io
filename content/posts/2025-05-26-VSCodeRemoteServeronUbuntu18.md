---
layout: post
title: VSCode Remote on Ubuntu18.04
date: 2025-05-26
categories: Misc.
tags:
  - linux
math: "true"
---

# Ubuntu18.04 에서 VSCode Remote 접속 불가 해결

Ubuntu18.04 이미지를 이용해 만든 Docker Container 로 VSCode 접속이 안되는 문제 해결법을 정리.

VSCode 문서에 [Can I run VS Code Server on older Linux distributions?](https://code.visualstudio.com/docs/remote/faq#_can-i-run-vs-code-server-on-older-linux-distributions) 로 정리된 내용을 따라해도 잘 해결이 안되었다가, [티스토리 게시물](https://unused.tistory.com/entry/Ubuntu-1804-%EB%93%B1-%EA%B5%AC%EB%B2%84%EC%A0%84%EC%97%90%EC%84%9C-Visual-Studio-Code-%EC%97%B0%EB%8F%99-%EB%B6%88%EA%B0%80-%ED%95%B4%EA%B2%B0%ED%95%98%EA%B8%B0) 을 보고 추가적으로 몇가지 수정해주니 해결되었음..

일단 `docker exec -it <container name> bash` 로 컨테이너에 접속을 해주자.

## Shell Scripts

그리고 `/var/tmp` 에 아래 3가지 스크립트를 작성해둔다. `nano, gedit, ...` 등으로 복붙하고 스크립트 이름은 맘대로~

###  install_ct-ng.sh

```shell
#!/bin/bash

# ───────────────────────────────────────────────────────────────────────
# root 권한 체크
if [ "$EUID" -ne 0 ]; then
  echo "오류: 이 스크립트는 root 유저로만 실행할 수 있습니다." >&2
  echo "Error: This script could ONLY be run by the root user." >&2
  exit 1
fi
# ───────────────────────────────────────────────────────────────────────

# 업데이트 및 패키지 준비
apt-get update
apt-get install -y tree gcc g++ gperf bison flex texinfo help2man make libncurses5-dev python3-dev autoconf automake libtool libtool-bin gawk wget bzip2 xz-utils unzip patch rsync meson ninja-build

# 초기 디렉터리 생성
mkdir -p /vscode-sysroot
mkdir -p /toolchain-dir
cd /toolchain-dir

# Patchelf 다운로드 및 적용
wget https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0-x86_64.tar.gz \
 && mkdir -p patchelf-0.18.0-x86_64 \
 && tar -xzvf patchelf-0.18.0-x86_64.tar.gz -C patchelf-0.18.0-x86_64 \
 && mv patchelf-0.18.0-x86_64/bin/patchelf /usr/local/bin/
cd /toolchain-dir

# 크로스-빌드 툴체인
wget http://crosstool-ng.org/download/crosstool-ng/crosstool-ng-1.26.0.tar.bz2
tar -xjf crosstool-ng-1.26.0.tar.bz2
cd crosstool-ng-1.26.0 && ./configure --prefix=/crosstool-ng-1.26.0/out && make && make install
chmod -R a+rX /crosstool-ng-1.26.0/out

# (1) ~/.profile 끝에 export 구문이 없으면 추가
grep -qxF 'export PATH=$PATH:/crosstool-ng-1.26.0/out/bin' ~/.profile \
  || echo 'export PATH=$PATH:/crosstool-ng-1.26.0/out/bin' >> ~/.profile
source ~/.profile

# (2) /etc/profile 끝에 export 구문이 없으면 추가
grep -qxF 'export PATH=$PATH:/crosstool-ng-1.26.0/out/bin' /etc/profile \
  || echo 'export PATH=$PATH:/crosstool-ng-1.26.0/out/bin' >> /etc/profile

# (3) /etc/environment 끝에 추가
echo 'PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/crosstool-ng-1.26.0/out/bin"' >> /etc/environment
cd /toolchain-dir

# 권한 관련 정리 (root외의 유저들을 위함)
# 특수한 필요가 있을 경우 권한은 직접 설정하세요.
chmod -R a+rX /vscode-sysroot
chmod a+x /usr/local/bin/patchelf

# 여기서 잠시 root를 나와야 합니다.
# 스크립트 part 2(ct-ng build)의 실행 완료 후, 다시 root로 들어와서 계속.
echo "스크립트 part 1 실행 완료." >&2
echo "여기서 잠시 root를 나와야 합니다. 일반 유저로 스크립트 part 2를 실행해주세요." >&2
echo "Part 1 of the script completed." >&2
echo "You need to exit root for now. Run part 2 as an unprivileged user." >&2
```

### glibc.sh

```shell
#!/bin/bash

# ───────────────────────────────────────────────────────────────────────
# 일반 유저 권한 체크
if [ "$EUID" -eq 0 ]; then
  echo "오류: 이 스크립트는 일반 유저로만 실행할 수 있습니다. root는 안됩니다." >&2
  echo "Error: This script could NOT be run by the root user." >&2
  exit 1
fi
# ───────────────────────────────────────────────────────────────────────
# ct-ng 사용 가능 여부 체크
if ! which ct-ng > /dev/null; then
  echo "오류: ct-ng가 설치되어 있지 않습니다. 설치 후 다시 시도해 주세요." >&2
  echo "Error: ct-ng is not installed. Please install it and try again." >&2
  exit 1
fi
# ───────────────────────────────────────────────────────────────────────
# 실행 시간 관련 경고 및 confirmation
echo "경고: 이 작업은 프로세서 성능에 따라 20분-50분 정도 소요됩니다. 계속할까요? (y/n)" >&2
echo "Warning: This task may take between 10 to 50 minutes, depending on your processor performance. Proceed? (y/n)" >&2
read -r user_input
if [[ "$user_input" != "y" && "$user_input" != "Y" ]]; then
  echo "중단합니다. Aborting." >&2
  exit 1
fi
# ───────────────────────────────────────────────────────────────────────

# .config 다운로드 및 ct-ng build
# 주의: 시간이 상당히 걸리는 작업입니다 (약 20분-50분).
mkdir -p /var/tmp/glibcbuild
cd /var/tmp/glibcbuild
wget https://raw.githubusercontent.com/microsoft/vscode-linux-build-agent/refs/heads/main/x86_64-gcc-8.5.0-glibc-2.28.config
cp x86_64-gcc-8.5.0-glibc-2.28.config .config
ct-ng build

# 스크립트 part 2(ct-ng build)의 실행 완료 후, 다시 root로 들어와서 계속.
echo "스크립트 part 2 실행 완료." >&2
echo "다시 root로 들어와 스크립트 part 3을 실행해주세요." >&2
echo "Part 2 of the script completed." >&2
echo "Return to root and run part 3 to continue." >&2
```

### setup.sh
```shell
#!/bin/bash

# 스크립트 part 2(ct-ng build)의 실행 완료 후, 다시 root로 들어와서 계속합니다.

# ───────────────────────────────────────────────────────────────────────
# root 권한 체크
if [ "$EUID" -ne 0 ]; then
  echo "오류: 이 스크립트는 root 유저로만 실행할 수 있습니다." >&2
  echo "Error: This script could ONLY be run by the root user." >&2
  exit 1
fi
# ───────────────────────────────────────────────────────────────────────
# ───────────────────────────────────────────────────────────────────────
# /var/tmp/glibcbuild 디렉터리 유무 확인
if [ ! -d /var/tmp/glibcbuild/x86_64-linux-gnu/x86_64-linux-gnu/sysroot ] || [ -z "$(ls -A /var/tmp/glibcbuild/x86_64-linux-gnu/x86_64-linux-gnu/sysroot)" ]; then
  echo "오류: /var/tmp/glibcbuild내 커스텀 sysroot가 없어 진행이 불가능합니다." >&2
  echo "Error: No custom sysroot in the directory '/var/tmp/glibcbuild'." >&2
  exit 1
fi
# ───────────────────────────────────────────────────────────────────────

# ct-ng build후 빌드 결과물 이동
cp -r /var/tmp/glibcbuild/x86_64-linux-gnu/x86_64-linux-gnu/sysroot/* /vscode-sysroot
cd /toolchain-dir

# 환경변수 적용 /etc/profile.d/vscode-glibc.sh
echo 'export VSCODE_SERVER_CUSTOM_GLIBC_LINKER=/vscode-sysroot/lib/ld-linux-x86-64.so.2' > /etc/profile.d/vscode-glibc.sh
echo 'export VSCODE_SERVER_CUSTOM_GLIBC_PATH=/vscode-sysroot/lib:/vscode-sysroot/usr/lib' >> /etc/profile.d/vscode-glibc.sh
echo 'export VSCODE_SERVER_PATCHELF_PATH=/usr/local/bin/patchelf' >> /etc/profile.d/vscode-glibc.sh

# 환경변수 적용 /etc/environment
echo 'VSCODE_SERVER_CUSTOM_GLIBC_LINKER=/vscode-sysroot/lib/ld-linux-x86-64.so.2' >> /etc/environment
echo 'VSCODE_SERVER_CUSTOM_GLIBC_PATH=/vscode-sysroot/lib:/vscode-sysroot/usr/lib' >> /etc/environment
echo 'VSCODE_SERVER_PATCHELF_PATH=/usr/local/bin/patchelf' >> /etc/environment

# 권한 관련 정리 (root외의 유저들을 위함)
# 특수한 필요가 있을 경우 권한은 직접 설정하세요.
chmod -R a+rX /vscode-sysroot
chmod a+x /usr/local/bin/patchelf

# 스크립트 part 3 실행 완료
echo "스크립트 part 3 실행 완료." >&2
echo "이제 Visual Studio Code에서 Remote-SSH를 통하여 접속을 시도해주세요. 만약 안될 경우, 이 머신을 재부팅하여 다시 시도해주세요." >&2
echo "Part 3 of the script completed." >&2
echo "Now you can try connecting from Visual Studio Code with Remote - SSH. Try again by rebooting this machine if it does not take any effect." >&2
```

### How to use

1. 이렇게 위 3개의 스크립트를 저장해둔다.
2. `chmod +x <script name>.sh` 로 권한을 부여해준다.
3. `sudo su` 로 컨테이너 내 root 로 접속 후, 스크립트 1번 실행
4. `exit` 로 컨테이너 사용자 계정으로 전환 후, 스크립트 2번 실행

>[!warning] 2번 스크립트 실행 시 에러 해결법
>1. `ct-ng` 인식 안되는 경우
>	이 때는 다시 `sudo su` 로 접속해서 `which ct-ng` 로 경로를 파악한다.
>	그리고 일반 사용자로 돌아가서 해당 경로를 .bashrc 에 추가한다.
>	주의할 점은, 모든 경로를 넣는게 아니라 ~/bin 까지만 해서 실행파일 상위 경로로 해주어야 함.
>```bash
>echo 'export PATH=/crosstool-ng-1.26.0/out/bin:$PATH' >> ~/.bashrc
>source ~/.bashrc
>```
>2. LD_LIBRARY_PATH 등 존재한다는 에러 발생 시
>```bash
># 에러난 해당 환경변수를 아래와 같이 제거
>unset LD_LIBRARY_PATH
>```

5. 그 후, 다시 `sudo su` 로 root 계정 들어간 후, 스크립트 3번 실행

최종적으로는 Remotes 의 Tunnels/SSH 로 들어가서 IP 로 접속해야 한다.
컨테이너 IP / Port 할당하는 거는 ask to chatGPT