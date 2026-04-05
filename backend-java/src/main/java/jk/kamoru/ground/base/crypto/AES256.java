/*
 * https://bamdule.tistory.com/234
 */
package jk.kamoru.ground.base.crypto;

import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class AES256 {

  public static String alg = "AES/CBC/PKCS5Padding";

  private final String key = "12345678901234567890123456789012"; // 32 bytes. Secret Key
  private final String iv = key.substring(0, 16); // 16 bytes. Initialization Vector

  public String encrypt(String text) throws Exception {
    Cipher cipher = Cipher.getInstance(alg);
    SecretKeySpec keySpec = new SecretKeySpec(key.getBytes(), "AES");
    IvParameterSpec ivParamSpec = new IvParameterSpec(iv.getBytes());
    cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivParamSpec);

    byte[] encrypted = cipher.doFinal(text.getBytes("UTF-8"));
    return Base64.getEncoder().encodeToString(encrypted);
  }

  public String decrypt(String cipherText) throws Exception {
    Cipher cipher = Cipher.getInstance(alg);
    SecretKeySpec keySpec = new SecretKeySpec(key.getBytes(), "AES");
    IvParameterSpec ivParamSpec = new IvParameterSpec(iv.getBytes());
    cipher.init(Cipher.DECRYPT_MODE, keySpec, ivParamSpec);

    byte[] decodedBytes = Base64.getDecoder().decode(cipherText);
    byte[] decrypted = cipher.doFinal(decodedBytes);
    return new String(decrypted, "UTF-8");
  }

  public static void main(String[] args) throws Exception {

    AES256 aes256 = new AES256();
    String text = "!! Hello World !!";
    String cipherText = aes256.encrypt(text);
    System.out.println(text);
    System.out.println(cipherText);
    System.out.println(aes256.decrypt(cipherText));

  }
}
