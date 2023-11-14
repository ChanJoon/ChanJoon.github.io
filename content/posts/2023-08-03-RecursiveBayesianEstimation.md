---
date: 2023-08-03
layout: post
title: "Recursive Bayesian Estimation"
---
## Recursive Bayesian Estimation
#self-study

[Reference Link](https://www.sabinasz.net/robot-localization-recursive-bayesian-estimation/)

*robot localization*에서 사용하는 방법 중 하나인 **Recursive Bayesian Estimation**에서 알아보자.

로봇에 사용되는 센서들의 observation에는 noise가 많아, 주로 filtering 방법을 사용하여 위치를 추정한다.

이번에 살펴보는 **Bayes filter** 외에도 Histogram filter, Kalman filter, 그리고 Particle filter 가 있다.

#### Motivation
고전적인 방식은 논리적 추론이었는데, 현실에서 적용하기 어려운 전제조건을 바탕으로 이루어졌다.

- **fully observable**; 모든 시점에서 환경에 대한 정보가 있어야 함
- **deterministic**; 주어진 state와 그 때의 decision으로 만들어지는 state는 결정적임. 즉, randomness가 없음.
- **static**; 환경이 static함.

실제 환경에서는 이와 정반대로 **partially observable**, **stochastic** 그리고 **dynamic** 하다.

우리가 사용하는 센서로는 실제 환경의 일부밖에 관찰하지 못하고, 실제 환경을 반영하는 모델을 정확하게 만들 수 없어 non-deterministic하다. 이러한 non-deterministic함을 확률론적 기법으로 표현하기 때문에 이를 **stochastic**하다고 표현한다.

#### State & Belief

시스템의 상태를 $x_t$로 표현하고 상태 공간 state space를 $dom(x_t)$로 표현한다. 주로 상태 값들은 실수이므로, $x_t$의 dimension $n$에 대하여 $dom(x_t) \in \mathbb{R}^n$이다. 주로 state는 unobservable하기 때문에 **filtering** 또는 **state estimation**을 통해 $bel(x_t)$를 얻어낸다.

이를 수학적인 표현으로는, 관측으로 얻어지는 모든 가능한 state의 확률 분포이므로 아래와 같이 표현한다.
$$
\begin{align} bel(x_t):=P(x_t|e_{1:t}) \\ s.t e_t: \text{measurment}\end{align}
$$

그리고 이전 관측으로 이루어진 확률 분포는 *projected* 또는 *predicted* belief로 아래와 같이 표현한다.
$$
\overline{bel}(x_t):=P(x_t|e_{1:t})
$$

위의 수식에서 볼 수 있듯이, 시간이 지남에 따라 고려해야 하는 조건이 크게 늘어나기 때문에, 이전에 얻은 belief와 다음 time step의 belief를 계산하기 위한 function $f$를 구해야 한다.

이때 $bel(x_{t+1})=f(bel(x_t), e_{t+1})$ 으로 표현된다. 이러한 과정을 recursive estimation 이라 하고 이 때, 사용되는 알고리즘이 Bayes Filer라고 할 수 있다.

#### The Markov Assumtion

belief를 재귀적으로 추정하기 위해서 각각 transition model $P(x_{t+1}|x_t)$와 sensor model $P(e_t|x_t)$에 대해 Markov assumption을 전제로 한다.

transition model이 주어진 $x_t$에 대해 모든 $x_{t+j} \ \text{with} \ j\geq1$가 $x_{0:t-1}$에 대해 독립적이다. 따라서, $P(x_{t+1}|x_{0:t})=P(x_{t+1}|x_t)$가 된다. 이전까지의 state가 더이상 필요하지 않다.

또한, sensor model에 대해서는 $P(e_{t+1}|x_{t+1},\ e_{1:t})=P(e_{t+1}|x_{t+1})$ 이다. 이것은 우리가 $x_{t+1}$을 알고 있으면 각 센서로부터의 측정은 필요하지 않게 된다.

#### The Bayes Filter Algorithm

이제 $bel(x_t)$와 $e_{t+1}$을 통해 $bet(x_{t+1})$을 구해보도록 하자. 우선, 위에서 다룬 *projected* belief인 $\overline{bel}(x_t)$을 구한다. 이를 **projection**이라고 한다.

$$
\overline{bel}(x_t)=\int_{x_t}P(x_{t+1}|x_{t})bel(x_t)
$$

그 후에 $\overline{bel}(x_{t+1})$로부터 $bel(x_{t+1})$ 구한다. 이를 **update**라고 한다.

$$
bel(x_t)=\eta P(e_{t+1}|x_{t+1})\overline{bel}(x_{t+1})
$$

이 때 $\eta$는 정규화 상수이다. 이러한 방식으로 값을 구해내기 위해서는 $bel(x_0)$가 필요한데 시작할 때의 state인 $x_0$을 아는 경우에는 *point mass distribution* 방식을 사용하고, 부분적으로 아는 경우에는 다른 방식을 사용한다고 한다.

**Continuous Bayes Filter**
$$
\overline{bel}(x_t)=\int_{x_t}P(x_{t+1}|x_{t})bel(x_t)
$$

$$
bel(x_t)=\eta P(e_{t+1}|x_{t+1})\overline{bel}(x_{t+1})
$$

\
finite state space에서는 위에서의 integral 대신 sum으로 계산할 수 있다.

**Discrete Bayes Filter**
$$
\overline{bel}(x_t)=\sum{x_t}P(x_{t+1}|x_{t})bel(x_t)
$$

$$
bel(x_t)=\eta P(e_{t+1}|x_{t+1})\overline{bel}(x_{t+1})
$$

---
## References

- Peter Norvig, Stuart Russel (2010) _Artificial Intelligence – A Modern Approach_. 3rd edition, Prentice Hall International

- Sebastian Thrun, Wolfram Burgard, Dieter Fox (2005) _Probabilistic Robotics_

- Rudy Negenborn (2003) _Robot Localization and Kalman Filters_

- Morris DeGroot, Mark Schervish (2012) _Probability and Statistics._ 4th edition, Addison-Wesley

- Pierre Bessire, Christian Laugier, Roland Siegwart (2008) _Probabilistic Reasoning and Decision Making in Sensory-Motor Systems_