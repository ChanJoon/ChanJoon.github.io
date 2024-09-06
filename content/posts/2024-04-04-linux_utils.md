---
layout: post
title: Linux CLI Cheatseet
date: 2024-04-04
categories: Misc.
tags:
  - linux
math: "true"
---
# Linux CLI Command Cheatseet

### 윈도우에서 압축한 zip 파일에 한글이 있는 경우

```
unzip -O cp949 <zipfile> -d <directory to unzip>
```

### 파티션 용량 측정

```
df -h
```

### 경로에 있는 용량 측정

```
du -hs <directory>
```

## 파티션 용량 정리

### 용량 큰 폴더 찾아내기

`head -N` 로 몇 개 까지 표시할 지 설정

```bash
$ du -ah ./ | grep -v "/$" | sort -rh | head -12
40G	./.cache
34G	./Downloads
30G	./github
23G	./.cache/pypoetry
22G	./github/mono-vo/dataset/sequences
22G	./github/mono-vo/dataset
22G	./github/mono-vo
22G	./Downloads/data_odometry_gray.zip
14G	./.cache/pypoetry/virtualenvs
11G	./.config
11G	./catkin_ws
8.8G	./catkin_ws/src
```

### 오래된 캐시파일 제거

보다시피 `~/.cache` 에 40G 넘는 파일들이 쌓여있기 때문에 제거해야 하였으나 무작정 지우는 것이 불안하여 검색해봄.

https://askubuntu.com/questions/102046/is-it-okay-to-delete-the-cache-folder 에서 제시한 일정 기간이 지난 파일을 삭제함.

```bash
$ find ~/.cache/ -depth -type f -atime +180
```

### 용량 큰 패키지 제거

```bash
$ dpkg-query --show --showformat='${Package;-50}\t${Installed-Size}\n' | sort -k 2 -n | grep -v deinstall | awk '{printf "%.3f MB \t %s\n", $2/(1024), $1}'
# ...
362.818 MB 	 libgl1-mesa-dri
378.682 MB 	 code
379.260 MB 	 libgl1-mesa-dri
383.577 MB 	 naver-whale-stable
621.394 MB 	 wine-stable-i386
652.386 MB 	 zoom
689.403 MB 	 linux-firmware
728.213 MB 	 wine-stable-amd64
```

위 명령어로 용량이 큰 패키지들을 찾을 수 있고, 사용하지 않는 패키지들은 `apt-get remove` 로 제거해준다.
