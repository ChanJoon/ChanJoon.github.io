---
layout: post
title: Policy Gradient (2)
date: 2023-11-21
categories: ReinforcementLearning
tags:
  - RL
math: "true"
---
# 4. Policy Gradient (2)

이전에 다 살펴보지 못한 Policy Gradient를 강의 교안과 “수학으로 풀어보는 강화학습” 교재로 마저 공부하기로 했다.

## The Goal of Policy Gradient Method

$\tau$ 를 policy $\theta_\pi$로 생성되는 궤적, state-action의 연속적인 조합이라 하자.

$$
\tau = \{s_0,a_0,s_1,a_1,...,s_T,a_T\}
$$

이에 최적 파라미터 $\theta^*$ 는 아래와 같다.

![[pg_2 1.png]]

이 때 $\pi_\theta (\tau)$ 는 policy $\pi_\theta$ 로부터 얻은 궤적의 확률밀도함수(pdf) 이다. *the p.d.f of trajectories from the policy*

그러면 목적함수 $J(\theta)$를 아래와 같이 정의할 수 있다.

![[pg_2_1.png]]

## Compute $\pi_\theta(\tau)$

Bayes’ rule를 통해 $\pi_\theta(\tau)$ 를 계산해보자.

**Bayes’ rule** $p(a,b|c)=p(a|b,c)p(b|c)$

![[pg_2_2.png]]

위에 정리된 수식에 Markov property를 적용하면 아래와 같이 식을 정리할 수 있다.

**Markov property**

$$
p(a_1|s_0,a_0,s_1)=\pi_\theta(a_1,s_1) \\ p(s_2|s_0,a_0,s_1,a_1)=p(s_2|s_1,a_1)
$$

즉, 이전 history에 대한 정보가 현재 state에 담겨있다고 보기 때문에 $\pi_\theta(\tau)$는 아래와 같이 정리된다.

$$
\pi_\theta(\tau)=p(s_0)\prod^T_{t=0}\pi_\theta(a_t|s_t)p(s_{t+1}|s_t,a_t)
$$

## Direct Policy Differentitaion

![[pg_2_1.png]]

아까 본 목적함수에서 $\sum^T_{t=0}\gamma^tr(s_t,a_t)$ 를 $r(\tau)$ 로 표현하자. 그리고 목적함수를 $\theta$ 에 대해 미분하면 아래와 같다.

![[pg_2_3.png]]

**Likelihood Ratios**

![[pg_2_4.png]]

$\triangledown f=f\triangledown \log f$ 라는 가정을 사용하여 위의 목적함수 미분을 풀이한다.

이 가정은 (1) $x^{(j)}\sim p_\theta$ 를 샘플링할 수 있고, (2) 각 샘플된 값에 대해 $\log p_\theta(x^{(j)})$ 와 $r(x^{(j)})$ 를 평가할 수 있으면 사용 가능하다.

