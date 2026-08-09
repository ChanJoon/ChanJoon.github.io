---
date: 2023-09-15
layout: post
title: "귀찮을 때 보기위한 PX4-Autopilot 설치"
tags:
  - px4
  - setup
---

## PX4-Autopilot Installation 

```bash
git clone https://github.com/PX4/PX4-Autopilot.git --recursive
bash ./PX4-Autopilot/Tools/setup/ubuntu.sh --no-nuttx

# Error
Installing PX4 Python3 dependencies
AttributeError: module 'lib' has no attribute 'X509_V_FLAG_CB_ISSUER_CHECK'
# Solve
# https://stackoverflow.com/a/75295873

sudo reboot
```


```bash
cd ~/PX4-Autopilot
make px4_sitl_default gazebo-classic

# 생략
px4 starting.

INFO  [px4] startup script: /bin/sh etc/init.d-posix/rcS 0
INFO  [init] found model autostart file as SYS_AUTOSTART=10015
INFO  [param] selected parameter default file parameters.bson
INFO  [param] selected parameter backup file parameters_backup.bson
  SYS_AUTOCONFIG: curr: 0 -> new: 1
  SYS_AUTOSTART: curr: 0 -> new: 10015
  CAL_ACC0_ID: curr: 0 -> new: 1310988
  CAL_GYRO0_ID: curr: 0 -> new: 1310988
  CAL_ACC1_ID: curr: 0 -> new: 1310996
  CAL_GYRO1_ID: curr: 0 -> new: 1310996
  CAL_ACC2_ID: curr: 0 -> new: 1311004
  CAL_GYRO2_ID: curr: 0 -> new: 1311004
  CAL_MAG0_ID: curr: 0 -> new: 197388
  CAL_MAG0_PRIO: curr: -1 -> new: 50
  CAL_MAG1_ID: curr: 0 -> new: 197644
  CAL_MAG1_PRIO: curr: -1 -> new: 50
  SENS_BOARD_X_OFF: curr: 0.0000 -> new: 0.0000
  SENS_DPRES_OFF: curr: 0.0000 -> new: 0.0010
INFO  [dataman] data manager file './dataman' size is 7866664 bytes
etc/init.d-posix/rcS: 39: [: Illegal number: 
INFO  [init] PX4_SIM_HOSTNAME: localhost
INFO  [simulator_mavlink] Waiting for simulator to accept connection on TCP port 4560
INFO  [simulator_mavlink] Simulator connected on TCP port 4560.
INFO  [lockstep_scheduler] setting initial absolute time to 3752000 us
Gazebo multi-robot simulator, version 11.13.0
Copyright (C) 2012 Open Source Robotics Foundation.
Released under the Apache 2 License.
http://gazebosim.org

[Msg] Waiting for master.
[Msg] Connected to gazebo master @ http://127.0.0.1:11345
[Msg] Publicized address: 192.168.35.90
INFO  [commander] LED: open /dev/led0 failed (22)
WARN  [health_and_arming_checks] Preflight Fail: ekf2 missing data
INFO  [tone_alarm] home set
INFO  [mavlink] mode: Normal, data rate: 4000000 B/s on udp port 18570 remote port 14550
INFO  [mavlink] mode: Onboard, data rate: 4000000 B/s on udp port 14580 remote port 14540
INFO  [mavlink] mode: Onboard, data rate: 4000 B/s on udp port 14280 remote port 14030
INFO  [mavlink] mode: Gimbal, data rate: 400000 B/s on udp port 13030 remote port 13280
INFO  [logger] logger started (mode=all)
INFO  [logger] Start file log (type: full)
INFO  [logger] [logger] ./log/2023-09-16/06_30_48.ulg	
INFO  [logger] Opened full log file: ./log/2023-09-16/06_30_48.ulg
INFO  [mavlink] MAVLink only on localhost (set param MAV_{i}_BROADCAST = 1 to enable network)
INFO  [mavlink] MAVLink only on localhost (set param MAV_{i}_BROADCAST = 1 to enable network)
INFO  [px4] Startup script returned successfully
pxh> INFO  [tone_alarm] notify negative
[Err] [InsertModelWidget.cc:403] Missing model.config for model "/home/as06047/catkin_ws/src/gazebo_models/.git"
[Err] [InsertModelWidget.cc:403] Missing model.config for model "/home/as06047/catkin_ws/src/kepco_sim-master/gazebo_env/gazebo_map/world"
INFO  [commander] Ready for takeoff!

```

```
source ~/catkin_ws/devel/setup.bash    # (optional)
source Tools/simulation/gazebo-classic/setup_gazebo.bash $(pwd) $(pwd)/build/px4_sitl_default
export ROS_PACKAGE_PATH=$ROS_PACKAGE_PATH:$(pwd)
export ROS_PACKAGE_PATH=$ROS_PACKAGE_PATH:$(pwd)/Tools/simulation/gazebo-classic/sitl_gazebo-classic
roslaunch px4 posix_sitl.launch
```

**Edited on Aug. 02**
`bullet` 관련 에러 발생 시 해결법 정리

```bash
-- Checking for module 'bullet>=2.82'  
-- No package 'bullet' found  
-- Checking for module 'bullet2.82>=2.82'  
-- No package 'bullet2.82' found  
CMake Error at /usr/lib/x86_64-linux-gnu/cmake/gazebo/gazebo-config.cmake:102 (message):  
Error: Bullet > 2.82 not found, please install libbullet2.82-dev.
```

[Reference Link](https://github.com/khancyr/ardupilot_gazebo/issues/14#issuecomment-828152816)