---
date: 2023-09-12
layout: post
title: Implement MPCC with ACADO Toolkit
tags:
  - self-study
  - acado
---
### Implement MPCC with ACADO Toolkit

이전에 정리해둔 [2023-08-18-ImplementingMPCCwithACADO](2023-08-18-ImplementingMPCCwithACADO.md)에서 Cost function이 acado를 사용하기에 맞지 않게 정리되었음.

CMPCC에서 아래와 같이 Quadratic form으로 정리하였다.

$$
\begin{align}J&=\sum_{k=1}^N\{(\mu^{(k)}-\mu_p(t^{(k)}))^2-\rho\cdot v_t^{(k)}\} \\

&=\sum_{k=1}^N\{(\mu^{(k)}-\mu_p(\theta^{(k)})-v_p(\theta^{(k)})\cdot (t^{(k)}-\theta^{(k)}))^2-\rho\cdot v_t^{(k)}\}\\

&=\sum_{k=1}^N\begin{bmatrix}\mu\\t\end{bmatrix}^T
\begin{bmatrix}1 & -v_p(\theta)\\-v_p(\theta)&v_p^2(\theta)\end{bmatrix}
\begin{bmatrix}\mu\\t\end{bmatrix}
+\begin{bmatrix}2(-\mu_p(\theta)+v_p(\theta)\cdot \theta)\\-2v_p(\theta)(-\mu_p(\theta)+v_p(\theta)\cdot \theta)\\-\rho\end{bmatrix}^T
\begin{bmatrix}\mu\\t\\v_t\end{bmatrix} \\

&=\sum_{k=1}^Nx^TQx+q^Tx\end{align}
$$

이러한 이유는 OSQP 솔버를 사용하기 때문이고, MPCC에서 reference trajectory에 해당하는 부분이 $Q, q$ 에 들어가 있었다.

ACADO 에서는 Code Generation Tool에서 아래 이미지에 표현된 것처럼 weighted $l_2$-norm으로 Cost function이 구성된다.

![[Screenshot from 2023-09-12 02-26-39.png]]

실제 export 된 c 코드에서 reference state와 input을 $y$에 넣어주어야 하기 때문에, CMPCC에서 정리해둔 것 처럼 Quadratic form으로 코드를 작성할 수 없었다.

그러면 위에 정리한 Cost function 중 2번째 줄까지 가져올 수 있다. 이렇게 되면 문제는 $h(x_k, u_k)$에 해당하는 부분이 $\mu(=p_x, p_y, p_z)$가 되어 기존에 state로 두고자 하였던 $[p_x, p_y, p_z, t, v_t]$으로 사용할 수 없게 된다.

$$
\begin{align}J&=\sum_{k=1}^N\{(\mu^{(k)}-\mu_p(t^{(k)}))^2-\rho\cdot v_t^{(k)}\} \\

&=\sum_{k=1}^N\{(\mu^{(k)}-(\mu_p(\theta^{(k)})+v_p(\theta^{(k)})\cdot (t^{(k)}+\theta^{(k)}))^2-\rho\cdot v_t^{(k)}\}\end{align}
$$

굳이 표현해주자면 아래와 같이 바꿔줄 수 있을 것이다.

$$
\begin{align}J&=\sum_{k=1}^N\begin{bmatrix}\mu\\t\end{bmatrix}^T
\begin{bmatrix}1 & -v_p(\theta)\\-v_p(\theta)&v_p^2(\theta)\end{bmatrix}
\begin{bmatrix}\mu\\t\end{bmatrix}
+\begin{bmatrix}2(-\mu_p(\theta)+v_p(\theta)\cdot \theta)\\-2v_p(\theta)(-\mu_p(\theta)+v_p(\theta)\cdot \theta)\\-\rho\end{bmatrix}^T
\begin{bmatrix}\mu\\t\\v_t\end{bmatrix} \\ 

&=\sum_{k=1}^N\|W^{1/2}\begin{bmatrix}\mu\\t\\v_t\end{bmatrix}\|^2+q^T
\begin{bmatrix}\mu\\t\\v_t\end{bmatrix} \\

&=\sum_{k=1}^N\| \begin{bmatrix}\mu\\t\\v_t\end{bmatrix} \|^2_W+q^T\begin{bmatrix}\mu\\t\\v_t\end{bmatrix} \\

s.t & \ \ W=\begin{bmatrix}1 & -v_p(\theta)\\-v_p(\theta)&v_p^2(\theta)\end{bmatrix},\ q=\begin{bmatrix}2(-\mu_p(\theta)+v_p(\theta)\cdot \theta)\\-2v_p(\theta)(-\mu_p(\theta)+v_p(\theta)\cdot \theta)\\-\rho\end{bmatrix}^T\end{align}
$$

그러므로 acadoVariable의 reference $y$에 0을 넣어주어야 한다.