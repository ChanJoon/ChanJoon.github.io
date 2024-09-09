---
layout: post
title: "[T-Mech '24] SGS-Planner: A Skeleton-Guided Spatiotemporal Motion Planner for Flight in Constrained Space"
date: 2024-09-09
categories: Robotics
tags:
  - paper
  - self-study
  - control-planning
math: "true"
---

# SGS-Planner: A Skeleton-Guided Spatiotemporal Motion Planner for Flight in Constrained Space

> T. Li, S. Zhang, X. Zhang, Q. Dong, and J. Huang, “SGS-Planner: A Skeleton-Guided Spatiotemporal Motion Planner for Flight in Constrained Space,” IEEE/ASME Transactions on Mechatronics, pp. 1–12, 2024, doi: 10.1109/TMECH.2024.3393144.

이 논문은 올해 T-Mech Accept 된 논문으로 기존의 SOTA 로 여겨진 GCOPTER 기반의 nonlinear optimization 방식으로 경로를 생성하던 방식 대신 hierarchical framework 기반의 QP 로 경로를 생성하였다.

따라서, <u>어떤 부분에서 뚜렷한 contribution 이 있었고 motion planning 에서 얻어갈 요소가 있을지 찾아보자.</u>

![[SGSPlanner_Fig1.png]] ^b64b4f

**주요 contributions**
1. **hierarchical motion planner 로 spatial 과 temporal planning 을 순차적으로 진행한다.**
2. **skeleton 기반의 sphere inflation method 를 제안하여 빠르고 안전한 경로를 만들 수 있게 하였다.**
3. **environmental adaptive parameter tuning 을 통해 path smoothing 이 이루어진다. 이는 unconstrained QP 를 풀어 closed-form solution 도 얻어내 해결한다.**

## Introduction

본 논문에서 제시하는 시작점은 여러 motion planning method 들이 제안되었음에도, 여전히 제한적인 환경에서는 비행하기 어렵다는 것이다.

>[!quote]- Considerable motion planning methods
>
>[4] Y. Li, G. Lu, D. He, and F. Zhang, “Robocentric model-based visual servoing for quadrotor flights,” IEEE/ASME Trans. Mechatron., vol. 28, no. 4, pp. 2155–2166, Aug. 2023.
>
>[5] J. Yuan, “Hierarchical motion planning for multisteering tractor-trailer mobile robots with on-axle hitching,” IEEE/ASME Trans. Mechatron., vol. 22, no. 4, pp. 1652–1662, Aug. 2017.
>
>[6] V. Usenko, L. V. Stumberg, A. Pangercic, and D. Cremers, “Real-time trajectory replanning for MAVs using uniform B-splines and a 3D circular buffer,” in Proc. IEEE/RSJ Int. Conf. Intell. Robots Syst., 2017, pp. 215222.
>
>[7] H. Oleynikova, Z. Taylor, R. Siegwart, and J. Nieto, “Safe local exploration for replanning in cluttered unknown environments for microaerial vehicles,” IEEE Robot. Autom. Lett., vol. 3, no. 3, pp. 1474–1481, Jul. 2018.
>
>[8] B. Zhou, J. Pan, F. Gao, and S. Shen, “RAPTOR: Robust and perceptionaware trajectory replanning for quadrotor fast flight,” IEEE Trans. Robot., vol. 37, no. 6, pp. 1992–2009, Dec. 2021.
>
>[9] X. Zhou, Z. Wang, H. Ye, C. Xu, and F. Gao, “EGO-Planner: An ESDF-free gradient-based local planner for quadrotors,” IEEE Robot. Autom. Lett., vol. 6, no. 2, pp. 478–485, Apr. 2021.
>
>[10] D. Mellinger and V. Kumar, “Minimum snap trajectory generation and control for quadrotors,” in Proc. IEEE Int. Conf. Robot. Autom., 2011, pp. 2520–2525.
>
>[11] S. Liu et al., “Planning dynamically feasible trajectories for quadrotors using safe flight corridors in 3-D complex environments,” IEEE Robot. Autom. Lett., vol. 2, no. 3, pp. 1688–1695, Jul. 2017.
>
>[12] C. Richter, A. Bry, and N. Roy, “Polynomial trajectory planning for aggressive quadrotor flight in dense indoor environments,” in Proc. Robot. Res.: 16th Int. Symp., 2016, pp. 649–666.
>
>[13] J. Tordesillas, B. T. Lopez, M. Everett, and J. P. How, “FASTER: Fast and safe trajectory planner for navigation in unknown environments,” IEEE Trans. Robot., vol. 38, no. 2, pp. 922–938, Apr. 2022.
>
>[14] F. Gao, L. Wang, B. Zhou, X. Zhou, J. Pan, and S. Shen, “Teach-repeatreplan: A complete and robust system for aggressive flight in complex environments,” IEEE Trans. Robot., vol. 36, no. 5, pp. 1526–1545, Oct. 2020.
>
>[15] W. Ding, W. Gao, K. Wang, and S. Shen, “An efficient B-spline-based kinodynamic replanning framework for quadrotors,” IEEE Trans. Robot., vol. 35, no. 6, pp. 1287–1306, Dec. 2019.
>
>[16] S. Liu, K. Mohta, N. Atanasov, and V. Kumar, “Search-based motion planning for aggressive flight in SE(3),” IEEE Robot. Autom. Lett.,vol.3, no. 3, pp. 2439–2446, Jul. 2018.
>
>[17] G. Xu, Y. Chen, J. Cao, D. Zhu, W. Liu, and Y. Liu, “Multivehicle motion planning with posture constraints in real world,” IEEE/ASME Trans. Mechatron., vol. 27, no. 4, pp. 2125–2133, Aug. 2022.
>
>[18] Y. Yan, L. Peng, J. Wang, H. Zhang, T. Shen, and G. Yin, “A hierarchical motion planning system for driving in changing environments: Framework, algorithms, and verifications,” IEEE/ASME Trans. Mechatron., vol. 28, no. 3, pp. 1303–1314, Jun. 2023.

