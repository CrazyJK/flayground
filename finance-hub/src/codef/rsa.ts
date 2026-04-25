import forge from 'node-forge';

/**
 * codef publicKey(PEM 형식)로 평문 비밀번호를 RSA-OAEP 암호화하여 Base64 문자열로 반환한다.
 * codef API는 계좌비밀번호를 publicKey로 암호화하여 전송할 것을 요구한다.
 *
 * @param plainText - 암호화할 평문 (계좌비밀번호 등)
 * @param publicKeyPem - codef 마이페이지에서 발급받은 RSA 공개키 (PEM 형식)
 * @returns Base64로 인코딩된 암호문
 */
export function rsaEncrypt(plainText: string, publicKeyPem: string): string {
  // PEM 헤더/푸터가 없는 원시 base64 키인 경우 PEM 형식으로 감싼다
  const pem = publicKeyPem.includes('BEGIN') ? publicKeyPem : `-----BEGIN PUBLIC KEY-----\n${publicKeyPem}\n-----END PUBLIC KEY-----`;

  const publicKey = forge.pki.publicKeyFromPem(pem);
  const encrypted = publicKey.encrypt(forge.util.encodeUtf8(plainText), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: {
      md: forge.md.sha1.create(),
    },
  });

  return forge.util.encode64(encrypted);
}
