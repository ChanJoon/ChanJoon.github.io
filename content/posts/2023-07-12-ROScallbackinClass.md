---
date: 2023-07-12
layout: post
title: "ROS callback in Class"
---
## ROS callback in Class
#ros

>[!error]
>error: no match for call to ‘(boost::_mfi::mf1<void, BuildingSearch, const boost::shared_ptr<const geometry_msgs::PoseStamped_<std::allocator<void> > >&>) (const boost::shared_ptr<const geometry_msgs::PoseStamped_<std::allocator<void> > >&)’
>
>```bash
>230 |           BOOST_FUNCTION_RETURN(boost::mem_fn(*f)(BOOST_FUNCTION_ARGS));
>  |           ^~~~~~~~~~~~~~~~~~~~~
>  ```


빌드했을 때 위와 같이 에러가 나왔음.

>[!done]
>Before
>```cpp
>cloud_sub = nh.subscribe<sensor_msgs::PointCloud2>("/local_pointcloud", 1, &BuildingSearch::cloud_cb);
>
>state_sub = nh.subscribe<geometry_msgs::PoseStamped>("/mavros/local_position/pose", 10, &BuildingSearch::pose_cb);
>```
>After
>```cpp
>cloud_sub = nh.subscribe<sensor_msgs::PointCloud2>("/local_pointcloud", 1, boost::bind(&BuildingSearch::cloud_cb, this, _1));
>
>state_sub = nh.subscribe<geometry_msgs::PoseStamped>("/mavros/local_position/pose", 10, boost::bind(&BuildingSearch::pose_cb, this, _1));
>```

위와 같이 boost::bind 함수를 이용해 주어야 한다.

*왜 이렇게 작성하는가?*
- [What is boost::bind() commonly used in Action servers](https://get-help.robotigniteacademy.com/t/what-is-boost-bind-commonly-used-in-action-servers/10728)
- [How to deliver arguments to a callback function?](https://answers.ros.org/question/12045/how-to-deliver-arguments-to-a-callback-function/)
- [Using Class Methods as Callbacks](http://wiki.ros.org/roscpp_tutorials/Tutorials/UsingClassMethodsAsCallbacks)

---

### ACADO Toolkit Study

#acado 

>[!todo]
>- [ ] Gauss-Newton Hessian approximation
>- [ ] Explicit Runge-Kutta (ERK) / Implicit Runge-Kutta (IRK)
>- [ ] Variational Differential Equations (VDE)

acados와 다르게 ACADO는 여러 강의자료나 문서들이 잘 되어 있음. 우선은 uzh-rpg(Robotics and Perception Group)에서 공개해놓은 rpg_mpc는 ACADO와 qpOASES를 사용하고, data_driven_mpc는 acados를 사용하고 있어 2개 모두 살펴보면 좋을 것 같음.
이를 참고하여 MPCC로 작성해보고자 함.

`make doc`으로 문서 생성을 해도 되고 [Link](https://acado.sourceforge.net/doc/html/db/d4e/tutorial.html)에서 온라인으로 봐도 된다. 또한, [User Manual PDF](https://acado.sourceforge.net/doc/pdf/acado_manual.pdf)도 매우 잘 제공 되어 있음.

여기 [Link](https://acado.sourceforge.net/doc/html/db/d4e/tutorial.html)도 도움이 많이 된다.

**Tutorials**
우선 Tutorials부터 대략 따라 해본 후, uzh-rpg/rpg_mpc를 clone하여 돌려보도록 한다.