실제로 safe flight corridor 에 의존하는 경로 생성 방식으로 인해 좁은 틈이나 복잡한 환경에서는 안전한 경로가 확보되기 어렵고, real-time replanning 이 어렵다!!

Time-optimal 을 고려하고자 한 선행 연구들로는 Scaramuzza 교수님 연구실에서 나온 [21] 과 [22] 가 있다.

Spatial-temporal optimization 을 같이 수행한 대표적인 연구인 Teach-repeat-replan [14] 도 있다. 하지만 이러한 방식들은 computationally expensive 한 단점이 있다.

>[!quote] Considering time optimality in optimization
>
>[21] P. Foehn, A. Romero, and D. Scaramuzza, “Time-optimal planning for quadrotor waypoint flight,” Sci. Robot., vol. 6, no. 56, 2021, Art. no. eabh1221.
>
>[22] R. Penicka and D. Scaramuzza, “Minimum-time quadrotor waypoint flight in cluttered environments,” IEEE Robot. Autom. Lett., vol. 7, no. 2, pp. 5719–5726, Apr. 2022.
>
>[14] F. Gao, L. Wang, B. Zhou, X. Zhou, J. Pan, and S. Shen, “Teach-repeatreplan: A complete and robust system for aggressive flight in complex environments,” IEEE Trans. Robot., vol. 36, no. 5, pp. 1526–1545, Oct. 2020.

이러한 motion planner 들 중 좁은 틈을 잘 지나도록 한 선행 연구들도 제시하였는데, 이는 생략하고 흐름만 요약하도록 하자.

[[2023-11-14-SearchMotionPlanning|Liu et al.]] 등의 방법들과 narrow gaps 논문들도 있고 터널 환경을 지나기 위해 center line 을 뽑아서 경로를 계획하는 방식들도 있었다.

넓은 free space 확보를 위한 **skeleton graph 방식**들도 있는데 대표적으로는 **generalized Voronoi diagram(GVD)-based 방법과 clustering-based 방법**이 있다.

>[!quote] Skeleton graph methods in motion planning
>
>[31] J. Wen, X. Zhang, H. Liu, H. Liu, J. Yuan, and Y. Fang, “G 2 VD Planner: An efficient motion planning approach with grid-based generalized Voronoi diagrams,” 2022, arXiv:2201.12981.
>
>[32] C. Howie and B. Joel, “Sensor-based exploration: The hierarchical generalized Voronoi graph,” Int. J. Robot. Res., vol. 19, no. 2, pp. 96–125, 2000.
>
>[33] D. Dolgov, S. Thrun, M. Montemerlo, and J. Diebel, “Path planning for autonomous vehicles in unknown semi-structured environments,” Int. J. Robot. Res., vol. 29, no. 5, pp. 485–501, 2010.
>
>[34] H. Oleynikova, Z. Taylor, R. Siegwart, and J. Nieto, “Sparse 3D topological graphs for micro-aerial vehicle planning,” in Proc. IEEE/RSJ Int. Conf. Intell. Robots Syst., 2018, pp. 1–9.
>
>[35] F. Blochliger, M. Fehr, M. Dymczyk, T. Schneider, and R. Siegwart, “Topomap: Topological mapping and navigation based on visual SLAM maps,” in Proc. IEEE Int. Conf. Robot. Autom., 2018, pp. 3818–3825.
>
>[36] X. Chen, B. Zhou, J. Lin, Y. Zhang, F. Zhang, and S. Shen, “Fast 3D sparse topological skeleton graph generation for mobile robot global planning,” in Proc. IEEE/RSJ Int. Conf. Intell. Robots Syst., 2022, pp. 10283–10289.

