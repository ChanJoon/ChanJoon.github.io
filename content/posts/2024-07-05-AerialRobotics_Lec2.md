---
layout: post
title: "[Aerial Robotics] Geometry and Mechanics"
date: 2024-07-05
tags:
  - self-study
math: "true"
---
# Geometry and Mechanics

이전 Post: [[2024-07-02-AerialRobotics_Lec1 | Introduction]]

## 2.1 Quadrotor Kinematics

### Transformations

이번 강의에서는 **"Rigid Body Transformations** 의 주제를 다루고, 이를 위한 notation들의 정의를 한다.

주로 사용하는 transformation matrix인 $A, R$은 다음과 같이 어떤 frame에서 frame으로 바뀌는지 표현한다.

$$
\begin{align}
{}^AA_B,\ {}^AR_B,\ {}^A\xi_B \\
\text{or}\quad A_{ab},\ R_{ab}
\end{align}
$$

이러한 표현방식 모두 frame $B\ \text{or}\ b$ 에서 $A\ \text{or}\ a$ 로 transform 한다는 의미이다.

이제 Rigid Body Displacement 를 어떤 물체 $O\subset\mathbb{R}^3$ 라고 할 때 Map $g: O\rightarrow\mathbb{R}^3$ 라고 하자.

그렇다면 $O$ 안의 모든 점들은 $g$ 로 transformation 을 표현할 수 있다. ex) $g(p), g(q)$

vector 의 이동은 $g*$ 로 표현한다. 그러면 $\overrightarrow{g(p)-g(q)} = g*(\overrightarrow{p-q})$ 와 같이 vector 간의 transformation 도 표현된다.

벡터의 크기와 cross-product $\times$ 는 그대로 유지된다.
$$
\begin{align}
\|g(p)-g(q)\| = \|p-q\| \\
g*(v)\times g*(w) = g*(v\times w)
\end{align}
$$

마찬가지로 orthogonal vector 끼리도 유지되어야 unit vectors(or xyz axes) 가 보존된다. $g*(v)\cdot g*(w) = g*(v\cdot w)$

![[AR_Lec2_rigidbody.png]]

위와 같은 Rigid body 의 unit vector transformation을 아래와 같이 linear combination으로 표현할 수 있다.

$$
\begin{align}
b_1 = R_{11}a_1 + R_{12}a_2 + R_{13}a_3 \\
b_2 = R_{21}a_1 + R_{22}a_2 + R_{23}a_3 \\
b_3 = R_{31}a_1 + R_{32}a_2 + R_{33}a_3
\end{align}
$$

각 계수들의 notation은 맨 처음 정의한 notation을 참고해서 생각해보자. (matrix의 column, row로 볼 수도 있지만)

그러면 아래와 같이 Rotation matrix $R$ 을 정의할 수 있다.

$$
R = 
\begin{bmatrix}
R_{11} & R_{12} & R_{13} \\
R_{21} & R_{22} & R_{23} \\
R_{31} & R_{32} & R_{33}
\end{bmatrix}
$$

>[!note]
>- Rotation about the x-axis through $\theta$
>$Rot(x, \theta) = \begin{bmatrix}1&0&0\\0&\cos\theta&-\sin\theta\\0&\sin\theta&\cos\theta\end{bmatrix}$
>- Rotation about the y-axis through $\theta$
>$Rot(y, \theta) = \begin{bmatrix}\cos\theta&0&\sin\theta\\0&1&0\\-\sin\theta&0&\cos\theta\end{bmatrix}$
>- Rotation about the z-axis through $\theta$
>$Rot(z, \theta) = \begin{bmatrix}\cos\theta&-\sin\theta&0\\\sin\theta&\cos\theta&0\\0&0&1\end{bmatrix}$

### Rotations

이러한 Rotation matrix $R\in\mathbb{R}^{3\times3}$ 은 orthogonality 와 determinant가 1인 special orthogonality를 가진다.

이는 Special Orthogonal group인 $SO(3)$에 속한다.

