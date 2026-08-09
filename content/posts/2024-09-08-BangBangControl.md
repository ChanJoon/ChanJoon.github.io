---
layout: post
title: Bang-bang and Bang-singular control
date: 2024-09-09
tags:
  - self-study
  - control-planning
math: "true"
---
## Introduction

["Quadrotor control for accurate agile flight"](https://rpg.ifi.uzh.ch/docs/PhD18_Faessler.pdf) 논문에서 사용된 Bang-bang control 과 Bang-singular control 의 의미를 알아보자.

>[!quote]
>Based on a two-dimensional first-principles quadrotor model, this method finds trajectories that are **bang-bang** in the thrust command, and **bang-singular** in the body rate control.
>
>`M. Fässler, “Quadrotor control for accurate agile flight,” University of Zurich, 2018. doi: 10.5167/UZH-152425.`

## Bang-bang control

제어 이론에서 2개의 state 를 오가는 feedback controller 를 **bang-bang controller** 라고 한다고 한다.

조금 더 풀어보면, lower bound 와 upper bound 에 제어 입력이 제한되어 있고 그 중간 단계가 존재할 수 없을 경우 최적의 제어입력은 한 쪽에서 다른 한 쪽으로만 오가게 된다.

[Wikipedia](https://en.wikipedia.org/wiki/Bang%E2%80%93bang_control) 에 제시된 예시 중 하나는 물을 최단 시간에 끓이는 경우가 있다.  이 경우에는 최고 온도로 가열을 하다가, 물이 끓게 되면 가열을 멈추게 된다.

굉장히 제한적이고 단순한 상황에서만 일어나는 방식이지만, Hamiltonian 이 선형적인 경우에도 발생한다고 한다. 왜냐하면 이러한 경우에 [[2024-09-06-PMP|Pontryagin's minimum prinicple]] 을 적용해보면, 제어입력이 각 upper or lower bound 가 되기 때문이다.

## Singular control

**Singular control** 은 위에서 언급한 Hamiltonian 이 선형적인 경우 발생한다.

이를 조금 더 수학적으로 표현해준 [Wikipedia](https://en.wikipedia.org/wiki/Singular_control) 의 설명을 빌려보자.

Hamiltonian $H(u) = \phi(x,\lambda, t)u+\cdots$ 로 선형적인 경우에는 제어 입력이 upper and lower bound 로 제한된다. (i.e. $a \leq u(t) \leq b$).

$H(u)$ 를 최소화하기 위해 $\text{sgn}\ \phi(x,\lambda,t)$ 에 따라 $u$ 를 최대한 크게 하거나 최대한 작게 해야 한다. 즉, bang-bang control 이 되는 것인데 이를 수학적으로 표현해보면 아래와 같이 정리된다.

$$
u(t) = 
\begin{cases}
b, \quad \phi(x, \lambda, t) < 0 \\
?, \quad \phi(x, \lambda, t) = 0 \\ 
a, \quad \phi(x, \lambda, t) > 0
\end{cases}
$$

여기서 문제는 $\phi$ 가 0인 경우이다. $t_1 \leq t \leq t_2$ 일 때 $\phi=0$ 이면 **singular control** 한 경우라고 한다. 즉, $\max H(u)$ 가 어떠한 정보를 주지 못하므로 제어입력 $u$ 가 결정되지 못한다.


따라서 **bang-singular control** 의 의미는 bang-bang 과 singular 의 비율을 모두 가지고 있는 제어를 말한다.

