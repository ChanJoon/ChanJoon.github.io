---
layout: post
title: Build Issue Note (Agile Autonomy, ERRT, mav_voxblox_planning)
date: 2025-04-30
categories: ROS
tags:
  - ros
math: "true"
---
# Build Issue Note

자잘하게 빌드 이슈해결한 것들 기록.

## Agile Autonomy
Learning High-Speed Flight in the Wild 논문 오픈소스 빌드 해결

> Reference: https://github.com/uzh-rpg/agile_autonomy/issues/10#issuecomment-981095386

1.  **Install Open3D v0.9.0**

```
git clone --recursive https://github.com/intel-isl/Open3D
git checkout v0.9.0
git submodule update --init --recursive
./util/scripts/install-deps-ubuntu.sh
mkdir build
cd build
cmake ..
make -j$(nproc)
sudo make install
```

2. **Python 제대로 못잡는 경우 아래와 같이 박아넣기**

catkin config --cmake-args -DPYTHON_EXECUTABLE=/usr/bin/python3

3. **README.md 나온대로 g++/gcc 설정**

```bash
sudo apt-get install g++-7 gcc-7 # agile autonomy requires old compilers for some reason
sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-7 100
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-7 100
```


4. **Install libraries**

```bash
sudo apt-get install libfmt-dev
sudo apt-get install --reinstall libffi-dev libp11-kit-dev libc6-dev
```



5. **(중요) Build error on rotors_hil_interface**

아래 Github Issue 확인
https://github.com/ethz-asl/rotors_simulator/issues/737

6. **(중요) Deactivate anaconda in ~/.zshrc (also check PATH, LD_LIBRARY_PATH)**

자동으로 conda activate 되고, PATH 와 LD_LIBRARY_PATH 연결되면 `base` 에 설치된 라이브러리들이 잡혀서 꼬이는 경우 발생

pyqt 에러는 conda `PATH` 를 연결한 후 해결되었음.

7. **`gzserver: symbol lookup error: `**

gzserver: symbol lookup error: /home/as06047/agile_autonomy_ws/catkin_aa/devel/lib/librotors_gazebo_multirotor_base_plugin.so: undefined symbol:
 _ZN14gz_sensor_msgs9ActuatorsC1Ev 에러
 
> Reference
> -  https://blog.csdn.net/woaixiaojiang/article/details/141933935
> - https://blog.csdn.net/m0_47737058/article/details/115736623

요약하면 PX4-Autopilot 과 Rotors 의 shared object 가 충돌하는 문제

나의 경우, `/home/as06047/PX4-Autopilot/build/px4_sitl_default/build_gazebo-classic` 에 있는 libmav_msgs.so 와
`/home/as06047/agile_autonomy_ws/catkin_aa/build/rotors_gazebo_plugins` 에 있는 libmav_msgs.so 가 충돌했음.

PX4 에 있는 .so 파일을 임시로 이름변경을 해준 후 실행(빌드 필요X)

8. **ImportError: /lib/x86_64-linux-gnu/libp11-kit.so.0: undefined symbol: ffi_type_pointer, version LIBFFI_BASE_7.0**

```bash
conda create --name agile_autonomy -c conda-forge python=3.7.8
conda activate agile_autonomy
pip install tensorflow-gpu==2.4 rospkg==1.2.3 pyquaternion open3d opencv-python netifaces
```


## ERRT 빌드 이슈 해결

1. **`Dockerfile` 에 `apt-get install` 하는 부분에 패키지 추가**

```bash
    && apt-get install -y ros-noetic-move-base-msgs \
```


2. **로컬 빌드하는 경우**