$$
SO(3) = \{R\in\mathbb{R}^{3\times3}|R^TR=RR^T=I,\ det(R) = 1\}
$$

이를 표현하는 방법으로는 아래와 같다.
1. Rotation matrices
2. Euler angles
3. Axis angle parameterization
4. Exponential coordinates
5. Quaternions

이 중, 어떤 방식이 coordinates for $SO(3)$ 가 될 수 있는지 알아보자.

### Euler Angles

Euler angles은 어떤 $a$ 에서 $b$ 로의 회전을 3가지의 회전의 조합으로 나타내는 것이다.

$$
\begin{align}
{}^AR_D &= {}^AR_B\times^BR_C\times^CR_D \\
{}^AR_D  &= Rot(x, \psi) \times Rot(y, \phi), Rot(z, \theta)
\end{align}
$$

어떤 회전이든 이러한 연속적인 3가지의 회전을 linearly independent 한 axes 의 조합으로 볼 수 있다.

하지만 $3\times3$ rotation matrix $\leftrightarrow$ 3 Euler angles 는 성립하지 않고 **almost one-to-one** 이다.

그러한 이유를 살펴보자.

Euler angles는 어떤 순서로 axes 를 조합하느냐에 따라 다르게 표현할 수 있다. 앞선 수식에서는 X-Y-Z Euler angles 라고 할 수 있다.(Roll-Pitch-Yaw 순)

Gimbal Lock 상황을 위해 Z-Y-Z Euler angles 를 예시로 들어보자.
![[AR_Lec2_ZYZ.png]]

Body-fixed frame 에서 z축에 대해 $\phi$ 만큼, y축에 대해 $\theta$ 만큼, z축에 대해 $\Psi$ 만큼 회전시킨다.

Body-fixed frame 에서 회전하므로 회전이 이루어질 때마다 기존의 축이 바뀌기 때문에 새로운 y 혹은 z축에 대해 회전하고 있다.

이들의 회전은 모두 linearly independent 한 것을 알 수 있다. 하지만 $\theta = 0$ 인 경우에는 더이상 linearly independent하지 않기 때문에, unique 하게 표현할 수 없다.

이를 Rotation matrix로 살펴보자.

$$
R = Rot(z, \psi)\times Rot(y, \theta)\times Rot(z, \Psi)
$$

$$
R =
\begin{bmatrix}
\cos\phi\cos\theta\cos\psi-\sin\phi\sin\psi & -\cos\phi\cos\theta\sin\psi-\sin\phi\cos\psi & \cos\phi\sin\theta \\
\sin\phi\cos\theta\cos\psi+\cos\phi\sin\psi & -\sin\phi\cos\theta\sin\psi+\cos\phi\cos\psi & \sin\phi\sin\theta \\
-\sin\theta\cos\psi & \sin\theta\sin\psi & cos\theta
\end{bmatrix}
$$

여기에서 만약 $R_{33}$ 를 알고 있다면, $\theta$ 를 계산할 수 있고 $R_{31}, R_{32}$ 를 통해 $\psi$ 를, $R_{13}, R_{23}$ 을 통해 $\phi$ 를 알 수 있다.

하지만 만약 $R_{33} = \pm 1$ 이라면 $\sin\theta=0$ 이고, 나머지 항들이 $\phi$ 와 $\psi$ 의 조합으로 이루어져 있으므로 해가 무한해진다.

이를 요약하면 아래 슬라이드와 같다.
![[AR_Lec2_Gimbal.png]]

### Axis/Angle Representations for Rotations

Euler는 아래와 같이 회전을 정의하였다.

>[!quote] Euler's Therorem
>**Rotations**
>Any displacement of a rigid body such that a point on the rigid body, say $O$, remains fixed, is equivalent to a rotation about a fixed axis through the point $O$.

^a0fa02

앞서 Rotation matrix 나 Euler angle 에서는 회전축에 대한 이야기가 없었으나, Euler 는 위와 같이 회전을 정의하였다.

