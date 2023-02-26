# flayground

flay ground

## webpack

```
cd www
yarn run watch
or
yarn run build

# add module
yarn add json-viewer-js

# after remove
yarn install
```

## ref

https://fontawesome.com/v4/icons/

https://getbootstrap.com/docs/5.1

# Git

## 브랜치 삭제

https://www.freecodecamp.org/korean/news/git-delete-local-or-remote-branch/

### 로컬 브랜치 삭제

    # 목록 확인
    > git branch
      * master
        springboot3
        webflux

    # 삭제
    > git branch -D <로컬 브랜치 이름>
    ex) > git branch -D springboot3

### 원격 브랜치 삭제

    # 목록 확인
    > git branch -r
      origin/dependabot/maven/org.jsoup-jsoup-1.14.2
      origin/dependabot/maven/org.jsoup-jsoup-1.15.3
      origin/imgbot
      origin/master
      origin/springboot3
      origin/webpack

    # 삭제
    > git push origin -d <원격 브랜치 이름>
    ex) git push origin -d springboot3
