---
layout: post
title: "Debug logging"
date: 2023-11-27
tags:
  - ROS
  - self-study
  - troubleshooting
math: "true"
---

Orin NX와 ROS 환경에서 tkDNN 환경 세팅하며 생긴 Troubleshooting 기록

## Error reading file layers/g30.bin with n of float: 6591 seek: 0 size: 26364

https://github.com/ceccocats/tkDNN/issues/99

darknet 으로 학습시킬 때 사용한 `.cfg` 파일이 `./darknet export` 할 때 넣어주는 것과 tkDNN/build 에 있는 `./test_<custom_model>` 의 경로 파일과 모두 동일해야 한다.

그리고 `./test_<custom_model>` 을 만들어낸 .cpp 파일에서의 경로는 상대 경로여서, tkDNN/build 하위 디렉토리에 놓도록 한다. (layers와 debug 폴더 포함)

## terminate called after throwing an instance of 'cv::Exception'

```bash
[ INFO] [1700935940.728773870]: There are 1 input images
[ INFO] [1700935940.729278054]: Input image size: 736 x 736
terminate called after throwing an instance of 'cv::Exception'
  what():  OpenCV(4.8.0-dev) ../modules/imgproc/src/resize.cpp:4045: error: (-215:Assertion failed) !ssize.empty() in function 'resize'
```

만든 rt 파일을 이용해서 네트워크에 이미지를 넣어줄 때 `tk::dnn::Yolo3Detection::preprocess()` 에서 위와 같은 에러가 나타났다. ROS_INFO 로 이미지 사이즈를 출력해보아도 정상적이었어서 원인 파악이 어려웠음.

아래는 gdb backtrace 로그

```cpp
  (gdb) backtrace
#0  __GI_raise (sig=sig@entry=6) at ../sysdeps/unix/sysv/linux/raise.c:50
#1  0x0000ffffe77f1aac in __GI_abort () at abort.c:79
#2  0x0000ffffe7ab48bc in __gnu_cxx::__verbose_terminate_handler() ()
    at /lib/aarch64-linux-gnu/libstdc++.so.6
#3  0x0000ffffe7ab220c in  () at /lib/aarch64-linux-gnu/libstdc++.so.6
#4  0x0000ffffe7ab2270 in  () at /lib/aarch64-linux-gnu/libstdc++.so.6
#5  0x0000ffffe7ab2564 in  () at /lib/aarch64-linux-gnu/libstdc++.so.6
#6  0x0000ffffe7e9683c in cv::error(cv::Exception const&) ()
    at /usr/local/lib/libopencv_core.so.408
#7  0x0000ffffe7e97724 in cv::error(int, std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char> > const&, char const*, char const*, int) ()
    at /usr/local/lib/libopencv_core.so.408
#8  0x0000fffff7958220 in cv::resize(cv::_InputArray const&, cv::_OutputArray const&, cv::Size_<int>, double, double, int) () at /lib/aarch64-linux-gnu/libopencv_imgproc.so.4.2
#9  0x0000ffffe8a3cdac in tk::dnn::Yolo3Detection::preprocess(cv::Mat&, int) ()
    at /home/kepco/catkin_ws/src/tkdnn-ros/tkDNN/installed/lib/libtkDNN.so
#10 0x0000aaaaaabfe580 in tk::dnn::DetectionNN::update(std::vector<cv::Mat, std::allocator<cv::Mat> >&, int, bool, std::basic_ofstream<char, std::char_traits<char> >*, bool) ()
#11 0x0000aaaaaabf31c8 in tkdnn_ros_class::img_callback(boost::shared_ptr<sensor_msgs::Image_<std::allocator<void> > const> const&) ()
#12 0x0000aaaaaac534c8 in boost::_mfi::mf1<void, tkdnn_ros_class, boost::shared_ptr<sensor_msgs::Image_<std::allocator<void> > const> const&>::operator()(tkdnn_ros_class*, boost::shared_ptr<sensor_msgs::Image_<std::allocator<void> > const> const&) const ()
#13 0x0000aaaaaac49c5c in void boost::_bi::list2<boost::_bi::value<tkdnn_ros_class*>, boost::arg<1> >::operator()<boost::_mfi::mf1<void, tkdnn_ros_class, boost::shared_ptr<sensor_msgs::Image_<std::allocator<void> > const> const&>, boost::_bi::rrlist1<boost::shared_ptr<sensor_msgs::Image_<std::alloca--Type <RET> for more, q to quit, c to continue without paging--
```

