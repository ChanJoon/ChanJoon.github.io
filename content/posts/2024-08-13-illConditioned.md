---
layout: post
title: Ill-conditioned matrix
date: 2024-08-13
categories: Mathematics
tags:
  - self-study
  - mathematics
math: "true"
---

# Introduction

>[!quote]
> [1] D. W. Mellinger, “Trajectory Generation and Control for Quadrotors.”

Thesis 를 정리하며 읽는 중 optimization-based 경로 생성에서 종종 등장하는 **ill-conditioned matrix** 가 무엇인지 알아보고자 한다.

> A poor choice of basis functions can cause the matrix H in (7.3) to be ill-conditioned for large order polynomials.

위 인용한 논문에서 QP 수식에서의 hessian matrix $H$ 가 쉽게 ill-conditioned 일 수 있다고 한다.

$$
\begin{align}
\min& c^THc+f^Tc \\
s.t.& \quad Ac\leq b \\
& A_{eq}c=b_{eq}
\end{align}
$$

# ill-posed, well-posed, ill-conditioned, well-conditioned matrix(or problem)

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
