---
layout: post
title: Ill-conditioned matrix
date: 2024-08-13
tags:
  - self-study
  - mathematics
math: "true"
---

## Introduction

>[!quote]
>A poor choice of basis functions can cause the matrix H in (7.3) to be **ill-conditioned** for large order polynomials. In order to diagonalize H and ensure that it is **well-conditioned** matrix we use Legendre polynomials as basis functions for the krth derivatives of our positions.
>
> `D. W. Mellinger, “Trajectory Generation and Control for Quadrotors.”`

[Thesis](https://rpg.ifi.uzh.ch/docs/PhD18_Faessler.pdf) 를 정리하며 읽는 중 optimization-based 경로 생성에서 종종 등장하는 **ill-conditioned matrix** 가 무엇인지 알아보고자 한다.

위 인용한 논문에서 QP 수식에서의 hessian matrix $H$ 가 쉽게 ill-conditioned 일 수 있다고 한다.

$$
\begin{align}
\min& c^THc+f^Tc \\
s.t.& \quad Ac\leq b \\
& A_{eq}c=b_{eq}
\end{align}
$$

## ill-posed, well-posed, ill-conditioned, well-conditioned matrix(or problem)

[Ref. Dsaint31's blog](https://dsaint31.tistory.com/400)

**well-posed** 란 해가 존재하며 유일하게 결정되는 것을 의미하고, 데이터(matrix entity or $\mathbf{b}$)가 연속적으로 변할 때, 해도 연속적으로 변하는 것을 의미한다.

$\mathbf{A}\mathbf{x}=\mathbf{b}$ 에서 $\mathbf{A}$ 가 invertible 하다면 해를 쉽게 구할 수 있으므로 **well-posed** 라 한다.

하지만 $\mathbf{A}$ 혹은 $\mathbf{b}$ 의 약간의 변화만으로 해가 큰 변화를 보일 수 있다. 이러한 경우에는 사용한 수치해석적 방법이나 noise 등의 영향으로 해를 쉽게 구할 수 없게 될 수 있다.

이러한 민감도를 정량적인 scalar 로 나타낸 것이 condition number 라고 한다.

따라서 system matrix $\mathbf{A}$ 의 condition number 가 작은 경우 **well-conditioned** 라고 한다. 반대로 condition number 가 지나치게 큰 경우, **ill-conditioned** 라고 한다.

우리는 condition number 가 "유한"한 경우에는 **well-posed** 라고 한다.

**ill-posed** 는 반대로 condition number 가 "무한"한 경우이다. 간단한 예로는 구해야하는 변수보다 주어진 식이 적은 경우로 무수히 많은 해를 갖는 경우가 있다.

**ill-conditioned** 의 경우는 condition number 가 매우 큰 경우에 해당하여 well-posed 이면서 ill-conditioned 일 수 있다.

nearly singular 라고 부르기도 하며, 안정성이 낮아 noise 에도 큰 오차가 발생한다.

### An example of ill-conditioned matrices

[Reference PDF](https://emtiyaz.github.io/pcml15/illconditioned.pdf)

아래와 같은 상황을 생각해보자.

$$
\begin{cases}
x+y&=2 \\
x+1.001y &= 2
\end{cases}
$$
and
$$
\begin{cases}
x+y&=2 \\
x+1.001y &= 2.001
\end{cases}
$$

그렇다면 왼쪽의 해는 $x=2, y=0$ 인 반면, 오른쪽의 해는 $x=1,y=1$ 이다.
이러한 coefficient matrix 를 *ill-conditioned* 하다고 한다. 

앞서 언급한 것처럼, coefficient 의 약간의 변화로 해가 크게 변하기 때문이다. 위의 예시에서 condition number 는 4004 라고 한다.

반올림 오차(rounding error) 로 인해 ill-conditioned system 은 다루기 어렵다.
아래의 또다른 예시를 살펴보자.

$$
\begin{cases}
.001x+y&=1 \\
x+y &= 2
\end{cases}
$$

위 예시의 해는 $x=1000/999\approx 1, y=998/999 \approx 1$ 이고 coefficient 가 약간 변하더라도 해는 크게 변하지 않음을 알 수 있다. 이 경우 condition number 는 4이다.

하지만 일반적인 row reduction algorithm 으로 풀어내면 ill-conditioned system 이 된다.
위 식을 풀기 위해 첫 번째 열에 1000을 곱해 두 번째 열에서 빼낸다고 해보자. 그 이후, -999를 나눈 후 소숫점 세 자리까지 반올림 한다.
$$
\begin{cases}
.001x+y&=1 \\
-999y &= -998
\end{cases}
$$

$$
\begin{cases}
.001x+y&=1 \\
y &= 1.00
\end{cases}
$$

 이로써 $x=0, y=1$ 로 위의 해와 비교했을 때 상당히 부정확함을 알 수 있다.(condition number $\approx 2002$)

**partial pivoting** 을 활용하면 이러한 문제를 해결할 수 있다. 이전 시스템의 열을 서로 바꿔주는 것이다.

$$
\begin{cases}
x+y &= 2 \\
.001x+y&=1
\end{cases}
$$

$$
\begin{cases}
x+y &= 2 \\
.999y&=.998
\end{cases}
$$

$$
\begin{cases}
x+y &= 2 \\
y&=1
\end{cases}
$$

그럼 위와 같은 과정으로 문제가 해결되므로 rounding 이후에도 해가 $x=1,y=1$ 로 꽤 정확하게 나옴을 알 수 있다. (condition number $\approx 4$)

>[!tip] Youtube Lesson
> ![](https://youtu.be/bVyMJUw608o?si=yqLk8oHfhc7-Guas)