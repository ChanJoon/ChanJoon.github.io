---
layout: post
title: "[IROS '17] Search-based Motion Planning using Lineqr Quadratic Minimum Time Control"
date: 2023-11-16
categories: Robotics
tags:
  - paper
math: "true"
---
[[2023-11-14-SearchMotionPlanning|이전 Post인 RA-L 논문]] 저자의 선행 연구를 살펴보고자 한다.

[Arxiv](https://arxiv.org/abs/1709.05401)

## Introduction & Related Works
이전에서도 언급되었지만 추후 공부할 선행 논문들을 리스트업해보았다.

>[!quote] Quadrotor의 differential flatness를 이용한 jerk 혹은 snap을 통한 제어 논문
> 1. D. Mellinger and V. Kumar, “Minimum snap trajectory generation and control for quadrotors,” in Proceedings of the 2011 IEEE International Conference on Robotics and Automation (ICRA), 2011.
>
> 2. M. Hehn and R. D’Andrea, “Quadrocopter trajectory generation and control,” IFAC Proceedings Volumes, vol. 44, no. 1, 2011.
> 
> 3. M. Mueller, M. Hehn, and R. D’Andrea, “A computationally efficient motion primitive for quadrocopter trajectory generation,” IEEE Trans. on Robotics (T-RO), vol. 31, no. 6, pp. 1294–1310, 2015.

이러한 방식은 시간에 대한 다항식으로 궤적을 구성하여 $\mathbf{x}=[p^T, v^T, a^T]^T$ 와 같이 state space를 구성하고 control input을 $j$ 혹은 snap ( 이 경우 $j^T$ 도 $\mathbf{x}$ 에 포함)을 사용한다.

>[!quote] time-optimal한 궤적 생성에 관한 논문들
>
> 4. Y. Bouktir, M. Haddad, and T. Chettibi, “Trajectory planning for a quadrotor helicopter,” in 16th Mediterranean Conference on Control and Automation, 2008.
>
> 5. J. Jamieson and J. Biggs, “Near minimum-time trajectories for quadrotor UAVs in complex environments,” in IEEE/RSJ Int. Conf. on Intelligent Robots and Systems (IROS), 2016, pp. 1550–1555.

하지만 장애물을 고려하게 되면 constraint 부분이 추가되면서 더 어려운 문제가 된다. (특히 real-time application에서)

*mixed integer optimization* 방식을 사용한 아래 논문들도 있지만, 연산 속도는 여전히 challenging 하다.

>[!quote] Mixed integer optimization
>
> 6. D. Mellinger, A. Kushleyev, and V. Kumar, “Mixed-integer quadratic program trajectory generation for heterogeneous quadrotor teams,” in Proceedings of the 2012 IEEE International Conference on Robotics and Automation (ICRA), 2012.
>
> 7. R. Deits and R. Tedrake, “Efficient mixed-integer planning for UAVs in cluttered environments,” in Proceedings of the 2015 IEEE International Conference on Robotics and Automation (ICRA), 2015.

>[!quote] Quadratic programming / real-time / collision-free trajectory generation
>
> 8. C. Richter, A. Bry, and N. Roy, “Polynomial trajectory planning for aggressive quadrotor flight in dense indoor environments,” in Robotics Research. Springer, 2016, pp. 649–666.
>
> 9. **S. Liu, M. Watterson, S. Tang, and V. Kumar, “High-speed navigation for quadrotors with limited onboard sensing,” in 2016 IEEE International Conference on Robotics and Automation (ICRA). IEEE, 2016.**
>
> 10. **S. Liu, M. Watterson, K. Mohta, K. Sun, S. Bhattacharya, C. J. Taylor, and V. Kumar, “Planning dynamically feasible trajectories for quadrotors using safe flight corridors in 3-D complex environments,” IEEE Robotics and Automation Letters, vol. 2, no. 3, pp. 1688–1695, July 2017.**
>
> 11. J. Chen, T. Liu, and S. Shen, “Online generation of collision-free trajectories for quadrotor flight in unknown cluttered environments,” in 2016 IEEE International Conference on Robotics and Automation (ICRA). IEEE, 2016, pp. 1476–1483.

위 논문들은 collision-free한 geometric 경로를 만든 후, 부분적으로 dynamically-feasible한 궤적을 최적화한다.(*optimizing it locally to obtain a dynamically-feasible time-parametrized trajectory*)

문제는 geometric한 경로는 dynamics를 고려하지 않고 단순 공간적인 정보만 고려하여, 이후 최적화를 진행하더라도 geometric 경로들이 이루는 homology class에 갇히게 되어 locally optimal 하다.

따라서 본 논문은 전역 경로(*global trajectory*)에 대해 collision-free, dynamically-feasible, minimum-time, smooth trajectories, real-time 한 최적화 방법을 제안하고자 한다.

geometric 경로 대신 Optimal Control Problem(OCP)를 풀어 얻은 motion primitives의 집합으로 경로들을 만들고 이를 그래프 탐색 방식으로 적절한 경로를 선정하고자 한다.

그래프 탐색이 비효율적이지만 본 논문은 *tight lower bound(but heuristic)* 로 탐색을 빠르게 만들었다.

## Problem Formulation
대다수의 내용은 [[2023-11-14-SearchMotionPlanning#^168943|이전 Post의 Formulation]]과 거의 동일하다. 따라서 디테일한 설명은 생략한다.

$\mathscr{X}^{free}=\mathscr{P}^{free}\times\mathscr{D}^{free}$ 로 정의한다. $\mathscr{P}^{free}$ 는 obstacle-free한 위치들이 이루는 공간(or 집합)이고 $\mathscr{D}^{free}$ 는 dynamics를 고려한 것이다. dynamics는 differential flatness를 이용해 $[\dot{x},\ddot{x},\dots]$ 의 최소 최댓값으로 한다.

>[!quote]
>12. D. W. Mellinger, “Trajectory generation and control for quadrotors,” Ph.D. dissertation, University of Pennsylvania, 2012.

위 논문을 포함한 여러 연구에서 quadrotor의 differential flatness를 통해 1D control input과 time-parametrized 다항식 궤적이 가능함을 보였다. (수식 생략, [[2023-11-14-SearchMotionPlanning#^f09c4e|이전 Post 수식 (8) 참고]])

그리고 이러한 다항식 궤적을 미분함으로써 시간 $t$ 에서의 state $x(t)$ 를 구성하였다. control input $u$ 또한 이 궤적의 $n$ 번째 미분으로 얻을 수 있고 이를 간단히 표현하면 아래와 같이 표현가능하다.

$$
\begin{align}
\dot{x}&=Ax+Bu \\
A &= \begin{bmatrix}
0 & I_3 & 0 & \dots & 0 \\
0 & 0 & I_3 & \dots & 0 \\
\vdots & \ddots & \ddots & \ddots & \vdots \\
0 & \dots & \dots & 0 & I_3 \\
0 & \dots & \dots & 0 & 0
\end{bmatrix},
B = \begin{bmatrix}
0 \\ 0 \\ \vdots \\ 0 \\ I_3
\end{bmatrix}
\end{align}
\tag{2}
$$

시간에 대해 differentially flat한 system에서 사용되는 equation 이다.

***Problem 1** ^423c6b

주어진 초기 state $x_0 \in \mathscr{X}^{free}$ 과 목표 지역 $\mathscr{X}^{goal} \subset \mathscr{X}^{free}$ 에 대해 다항식 궤적의 계수를 찾는다

$$
\begin{align}
& \min_{D,T}=J(D)+\rho T \\
s.t. \space \dot{x}(t)&=Ax(t)+Bu(t), \forall t \in [0, T] \\
x(0) &= x_0, x(T) \in \mathscr{X}^{goal} \\
x(t) & \in \mathscr{X}^{free}, u(t) \in \mathscr{U}, \forall t \in [0, T]
\end{align}
\tag{4}
$$

이 때 $D \in \mathbb{R}^{3 \times (K+1)}$ 은 다항식 계수 $d_i, i=1,\dots,K$ 가 이루는 $K \times 1$ 열벡터이다. $J$ 는 이전 Post에서처럼 control effort 이다. $\rho\geq 0$ 는 궤적 비행 시간 $T$ 와 smoothness(=control effort) $J$ 를 밸런싱하는 가중치이다. 

위와 같이 목적함수를 설정한 것에 대해서는 아래 그림으로 설명하고 있다.

![[Liu et al_LQMT_fig2.png]]

즉, (a)와 (b)는 소요되는 effort가 다르지만 경로 비행에 걸리는 시간은 동일하다. 둘다 적은 시간이지만 (a)가 더 우수한 경로임을 알 수 있다. effort가 훨씬 적은 (c)는 (a)보다 시간이 더 소요되었다. 따라서 저자는 두 가지를 모두 적절히 고려해야 한다고 주장한다.

>[!note]
>- 너무 heuristic한 방식이 아닐까? 고려해야 하는 요소들이 더 있거나 $\rho$ 로만 조절하기에 부적절하다거나

[[#^423c6b|Problem 1]]은 state에 대한 constraints가 더해진 *Linear Quadratic Minimum-Time problem* 이다.

>[!quote]
>13. E. Verriest and F. Lewis, “On the linear quadratic minimum-time problem,” IEEE Transactions on Automatic Control, vol. 36, no. 7, pp. 859–863, 1991.

**이 $x(t) \in \mathscr{X}^{free}, u(t) \in \mathscr{U}, \forall t \in [0, T]$ 부분이 풀기 어려운 부분인데, 만약 이 부분을 덜어낼 수 있다면 Pontryagin's minimum principle에 의해 최적해를 구할 수 있게 된다.**

본 논문은 이 safety constraints 부분을 *deterministic shortest path problem* 으로 바꿔서 해결하였다고 한다. (*with $3n$* dimensional state space $\mathscr{X}$, 3 dimensional control space $\mathscr{U}$)

>[!quote]
>14. D. Bertsekas, Dynamic Programming and Optimal Control. Athena Scientific, 1995.

또한, $\mathscr{U}$ 가 3차원이고, 정해진 시간에 discretized 된 공간에서 경로 계획을 수행하므로 sampling-based 보다 search-based가 더 낫다고 한다.

## Optimal Trajectory Planning

### A. Motion Primitives