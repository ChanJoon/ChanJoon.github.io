---
layout: post
title: How to use LaTeX in VSCode
date: 2024-02-07
categories: Misc.
tags: 
math: "true"
---
## How to use LaTeX in VSCode

VSCode 에 있는 [LaTeX Workshop](https://github.com/James-Yu/LaTeX-Workshop/wiki/Install#requirements) 을 사용할 것이다. 그 전에 로컬에 latex 빌드를 위해 **TeX Live** 를 설치하여야 한다.

[링크](https://www.tug.org/texlive/quickinstall.html) 에 잘 나와 있으므로 읽고 따라하면 된다.
```bash
1. cd /tmp # working directory of your choice
2. wget [https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz](https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz) # or curl instead of wget
3. zcat < install-tl-unx.tar.gz | tar xf -
4. cd install-tl-*
5. perl ./install-tl --no-interaction # as root or with [writable destination](https://www.tug.org/texlive/quickinstall.html#running)
6. Finally, prepend /usr/local/texlive/YYYY/bin/PLATFORM to your PATH,  
    e.g., /usr/local/texlive/2023/bin/x86_64-linux
```

그리고 이를 PATH 에 추가하기 위해 `~/.bashrc` 에서 넣어준다. 주의할 점은 $PATH 를 뒤에 넣어주어야 새로 설치된 경로를 잘 인식한다. 기존에 제공되는 TexLive 가 인식될 수 있다. 

```bash
echo "export PATH=/usr/local/texlive/2023/bin/x86_64-linux:$PATH
" >> ~/.bashrc

# Check installed versions
tlmgr version
tex --version
```

`sudo apt install latexmk` 로 추가적인 LaTeX 를 설치해주어주어도 된다.

그리고 VSCode 에서 LaTeX Workshop Extension 을 설치해주면,  `.tex` 확장자를 가진 문서에 대해 빌드와 PDF 미리보기가 제공된다.

한글 사용을 위해서는 KoTeX 가 있다. 자세한 사항은 [KTUGFaq](http://faq.ktug.org/faq/KoTeXLive) 참조