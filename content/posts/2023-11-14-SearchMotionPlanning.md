---
date: 2023-11-14
layout: post
title: Search-Based Motion Planning
categories: Robotics
tags:
  - paper
  - ros
math: "true"
---

# Search-Based Motion Planning for Aggressive Flight in SE(3)

```
Liu, Sikang, et al. "Search-based motion planning for aggressive flight in se (3)." _IEEE Robotics and Automation Letters_ 3.3 (2018): 2439-2446.
```

[Arxiv](https://arxiv.org/abs/1710.02748)

논문 복습 겸 정리

Aerial Vehicle 중 Multi-rotor의 Whole-body motion planning을 다룬 논문 중 하나이다. 주로 위치, 속도, 가속도 제어를 하는 것과 달리 [jerk, snap](https://en.wikipedia.org/wiki/Fourth,_fifth,_and_sixth_derivatives_of_position)의 제어 혹은 yaw에 더해 roll, pitch까지 제어하는 것은 고연산을 요하기에 기체의 모델을 Sphere, Prism(각기둥)으로 가정한다.

이러한 방식은 Collision-free한 영역을 확인하는 과정에서 constraint 조건을 손쉽게 만들어준다.

### 주요 Contributions
- 기체를 ellipsoid로 가정하여 모델링함
- lower dimension에서 경로를 탐색한 후 이를 heuristic으로 사용하여 higher dimension에서의 경로 탐색에 활용
- Optimal control problem을 풀어 낸 state들이 이루는 motion primitives를 graph search algorithm을 통해 dynamically feasible resolution-complete한 경로를 만든다
- 이러한 과정에서의 생성된 궤적의 타당성, 연산 시간, 가중치 변수 등의 실험 결과도 보여줌

**요약하자면, Model dynamics, Collision-free 등의 constraint를 고려한 OCP를 풀어 내고 이를 통해 구성된 motion primitives를 graph search algorithm과 hierarchical한 방식으로 적절한 computational time과 control effort를 가지는 경로를 생성한다.**

논문에서는 Jerk 제어까지 실험한 내용들을 다루었으며 Snap 제어에 대해서는 같은 방식으로 이루어지며 공개한 코드에서 확인할 수 있다고 언급만 되어있다.

## Related Works

SE(3)

Sampling 방식을 사용한 Planning with 6 DOF는 여러 연구에서 진행되었지만, MAV는 rotation과 translation이 독립적으로 이루어질 수 없어 적용할 수 없다.

이에 Motion primitives를 이용한 방식을 통해 dynamically feasible하고 collision-free한 경로 생성한다.

***Lattice search*를 이용한 선행 연구들** [1-2] 중 **Optimal control problem을 통해 만든 motion primitives를 활용한 본인의 연구** [3]를 확장한 것이 본 논문이다.

```
[1] M. Pivtoraiko, R. A. Knepper, and A. Kelly, “Differentially constrained mobile robot motion planning in state lattices,” Journal of Field Robotics, vol. 26, no. 3, pp. 308–333, 2009.

[2] B. MacAllister, J. Butzke, A. Kushleyev, H. Pandey, and M. Likhachev, “Path planning for non-circular micro aerial vehicles in constrained environments,” in Robotics and Automation (ICRA), 2013 IEEE International Conference on. IEEE, 2013, pp. 3933–3940.

[3] Liu, Sikang, et al. "Search-based motion planning for quadrotors using linear quadratic minimum time control." 2017 IEEE/RSJ international conference on intelligent robots and systems (IROS). IEEE, 2017.
```

또한, [3]에서 참고한 Optimal control 논문은 T-RO 논문인 [4] 이다. (*추후 훑어볼 것!!*)

```
[4] M. Mueller, M. Hehn, and R. D’Andrea, “A computationally efficient motion primitive for quadrocopter trajectory generation,” IEEE Trans. on Robotics (T-RO), vol. 31, no. 6, pp. 1294–1310, 2015.
```

대부분 시간에 대한 state $x(t)$ 로 이루어진 Polynomials로 경로를 생성하므로 state의 dimension이 커질수록 높은 연산량을 요구한다.

이에 대해 Randomized sampling 방식과 Graph search 방식을 고려할 수 있다. 전자는 효율적이지만  optima로의 느린 수렴 속도로 인해 빠른 navigation과 re-planning에는 부적합하다.

후자는 비효율적이나 heuristic한 방식을 통해 이를 개선할 수 있다. weighted heuristic 방식 대신 adaptive dimension을 활용한 방식을 적용하여 본 논문에서는 hierarchical planning procedure를 도입하였다.

## Motion Planning with Attitude Constraints

앞선 논문 [3]을 통해 만들어진 motion primitives를 이용해 trajectory planning framework에 대한 설명이 이루어진다.

이 때, quadrotor의 yaw는 decoupled되어 있고 system dynamics에 영향을 주지 않으므로 상수로 가정한다. (*=heading을 진행 방향과 일치시키지 않는다는 의미 = simpler*)

### A. System Dynamics

Quadrotor의 dynamics는 $\mathbb{R}^3$ 에서 differentially flat 함이 증명되었다. [5] 따라서 position $\mathbf{x}=[x,y,z]^T$ 를 시간에 대한 미분인 속도, 가속도, jerk로 표현한 경로 생성과 제어에 관한 선행 연구들 [6-7]을 통해 Model dynamics를 전개하였다.

```
[5] D. Mellinger and V. Kumar, “Minimum snap trajectory generation and control for quadrotors,” in Proceedings of the 2011 IEEE International Conference on Robotics and Automation (ICRA), 2011.

[6] T. Lee, M. Leoky, and N. H. McClamroch, “Geometric tracking control of a quadrotor UAV on SE(3),” in 49th IEEE Conference on Decision and Control (CDC). IEEE, 2010, pp. 5420–5425.

[7] M. Hehn and R. D’Andrea, “Quadrocopter trajectory generation and control,” IFAC Proceedings Volumes, vol. 44, no. 1, 2011.
```

*추후 훑어볼 것...*

구체적인 수식 전개는 이미지로 대체, Quadrotor dynamics에 대한 내용은 notation의 차이는 있지만 Rotor drag까지 고려한 [M. Fasessler, et al](https://arxiv.org/abs/1712.02402) 외에는 대체로 동일하다.

![[quadrotor_dynamics.png]]

>[!abstract] Todo
>수식 전개와 Notice 부분 이해하기

### B. Search-Based Planning Using Motion Primitives

Differential flatness한 system에서 경로 $\Phi(t) = [\mathbf{x}^T, \mathbf{v}^T,\mathbf{a}^T,\mathbf{j}^T]$로 구성되고 이는 time $t$에 대한 다항식으로 각각 표현할 수 있다.

$$
\mathbf{x}(t) \coloneqq \sum_{k=0}^K \mathbf{d}_k \frac{t^k}{k!} = \mathbf{d}_K \frac{t^K}{K!} + \dots + \mathbf{d}_1t + \mathbf{d}_0 \tag{8}
$$

$\mathbf{d}_k \in \mathbb{R}^3$ 는 계수이고, 위 식을 미분함으로써 속도, 가속도, jerk, snap에 대한 다항식을 얻어낼 수 있다.

특정한 시간 간격에서 한 state에서 다른 state 간의 다항식 경로를 *motin primitive*라고 한다.

따라서 각 state에서는 control $u$에 따른 다음 state가 생겨나며 initial state와 goal state 간에는 여러 sequence의 motion primitives가 존재한다. 이를 graph로 구성하여 search algorithm을 통해 optimal sequence를 찾아내는 것이 본 논문의 주 요지이다.

본 논문은 jerk $j$를 control input으로 사용하여 optimal trajectory $\Phi^*(t)$ 를 생성하므로 state $s(t)$는

$$
s(t) = [p^T,v^T,a^T]^T \tag{9}
$$

이다.

**pre-defined control set $\mathscr{U}_M$ 에서의 constant jerk input $\mathbf{u}_m$ 을 initial state $\mathbf{s}_0$ 에 가해 만들어진 curve는 $t \in [0, \tau]$에서의 motion primitive 이다. 이를 수식화하면 아래와 같다.**

$$
s(t) = F(\mathbf{u}_m,\mathbf{s}_0, t) \coloneqq \begin{bmatrix}u_m \frac{t^3}{6}+a_0 \frac{t^2}{2}+v_0 t+p_0 \\ u_m \frac{t^2}{2}+a_0{t}+v_0 \\ u_m t+a_0\end{bmatrix} \tag{10}
$$

**요약하면 differential flatness한 state에 대해 jerk $j$ 대신 control input $u_m$ 으로 수식화한 것이다.**

이 때 $F(\cdot)$ 은 주어진 $u_m,s_0,t$ 에 대해 minimum jek trajectory를 만드는 함수이다. [3-4]

control input set $\mathscr{U}_M$과 $\tau$ 에서 graph $\mathscr{G}(\mathit{S},\mathscr{E})$ 를 정의한다. $\mathit{S}$ 는 $s_0$ 부터 가능한 모든 state의 집합이다. ( $\therefore \mathit{S} \subset \mathbb{R}^9$) $\mathscr{E}$ 는 각 state들을 연결하는 edge의 집합이며 이 때 edge는 motion primitive와 같다.

앞선 [3]에서 initial state $s_0$부터 goal state $s_g$ 까지 경로 탐색 문제를 total control effort $J$와 time $T$를 통해 아래와 같이 정의했다.

*a desired optimal trajectory $\Phi^*(t)$*

$$
\begin{align} \Phi^*(t)=\arg\min_{\Phi(t)} J+\rho T \\ s.t. s_0 \gets \Phi(0), s_g \gets \Phi(T) \end{align} \tag{11}
$$

이 때 $T=\tau$ 이고 이에 따라 $J=\int^T_0\|j\|^2dt=\|u_m\|^2\tau$ ($\because$ constant jerk input $u_m$ ) 이다.

따라서 state $s_n$에서 $u_m$을 가한 primitive(=curve =trajectory)의 cost function $C(\cdot)$은 아래와 같이 정리된다.

$$
\Phi^*(t)=\arg\min_{\Phi(t)}C(s_n,u_m)
$$
$$
s.t. \ C(s_n,u_m)=C(u_m)=(\|u_m\|^2+\rho)\tau \tag{12}
$$

*Pontryagin' minimum principle*에 의해 식 (10)은 식 (11)의 optimal solution 이다. 따라서 식 (11)을 푸는 것은 아래의 deterministic shortest path problem의 최적해를 찾는 것과 같다. (= 아래 problem의 optima = optimal trajectory)

>[!abstract] Todo
>Pontryagin' minimum principle과 선행 논문 증명 정리

***Problem 1***

주어진
- An initial state $\mathbf{s}_0$
- A goal region $\mathscr{X}^{goal}$
- A free space $\mathscr{X}^{free}$
- Motion primitives $F_n(t)$ based on a finite set of control inputs $\mathscr{U}_M$ with duration $\tau \gt 0$

에 대해 $0$부터 $N-1$까지의 control inputs $\mathbf{u}_{i}$ 를 선택하는 것은 아래와 같이 정리된다.

$$
\begin{align}
\min_{N,\mathbf{u}_{0:N-1}}&(\sum_{n=0}^{N-1}\|u_n\|^2+\rho N)\tau
\\ s.t. \ F_n(t) &\coloneqq F(u_n,s_n,t),u_n \in \mathscr{U}_M
\\ s_{n+1}&= F_n(\tau)=F_{n+1}(0), s_N \in \mathscr{X}^{goal}
\\ F_n(t) & \subset \mathscr{X}^{free}
\end{align} \tag{13}
$$

**요약하면, 주어진 $s_0$부터 $s_N$ 까지 cost function $C(s_n,u_m)$ 을 최소화하며 motion primitives와 collision-free를 만족하는 control input $u_n$ 의 조합을 찾는 것이다.**

본 논문은 이 문제를 $\textbf{A}^*$와 같은 그래프 탐색 알고리즘을  해결한다.

기존의 distance-based heuristic은 속도, 가속도 혹은 방향을 급격하게 바뀔 수도 있는 경로 계획에서는 부적합하여 논문 [3]에서 제시한 방식을 사용한다.

이 방식은 *Linear Quadratic Minimum Time* 문제의 해와 trajectory smoothness를 고려한다.

*LQMT 의 해는 heuristic function $H(s,s_g)$의 explicit formula를 제공한다. (이 때, $s$와 $s_g$는 각각 현재 state와 목표 state 이다.)*

### C. Feasibility Checking