[34] 에서는 ESDF 기반에서 3D GVD 를 만드는 방법론이 제안되었다. 그러나 ESDF 를 구성하고 저장하는 과정에서 많은 시간이 소요된다.

[35] 에서 clustering-based 방법이 제시되었는데, 이는 free space 를 여러 convex cluster 로 구성하여 skeleton graph 로 구성하는 방식이다. 하지만, cluster 의 convexity 를 확인하는 방식이 매우 time-consuming 하다는 단점이 있다.

Ray sampling 기반으로 빠르게 cluster 를 생성하는 [36] 은 accuracy 와 computational cost 사이의 밸런싱이 어렵다는 단점이 있다. 즉, 3D 환경에서 skeleton 을 얻어내는 것은 여전히 challenging 하다고 한다.

*Skeleton-graph methods 를 이번에 알게 되어 자세한 연구 동향은 잘 모름.*

여기서 제시된 EGO-Planner 는 soft constrained 방식으로 GCOPTER 에서 사용한 방식에 기반하였다. 그러나, 이 논문에서는 <span style="color:red">**nonlinear optimization 이므로 local minima 에 빠질 수 있고, initial solution 에 민감하다고 지적하고 있다.**</span>

반면 hard-constrained 방식인 convex optimization(CO) 기반은 초창기부터 활발히 연구되어왔다. 앞선 방식에 비해 느리다는 단점이 있다고 알고 있다. 본 논문에서 제시한 문제점은 <span style="color:red">s**afety 가 hard constrained 로 고려되기 때문에 장애물과 너무 가깝게 경로가 생성될 수 있고, 실제 환경에서는 외란 등으로 인해 unsafe 할 수 있다고 한다.**</span>

**따라서 본 논문은 위와 같은 문제점들을 해결하여 success rate, computational efficiency, minimum clearance 에서 우수함을 보인다고 한다.**

## Spatio-temporal Planning Framework

위 [[#^b64b4f|Fig. 1.]] 에 본 논문의 전체적인 구조가 제시되어 있다. 최근 대부분 연구들은 한번에 spatio-temporal optimization 을 수행하는데, 본 논문은 두 개의 sub-problem 으로 구분하여 별도로 optimization 하여 적은 constraints 와 dimension 을 가진다는 장점이 있다.

>[!question]
> - decouple 로 하면 효율적인 대신 sub optimal 한 것이 아닌지?
> - 전체 problem 을 한번에 optimization 하지 않고 spatial 에 대해 먼저 optima 를 찾고 이에 대한 temporal 을 optimization 하는 것이 아닌가

**Spatial planning** 부분은 우리가 익숙히 알던 부분과 동일하다. A* 와 같은 searching-based method 로 초기 경로를 생성한다. 그리고 이 경로점들을 기반으로 flight corridor 를 생성한다.

본 논문에서는 **fast sphere inflation-based skeleton extraction approach** 라고 표현하였다. 그리고 unconstrained QP 를 풀어내 path smoothing 과정이 이루어진다.

이 **최적화 과정에서 환경에 adaptive 하게 parameter tuning** 이 이루어진다.

**Temporal planning** 에서는 최적화된 경로에 대해 **time-optimal trajectory generation(TOTG)** 방법을 통해 시간 최적화가 이루어진다. 하지만 강건하지 않아 실패할 경우에 trapezoidal velocity profile 이 사용된다.

>[!quote] TOTG
>
>[40] T. Kunz and M. Stilman, “Time-optimal trajectory generation for path following with bounded acceleration and velocity,” in Proc. Robot.: Sci. Syst. VIII, 2012, pp. 1–8.

보다시피 기존 motion planner 와 다른 점은 **skeleton approach, adaptive parameter tuning, TOTG** 정도가 있겠다.

## Fast Sphere Inflation-based Skeleton Extraction

![[SGSPlanner_Fig2.png]]



## Skeleton-guided Path Smoothing with Environmental Adaptive Parameter Tuning

## Simulations and Experiments

## Conclusion