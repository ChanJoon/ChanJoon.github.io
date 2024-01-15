---
date: 2023-07-17
layout: post
title: ACADO Toolkit study
tags:
  - self-study
  - acado
---
## ACADO Toolkit study

### Tutorials

**A Guiding Example: Time Optimal [Control](https://acado.sourceforge.net/doc/html/d9/de2/classControl.html "Implements a control variable.") of a Rocket Flight**

아래는 첫번째 예제에 대한 수식이다.

$$
\begin{align}
\min_{x(\cdot),u(\cdot)} &\int\limits_{0}^{T} \left(|| x(t)||_Q^2 + || u(t)||_R^2\right) \, \mathrm{d}t \, + \, || x(T) ||_P^2
\\ \textrm{s.t.} \ \dot x(t) &= \; f(\,x(t),\,u(t)\,),
\\ x(0) &= x_0,
\\ \underline u(t) &\leq u(t) \leq \overline u(t),
\\ \underline x(t) &\leq x(t) \leq \overline x(t), \quad \textrm{for all} \, t \in [0,T]\;
\end{align}
$$

간단한 로켓 모델에 대해 differential states $s, v, m$ 은 각각 비행거리, 속도, 로켓 질량이다.

코드는 다음 [링크](https://acado.sourceforge.net/doc/html/d9/d65/example_001.html)에서 참고하도록 한다.

>[!error] include/acado_gnuplot/gnuplot_window.hpp: no such file or directory
>- 첫 예제를 빌드 할 때 바로 에러가 발생하였다.
>- `examples/getting_started`에 있는 파일에서 어떻게 plotting 하는지 보고 해당 헤더파일로 변경해줌
>- `include/acado_gnuplot/gnuplot_window.hpp` -> `acado_gnuplot.hpp`

결과는 아래와 같다
```bash
sqp it | qp its |       kkt tol |       obj val |     merit val |      ls param | 
     1 |     11 |  4.015966e+01 |  9.950000e+00 |  5.419249e+01 |  1.000000e+00 | 
     2 |      1 |  1.306070e-01 |  9.931631e+00 |  1.006632e+01 |  1.000000e+00 | 
     3 |      1 |  2.549335e-02 |  9.906147e+00 |  9.906158e+00 |  1.000000e+00 | 
     4 |      1 |  7.484607e-02 |  9.831350e+00 |  9.831410e+00 |  1.000000e+00 | 
     5 |      2 |  3.457549e-01 |  9.487488e+00 |  9.489759e+00 |  1.000000e+00 | 
     6 |     12 |  3.045474e-01 |  9.190947e+00 |  9.200555e+00 |  1.000000e+00 | 
     7 |     19 |  5.194080e-01 |  8.691541e+00 |  8.715543e+00 |  1.000000e+00 | 
     8 |     14 |  4.739167e-01 |  8.248118e+00 |  8.284711e+00 |  1.000000e+00 | 
     9 |     17 |  3.334551e-01 |  7.927619e+00 |  7.943166e+00 |  1.000000e+00 | 
sqp it | qp its |       kkt tol |       obj val |     merit val |      ls param | 
    10 |     18 |  4.999093e-01 |  7.457878e+00 |  7.494079e+00 |  1.000000e+00 | 
    11 |     19 |  1.652661e-02 |  7.441887e+00 |  7.442529e+00 |  1.000000e+00 | 
    12 |     19 |  1.460624e-04 |  7.441741e+00 |  7.441741e+00 |  1.000000e+00 | 
    13 |     19 |  1.190096e-07 |  7.441741e+00 |  7.441741e+00 |  1.000000e+00 | 

Covergence achieved. Demanded KKT tolerance is 1.000000e-06.
```
![[20230717002700.png]]

실제 튜토리얼에 나온 그래프와 동일하게 나옴.

수식은 일반적인 QP 형태라 풀어 정리할 부분은 크게 없어보이고, 코드에서 주요한 부분은 아래 파트로, 각 state에 대한 모델 equation을 <<를 통해 넣어주는 것으로 보인다.

```cpp
f << dot(s) == v ;             // an implementation
f << dot(v) == (u-0.2*v*v)/m ; // of the model equations
f << dot(m) == -0.01*u*u ;     // for the rocket.
```

그리고 `ocp.subjectTo()` 함수로 state 와 control input에 대한 constraints를 넣어준다.

Tutorial의 설명에 integration 방법으로 제시된 룽게 쿠타 방법에 대해 알아보자.
>[!done]
>- [x] a Runge-Kutta method

**Runge-kutta method**

*References*
- [위키백과: 룽게-쿠타 방법](https://ko.wikipedia.org/wiki/%EB%A3%BD%EA%B2%8C-%EC%BF%A0%ED%83%80_%EB%B0%A9%EB%B2%95)
- [공부해서 남주자 티스토리](https://study2give.tistory.com/entry/%EC%88%98%EC%B9%98%ED%95%B4%EC%84%9D-%EB%A3%BD%EA%B2%8C-%EC%BF%A0%ED%83%80%EB%B2%95-Runge-Kutta-method)
- [반디통](https://www.banditong.com/cae-dict/runge_kutta_method)

미분방정식을 크게 구분하는 상미분(ODE)와 편미분(PDE)는 의존하는 변수의 갯수로 구분된다.
즉, 상미분은 물체의 움직임을 하나의 변수로 나타낼 수 있고 편미분은 둘 이상의 변수로 표현되는 것이다.

이러한 상미분의 근사해를 구하는 수치해석 기법 중 하나가 룽게-쿠타 방법이다. 룽게-쿠타는 오일러 방식보다 Computational cost가 적으면서도 높은 정확도를 보인다.

전체 시간구간 $T$ 에 대해 시간 간격인 $\Delta{t}$ 의 4승에 비례하는 오차를 지녀 RK4 기법으로도 불린다.

[반디통](https://www.banditong.com/cae-dict/runge_kutta_method)에서 첨부된 이미지가 기울기 평균을 이용하는 방식을 잘 보여주는 것 같아 첨부함.
![[20230717010115.png]]

일반적인 수식에 대한 RK4 기법을 나타내보면 아래와 같다.

$$
\begin{align}
y^{`} &= f(t, y) \\
s.t\ & y(t_0)=y_0
\end{align}
$$

$k1 = f(t_n, y_n)$
$k2 = f(t_n+\frac{1}{2}h, y_n+\frac{1}{2}hk_1)$
$k_3 = f(t_n+\frac{1}{2}h, y_n+{1\over2}hk_2)$
$k_4 = f(t_n+h, y_n+hk_3)$

이렇게 계산한 k1~k4를 이용해 다음 step의 값을 예측한다.

$y_{n+1} = y_n+\frac{1}{6}h(k_1+2k_2+2k_3+k_4)$
$t_{n+1} = t_n + h$

정리하면, 기울기를 이용해 각 구간의 값을 구하는데 시작과 끝 부분보다 중간 값에 가중치를 더 두어 이를 누적하고 평균내는 것이다.

>[!todo]
>- [ ] Numerical Methods for Engineers

---
2번째 튜토리얼은 txt파일을 읽는 내용이고 필요할 때 찾아보면 됨.


**Algorithmic [Options](https://acado.sourceforge.net/doc/html/d6/d72/classOptions.html "Provides a generic way to set and pass user-specified options.") and Numerical Accuracy**

ACADO에서는 기본 설정으로 `multiple-shooting SQP type method`와 `standard Runge-Kutta`를 사용한다. 이 외에도 본인의 필요에 맞게 설정을 바꾸어 줄 수 있다.

```cpp
OptimizationAlgorithm algorithm(ocp); // construct optimization algorithm,

algorithm.set( INTEGRATOR_TYPE , INT_RK78 );
algorithm.set( INTEGRATOR_TOLERANCE , 1e-8 );
algorithm.set( DISCRETIZATION_TYPE , SINGLE_SHOOTING );
algorithm.set( KKT_TOLERANCE , 1e-4 );

algorithm.solve() ; // and solve the problem.
```

이 전 예제에서는 첫번째와 마지막 라인만 있었다. 즉, algorithm 종류를 선언한 뒤 `solve()` 함수로 연산을 수행하는데, 이 사이에 `set()`함수로 설정을 변경해줄 수 있음.

|   |   |   |
|---|---|---|
|**Option Name:**|**Option Value:**|**Short Description:**|
|MAX_NUM_ITERATIONS|int|maximum number of SQP iterations  <br>(maxNumIterations = 0: only simulation)|
|KKT_TOLERANCE|double|termination tolerance for the optimal control algorithm|
|HESSIAN_APPROXIMATION|CONSTANT_HESSIAN  <br>FULL_BFGS_UPDATE  <br>BLOCK_BFGS_UPDATE  <br>GAUSS_NEWTON  <br>EXACT_HESSIAN|constant hessian (generalized gradient method)  <br>BFGS update of the whole hessian  <br>structure exploiting BFGS update (default)  <br>Gauss-Newton Hessian approximation (only for LSQ)  <br>Exact Hessians|
|DISCRETIZATION_TYPE|SINGLE_SHOOTING  <br>MULTIPLE_SHOOTING  <br>COLLOCATION|single shooting discretization  <br>multiple shooting discretization (default)  <br>collocation (will be implemented soon)|
|INTEGRATOR_TYPE|INT_RK12  <br>INT_RK23  <br>INT_RK45  <br>INT_RK78  <br>INT_BDF|Runge Kutta integrator (adaptive Euler method)  <br>Runge Kutta integrator (order 2/3, RKF )  <br>Runge Kutta integrator (order 4/5, Dormand Prince)  <br>Runge Kutta integrator (order 7/8, Dormand Prince)  <br>BDF (backward differentiation formula) integrator|
|INTEGRATOR_TOLERANCE|double|the relative tolerance of the integrator|
|ABSOLUTE_TOLERANCE|double|the absolute tolerance of the integrator ("ATOL")|
|MAX_NUM_INTEGRATOR_STEPS|int|maximum number of integrator steps|
|LEVENBERG_MARQUARDT|double|value for Levenberg-Marquardt regularization|
|MIN_LINESEARCH_PARAMETER|double|minimum stepsize of the line-search globalization|

위와 같이 지원해주는 내용을 `set(<Option Name>, <Option Value>`로 해주면 된다.

**Storing the Results of Optimization Algorithms**

ACADO에서는 알고리즘을 풀어낸 결과를 plotting하는 것 외에도 결과를 따로 저장하는 기능을 제공한다.

1. 텍스트파일로 저장하기
	```cpp
	// ... (IMPLEMENTATION OF THE OPTIMIZATION PROBLEM) ...
    
    OptimizationAlgorithm algorithm(ocp);
    algorithm.solve()                   ;
    
    algorithm.getDifferentialStates("states.txt"    );
    algorithm.getParameters        ("parameters.txt");
    algorithm.getControls          ("controls.txt"  );
	```
	
	우리가 처음 코드를 작성할 때 state, control, parameters를 아래와 같이 선언을 해준다.
	```cpp
	USING_NAMESPACE_ACADO

	DifferentialState s,v,m ; // the differential states
	Control u ; // the control input u
	Parameter T ; // the time horizon T
	DifferentialEquation f( 0.0, T ); // the differential
	```
	.
	선언된 변수들이 `OptimizationAlgorithm`으로 들어가고 이를 `get~`으로 받아오는 방식이다.

2. `VariablesGrid`로 받아오기
	[Initialization of Nonlinear Optimization Algorithms](https://acado.sourceforge.net/doc/html/d4/d29/example_002.html) 에서 생략한 내용 중 `VariablesGrid`로 명칭된 자료구조를 활용해 Initialization을 할 수 있었는데 마찬가지로 결과값도 이와 같은 형식으로 얻어올 수 있다

	```cpp
	Variables Grid states, parameters, controls;
    
    algorithm.getDifferentialStates(states    );
    algorithm.getParameters        (parameters);
    algorithm.getControls          (controls  );
    
    states.print();
    parameters.print();
    controls.print();
	```
	.
	이렇게 선언된 변수들로 다른 함수에서 사용할 수 있어, 굳이 파일을 읽어오지 않더라도 변수들을 real-time으로 받아와 사용할 수 있다.
3. `LogRecord` 로 저장하기
	`LogRecord`는 ACADO에서 제공하는 로깅 툴로 앞선 텍스트 파일이나 콘솔 프린트 형식 외에도 여러 옵션을 설정하여 저장할 수 있는 기능이다. 자세한건 [홈페이지](https://acado.sourceforge.net/doc/html/dc/da2/example_004.html) 참고.

---

기본적인 내용은 모두 살펴보았고, MPC 관련 예제로 넘어가자.
앞선 Multi-Ojbective OCP(MOOCP)는 plotting이 안되거나 에러뜨는게 있어서 조금 돌려보다가 패스. Github Issues에도 아무도 관련 언급이 없었음.

#### Setting-Up a [Process](https://acado.sourceforge.net/doc/html/df/d30/classProcess.html "Simulates the process to be controlled based on a dynamic model.") for MPC Simulations

**A Guiding Example: Simulation of a Quarter Car**

이번 예제에서는 MPC 시뮬레이션을 위한 셋업으로, active suspension을 가진 간단한 quarter car model을 다룬다.
body와 wheel의 position, velocity를 각각 $xB, vB, xW, vW$로 하고 외란으로 작용하는 도로는 $R$로 한다. control input은 body와 wheel 사이의 damping force $F$로 정의하면, 아래와 같이 dynamic equation을 정의할 수 있다.
자세한 수식 유도를 찾아보고 싶었으나 state space가 딱 매칭되는 설명을 찾지 못하였음. 모델 방정식은 내가 사용하려는 것에 맞게 짜야하므로 깊게 파지 않고 패스함.

$$
f: \quad \left( \begin{array}{c} \dot{x}_\textrm{B}(t) \\ \dot{x}_\textrm{W}(t) \\ \dot{v}_\textrm{B}(t) \\ \dot{v}_\textrm{W}(t) \\ \end{array} \right) = \left( \begin{array}{c} v_\textrm{B}(t) \\ v_\textrm{W}(t) \\ \frac{1}{m_\textrm{B}} (-k_\textrm{S} x_\textrm{B}(t) + k_\textrm{S} x_\textrm{W}(t) + F(t))\\ \frac{1}{m_\textrm{W}} (-k_\textrm{T} x_\textrm{B}(t) - (k_\textrm{T} + k_\textrm{S})x_\textrm{W}(t) + k_\textrm{T} R(t) - F(t)) \end{array} \right)
$$

$$
g: \quad \left( \begin{array}{c} g_1( t ) \\ g_2( t ) \end{array} \right) = \left( \begin{array}{c} x_\textrm{B}(t) \\ 500 v_\textrm{B}(t) + F( t ) \end{array} \right)
$$

코드를 통해 수식과 매칭시켜보자.

```cpp
// INTRODUCE THE VARIABLES:
// -------------------------
DifferentialState xB;
DifferentialState xW;
DifferentialState vB;
DifferentialState vW;

Disturbance R;
Control F;

Parameter mB;
double mW = 50.0;
double kS = 20000.0;
double kT = 200000.0;
```
위와 같이 우리가 사용하는 변수를 선언한다.

```cpp
// DEFINE THE DYNAMIC SYSTEM:
// --------------------------
DifferentialEquation f;

f << dot(xB) == vB;
f << dot(xW) == vW;
f << dot(vB) == ( -kS*xB + kS*xW + F ) / mB;
f << dot(vW) == ( kS*xB - (kT+kS)*xW + kT*R - F ) / mW;

OutputFcn g;
g << xB;
g << 500.0*vB + F;

DynamicSystem dynSys( f,g );

```
그리고 ODE와 Output 함수로 Dynamic System을 선언해준다.
[DynamicSystem](https://acado.sourceforge.net/doc/html/df/dc3/classDynamicSystem.html) Class를 살펴보면, DifferentialEquation만 넣어주거나 DE와 OutputFcn을 같이 넣어서 Construct해줄 수 있다.

```cpp  
// SETUP THE PROCESS:
// ------------------
Process myProcess;
  
myProcess.setDynamicSystem( dynSys,INT_RK45 );
myProcess.set( ABSOLUTE_TOLERANCE,1.0e-8 );
  
Vector x0( 4 );
x0.setZero( );
x0( 0 ) = 0.01;
```
그 후 선언한 dynamic system을 intergrator와 tolerance를 설정해준다. initial state 중 $xB$를 0.01로 해주고 나머지는 0으로 해주기로 하였으므로 마지막 세 줄과 같이 선언.

여기까지는 Differential Equation을 풀어 Output Function을 구하기 위한 내용이다.

#### Setting-Up an MPC [Controller](https://acado.sourceforge.net/doc/html/d9/d85/classController.html "Calculates the control inputs of the Process based on the Process outputs.")

이제 이 모델에 대한 MPC 제어를 하도록 OCP를 정의해보도록 하자.
Notation은 일반적인 $x, u, p, T$를 따른다. ($p$는 time-constant 변수이다.)

**Mathematical Formulation of Model Predictive Control Problems**

$$
\begin{align}
\displaystyle\min_{x(\cdot),u(\cdot),p} \int_{t_0}^{t_0 + T} & \Vert h( t, x(t), u(t), p ) - \eta(t) \Vert_Q^2 \; \mathrm{d}t + \Vert m( x(t_0+T), p, t_0+T ) - \mu \Vert_P^2
\\ s.t \; x(t_0) &= x_0
\\ \forall t \in [t_0, t_0 + T]: 0 &= f( t, x(t), \dot x(t), u(t), p )
\\ \forall t \in [t_0, t_0 + T]: 0 & \geq s( t, x(t), u(t), p )
\\ 0 &= r( x(t_0+T), p, t_0+T )
\end{align}
$$

$s$는 경로에 대한 constraints이고 $r$은 종료 시점에 대한 constraints이다.

이제 위에서 정의한 Dynamic System에 더해 Optimal control problem을 정의하고 풀어내는 코드를 살펴보자.

```cpp
// DEFINE LEAST SQUARE FUNCTION:
// -----------------------------
Function h;
  
h << xB;
h << xW;
h << vB;
h << vW;
h << F;
  
// LSQ coefficient matrix
Matrix Q(5,5);
Q(0,0) = 10.0;
Q(1,1) = 10.0;
Q(2,2) = 1.0;
Q(3,3) = 1.0;
Q(4,4) = 1.0e-8;
  
// Reference
Vector r(5);
r.setAll( 0.0 );
  
```
Objective function에 넣어줄 내용을 정의한다. LSQ coefficient는 weighting factor이다. 궁금한 점은 terminal reference에 대한 내용은 튜토리얼에 왜 없는지 모르겠음.
아마도 한 time-step에 대해 control input을 구하기 때문으로 추측했음.

```cpp  
// DEFINE AN OPTIMAL CONTROL PROBLEM:
// ----------------------------------
const double tStart = 0.0;
const double tEnd = 1.0;
  
OCP ocp( tStart, tEnd, 20 );
  
ocp.minimizeLSQ( Q, h, r );
  
ocp.subjectTo( f );
  
ocp.subjectTo( -200.0 <= F <= 200.0 );
ocp.subjectTo( R == 0.0 );
  
```
이제 `minimizeLSQ()`로 weighting matrix, objective function, reference를 선언해주고 constraints를 정의해준다. 자세한 클래스 함수는 [링크](https://acado.sourceforge.net/doc/html/d7/df1/classOCP.html)를 참조한다.

```cpp  
// SETTING UP THE REAL-TIME ALGORITHM:
// -----------------------------------
RealTimeAlgorithm alg( ocp,0.025 );
alg.set( MAX_NUM_ITERATIONS, 1 );
alg.set( PLOT_RESOLUTION, MEDIUM );
  
GnuplotWindow window;
window.addSubplot( xB, "Body Position [m]" );
window.addSubplot( xW, "Wheel Position [m]" );
window.addSubplot( vB, "Body Velocity [m/s]" );
window.addSubplot( vW, "Wheel Velocity [m/s]" );
window.addSubplot( F, "Damping Force [N]" );
window.addSubplot( R, "Road Excitation [m]" );
  
alg << window;
  
  
// SETUP CONTROLLER AND PERFORM A STEP:
// ------------------------------------
StaticReferenceTrajectory zeroReference( "ref.txt" );
  
Controller controller( alg,zeroReference );
  
Vector y( 4 );
y.setZero( );
y(0) = 0.01;
  
controller.init( 0.0,y );
controller.step( 0.0,y );
```

이후에는 위와 같이 알고리즘을 설정해주는데, MPC에서는 `RealTimeAlgorithm` 클래스로 선언하고, 최적제어 문제인 `ocp`와 샘플링 시간을 변수로 넣어준다.
LSQ를 풀기위해 넣는 reference는 텍스트파일로 읽어서 넣어 줄 수 있다.

`Controller`에서 사용하는 `init()`함수와 `step()`함수는 각각 시작 시간과 initial state 벡터를 넣어주면 된다. 자세한 내용은 클래스 설명을 참고.
- [init()](https://acado.sourceforge.net/doc/html/d9/d85/classController.html#a8ede9dbcec7f59b10c7f1a700f9685cd)
- [step()](https://acado.sourceforge.net/doc/html/d9/d85/classController.html#ad9d39912d064afa5fdc1629b7c3e12d0)

---

#### Performing a Basic Closed-Loop MPC Simulation

이제 MPC를 사용하는 closed-loop 형태의 시뮬레이션을 해보도록 한다.

**Implementation of the MPC Simulation in ACADO**

앞서 사용한 the simple quarter car model with active actuator를 사용한다.

모델에 대한 ODE 방정식을 세우고, 앞서 했던 대로 `Process`와 `Controller`을 선언해준다. 이번에는 Output Function에 별다른 수식을 넣지 않는다.

OCP를 정의하기 위한 LSQ 와 constraints도 그대로 들어간다.
`Controller`에서는 OCP를 풀게 되고, `SimulationEnvironment`에는 startTime, endTime, `Process`, `Controller`를 차례로 넣어준다.

initial state를 넣고 `run()`하면 매 step마다의 값들을 얻을 수 있다.

Tutorial과 동일한 내용이지만 한줄 씩 따라서 작성해보았다.

>[!error] Debugging
>튜토리얼과 방정식들을 바탕으로 코드를 작성하였는데, 여러 에러와 문제점이 발생하였다.
>- 우선, 튜토리얼에서 사용한 헤더파일 `#include <acado_optimal_control.hpp>`은 `#include <acado_toolkit.hpp>`로 변경되었다.
>- 튜토리얼에서 작성한 LSQ와 constraints, solver 세팅이 코드 예제로 주어진 `getting_started/simple_mpc`와 상이하였다.

주요하게 다른 부분을 살펴보면

**Tutorial page**
```cpp
Disturbance R;
Control F;

VariablesGrid disturbance = readFromFile( "road.txt" );;
process.setProcessDisturbance( disturbance );

// DEFINE LEAST SQUARE FUNCTION:
// -----------------------------
Function h;

h << xB;
h << xW;
h << vB;
h << vW;
h << F;
```

**simple_mpc**
```cpp
Control R;
Control F;

// DEFINE LEAST SQUARE FUNCTION:
// -----------------------------
Function h;

h << xB;
h << xW;
h << vB;
h << vW;
```

튜토리얼에서는 Disturbance를 별도로 선언하고 `VariablesGrid`에도 disturbance를 선언하였다. 그리고 이를 텍스트파일로 불러와 `setProcessDisturbance()`로 설정해주었는데,

simple_mpc에서는 road인 $R$도 `Control` 변수로 사용하였다.

그리고 LSQ 함수의 dimension도 다르기 때문에 이후 coefficient나 reference의 dimension도 맞게 달라졌다.

**Tutorials**
```cpp
// MPC Controller
RealTimeAlgorithm alg(ocp, 0.025);
alg.set(INTEGRATOR_TYPE, INT_RK78);
// alg.set(MAX_NUM_ITERATIONS, 2);
  
StaticReferenceTrajectory zeroReference;
Controller controller(alg, zeroReference);
  
// Simulation
SimulationEnvironment sim(0.0, 2.5, process, controller);
```
**simple_mpc**
```cpp
// SETTING UP THE MPC CONTROLLER:
// ------------------------------
RealTimeAlgorithm alg( ocp,0.05 );
alg.set( MAX_NUM_ITERATIONS, 2 );

StaticReferenceTrajectory zeroReference;
Controller controller( alg,zeroReference );

// SETTING UP THE SIMULATION ENVIRONMENT, RUN THE EXAMPLE...
// ----------------------------------------------------------
SimulationEnvironment sim( 0.0,3.0,process,controller );
```
그리고 sampling time이나 전체 시뮬시간인 $T$도 상이하였다. 가장 크게 다른 것은 solver 세팅에서 튜토리얼은 `INTEGRATOR_TYPE`을 `RK78`로 하였고, simple_mpc에서는 integrator 대신 최대 iterations를 설정해주었다.

마지막으로
**Tutorials**
```cpp
VariablesGrid diffStates;
sim.getProcessDifferentialStates(diffStates);
  
VariablesGrid feedbackControl;
sim.getFeedbackControl(feedbackControl);
  
GnuplotWindow win;
win.addSubplot(diffStates(0), "Body Position(m)");
win.addSubplot(diffStates(1), "Wheel Position(m)");
win.addSubplot(diffStates(2), "Body Velocity(m/s)");
win.addSubplot(diffStates(3), "Wheel Velocity(m/s)");
```

**simple_mpc**
```cpp
VariablesGrid sampledProcessOutput;
sim.getSampledProcessOutput( sampledProcessOutput );
  
VariablesGrid feedbackControl;
sim.getFeedbackControl( feedbackControl );
  
GnuplotWindow window;
window.addSubplot( sampledProcessOutput(0), "Body Position [m]" );
window.addSubplot( sampledProcessOutput(1), "Wheel Position [m]" );
window.addSubplot( sampledProcessOutput(2), "Body Velocity [m/s]" );
window.addSubplot( sampledProcessOutput(3), "Wheel Velocity [m/s]" );
```
plotting을 위해 받아오는 `VariablesGrid`에서 튜토리얼은 `getProcessDifferentialStates`를 사용해서 state $x$를 받아왔는데, simple_mpc에서는 `getSampledProcessOutput`을 이용해서 받아왔다.

그래서 튜토리얼을 코드가 돌아갈 수 있도록 하여 작성해본 것과 sim_mpc, 튜토리얼 페이지에서 제공한 plot을 비교해보았다.

작성한 코드는 [링크](ocp_mpc_simulation.cpp)에 있다.

먼저 튜토리얼 결과
![[20230717232457.png]]

튜토리얼 코드를 현재 acado에서 돌아가도록 작성한 결과
![[20230717232535.png]]

마지막으로 현재 `getting_started`에 있는 simple_mpc
![[20230717232614.png]]

내 코드와 simple_mpc는 대부분 유사하고 $xW, vW$만 차이를 보인다. 아마 LSQ에 coefficient가 매우 작긴 해도 Control input인 $F$가 들어가 있어서 차이를 보인 것 같다.
하지만 `MAX_NUM_ITERATIONS`를 쓴 simple_mpc보다 `INTEGRATOR_TYPE`으로 RK78을 사용하며 sampling time을 더 작게 가져간 내 코드가 Body Position/Velocity인 $xB, vB$ 그래프를 보았을 때 더욱 세밀하게 나온 것을 알 수 있다.