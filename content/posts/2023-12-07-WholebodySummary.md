---
layout: post
title: "Summary: Whole-body motion planning in multirotors"
date: 2023-12-07
categories: Robotics
tags:
  - self-study
math: "true"
---
# Summary

앞서 살펴본 논문들의 문제/개선점을 생각해보자

[[2023-11-14-SearchMotionPlanning|Search-based method]] 는 다른 논문에서도 지적했듯이 연산시간과 메모리 소요에서 큰 단점이 있었다.

하지만 hierarchical planning 을 통해 kinodynamic 한 경로를 가지고 최적화 하는 방식을 이용하였다.

보통 $A^*$ 탐색으로 생긴 경로를 최적화하게 되면 그 경로는 dynamics 를 고려하지 않아 local optimum 할 수 있다.

그 뒤로의 3개 논문들은 모두 *"Geometrically Constrained Trajectory Optimization for Multicopters"* 논문을 기반으로 하고 있다.

- Differential flatness 로 정의되는 state $\mathbf{x}$ 의 위치 궤적 $p(t)$ 를 다항식으로 표현
- collision-free, dynamically feasible 하기 위한 nonlinear constraints 를 cubic penalty term 으로 바꿔서 unconstrained optimization 문제를 풀어내도록 정의

차이점은 드론 모델링, Safe Flight Corridor(SFC), 전체 프레임워크 등을 꼽을 수 있다.

## Quadrotor Modelling

기존에 구로 간단히 모델링하던 것에서 자세를 고려하기 위해 타원체([[2023-11-14-SearchMotionPlanning|Liu et al.]], [[2023-12-06-OnlineMRS|Ren et al.]]), 직육면체([[2023-11-29-WholebodyMotionPlanning|Yang et al.]]), 다면체([[2023-12-02-FastRacing|Han et al.]])로 모델링하였다.

우선 처음 [[2023-11-14-SearchMotionPlanning|Liu et al.]] 에서 attitude 를 고려한 $\mathrm{SE}(3)$ planning 을 위해 타원체를 도입하였고, 이후 [[2023-11-29-WholebodyMotionPlanning|Yang et al.]] 에서 몇 가지 문제점을 지적했다.

타원체 모델링의 이미지 혹은 수식 ($Q=\text{diag}(r,r,h)$) 은 기체의 CoM 이 기체 중앙과 동일하다는 것을 전제로 하고 있다. 그렇지 않은 경우, 단축 $h$ 의 타원체 만으로 기체를 제대로 모델링 할 수 없다.

![[Yang2021icra_model.png]]

그리고 다원체 대신 직육면체로 함으로써, 각 꼭짓점을 SFC 안에 있는지 확인하는 방식으로 collision-free 를 담보하였다.

[[2023-11-14-SearchMotionPlanning|Liu et al.]] 에서는 타원체 안에 pointcloud 가 들어오는지 여부를 탐색하였고, 효율성을 위해 *kD-Tree* 와 sampling $I$ 를 통해 다소 느슨하게 확인하였다.

이후 [[2023-12-02-FastRacing|Han et al.]] 에서는 여러 꼭짓점으로 이루어진 방식으로 모델링하였다.

![[Han2021ral_fig2.png]]

이러한 방식이 가장 촘촘하게 충돌 여부를 탐색하는 것 같다. 하지만, 각 드론 모델마다 적용하기에 약간의 어려움이 있을 수 있을 것 같다.

마지막 [[2023-12-06-OnlineMRS|Ren et al.]] 에서는 다시 타원체로 모델링하였는데, 이는 앞서 언급한 단점에도 불구하고 전체 경로 계획을 위해 넘어간 부분으로 보인다.

다른 연구들과 달리 [[2023-12-06-OnlineMRS|Ren et al.]] 에서는 주어진 지도(좁은 틈에 대한 정보 포함)와 전역 경로를 필요로 하지 않았다. Online 으로 충돌하지 않고 좁은 틈을 지나는 경로를 생성할 수 있었는데, 이를 위해서 Low resolution map(*LRM*), High resolution map(*HRM*) 을 이용하였다.

