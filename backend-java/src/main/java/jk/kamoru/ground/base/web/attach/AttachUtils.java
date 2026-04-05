package jk.kamoru.ground.base.web.attach;

import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.stream.Stream;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.math.NumberUtils;

import jk.kamoru.ground.Ground;

public class AttachUtils {

  public static String generateStringHash(String... strings) {
    try {
      String joinString = String.join(".", strings);
      byte[] bytes = joinString.getBytes(Charset.forName(Ground.ENCODING));
      ByteBuffer byteBuffer = ByteBuffer.wrap(bytes);

      MessageDigest messageDigest = MessageDigest.getInstance("MD5");
      messageDigest.update(byteBuffer);
      byte[] mdBytes = messageDigest.digest();

      StringBuilder sb = new StringBuilder();
      for (Integer i = 0; i < mdBytes.length; i++) {
        sb.append(Integer.toString((mdBytes[i] & 0xff) + 0x100, 16)).substring(1);
      }

      return sb.toString();
    } catch (NoSuchAlgorithmException e) {
      throw new AttachException("generate string hash fail: " + e.getMessage(), e);
    }
  }

  public static String generateFileHash(File file) {
    try (FileInputStream fileInputStream = new FileInputStream(file)) {
      byte[] dataBytes = new byte[1024];
      Integer nRead = 0;

      MessageDigest messageDigest = MessageDigest.getInstance("MD5");
      while ((nRead = fileInputStream.read(dataBytes)) != -1) {
        messageDigest.update(dataBytes, 0, nRead);
      }
      byte[] mdBytes = messageDigest.digest();

      StringBuilder sb = new StringBuilder();
      for (Integer i = 0; i < mdBytes.length; i++) {
        sb.append(Integer.toString((mdBytes[i] & 0xff) + 0x100, 16)).substring(1);
      }
      return sb.toString();
    } catch (IOException | NoSuchAlgorithmException e) {
      throw new AttachException("generate FileHash fail: " + e.getMessage(), e);
    }
  }

  public static int getLastFileNumber(File base, String name) {
    File[] listFiles = base.listFiles(new FilenameFilter() {

      @Override
      public boolean accept(File arg0, String arg1) {
        return arg1.startsWith(name);
      }

    });

    if (listFiles == null || listFiles.length == 0) {
      return 0;
    } else {
      return Stream.of(listFiles).mapToInt((file) -> NumberUtils.toInt(FilenameUtils.getExtension(file.getName()))).max().orElse(0);
    }
  }

}
