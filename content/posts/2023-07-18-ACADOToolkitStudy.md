---
date: 2023-07-18
layout: post
title: "ACADO Toolkit Study"
---
### ACADO Toolkit Study
#acado 

#### Code Generation Tool

앞서서 ACADO 사용법은 메뉴얼과 튜토리얼을 통해 익혔고, ACADO에서 제공하는 CGT를 사용하는 방법에 대해 알아보자.

[rpg_mpc](https://github.com/uzh-rpg/rpg_mpc)에서 CGT로 만들어진 코드를 사용하고 있어 어떤 식으로 작성하고, Class로 끌어와서 쓸 수 있을지 보아야 한다.

**A Tutorial Example**

![[20230718151400.png]]

튜토리얼에서는 그림과 같이 정의된 크레인 문제를 풀고자 한다. control input은 트롤리의 가속도 $a$이고, $v$와 $\omega$는 각각 속도와 각속도 이다.

$$
F(\cdot) = \Bigg\{\begin{align} \dot p(t) &= v(t)
\\ \dot v(t) &= a(t)
\\ \dot \phi(t) &= \omega(t)
\\ \dot \omega(t) &= -g \sin(\phi(t)) - a(t) \cos(\phi(t)) - b \omega(t), \end{align}
$$

그러면 위와 같은 Non-linear differential equation으로 표현할 수 있다. 이 때 damping constant $b= 0.2 \, \text{J} \, \text{s}$이고, 각 변수들은 $m = 1 \, \text{kg}, \ L = 1 \, \text{m},\ g = 9.81 \, {\text{m}}/{\text{s}^2}$로 주어진다.

그리고 Optimal Control Problem은 아래와 같다

$$
\begin{align*} \displaystyle \min_{ \begin{array}{c} x_0, \ldots, x_{N} \\ u_0, \ldots, u_{N-1} \end{array}} & \displaystyle\sum_{k=0}^{N-1} ||h(x_k,u_k) - \tilde{y}_k ||^2_{W} +\||h_{N}(x_N) - \tilde{y}_N||^2_{W_{N}} \\ \text{s.t.} \quad\quad & x_0 = \hat x_0 \\ & x_{k+1} = F(x_k, u_k),\ \text{for } k = 0, \ldots, N-1 \\ & -0.5\ {\text{m}}/{\text{s}} \leq v_k \leq 1.5\ {\text{m}}/{\text{s}},\ \text{for } k = 0, \ldots, N \\ & -1.0\ {\text{m}}/{\text{s}^2} \leq a_k \leq 1.0\ {\text{m}}/{\text{s}^2},\ \text{for } k = 0, \ldots, N-1 \end{align*}
$$

따라서 reference function은 아래와 같이 정의된다.

$$
\begin{align*} h &= [p\ v\ \phi\ \omega\ a]^T,\\ h_N &= [p\ v\ \phi\ \omega]^T, \end{align*}
$$

Code Generation Tool을 통해 코드를 만들어 주기 위해서는 `OCPexport` 변수를 선언하고 원하는 솔버 설정을 해주면 된다.

빌드를 하기 전에 ACADO 폴더에 있는 `./external_packages`에서 본인이 사용하는 `QP_SOLVER`를 경로안에 같이 넣어주어야 한다.

빌드 후 생긴 test.cpp를 다시 해당 폴더에서 `make`를 통해 빌드하고, executable를 실행하였다.

```bash
$ ./test

ACADO Toolkit -- A Toolkit for Automatic Control and Dynamic Optimization.
Copyright (C) 2008-2015 by Boris Houska, Hans Joachim Ferreau,
Milan Vukov and Rien Quirynen, KU Leuven.
Developed within the Optimization in Engineering Center (OPTEC) under
supervision of Moritz Diehl. All rights reserved.

ACADO Toolkit is distributed under the terms of the GNU Lesser
General Public License 3 in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

	Real-Time Iteration 0:  KKT Tolerance = 1.625e+00

	Real-Time Iteration 1:  KKT Tolerance = 5.895e-07

	Real-Time Iteration 2:  KKT Tolerance = 1.003e-13

	Real-Time Iteration 3:  KKT Tolerance = 5.009e-20

	Real-Time Iteration 4:  KKT Tolerance = 2.630e-26

	Real-Time Iteration 5:  KKT Tolerance = 3.360e-31

	Real-Time Iteration 6:  KKT Tolerance = 2.007e-31

	Real-Time Iteration 7:  KKT Tolerance = 1.480e-31

	Real-Time Iteration 8:  KKT Tolerance = 3.944e-33

	Real-Time Iteration 9:  KKT Tolerance = 2.326e-33



End of the RTI loop. 



Differential variables:
[
	1.000000e-01	1.000000e-01	1.000000e-01	1.000000e-01
	1.233878e-01	5.591860e-02	9.088841e-02	-1.536102e-01
	1.294342e-01	-1.560897e-02	2.570073e-02	-2.476023e-01
	1.157576e-01	-7.556884e-02	-3.838386e-02	-1.487911e-01
	9.011084e-02	-9.540932e-02	-5.748262e-02	2.911045e-02
	6.425943e-02	-7.693337e-02	-2.962655e-02	1.415938e-01
	4.614686e-02	-4.381710e-02	1.318072e-02	1.226962e-01
	3.658784e-02	-1.990970e-02	3.531533e-02	1.497966e-02
	3.154798e-02	-1.368941e-02	2.402310e-02	-8.363073e-02
	2.668423e-02	-1.873556e-02	-5.864383e-03	-1.005828e-01
	2.021838e-02	-2.437011e-02	-2.790116e-02	-3.603973e-02
]


Control variables:
[
	-1.469380e-01
	-2.384252e-01
	-1.998662e-01
	-6.613493e-02
	6.158650e-02
	1.103876e-01
	7.969134e-02
	2.073429e-02
	-1.682051e-02
	-1.878184e-02
]


```


**Implementation the code generation tool on a quarter car model**

앞서서 살펴보았던 quarter car 모델 예제에 code generation tool을 적용해보고자 한다.

앞서 작성한 `ocp_mpc_simulation.cpp`파일을 수정해보자.

시뮬레이션을 돌리기 위해 작성한 `Process`, `Controller`와 그에 필요했던 `OutputFcn`, `DynamicSystem`, `RealTimeAlgorithm` 등등을 모두 주석처리해준다. 그리고 plotting 파트도 주석처리해준 후 Export 옵션만 넣어주면 된다.

>[!error] Only standard LSQ objective supported for code generation
>이렇게 내용만 바꿔서 빌드 후 실행하면 이런 에러가 나타난다.
>원인은 LSQ의 EndTerm을 넣어주지 않았기 때문이다.
>
>이 [링크](https://sourceforge.net/p/acado/discussion/general/thread/9c0072db/)에서 저자가 설명한 내용도 참고
> 그래서 아래와 같이 마지막 $T$에 대한 LSQ도 정의해주었다.
> ```cpp
> 	// Least Square Function
> 	Function h
>	h << xB;
>	h << xW;
>	h << vB;
>	h << vW;
>	h << F;
>	
>	Function hN;
>	hN << xB << xW << vB << xW;
> 	
>	// LSQ coefficient matrix
>	DMatrix Q(5, 5);
>	Q(0, 0) = 10.0;
>	Q(1, 1) = 10.0;
>	Q(2, 2) = 1.0;
>	Q(3, 3) = 1.0;
>	Q(4, 4) = 1.0e-8;
> 	
>	DMatrix P;
>	P = eye<double>(hN.getDim());
>	P *= 5;
>```
>coefficient matrix P의 스케일은 튜토리얼대로 5로 하였다

>[!question] How to determine coefficient matrix?
>- [ ] LSQ에서 coefficient matrix를 어떤 식으로 설정하는지
>- [ ] 전체 time horizon $T$를 linear하거나 exponential하게도 고려하는 것으로 알고 있는데, 이러한 경우에 scaling을 어떻게 하는지
>
>#todo

CGT 예제처럼 필요한 qp solver 폴더를 넣어주고 돌리면 아래와 같이 결과가 나온다.

```bash
$ ./test

ACADO Toolkit -- A Toolkit for Automatic Control and Dynamic Optimization.
Copyright (C) 2008-2015 by Boris Houska, Hans Joachim Ferreau,
Milan Vukov and Rien Quirynen, KU Leuven.
Developed within the Optimization in Engineering Center (OPTEC) under
supervision of Moritz Diehl. All rights reserved.

ACADO Toolkit is distributed under the terms of the GNU Lesser
General Public License 3 in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

	Real-Time Iteration 0:  KKT Tolerance = 5.613e+00

	Real-Time Iteration 1:  KKT Tolerance = 3.546e-16

	Real-Time Iteration 2:  KKT Tolerance = 1.068e-32

	Real-Time Iteration 3:  KKT Tolerance = 4.271e-32

	Real-Time Iteration 4:  KKT Tolerance = 4.271e-32

	Real-Time Iteration 5:  KKT Tolerance = 6.674e-32

	Real-Time Iteration 6:  KKT Tolerance = 2.162e-31

	Real-Time Iteration 7:  KKT Tolerance = 1.308e-31

	Real-Time Iteration 8:  KKT Tolerance = 1.068e-32

	Real-Time Iteration 9:  KKT Tolerance = 5.232e-31



End of the RTI loop. 



Differential variables:
[
	1.000000e-01	1.000000e-01	1.000000e-01	1.000000e-01
	9.906872e-02	-9.550925e-02	-2.489402e-01	6.966448e-01
	7.845589e-02	5.951503e-02	-4.789123e-01	-1.098396e+00
	4.918713e-02	-5.475780e-02	-7.406515e-01	1.449904e+00
	9.757824e-03	3.565036e-02	-7.697920e-01	-1.386624e+00
	-2.796202e-02	-2.609813e-02	-7.530222e-01	1.504686e+00
	-6.152661e-02	2.481492e-02	-5.483117e-01	-1.298717e+00
	-8.461457e-02	-3.817229e-03	-3.774037e-01	1.247964e+00
	-9.527936e-02	1.456852e-02	-3.671509e-02	-1.047424e+00
	-9.095846e-02	7.040125e-03	2.058478e-01	8.602483e-01
	-7.403694e-02	8.125103e-03	4.615085e-01	-7.652887e-01
	-4.696817e-02	6.064396e-03	6.091964e-01	5.277362e-01
	-1.391311e-02	5.758481e-04	6.929277e-01	-5.275234e-01
	1.992432e-02	1.093240e-03	6.461837e-01	3.018989e-01
	4.950961e-02	-5.879842e-03	5.184837e-01	-3.241777e-01
	7.007656e-02	-3.343126e-03	2.967101e-01	1.792946e-01
	7.867884e-02	-8.473659e-03	3.990362e-02	-1.542275e-01
	7.509835e-02	-7.325488e-03	-1.804107e-01	1.354349e-01
	6.125961e-02	-7.137871e-03	-3.668478e-01	-5.818779e-02
	3.924063e-02	-3.894873e-03	-5.015153e-01	1.160833e-01
	1.249268e-02	-2.662037e-03	-5.553479e-01	-5.653247e-04
]


Control variables:
[
	0.000000e+00	-2.000000e+02
	0.000000e+00	2.000000e+02
	0.000000e+00	-2.000000e+02
	0.000000e+00	2.000000e+02
	0.000000e+00	2.000000e+02
	0.000000e+00	2.000000e+02
	0.000000e+00	-1.989419e+02
	0.000000e+00	2.000000e+02
	0.000000e+00	-2.000000e+02
	0.000000e+00	-2.000000e+02
	0.000000e+00	-2.000000e+02
	0.000000e+00	-2.000000e+02
	0.000000e+00	-2.000000e+02
	0.000000e+00	-2.000000e+02
	0.000000e+00	-2.000000e+02
	0.000000e+00	-2.000000e+02
	0.000000e+00	2.000000e+02
	0.000000e+00	2.000000e+02
	0.000000e+00	2.000000e+02
	0.000000e+00	2.000000e+02
]
```

우리가 `Control`로 $R, F$를 넣어주었고 이전에 나온 plotting을 고려해보면 $R$은 0으로 나오는 것이 타당한데, $F$는 boundary 안에서만 움직이는 모습을 보였다.

OCP의 시간을 $0.0 \le t \le 1.0$로만 하여서 라고 생각하여 $0.0 \le t \le 2.5$로 하였는데 아예 0으로 나오고 KKT Tolerance도 0이 되어버림.

또 한가지 의문점은 reference를 선언하지 않고도 어떤 식으로 ocp가 풀리는지도 궁금하였다.
[Github Issues](https://github.com/acado/acado/issues/295)에서도 이러한 의문을 제기한 사람이 있음.