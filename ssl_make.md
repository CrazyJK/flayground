# SSL

## keystore 제작
	keytool -genkey -alias flayground -keyalg RSA -keystore flayground.pkcs12 -storetype pkcs12
		Enter keystore password: 697489
		Re-enter new password:
		What is your first and last name?
		  [Unknown]:  flay
		What is the name of your organizational unit?
		  [Unknown]:  ground
		What is the name of your organization?
		  [Unknown]:  kamoru
		What is the name of your City or Locality?
		  [Unknown]:  jk
		What is the name of your State or Province?
		  [Unknown]:  jk
		What is the two-letter country code for this unit?
		  [Unknown]:  jk
		Is CN=flay, OU=ground, O=kamoru, L=jk, ST=jk, C=jk correct?
		  [no]:  y

	Generating 2,048 bit RSA key pair and self-signed certificate (SHA256withRSA) with a validity of 90 days
			for: CN=flay, OU=ground, O=kamoru, L=jk, ST=jk, C=jk


## keystore에서 인증서 export
	keytool -export -alias flayground -keystore flayground.pkcs12 -rfc -file flayground.cer
		Enter keystore password: 697489
		Certificate stored in file <flayground.cer>


## trust store 제작
	keytool -import -alias flaytrust -file flayground.cer -keystore flaytrust.pkcs12
		Enter keystore password: 697489
		Re-enter new password:
		Owner: CN=flay, OU=ground, O=kamoru, L=jk, ST=jk, C=jk
		Issuer: CN=flay, OU=ground, O=kamoru, L=jk, ST=jk, C=jk
		Serial number: 5ed50d2a
		Valid from: Sun Mar 07 00:52:44 KST 2021 until: Sat Jun 05 00:52:44 KST 2021
		Certificate fingerprints:
				 SHA1: C0:A5:D2:00:FC:29:BA:D8:3A:AF:BF:5D:BD:0C:10:DC:E4:1A:6F:56
				 SHA256: C6:4A:4E:FB:2E:16:93:65:84:03:45:55:8F:B3:F9:95:FA:0C:72:83:32:F5:0A:F0:8A:DA:F6:2D:0B:EF:16:F4
		Signature algorithm name: SHA256withRSA
		Subject Public Key Algorithm: 2048-bit RSA key
		Version: 3
	
		Extensions:
	
		#1: ObjectId: 2.5.29.14 Criticality=false
		SubjectKeyIdentifier [
		KeyIdentifier [
		0000: C9 ED 4A 5A 95 35 91 29   DE 46 CE 36 0F 4F 95 47  ..JZ.5.).F.6.O.G
		0010: 10 C5 F2 E1                                        ....
		]
		]
	
		Trust this certificate? [no]:  y
		Certificate was added to keystore


## application.yml에 설정 추가
	server:
	  port: 8888
	  servlet:
	    session:
	      timeout: 30
	  ssl:
	    enabled: true
	    key-alias: ayostore
	    key-store: ayostore.pkcs12
	    key-store-password: '@ayotera@'
	    key-password: '@ayotera@'
	    trust-store: ayotrust.pkcs12
	    trust-store-password: '@ayotera@' 
