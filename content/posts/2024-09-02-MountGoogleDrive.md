---
layout: post
title: Mount Google Drive on Ubuntu 20.04
date: 2024-09-02
tags:
  - linux
math: "true"
---

# Mount your Google Drive on Ubuntu

[google-drive-ocamlfuse](https://github.com/astrada/google-drive-ocamlfuse)를 이용하여 구글 드라이브를 Ubuntu 에 마운트하여 사용해보자.

## Installation

```
sudo add-apt-repository ppa:alessandro-strada/ppa
sudo apt-get update
sudo apt-get install google-drive-ocamlfuse
```

## Usage

1. https://console.cloud.google.com/apis/api/drive.googleapis.com 에 접속하여 Google Drive API 를 활성화시킨다.
	이 때, 주의할 점은 활성화시킨 Project 의 Publishing status 를 `In production` 으로 설정해주어야 한다. 자세한 사항은 [링크](https://console.cloud.google.com/apis/credentials/consent) 에 가보자.
2. https://console.cloud.google.com/apis/credentials 에서 OAuth client ID 를 생성한다.
3. README 와 달리 `Application type` 을 `Web application` 으로 설정한다.
4. `Authorized redirect URIs` 에 `http://127.0.0.1:8080/oauth2callback` 를 넣어준다.
5. 생성된 client ID 를 이용해 다음과 같이 권한을 준다.
	`google-drive-ocamlfuse -id xxxxxxxxxx.apps.googleusercontent.com -secret XXX-YYY-ZZZ`
6. 위 명령어를 입력하면, 웹페이지로 연결되어 권한을 줄 것인지 확인한다. 이 때, 창을 계속 넘어가면 아까 지정해준 redirect URI 로 넘어간다.
	e.g. `http://127.0.0.1:8080/oauth2callback?code=<your_verification_code>&scope=https://www.googleapis.com/auth/drive`
7. 링크의 `code=` 부분을 확인하여 `~/.gdfuse/default/config` 의 verification code 부분에 넣어준다.
8. `mkdir <directory-to-mount>`
9. `google-drive-ocamlfuse <directory-to-mount>` (`-debug` 옵션을 넣으면 정상적으로 작동되는지 확인 가능하다.)

이제 Ubuntu 의 Files 를 눌러보면 Google Drive 가 정상적으로 마운트된 것을 확인할 수 있다.

[Reference](https://github.com/astrada/google-drive-ocamlfuse/issues/764)

## Troubleshooting

### Input/output error (os error 5).

`kill -9 google-drive-oc` 를 통해 프로세스를 kill 해준다.

### Transport endpoint is not connected (os error 107).

`sudo umount <mounted-directory>` 하면 해당 폴더를 사용할 수 있게 된다.

이 후, **Usage** 단계를 다시 수행한다.