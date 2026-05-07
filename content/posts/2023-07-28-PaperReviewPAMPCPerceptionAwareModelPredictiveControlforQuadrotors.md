---
date: 2023-07-28
layout: post
title: "Paper Review: PAMPC: Perception-Aware Model Predictive Control for Quadrotors"
tags:
  - paper
  - self-study
paper:
  title: "PAMPC: Perception-Aware Model Predictive Control for Quadrotors"
  authors: "Davide Falanga, Philipp Foehn, Peng Lu, Davide Scaramuzza"
  venue: "IROS"
  year: 2018
  arxiv: "1804.04811"
  doi: "10.1109/IROS.2018.8593739"
  bibkey: "falanga2018pampc"
---
### Paper Review: PAMPC: Perception-Aware Model Predictive Control for Quadrotors
#paper 
[arxiv](https://arxiv.org/abs/1804.04811)

**Introduction**

quadrotor에 MPC 제어를 적용한 논문 중 소스코드를 오픈해놓은 PAMPC 논문을 살펴보았다.
이 논문은 기존 Model Predictive Control에 Perception-aware 파트를 추가한 것으로, 쿼드로터에 장착된 카메라의 POI(point of interest)가 최대한 확보되면서도 image plane간의 속도를 최소화하여 강건한 perception을 함께 고려하고자 하였다.

**Problem Formulation**

$\textbf{x}$와 $\textbf{u}$는 각각 state, input vector이고, $\textbf{z}$는 perception system의 state vector이다. $\dot{\textbf{x}}$는 Differential equations로 $\dot{\textbf{x}}=f(\textbf{x}, \textbf{u})$로 표현된다. 그리고 $\textbf{z}$는 robot dynamics와 coupled되어 $\textbf{z}=f_p(\textbf{x}, \textbf{u}, \sigma)$로 표현된다. 이때 $\sigma$는 카메라의 focal length나 FOV를 변수화하여 표현한 것이다.

이에 따라 optimization problem은 아래와 같이 정의된다.

$$
\begin{align}\min\limits_{u}\int^{t_f}_{t_0}\mathcal{L}_a(\textbf{x}, \textbf{u})+\mathcal{L}_p(\textbf{z})dt\\subject \  to \ r(\textbf{x}, \textbf{u}, \textbf{z}) = 0 \\ h(\textbf{x}, \textbf{u}, \textbf{z}) \leq 0 \end{align}
$$

$\mathcal{L}_a$는 motion planning과 control algorithm 통틀어 의미하는 action대한 cost function이고, $\mathcal{L}_p$는 percetion objectives를 의미한다.

**Methodology**

본 논문에서는 vision 알고리즘(e.g. VO, obstacle detection)에서 필요로 하는 POI와 이러한 POI가 이미지에서 명확하게 잘 보이는 것을 *perception objectives*로 정의하였다. 후자의 경우는 투영된 POI의 속도를 최소화하도록 하였다.