---
date: 2023-09-09
layout: post
title: Jekyll 과 Github으로 사이트 제작하기
tags:
  - Web
---
### Jekyll 과 Github으로 사이트 제작하기

*Reference*
https://jekyllrb-ko.github.io/docs/

**Installation**
Jekyll 을 설치하기 전, 필요한 모든 의존요소를 가지고 있는지 확인해야 합니다.

```
sudo apt-get install ruby-full build-essential zlib1g-dev
```

루트 사용자로 루비 젬을 설치하는 것은 피하는게 좋습니다. 따라서, 일반 사용자 계정에 젬 설치 디렉토리를 설정할 필요가 있습니다. 다음 명령어들은 젬 설치 경로를 설정하는 환경설정 변수들을 `~/.bashrc` 파일에 추가할 것입니다. 다음과 같이 실행하세요:

```
echo '# Install Ruby Gems to ~/gems' >> ~/.bashrc
echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

마지막으로, Jekyll 을 설치합니다:

```
gem install jekyll bundler
```

>[!Error] Jekyll Installation Error
> Jekyll 설치가 바로 되지 않았다. `gem` 명령어가 되어서 바로 될 줄 알았으나 아래와 같은 에러가 나타남.
>```bash
> ERROR:  Error installing jekyll:
>	The last version of sass-embedded (~> 1.54) to support your Ruby & RubyGems was 1.63.6. Try installing it with `gem install sass-embedded -v 1.63.6` and then running the current command again
>	sass-embedded requires Ruby version >= 3.0.0. The current ruby version is 2.7.0.0.
> ```
> 여기 문제해결 사이트와 Jekyll 포럼을 참고하여 해결함.
> - [Jekyll 문제해결](https://jekyllrb-ko.github.io/docs/troubleshooting)
> - [Can’t install jekyll on linux mint 20.1](https://talk.jekyllrb.com/t/cant-install-jekyll-on-linux-mint-20-1/7978)

> [!Done] How to Solve
> ```bash
>sudo apt-get install ruby ruby-all-dev
>gem install jekyll --version="~>4.2.0"
>```
>Jekyll 명령어 입력시 결과
>```bash
>$ jekyll
A subcommand is required. 
jekyll 4.2.2 -- Jekyll is a blog-aware, static site generator in Ruby
>```

이제 `jekyll new . --force` 명령어로 현재 위치에 Jekyll 사이트를 생성해준다.
보통은 `jekyll new <site-name>`을 사용하지만 그러면 `<site-name>`으로 하위경로가 생성된다. 이미 사용하고 있는 Github 리포지토리를 그대로 사용하고 싶어서 현재 위치로 만들었다.
- *Reference*: [Jekyll - create new site scaffold in existing project](https://stackoverflow.com/questions/31634304/jekyll-create-new-site-scaffold-in-existing-project)

그러면 `_posts` 폴더가 생성되는데 기존에 사용하던 Obsidian 내용물들을 모두 폴더 아래로 넣어주었다.

그 후 기존에는 YYYY-DD-MM.md 형태로만 되어있던 파일들을 제목도 들어가게 하였고, `Front Matter`로 적절하게 바꿔주었다.

그리고 빌드하여 로컬사이트에서 테스트해보면 된다.
```bash
bundle exec jekyll build
```

### Github Actions로 배포 자동화하기

이제 git commit & push로 업로드를 하였다면 Github Actions를 활용하여 push할때마다 사이트가 자동으로 업데이트 되도록 해보고자 한다.

참고한 사이트는 아래와 같다.
- https://jekyllrb.com/docs/continuous-integration/github-actions/
- https://deeplify.dev/tools/git/github-pages-github-action

이제 push를 하면 자동으로 내용이 반영되어 배포된다.

문제는 Jekyll 형태가 아니라 html 형태로 배포되고 있었는데 아래와 같이 해결하였다.

```shell
gem "github-pages", "~> GITHUB-PAGES-VERSION", group: :jekyll_plugins
```

[Dependency versions](https://pages.github.com/versions/)에 보면 `github-pages` 버전이 228 이므로 `Gemfile`을 직접 열어 `GITHUB-PAGES-VERSION`를 228로 넣어서 수정해주었다.

그리고 `_config.yml`에서 내 사이트를 반영하도록 해주고, 사이트 제목이나 내용물을 적절하게 수정하였다.
```yml
baseurl: "/Obsidian-Vault" # the subpath of your site, e.g. /blog
url: "https://chanjoon.github.io" # the base hostname & protocol for your site
```

*References*
- https://docs.github.com/ko/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll

여전히 몇가지 문제점들이 있는데, Obsidian에서는 이미지 경로를 이미지 파일명으로 축약시켜서 사이트에 올라갈 때 직접 수정해주어야 한다.

그리고 LaTex로 작성한 수식들이 모두 깨진다...

우선 이미지 경로는 일일이 수정해주었다.

### Github Pages로 배포하는 Jekyll에 LaTex 사용하기

github pages jekyll latex로 구글에 검색하면 StackOverflow에 나오는 페이지에서 답을 얻었다. 대부분의 내용들은 내가 설치한 Jekyll에 없는 `_layouts`, `_include`기반으로 작성되어 여러가지를 찾아보다가 마지막 답변으로 해결하였다.

- https://stackoverflow.com/a/72854289
- https://hyrtsi.github.io/2022/07/02/test-math.html

두 번째 링크 **Try 5**에 있는 내용 그대로 따라하면 된다.

우선 `Minima` theme을 사용하고 있는지 체크한다. `about.markdown`파일을 별도로 수정하지 않았다면 `Minima` 깃헙 리포지토리 링크가 나와있다. `_layouts`에 있는 파일들을 모두 복사하여 본인 로컬 경로에 같은 이름의 폴더를 생성하여 복사 파일들을 만들어 준다.

https://github.com/jekyll/minima/tree/master/_layouts

이제 MathJax와 포맷 지정으로 $\LaTeX$와 동일하게 사용 가능하도록 `<scripts/>`에 넣어주면 된다.
두 번째 링크에는 `default.html`에 넣도록 되어있지만 현재 버전에서는 `base.html`에 넣으면 된다.
```html
<!DOCTYPE html>
<html lang="{{ page.lang | default: site.lang | default: "en" }}">

<!-- 생략 -->
	<script type="text/javascript" async
	src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML">
	</script>
	<script type="text/x-mathjax-config">
		MathJax.Hub.Config({
		tex2jax: {
			inlineMath: [ ['$','$'], ["\\(","\\)"] ],
			processEscapes: true
		}
		});
	</script>
</html>
```

이렇게 해주면 필요한 수식이나 행렬 표기가 잘 나온다.