이 각각의 지도는 장애물을 각각 $r$ 과 $h$ 로 inflating 하는 방식이기 때문에 드론의 단축을 이용해 최소한으로 지나갈 수 있는 구간 / 지도의 타당성을 위해 사용한 것 같다.

하지만 이러한 방식은 아래와 같은 문제점이 있다.

1. 기체를 제대로 감싸는 모델링(i.e ellipsoid) 이 아니라 실제로 충돌하는 영역이 더 생길 수 있음.
2. $h$ 의 반지름을 갖는 원형의 틈 또한 *HRM* 에서 지나갈 수 있는 경로로 판단.

**따라서, 각 모델링의 SFC 연산 시간, 충돌 가능성(space resolution)과 online re-planning 에서의 활용 (MR search 를 대체할 수 있는지) 을 고려해야 할 것이다.**

## Safe Flight Corridor

WIP

## Framework

Search-based 나 Sampling-based 는 연산 속도에서 단점이 있다보니, **Whole-body Motion Planning** 에서는 Optimization-based 로 경로 생성을 하는 것이 타당해보인다. (real-time 으로 re-planning 할 것도 생각해본다면)

그래서 *"Geometrically Constrained Trajectory Optimization for Multicopters"* 논문을 바탕으로 디벨롭 시키는 것이 좋아보이고, 이를 두 가지 접근으로 나눠서 생각해볼 수 있다.

1. Problem Formulation
2. Online Whole-body Motion Planning

### Problem formulation

*"Geometrically Constrained Trajectory Optimization for Multicopters"* 논문의 골자는 풀기 어려운 nonlinear constraints 를 cubic penalty term 으로 바꿔서 unconstrained problem 으로 바꿔 풀어내는 것이다.

그렇다면, cubic penalty function 을 다른 방식으로 수정해서 더욱 high-resolute 하게 만들면 이전 방식보다 조건을 덜 violate 하게 만들 수도 있다. (cubic penalty 방식도 어떤 영역에서는 constraint 를 어기게 될 수 있음.)

풀어내는 solver 를 바꿔볼 수 도 있다. 현재는 L-BFGS quasi-Newton method 로 풀어내고 있다. 이를 다른 solver 로 사용해서 더 빠르게 풀거나 어떤 장점을 주장해볼 수 있다. (아직 잘 모르지만)

**요약하자면, Optimization problem 의 cost 나 violation term, control effort 등 을 개선하고 비교해서 더 우수한 경로를 만드는 접근이다.**

### Online planning

결국 이 논문은 경로 생성에 초점을 맞추고 있다. 기본적으로는 장애물에 대한 정보가 주어지는 것을 전제로 좁은 틈을 지나면서도 빠르게 목적지로 도달하는 경로를 만드는 것이다.

이러한 방식은 map 을 가지고 있어야 해서 새로운 장애물이 나타났을 때 사용할 수 없고, map 이 없는 경우에도 별도의 re-planning 방식을 가지고 있어야 한다.

이 접근은 trajectory generation 에서 planning 의 영역으로 넘어가는 것이긴 하나, 결국 이 방식의 optimization 을 활용하려면 필요한 부분이기도 하다.

[[2023-12-06-OnlineMRS|Ren et al.]] 에서도 이를 위해서 *MR search* 를 도입하여 문제를 해결하였다.

위에서 정리한 내용 외에도 [[2023-12-02-FastRacing|Han et al.(Fast-Racing)]] 처럼 parallel 하게 풀어내는 방식도 같이 적용해볼 수 있다. 예를 들면, 장애물이 있어서 re-planning 할 때 $\mathbb{R}^3$ 와 $\mathbf{SE}(3)$ 경로를 GPU 쓰레드로 나눠서 해볼 수도 있고, $\mathbf{SE}(3)$ 만 GPU 쓰레드, 블록으로 나눠서 하고 CPU 에서 한 $\mathbb{R}^3$ 와 비교한다던지 등등...(물론 *MR search* 와 **Fast-Racing** 을 합친 거 같긴 하다.)