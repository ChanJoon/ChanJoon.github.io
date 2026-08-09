---
layout: post
title: "[ICRA '23] Online Whole-body Motion Planning for Quadrotor using Multi-resolution Search"
date: 2023-12-05
tags:
  - paper
math: "true"
paper:
  title: "Online Whole-Body Motion Planning for Quadrotor using Multi-Resolution Search"
  authors: "Yunfan Ren, Siqi Liang, Fangcheng Zhu, Guozheng Lu, Fu Zhang"
  venue: "ICRA"
  year: 2023
  arxiv: "2209.06761"
  doi: "10.1109/ICRA48891.2023.10160767"
  bibkey: "ren2023onlinewb"
---

# Online Whole-body Motion Planning for Quadrotor using Multi-resolution Search

> Y. Ren, S. Liang, F. Zhu, G. Lu and F. Zhang, "Online Whole-Body Motion Planning for Quadrotor using Multi-Resolution Search," 2023 IEEE International Conference on Robotics and Automation (ICRA), London, United Kingdom, 2023, pp. 1594-1600, doi: 10.1109/ICRA48891.2023.10160767.

[Publisher Link](https://doi.org/10.1109/ICRA48891.2023.10160767)

[[2023-11-14-SearchMotionPlanning|Liu et al.]] 과 [[2023-12-02-FastRacing|Han et al.]] 이 가지고 있는 문제를 일부 해결하면서 모르는 지도에 대한 최적 경로 생성에 대한 논문으로, 대다수는 [[2024-02-06-GCOPTER|GCOPTER]] 논문을 기반으로 하되 프레임 워크를 제안하였다.

**주요 contribution**
- **좁은 지역은 full pose (=$\mathrm{SE}(3)$) planning을 하고 이외의 지역은 position planning을 하도록 하는 hierachical framework 를 제안**
- **라이다를 이용해 모르는 지형에서 비행이 가능하고 제안한 프레임 워크를 통해 온보드로 컴퓨팅이 가능함**

**문제점**
- **오픈 소스로 내용을 공개하지 않았다**
- **그리고 $\mathrm{SE}(3)$ 에서 타원체로 모델링 하는 것에서 이슈가 발생할 수 있음**
- **새로 제안한 여러 방식에서 개선점이 있을 수 있음**
	1. Parallel multi-resolution search: 더 복잡한 환경 혹은 틈과 넓은 공간이 같이 있는 경로에서 비효율적인 경로 계획 가능
	2. Seed generation method: 기존 polyhedron 생성 방법에서 overlap이 생기는 것을 개선하고자 도입한 방식인데, 방식이 명료하지 않음.(그러나 코드가 공개되지 않아서 어떤 식으로 실험에서 적용하였는데 불분명함)
	3. $\mathbb{R}^3$ 와 $\mathrm{SE}(3)$ 경로 간의 연결

## Introduction

$\mathbb{R}^3$ planning 논문들과 $\mathrm{SE}(3)$ planning 논문들을 제시하고 단점들을 지적하는 부분들만 요약해서 정리함.

>[!quote] Simply ignore the shape and orientation of the drone
>1. Jesus Tordesillas, Brett T Lopez, Michael Everett, and Jonathan P How. Faster: Fast and safe trajectory planner for navigation in unknown environments. IEEE Transactions on Robotics, 38(2):922–938, 2021.
>2. Xin Zhou, Zhepei Wang, Hongkai Ye, Chao Xu, and Fei Gao. EGO-Planner: An ESDF-free gradient-based local planner for quadrotors. IEEE Robotics and Automation Letters, 6(2):478– 485, 2021.
>3. Yunfan Ren, Fangcheng Zhu, Wenyi Liu, Zhepei Wang, Yi Lin, Fei Gao, and Fu Zhang. Bubble planner: Planning high-speed smooth quadrotor trajectories using receding corridors. arXiv preprint arXiv:2202.12177, (Accepted by 2022 IROS), 2022.
>4. Boyu Zhou, Fei Gao, Jie Pan, and Shaojie Shen. Robust real-time UAV replanning using guided gradient-based optimization and topological paths. In 2020 IEEE International Conference on Robotics and Automation, pages 1208–1214. IEEE, 2020.
>5. Sikang Liu, Nikolay Atanasov, Kartik Mohta, and Vijay Ku-mar. Search-based motion planning for quadrotors using linear quadratic minimum time control. In 2017 IEEE/RSJ international conference on intelligent robots and systems (IROS), pages 2872–2879. IEEE, 2017.

위 논문들은 드론 모델링을 구로 하거나 orientation 을 무시하여 $\mathbb{R}^3$ 에서 플래닝하는 선행 연구들이다.

잘 알려진 Faster (T-RO 논문)과 EGO-Planner와 Bubble Planner도 보이고 앞서 정리했던 [[2023-11-16-SearchMotionPlanningLQMTC|Search-based planning using LQMTC]] 논문도 보인다.

이러한 방식은 앞서 여러차례 다뤘던 대로 자세를 고려하지 않아 보수적으로 비행하고 dynamically feasible 하다고 보기 어렵다.

$\mathrm{SE}(3)$ planning 논문들의 **큰 문제 중 하나는 *unknown and unstructured* 환경에서 경로 계획하지 않는다는 것이다.**

>[!quote] .$\mathrm{SE}(3)$ but assumptions on the environment (small gaps)
>
>6. Giuseppe Loianno, Chris Brunner, Gary McGrath, and Vijay Kumar. Estimation, control, and planning for aggressive flight with a small quadrotor with a single camera and imu. IEEE Robotics and Automation Letters, 2(2):404–411, 2016.
>7. Toru Hirata and Makoto Kumon. Optimal path planning method with attitude constraints for quadrotor helicopters. In Proceedings of the 2014 International Conference on Advanced Mechatronic Systems, pages 377–381. IEEE, 2014.
>8. Jiarong Lin, Luqi Wang, Fei Gao, Shaojie Shen, and Fu Zhang. Flying through a narrow gap using neural network: an end-to-end planning and control approach. In 2019 IEEE/RSJ International Conference on Intelligent Robots and Systems (IROS), pages 3526–3533. IEEE, 2019.
>9. Shaohui Yang, Botao He, Zhepei Wang, Chao Xu, and Fei Gao. Whole-body real-time motion planning for multicopters. In 2021 IEEE International Conference on Robotics and Automation (ICRA), pages 9197–9203. IEEE, 2021.
>10. Zhepei Wang, Xin Zhou, Chao Xu, and Fei Gao. Geometrically constrained trajectory optimization for multicopters. IEEE Transactions on Robotics, 2022.

위 논문들은 지나가야 하는 틈에 대해 미리 알고 있는 것을 전제로 경로 계획이 이루어 져서 실제 환경에서 사용하기에는 어렵거나 전역 지도가 필요했다.

[[2023-12-02-FastRacing|Han et al.]] 논문에서 언급되었듯이 [6]-[8] 은 틈을 지나는 것에만 초점을 많이 맞추었고, [9] 는 [[2023-11-29-WholebodyMotionPlanning|이전 Post]] 에서 다루었고 [10] 은 [[2024-02-06-GCOPTER|GCOPTER]] 논문이다.

또 다른 기존 $\mathrm{SE}(3)$ Planning 연구의 문제점으로 꼽은 것은 연산 효율성이다. 아마도 본 연구의 contribution을 강조하고자 넣은 것으로 보이는데, 아래 연구들을 꼽으며 **수백 $ms$ 에서 수 초의 연산이 걸린다**고 한다.

>[!quote] Recent online planning researchs
>
>11. Zhichao Han, Zhepei Wang, Neng Pan, Yi Lin, Chao Xu, and Fei Gao. Fast-racing: An open-source strong baseline for se(3) planning in autonomous drone racing. IEEE Robotics and Automation Letters, 6(4):8631–8638, 2021.
>12. Sikang Liu, Kartik Mohta, Nikolay Atanasov, and Vijay Kumar. Search-based motion planning for aggressive flight in se (3). IEEE Robotics and Automation Letters, 3(3):2439–2446, 2018.

[[2023-11-14-SearchMotionPlanning|Sikang 논문]] 과 같이 묶여서 까인 느낌이 있지만, [[2023-12-02-FastRacing|Han et al.]] 의 경우에도 이전 $A^*$ 경로 계획을 필요로 하고 사실 [[2023-11-29-WholebodyMotionPlanning|Yang et al.]] 논문을 GPU 병렬 컴퓨팅으로 최적화 한 것이므로 여전히 꽤 많은 시간이 소요된다고 볼 수 있다.

따라서 본 연구에서는 Multi-resolution search method 를 통해 넓은 지역에서는 $\mathbb{R}^3$ planning 을 수행하고 online planning 중 발견되는 좁은 틈에 대해서 $\mathrm{SE}(3)$ planning 을 수행하여 위 문제들을 해결하고자 한다.

## Related Works

위에서도 충분히 선행 연구에 대한 논의가 이루어져서 필요한 부분 위주로만 요약.

위에서 [1]-[3] (*Faster, EGO, Bubble-planner*) 과 아래 두 논문들은 기체를 구로 모델링하여 configuration space 를 쉽게 구성할 수 있었고 장애물 회피에 대한 보수적인 가정이 전제된 $\mathrm{R}(3)$ planning 을 수행하였다.

>[!quote]
>13. Boyu Zhou, Fei Gao, Luqi Wang, Chuhao Liu, and Shaojie Shen. Robust and successful quadrotor trajectory generation for fast autonomous flight. IEEE Robotics and Automation Letters, 4(4):3529–3536, 2019.
>14. Fanze Kong, Wei Xu, Yixi Cai, and Fu Zhang. Avoiding dynamic small obstacles with onboard sensing and computation on aerial robots. IEEE Robotics and Automation Letters, 6(4):7869–7876, 2021.

그리고 [9]-[11] 인 [[2023-11-29-WholebodyMotionPlanning|Yang et al.]], GCOPTER, [[2023-12-02-FastRacing|Han et al.]] 논문들이 optimization-based 방식의 최신 논문들인데, 문제점으로 꼽은 것들은 아래와 같다.

우선 최적화 전에 수행되는 전역 경로 탐색을 포함하면 수백 $ms$ 가 소요된다는 점과, collision-free 를 위해 사용되는 **flight corridor 방식이 때때로 infeasible 하여 좁은 틈을 지나는 것에 실패하는 경우가 있다**는 것이다.

본 연구는 GCOPTER 논문의 대부분 방식을 사용하되 $\mathbb{R}^3$ 와 $\mathrm{SE}(3)$ planning 을 혼합하고 flight corridor 를 일부 수정하여 **주어진 지도 없이, 실시간으로 좁은 틈을 높은 성공률과 적절한 컴퓨팅 시간** 으로 비행토록 하였다.

## Preliminaries

### A. System Modeling and Polynomial Trajectory

여기는 많이 다뤘던 differentially flat system 에 대한 내용이다. 다른 논문들에서는 yaw angle trajectory $\Phi(t)$ 를 0으로 두는 경우가 많았는데 여기서는 진행 방향을 바라볼 수 있도록 $\mathbf{p}(t)$ 의 법선 방향으로 설정하였다.

그리고 kinodynamic constraints 또한 이를 이용해 속도, 가속도, jerk 의 상/하한으로 두었다. GCOPTER 논문 방식을 차용하여 piece-wise polynomials 로 경로를 표현하여, 다항식 계수와 시간 벡터로 정의하였다.

![[Ren2023icra_IIIA.png]]

여기서 살짝 헷갈리는 부분은 $c_1, \dots, c_M \in \mathbb{R}^{2s \times 3}$ 으로 이전 논문들과 크기가 동일한데, $s=4$ 로 두어 jerk 까지 연속적일 수 있도록 하였다고 한다.

이전 논문에서는 $s=3$ 으로 두고 snap 까지 연속적이라고 표현하였다. (아래 이미지)

![[Ren2023icra_fastracing.png]]

![[Ren2023icra_fastracingcoeff.png]]

보다시피 $2s$ boundary condition 이므로 차수는 $2s-1$ 까지여서 두 벡터들(다항식 계수, 시간 기저 벡터) 크기가 같다.

>[!question]
>- $s$ 값에 따른 다항식 궤적 연속성
>- 우선 주어지는 initial and final state 의 크기에 따라 다항식의 계수와 차수가 정해진다.
>- 본 논문에서는 $\mathbf{x}=[\mathbf{p},\mathbf{v},\mathbf{a},\mathbf{j}]$ 로 initial and final state 를 주므로 $s=4$ 가 맞고 7차 다항식이 만들어지며 이는 jerk 까지 연속성을 필요로 한다. 또한, control input으로 snap을 사용하는 것으로 보인다.(논문 설명 모두 맞음)
>- 이전 논문에서는 $s=3$ 으로 사용하고 jerk 를 control input 으로 사용한다. 그렇다면 *snap is always continuous on the whole trajectory* 가 혼동된다.
>- jerk를 control input 으로 하면 시작과 마지막 state 는 가속도까지 정보를 준다는 것이다. 대신 중간 waypoint의 위치가 주어지므로 Optimality Condition 에 의해 4차인 snap 까지 연속적이다.
>- 그렇다면 본 논문에서는 각 piece-wise polynomials 간의 연속을 위해 추가적인 조건이 필요하지 않나?

### B. Safety Constraints

collision-free 한 경로를 위해 safe flight corridor (SFC) 를 사용한다.

각 경로 계획 방식에 따라 다른 모델링을 사용한다. $\mathbb{R}^3$ 에서는 효율성을 위해 가장 긴 축의 길이 $r$ 의 반지름을 가지는 구로 표현한다.

그리고 드론 모델을 점으로 표현하는 대신 장애물들을 $r$ 만큼 확장하여 생각하면 (*the configuration space by inflating all obstacle points with $r$*) 아래와 같은 수식으로 SFC 를 표현할 수 있다.

$$
A_i \mathbf{p}(t) - b_i \leq 0, \forall t \in [T_{i-1},T_i] \tag{3}
$$

그리고 $\mathrm{SE}(3)$ 에서는 타원체를 도입하여 [[2023-11-14-SearchMotionPlanning|Liu et al.]] 과 같이 사용할 수 있다. 다만, Liu et al. 에서는 타원체와 장애물 점과의 교점을 샘플링을 통해 판단하였지만, 여기서는 $\mathscr{H}$-representation 방식으로 표현하였다. $i$ 번째 polyhedron $\cal{P}_i$ 안에 있는 $i$ 번째 궤적 $p_i$ 에 대해 SFC 수식은 아래와 같다.

$$
\Big[[A_iR(t)Q]^2\mathbf{1}\Big]^{1/2} + A_i p_i(t) - b_i \leq \mathbf{0} \tag{5}
$$

이 때 $R(t)$ 는 rotation matrix 이고 $Q=\textbf{diag}(r,r,h)$ 로 타원체 모양을 표현한 것이다.

$\Big[[A_iR(t)Q]^2\mathbf{1}\Big]^{1/2}$ 부분은 unit sphere에 대해 타원체의 크기만큼 원래의 polyhedron이 떨어져 있는지로 이해하였다. 즉 원래의 CoM 대신 타원체 크기만큼 충돌하지 않는지를 판단하는 것이다.

>[!Note]
>- [[2023-11-29-WholebodyMotionPlanning|Yang et al.]] 에서는 Liu et al. 에서 타원체로 모델링 한 것을 비판하면서 장축의 길이로만 하면 CoM 이 중앙이 아닌 경우에 발생할 수 있는 점을 지적했다.
>- 그래서 Yang et al. 과 Han et al. 에서는 vertex $v_i$ 를 가지고 모델링 하여 직육면체나 다면체로 모델링하였다.
>- 본 논문에서는 그럼에도 타원체를 사용한 이유가 무엇일까? 연산 속도를 줄이기 위함이나 타원체 만으로도 충분히 장애물 회피가 잘 되어서인가?

### C. Trajectory Generation

$\mathbb{R}^3$ planning 은 주어진 start state $s_s=[p_s,v_s,a_s,j_s]$ 와 goal state $s_g=[p_g,v_g,a_g,j_g]$ 를 가지고 collision-free 하고 kinodynamic constraints 를 만족하는 경로를 생성한다.

>[!quote] RILS
>18. S. Liu et al., “Planning dynamically feasible trajectories for quadrotors using safe flight corridors in 3-D complex environments,” IEEE Robot. Automat. Lett., vol. 2, no. 3, pp. 1688–1695, Jul. 2017.

이전 [[2023-12-02-FastRacing|Fast-racing(Han et al.)]] 에서도 언급된 RILS 방식으로 SFC 를 연속적으로 만들고 GCOPTER 논문의 MINCO 경로 최적화로 생성한다.

그리고 $\mathrm{SE}(3)$ 경로 생성은 마찬가지로 GCOPTER 논문 방식을 사용한다.

## Planner

![[Ren2023icra_fig3.png]]

### A. Colliding Segments Extraction

우선 장애물을 고려하지 않고 Linear Quadratic Minimum Time 문제를 푸는 방식으로 global start state 와 global goal state 간의 경로를 생성한다.

>[!note]
>- 논문 notation 에서 global start state $s_g$ 와 이전 챕터 goal state $s_g$ 의 표현이 겹친다.

>[!quote] LQMT
>
>19. Mark W Mueller, Markus Hehn, and Raffaello D’Andrea. A computationally efficient motion primitive for quadrocopter trajectory generation. IEEE transactions on robotics, 31(6):1294– 1310, 2015.

다른 논문들에서 지적할 수 있는 전역 경로 생성을 $A^*$ 로 하여 dynamics 가 고려되지 않은 부분을 해결한 것으로 보인다.

그 후에는 생성된 경로에서 발생하는 충돌 지점 $\mathbf{S}=\{ \mathbf{S}_i = (s_i, e_i) | i=1,2,\dots,N\}$ 을 찾아낸다. 자세한 내용은 Fig.3 의 (a) 를 보자.

>[!question]
>- $s_i, e_i$ 쌍을 찾아내는 방식. 어떤 지점에서 각 지점에 대한 정보를 결정 짓는지?

### B. Parallel Multi-resolution Search

본 논문에서 제안하는 multi-resolution search 는 우선 low-resolution map (LRM) 과 high-resolution map (HRM) 으로 구성된다. LRM 은 기체의 장축 길이 $r$ 로 만들어지고 HRM 은 단축 길이 $h$ 로 만들어 진다.

이를 위해 타원체로 정의한 것으로 보인다.

>[!note]
>- 이러한 방식의 문제점은 이전에 지적된 대로 타원체가 이상적이지 않은 경우에는, 좁은 틈의 통과 여부를 기체에 따라 틀리게 판단할 수 있다. (i.e. $2h$ 가 기체의 가장 짧은 부분보다 더 짧은 경우)

따라서 LRM 은 앞선 $\mathbb{R}^3$ 방식과 동일하므로 Whole-body motion planning 이 필요하지 않고, HRM 에서 최적 제어가 필요하다고 볼 수 있다.

각 지도에 대해서 $A^*$ 탐색이 이루어지고 가장 먼저 탐색이 완료된 지도에 대해 경로 계획이 이루어진다. (e.g. *Terminal or Suspend sign*)

$\mathrm{SE}(3)$ planning 을 시도하더라고 infeasible 할 수 있으므로 이 때는 *Suspend* 하는 것이다.

### C. SE(3) Trajectory Generation

이제 이전 챕터에서 $\mathrm{SE}(3)$ planning 을 시도하는 경우, 이를 SE(3) sub-problem 으로 표현한다.

이제 $s_i$ 로부터 $e_i$ 까지를 연결하는 SFC 가 필요한데, Yang et al., Han et al., RILS 논문 모두 두 노드(or state) 간의 SFC 를 곧바로 생성하고 이는 두 corridor 간의 overlap을 야기하기도 한다.

![[Ren2023icra_fig4.png]]

그래서 생성된 경로가 infeasible 해진다고 한다.

>[!note]
>- 왜 infeasible 해지고 기존 방식의 어떤 부분 때문인지 자세히 생각해보기

본 논문에서는 이 문제를 해결하기 위해 **a simple seed generation method** 을 도입하였다.

![[Ren2023icra_fig5.png]]

여기서는 구구절절 설명이 들어가서 그림을 보는 것이 이롭다.

그림 (a) 에서는 전역 경로가 장애물에 막혔지만 옆에 좁은 틈을 지날 수 있게 만들어진 HRM 을 표현한 것이다.

경로 $\mathscr{Q}$ 는 $A^*$ 탐색으로 만들어졌고 경로점 $q_i \in \mathscr{Q}$ 에서 가장 가깝게 장애물로 인식된 지점(*nearest occupied grid*) $o^a_i$ 를 찾는다.

그리고 $q_i - o^a_i$ 방향으로 탐색하여 첫 번째로 장애물로 인식된 지점(*the first occupied grid*) $o^b_i$ 를 찾아 이를 $\mathscr{O}$ 에 넣는다. 이 때 사용된 $q_i$ 는 $\mathscr{N}$ 에 넣는다.

그러면 이제 좁은 틈의 가장자리(or 장애물 가장자리)로 생각할 수 있는 $\mathscr{O}$ 와 틈을 지나는 경로점 $\mathscr{N}$ 이 생긴다. 이 $\mathscr{N}$ 의 평균 방향을 $d_s$ 라고 하고 $\mathscr{O}$ 의 중심을 중심점 $p_s$ 로 정의한다.

$\mathscr{N}$ 의 길이를 방향 벡터 $d_s$ 에 투영해서 얻어진 길이 $l_s$ 로 line seed $L_s$ 를 얻는다. (Fig. 5. (c) 참고)

이제 $L_s$ 의 양 끝점으로 polyhedron $\cal{P}_1, \cal{P}_3$ 를 만들고 $L_s$ 를 line seed 로 하여 좁은 틈을 지나는 $\cal{P}_3$ 를 만든다.

이러한 방식으로 생성된 SFC 에서 $\mathrm{SE}(3)$ 경로 최적화가 safety & dynamic constraints 를 만족하도록 생성된다면 SE(3) segment 로 만들어지고,

그렇지 않으면 $\mathbb{R}^3$ sub-problem 으로 분류되어 LRM 에서 low-resolution search(LRS) 가 일어난다.

### D. R^3 Trajectory Generation

이제 충돌 지점마다 생길 수도 있는 $K$ 개의 SE(3) 경로 조각들이 있다고 하자. 이 경로들은 start states $s_1^{wb}, s_2^{wb},\dots,s_K^{wb}$ 와 goal states $g_1^{wb}, g_2^{wb}, \dots, g_K^{wb}$ 들로 이루어져 있다.

이제 global start state $s_g$ 와 첫 SE(3) 궤적, 혹은 연속적인 SE(3) 궤적이나 마지막 SE(3) 궤적과 global goal state $g_g$ 들 사이에 LRS 로 생긴 $\mathbb{R}^3$ 경로 혹은 충돌이 없던 전역 경로 $T_g$ 가 있을 것이다.

이전에는 $A^*$ 방식으로 $\mathrm{SE}(3)$ 사이에 있는 state 들이 있을 것이므로 이들을 각각 start or goal state 로 하여 경로 최적화를 해서 $\mathbb{R}^3$ 경로를 만들어 낸다.

![[Ren2023icra_fig6.png]]

## Experiments

### A. Benchmark Comparison

선행 연구들과 다양하게 비교하였다. 다만 본 연구 자체는 공개하지 않아서 추후에 비교가 어려워졌다.

요약하자면 [[2023-12-02-FastRacing|Han et al.]] 보다 궤적이 짧거나 빠르다고 보긴 어렵지만, 비슷한 수준의 성능을 내는 대신 훨씬 빠른 속도로, 주어진 지도 없이 수행한다.

![[Ren2023icra_table1.png]]

무엇보다도 Han et al. 보다 성공률이 월등히 높으며 search-based 방식의 Liu et al. 이 가장 높지만 이쪽은 시간이 너무 오래걸려서 실사용에는 어렵다.

### B. Real-world Tests

실제 환경에서의 테스트가 굉장히 최신 연구들을 총집합하여 수행하였다.

$R^3$-live 나 Fast-LIO2, Bubble Planner 등을 사용하였다.

>[!quote] Real-world tests
>
>20. Jiarong Lin and Fu Zhang. R3 live: A robust, real-time, rgbcolored, lidar-inertial-visual tightly-coupled state estimation and mapping package. In 2022 International Conference on Robotics and Automation (ICRA), pages 10672–10678, 2022.
>21. Jiarong Lin and Fu Zhang. R3 live++: A robust, real-time, radiance reconstruction package with a tightly-coupled lidarinertial-visual state estimator. arXiv preprint arXiv:2209.03666, 2022.
>22. Wei Xu, Yixi Cai, Dongjiao He, Jiarong Lin, and Fu Zhang. Fast-lio2: Fast direct lidar-inertial odometry. IEEE Transactions on Robotics, 2022.
>23. Fangcheng Zhu, Yunfan Ren, and Fu Zhang. Robust real-time lidar-inertial initialization. arXiv preprint arXiv:2202.11006, (Accepted by 2022 IROS), 2022.
>24. Guozheng Lu, Wei Xu, and Fu Zhang. Model predictive control for trajectory tracking on differentiable manifolds. arXiv preprint arXiv:2106.15233, 2021.

>3. Yunfan Ren, Fangcheng Zhu, Wenyi Liu, Zhepei Wang, Yi Lin, Fei Gao, and Fu Zhang. Bubble planner: Planning high-speed smooth quadrotor trajectories using receding corridors. arXiv preprint arXiv:2202.12177, (Accepted by 2022 IROS), 2022. 

*We use an on-manifold model predictive controller [24] to perform high-accuracy trajectory tracking. To realize online planning and cope with newly sensed obstacles during the flight, we adopt a distance-triggered receding horizon planning scheme from our previous work [3]*

사실 *"To realize online planning and cope with newly sensed obstacles during the flight"* 부분이 조금 이해가지 않지만 manifold 에서의 MPC 와 Bubble planner 논문을 볼 필요가 있어 보인다.

![[Ren2023icra_fig13.png]]

결과에 대한 사진과 영상도 잘 나와 있다. 인상 깊었던 것은 Fig. 13. 에서 시각화를 어떤 식으로 하였는지 궁금하다. Pointcloud가 반투명 Box 형태로 나오는 것도 보기에 굉장히 좋아보이지만, 모델링한 드론의 움직임이 프레임 별로 모델 / 타원체로 잘 표현되어 있다.

## Conclusion and Future work

본 논문에서 꼽은 한계점으로는 좁은 틈의 한 쪽만 인식하기 때문에 좁은 틈이 길게 나 있는 경우에는 지나갈 수 없지만, 이를 파악할 수 있는 방식의 경로 계획은 아니다.

이를 위해서는 lateral motion 으로 nonzero roll angle 을 유지할 수 있어야 한다고 한다. 이를 perception-aware planning 을 통해 좁은 틈을 제대로 인식하여야 한다고 한다.

>[!note]
>- 조금 더 생각해보면, 라이다의 센서 범위의 영향이 있을 것 같다. 그리고 좁은 틈이나 whole-body motion planning 이 필요한 상황이 좁은 틈을 넘어 심하거나, 연속적으로 있는 경우는 어떤 식으로 해결할 수 있을지 궁금하다. (대다수는 unfeasible 하여 경로가 생기지 않을 것 같지만)
>- 또한, 본 논문에서는 동적 장애물까지 해결할 수 있는지에 대한 논의가 없다. 처음 비판하였던 수 백 $ms$ 의 시간이 비슷하게 나왔고, 동적 장애물이 생겼을 때의 순간적인 연산속도가 회피하기에 충분한지도 궁금하다.

정리 끄읏.
