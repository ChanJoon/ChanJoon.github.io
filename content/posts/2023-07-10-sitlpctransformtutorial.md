---
date: 2023-07-10
layout: post
title: "sitl_pc_transform_tutorial"
tags:
  - ROS
  - px4
---
### sitl_pc_transform_tutorial
```bash
roslaunch sitl_pc_transform_tutorial gazebo.launch
# Terminal 2
rosrun sitl_pc_transform_tutorial offboard_control
# Terminal 3
rosrun sitl_pc_transform_tutorial voxel_mapping
```

rosbag record 해보았는데 voxel_map 토픽에 제대로 맵핑이 안되고 있어보임.

>[!Feedback]
>1. joy_setpoints.py 에서 ALTITUDE HOLDING이 잘 안되는 문제
> 	- 이전 local_pos의 업데이트 시점과 비교하여 시간이 너무 지난 경우 호버링
> 	- type_mask 활용하여 모드 전환하여 제어
> 	- 모드2 조종기처럼 Dual Shock 4 조작
>2. voxel_mapping에서 world frame으로 rotation 적용이 안되었음. 또한, voxelization이 제대로 안됌.
>	- quaternion 공부 다시해볼 것
>	- 누적된 cloud를 voxelization 해야함.
>	- publish rate를 다르게 하여 누적시키기
>

>[!info] Rviz setting for voxelized point cloud
>	토픽을 Cube로 하고 size를 설정한 LeafSize로 바꾸어주면 Octomap 나오는 것처럼 볼 수 있음.

mavros_msgs의 PositionTarget의 경우 type_mask 메세지 타입이 있는 것을 알 수 있다.
[sensor_msgs/PositionTarget.msg](http://docs.ros.org/en/api/mavros_msgs/html/msg/PositionTarget.html)

```cpp
msg.type_mask = int('010111111000', 2)
```
위와 같이 작성하면 PX, PY, PZ, YAW_RATE를 제어하는데 사용한다는 의미이다.

### Convert mesh to pointcloud

Ground truth based mappng 대신 COLLADA 파일을 pointcloud로 변환하는 방식을 사용해보고자 함.

방법: PCL mesh_sampling.cpp
https://github.com/PointCloudLibrary/pcl/blob/master/tools/mesh_sampling.cpp

```bash
sudo apt-get update
sudo apt-get install pcl-tools
```

그리고 기존에 가지고 있던 .dae 형식 파일을 Blender에서 .ply 형태로 꺼내준다.

그 후 ply 파일이 있는 위치로 이동한 후 아래 커맨드 입력
```bash
pcl_mesh_sampling hill_cable_mesh.ply hill_cable_mesh.pcd -no_vis_result -n_samples 100000
```
이렇게 하면 100000개 점으로 sampling하여 pcd 포맷으로 변환해준다. 

이후 pcl_viewer로 확인.

pcl_mesh2pcd 방식도 있으나 [Link](https://github.com/PointCloudLibrary/pcl/blob/master/tools/mesh2pcd.cpp) 기본 설정에서 resolution이 낮고 argument 설정이 명확하지 않아서 mesh sampling 방식으로 하였음.
>[!tip]
>```bash
>dpkg -L libpcl-dev
>```
>위 커맨드로는 설치된 PCL 헤더파일들을 찾아볼 수 있다. pcl tools를 사용해야 하는데, 설치 여부나 경로를 찾으려다가 알게 되었음. [Ref](https://stackoverflow.com/questions/26529155/where-are-package-library-and-header-files-installed)

---
이 과정에서 CloudCompare도 설치 완료
```bash
snap install cloudcompare
```