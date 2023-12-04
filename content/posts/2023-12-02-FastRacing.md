---
layout: post
title: "[RA-L '21] Fast-Racing: An Open-Source Strong Baseline for SE(3) Planning in Autonomous Drone Racing"
date: 2023-12-02
categories: Robotics
tags:
  - paper
math: "true"
---

# Fast-Racing: An Open-Source Strong Baseline for SE(3) Planning in Autonomous Drone Racing

>[!cite]
>- Z. Han, Z. Wang, N. Pan, Y. Lin, C. Xu and F. Gao, "Fast-Racing: An Open-Source Strong Baseline for $\mathrm{SE}(3)$ Planning in Autonomous Drone Racing," in IEEE Robotics and Automation Letters, vol. 6, no. 4, pp. 8631-8638, Oct. 2021, doi: 10.1109/LRA.2021.3113976.

[Publisher Link](https://doi.org/10.1109/LRA.2021.3113976.)

[[2023-11-29-WholebodyMotionPlanning|앞서 ICRA 논문]]과 경로 생성 방식은 동일하지만 드론 모델링 / GPU 사용 / 시뮬레이션 환경 제안 등을 하며 앞으로의 SE(3) 경로 계획 논문들에 비교할 수 있는 기준을 제시하였다.

nonlinear constraints 를 cubic and max function 으로 바꿔 unconstrained optimization problem 을 quasi-Newton method로 해결하는 내용은 같으나, 다른 방식으로 수식을 표현하여 참고하고 이를 병렬 컴퓨팅으로 연결하여 성능을 개선한 점도 주목할만 하다.

## Introduction

드론 레이싱에서 planning 에 대한 벤치마크가 없고 $\mathrm{SE}(3)$ planning 에서 오픈소스로 공개된 baseline도 부재하다.

*The reason is that SE(3) planning is much more complicated than traditional planning in $\mathbb{R}^3$ because the former requires group operations while conventional optimizers require decision variables in Euclidean spaces.*

>[!example] Todo
>- $\mathrm{SE}(3)$ 와 $\mathbb{R}^3$ 에서의 planning 차이 명확하게 이해하기

>[!quote] Dataset and AirSim
>
>4. A. Antonini, W. Guerra, V. Murali, T. Sayre-McCord, and S. Kara-man, “The Blackbird Dataset: A large-scale dataset for UAV perception in aggressive flight,” in Proc. Int. Symp. Exp. Robot., Springer, 2018, pp. 130–139.
> 5. J. Delmerico, T. Cieslewski, H. Rebecq, M. Faessler, and D. Scaramuzza, “Are we ready for autonomous drone racing? The UZH-FPV drone racing dataset,” in Proc. IEEE Int. Conf. Robot. Automat., 2019, pp. 6713–6719.
> 6. R. Madaan et al., “AirSim drone racing lab,” in Proc. NeurIPS Competition Demonstration, PMLR, 2020, pp. 177–191.

^88504f

**주요 contribution**
- simulation platform designed for SE(3) planning
- trajectory optimization based on parallel computing

특히, 다항식과 $max(\cdot, 0)^3$ 으로 정리되는 목적함수의 gradient를 total time, constraints point의 discretization number $M, L$ 에 대해 GPU 쓰레드 / 블럭으로 분할하여 연산하는 방식을 제안한 것이 인상적이었다.

**문제점**
1. a known map / static racing tracks
2. a global trajectory offline before the racing starts

## Related Works

큰 내용이 없어 선행 연구 문제점 짚은 거 정도만 요약

### A. Autonomous Drone Racing

드론 레이싱과 같은 환경에서의 visual-based 의 상태 추정(*state estimation*)을 위한 데이터셋들로 Blackbird dataset[[#^88504f|[4] ]] 과 UZH-FPV dataset[5] 를 제시하였다.