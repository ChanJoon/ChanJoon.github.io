---
date: 2023-08-18
layout: post
title: Implementing MPCC with ACADO
tags:
  - self-study
  - acado
  - control-planning
---
### Implementing MPCC with ACADO

>[!todo]
>*Update 이전 todo로 작성한 목록들을 업데이트*
>- [ ] Gauss-Newton Hessian approximation
>- [-] Explicit Runge-Kutta (ERK) / Implicit Runge-Kutta (IRK)
>- [ ] Variational Differential Equations (VDE)
>- [-] LSQ에서 coefficient matrix를 어떤 식으로 설정하는지
>	-> coefficient matrix는 Q-norm을 QP로 바꿔주면서 각 state vector에 맞도록 생긴다.
>- [ ] 전체 time horizon $T$를 linear하거나 exponential하게 고려하는 것으로 알고 있는데, 이러한 경우에 scaling을 어떻게 하는지

>[!abstract] Goal
>1. Implement **Model Predictive Contouring Control(MPCC)** on quadrotor with *ACADO+qpOASES* by referencing [CMPCC](https://arxiv.org/abs/2007.03271v3)
>2. Experiment MPCC on ROS by using the source code of [PAMPC](https://arxiv.org/abs/1804.04811v2)


##### Differences between each papers(MPC or MPCC on quadrotor)

|        | CMPCC | PAMPC | [MPCC](https://arxiv.org/abs/2108.13205v4) | Ours  |
| ------ | ----- | ----- | ------------------------------------------ | ----- |
| OCP    | ==MPCC==  | MPC   | ==MPCC==                                       | MPCC  |
| Solver | OSQP  | ==ACADO== | ==ACADO==                                      | ACADO |
| code   | ==open(GPLv3)== | ==open(GPLv3)== | None                                       |       |
| ODE    | No    | ==Yes==   | ==Yes==                                        | Yes      |

As we can see above, the easiest way of implementing MPCC is migration solver of CMPCC to ACADO. But CMPCC does not consider quadrotor dynamic model on their control.
the MPCC paper considered quadrotor dynamic model well, and they used ACADO for experiments. but they didn't open their source code.

So based on CMPCC, we need to reformulate optimal control problem and the cost function of MPCC.

##### Brief Summarization of CMPCC

**the Objective function**

![[20230818112032.png]]
![[20230818112055.png]]
![[20230818112118.png]]

By introducing *re-timing function* $t(\tau)$, minimize tracking error between global trajectory $p(t)$ and local trajectory $s(\tau)$.

**the System**

![[20230818112320.png]]
![[20230818112331.png]]

They used 3rd-order integral model instead of general quadrotor dynamic model.

The state and inputs of the system is given by
$$
\begin{gather}\textbf{x}=[x,v_x,a_x,y,v_y,a_y,z,v_z,a_z,t,v_t,a_t]^T\\\textbf{u}=[\dot{J}_x,\dot{J}_y,\dot{J}_z,\dot{J}_t]^T\end{gather}
$$

With linear state-transfer equation, they update their 3rd-oder inegral model to the next time step.

$$
x^{(k+1)}=\begin{bmatrix}A_{d1}&&&\\&A_{d2}&&\\&&A_{d3}&&\\&&&A_{d4}\end{bmatrix}
\begin{bmatrix}x\\v_x\\a_x\\y\\v_y\\a_y\\z\\v_z\\a_z\\t\\v_t\\a_t\end{bmatrix}^{(k)}
+\begin{bmatrix}&&&&\\&&&&\\\Delta{t}&&&\\&&&&\\&&&&\\&\Delta{t}&&\\&&&&\\&&&&\\&&&&\\&&\Delta{t}&\\&&&&\\&&&&\\&&&\Delta{t}\end{bmatrix}
\begin{bmatrix}\dot{J}_x\\\dot{J}_y\\\dot{J}_z\\\dot{J}_t\end{bmatrix}^{(k)}
=\begin{bmatrix}x+\Delta{t}\cdot v_x+\frac{1}{2}\Delta{t^2}\cdot a_x\\v_x+\Delta{t}\cdot a_x\\a_x+\Delta{t}\cdot \dot{J_x}\\y+\Delta{t}\cdot v_y+\frac{1}{2}\Delta{t^2}\cdot a_y\\v_y+\Delta{t}\cdot a_y\\a_y+\Delta{t}\cdot \dot{J_y}\\z+\Delta{t}\cdot v_z+\frac{1}{2}\Delta{t^2}\cdot a_z\\v_z+\Delta{t}\cdot a_z\\a_z+\Delta{t}\cdot \dot{J_z}\\t+\Delta{t}\cdot v_t+\frac{1}{2}\Delta{t^2}\cdot a_t\\v_t+\Delta{t}\cdot a_t\\a_t+\Delta{t}\cdot \dot{J_t}\end{bmatrix}^{(k)}
=\begin{bmatrix}x^{(k+1)}\\v_x^{(k+1)}\\a_x^{(k+1)}\\y^{(k+1)}\\v_y^{(k+1)}\\a_y^{(k+1)}\\z^{(k+1)}\\v_z^{(k+1)}\\a_z^{(k+1)}\\t^{(k+1)}\\v_t^{(k+1)}\\a_t^{(k+1)}\end{bmatrix}
$$

**OCP Formulation**

![[20230818115209.png]]

Most of MPCC suffers from getting the reference state of global trajectory $\mu_p(t^{(k)})$. They solved this problem by introducing the equation (9) which linearizes $\mu_p(t^{(k)})$ using the result of the last horizon $t^{(k+1)}$.

Detailed expansions from the equation (8) to (10) as follows.

$$
\begin{align}J&=\sum_{k=1}^N\{(\mu^{(k)}-\mu_p(t^{(k)}))^2-\rho\cdot v_t^{(k)}\}\\
&=\sum_{k=1}^N\{(\mu^{(k)}-\mu_p(\theta^{(k)})-v_p(\theta^{(k)})\cdot (t^{(k)}-\theta^{(k)}))^2-\rho\cdot v_t^{(k)}\}\\
&=\sum_{k=1}^N\{f^{(k)}\}\end{align}
$$

and convert $f^{(k)}$ to $x^TQx$ form which is widely used in Quadratic Programming(QP).

$$
\begin{align}f^{(k)}&=\{\mu^{(k)}-\mu_p(\theta^{(k)})-v_p(\theta^{(k)})\cdot (t^{(k)}-\theta^{(k)})\}^2-\rho\cdot v_t^{(k)}\\
&=\mu^2-2\mu\mu_p(\theta)+\mu_p^2(\theta)-2\mu v_p(\theta)(t-\theta)+2\mu_p(\theta)v_p(\theta)(t-\theta)+v_p^2(\theta)(t-\theta)^2-\rho\cdot v_p\\

&=\begin{bmatrix}\mu\\1\end{bmatrix}^T
\begin{bmatrix}1 & -v_p(\theta)(t-\theta)\\-v_p(t-\theta)& v_p^2(\theta)(t-\theta)^2\end{bmatrix}
+\begin{bmatrix}-2v_p(\theta)\\\mu_p^2(\theta)+2\mu_p(\theta)v_p(\theta)(t-\theta)-\rho\cdot v_t\end{bmatrix}^T
\begin{bmatrix}\mu\\1\end{bmatrix}\\

&=\begin{bmatrix}\mu\\t\end{bmatrix}^T
\begin{bmatrix}1 & -v_p(\theta)\\-v_p(\theta)&v_p^2(\theta)\end{bmatrix}
\begin{bmatrix}\mu\\t\end{bmatrix}
+\begin{bmatrix}-2\mu_p(\theta)+2v_p(\theta)\cdot \theta\\v_p^2(\theta)(-2t\cdot \theta+\theta^2)+\mu_p^2(\theta)+2\mu_p(\theta)v_p(\theta)(t-\theta)-2\mu_pv_p\cdot \theta -\rho\cdot v_t\end{bmatrix}^T
\begin{bmatrix}\mu\\1\end{bmatrix}\\

&=\begin{bmatrix}\mu\\t\end{bmatrix}^T
\begin{bmatrix}1 & -v_p(\theta)\\-v_p(\theta)&v_p^2(\theta)\end{bmatrix}
\begin{bmatrix}\mu\\t\end{bmatrix}
+\begin{bmatrix}2(-\mu_p(\theta)+v_p(\theta)\cdot \theta)\\-2v_p(\theta)(-\mu_p(\theta)+v_p(\theta)\cdot \theta)\\-\rho\end{bmatrix}^T
\begin{bmatrix}\mu\\t\\v_t\end{bmatrix}\end{align}
$$

this paper skips $(\mu_p(\theta)-v_p(\theta)\cdot \theta)^2$(may be consider as 0) and select $x, y, z$ in $\mu$.

Now we can rearrange $J=\sum_{k=1}^Nf^{(k)}=\sum_{k=1}^N{\bar{\textbf{x}}^TQ_k\bar{\textbf{x}}+q_k^T\bar{\textbf{x}}}$ by selecting $\bar{\textbf{x}}=\begin{bmatrix}x&y&z&t&v_t\end{bmatrix}$


---
```cpp
Eigen::Matrix<float, kCostSize-kStateSize, kSamples>::Zero();
kCostSize-kStateSize = -13; // kCostSize = 5, kStateSize = 13;
```