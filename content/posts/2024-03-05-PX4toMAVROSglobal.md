---
layout: post
title: "PX4 Code Review: global_position"
date: 2024-03-05
categories: ROS
tags:
  - px4
  - ros
math: "true"
---

이번 코드리뷰에서는 mavros/global_position 의 토픽들이 어떻게 만들어지는지, `global` 과 `raw/fix` 토픽의 Hz 가 다른 이유와 EKF2_AID_MASK ( 혹은 EKF2_GPS_CTRL ) 파라미터의 영향에 따른 Yaw 계산 방식을 살펴보고 `compass_hdg` 토픽은 어떻게 계산되는지 알아보고자 한다.

## mavros/global_position

[mavros 위키](https://wiki.ros.org/mavros#mavros.2FPlugins.global_position) 에 있는 `~/raw/fix`, `~/global` 그리고 `~/compass_hdg` 토픽이 어떤 식으로 Publish 되는지 알아보자.

우선 mavros 에서 이를 publish 하는 코드는 [global_position.cpp](https://github.com/mavlink/mavros/blob/master/mavros/src/plugins/global_position.cpp) 에 있다.

```cpp
// 생략
	// gps data
	raw_fix_pub = gp_nh.advertise<sensor_msgs::NavSatFix>("raw/fix", 10);
	raw_vel_pub = gp_nh.advertise<geometry_msgs::TwistStamped>("raw/gps_vel", 10);
	raw_sat_pub = gp_nh.advertise<std_msgs::UInt32>("raw/satellites", 10);

	// fused global position
	gp_fix_pub = gp_nh.advertise<sensor_msgs::NavSatFix>("global", 10);
	gp_odom_pub = gp_nh.advertise<nav_msgs::Odometry>("local", 10);
	gp_rel_alt_pub = gp_nh.advertise<std_msgs::Float64>("rel_alt", 10);
	gp_hdg_pub = gp_nh.advertise<std_msgs::Float64>("compass_hdg", 10);
}

Subscriptions get_subscriptions() override
{
	return {
		make_handler(&GlobalPositionPlugin::handle_gps_raw_int),
		// GPS_STATUS: there no corresponding ROS message, and it is not supported by APM
		make_handler(&GlobalPositionPlugin::handle_global_position_int),
		make_handler(&GlobalPositionPlugin::handle_gps_global_origin),
		make_handler(&GlobalPositionPlugin::handle_lpned_system_global_offset)
	};
}
```

기본 Plugin 에 override 방식으로 코드 구조가 이루어져 있고, 각 정의된 토픽 Publisher 들은 아래 `get_subscriptions()`  의 `handle~` 함수들 안에 있다.

>[!info]- void handle_gps_raw_int()
> ```cpp
> void handle_gps_raw_int(const mavlink::mavlink_message_t *msg, mavlink::common::msg::GPS_RAW_INT &raw_gps)
> {
> 	auto fix = boost::make_shared<sensor_msgs::NavSatFix>();
> 
> 	fix->header = m_uas->synchronized_header(child_frame_id, raw_gps.time_usec);
> 
> 	fix->status.service = sensor_msgs::NavSatStatus::SERVICE_GPS;
> 	if (raw_gps.fix_type > 2)
> 		fix->status.status = sensor_msgs::NavSatStatus::STATUS_FIX;
> 	else {
> 		ROS_WARN_THROTTLE_NAMED(30, "global_position", "GP: No GPS fix");
> 		fix->status.status = sensor_msgs::NavSatStatus::STATUS_NO_FIX;
> 	}
> 
> 	fill_lla(raw_gps, fix);
> 
> 	float eph = (raw_gps.eph != UINT16_MAX) ? raw_gps.eph / 1E2F : NAN;
> 	float epv = (raw_gps.epv != UINT16_MAX) ? raw_gps.epv / 1E2F : NAN;
> 
> 	ftf::EigenMapCovariance3d gps_cov(fix->position_covariance.data());
> 
> 	// With mavlink v2.0 use accuracies reported by sensor
> 	if (msg->magic == MAVLINK_STX &&
> 			raw_gps.h_acc > 0 && raw_gps.v_acc > 0) {
> 		gps_cov.diagonal() << std::pow(raw_gps.h_acc / 1E3, 2), std::pow(raw_gps.h_acc / 1E3, 2), std::pow(raw_gps.v_acc / 1E3, 2);
> 		fix->position_covariance_type = sensor_msgs::NavSatFix::COVARIANCE_TYPE_DIAGONAL_KNOWN;
> 	}
> 	// With mavlink v1.0 approximate accuracies by DOP
> 	else if (!std::isnan(eph) && !std::isnan(epv)) {
> 		gps_cov.diagonal() << std::pow(eph * gps_uere, 2), std::pow(eph * gps_uere, 2), std::pow(epv * gps_uere, 2);
> 		fix->position_covariance_type = sensor_msgs::NavSatFix::COVARIANCE_TYPE_APPROXIMATED;
> 	}
> 	else {
> 		fill_unknown_cov(fix);
> 	}
> 
> 	// store & publish
> 	m_uas->update_gps_fix_epts(fix, eph, epv, raw_gps.fix_type, raw_gps.satellites_visible);
> 	raw_fix_pub.publish(fix);
> 
> 	if (raw_gps.vel != UINT16_MAX &&
> 				raw_gps.cog != UINT16_MAX) {
> 		double speed = raw_gps.vel / 1E2;				// m/s
> 		double course = angles::from_degrees(raw_gps.cog / 1E2);	// rad
> 
> 		auto vel = boost::make_shared<geometry_msgs::TwistStamped>();
> 
> 		vel->header.stamp = fix->header.stamp;
> 		vel->header.frame_id = frame_id;
> 
> 		// From nmea_navsat_driver
> 		vel->twist.linear.x = speed * std::sin(course);
> 		vel->twist.linear.y = speed * std::cos(course);
> 
> 		raw_vel_pub.publish(vel);
> 	}
> 
> 	// publish satellite count
> 	auto sat_cnt = boost::make_shared<std_msgs::UInt32>();
> 	sat_cnt->data = raw_gps.satellites_visible;
> 	raw_sat_pub.publish(sat_cnt);
> }
> 
> ```

>[!info]- void handle_global_position_int()
> ```cpp
> void handle_global_position_int(const mavlink::mavlink_message_t *msg, mavlink::common::msg::GLOBAL_POSITION_INT &gpos)
> {
> 	auto odom = boost::make_shared<nav_msgs::Odometry>();
> 	auto fix = boost::make_shared<sensor_msgs::NavSatFix>();
> 	auto relative_alt = boost::make_shared<std_msgs::Float64>();
> 	auto compass_heading = boost::make_shared<std_msgs::Float64>();
> 
> 	auto header = m_uas->synchronized_header(child_frame_id, gpos.time_boot_ms);
> 
> 	// Global position fix
> 	fix->header = header;
> 
> 	fill_lla(gpos, fix);
> 
> 	// fill GPS status fields using GPS_RAW data
> 	auto raw_fix = m_uas->get_gps_fix();
> 	if (raw_fix) {
> 		fix->status.service = raw_fix->status.service;
> 		fix->status.status = raw_fix->status.status;
> 		fix->position_covariance = raw_fix->position_covariance;
> 		fix->position_covariance_type = raw_fix->position_covariance_type;
> 	}
> 	else {
> 		// no GPS_RAW_INT -> fix status unknown
> 		fix->status.service = sensor_msgs::NavSatStatus::SERVICE_GPS;
> 		fix->status.status = sensor_msgs::NavSatStatus::STATUS_NO_FIX;
> 
> 		// we don't know covariance
> 		fill_unknown_cov(fix);
> 	}
> 
> 	relative_alt->data = gpos.relative_alt / 1E3;	// in meters
> 	compass_heading->data = (gpos.hdg != UINT16_MAX) ? gpos.hdg / 1E2 : NAN;	// in degrees
> 
> 	/**
> 	 * @brief Global position odometry:
> 	 *
> 	 * X: spherical coordinate X-axis (meters)
> 	 * Y: spherical coordinate Y-axis (meters)
> 	 * Z: spherical coordinate Z-axis (meters)
> 	 * VX: latitude vel (m/s)
> 	 * VY: longitude vel (m/s)
> 	 * VZ: altitude vel (m/s)
> 	 * Angular rates: unknown
> 	 * Pose covariance: computed, with fixed diagonal
> 	 * Velocity covariance: unknown
> 	 */
> 	odom->header.stamp = header.stamp;
> 	odom->header.frame_id = frame_id;
> 	odom->child_frame_id = child_frame_id;
> 
> 	// Linear velocity
> 	tf::vectorEigenToMsg(Eigen::Vector3d(gpos.vy, gpos.vx, gpos.vz) / 1E2,
> 				odom->twist.twist.linear);
> 
> 	// Velocity covariance unknown
> 	ftf::EigenMapCovariance6d vel_cov_out(odom->twist.covariance.data());
> 	vel_cov_out.fill(0.0);
> 	vel_cov_out(0) = -1.0;
> 
> 	// Current fix in ECEF
> 	Eigen::Vector3d map_point;
> 
> 	try {
> 		/**
> 		 * @brief Conversion from geodetic coordinates (LLA) to ECEF (Earth-Centered, Earth-Fixed)
> 		 *
> 		 * Note: "ecef_origin" is the origin of "map" frame, in ECEF, and the local coordinates are
> 		 * in spherical coordinates, with the orientation in ENU (just like what is applied
> 		 * on Gazebo)
> 		 */
> 		GeographicLib::Geocentric map(GeographicLib::Constants::WGS84_a(),
> 					GeographicLib::Constants::WGS84_f());
> 
> 		/**
> 		 * @brief Checks if the "map" origin is set.
> 		 * - If not, and the home position is also not received, it sets the current fix as the origin;
> 		 * - If the home position is received, it sets the "map" origin;
> 		 * - If the "map" origin is set, then it applies the rotations to the offset between the origin
> 		 * and the current local geocentric coordinates.
> 		 */
> 		// Current fix to ECEF
> 		map.Forward(fix->latitude, fix->longitude, fix->altitude,
> 					map_point.x(), map_point.y(), map_point.z());
> 
> 		// Set the current fix as the "map" origin if it's not set
> 		if (!is_map_init && fix->status.status >= sensor_msgs::NavSatStatus::STATUS_FIX) {
> 			map_origin.x() = fix->latitude;
> 			map_origin.y() = fix->longitude;
> 			map_origin.z() = fix->altitude;
> 
> 			ecef_origin = map_point; // Local position is zero
> 			is_map_init = true;
> 		}
> 	}
> 	catch (const std::exception& e) {
> 		ROS_INFO_STREAM("GP: Caught exception: " << e.what() << std::endl);
> 	}
> 
> 	// Compute the local coordinates in ECEF
> 	local_ecef = map_point - ecef_origin;
> 	// Compute the local coordinates in ENU
> 	tf::pointEigenToMsg(ftf::transform_frame_ecef_enu(local_ecef, map_origin), odom->pose.pose.position);
> 
> 	/**
> 	 * @brief By default, we are using the relative altitude instead of the geocentric
> 	 * altitude, which is relative to the WGS-84 ellipsoid
> 	 */
> 	if (use_relative_alt)
> 		odom->pose.pose.position.z = relative_alt->data;
> 
> 	odom->pose.pose.orientation = m_uas->get_attitude_orientation_enu();
> 
> 	// Use ENU covariance to build XYZRPY covariance
> 	ftf::EigenMapConstCovariance3d gps_cov(fix->position_covariance.data());
> 	ftf::EigenMapCovariance6d pos_cov_out(odom->pose.covariance.data());
> 	pos_cov_out.setZero();
> 	pos_cov_out.block<3, 3>(0, 0) = gps_cov;
> 	pos_cov_out.block<3, 3>(3, 3).diagonal() <<
> 						rot_cov,
> 							rot_cov,
> 								rot_cov;
> 
> 	// publish
> 	gp_fix_pub.publish(fix);
> 	gp_odom_pub.publish(odom);
> 	gp_rel_alt_pub.publish(relative_alt);
> 	gp_hdg_pub.publish(compass_heading);
> 
> 	// TF
> 	if (tf_send) {
> 		geometry_msgs::TransformStamped transform;
> 
> 		transform.header.stamp = odom->header.stamp;
> 		transform.header.frame_id = tf_frame_id;
> 		transform.child_frame_id = tf_child_frame_id;
> 
> 		// setRotation()
> 		transform.transform.rotation = odom->pose.pose.orientation;
> 
> 		// setOrigin()
> 		transform.transform.translation.x = odom->pose.pose.position.x;
> 		transform.transform.translation.y = odom->pose.pose.position.y;
> 		transform.transform.translation.z = odom->pose.pose.position.z;
> 
> 		m_uas->tf2_broadcaster.sendTransform(transform);
> 	}
> }
> ```

각 함수는 GPS_RAW_INT 와 GLOBAL_POSITION_INT 메세지(`mavlink::common::msg`)를 받아와 rosmsg 의 데이터를 구성한다. 이 메세지 타입들은 MAVLink 에 정의되어 있는 것으로 [Messages](https://mavlink.io/en/messages/common.html) 를 보면 잘 나타나 있고 코드로는 [mavlink/c_library_v2](https://github.com/mavlink/c_library_v2/tree/master/common) 를 참조하면 된다.

[[#^3f02cb|아래]]에서 다루지만 `global_position/global` 의 LLA 정보는 `raw/fix` 처럼 그대로 받아오는 것이 아니라 EKF2 를 통해 얻은 [VehicleGlobalPosition](https://docs.px4.io/main/en/msg_docs/VehicleGlobalPosition.html) 에서 받아와 `fill_lla(gpos, fix)` 로 구현되어 있다. [^1]

대신, status_service 나 covariance 부분은 `void handle_gps_raw_int()` 의 `m_uas->update_gps_fix_epts(fix, eph, epv, raw_gps.fix_type, raw_gps.satellites_visible);` 부분에서 `raw/fix` 데이터를 저장해두고  `void handle_global_position_int` 의 `auto raw_fix = m_uas->get_gps_fix();` 에서 이를 가져와 **global_position/global** 토픽의 내용을 채운다.

## MAVLink

### Topic Hz (~/global vs ~/raw/fix)

^3f02cb

위에서 언급한 LLA 정보를 받아오는 uORB 메세지의 차이로 인해 두 토픽의 Hz 는 다르게 나타난다.

raw 한 LLA 정보는 GPS Driver 로부터 직접 얻게되고 global 토픽은 EKF2 를 거쳐 다른 센서와 보정한 정보를 가진다고 하였는데 이를 자세히 살펴보자.

[PX4 module 중 mavlink/stream](https://github.com/PX4/PX4-Autopilot/tree/main/src/modules/mavlink/streams) 에서 GPS_RAW_INT.hpp 와 GLOBAL_POSITION_INT.hpp 을 보면 어떤 uORB 메세지를 받아서 패킷을 보내는지 알 수 있다.

```cpp title="GPS_RAW_INT.hpp"
bool send() override
{
	sensor_gps_s gps;

	if (_sensor_gps_sub.update(&gps)) {
		mavlink_gps_raw_int_t msg{};

		msg.time_usec = gps.timestamp;
		msg.fix_type = gps.fix_type;
		msg.lat = gps.lat;
		msg.lon = gps.lon;
		msg.alt = gps.alt;
		msg.eph = gps.hdop * 100; // GPS HDOP horizontal dilution of position (unitless)
		msg.epv = gps.vdop * 100; // GPS VDOP vertical dilution of position (unitless)

		if (PX4_ISFINITE(gps.vel_m_s) && (fabsf(gps.vel_m_s) >= 0.f)) {
			msg.vel = gps.vel_m_s * 100.f; // cm/s

		} else {
			msg.vel = UINT16_MAX; // If unknown, set to: UINT16_MAX
		}

		msg.cog = math::degrees(matrix::wrap_2pi(gps.cog_rad)) * 1e2f;
		msg.satellites_visible = gps.satellites_used;
		msg.alt_ellipsoid = gps.alt_ellipsoid;
		msg.h_acc = gps.eph * 1e3f;              // position uncertainty in mm
		msg.v_acc = gps.epv * 1e3f;              // altitude uncertainty in mm
		msg.vel_acc = gps.s_variance_m_s * 1e3f; // speed uncertainty in mm

		if (PX4_ISFINITE(gps.heading)) {
			if (fabsf(gps.heading) < FLT_EPSILON) {
				msg.yaw = 36000; // Use 36000 for north.

			} else {
				msg.yaw = math::degrees(matrix::wrap_2pi(gps.heading)) * 100.0f; // centidegrees
			}

			if (PX4_ISFINITE(gps.heading_accuracy)) {
				msg.hdg_acc = math::degrees(gps.heading_accuracy) * 1e5f; // Heading / track uncertainty in degE5
			}
		}

		mavlink_msg_gps_raw_int_send_struct(_mavlink->get_channel(), &msg);

		return true;
	}

	return false;
}
```

보다시피 GPS_RAW_INT 는 `sensor_gps_s` 를 subscribe 해서 메세지를 할당한다. 시뮬레이션을 제외하고 유일한 uORB::PublicationMulti<sensor_gps_s> 는 [src/driver](https://github.com/PX4/PX4-Autopilot/tree/main/src/drivers/gps) 에 위치한다. 각 GPS 제품에 따라 다르게 파싱해서 받아와 publish 한다.

```cpp title="GLOBAL_POSITION_INT.hpp"
uORB::Subscription _gpos_sub{ORB_ID(vehicle_global_position)};
uORB::Subscription _lpos_sub{ORB_ID(vehicle_local_position)};
uORB::Subscription _home_sub{ORB_ID(home_position)};
uORB::Subscription _air_data_sub{ORB_ID(vehicle_air_data)};

bool send() override
{
	vehicle_global_position_s gpos;
	vehicle_local_position_s lpos;

	if (_gpos_sub.update(&gpos) && _lpos_sub.update(&lpos)) {

		mavlink_global_position_int_t msg{};

		if (lpos.z_valid && lpos.z_global) {
			msg.alt = (-lpos.z + lpos.ref_alt) * 1000.0f;

		} else {
			// fall back to baro altitude
			vehicle_air_data_s air_data{};
			_air_data_sub.copy(&air_data);

			if (air_data.timestamp > 0) {
				msg.alt = air_data.baro_alt_meter * 1000.0f;
			}
		}

		home_position_s home{};
		_home_sub.copy(&home);

		if ((home.timestamp > 0) && home.valid_alt) {
			if (lpos.z_valid) {
				msg.relative_alt = -(lpos.z - home.z) * 1000.0f;

			} else {
				msg.relative_alt = msg.alt - (home.alt * 1000.0f);
			}

		} else {
			if (lpos.z_valid) {
				msg.relative_alt = -lpos.z * 1000.0f;
			}
		}

		msg.time_boot_ms = gpos.timestamp / 1000;
		msg.lat = gpos.lat * 1e7;
		msg.lon = gpos.lon * 1e7;

		msg.vx = lpos.vx * 100.0f;
		msg.vy = lpos.vy * 100.0f;
		msg.vz = lpos.vz * 100.0f;

		msg.hdg = math::degrees(matrix::wrap_2pi(lpos.heading)) * 100.0f;

		mavlink_msg_global_position_int_send_struct(_mavlink->get_channel(), &msg);

		return true;
	}

	return false;
}
```

GLOBAL_POSITION_INT 은 `VehicleGlobalPosition` 의 위도 경도와 `VehicleLocalPosition` 의 높이, heading 정보로 메세지를 담아 보낸다. 이 둘은 각각 EKF2 를 거쳐 fusion 한 정보에 해당한다.

그래서 `raw/fix` 토픽은 GPS 에서 낼 수 있는 Max Hz 로 publish 된다. 이와 관련한 이슈[^2] 가 있어서 driver 코드를 확인해보니 아래와 같이 기존에 설정해놓은 baudrate 를 사용하거나 사용가능한 최대 baudrate 를 사용하도록 되어 있었다.

추가적으로 [소스코드](https://github.com/PX4/PX4-GPSDrivers/blob/main/src/nmea.cpp) 에서 `configure()` 와 `recieve()` 함수를 보면 된다. 사용하는 GPS 가 NMEA 형식을 사용하여 nmea.cpp 로 살펴보았다.

```cpp title="https://github.com/PX4/PX4-GPSDrivers/blob/main/src/nmea.cpp#L1065"
int GPSDriverNMEA::configure(unsigned &baudrate, const GPSConfig &config)
{
	_output_mode = config.output_mode;

	if (_output_mode != OutputMode::GPS) {
		NMEA_WARN("RTCM output have to be configured manually");
	}

	// If a baudrate is defined, we test this first
	if (baudrate > 0) {
		setBaudrate(baudrate);
		decodeInit();
		int ret = receive(400);
		gps_usleep(2000);

		// If a valid POS message is received we have GPS
		if (_POS_received || ret > 0) {
			return 0;
		}
	}

	// If we haven't found the GPS with the defined baudrate, we try other rates
	const unsigned baudrates_to_try[] = {9600, 19200, 38400, 57600, 115200, 230400};
	unsigned test_baudrate;

	for (unsigned int baud_i = 0; !_POS_received
	     && baud_i < sizeof(baudrates_to_try) / sizeof(baudrates_to_try[0]); baud_i++) {

		test_baudrate = baudrates_to_try[baud_i];
		setBaudrate(test_baudrate);

		NMEA_DEBUG("baudrate set to %i", test_baudrate);

		decodeInit();
		int ret = receive(400);
		gps_usleep(2000);

		// If a valid POS message is received we have GPS
		if (_POS_received || ret > 0) {
			return 0;
		}
	}

	// If nothing is found we leave the specified or default
	if (baudrate > 0) {
		return setBaudrate(baudrate);
	}

	return setBaudrate(NMEA_DEFAULT_BAUDRATE);
}
```

Unicore UM982 의 경우 기본적으로 230400 baudrate 를 사용하여 5Hz 의 주기로 정보를 수신하는 것으로 보인다. [링크](https://holybro.com/products/h-rtk-unicore-um982)

이제 `global` 토픽의 Hz 에 대해 알아보자. Inspector 로 확인해본 결과에 따르면 GLOBAL_POSITION_INT 메세지는 50Hz 의 주기로 송수신된다고 한다.[^3]

하지만 이는 EKF2_\*\_DELAY 와 filtering 관련 파라미터에 의해 바뀌는 것으로 보인다.

>[!quote] Reference
>- Delay Compensation: https://docs.px4.io/main/en/advanced_config/tuning_the_ecl_ekf.html#what-is-the-ecl-ekf
>- MC Filter Tuning: https://docs.px4.io/main/en/config_mc/filter_tuning.html#filters

위 GLOBAL_POSITION_INT 일부 코드에서 위도 경도 정보는 VehicleGlobalPosition 에서 받아온다고 하였는데 이를 Publish 하는 부분은 [modules/ekf2](https://github.com/PX4/PX4-Autopilot/tree/main/src/modules/ekf2) 중 EKF2.cpp 에 위치한다.

```cpp title="EKF2.cpp"
void EKF2::PublishGlobalPosition(const hrt_abstime &timestamp)
{
	if (_ekf.global_position_is_valid()) {
		const Vector3f position{_ekf.getPosition()};

		// generate and publish global position data
		vehicle_global_position_s global_pos;
		global_pos.timestamp_sample = timestamp;

		// Position of local NED origin in GPS / WGS84 frame
		_ekf.global_origin().reproject(position(0), position(1), global_pos.lat, global_pos.lon);

		float delta_xy[2];
		_ekf.get_posNE_reset(delta_xy, &global_pos.lat_lon_reset_counter);

		global_pos.alt = -position(2) + _ekf.getEkfGlobalOriginAltitude(); // Altitude AMSL in meters
		global_pos.alt_ellipsoid = filter_altitude_ellipsoid(global_pos.alt);

		// global altitude has opposite sign of local down position
		float delta_z;
		uint8_t z_reset_counter;
		_ekf.get_posD_reset(&delta_z, &z_reset_counter);
		global_pos.delta_alt = -delta_z;

		_ekf.get_ekf_gpos_accuracy(&global_pos.eph, &global_pos.epv);

		if (_ekf.isTerrainEstimateValid()) {
			// Terrain altitude in m, WGS84
			global_pos.terrain_alt = _ekf.getEkfGlobalOriginAltitude() - _ekf.getTerrainVertPos();
			global_pos.terrain_alt_valid = true;

		} else {
			global_pos.terrain_alt = NAN;
			global_pos.terrain_alt_valid = false;
		}

		global_pos.dead_reckoning = _ekf.control_status_flags().inertial_dead_reckoning
					    || _ekf.control_status_flags().wind_dead_reckoning;
		global_pos.timestamp = _replay_mode ? timestamp : hrt_absolute_time();
		_global_position_pub.publish(global_pos);
	}
}
```

보다시피 `_ekf.getPosition()` 으로 받아온 xy 값을 다시 reprojection 하여 `lat`, `lon` 정보를 얻어낸다.

```cpp
// get the position of the body frame origin in local earth frame
Vector3f getPosition() const
{
	// rotate the position of the IMU relative to the boy origin into earth frame
	const Vector3f pos_offset_earth = _R_to_earth_now * _params.imu_pos_body;
	// subtract from the EKF position (which is at the IMU) to get position at the body origin
	return _output_new.pos - pos_offset_earth;
}
```

디테일한 파트는 생략하겠지만, 비교적 낮은 Hz 로 얻는 GPS raw data 로 기준 위도, 경도를 만들고 여러 센서로 fusion 하여 보다 정확한 위치 추정을 하고 있다.

문제는 이 `PublishGlobalPosition` 함수가 호출되는 `EKF2::Run()` 함수가 어디서 어떤 주기로 발생하는지 확인하기 어려웠다.

다만 `_output_new` 가 서로 다른 time horiozn 의 센서 정보를 fusion 하는 [ekf2/EKF/ekf.cpp](https://github.com/PX4/PX4-Autopilot/blob/v1.13.3/src/modules/ekf2/EKF/ekf.cpp#L312) 에서 update 된다는 것만 알 수 있었다. (v1.14 부터는 코드구조가 바뀌어 output_predictor.cpp 에 있다.)

```cpp
// use trapezoidal integration to calculate the INS position states
// do the same for vertical state used by alternative correction algorithm
const Vector3f delta_pos_NED = (_output_new.vel + vel_last) * (imu.delta_vel_dt * 0.5f);
_output_new.pos += delta_pos_NED;
```

### mavros plugin

다시 처음 **global_position.cpp** 로 돌아가보면 `make_handler` 에서 각 `handler~` 함수를 넣어주었다. 이 `make_handler` 는 `mavros_plugin.h` 에 정의되어 있다. [소스코드](https://github.com/mavlink/mavros/blob/master/mavros/include/mavros/mavros_plugin.h)

대부분의 PX4 에서 mavros 로 만들어내는 토픽들은 이러한 형태를 가지고 있다.

```cpp title="mavros_plugin.h"
//! generic message handler callback
using HandlerCb = mavconn::MAVConnInterface::ReceivedCb;
//! Tuple: MSG ID, MSG NAME, message type into hash_code, message handler callback
using HandlerInfo = std::tuple<mavlink::msgid_t, const char*, size_t, HandlerCb>;

// ...생략

/**
 * Make subscription to message with automatic decoding.
 *
 * @param[in] fn  pointer to member function (handler)
 */
template<class _C, class _T>
HandlerInfo make_handler(void (_C::*fn)(const mavlink::mavlink_message_t*, _T &)) {
	auto bfn = std::bind(fn, static_cast<_C*>(this), std::placeholders::_1, std::placeholders::_2);
	const auto id = _T::MSG_ID;
	const auto name = _T::NAME;
	const auto type_hash_ = typeid(_T).hash_code();

	return HandlerInfo{
			   id, name, type_hash_,
			   [bfn](const mavlink::mavlink_message_t *msg, const mavconn::Framing framing) {
				   if (framing != mavconn::Framing::ok)
					   return;

				   mavlink::MsgMap map(msg);
				   _T obj;
				   obj.deserialize(map);

				   bfn(msg, obj);
			   }
	};
}
```

즉 mavlink 의 메세지를 deserialize 해서 정보를 받아오는 것으로 보이고 이 함수는 mavlink 빌드 시 생겨나는 함수에 정의되어 있다. GPS_RAW_INT 메세지를 예시로 들면 아래와 같고, 아마도 위에 `mavlink_msg_gps_raw_int_send_struct` 에서 정보를 담아 보낸 것을 handler 에서 호출될 때 꺼내서 사용하는 방식인 것 같은데, 정확한 문법을 파악하지는 못하였다. 대략적으로 uORB -> mavlink packet -> mavros 이런 구조가 아닐까...

>[!info]- mavlink_msg_gps_raw_int.hpp
>// MESSAGE GPS_RAW_INT support class
> 
> #pragma once
> 
> namespace mavlink {
> namespace common {
> namespace msg {
> 
> /**
>  * @brief GPS_RAW_INT message
>  *
>  * The global position, as returned by the Global Positioning System (GPS). This is
>                 NOT the global position estimate of the system, but rather a RAW sensor value. See message GLOBAL_POSITION_INT for the global position estimate.
>  */
> struct GPS_RAW_INT : mavlink::Message {
>     static constexpr msgid_t MSG_ID = 24;
>     static constexpr size_t LENGTH = 52;
>     static constexpr size_t MIN_LENGTH = 30;
>     static constexpr uint8_t CRC_EXTRA = 24;
>     static constexpr auto NAME = "GPS_RAW_INT";
> 
> 
>     uint64_t time_usec; /*< [us] Timestamp (UNIX Epoch time or time since system boot). The receiving end can infer timestamp format (since 1.1.1970 or since system boot) by checking for the magnitude of the number. */
>     uint8_t fix_type; /*<  GPS fix type. */
>     int32_t lat; /*< [degE7] Latitude (WGS84, EGM96 ellipsoid) */
>     int32_t lon; /*< [degE7] Longitude (WGS84, EGM96 ellipsoid) */
>     int32_t alt; /*< [mm] Altitude (MSL). Positive for up. Note that virtually all GPS modules provide the MSL altitude in addition to the WGS84 altitude. */
>     uint16_t eph; /*<  GPS HDOP horizontal dilution of position (unitless * 100). If unknown, set to: UINT16_MAX */
>     uint16_t epv; /*<  GPS VDOP vertical dilution of position (unitless * 100). If unknown, set to: UINT16_MAX */
>     uint16_t vel; /*< [cm/s] GPS ground speed. If unknown, set to: UINT16_MAX */
>     uint16_t cog; /*< [cdeg] Course over ground (NOT heading, but direction of movement) in degrees * 100, 0.0..359.99 degrees. If unknown, set to: UINT16_MAX */
>     uint8_t satellites_visible; /*<  Number of satellites visible. If unknown, set to UINT8_MAX */
>     int32_t alt_ellipsoid; /*< [mm] Altitude (above WGS84, EGM96 ellipsoid). Positive for up. */
>     uint32_t h_acc; /*< [mm] Position uncertainty. */
>     uint32_t v_acc; /*< [mm] Altitude uncertainty. */
>     uint32_t vel_acc; /*< [mm] Speed uncertainty. */
>     uint32_t hdg_acc; /*< [degE5] Heading / track uncertainty */
>     uint16_t yaw; /*< [cdeg] Yaw in earth frame from north. Use 0 if this GPS does not provide yaw. Use UINT16_MAX if this GPS is configured to provide yaw and is currently unable to provide it. Use 36000 for north. */
> 
> 
>     inline std::string get_name(void) const override
>     {
>             return NAME;
>     }
> 
>     inline Info get_message_info(void) const override
>     {
>             return { MSG_ID, LENGTH, MIN_LENGTH, CRC_EXTRA };
>     }
> 
>     inline std::string to_yaml(void) const override
>     {
>         std::stringstream ss;
> 
>         ss << NAME << ":" << std::endl;
>         ss << "  time_usec: " << time_usec << std::endl;
>         ss << "  fix_type: " << +fix_type << std::endl;
>         ss << "  lat: " << lat << std::endl;
>         ss << "  lon: " << lon << std::endl;
>         ss << "  alt: " << alt << std::endl;
>         ss << "  eph: " << eph << std::endl;
>         ss << "  epv: " << epv << std::endl;
>         ss << "  vel: " << vel << std::endl;
>         ss << "  cog: " << cog << std::endl;
>         ss << "  satellites_visible: " << +satellites_visible << std::endl;
>         ss << "  alt_ellipsoid: " << alt_ellipsoid << std::endl;
>         ss << "  h_acc: " << h_acc << std::endl;
>         ss << "  v_acc: " << v_acc << std::endl;
>         ss << "  vel_acc: " << vel_acc << std::endl;
>         ss << "  hdg_acc: " << hdg_acc << std::endl;
>         ss << "  yaw: " << yaw << std::endl;
> 
>         return ss.str();
>     }
> 
>     inline void serialize(mavlink::MsgMap &map) const override
>     {
>         map.reset(MSG_ID, LENGTH);
> 
>         map << time_usec;                     // offset: 0
>         map << lat;                           // offset: 8
>         map << lon;                           // offset: 12
>         map << alt;                           // offset: 16
>         map << eph;                           // offset: 20
>         map << epv;                           // offset: 22
>         map << vel;                           // offset: 24
>         map << cog;                           // offset: 26
>         map << fix_type;                      // offset: 28
>         map << satellites_visible;            // offset: 29
>         map << alt_ellipsoid;                 // offset: 30
>         map << h_acc;                         // offset: 34
>         map << v_acc;                         // offset: 38
>         map << vel_acc;                       // offset: 42
>         map << hdg_acc;                       // offset: 46
>         map << yaw;                           // offset: 50
>     }
> 
>     inline void deserialize(mavlink::MsgMap &map) override
>     {
>         map >> time_usec;                     // offset: 0
>         map >> lat;                           // offset: 8
>         map >> lon;                           // offset: 12
>         map >> alt;                           // offset: 16
>         map >> eph;                           // offset: 20
>         map >> epv;                           // offset: 22
>         map >> vel;                           // offset: 24
>         map >> cog;                           // offset: 26
>         map >> fix_type;                      // offset: 28
>         map >> satellites_visible;            // offset: 29
>         map >> alt_ellipsoid;                 // offset: 30
>         map >> h_acc;                         // offset: 34
>         map >> v_acc;                         // offset: 38
>         map >> vel_acc;                       // offset: 42
>         map >> hdg_acc;                       // offset: 46
>         map >> yaw;                           // offset: 50
>     }
> };
> 
> } // namespace msg
> } // namespace common
> } // namespace mavlink
> ```

## EKF2 Heading

마지막으로 Heading 계산 방법과 `compass_hdg` 토픽이 어떤 정보를 담고 있는지 알아보고자 한다.

PX4 공식문서에 따르면 main 과 v1.13 버전에서 사용하는 파라미터가 상이하다. [main](https://docs.px4.io/main/en/gps_compass/#configuring-gps-as-yaw-heading-source), [v1.13](https://docs.px4.io/v1.13/en/gps_compass/#configuring-gps-as-yaw-heading-source)

깃헙 PR 을 살펴보아도 v1.14.0-beta2 부터 적용되었고, GPS Heading 을 지원하는 Unicore UM982 driver 도 이때 추가되었다.[^4]

| NAME                               | DESCRIPTION                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| **EKF2_AID_MASK** (INT32) (v1.13)  | Integer bitmask controlling data fusion and aiding methods<br><br>**Comment:** Set bits in the following positions to enable: 0 : Set to true to use GPS data if available 1 : Set to true to use optical flow data if available 2 : Set to true to inhibit IMU delta velocity bias estimation 3 : Set to true to enable vision position fusion 4 : Set to true to enable vision yaw fusion. Cannot be used if bit position 7 is true. 5 : Set to true to enable multi-rotor drag specific force fusion 6 : set to true if the EV observations are in a non NED reference frame and need to be rotated before being used 7 : Set to true to enable GPS yaw fusion. Cannot be used if bit position 4 is true.<br><br>**Bitmask:**<br><br>- **0:** use GPS<br>- **1:** use optical flow<br>- **2:** inhibit IMU bias estimation<br>- **3:** vision position fusion<br>- **4:** vision yaw fusion<br>- **5:** multi-rotor drag fusion<br>- **6:** rotate external vision<br>- **7:** GPS yaw fusion<br><br>**Reboot required:** true |     |
| **EKF2_GPS_CTRL** (INT32) (v1.14+) | GNSS sensor aiding<br><br>**Comment:** Set bits in the following positions to enable: 0 : Longitude and latitude fusion 1 : Altitude fusion 2 : 3D velocity fusion 3 : Dual antenna heading fusion<br><br>**Bitmask:**<br><br>- **0:** Lon/lat<br>- **1:** Altitude<br>- **2:** 3D velocity<br>- **3:** Dual antenna heading                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |     |

`global_position.cpp` 에서 `compass_hdg` 토픽 정보를 받는 부분을 알기 위해 GLOBAL_POSITION_INT.hpp 코드를 다시 살펴보면  `msg.hdg = math::degrees(matrix::wrap_2pi(lpos.heading)) * 100.0f;` 라인에서  heading 정보를 넣어주므로, 이는 VehicleLocalPosition 에서 온 정보임을 알 수 있다.

VehicleLocalPosition 을 Publish 하는 부분은 EKF2.cpp 에 `EKF2::PublishLocalPosition()` 에 구현되어 있다.

### v1.13

아래에 `PublishLocalPosition()` 부터 heading 이 어떤 흐름으로 정보를 받아오는지 간략히 정리하였다.(v1.13 기준)

```cpp
// EKF2.cpp PublishLocalPosition()
lpos.heading = Eulerf(_ekf.getQuaternion()).psi();

// estimator_interface.h
const matrix::Quatf &getQuaternion() const { return _output_new.quat_nominal; }


// EKF::calculateOutputStates
	const Quatf dq(AxisAnglef{delta_angle});
	
	// rotate the previous INS quaternion by the delta quaternions
	_output_new.quat_nominal = _output_new.quat_nominal * dq;
	
	// the quaternions must always be normalised after modification
	_output_new.quat_nominal.normalize();
	
	// calculate the rotation matrix from body to earth frame
	_R_to_earth_now = Dcmf(_output_new.quat_nominal);
```

문제는 위의 **EKF2_AID_MASK** 에 따라서 어떻게 yaw 를 선택해서 `_output_new` 혹은 `delta_angle` 등의 변수들이 계산되는지는 연결짓지 못했다. v1.14 이후에는 `CONFIG_EKF2_GNSS_YAW` 조건문으로 따로 나뉘어져 있어 보기 조금 쉽고, v1.13 에서는 `_ekf2_aid_mask` 혹은 `MASK_USE_GPSYAW` 로 살펴보면 된다.

```cpp
// Bit locations for fusion_mode
#define MASK_USE_GPS    (1<<0)		///< set to true to use GPS data
#define MASK_USE_OF     (1<<1)		///< set to true to use optical flow data
#define MASK_INHIBIT_ACC_BIAS (1<<2)	///< set to true to inhibit estimation of accelerometer delta velocity bias
#define MASK_USE_EVPOS	(1<<3)		///< set to true to use external vision position data
#define MASK_USE_EVYAW  (1<<4)		///< set to true to use external vision quaternion data for yaw
#define MASK_USE_DRAG  (1<<5)		///< set to true to use the multi-rotor drag model to estimate wind
#define MASK_ROTATE_EV  (1<<6)		///< set to true to if the EV observations are in a non NED reference frame and need to be rotated before being used
#define MASK_USE_GPSYAW  (1<<7)		///< set to true to use GPS yaw data if available
#define MASK_USE_EVVEL  (1<<8)		///< set to true to use external vision velocity data
```

```cpp title="EKF::controlGpsFusion()"
void Ekf::controlGpsFusion()
{
	if (!(_params.fusion_mode & MASK_USE_GPS)) {
		stopGpsFusion();
		return;
	}
```

v1.13 에서는 `MASK_USE_GPS` 가 true 이면 fusion 을 수행하는 것으로 보이고, `Ekf::update()` 의 `controlFusionModes()` 에서 각 센서들의 정보를 처리해 이를 fusion 할 지 판단하고 사용한다.

```cpp title="EKF::update()"
bool Ekf::update()
{
	bool updated = false;

	if (!_filter_initialised) {
		_filter_initialised = initialiseFilter();

		if (!_filter_initialised) {
			return false;
		}
	}

	// Only run the filter if IMU data in the buffer has been updated
	if (_imu_updated) {
		// perform state and covariance prediction for the main filter
		predictState();
		predictCovariance();

		// control fusion of observation data
		controlFusionModes();

		// run a separate filter for terrain estimation
		runTerrainEstimator();

		updated = true;
	}

	// the output observer always runs
	// Use full rate IMU data at the current time horizon
	calculateOutputStates(_newest_high_rate_imu_sample);

	return updated;
}
```

보다 자세한 내용은 [control.cpp](https://github.com/PX4/PX4-Autopilot/blob/v1.13.3/src/modules/ekf2/EKF/control.cpp), [gps_control.cpp](https://github.com/PX4/PX4-Autopilot/blob/v1.13.3/src/modules/ekf2/EKF/gps_control.cpp) 과 [gps_yaw_fusion.cpp](https://github.com/PX4/PX4-Autopilot/blob/v1.13.3/src/modules/ekf2/EKF/gps_yaw_fusion.cpp) 을 살펴보면 된다.

>[!question]
>- `fuseGpsYaw()` 에서 계산한 결과가 어떻게 `calculateOutputStates()` 에서 사용되는지?

### v1.14+

```cpp
// EKF2.cpp
#if defined(CONFIG_EKF2_GNSS_YAW)

	if (_param_ekf2_gps_ctrl.get() & static_cast<int32_t>(GnssCtrl::YAW)) {
		_estimator_aid_src_gnss_yaw_pub.advertise();
	}

#endif // CONFIG_EKF2_GNSS_YAW

// ekf.h
#if defined(CONFIG_EKF2_GNSS_YAW)
		if (_control_status.flags.gps_yaw) {
			heading_innov = _aid_src_gnss_yaw.innovation;
			return;
		}
#endif // CONFIG_EKF2_GNSS_YAW

// gps_control.cpp
#if defined(CONFIG_EKF2_GNSS_YAW)
		controlGpsYawFusion(gps_sample, gps_checks_passing, gps_checks_failing);
#endif // CONFIG_EKF2_GNSS_YAW
```

v1.14 이후부터는 **EKF2_GNSS_CTRL** 파라미터를 사용하며 내부 코드에서는 `CONFIG_EKF2_GNSS_YAW` 에 따라 제어되는 것을 알 수 있다. 또 다른 점 중 한가지는 `EstimatorAidSource1d.msg` 가 uORB 메시지 타입으로 추가되어서 fusion 한 정보를 사용하고 있었다.

>[!tip]- fuseGpsYaw 버전별 비교
> 
> ```cpp title="v1.14+"
> void Ekf::fuseGpsYaw()
> {
> 	auto &gnss_yaw = _aid_src_gnss_yaw;
> 
> 	if (gnss_yaw.innovation_rejected) {
> 		_innov_check_fail_status.flags.reject_yaw = true;
> 		return;
> 	}
> 
> 	Vector24f H;
> 
> 	{
> 	float heading_pred;
> 	float heading_innov_var;
> 
> 	// Note: we recompute innov and innov_var because it doesn't cost much more than just computing H
> 	// making a separate function just for H uses more flash space without reducing CPU load significantly
> 	sym::ComputeGnssYawPredInnovVarAndH(getStateAtFusionHorizonAsVector(), P, _gps_yaw_offset, gnss_yaw.observation_variance, FLT_EPSILON, &heading_pred, &heading_innov_var, &H);
> 	}
> 
> 	const SparseVector24f<0,1,2,3> Hfusion(H);
> 
> 	// check if the innovation variance calculation is badly conditioned
> 	if (gnss_yaw.innovation_variance < gnss_yaw.observation_variance) {
> 		// the innovation variance contribution from the state covariances is negative which means the covariance matrix is badly conditioned
> 		_fault_status.flags.bad_hdg = true;
> 
> 		// we reinitialise the covariance matrix and abort this fusion step
> 		initialiseCovariance();
> 		ECL_ERR("GPS yaw numerical error - covariance reset");
> 		return;
> 	}
> 
> 	_fault_status.flags.bad_hdg = false;
> 	_innov_check_fail_status.flags.reject_yaw = false;
> 
> 	_gnss_yaw_signed_test_ratio_lpf.update(matrix::sign(gnss_yaw.innovation) * gnss_yaw.test_ratio);
> 
> 	if ((fabsf(_gnss_yaw_signed_test_ratio_lpf.getState()) > 0.2f)
> 		&& !_control_status.flags.in_air && isTimedOut(gnss_yaw.time_last_fuse, (uint64_t)1e6)) {
> 
> 		// A constant large signed test ratio is a sign of wrong gyro bias
> 		// Reset the yaw gyro variance to converge faster and avoid
> 		// being stuck on a previous bad estimate
> 		resetZDeltaAngBiasCov();
> 	}
> 
> 	// calculate the Kalman gains
> 	// only calculate gains for states we are using
> 	Vector24f Kfusion = P * Hfusion / gnss_yaw.innovation_variance;
> 
> 	const bool is_fused = measurementUpdate(Kfusion, gnss_yaw.innovation_variance, gnss_yaw.innovation);
> 	_fault_status.flags.bad_hdg = !is_fused;
> 	gnss_yaw.fused = is_fused;
> 
> 	if (is_fused) {
> 		_time_last_heading_fuse = _time_delayed_us;
> 		gnss_yaw.time_last_fuse = _time_delayed_us;
> 	}
> }
> ```
> 
> 그리고
> 
> ```cpp title="v1.13"
> void Ekf::fuseGpsYaw()
> {
> 	// assign intermediate state variables
> 	const float &q0 = _state.quat_nominal(0);
> 	const float &q1 = _state.quat_nominal(1);
> 	const float &q2 = _state.quat_nominal(2);
> 	const float &q3 = _state.quat_nominal(3);
> 
> 	// calculate the observed yaw angle of antenna array, converting a from body to antenna yaw measurement
> 	const float measured_hdg = wrap_pi(_gps_sample_delayed.yaw + _gps_yaw_offset);
> 
> 	// define the predicted antenna array vector and rotate into earth frame
> 	const Vector3f ant_vec_bf = {cosf(_gps_yaw_offset), sinf(_gps_yaw_offset), 0.0f};
> 	const Vector3f ant_vec_ef = _R_to_earth * ant_vec_bf;
> 
> 	// check if antenna array vector is within 30 degrees of vertical and therefore unable to provide a reliable heading
> 	if (fabsf(ant_vec_ef(2)) > cosf(math::radians(30.0f)))  {
> 		return;
> 	}
> 
> 	// calculate predicted antenna yaw angle
> 	const float predicted_hdg = atan2f(ant_vec_ef(1), ant_vec_ef(0));
> 
> 	// using magnetic heading process noise
> 	// TODO extend interface to use yaw uncertainty provided by GPS if available
> 	const float R_YAW = sq(fmaxf(_params.gps_heading_noise, 1.0e-2f));
> 
> 	// calculate intermediate variables
> 	const float HK0 = sinf(_gps_yaw_offset);
> 	const float HK1 = q0*q3;
> 	const float HK2 = q1*q2;
> 	const float HK3 = 2*HK0*(HK1 - HK2);
> 	const float HK4 = cosf(_gps_yaw_offset);
> 	const float HK5 = ecl::powf(q1, 2);
> 	const float HK6 = ecl::powf(q2, 2);
> 	const float HK7 = ecl::powf(q0, 2) - ecl::powf(q3, 2);
> 	const float HK8 = HK4*(HK5 - HK6 + HK7);
> 	const float HK9 = HK3 - HK8;
> 
> 	if (fabsf(HK9) < 1e-3f) {
> 		return;
> 	}
> 	const float HK10 = 1.0F/HK9;
> 	const float HK11 = HK4*q0;
> 	const float HK12 = HK0*q3;
> 	const float HK13 = HK0*(-HK5 + HK6 + HK7) + 2*HK4*(HK1 + HK2);
> 	const float HK14 = HK10*HK13;
> 	const float HK15 = HK0*q0 + HK4*q3;
> 	const float HK16 = HK10*(HK14*(HK11 - HK12) + HK15);
> 	const float HK17 = ecl::powf(HK13, 2)/ecl::powf(HK9, 2) + 1;
> 	if (fabsf(HK17) < 1e-3f) {
> 		return;
> 	}
> 	const float HK18 = 2/HK17;
> 	// const float HK19 = 1.0F/(-HK3 + HK8);
> 	const float HK19_inverse = -HK3 + HK8;
> 
> 	if (fabsf(HK19_inverse) < 1e-6f) {
> 		return;
> 	}
> 	const float HK19 = 1.0F/HK19_inverse;
> 	const float HK20 = HK4*q1;
> 	const float HK21 = HK0*q2;
> 	const float HK22 = HK13*HK19;
> 	const float HK23 = HK0*q1 - HK4*q2;
> 	const float HK24 = HK19*(HK22*(HK20 + HK21) + HK23);
> 	const float HK25 = HK19*(-HK20 - HK21 + HK22*HK23);
> 	const float HK26 = HK10*(-HK11 + HK12 + HK14*HK15);
> 	const float HK27 = -HK16*P(0,0) - HK24*P(0,1) - HK25*P(0,2) + HK26*P(0,3);
> 	const float HK28 = -HK16*P(0,1) - HK24*P(1,1) - HK25*P(1,2) + HK26*P(1,3);
> 	const float HK29 = 4/ecl::powf(HK17, 2);
> 	const float HK30 = -HK16*P(0,2) - HK24*P(1,2) - HK25*P(2,2) + HK26*P(2,3);
> 	const float HK31 = -HK16*P(0,3) - HK24*P(1,3) - HK25*P(2,3) + HK26*P(3,3);
> 	// const float HK32 = HK18/(-HK16*HK27*HK29 - HK24*HK28*HK29 - HK25*HK29*HK30 + HK26*HK29*HK31 + R_YAW);
> 
> 	// check if the innovation variance calculation is badly conditioned
> 	_heading_innov_var = (-HK16*HK27*HK29 - HK24*HK28*HK29 - HK25*HK29*HK30 + HK26*HK29*HK31 + R_YAW);
> 
> 	if (_heading_innov_var < R_YAW) {
> 		// the innovation variance contribution from the state covariances is negative which means the covariance matrix is badly conditioned
> 		_fault_status.flags.bad_hdg = true;
> 
> 		// we reinitialise the covariance matrix and abort this fusion step
> 		initialiseCovariance();
> 		ECL_ERR("GPS yaw numerical error - covariance reset");
> 		return;
> 	}
> 
> 	_fault_status.flags.bad_hdg = false;
> 	const float HK32 = HK18 / _heading_innov_var;
> 
> 	// calculate the innovation and define the innovation gate
> 	const float innov_gate = math::max(_params.heading_innov_gate, 1.0f);
> 	_heading_innov = predicted_hdg - measured_hdg;
> 
> 	// wrap the innovation to the interval between +-pi
> 	_heading_innov = wrap_pi(_heading_innov);
> 
> 	// innovation test ratio
> 	_yaw_test_ratio = sq(_heading_innov) / (sq(innov_gate) * _heading_innov_var);
> 
> 	// we are no longer using 3-axis fusion so set the reported test levels to zero
> 	_mag_test_ratio.setZero();
> 
> 	if (_yaw_test_ratio > 1.0f) {
> 		_innov_check_fail_status.flags.reject_yaw = true;
> 		return;
> 
> 	} else {
> 		_innov_check_fail_status.flags.reject_yaw = false;
> 	}
> 
> 	_yaw_signed_test_ratio_lpf.update(matrix::sign(_heading_innov) * _yaw_test_ratio);
> 
> 	if (!_control_status.flags.in_air
> 	    && fabsf(_yaw_signed_test_ratio_lpf.getState()) > 0.2f) {
> 
> 		// A constant large signed test ratio is a sign of wrong gyro bias
> 		// Reset the yaw gyro variance to converge faster and avoid
> 		// being stuck on a previous bad estimate
> 		resetZDeltaAngBiasCov();
> 	}
> 
> 	// calculate observation jacobian
> 	// Observation jacobian and Kalman gain vectors
> 	SparseVector24f<0,1,2,3> Hfusion;
> 	Hfusion.at<0>() = -HK16*HK18;
> 	Hfusion.at<1>() = -HK18*HK24;
> 	Hfusion.at<2>() = -HK18*HK25;
> 	Hfusion.at<3>() = HK18*HK26;
> 
> 	// calculate the Kalman gains
> 	// only calculate gains for states we are using
> 	Vector24f Kfusion;
> 	Kfusion(0) = HK27*HK32;
> 	Kfusion(1) = HK28*HK32;
> 	Kfusion(2) = HK30*HK32;
> 	Kfusion(3) = HK31*HK32;
> 	for (unsigned row = 4; row <= 23; row++) {
> 		Kfusion(row) = HK32*(-HK16*P(0,row) - HK24*P(1,row) - HK25*P(2,row) + HK26*P(3,row));
> 	}
> 
> 	const bool is_fused = measurementUpdate(Kfusion, Hfusion, _heading_innov);
> 	_fault_status.flags.bad_hdg = !is_fused;
> 
> 	if (is_fused) {
> 		_time_last_gps_yaw_fuse = _time_last_imu;
> 	}
> }
> ```

`_heading_innov` 혹은 `gnss_yaw.innovation` 으로 보아 해당 내용이 fusion 할 때 같이 들어가는 것으로 보이는데, 여전히 `calculateOutputStates()` 와 연결짓기 어려웠다.

>[!question]
>- `_aid_src_gnss_yaw` 가 어디에서 Subscribe 되는지? 혹은 

[^1]: https://discuss.px4.io/t/what-is-the-difference-between-gps-and-global-position-and-local-position/34908
[^2]: https://discuss.px4.io/t/gps-refresh-rate/16230
[^3]: https://github.com/mavlink/mavlink/issues/993
[^4]: https://github.com/PX4/PX4-Autopilot/pull/21214