[The likelihood-ratio gradient — Graduate Descent](https://timvieira.github.io/blog/post/2019/04/20/the-likelihood-ratio-gradient/)

이제 목적함수 미분을 정리하면 아래와 같다.,

![[pg_2_5.png]]

이전에 $\pi_\theta(\tau)$ 에 대해 얻었으므로 양쪽에 로그를 취해 마저 수식을 전개한다.

$$
\pi_\theta(\tau)=p(s_0)\prod^T_{t=0}\pi_\theta(a_t|s_t)p(s_{t+1}|s_t,a_t)
$$

![[pg_2_6.png]]

여기에 gradient를 취해준다 ($\theta$에 대해 미분)

![[pg_2_7.png]]

$\theta$가 없는 term들은 미분했을 때 0이 되므로 지워지고 최종적으로는 아래와 같이 목적함수 미분이 정리된다.

![[pg_2_8.png]]

## Evaluating the Policy Gradient

^1e77ee

샘플링을 통해 목적함수를 근사해보자.

![[pg_2_9.png]]

여기서 $N$ 은 샘플된 궤적의 수이다.

목적함수의 그래디언트에도 적용할 수 있다.

![[pg_2_10.png]]

### Softmax Policy

feature의 선형결합 $\phi(s,a)\top \theta$ 을 이용한 weight action 개념이 사용된다.

action의 확률은 이 weight의 거듭제곱에 비례한다.

![[pg_2_11.png]]

log-likelihood function의 1차 미분인 score function은 아래와 같다.

![[pg_2_12.png]]

이에 대한 **증명**

![[pg_2_13.png]]

## Gaussian Policy

연속적인 action 공간에서는 Gaussian policy를 사용한다.

평균(Mean)은 state feature의 선형 결합이다. $\mu(s) = \phi(s)\top\theta$

분산(Variance)는 $\sigma^2$로 고정하거나 변수화할 수 있다.

Policy는 Gaussian이다. $a\sim\textbf{N}(\mu(s), \sigma^2)$

이에 대한 score function은 아래와 같다.

![[pg_2_14.png]]

>[!quote] 추가 참고자료
>1. [https://towardsdatascience.com/policy-based-reinforcement-learning-the-easy-way-8de9a3356083](https://towardsdatascience.com/policy-based-reinforcement-learning-the-easy-way-8de9a3356083)
>2. [https://math.stackexchange.com/questions/2013050/log-of-softmax-function-derivative](https://math.stackexchange.com/questions/2013050/log-of-softmax-function-derivative)

## Monte-Carlo Policy Gradient (REINFORCE)

stochastic gradient ascent를 통해 파라미터를 업데이트하고, $Q^{\pi_\theta}(s,a)$의 unbiased sample로 return $r(\tau)$를 얻는다.

![[pg_2_15.png]]

위 [[#^1e77ee|Evaluating the Policy Gradient]]에서 샘플을 이용해 기댓값을 근사한 것을 사용한다.

![[pg_2_16.png]]

$\theta$를 업데이트할 때 return을 고려하므로 return이 큰 policy가 더 큰 영향을 끼쳐, policy가 개선된다.

매번 $\pi_\theta$에서 각 에피소드 $\tau^i$를 뽑아서 사용하므로 (*for each episode from policy do*) 사용한 샘플은 더이상 쓰지 않고 새로 샘플을 생성한다.

## Limitation of PG

Policy Gradient의 한계는 분산 값이 높다는 것이다. (*High variance*)

또한, $r(\tau)$가 0인 경우에는 좋은 샘플 혹은 궤적을 얻음에도 불구하고 목적함수의 그래디언트가 사라지게 된다.

## Reducing Variance

1. **Reward to go**

**인과성(Causality)** timestep $k$에 실행된 policy는 이전 timestep들의 보상값에 영향을 끼치지 못한다.

![[pg_2_12.png]]

이를 이용해 reward (그리고 PG variance)를 작게 만들 수 있다.

![[pg_2_17.png]]

$t=0$ 부터 고려하던 $\sum^T_{t=0}\gamma^tr(s_{i,t},a_{i,t})$ 부분을 $t’=t$ 부터 고려하는 방식이다.

1. **a Baseline** ^5c2650

Policy Gradient에서 baseline function $B$를 빼내어 기댓값의 변화 없이 분산을 줄이는 방식이다. (→ PG still unbiased!)

![[pg_2_18.png]]

위 Policy Gradient 의 기댓값이 변화없음에 대한 **증명**

![[pg_2_19.png]]

따라서 궤적 $\tau$가 포함되지 않은 baseline을 선정해야하는데 좋은 baseline으로는 State-value function이 있다. $B(s)=V^{\pi\theta}(s)$

이를 이용해 advantage function $A^{\pi\theta}(s)$ 를 이용해 PG를 다시 정리할 수 있다.

![[pg_2_20.png]]

1. **a Critic**

Critic을 통해 Action-value function을 추정할 수 있다.

$$
Q_w(s,a)\simeq Q^{\pi_\theta}(s,a)
$$

Actor-critic 알고리즘은 두 파라미터 집합으로 구성된다.

**Actor**: critic으로 제안되는 방향으로 $\theta$를 업데이트 한다.

**Critic**: $w$를 이용해 Action-value function을 업데이트한다.

그래서 다음과 같은 근사 PG를 사용한다.

![[pg_2_21.png]]

## Estimating the Action-value Fuction

- Critic은 policy evaluation과 같은 문제를 푸는 것이다 (**??**)
- 현재의 $\theta$에 대해 policy $\pi_\theta$가 얼마나 좋은지 본다
- least-squares policy evaluation 같은 것을 사용할 수 있다.

## Actor-Critic Methods

![[pg_2_22.png]]

Actor-critic 방법은 별도의 메모리 구조를 갖는 TD(Temporal Difference) 방법이다. 이는 Value function에 독립적인 policy를 갖는 것을 의미한다.

Action을 선택하는 **actor**와 추정된 Value function **critic** 으로 구성되고 **actor**에서 만든 action을 **critic
**에서 평가한다.

## Action-Value Actor-Critic

이러한 Action-value critic을 이용한 간단한 알고리즘이 Action-Value Actor-Critic이다.

선형 근사한 value function $Q_w(s,a)=\phi(s,a)\top w$를 사용한다.

**Actor:** Updates $\theta$ by PG

**Critic**: Updates $w$ by linear TD(0)

![[pg_2_23.png]]

## Bias in Actor-Critic Algorithms

- PG를 근사하는 것은 bias를 만든다.
- 이러한 biased PG는 제대로 된 해를 구하지 못할 수 있다.

value function approximation을 잘 한다면 이러한 bias를 피할 수 있다.

## Compatible Function Approximation

^27dede

### Theorem

두 가지 조건이 만족한다면:

1. Value function approximator가 policy와 **compatible** 하다
    
    $$
    \triangledown_wQ_w(s,a)=\triangledown_\theta\log\pi_\theta(s,a)
    $$
    
2. Value functon 의 $w$가 MSE(Mean-squared Error)를 최소화한다.
    
    $$
    \epsilon=\mathbb{E}_{\pi_\theta}[(Q^{\pi_\theta}(s,a)-Q_w(s,a))^2]
    $$
    

Policy Graidient는 정확하다 (exact*)

![[pg_2_24.png]]

### Proof

만약 $w$가 MSE를 최소화할 수 있게 된다면 $.w$$w$$\epsilon$의 그래이언트는 0이 된다.

![[pg_2_25.png]]

위 조건 2번에 있는 $\epsilon$을 대입하여 미분하면 $Q^{\pi_\theta}(s,a)$ 대신 $Q_w(s,a)$가 들어갈 수 있다.

![[pg_2_26.png]]

## Fisher Information Matrix

Fisher Information Matrix는 log likelihood의 Hessian의 음의 기댓값이다. (*the negative expected Hessian of the log likelihood*)

![[pg_2_27.png]]

### Cramer-Rao Lower Bound Theorem

모든 $\theta$에 대해 $\mathbb{E}[\triangledown_\theta\log\pi_\theta(s,a)]=0$이라고 가정한다면 어떤 unbiased estimator $\hat\theta$의 공분산 행렬은 다음을 만족한다.

$$
C_{\hat\theta}\geq F^{-1}_\theta
$$

## Newton’s method in optimization

![[pg_2_28.png]]

Newton’s method는 2차 미분(the curvature information)을 사용한다.

$$
\theta \leftarrow\theta-[\triangledown^2_\theta f]^{-1}\triangledown_\theta f
$$

## Natural Policy Gradient

![[pg_2_29.png]]

NPG는 피셔 정보행렬을 이용해 기존 gradient와 가깝지만 작고 고정된 양만큼의 방향으로 policy를 업데이트한다.

$$
\triangledown_\theta^\textbf{nat}J(\theta)=F^{-1}_\theta\triangledown_\theta J(\theta)
$$

## Natural Actor-Critic

[[#^27dede|Compatible Function Approximation]]을 이용해 NPG를 정리할 수 있다. ([[#^5c2650|a Baseline]] 참고)

![[pg_2_30.png]]

이 때 Advantage fuction $A^{\pi_\theta}(s,a)$ 는 [[#^5c2650|a Baseline]]] 에서 정리한 것 처럼 아래와 같고 이때 **Compatible Function Approximation Theorem**을 만족하면 PG는 *exact*하다.

![[pg_2_31.png]]

![[pg_2_32.png]]

Natural Policy Gradient를 마저 정리하면 $\triangledown_\theta J(\theta)=F_\theta w$ 이다.

### Proof

![[pg_2_33.png]]

그래서 **critic**의 $w$의 방향으로 **actor**의 $\theta$를 업데이트 한다.

## Summary of Policy Gradient Algorithms

![[pg_2_34.png]]

## Asynchronous Advantage Actor-Critic Agents (A3C)

아직 스터디에서 A3C를 할 순서는 아니지만 교안에 있으므로 가볍게 짚어보자

![[pg_2_35.png]]

**Critic** (value) loss: $L_c:=\sum(\text{target}-V(s))^2$

**Actor** (policy) loss: $L_a:=-\sum\log(\pi(s))A(s,a)-\beta\text{H}(\pi)$

여기서 $H$는 엔트로피이다. 하이퍼파라미터 $\beta$가 엔트로피 정규화 term의 강도를 조절한다.

A3C에는 여러 Worker agent들이 있고 각각이 자신만의 network 변수들을 가진다.

이 Worker agent들은 자신의 환경과 병렬적으로 상호작용한다.

그리고 Global network와 비동기적으로 그래디언트를 업데이트한다.