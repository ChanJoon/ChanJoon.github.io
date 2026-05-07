---
layout: post
title: "2026-03-23"
date: 2026-03-23 18:30
categories: []
tags: []
math: "true"
---

# Paper Writing

## Why-What-How-If

### Why - 문제점 1:

### Details - 근거(기존 방법):

1.

2.

### What - 해결 방법 1:

### How - 구체적인 해결 방법:

1.

2.

### If - 기대효과:


### Why - 문제점 2:


### Details - 근거(기존 방법):

1.

2.

### What - 해결 방법 2:

### How - 구체적인 해결 방법:

1.

2.

### If - 기대효과:

---


### 예시: PIDLoc

**Why - 문제점 1:** 주어진 pose에서의 feature difference에만 의존함

**Details - 근거(기존 방법):** Cross-view image retrieval
	- Ground-view image와 대응되는 GPS-tagged satellite patch (a partition of satellite map)를 찾아서 localization을 수행함
	- 장점: 넓은 영역에서 global pose 추정 가능
	- 문제점: Partioning density of the satellite map (10m이상의 단위)로 localization 성능이 제한됨
		- 반복된 pattern, 비슷한 feature가 있는 영역에서 local optima에 빠질 수 있음
		- object의 boundary와 같이 세밀한 영역에서의 feature를 잘 반영하지 못함


**What - 해결 방법 1:** 주어진 시점 뿐만 아니라 fine-grained context (세밀한 영역), global context (넓은 FoV)를 고려한 feature difference와 feature difference의 변화율도 고려


**How - 구체적인 해결 방법:**
	1. **I branch (global context):** 주어진 pose 주변의 pose들도 함께 고려해서 global context를 반영
	2. **D branch (fine-grained context):** 주어진 pose에 대한 feature 차이의 변화율을 함께 고려해서 fine-grained context를 반영
		- feature 차이의 변화율은 sub pixel 이하에서의 feature 차이도 고려할 수 있으므로 더 세밀하게 반영할 수 있음

**If - 기대효과:**
	3. I branch: global context를 고려해서 반복된 pattern, 비슷한 feature가 있는 영역에서 local optima에 빠지지 않음
		- 증명:
			1. large initial pose error에서 PD branch와 PID branch R@1 성능 비교
			2. SIBCL과 제안한 PID branch R@1성능 비교
	4. D branch:
		- object나 structure의 edge나 boundary와 같이 세밀한 영역에서의 feature를 잘 반영함.
		- pose 변화에 대한 feature 변화의 관계를 모델이 prior로 학습할 수 있음.
		- 증명:
			- PI branch와 PID branch의 R@0.25 성능 비교
			- 더 세밀한 영역에서의 recall reate를 측정


**Why - 문제점 2:** cross-view feature의 local feature간의 위치와 구조적 관계를 고려하지 않고 pose를 추정함

**Details - 근거(기존 방법):** Cross-view pose optimization
	- Ground-view image에 대응되는 satellite patch가 주어졌을 때, satellite-view image에 대한 ground-view image의 pose를 optimizer나 DNN으로 직접 추정해서 더 정확한 localization을 수행함.
	- Direct pose estimation이므로 partitioning density of the satellite map에 제한되지 않음.

**Details - 문제점:**
	- 기존에는 global feature만 활용하여 pose를 추정하여 local feature를 활용하지 않음.
	- 기존에는 cross-view feature에서 독립적으로 pose를 추정하여 가중합을 함 → 전체적인 공간 구조가 일관되게 반영되도록 pose를 추정하기 어렵게 된다.
		1. 각 feature마다 서로 다른 pose를 예측할 수 있어서 일관성이 떨어짐.
		2. feature 간의 상대적 위치나 방향과 같은 공간적 관계를 고려하지 않아서 pose 추정의 일관성이 떨어진다
		3. 특히 large initial pose error에서 개별 feature의 pose가 서로 다른 방향으로 수렴하거나 local optima 빠질 가능성이 높아짐.

**What - 해결 방법 2:** cross-view feature의 point간의 공간적인 관계를 학습함

**How - 구체적인 해결 방법:** SPE (spatially-aware pose estimator)
	- Cross-view에서 local feature간의 위치와 구조적 관계를 학습하도록 channel-shared mlp를 point dimension에 적용함.

**If - 기대효과:** 전체 공간 구조가 일관되게 반영되어 일관된 pose 추정
	- **증명:** global feature만 사용한 경우, 독립적으로 pose를 추정하여 가중합한 경우와 비교
