---
date: 2023-09-27
layout: post
title: "How to use roslaunch with gdb"
---

### How to use roslaunch with gdb

Eigen 같이 빌드 과정에서 컴파일러가 문제점을 찾지 못하는 경우에는 gdb 디버거를 활용하면 좋다.

**사용법**

원하는 노드에 다음과 같이 `launch-prefix`를 붙여준다.

```xml
<node pkg="mpcc" type="mpc_test_node" name="mpc_test_node" output="screen" launch-prefix="gdb -ex run --args"/>
```

문제가 생기는 경우 gdb 콘솔에 아래 명령어로 문제가 생긴 위치를 찾을 수 있다.

1. **Backtrace:** Once the program has stopped due to the assertion failure, type `bt` or `backtrace` in the gdb console. This will show you a stack trace of all the function calls that led up to the point where the error occurred. The top of this list is the most recent call (where the error occurred), and the bottom is the initial function that started it all.

    ```
    (gdb) backtrace
    ```

2. **Inspect Frames:** Use the `frame` command followed by a number to inspect a particular stack frame more closely. For example, `frame 0` will show you the details of the most recent function call.

    ```
    (gdb) frame 0
    ```

