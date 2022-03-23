# CA-signed SSL

## 루트 인증서(CA) 만들기

### 루트 인증서 키 만들기. rootCA.key

    openssl ecparam -out rootCA.key -name prime256v1 -genkey

### 루트 인증서 CSR(인증 서명 요청) 만들기. rootCA.csr

    openssl req -new -sha256 -key rootCA.key -out rootCA.csr

```
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:KR
State or Province Name (full name) [Some-State]:Gyeonggi-do
Locality Name (eg, city) []:Anyang
Organization Name (eg, company) [Internet Widgits Pty Ltd]:kamoru
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:kamoru CA Root Certificate
Email Address []:master@kamoru.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

### 루트 인증서(CA)를 만들고 자체 서명하기. rootCA.crt

    openssl x509 -req -sha256 -days 999999 -in rootCA.csr -signkey rootCA.key -out rootCA.crt

```
Signature ok
subject=C = KR, ST = Gyeonggi-do, L = Anyang, O = kamoru, CN = kamoru CA Root Certificate, emailAddress = master@kamoru.com
Getting Private key
```

### 인증서 설치

## 서버 인증서 만들기

### key 파일 만들기

    openssl ecparam -out kamoru.jk.key -name prime256v1 -genkey

### 서버 인증서 CSR(인증 서명 요청) 만들기

    openssl req -new -sha256 -key kamoru.jk.key -out kamoru.jk.csr

> 서버 인증서의 CN(일반 이름)은 발급자의 도메인과 달라야 합니다.   
> 발급자의 CN은 kamoru CA Root Certificate 이며 서버 인증서의 CN은 *.kamoru.com 입니다.

```
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:KR
State or Province Name (full name) [Some-State]:Gyeonggi-do
Locality Name (eg, city) []:Anyang
Organization Name (eg, company) [Internet Widgits Pty Ltd]:kAamOrU
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:*.kamoru.jk
Email Address []:master@kamoru.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

### make extfile

    vi kamoru.jk.ext

> [alt_names]에 원하는 DNS를 넣어준다.

```
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.kamoru.jk
```

### 서버 인증서를 만들고 자체 서명하기

    openssl x509 -req -sha256 -days 999999 -in kamoru.jk.csr -CA rootCA.crt -CAkey rootCA.key -CAcreateserial -out kamoru.jk.crt -extfile kamoru.jk.ext

```
Signature ok
subject=C = KR, ST = Gyeonggi-do, L = Anyang, O = kamoru, CN = *.kamoru.com, emailAddress = master@kamoru.com
Getting CA Private Key
```

### CA 인증서를 포함하는 서버 인증서 만들기

    cat kamoru.jk.crt rootCA.crt > kamoru.jk.pem

### p12파일 생성

    openssl pkcs12 -export -inkey kamoru.jk.key -in kamoru.jk.pem -out kamoru.jk.p12 -name kamoru

```
Enter Export Password:
Verifying - Enter Export Password:
```

### Spring boot application.xml 설정

```ini
# ssl
server.ssl.enabled=true
server.ssl.key-store=classpath:ssl2/kamoru.jk.p12
server.ssl.key-store-password=697489
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=kamoru
```

### 인증서 정보 확인

    openssl x509 -in kamoru.jk.crt -text -noout

*****
ref

* [자체 서명 사설 SSL 인증서 만들기](https://www.runit.cloud/2020/04/https-ssl.html)
* [Spring boot 개발테스트를 위한 사설 SSL 인증서 적용](https://turtles7.tistory.com/40)

