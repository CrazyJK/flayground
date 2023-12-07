# jk-ground

flay ground

## webpack

```
cd www
del -Recurse -Force ..\src\main\resources\static\dist\*
yarn run watch
or
yarn run build
```

## yarn

패키지 최신 버전 업그레이드
yarn upgrade --latest

패키지 추가
yarn add @toast-ui/editor

dev 패키지 추가
yarn add -D webpack

## banner maker

https://manytools.org/hacker-tools/ascii-banner/

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

## Swagger

https://springdoc.org/

localhost/swagger-ui/index.html

# HTTP Method

## GET

Get 메서드는 서버에 리소스를 요청합니다. Get을 사용하는 요청은 오직 데이터를 받기만 하기로 약속됨. (HTML 본문을 읽어옴)

## HEAD

GET과 동일하지만 서버에서 HTML 본문을 Return하지 않음. (상태 확인 용도)

## POST

리소스를 생성/변경하기 위해 설계되었기 때문에 GET과 달리 데이터를 HTTP 메세지의 Body에 담아 전송함. (주로 데이터 생성 목적)

## PUT

리소스를 변경(Update)하기 위해 설계되었지만, 리소스가 없다면 새로운 리소스를 생성해 달라고 요청하는 용도로도 쓰임. (주로 데이터 수정 목적)

## PATCH

리소스 일부분만 수정할때 사용함. (PUT은 전체 데이터를 수정하지만 PATCH는 일부 데이터만 수정)

## DELETE

특정 리소스를 삭제함.

# remove console

```sh
yarn add -D babel-plugin-transform-remove-console
yarn add -D babel-loader @babel/core
```

.babelrc

```json
{
  "plugins": [["transform-remove-console", { "exclude": ["error", "warn", "info"] }]]
}
```

webpack.config.js

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
};
```
