# Certificates

## SSL

### keystore 제작

```sh
keytool -genkey -alias flayground -keyalg RSA -keystore flayground.pkcs12 -storetype pkcs12
```

```cmd
    Enter keystore password:
    Re-enter new password:
    What is your first and last name?
        [Unknown]:  flayground.net
    What is the name of your organizational unit?
        [Unknown]:  flayground
    What is the name of your organization?
        [Unknown]:  kamoru
    What is the name of your City or Locality?
        [Unknown]:  Seongnam
    What is the name of your State or Province?
        [Unknown]:  Gyeonggi
    What is the two-letter country code for this unit?
        [Unknown]:  KR
    Is CN=flay, OU=ground, O=kamoru, L=jk, ST=jk, C=jk correct?
        [no]:  y

    Generating 2,048 bit RSA key pair and self-signed certificate (SHA256withRSA) with a validity of 90 days
            for: CN=flayground.net, OU=flayground, O=kamoru, L=Seongnam, ST=Gyeonggi, C=KR
```

### keystore에서 인증서 export

```sh
keytool -export -alias flayground -keystore flayground.pkcs12 -rfc -file flayground.cer
```

```cmd
    Enter keystore password:
    Certificate stored in file <flayground.cer>
```

### trust store 제작

```sh
keytool -import -alias flaytrust -file flayground.cer -keystore flayground.trust.pkcs12
```

```cmd
    Enter keystore password:
    Re-enter new password:
    Owner: CN=flayground.net, OU=flayground, O=kamoru, L=Seongnam, ST=Gyeonggi, C=KR
    Issuer: CN=flayground.net, OU=flayground, O=kamoru, L=Seongnam, ST=Gyeonggi, C=KR
    Serial number: c4c594ea614761e8
    Valid from: Tue Mar 22 19:45:02 KST 2022 until: Mon Jun 20 19:45:02 KST 2022
    Certificate fingerprints:
            SHA1: 80:35:A1:3B:EB:9E:12:6B:ED:75:38:CC:91:98:8D:61:45:9F:72:05
            SHA256: 49:17:64:CA:9A:C2:85:59:46:13:BE:73:CD:B5:1F:39:7C:AA:C5:CA:6F:04:DE:27:06:7C:27:9F:71:24:19:CF
    Signature algorithm name: SHA256withRSA
    Subject Public Key Algorithm: 2048-bit RSA key
    Version: 3

    Extensions:

    #1: ObjectId: 2.5.29.14 Criticality=false
    SubjectKeyIdentifier [
    KeyIdentifier [
    0000: 5D D9 DA 8B 00 C4 D8 C6   1C 19 4A 1A 14 C3 68 35  ].........J...h5
    0010: 71 3D EC 2D                                        q=.-
    ]
    ]

    Trust this certificate? [no]:  y
    Certificate was added to keystore
```

## Configuration

### application.properties

```ini
# ssl
server.ssl.enabled=true
server.ssl.key-alias=flayground
server.ssl.key-store=classpath:cert/flayground.pkcs12
server.ssl.key-store-password=PASSWORD
server.ssl.key-password=PASSWORD
server.ssl.trust-store=classpath:cert/flayground.trust.pkcs12
server.ssl.trust-store-password=PASSWORD
```

### application.yml

```yml
server:
    port: 8888
    servlet:
    session:
        timeout: 30
    ssl:
    enabled: true
    key-alias: flayground
    key-store: classpath:cert/flayground.pkcs12
    key-store-password: PASSWORD
    key-password: PASSWORD
    trust-store: classpath:cert/flayground.trust.pkcs12
    trust-store-password: PASSWORD
```
