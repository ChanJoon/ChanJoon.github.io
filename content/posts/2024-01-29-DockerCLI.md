---
layout: post
title: Docker 명령어 정리
date: 2024-01-29
categories: Misc.
tags: 
math: "true"
---
## Docker 명령어 정리

Docker 컨테이너로 ROS 와 PX4, Gazebo 환경 세팅을 위해 필요한 명령어들 정리

`docker pull` 로 받은 이미지 목록 보기

```bash
$ docker image ls
REPOSITORY                 TAG       IMAGE ID       CREATED       SIZE
px4io/px4-dev-ros-noetic   latest    ad0ab2de7611   8 weeks ago   4.79GB
```

컨테이너 목록, 이전에 만들어진 목록까지 모두 보기

```bash
$ docker container ls -a
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

실행 중인 컨테이너에 `sudo` 권한으로 접근하려면 ID=0 으로 접근한다. (`docker run` 할 때 `-u 0` 을 붙여줘도 된다.)

```bash
docker exec -u 0 -it px4-ros bash
```

`passwd root` 로 비밀번호 변경해주면 이후에는 필요할 때 입력해도 된다.

## Docker Container 에서 PX4 사용하기

[공식 문서](https://docs.px4.io/main/en/test_and_ci/docker.html) 에 잘 나와있으나 한번 싹 정리.

```
docker run -it --privileged \
--env=LOCAL_USER_ID="$(id -u)" \
-v ~/src/PX4-Autopilot:/src/PX4-Autopilot/:rw \
-v /tmp/.X11-unix:/tmp/.X11-unix:ro \
-e DISPLAY=:0 \
--network host \
--name=px4-ros px4io/px4-dev-ros-noetic:latest bash
```

>[!error]
>기존 [[2023-09-15-PX4AutopilotInstallation|PX4-Autopilot]] 소스코드를 마운트하여 사용하기 때문에, 이미 빌드된 파일을 사용할 수 없는 문제가 있다. `rm -rf ./build` 로 빌드 제거 후 `make px4_sitl gazebo-classic` 으로 다시 빌드해주어야 한다.

그래서 마운트 없이 아래 명령어로 실행.

```bash
docker run -it --privileged \
--env=LOCAL_USER_ID="$(id -u)" \
-v /tmp/.X11-unix:/tmp/.X11-unix:ro \
-e DISPLAY=:0 \
--network host \
--name=px4-ros px4io/px4-dev-ros-noetic:latest bash
```

[[2023-09-15-PX4AutopilotInstallation|PX4-Autopilot]] 을 별도로 설치하면 빌드도 다시 해주어야 한다.

```bash
git clone https://github.com/PX4/PX4-Autopilot.git --recursive
bash ./PX4-Autopilot/Tools/setup/ubuntu.sh --no-nuttx
 
docker restart <container-id>
```

`git config --global --add safe.directory /home/user/PX4-Autopilot` 입력해준 후 `make px4_sitl gazebo-classic`

빌드 과정에서 아래 에러 발생

```bash
[30/970] Generating git version header
FAILED: src/lib/version/build_git_version.h 
cd /home/user/PX4-Autopilot && /usr/bin/python3 /home/user/PX4-Autopilot/src/lib/version/px_update_git_header.py /home/user/PX4-Autopilot/build/px4_sitl_default/src/lib/version/build_git_version.h --validate
Traceback (most recent call last):
  File "/home/user/PX4-Autopilot/src/lib/version/px_update_git_header.py", line 124, in <module>
    mavlink_git_version = subprocess.check_output('git rev-parse --verify HEAD'.split(),
  File "/usr/lib/python3.8/subprocess.py", line 415, in check_output
    return run(*popenargs, stdout=PIPE, timeout=timeout, check=True,
  File "/usr/lib/python3.8/subprocess.py", line 516, in run
    raise CalledProcessError(retcode, process.args,
subprocess.CalledProcessError: Command '['git', 'rev-parse', '--verify', 'HEAD']' returned non-zero exit status 128.
```

원인은 `/home/user` 위치에 소스코드를 설치해서 였음. `~/` 로 이동하여 다시 설치한 후에 빌드하니 성공.

## GUI 테스트 및 rviz 설치

`xeyes` 로 GUI 테스트 후 `apt-get install ros-noetic-rviz` 로 설치.