```bash
sudo apt-get update
sudo apt-get --with-new-pkgs upgrade -y
sudo apt-get install -y mesa-utils \
                        libgl1-mesa-glx \
                        vim \
                        tmuxinator \
                        python3-catkin-tools \
                        python3-osrf-pycommon \
                        python3-pip \
                        libtbb-dev \
                        ros-noetic-octomap-server \
                        ros-noetic-octomap-ros \
                        ros-noetic-octomap-rviz-plugins \
                        ros-noetic-octomap-mapping \
                        libtool \
                        libgoogle-glog-dev \
                        libnlopt-dev \
                        libsuitesparse-dev \
                        ros-noetic-nlopt \
                        liblapacke-dev \
                        ros-noetic-gtsam \
                        ros-noetic-rosmon \
                        iputils-ping \
                        apt-transport-https ca-certificates \
                        openssh-server python3-pip exuberant-ctags \
                        git vim tmux nano htop sudo curl wget gnupg2 \
                        bash-completion \
                        libcanberra-gtk3-0 \
                        ros-noetic-gmapping ros-noetic-slam-gmapping ros-noetic-openslam-gmapping \
                        ros-noetic-joy \
                        ros-noetic-twist-mux \
                        ros-noetic-interactive-marker-twist-server \
                        ros-noetic-fath-pivot-mount-description \
                        ros-noetic-flir-camera-description \
                        ros-noetic-realsense2-description \
                        ros-noetic-lms1xx \
                        ros-noetic-robot-localization \
                        ros-noetic-teleop-twist-keyboard \
                        ros-noetic-teleop-twist-joy \
                        ros-noetic-rviz-imu-plugin \
                        ros-noetic-gmapping \
                        ros-noetic-mavros-msgs \
                        ros-noetic-move-base-msgs


python3 -m pip3 install opengen
python3 -m pip3 install gdown


git clone https://github.com/ethz-asl/eigen_checks.git
git clone https://github.com/catkin/catkin_simple.git
git clone https://github.com/ethz-asl/eigen_catkin.git
git clone https://github.com/ntnu-arl/lidar_simulator.git
git clone https://github.com/ethz-asl/mav_comm.git
git clone https://github.com/ros-planning/navigation_msgs.git
git clone https://github.com/ethz-asl/numpy_eigen.git
git clone --branch melodic-devel https://github.com/ros-perception/perception_pcl.git
git clone https://github.com/ros/xacro.git
git clone https://github.com/ethz-asl/catkin_boost_python_buildtool.git
git clone https://github.com/LTU-RAI/darpa_subt_worlds.git
git clone https://github.com/LTU-RAI/rotors_simulator.git && cd rotors_simulator && git pull
git clone https://github.com/LTU-RAI/ufomap.git
git clone https://github.com/LTU-RAI/geometry2.git
git clone https://github.com/aakapatel/mav_control_rw.git

sudo apt-get update && sudo apt-get install -y \
    ros-noetic-tf2-sensor-msgs \
    python3-catkin-tools \
    python3-osrf-pycommon \
    libtbb-dev \
    qtbase5-dev \
    qtdeclarative5-dev \
    libqt5x11extras5-dev

# rotors_gazebo_plugins 에서 add_compile_options(-std=c++17) 추가

git clone https://github.com/LTU-RAI/ExplorationRRT.git
/bin/bash -c 'source $HOME/.cargo/env; cd /home/$USERNAME/catkin_ws/src/ExplorationRRT; python3 rrt_costgen.py'

catkin build errt

roslaunch errt server.launch
roslaunch errt errt.launch
roslaunch rotors_gazebo errt_mav.launch
roslaunch mav_linear_mpc mav_linear_mpc_sim.launch mav_name:=hummingbird
rosservice call /hummingbird/takeoff "{}"
```

위 스크립트 그대로 사용. 주요 사항은

- python 파일 cargo 이용해서 빌드
- rotors_gazebo_plugins 에다가 add_compile_options(-std=c++17) 추가

## mav_voxblox_planning 빌드 이슈 해결

1. **빠진 디펜던시 추가**

```bash
git clone https://github.com/ethz-asl/protobuf_catkin.git
catkin build protobuf_catkin
```

2. **ompl 설치**

```bash
sudo apt-get install libompl-dev
```

3. **PCL C++14**

- voxblox_skeleton
- voxblox_skeleton_planner
- mav_planning_benchmark
- mav_local_planner

위 패키지들 CMakeLists.txt 에서 옵션 수정
`add_definitions(-std=c++14)`

4. **voxblox_skeleton 소스코드 수정**

`voxblox_skeleton/src/io/skeleton_io.cpp` 에서

```cpp
// From
uint32_t tmp_byte_offset = 0;
// to
uint64_t tmp_byte_offset = 0;
```
