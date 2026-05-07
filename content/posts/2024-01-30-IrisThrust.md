---
layout: post
title: How to calculate Total Thrust of iris model
date: 2024-01-30
categories: ROS
tags:
  - px4
math: "true"
---
# How to calculate Total Thrust of iris model

## Model SDF

^57f567

[[2024-02-06-GCOPTER|GCOPTER]] 에서 `magnitudeBounds` 로 `minThrust`, `maxThrust` 를 요구하기 때문에 tracking 가능한 경로 (or dynamically feasible) 를 만들기 위해 계산이 필요하다.

Iris SDF 파일에 나와있는 `maxRotVelocity` 와 `motorConstant` 에 따르면 motor constant $k=5.84 \times 10^{-6}$ 이고 maximum rotor velocity $w=1100\ \text{(rpm)}\times\frac{2\pi}{60}$ 이다.

$$
T=k\times w^2
$$

위 수식 에 대입해보면 한 모터 당 $0.078\ N$ 정도 나오고 quadrotor 기준 $0.31\ N$ 이다.

```python
>>> k = 5.84 * 10 ** -6
>>> w = 1100 * 2 * math.pi / 60
>>> T = k * w ** 2
>>> T
0.0774917472665087
>>> 4 * T
0.3099669890660348 (N)
```

그러나 SDF 에 나와있는 무게가 $1.535\ kg$ 이므로 중력 가속도 $g$ 를 곱해주면 위 모터 출력으로 호버링할 수 없게된다. (약 $15.06\ N$ 필요)

>[!bug] 
> - **아래 섹션에서 다루지만 위 계산 방식은 잘못되었음**

## Analyze ROS topics

