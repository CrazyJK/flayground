package jk.kamoru.flayground.stream;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.text.NumberFormat;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class MovieStreamHandler {

  /**
   * 동영상 파일 stream. video tag에서 사용
   *
   * @param request
   * @param response
   * @param file
   */
  public void streamFile(final HttpServletRequest request, final HttpServletResponse response, final File file) {
    // 동영상 파일 크기
    final long movieSize = file.length();
    // 동영상 확장자
    final String extension = FilenameUtils.getExtension(file.getName());
    // 요청 범위의 시작 byte
    long rangeStart = 0;
    // 요청 범위의 끝 byte
    long rangeEnd = 0;
    // 요청된 구간의 계산된 크기
    long partSize = -1;
    // 부분 요청일 경우 true, 전체 요청의 경우 false
    boolean isPart = false;
    // 스트림 요청 범위, request의 헤더에서 range를 읽는다.
    String range = request.getHeader("range");

    // calculate rangeStart, rangeEnd, isPart, partSize
    if (range != null) {
      if (range.endsWith("-")) {
        range = range + (movieSize - 1);
      }
      final int idxm = range.trim().indexOf("-");
      rangeStart = Long.parseLong(range.substring(6, idxm));
      rangeEnd = Long.parseLong(range.substring(idxm + 1));
      if (rangeStart > 0) {
        isPart = true;
      }
    } else {
      rangeStart = 0;
      rangeEnd = movieSize - 1;
    }
    partSize = rangeEnd - rangeStart + 1;

    // log
    if (rangeStart == 0) {
      log.info("stream {}", file);
    } else {
      log.debug("stream {} {} MB from {}%", file, NumberFormat.getNumberInstance().format(movieSize / FileUtils.ONE_MB), (int) ((float) rangeStart / movieSize * 100));
    }

    try (RandomAccessFile randomFile = new RandomAccessFile(file, "r")) {
      // seeking file
      randomFile.seek(rangeStart);

      // set response info
      response.reset();
      response.setContentType("video/" + extension);
      response.setHeader("Accept-Ranges", "bytes");
      response.setHeader("Content-Range", "bytes " + rangeStart + "-" + rangeEnd + "/" + movieSize);
      response.setHeader("Content-Length", String.valueOf(partSize));
      response.setStatus(isPart ? 206 : 200);

      // write in response
      final int bufferSize = 8 * 1024;
      final byte[] buffer = new byte[bufferSize];
      OutputStream out = response.getOutputStream();
      do {
        int len = (int) Math.min(partSize, bufferSize);
        int total = randomFile.read(buffer, 0, len);
        out.write(buffer, 0, total);
        partSize -= len;
      } while (partSize > 0);
    } catch (IOException e) {
      log.error("fail: {}", e.getMessage());
    }
  }

}