원인은 tkDNN을 빌드할 때의 OpenCV 버전(4.8.0-dev)과 ROS Noetic에서 사용하는 OpenCV(4.2.0)이 달라서 생긴 것이었다.

새로 다시 다 빌드하기 너무 번거로워서, tkDNN을 `ENALBLE_OPENCCV_CUDA_CONTRIB` 를 ON으로 해서 빌드해보려고 했으나, 어떤 이유에서인지 모델 불러오는 것부터 안됌.
(별도로 빌드한 4.8.0 버전이 CUDA contrib이 활성화 되어 있어서였는데, tkDNN에서 CUDA 12.2나 최신 tensorRT or cuDNN를 지원하지 않는 것으로 보임)

```bash
# Maybe ld warning is related(https://github.com/ceccocats/tkDNN/issues/300)

/usr/bin/ld: warning: libopencv_core.so.4.2, needed by /opt/ros/noetic/lib/libcv_bridge.so, may conflict with libopencv_core.so.408
/usr/bin/ld: warning: libopencv_features2d.so.4.2, needed by /usr/lib/aarch64-linux-gnu/libopencv_calib3d.so.4.2.0, may conflict with libopencv_features2d.so.408
/usr/bin/ld: warning: libopencv_dnn.so.408, needed by /home/kepco/catkin_ws/src/tkdnn-ros/tkDNN/build/libtkDNN.so, may conflict with libopencv_dnn.so.4.2
/usr/bin/ld: warning: libopencv_imgproc.so.408, needed by /home/kepco/catkin_ws/src/tkdnn-ros/tkDNN/build/libtkDNN.so, may conflict with libopencv_imgproc.so.4.2
```

>[!success] Solution
>- cv_bridge를 소스로 설치하여 OpenCV 4.8.0 버전으로 빌드하여 해결함
>	```bash
>	sudo apt remove ros-noetic-cv-bridge
>	sudo apt install ros-noetic-ros-base
>	```
>- cv_bridge를 제거하면 기존 GUI 관련 내용이 모두 삭제되므로, base 버전으로 재설치
>- [vision_opencv](https://github.com/ros-perception/vision_opencv/tree/noetic) 소스코드를 `~/catkin_ws/src` 에 설치한 후 빌드, source 해준 후 나머지 GUI 툴들 설치
>	```bash
>	git clone https://github.com/ros-perception/vision_opencv/ -b noetic
>	catkin build vision_opencv # or catkin build
>	source ~/catkin_ws/devel/setup.bash
>	sudo apt install ros-noetic-desktop-full

## Failsafe enabled: No manual control stick input

SITL에서 joystick으로 제어할 때 `Failsafe enabled: No manual control stick input` 에러가 발생하며 OFFBOARD 혹은 제어가 안되는 문제 해결.

SITL 실행 후 `COM_RCL_EXCEPT=4` 로 파라미터를 변경해준다.

```
px4) param set COM_RCL_EXCEPT 4
```

*References*
- [https://github.com/PX4/px4_ros_com/issues/111#issuecomment-1012695084](https://github.com/PX4/px4_ros_com/issues/111#issuecomment-1012695084)
- [https://discuss.px4.io/t/offboard-mode-in-sitl/25727/4](https://discuss.px4.io/t/offboard-mode-in-sitl/25727/4)
- [yirameon's velog](https://velog.io/@yirameon/SITL-PX4-ROS2-%ED%8C%8C%EB%9D%BC%EB%AF%B8%ED%84%B0-%EC%84%A4%EC%A0%95)

## Error [Plugin.hh:138] Failed to load plugin libgazebo_ros_camera.so

gazebo는 설치되어 있었는데, 중간에 플러그인이 삭제되거나 Orin NX에서는 설치가 안되었던 모양이다.

```bash
sudo apt-get install ros-noetic-gazebo-ros-pkgs ros-noetic-gazebo-ros-control
```