---
date: 2023-10-16
layout: post
title: "rpg_trajectory_evalutation"
tags: ROS
math: "true"
---

# rpg_trajectory_evaluation

원래 VO/VIO를 평가하기 위해 사용하는 툴인 `rpg_trajectory_evaluation`을 controller로 만들어진 trajectory를 비교하기 위해 사용해보았다.

[uzh_rpg/rpg_trajectory_evaluation](https://github.com/uzh-rpg/rpg_trajectory_evaluation/)

**Install** 부분에서 필요한 라이브러리들을 설치해준다. python2를 사용하다고 되어있지만 그냥 python3에서도 작동하였다.

그리고 결과 plot들을 latex로 pdf를 생성해주는데 아래 커맨드로 $\LaTeX$를 설치해준다.

```bash
sudo apt-get install texlive-latex-extra texlive-fonts-recommended dvipng cm-super
```

그리고 rosbag으로 groundtruth에 해당하는 토픽과 기체가 이동한 토픽을 저장해준다. 형식은 `PoseStamped`로 한다.

그 후에 `bag_to_pose.py`를 이용해 bag파일을 Dataset 형식에 맞게 바꿔준다.

```bash
python scripts/dataset_tools/bag_to_pose.py ~/sh_mpc_typhoon_windL1.bag /target_pose --msg_type PoseStamped --output stamped_groundtruth.txt 
```

위는 예시 커맨드로 bag파일의 `/target_pose` 토픽을 `stamped_groundtruth.txt` 로 변환해주었다.

나는 서로 다른 제어기로 만들어진 경로를 비교하고자 하기 때문에 아래와 같이 폴더를 구성하였다.

```
├── laptop
│   ├── mpcc
│   │   ├── laptop_mpcc_iris_NOWIND
│   │   │   ├── stamped_groundtruth.txt
│   │   │   └── stamped_traj_estimate.txt
│   │   ├── laptop_mpcc_iris_WIND
│   │   │   ├── stamped_groundtruth.txt
│   │   │   └── stamped_traj_estimate.txt
│   │   ├── laptop_mpcc_iris_WINDL1
│   │   │   ├── stamped_groundtruth.txt
│   │   │   └── stamped_traj_estimate.txt
│   │   ├── laptop_mpcc_typhoon_NOWIND
│   │   │   ├── stamped_groundtruth.txt
│   │   │   └── stamped_traj_estimate.txt
│   │   ├── laptop_mpcc_typhoon_WIND
│   │   │   ├── stamped_groundtruth.txt
│   │   │   └── stamped_traj_estimate.txt
│   │   └── laptop_mpcc_typhoon_WINDL1
│   │       ├── stamped_groundtruth.txt
│   │       └── stamped_traj_estimate.txt
│   └── shmpc
│       ├── laptop_shmpc_iris_NOWIND
│       │   ├── stamped_groundtruth.txt
│       │   └── stamped_traj_estimate.txt
│       ├── laptop_shmpc_iris_WIND
│       │   ├── stamped_groundtruth.txt
│       │   └── stamped_traj_estimate.txt
│       ├── laptop_shmpc_iris_WINDL1
│       │   ├── stamped_groundtruth.txt
│       │   └── stamped_traj_estimate.txt
│       ├── laptop_shmpc_typhoon_NOWIND
│       │   ├── stamped_groundtruth.txt
│       │   └── stamped_traj_estimate.txt
│       ├── laptop_shmpc_typhoon_WIND
│       │   ├── stamped_groundtruth.txt
│       │   └── stamped_traj_estimate.txt
│       └── laptop_shmpc_typhoon_WINDL1
│           ├── stamped_groundtruth.txt
│           └── stamped_traj_estimate.txt
```

그리고 아래 커맨드를 입력하면 여러 결과값을 보여준다.

```bash
python scripts/analyze_trajectories.py mpcc.yaml --output_dir=./results/mpc --results_dir=./results/mpc --platform laptop --odometry_error_per_dataset --overall_odometry_error --plot_trajectories --png --rmse_table --rmse_boxplot
```

plot한 결과를 pdf대신 png로 저장하고 싶어 `--png` 옵션을 붙여주었다.