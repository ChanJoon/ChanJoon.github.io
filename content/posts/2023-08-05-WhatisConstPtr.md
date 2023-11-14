---
date: 2023-08-05
layout: post
title: "What is ConstPtr&?"
---
### What is ConstPtr&?
#ros

지난 [[2023-07-12#^8bd526|ROS Callback in Class]]에서 콜백함수의 메세지 타입 마지막에 ::ConstPtr에 붙이는 것을 보고 자료형을 그대로 쓰지 않는 이유에 대해 알아보았다.

`::Ptr`은 `boost::shared_ptr<msg>`를 의미하고, `::ConstPtr`은 `boost::shared_ptr<const msg>`를 의미한다. `boost`에서 사용하는 방식은 C++11 이전 형식으로 이후 Standard Library로 포함되어 `std::shared_ptr`을 지원하고 있다.

```cpp
void topic_cb(const geometry_msgs::Twist::ConstPtr& msg)
{
	ROS_INFO("%d", msg->linear.x);
}
```

`&`가 있기 때문에 `ConstPtr&`은 pointer가 아닌 reference이다. 따라서 해당 메세지를 복사해서 사용하지 않고 직접 참조한다.

`shared_ptr`은 smart pointer로 여러 객체에서 공유하여 사용할 수 있는 포인터이고 `Ptr`대신 `ConstPtr`로 사용함으로써, 해당 참조한 변수를 변경하지 않겠다는 것을 의미한다.

reference를 사용하는 것의 장점은 pointer를 사용할 때 `nullptr`을 받아오는 경우를 예외처리하지 않아도 된다는 것이다.

```cpp
void func1(Foo* foo) {
    assert(foo);
    ...
}
void func2(Foo& foo) {
    // we don't need assert.
}
```

받아온 데이터 내부의 값을 사용할 때 `.`으로 하는지 `->`로 하는지 매번 헷갈렸는데, 아래 예시로 쉽게 이해할 수 있다.

```cpp
simpleSmartPtr->start();
// or
(*simpleSmartPtr).go();
```

따라서 콜백함수에서 받아온 `msg`를 포인터로 사용하는 경우에는 `.`을 사용하고 바로 사용하는 경우에는 `->`를 사용한다.

```cpp
void topic_cb(const geometry_msgs::PoseStamped::ConstPtr& msg)
{
	current_pose = *msg;
	ROS_INFO("%f", current_pose.pose.position.x);
}

void topic_cb2(const geometry_msgs::PoseStamped::ConstPtr& msg)
{
	current_pose_x = msg->pose.position.x;
	ROS_INFO("%f", current_pose_x);
	// 틀릴 수 있음. 컴파일을 안해서...
}
```

ROS에서 지원하는 callback 함수는 아래와 같다.
http://wiki.ros.org/roscpp/Overview/Publishers%20and%20Subscribers

```cpp
void callback(boost::shared_ptr<std_msgs::String const>);
void callback(std_msgs::StringConstPtr);
void callback(std_msgs::String::ConstPtr);
void callback(const std_msgs::String&);
void callback(std_msgs::String);
void callback(const ros::MessageEvent<std_msgs::String const>&);
```

**Refernces**

- [What is ConstPtr&?](https://answers.ros.org/question/212857/what-is-constptr/)
- [std::shared_ptr](https://en.cppreference.com/w/cpp/memory/shared_ptr)
- https://awesomekling.github.io/Serenity-C++-patterns-References-instead-of-Pointers/
- 전문가를 위한 C++ 5th Edition
- [Pointers, References and Dynamic Memory Allocation](https://www3.ntu.edu.sg/home/ehchua/programming/cpp/cp4_PointerReference.html)