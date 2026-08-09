---
date: 2023-09-07
layout: post
title: "ROS symbol lookup error"
tags:
  - troubleshooting
---
### ROS symbol lookup error
#ROS
ros 노드를 실행하는 중 `symbol lookpup error`가 발생.
문제 해결과정에서 터미널 내용이 사라져서 구글 검색에서 가져온 예시를 가져왔다.
```bash
/opt/ros/melodic/lib/rosout/rosout: symbol lookup error: /opt/ros/melodic/lib/librosconsole_log4cxx.so: undefined symbol: _ZN7log4cxx16AppenderSkeleton9setOptionERKNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEEES8_
```

빌드된 library를 가져오는데 링크가 잘못되어 가져오지 못하는 문제이다.
이전에 `catkin build`할 때 Warning이 나타난 걸 무시했다가 결국 문제가 생겼다.

해결법은 빌드된 내용들을 모두 지우고 다시 빌드하는 것이다.
```bash
cd ~/catkin_ws
rm -rf build/ devel/
catkin build
```

---

### ROS find_package
처음부터 모두 다시 빌드하는 과정에서 의존성 문제가 발생해서 이번 기회에 자세하게 알게 되었다.
```bash
CMake Error at /opt/ros/noetic/share/catkin/cmake/catkinConfig.cmake:83 (find_package): Could not find a package configuration file provided by "ysdrone_msgs" with any of the following names: 

	ysdrone_msgsConfig.cmake
	ysdrone_msgs-config.cmake 
	
Add the installation prefix of "ysdrone_msgs" to CMAKE_PREFIX_PATH or set "ysdrone_msgs_DIR" to a directory containing one of the above files. If "ysdrone_msgs" provides a separate development package or SDK, be sure it has been installed.
```

`building_search` 패키지를 빌드할 때 CMakeLists의 `find_package` 부분에 `ysdrone_msgs`라는 다른 패키지를 의존성으로 넣어두었는데 모두 새로 빌드하면서 `building_search` 패키지가 먼저 빌드되면서 에러를 낸 것이었다.

그 전에는 `find_package`에만 넣어주면 의존성이 해결되는 줄 알고 있었는데, package.xml 파일에도 내용을 넣어주어야 했다.
```xml
  <build_depend>ysdrone_msgs</build_depend>
  <exec_depend>ysdrone_msgs</exec_depend>
```
다음 라인을 넣어주니 빌드할 때 에러를 내지 않고 잘 되었다.