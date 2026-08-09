---
date: 2023-09-01
layout: post
title: "Pixhawk FC Connection to a Companion PC"
---
### Pixhawk FC Connection to a Companion PC
#px4 

*References*
- [공식문서](https://docs.px4.io/main/en/companion_computer/pixhawk_companion.html)
- [Duckyu Study Note](https://studynote.duckyu.xyz/pixhawk/2023/04/05/Pixhawk-Pixhawk%EC%99%80-Jetson-NX-UART-%ED%86%B5%EC%8B%A0.html)

픽스호크 FC를 Companion PC에 연결하여 사용하는 경우가 많다.

![[px4_arch_fc_companion_fbe22b77.svg]]

위 그림을 참고하면 이해가 편함. 자세한 링크는 [PX4 System Architecture](https://docs.px4.io/main/en/concept/px4_systems_architecture.html)를 참고.

FC와 PC(or SBC) 간의 연결에는 이더넷, 시리얼 연결이 있고 시리얼로는 UART와 USB 연결을 사용한다.

이더넷 연결은 Pixhawk FC 5X 이후(i.e. 5X, 6X) 시리즈부터 지원하며 전용 케이블선이 필요하다. ([지원 하드웨어와 세팅](https://docs.px4.io/main/en/advanced_config/ethernet_setup.html#supported-flight-controllers))

주로 UART or USB 연결을 사용하는데 UART는 TX/RX 선을 교차로 연결하여 통신시킨다.

이후 QGC에서 MAV_N_* 설정을 맞게 해주어야 한다. 자세한 사항은 공식문서와 [소프트웨어 setup](https://studynote.duckyu.xyz/pixhawk/2023/04/05/Pixhawk-Pixhawk%EC%99%80-Jetson-NX-UART-%ED%86%B5%EC%8B%A0.html) 파트 참고

이 중 `MAV_1_FLOW_CTRL` 같은 경우에 보통 `2: Auto-detected`를 사용하는데 6C 계열에서 문제가 있는 경우가 있다. 이 경우 `0: Force off`로 설정해주면 강제로 `RTS/CTS`를 차단하고 시리얼 통신을 사용한다.

이와 관련한 Github Issue와 PX4 포럼 이슈들도 보고되었는데 참고하면 좋다.

- [PX4-Autopilot #20762](https://github.com/PX4/PX4-Autopilot/issues/20762)
- [PX4-Autopilot #21540](https://github.com/PX4/PX4-Autopilot/pull/21540)
- [PX4 Forum problems-connecting-a-pixhawk-6c-to-a-raspberry-pi](https://discuss.px4.io/t/problems-connecting-a-pixhawk-6c-to-a-raspberry-pi/32318)