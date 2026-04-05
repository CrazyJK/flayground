package jk.kamoru.ground.base.web.download;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jk.kamoru.ground.Ground;
import lombok.extern.slf4j.Slf4j;

/**
 * URL 다운로드
 *
 * <pre>
 * origin 이슈로 인해 서버에서 다운로드해서 전달해 주기 위한 컨트롤러
 *
 * 입력된 url로 연결해서, header에서 파일 이름을 추출하여
 * header에 이름 추가하여 파일을 응답으로 내보낸다
 * </pre>
 */
@Controller
@RequestMapping(Ground.API_PREFIX)
@Slf4j
@io.swagger.v3.oas.annotations.tags.Tag(name = "UrlDownloader")
public class UrlDownloader {

  @PostMapping("/download")
  @ResponseBody
  public HttpEntity<byte[]> download(@RequestParam String url) {
    try {
      URL downloadUrl = URI.create(url).toURL();
      HttpURLConnection connection = (HttpURLConnection) downloadUrl.openConnection();
      connection.setRequestMethod("GET");
      connection.connect();

      if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
        throw new RuntimeException("Failed to download file: HTTP code " + connection.getResponseCode());
      }

      // Extract file name from header or URL
      String disposition = connection.getHeaderField("Content-Disposition");
      String fileName = "downloaded_file";
      if (disposition != null && disposition.contains("filename=")) {
        int index = disposition.indexOf("filename=") + 9;
        fileName = disposition.substring(index).replaceAll("\"", "");
      } else {
        String path = downloadUrl.getPath();
        fileName = path.substring(path.lastIndexOf("/") + 1);
      }
      log.info("Downloaded file name: {}", fileName);

      // Read the downloaded data into a byte array
      ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
      InputStream inputStream = connection.getInputStream();
      byte[] buffer = new byte[4096];
      int bytesRead;
      while ((bytesRead = inputStream.read(buffer)) != -1) {
        byteArrayOutputStream.write(buffer, 0, bytesRead);
      }
      inputStream.close();
      connection.disconnect();
      byte[] fileBytes = byteArrayOutputStream.toByteArray();
      log.info("Downloaded file size: {}", fileBytes.length);

      // Prepare response headers with file download information
      HttpHeaders headers = new HttpHeaders();
      headers.add("Content-Disposition", "attachment; filename=\"" + fileName + "\"");

      return new HttpEntity<>(fileBytes, headers);
    } catch (Exception e) {
      throw new RuntimeException("Error during file download", e);
    }
  }

}