어떤 회전을 아래 사진과 같이 원점을 같게 만들어 표현해보자.

![[AR_Lec2_axis_fixed.png]]

그러면 회전한 $\vec{OP}$ 를 회전하기 전과 같은 원점을 갖는 $\vec{OP'}$ (<font style="color:blue">blue arrow</font>) 로 표현할 수 있고, 이는 같은 unit vector 를 공유한다.

따라서, 이들의 계수는 새로운 linear combination 이고 Rotation matrix $R$ 을 정의할 수 있다.

그렇다면 [[2024-07-05-AerialRobotics_Lec2#^a0fa02|Euler's Theorem]] 을 증명해보자.

$q = Rp$ 에서 자기자신에게 대응되는 $p$ 가 있을까? 그렇다면 $p = Rp$ 가 되고, 그렇다는 것은 eigenvalue 가 1인 $R$을 의미한다.

바꿔 말하면, $Rp = \lambda p$ 의 eigenvalue 문제의 해가 1이라는 것을 의미한다.

이제는 주어진 임의의 회전축 $u$ 와 회전각 $\phi$ 가 있다고 해보자. 이를 이용해 Rotation matrix $R$ 을 유도해보자. (회전축 $u$ 가 좌표축 $x,y,z$ 중 하나라면 앞선 Euler angles 와 동일하다.)

![[AR_Lec2_axis_angle_parameterization.png]]

그래서 위 사진과 같이 벡터 $\vec{p}$ 를 회전축과 평행한 요소와 수직인 요소로 분해한다. 그러면 평행한 요소 $(p \cdot u)u$ 는 회전과 상관없이 변하지 않는다.

각도 $\phi$ 만큼 회전하면 수직한 요소인 $p-(p\cdot u)u$는 아래와 같이 표현된다.
$$
(p-(p\cdot u)u)\cos\phi + u\times(p-(p\cdot u)u)\sin\phi
$$

풀어 설명하면 $u$ 에 수직한 요소를 $v$ 라고 하였을 때, 이를 외적한 $w = u\times v$ 를 만들 수 있고 이들의 $u \cos \phi + w \sin \phi$ 이다.

그렇다면 회전하고 난 $\vec{p}_{rot}$ 은 $(p\cdot u)u + u\cos\phi+w\sin\phi$ 가 된다.

자기 자신의 외적은 0임을 이용해 $u\times (u\cdot p)u = 0$ 으로 위 수식을 정리하면,
$$
\begin{align}
\vec{p}_{rot} &= (p\cdot u)u + u\cos\phi+w\sin\phi\\
&=(p\cdot u)u + (p-(p\cdot u)u)\cos\phi + u\times(p-(p\cdot u)u)\sin\phi \\
&= (p \cdot u)u + (p-(p\cdot u)u)\cos\phi + (u\times p)\sin\phi \\
&=p\cos\phi + (p\cdot u)u(1-\cos\phi)+(u\times p)\sin\phi \\ 
&=p\cos\phi + uu^T(1-\cos\phi)p+(u\times p)\sin\phi
\end{align}
$$

와 같다.

이제 외적 $u\times$ 부분을 행렬 $\hat{u}$ 로 표현한다. 이는 skew-symmetric matrix 로, $\hat{u}^T = -\hat{u}$ 를 만족하고 이들의 diagonal element 들은 모두 0이다. ($u_{ij} = -u_{ji}$)

이제 $p$ 를 제거하면 임의의 벡터에 대해 회전축 $u$ 와 회전각 $\phi$ 를 갖는 수식을 얻을 수 있고, 이것이 **Rodrigues' formula** 이다.

$$
Rot(u, \phi) = I\cos\phi + uu^T(1-\cos\phi)+\hat{u}\sin\phi
$$

그렇다면 이러한 방식이 Rotation matrix 에 *onto* or *one-to-one* 대응일까?

앞서 [[2024-07-05-AerialRobotics_Lec2#^a0fa02 | Euler's Theorem]]에서 *onto* 임은 살펴보았다.

그러나, $Rot(u,\phi)$ 와 $Rot(-u, 2\pi - \phi)$ 의 예시를 통해 *one-to-one* 은 아닌 것을 알 수 있다.

Rotation matrix $R$ 로 부터 회전축 $u$ 와 회전각 $\phi$ 를 얻어보자.

$\tau = \text{tr}(R)$ 이라고 하면 $\cos\phi = \frac{\tau - 1}{2}$ 가 된다. 그리고 $\hat{u} = \frac{1}{2\sin\phi}(R-R^T)$ 로 $u$ 를 얻을 수 있다.

이 때 $\tau = 3$ 인 경우에는 $\phi = 0$ 이  되어 unique 한 회전축 $u$ 를 얻을 수 없다. 또한, $\tau = -1$인 경우$\phi = \pi$ 가 되어 $u\ \text{or} -u$ 를 얻게 됨을 알 수 있다.

따라서, 정의역을 $[0, \pi]$ 로 하더라도 일대일 대응이 될 수 없다.

### Angular Velocity

회전 속도는 회전의 변화율로, 회전의 시간에 대한 미분이다.

Rotation matrix $R(t)$ 에 대해 orthogonality 를 만족해야 하므로, $R^T(t)R(t) = I,\ R(t)R^T(t) = I$ 로 부터 아래와 같은 식을 유도할 수 있다.

$$
\begin{align}
\dot{R}^TR + R^T\dot{R} = 0 \\
R\dot{R}^T + \dot{R}R^T = 0
\end{align}
$$

이를 통해 $R^T\dot{R}, \dot{R}R^T$ 은 skew-symmetric matrix 임을 알 수 있다. ($(AB)^T = B^TA^T$)

![[AR_Lec2_axis_fixed.png]]

이전에 보았던 예시에서 이제는 $q(t) = R(t)p$ 가 되어 $p$ 는 여전히 시간에 변화와 관계없이 고정임을 알 수 있다.

이에 대한 미분은 $\dot{q} = \dot{R}p$ 이다. 이 때 $p$ 는 body-fixed frame 에서의 위치이지만, $\dot{q}$ 는 inertial frame 에서의 속도이다.

양변에 $R^T$ 를 곱해보자.
그러면 $R^T\dot{q} = R^T\dot{R}p$ 가 되고, 좌항은 속도를 다시 body-fixed frame 으로 transformation 시켰고 우항은 body-fixed frame 에서의 각속도가 된다.
이 때 $R^T\dot{R}$ 이 skew-symmetrix matrix 이므로 $\hat{w}^b$ 로 표현한다.

![[AR_Lec2_angular_velocity.png]]

그리고 $q = Rp$ 의 양변에 $\dot{R}R^T$ 를 곱하면 $\dot{q} = \dot{R}R^Tq$ 를 얻을 수 있다.

이렇게 되면 좌항은 inertial frame 에서의 속도이고, 우항은 inertial frame 에서의 각속도가 된다. 마찬가지로 $\dot{R}R^T$ 를 $\hat{w}^s$ 로 표시한다.



## 2.2 [[2024-01-15-GeometricControlSE3|Quadrotor Dynamics]]

### Dynamics of a Quadrotor

이제 쿼드로터의 Dynamics 를 알아보자.

이전 강의에서 다룬대로 $F_i = k_F w_i^2,\ M+i = k_M \omega_i^2$ 로 힘과 모멘트가 정의된다.

그리고 Z-X-Y Euler angles convention 을 사용한다.

![[Ar_Lec2_ZXY.png]]

이에 따라 아래와 같은 Dynamics 표현이 가능하다.

![[AR_Lec2_FM.png]]

### Newton-Euler Equations

기체의 COM 을 $r_c = \frac{1}{m}\sum_{i=1,N} m_i p_i$ 로 구할 수 있고, $F = \sum^N_{i=1}F_i = m\frac{dv}{dt}$ 로 표현한다.

Momentum $M$ 의 미분인 Angular momentum $H,\ s.t\ \frac{dM}{dt} = M$ 은 $H = I \cdot \omega$ 로 표현할 수 있다. $I$ 는 inertia tensor 로, 기준점에 관계없이 절대적이다.

### Principal Axes and Principal Moments of Inertia

**Principle axis of inertia**
$u$ is a unit vector along a principal axis if $I\cdot u$ is parallel to $u$. There are 3 independent principal axes.

**Principal moment of inertia**
The moment of inertia with respect to a principal axis, $u \cdot I \cdot u$ is called a principal moment of inertia.

![[AR_Lec2_euler_equation.png]]

앞선 주축과 주모멘트 정의에 의해 inertial frame $A$ 와 body-fixed frame $B$, origin $C$ 에 대해서 위와 같이 표현해볼 수 있다.

frame $B$ 에서의 주축을 좌표축으로 잡아 각속도 ${}^A\omega^B$ 를 ${}^Aw^B = \omega_1 b_1 + \omega_2 b_2 + \omega_3 b_3$ 로 표현할 수 있다.

$\frac{{}^AdH_c}{dt}=M_C$ 의 좌항을 분해하여 $\frac{{}^BdH_c}{dt} + {}^A\omega^B\times H_c$ 로 표현하여 움직이는 물체를 inertial frame $A$ 의 모멘텀을 표현할 수 있다.

앞서 주축으로 unit vector 를 구성하였으므로, $H = I\cdot \omega$ 이므로 $\frac{{}^BdH_c}{dt} = I_{11}\dot{\omega}_1b_1 + I_{22}\dot{\omega}_2b_2 + I_{33}\dot{\omega}_3b_3$ 로 정리된다.

이를 모두 정리한 것이 그림의 <font style="color:violet">보라색 박스</font> 이다.

### Quadrotor Equations of Motion

이를 정리하여 아래의 수식으로부터 Equations of Motion 만들어보자.

$$
\begin{align}
F &= \sum_{i=1}^4 F_i - mga_3 \\
M &= \sum_{i=1}^4 r_i \times F_i + \sum_{i=1}^4 M_i
\end{align}
$$ 

이를 앞선 설명들로 모두 표현하면

$$
\begin{align}
m\ddot{p}_A &= \begin{bmatrix}0 \\ 0 \\ -mg\end{bmatrix} + {}^AR_B\begin{bmatrix}0 \\ 0 \\ \sum^4_{i=1} F_{i}\end{bmatrix}_B \\
I \begin{bmatrix}\dot{w}_x \\ \dot{w}_y \\ \dot{w}_{z}\end{bmatrix}_B &= \begin{bmatrix}L(F_2 - F_4) \\ L(F_3 - F_1) \\ M_1 - M_2 + M_3 - M_4\end{bmatrix} - \begin{bmatrix}w_x \\ w_y \\ w_z\end{bmatrix} \times I \begin{bmatrix}w_x \\ w_y \\ w_z\end{bmatrix}_B
\end{align}
$$

가 된다. ($p_A$ = position in inertial frame, $L$ = length of the airframe)

여기에서 $L, I, m$ 은 모두 기체의 길이, 질량, 관성이므로 쉽게 구할 수 있다.

그리고 앞선 Z-X-Y Euler angles 를 통해 Roll, Pitch, Yaw 로 부터 각속도를 구할 수 있다.

$$
\begin{bmatrix}\dot{w}_x \\ \dot{w}_y \\ \dot{w}_{z}\end{bmatrix}
=
\begin{bmatrix}c\theta & 0 & -c\phi s\theta \\ 0 & 1 & s\phi \\s\theta & 0 & c\phi  c\theta\end{bmatrix}
\begin{bmatrix}\dot{\phi}\\ \dot{\theta} \\ \dot{\psi}\end{bmatrix}
$$

따라서 3차원에 State Space 를 구성할 수 있다.

**State Space of Quadrotors**
![[AR_Lec2_state_space.png]]