PX4 에서는 0과 1 사이의 normalized thrust 를 사용한다. 따라서 기체가 호버링하는 값을 찾으면 그때의 thrust 가 $W=mg$ 라는 의미이고, 가속도 $a$ 는 $9.81 m/s^2$ 에 근접한다. [[Reference](https://discuss.px4.io/t/thrust-to-throttle-in-mavros-setpoint-raw-attitude/9029/11)]

따라서 이를 [mavros_controllers](https://github.com/Jaeyoung-Lim/mavros_controllers) 에 구현된 제어기를 통해 구해볼 수 있다.

이 geometric controller 는 Iris 기체에 적용되어 있고 호버링이나 원형 궤적을 잘 tracking 할 수 있게 튜닝되어 있다.

처음 $2.0\ m$ 높이로 호버링할 때는 `~/setpoint_raw/attitude` 의 normalized thrust 값은 0.7 이고, thrust 를 scaling 하기 위한 수식은 아래와 같이 적용되어 있다.

$$
T_{norm} = 0.06\ T + 0.1
$$

즉, $10\ N$ 의 thrust 일 때 호버링하고 있고 처음 이륙하기 전에 내보내는 thrust 값은 약 $17.79\ N$ 이었다.

>[!warning]
> 이를 바탕으로 iris 기체의 질량을 계산하면 대략 $1.02\ kg$ 임을 알 수 있다.
> 하지만 iris 를 호버링시키는 normalized thrust 0.7 이 되도록 scaling 한 것이므로 모델의 무게가 반영된 것으로 보이지는 않는다.

여기에서 유일하게 고려된 dynamics 는 최대 가속도 $8.0\ m/s^2$ 이고 이는 파라미터로 적용되어 있다. 


```cpp
// Position Controller
const Eigen::Vector3d a_fb = poscontroller(pos_error, vel_error);
  
// Rotor Drag compensation
const Eigen::Vector3d a_rd = R_ref * D_.asDiagonal() * R_ref.transpose() * target_vel; // Rotor drag
  
// Reference acceleration
const Eigen::Vector3d a_des = a_fb + a_ref - a_rd - gravity_;

// ...
Eigen::Vector3d geometricCtrl::poscontroller(){
	Eigen::Vector3d a_fb = 
		Kpos_.asDiagonal() * pos_error + Kvel_.asDiagonal() * vel_error; // feedforward term for trajectory error
	
	if (a_fb.norm() > max_fb_acc_)
		a_fb = (max_fb_acc_ / a_fb.norm()) * a_fb; // Clip acceleration if reference is too large
	
	return a_fb;
}
```

위와 같이 최대 가속도로 제한된 `a_fb` 에 `gravity_` 빼서 연산하므로 이륙할 때 내던 최대 thrust 도 $a_{max} + g$ 의 결과이다.

### Motor PWM and Accelerations

결국 호버링하는 normalized thrust 는 0.7 이고 최대 normalized thrust 는 1.0 이므로 실제로 낼 수 있는 최대 thrust 가 더 크더라도 scaling 의 영향을 받는 것을 알 수 있다.

그래서 normalized thrust 가 0.7 과 1.0 일 때의 각각 모터 출력값과 가속도를 살펴보았다.

호버링할 때 각 모터에서 내는 출력값 토픽 `~/rc/out` 은 아래와 같다.

```bash
$ rostopic echo /mavros/rc/out
header: 
  seq: 391
  stamp: 
    secs: 886
    nsecs: 195000000
  frame_id: ''
channels: [1708, 1709, 1706, 1704, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900]
---
header: 
  seq: 392
  stamp: 
    secs: 886
    nsecs: 295000000
  frame_id: ''
channels: [1707, 1705, 1707, 1706, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900]
---
# ...
---
header: 
  seq: 401
  stamp: 
    secs: 887
    nsecs: 196000000
  frame_id: ''
channels: [1704, 1703, 1704, 1703, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900]
---
header: 
  seq: 402
  stamp: 
    secs: 887
    nsecs: 295000000
  frame_id: ''
channels: [1705, 1703, 1705, 1705, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900]

```

4 개의 모터에서 모두 대략 1700 의 pwm 을 내는 것으로 보인다.

이륙 시부터 호버링까지 `~/imu/data_raw` 의 가속도값과 `~/rc/out` 을 측정해본 결과 최댓값인 2000 의 모터 출력을 낼 때 기체의 가속도는 대략 15.6 ~ 17.0 $m/s^2$ 을 내고 있었다.

### Calculations

^9d0bb1

Iris 의 최대 가속도 $a_{max} = 16\ m/s^2$ 라고 하고 질량 $m = 1.535\ kg$ 라고 하자. 이는 SDF 파일에 있는 질량을 모두 더한 것이다.

그렇다면 호버링 할 때 필요한 thrust 는 $mg = 1.535 \times 9.81 = 15.053\ (N)$ 이고, 최대 thrust 는 $ma_{max} = 1.535\times 16 = 24.56\ (N)$ 이다.

이를 각각 normalize thrust 0.7 과 1 에 mapping 하기 위한 상수 $\alpha, \beta$ 를 구하자.

$$
\begin{align}
24.56\ \alpha &+ \beta = 1 \tag{max}\\
15.053\ \alpha &+ \beta = 0.7 \tag{hover}
\end{align}
$$

방정식을 풀어내면 $\alpha = 0.0316, \beta = 0.2239$ 이다.

## Increase the mass of iris until the drone can not offboard

최대 Thrust 를 구할 수 있는 다른 방법이 있다. normalized thrust 가 1임을 이용하여 SDF 파일의 모델 무게를 이륙하지 못할 때 까지 조금씩 증가시키는 것이다. [[Reference](https://discuss.px4.io/t/what-is-the-maximum-thrust-in-newton-of-the-iris-model/15839/2)]

즉 $T_{max} = mg$ 임을 이용하는 것이다.

이전 [[#^9d0bb1|계산]] 에서 $24.56\ N$ 을 최대 thrust 로 구하였으므로 이를 $g=9.81$ 로 나누어 SDF 파일을 수정하여 테스트해보자.

우선 $24\ N$ 으로 가정하여 `<mass>2.412</mass>` 로 iris.sdf 수정 $\rightarrow$ 이륙 성공

$24.56\ N$ 그대로 계산하여 `<mass>2.469</mass>` 로 수정 $\rightarrow$ 이륙 실패

0.01 씩 조절해본 결과, 2.41 일 때 이륙 성공하고 2.42 일 때 이륙 실패하였다.

0.001 씩 다시 늘려본 결과 normalized thrust 가 굉장히 값이 많이 바뀌므로 이전 2.412 일 때 이륙 성공하고 2.413 일 때 이륙 실패하였다.

딱 떨어지는 값을 갖는 것을 보아 iris 기체의 **Total Thrust 는 $24\ N$** 이다. 그러므로 최대 가속도 $a_{max} = 15.635\ m/s^2$ 가 된다.

### Calculations

위 계산대로 다시 진행해보면, 호버링 할 때 필요한 thrust 는 $mg = 1.535 \times 9.81 = 15.053\ (N)$ 이고, 최대 thrust 는 $ma_{max} = 1.535\times 15.635 = 24\ (N)$ 이다.

$$
\begin{align}
24\ \alpha &+ \beta = 1 \tag{max}\\
15.053\ \alpha &+ \beta = 0.7 \tag{hover}
\end{align}
$$

방정식을 풀어내면 $\alpha = 0.0335, \beta = 0.196$ 이다.

>[!todo]
> - geometric controller 에서 만드는 Thrust 는 실제 값보다 작게 나오고 있다. (호버링 시 $15.053\ N$ 이 나오도록 연산되어야 하지만 $10\ N$ 이 나오고 있음.)
> - `poscontroller` 에서 `Kpos_` 와 `Kvel_` 로 P-control 되고 있으므로 이를 튜닝.
> - 호버링 시 $15.053\ N$ 이 0.7 로, 이륙 시 최대 $24\ N$ 이 1 로 mapping 될 수 있도록 scaling factor 를 $\alpha, \beta$ 로 수정

## Gazebo Motor Plugin

[[2023-08-01-PX4SITLGazebo|PX4 시뮬레이션]]에서 SDF 의 모터를 직접 처리하는 [gazebo_motor_model.cpp](https://github.com/PX4/PX4-SITL_gazebo-classic/blob/main/src/gazebo_motor_model.cpp) 를 참고하였다.

이전 [[#^57f567|Model SDF]] 에서 계산한 방식이 잘못되었다. `maxRotVelocity` 가 RPM 이 아닌지 값 그대로 계산되었다. [VelocityCallback](https://github.com/PX4/PX4-SITL_gazebo-classic/blob/main/src/gazebo_motor_model.cpp#L184) 을 보면 `force` 를 계산하는데 들어가는 `real_motor_velocity` 과 같은 단위를 사용하고 있다.

그러므로 motor constant $k=5.84 \times 10^{-6}$ 과 maximum rotor velocity $w=1100\ \text{(rpm)}\times\frac{2\pi}{60}$ 로 $T=k\times w^2$ 를 다시 계산해보자.

한 모터 당 $7.0664\ N$ 이고 quadrotor 기준 $28.2656\ N$ 이다.

이는 위에서 계산한 $24\ N$ 에 약 15 $\%$ 오차가 있다. 실제 계산에서는 $drag_{motor}, drag_{air}$ 도 같이 고려되고, 직접 날려보며 적용하였으므로 대략 맞는다고 여겨진다.

[gazebo_motor_model.cpp](https://github.com/PX4/PX4-SITL_gazebo-classic/blob/main/src/gazebo_motor_model.cpp) 의 주요 부분은 아래와 같다.

```cpp
void GazeboMotorModel::VelocityCallback(CommandMotorSpeedPtr &rot_velocities) {
	if(rot_velocities->motor_speed_size() < motor_number_) {
		std::cout << "You tried to access index " << motor_number_
		<< " of the MotorSpeed message array which is of size " << rot_velocities->motor_speed_size() << "." << std::endl;
	} else ref_motor_rot_vel_ = std::min(static_cast<double>(rot_velocities->motor_speed(motor_number_)), static_cast<double>(max_rot_velocity_));
}
  
void GazeboMotorModel::UpdateForcesAndMoments() {
	motor_rot_vel_ = joint_->GetVelocity(0);
	if (motor_rot_vel_ / (2 * M_PI) > 1 / (2 * sampling_time_)) {
		gzerr << "Aliasing on motor [" << motor_number_ << "] might occur. Consider making smaller simulation time steps or raising the rotor_velocity_slowdown_sim_ param.\n";
	}
	double real_motor_velocity = motor_rot_vel_ * rotor_velocity_slowdown_sim_;
	double force = real_motor_velocity * std::abs(real_motor_velocity) * motor_constant_;
	if(!reversible_) {
		// Not allowed to have negative thrust.
		force = std::abs(force);
	}
	  
	// scale down force linearly with forward speed
	// XXX this has to be modelled better
	//
	ignition::math::Vector3d body_velocity = ignitionFromGazeboMath(link_->GetWorldLinearVel());
	ignition::math::Vector3d joint_axis = ignitionFromGazeboMath(joint_->GetGlobalAxis(0));
	  
	ignition::math::Vector3d relative_wind_velocity = body_velocity - wind_vel_;
	ignition::math::Vector3d velocity_parallel_to_rotor_axis = (relative_wind_velocity.Dot(joint_axis)) * joint_axis;
	double vel = velocity_parallel_to_rotor_axis.Length();
	double scalar = 1 - vel / 25.0; // at 25 m/s the rotor will not produce any force anymore
	scalar = ignition::math::clamp(scalar, 0.0, 1.0);
	// Apply a force to the link.
	link_->AddRelativeForce(ignition::math::Vector3d(0, 0, force * scalar));
	  
	// Forces from Philppe Martin's and Erwan Salaün's
	// 2010 IEEE Conference on Robotics and Automation paper
	// The True Role of Accelerometer Feedback in Quadrotor Control
	// - \omega * \lambda_1 * V_A^{\perp}
	ignition::math::Vector3d velocity_perpendicular_to_rotor_axis = relative_wind_velocity - (relative_wind_velocity.Dot(joint_axis)) * joint_axis;
	ignition::math::Vector3d air_drag = -std::abs(real_motor_velocity) * rotor_drag_coefficient_ * velocity_perpendicular_to_rotor_axis;
	// Apply air_drag to link.
	link_->AddForce(air_drag);
	// Moments
	// Getting the parent link, such that the resulting torques can be applied to it.
	physics::Link_V parent_links = link_->GetParentJointsLinks();
	// The tansformation from the parent_link to the link_.th::Pose3d pose_difference = ignitionFromGazeboMath(link_->GetWorldCoGPose() - parent_links.at(0)->GetWorldCoGPose());
	
	ignition::math::Vector3d drag_torque(0, 0, -turning_direction_ * force * moment_constant_);
	// Transforming the drag torque into the parent frame to handle arbitrary rotor orientations.
	ignition::math::Vector3d drag_torque_parent_frame = pose_difference.Rot().RotateVector(drag_torque);
	parent_links.at(0)->AddRelativeTorque(drag_torque_parent_frame);
	  
	ignition::math::Vector3d rolling_moment;
	// - \omega * \mu_1 * V_A^{\perp}
	rolling_moment = -std::abs(real_motor_velocity) * turning_direction_ * rolling_moment_coefficient_ * velocity_perpendicular_to_rotor_axis;
	parent_links.at(0)->AddTorque(rolling_moment);
	// Apply the filter on the motor's velocity.
	double ref_motor_rot_vel;
	ref_motor_rot_vel = rotor_velocity_filter_->updateFilter(ref_motor_rot_vel_, sampling_time_);  
	
	joint_->SetVelocity(0, turning_direction_ * ref_motor_rot_vel / rotor_velocity_slowdown_sim_);
	
	#endif /* if 0 */
}
```

## And so on...

### Control Allocator

SDF 파일에 나와있는 모터 값들 외에 PX4 내부에서 설정하는 값을 찾기 위해 여러 자료들을 찾음.

이전에는 **Mixer** 로 관리되던 **Control Allocation** 과 관련이 있었다. normalized thrust 를 어떤 모델에도 적용하기 위해 필요한 내용으로 자세한 내용은 [공식 문서](https://docs.px4.io/main/en/concept/control_allocation.html) 에 잘(?) 나와있다.

`v1.13` 이후로는 control allocator 로 바뀌면서 소스코드 위치가 바뀌었고, 일부 문서 링크도 깨져있다. 현재 [[2023-09-15-PX4AutopilotInstallation|PX4-Autopilot]] control allocator 의 소스코드 링크는 [src/modules/control_allocator](https://github.com/PX4/PX4-Autopilot/tree/main/src/modules/control_allocator) 이다.

여기에 있는 `module.yaml` 파일에 airframe 에 정의되는 값들의 기본값 및 설명이 들어있다. (Multirotor 이 외는 모두 생략)

```yaml
__max_num_mc_motors: &max_num_mc_motors 12
__max_num_servos: &max_num_servos 8
__max_num_tilts: &max_num_tilts 4

module_name: Control Allocation

parameters:
    - group: Geometry
      definitions:
        CA_AIRFRAME:
            description:
                short: Airframe selection
                long: |
                  Defines which mixer implementation to use.
                  Some are generic, while others are specifically fit to a certain vehicle with a fixed set of actuators.

                  'Custom' should only be used if noting else can be used.
            type: enum
            values:
                0: Multirotor
                1: Fixed-wing
                2: Standard VTOL
                3: Tiltrotor VTOL
                4: Tailsitter VTOL
                5: Rover (Ackermann)
                6: Rover (Differential)
                7: Motors (6DOF)
                8: Multirotor with Tilt
                9: Custom
                10: Helicopter (tail ESC)
                11: Helicopter (tail Servo)
                12: Helicopter (Coaxial)
            default: 0

        CA_METHOD:
            description:
                short: Control allocation method
                long: |
                  Selects the algorithm and desaturation method.
                  If set to Automtic, the selection is based on the airframe (CA_AIRFRAME).
            type: enum
            values:
                0: Pseudo-inverse with output clipping
                1: Pseudo-inverse with sequential desaturation technique
                2: Automatic
            default: 2

        # Motor parameters
        CA_R_REV:
            description:
                short: Bidirectional/Reversible motors
                long: |
                  Configure motors to be bidirectional/reversible. Note that the output driver needs to support this as well.
            type: bitmask
            bit:
                0: Motor 1
                1: Motor 2
                2: Motor 3
                3: Motor 4
                4: Motor 5
                5: Motor 6
                6: Motor 7
                7: Motor 8
                8: Motor 9
                9: Motor 10
                10: Motor 11
                11: Motor 12
            default: 0
        CA_R${i}_SLEW:
            description:
                short: Motor ${i} slew rate limit
                long: |
                  Minimum time allowed for the motor input signal to pass through
                  the full output range. A value x means that the motor signal
                  can only go from 0 to 1 in minimum x seconds (in case of
                  reversible motors, the range is -1 to 1).

                  Zero means that slew rate limiting is disabled.
            type: float
            decimal: 2
            increment: 0.01
            num_instances: *max_num_mc_motors
            min: 0
            max: 10
            default: 0.0

        # Servo params
        CA_SV${i}_SLEW:
            description:
                short: Servo ${i} slew rate limit
                long: |
                  Minimum time allowed for the servo input signal to pass through
                  the full output range. A value x means that the servo signal
                  can only go from -1 to 1 in minimum x seconds.

                  Zero means that slew rate limiting is disabled.
            type: float
            decimal: 2
            increment: 0.05
            num_instances: *max_num_servos
            min: 0
            max: 10
            default: 0.0


        # (MC) Rotors
        CA_ROTOR_COUNT:
            description:
                short: Total number of rotors
            type: enum
            values:
                0: '0'
                1: '1'
                2: '2'
                3: '3'
                4: '4'
                5: '5'
                6: '6'
                7: '7'
                8: '8'
                9: '9'
                10: '10'
                11: '11'
                12: '12'
            default: 0
        CA_ROTOR${i}_PX:
            description:
                short: Position of rotor ${i} along X body axis relative to center of gravity
            type: float
            decimal: 2
            increment: 0.1
            unit: m
            num_instances: *max_num_mc_motors
            min: -100
            max: 100
            default: 0.0
        CA_ROTOR${i}_PY:
            description:
                short: Position of rotor ${i} along Y body axis relative to center of gravity
            type: float
            decimal: 2
            increment: 0.1
            unit: m
            num_instances: *max_num_mc_motors
            min: -100
            max: 100
            default: 0.0
        CA_ROTOR${i}_PZ:
            description:
                short: Position of rotor ${i} along Z body axis relative to center of gravity
            type: float
            decimal: 2
            increment: 0.1
            unit: m
            num_instances: *max_num_mc_motors
            min: -100
            max: 100
            default: 0.0

        CA_ROTOR${i}_AX:
            description:
                short: Axis of rotor ${i} thrust vector, X body axis component
                long: Only the direction is considered (the vector is normalized).
            type: float
            decimal: 2
            increment: 0.1
            num_instances: *max_num_mc_motors
            min: -100
            max: 100
            default: 0.0
        CA_ROTOR${i}_AY:
            description:
                short: Axis of rotor ${i} thrust vector, Y body axis component
                long: Only the direction is considered (the vector is normalized).
            type: float
            decimal: 2
            increment: 0.1
            num_instances: *max_num_mc_motors
            min: -100
            max: 100
            default: 0.0
        CA_ROTOR${i}_AZ:
            description:
                short: Axis of rotor ${i} thrust vector, Z body axis component
                long: Only the direction is considered (the vector is normalized).
            type: float
            decimal: 2
            increment: 0.1
            num_instances: *max_num_mc_motors
            min: -100
            max: 100
            default: -1.0

        CA_ROTOR${i}_CT:
            description:
                short: Thrust coefficient of rotor ${i}
                long: |
                  The thrust coefficient if defined as Thrust = CT * u^2,
                  where u (with value between actuator minimum and maximum)
                  is the output signal sent to the motor controller.
            type: float
            decimal: 1
            increment: 1
            num_instances: *max_num_mc_motors
            min: 0
            max: 100
            default: 6.5

        CA_ROTOR${i}_KM:
            description:
                short: Moment coefficient of rotor ${i}
                long: |
                  The moment coefficient if defined as Torque = KM * Thrust.

                  Use a positive value for a rotor with CCW rotation.
                  Use a negative value for a rotor with CW rotation.
            type: float
            decimal: 3
            increment: 0.01
            num_instances: *max_num_mc_motors
            min: -1
            max: 1
            default: 0.05
        CA_ROTOR${i}_TILT:
            description:
                short: Rotor ${i} tilt assignment
                long: If not set to None, this motor is tilted by the configured tilt servo.
            type: enum
            values:
                0: 'None'
                1: 'Tilt 1'
                2: 'Tilt 2'
                3: 'Tilt 3'
                4: 'Tilt 4'
            num_instances: *max_num_mc_motors
            instance_start: 0
            default: 0

# Mixer
mixer:
    actuator_types:
        motor:
            functions: 'Motor'
            actuator_testing_values:
                min: 0
                max: 1
                default_is_nan: true
            per_item_parameters:
              - name: 'CA_R_REV'
                label: 'Bidirectional'
                show_as: 'bitset'
                index_offset: 0
                advanced: true
              - name: 'CA_R${i}_SLEW'
                label: 'Slew Rate'
                index_offset: 0
                advanced: true
        servo:
            functions: 'Servo'
            actuator_testing_values:
                min: -1
                max: 1
                default: 0
            per_item_parameters:
              - name: 'CA_SV${i}_SLEW'
                label: 'Slew Rate'
                index_offset: 0
                advanced: true
        DEFAULT:
            actuator_testing_values:
                min: -1
                max: 1
                default: -1

    config:
        param: CA_AIRFRAME
        types:
            0: # Multirotor
                type: 'multirotor'
                title: 'Multirotor'
                actuators:
                  - actuator_type: 'motor'
                    count: 'CA_ROTOR_COUNT'
                    per_item_parameters:
                        standard:
                            position: [ 'CA_ROTOR${i}_PX', 'CA_ROTOR${i}_PY', 'CA_ROTOR${i}_PZ' ]
                        extra:
                          - name: 'CA_ROTOR${i}_KM'
                            label: 'Direction CCW'
                            function: 'spin-dir'
                            show_as: 'true-if-positive'
                          - name: 'CA_ROTOR${i}_AX'
                            label: 'Axis X'
                            function: 'axisx'
                            advanced: true
                          - name: 'CA_ROTOR${i}_AY'
                            label: 'Axis Y'
                            function: 'axisy'
                            advanced: true
                          - name: 'CA_ROTOR${i}_AZ'
                            label: 'Axis Z'
                            function: 'axisz'
                            advanced: true

            7: # Motors (6DOF)
                actuators:
                  - actuator_type: 'motor'
                    count: 'CA_ROTOR_COUNT'
                    per_item_parameters:
                        standard:
                            position: [ 'CA_ROTOR${i}_PX', 'CA_ROTOR${i}_PY', 'CA_ROTOR${i}_PZ' ]
                        extra:
                          - name: 'CA_ROTOR${i}_AX'
                            label: 'Axis X'
                            function: 'axisx'
                          - name: 'CA_ROTOR${i}_AY'
                            label: 'Axis Y'
                            function: 'axisy'
                          - name: 'CA_ROTOR${i}_AZ'
                            label: 'Axis Z'
                            function: 'axisz'
                          - name: 'CA_ROTOR${i}_KM'
                            label: "Moment\nCoefficient"

            8: # Multirotor with Tilt
                title: 'Multirotor with Tilt'
                actuators:
                  - actuator_type: 'motor'
                    count: 'CA_ROTOR_COUNT'
                    per_item_parameters:
                        standard:
                            position: [ 'CA_ROTOR${i}_PX', 'CA_ROTOR${i}_PY', 'CA_ROTOR${i}_PZ' ]
                        extra:
                          - name: 'CA_ROTOR${i}_KM'
                            label: 'Direction CCW'
                            function: 'spin-dir'
                            show_as: 'true-if-positive'
                          - name: 'CA_ROTOR${i}_TILT'
                            label: 'Tilted by'
                  - actuator_type: 'servo'
                    group_label: 'Tilt Servos'
                    count: 'CA_SV_TL_COUNT'
                    item_label_prefix: 'Tilt ${i}'
                    per_item_parameters:
                        extra:
                          - name: 'CA_SV_TL${i}_MINA'
                            label: "Angle at Min\nTilt"
                          - name: 'CA_SV_TL${i}_MAXA'
                            label: "Angle at Max\nTilt"
                          - name: 'CA_SV_TL${i}_TD'
                            label: 'Tilt Direction'
                          - name: 'CA_SV_TL${i}_CT'
                            label: 'Use for Control'
```

여기에 자신의 모델을 정의하여 파라미터를 정해주면 된다.

*[ROMFS/px4fmu_common/init.d/rc.mc_defaults](https://github.com/PX4/PX4-Autopilot/blob/main/ROMFS/px4fmu_common/init.d/rc.mc_defaults)*

```bash
#!/bin/sh
#
# Multicopter default parameters.
#
# NOTE: Script variables are declared/initialized/unset in the rcS script.
#

set VEHICLE_TYPE mc

# MAV_TYPE_QUADROTOR 2
param set-default MAV_TYPE 2

if param compare IMU_GYRO_RATEMAX 400
then
	param set-default IMU_GYRO_RATEMAX 800
fi

param set-default NAV_ACC_RAD 2

param set-default RTL_RETURN_ALT 30
param set-default RTL_DESCEND_ALT 10

param set-default GPS_UBX_DYNMODEL 6
```

*[ROMFS/px4fmu_common/init.d-posix/airframes/10015_gazebo-classic_iris](https://github.com/PX4/PX4-Autopilot/blob/main/ROMFS/px4fmu_common/init.d-posix/airframes/10015_gazebo-classic_iris)*

```bash
#!/bin/sh
#
# @name 3DR Iris Quadrotor SITL
#
# @type Quadrotor Wide
#
# @maintainer Julian Oes <julian@oes.ch>
#

. ${R}etc/init.d/rc.mc_defaults


param set-default CA_AIRFRAME 0

param set-default CA_ROTOR_COUNT 4
param set-default CA_ROTOR0_PX 0.1515
param set-default CA_ROTOR0_PY 0.245
param set-default CA_ROTOR0_KM 0.05
param set-default CA_ROTOR1_PX -0.1515
param set-default CA_ROTOR1_PY -0.1875
param set-default CA_ROTOR1_KM 0.05
param set-default CA_ROTOR2_PX 0.1515
param set-default CA_ROTOR2_PY -0.245
param set-default CA_ROTOR2_KM -0.05
param set-default CA_ROTOR3_PX -0.1515
param set-default CA_ROTOR3_PY 0.1875
param set-default CA_ROTOR3_KM -0.05

param set-default PWM_MAIN_FUNC1 101
param set-default PWM_MAIN_FUNC2 102
param set-default PWM_MAIN_FUNC3 103
param set-default PWM_MAIN_FUNC4 104
```

주요한 부분은 위치값인 **PX** **PY** 와 **KM** (moment coefficient) 이다. 그렇다면 나머지는 기본 값이 들어간다는 의미이고, **CA_ROTOR${i}\_CT** (thrust coefficient) 는 6.5 라는 의미이다.

```
CA_ROTOR${i}_CT:
	description:
		short: Thrust coefficient of rotor ${i}
		long: |
		  The thrust coefficient if defined as Thrust = CT * u^2,
		  where u (with value between actuator minimum and maximum)
		  is the output signal sent to the motor controller.
	type: float
	decimal: 1
	increment: 1
	num_instances: *max_num_mc_motors
	min: 0
	max: 100
	default: 6.5
```

### Mixing

이전 버전에서 사용하던 **mixer** 값이 그대로 옮겨왔을 것 같은데, 현재는 소스코드 경로가 바뀌어서 이전 버전 문서와 소스코드를 살펴보았다.

>[!example] PX4 공식 문서
> - https://docs.px4.io/v1.13/en/concept/mixing.html#multirotor_mixer
> - https://docs.px4.io/v1.13/en/dev_airframes/adding_a_new_frame.html#mixer-file

두 번째 링크에 output scaling 값이 지정되어 있어 multirotor (혹은 iris)에 기본으로 적용되고 있는 파일을 찾으면 PWM 에서 Thrust 변환에 지정된 값을 알 수 있어보인다.

>[!tip] PX4-Autopilot
> - https://github.com/PX4/PX4-Autopilot/blob/release/1.12/ROMFS/px4fmu_common/init.d/rc.mc_apps
> - https://github.com/PX4/PX4-Autopilot/blob/release/1.12/ROMFS/px4fmu_common/mixers/quad_w.main.mix
> - https://github.com/PX4/PX4-Autopilot/blob/release/1.10/src/lib/mixer/mixer_multirotor.cpp

v1.10 까지 사용되던 [mixer_multirotor.cpp](https://github.com/PX4/PX4-Autopilot/blob/release/1.10/src/lib/mixer/mixer_multirotor.cpp) 도 참고해도 괜찮아 보인다.

>[!quote] References
>- [PX4 Forum: Control multicopter via thrust F and moments M](https://discuss.px4.io/t/control-multicopter-via-thrust-f-and-moments-m/9145/7)
