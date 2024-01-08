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

다른 연구들과 달리 [[2023-12-06-OnlineMRS|Ren et al.]] 에서는 주어진 지도(좁은 틈에 대한 정보 포함)와 전역 경로를 필요로 하지 않았다. Online 으로 충돌하지 않고 좁은 틈을 지나는 경로를 생성할 수 있었는데, 이를 위해서 Low resolution map(LRM), High resolution map(HRM) 을 이용하였다.

이 각각의 지도는 장애물을 각각 $r$ 과 $h$ 로 inflating 하는 방식이기 때문에 드론의 단축을 이용해 최소한으로 지나갈 수 있는 구간 / 지도의 타당성을 위해 사용한 것 같다.