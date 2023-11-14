---
date: 2023-08-01
layout: post
title: "PX4 SITL & Gazebo"
---
### PX4 SITL & Gazebo
#ros #px4

>[!ERROR]
>```bash
>[ERROR] [1690868191.563929099, 0.269000000]: Could not load controller 'joint_group_position_controller' because controller type 'effort_controllers/JointTrajectoryController' does not exist.
>[ERROR] [1690868191.563993779, 0.269000000]: Use 'rosservice call controller_manager/list_controller_types' to get the available types
>
>[ERROR] [1690868192.565225, 0.990000]: Failed to load joint_group_position_controller
>```

아래 커맨드로 `controller_manager`를 넣어준 모델에서 사용 가능한 종류를 확인할 수 있다. `effort_controllers`나 `JointTrajectoryController`가 없으니 우선 설치를 해보았다.

```
$ rosservice call /typhoon_h480_kepco/controller_manager/list_controller_types
types: 
  - diff_drive_controller/DiffDriveController
  - joint_state_controller/JointStateController
  - position_controllers/JointGroupPositionController
  - position_controllers/JointPositionController
base_classes: 
  - controller_interface::ControllerBase
  - controller_interface::ControllerBase
  - controller_interface::ControllerBase
  - controller_interface::ControllerBase

```

>[!DONE]   
>```bash
>sudo apt install ros-$ROS_DISTRO-effort-controllers
>sudo apt install ros-$ROS_DISTRO-ros-controllers
> # 마지막것만 해도 될 것으로 보임
>```

>[!ERROR]   
>```bash
>WARN  [health_and_arming_checks] Preflight Fail: Yaw estimate error
>```
> 이 이슈는 정확하게 해결하지 못함. 다시 런치하는 경우 해결되어서 패스함.


