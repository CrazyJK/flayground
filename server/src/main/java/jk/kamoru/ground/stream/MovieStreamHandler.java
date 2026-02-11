package jk.kamoru.ground.stream;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.util.Map;

import org.apache.commons.io.FilenameUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jk.kamoru.ground.Ground;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class MovieStreamHandler {

  // 상수 정의
  private static final int BUFFER_SIZE = 64 * 1024; // 64KB - 성능 최적화를 위한 버퍼 크기
  private static final String RANGE_PREFIX = "bytes=";
  private static final String HEADER_RANGE = "range";
  private static final String HEADER_ACCEPT_RANGES = "Accept-Ranges";
  private static final String HEADER_CONTENT_RANGE = "Content-Range";
  private static final String HEADER_CONTENT_LENGTH = "Content-Length";
  private static final int HTTP_OK = 200;
  private static final int HTTP_PARTIAL_CONTENT = 206;

  // 확장자별 MIME 타입 매핑
  private static final Map<String, String> MIME_TYPE_MAP = Map.of("mp4", "video/mp4", "webm", "video/webm", "ogg", "video/ogg", "avi", "video/x-msvideo", "mkv", "video/x-matroska",
      "mov", "video/quicktime", "wmv", "video/x-ms-wmv", "flv", "video/x-flv");

  /**
   * 동영상 파일 stream. html <video> 태그의 source로 사용됨. HTTP Range 요청을 지원하여 부분 스트리밍 가능.
   *
   * @param request  HTTP 요청
   * @param response HTTP 응답
   * @param file     스트리밍할 동영상 파일
   */
  public void streamFile(final HttpServletRequest request, final HttpServletResponse response, final File file) {
    final long fileSize = file.length();
    final String extension = FilenameUtils.getExtension(file.getName());
    final String rangeHeader = request.getHeader(HEADER_RANGE);

    // Range 헤더 파싱 (복잡한 로직이므로 별도 메서드로 분리)
    final RangeInfo rangeInfo = parseRangeHeader(rangeHeader, fileSize);

    log.info("{} streaming {} {}; range: {}", rangeInfo.isPartial() ? "Partial" : "Full", file.getName(), Ground.Format.Number.prettyFileLength(fileSize),
        String.format("%10d(%6s) ~ %10d(%6s)", rangeInfo.start(), Ground.Format.Number.percent(fileSize, rangeInfo.start(), 1), rangeInfo.end(),
            Ground.Format.Number.percent(fileSize, rangeInfo.end(), 1)));

    try (RandomAccessFile randomFile = new RandomAccessFile(file, "r"); OutputStream out = response.getOutputStream()) {

      // 파일 포인터를 시작 위치로 이동
      randomFile.seek(rangeInfo.start());

      // HTTP 응답 헤더 설정
      response.reset();
      response.setContentType(MIME_TYPE_MAP.getOrDefault(extension.toLowerCase(), "video/" + extension));
      response.setHeader(HEADER_ACCEPT_RANGES, "bytes");
      response.setHeader(HEADER_CONTENT_RANGE, String.format("bytes %d-%d/%d", rangeInfo.start(), rangeInfo.end(), fileSize));
      response.setHeader(HEADER_CONTENT_LENGTH, String.valueOf(rangeInfo.size()));
      response.setStatus(rangeInfo.isPartial() ? HTTP_PARTIAL_CONTENT : HTTP_OK);

      // 파일 데이터를 버퍼를 통해 출력 스트림으로 전송
      final byte[] buffer = new byte[BUFFER_SIZE];
      long remainingSize = rangeInfo.size();

      while (remainingSize > 0) {
        final int readSize = (int) Math.min(remainingSize, BUFFER_SIZE);
        final int bytesRead = randomFile.read(buffer, 0, readSize);

        if (bytesRead == -1) {
          break;
        }

        out.write(buffer, 0, bytesRead);
        remainingSize -= bytesRead;
      }

    } catch (AsyncRequestNotUsableException e) {
      // 클라이언트가 연결을 끊은 경우 - 정상적인 상황으로 로그 불필요
    } catch (IOException e) {
      log.error("동영상 스트리밍 실패 - 파일: {}, 범위: {}-{}, 오류: {}", file.getAbsolutePath(), rangeInfo.start(), rangeInfo.end(), e.getMessage(), e);
    }
  }

  /**
   * Range 헤더를 파싱하여 스트리밍 범위 정보를 반환합니다. 예외 상황 처리 및 검증 로직을 포함한 복잡한 파싱 로직.
   *
   * @param rangeHeader Range 헤더 값 (예: "bytes=0-1023")
   * @param fileSize    파일 전체 크기
   * @return 파싱된 범위 정보
   */
  private RangeInfo parseRangeHeader(final String rangeHeader, final long fileSize) {
    // Range 헤더가 없으면 전체 파일 요청
    if (rangeHeader == null || !rangeHeader.startsWith(RANGE_PREFIX)) {
      return new RangeInfo(0, fileSize - 1, fileSize, false);
    }

    try {
      String rangeValue = rangeHeader.substring(RANGE_PREFIX.length()).trim();

      // "bytes=-" 형태로 끝나는 경우 전체 범위로 처리
      if (rangeValue.endsWith("-")) {
        rangeValue = rangeValue + (fileSize - 1);
      }

      final int dashIndex = rangeValue.indexOf("-");
      if (dashIndex <= 0) {
        log.warn("잘못된 Range 헤더 형식: {}", rangeHeader);
        return new RangeInfo(0, fileSize - 1, fileSize, false);
      }

      final long rangeStart = Long.parseLong(rangeValue.substring(0, dashIndex));
      final long rangeEnd = Long.parseLong(rangeValue.substring(dashIndex + 1));

      // 범위 유효성 검증
      if (rangeStart < 0 || rangeEnd >= fileSize || rangeStart > rangeEnd) {
        log.warn("유효하지 않은 Range 값: start={}, end={}, fileSize={}", rangeStart, rangeEnd, fileSize);
        return new RangeInfo(0, fileSize - 1, fileSize, false);
      }

      final long partSize = rangeEnd - rangeStart + 1;
      return new RangeInfo(rangeStart, rangeEnd, partSize, true);

    } catch (NumberFormatException e) {
      log.warn("Range 헤더 파싱 실패: {}", rangeHeader, e);
      return new RangeInfo(0, fileSize - 1, fileSize, false);
    }
  }

  /**
   * HTTP Range 요청 정보를 담는 레코드
   *
   * @param start     시작 바이트 위치
   * @param end       종료 바이트 위치
   * @param size      전송할 바이트 크기
   * @param isPartial 부분 요청 여부 (206 상태)
   */
  private record RangeInfo(long start, long end, long size, boolean isPartial) {
  }

}
