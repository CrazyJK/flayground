package jk.kamoru.flayground.base.web.attach;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.base.web.attach.Attach.Ticket;

@Component
public class AttachPocket {

  @Autowired FlayProperties flayProperties;

  Map<String, Attach> attachMap = new ConcurrentHashMap<>();

  public List<Ticket> in(MultipartFile... multipartFiles) {
    return Arrays.stream(multipartFiles).map((multipartFile) -> {
      if (multipartFile.isEmpty()) {
        throw new IllegalStateException("multipartFile is empty");
      }

      final String name = multipartFile.getName();
      final String originalFilename = multipartFile.getOriginalFilename();
      final String contentType = multipartFile.getContentType();
      final long size = multipartFile.getSize();

      String uniqueKey = generateUniqueKey(name, originalFilename, contentType, size);

      if (!attachMap.containsKey(uniqueKey)) {
        File pocketFile = new File(flayProperties.getAttachPath(), uniqueKey);
        try {
          multipartFile.transferTo(pocketFile);
        } catch (IOException e) {
          throw new IllegalStateException("multipartFile transfer fail: " + e.getMessage(), e);
        }

        Attach attach = new Attach(pocketFile, uniqueKey, name, originalFilename, contentType, size);
        attachMap.put(uniqueKey, attach);
      }

      return attachMap.get(uniqueKey).getTicket();
    }).toList();
  }

  public Attach out(String uniqueKey) {
    if (attachMap.containsKey(uniqueKey)) {
      Attach attach = attachMap.get(uniqueKey);
      attachMap.remove(uniqueKey);
      return attach;
    }
    return null;
  }

  String generateUniqueKey(String name, String originalFilename, String contentType, long size) {
    final String string = name + originalFilename + contentType + size;
    byte[] bytes = string.getBytes();
    ByteBuffer byteBuffer = ByteBuffer.wrap(bytes);

    try {
      MessageDigest messageDigest = MessageDigest.getInstance("MD5");
      messageDigest.update(byteBuffer);

      byte[] mdBytes = messageDigest.digest();
      StringBuilder sb = new StringBuilder();
      for (Integer i = 0; i < mdBytes.length; i++) {
        sb.append(Integer.toString((mdBytes[i] & 0xff) + 0x100, 16)).substring(1);
      }
      return sb.toString();
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("generate UniqueKey fail: " + e.getMessage(), e);
    }
  }

  String generateFileHash(File file) {
    try (FileInputStream fileInputStream = new FileInputStream(file)) {
      MessageDigest messageDigest = MessageDigest.getInstance("MD5");

      byte[] dataBytes = new byte[1024];
      Integer nRead = 0;
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
      throw new IllegalStateException("generate FileHash fail: " + e.getMessage(), e);
    }
  }

}
