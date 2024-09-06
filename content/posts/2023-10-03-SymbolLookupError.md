---
date: 2023-10-03
layout: post
title: "Symbol lookup error"
categories: ROS
tags: ROS
math: "true"
---

### Symbol lookup error

런치파일을 구동하는데 아래와 같은 에러가 나타났다.


 ```bash
/home/as06047/catkin_ws/devel/lib/<ros-pkg>/mpc_test_node: symbol lookup error: /home/as06047/catkin_ws/devel/lib/<ros-pkg>/mpc_test_node: undefined symbol: _ZN6sh_mpc10MpcWrapperIdE7prepareEv
```

패키지 명은 `<ros-pkg>`로 가렸다.

이러한 에러가 나는 이유는 `catkin build`로 빌드할 당시에 아래와 같은 **Warning**을 무시하였기 때문이다.

```bash
Warning: Cannot symlink from /home/as06047/catkin_ws/devel/.private/<ros-pkg>/lib/libmpc_wrapper.so to existing file /home/as06047/catkin_ws/devel/lib/libmpc_wrapper.so
Warning: Source hash: e81fcac9c55e96c4c50ac4a7dbc52757
Warning: Dest hash: 8f3bcf621ec982c1b5ab83ae8c992e0e
```

같은 이름을 가진 라이브러리가 여러 개이기 때문에 충돌이 난 것이 원인이다.

즉, CMakeLists.txt에서 아래와 같은 내용이 여러 패키지에 존재하는 것이다.

```cmake
cs_add_library(mpc_wrapper
	src/mpc_wrapper.cpp)
```

그렇게 되면 처음 빌드 된 파일만 `libmpc_wrapper.so`로 생성되고 이후의 것들은 제대로 링크가 연결되지 않는다.(처음 것으로 되는 건지 나중 것이 덮어씌우는지는 정확하지 않다.)

```bash
find /home/as06047/catkin_ws -name "libmpc_wrapper.so"
/home/as06047/catkin_ws/devel/.private/<ros-pkg-1>/lib/libmpc_wrapper.so
/home/as06047/catkin_ws/devel/.private/<ros-pkg-2>/lib/libmpc_wrapper.so
/home/as06047/catkin_ws/devel/.private/<ros-pkg-3>/lib/libmpc_wrapper.so
/home/as06047/catkin_ws/devel/lib/libmpc_wrapper.so
```

나 같은 경우에는 3가지의 패키지에 같은 내용이 있었고 2번째 패키지 외의 패키지에서 해당 헤더파일을 포함한 노드를 사용할 때 사용할 수 없었다.

### 해결법

우선 `.private/<ros-pkg>/lib/libmpc_wrapper.so`를 모두 직접 지워준다.

즉, 겹치는 라이브러리 파일들을 모두 제거한다.

그 후에는 `CMakeLists.txt`에 `cs_add_library` 부분의 라이브러리 이름을 각각 다르게 수정해준다.

아마도 `catkin_simple`을 사용해서 발생하는 문제일 수도 있을 것 같다.