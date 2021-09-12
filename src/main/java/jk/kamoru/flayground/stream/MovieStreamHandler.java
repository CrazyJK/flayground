package jk.kamoru.flayground.stream;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import jk.kamoru.flayground.Flayground;
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
	public void streamFile(HttpServletRequest request, HttpServletResponse response, File file) {
		log.info("START streamFile {}", file);

		long rangeStart = 0; // 요청 범위의 시작 위치
		long rangeEnd = 0; // 요청 범위의 끝 위치
		boolean isPart = false; // 부분 요청일 경우 true, 전체 요청의 경우 false

		RandomAccessFile randomFile = null;
		try {
			randomFile = new RandomAccessFile(file, "r");

			// 동영상 파일 크기
			long movieSize = randomFile.length();
			// 스트림 요청 범위, request의 헤더에서 range를 읽는다.
			String range = request.getHeader("range");
			if (range != null) {
				if (range.endsWith("-")) {
					range = range + (movieSize - 1);
				}
				int idxm = range.trim().indexOf("-");
				rangeStart = Long.parseLong(range.substring(6, idxm));
				rangeEnd = Long.parseLong(range.substring(idxm + 1));
				if (rangeStart > 0) {
					isPart = true;
				}
			} else {
				rangeStart = 0;
				rangeEnd = movieSize - 1;
			}
			long partSize = rangeEnd - rangeStart + 1;
			log.debug(String.format("%s streamed from %14s to %14s at %14s", file, Flayground.Format.Number.MB_Format.format(rangeStart), Flayground.Format.Number.MB_Format.format(rangeEnd), Flayground.Format.Number.MB_Format.format(movieSize)));

			response.reset();
			response.setStatus(isPart ? 206 : 200);
			response.setContentType("video/mp4");
			response.setHeader("Content-Range", "bytes " + rangeStart + "-" + rangeEnd + "/" + movieSize);
			response.setHeader("Accept-Ranges", "bytes");
			response.setHeader("Content-Length", "" + partSize);

			OutputStream out = response.getOutputStream();
			randomFile.seek(rangeStart);

			int bufferSize = 8 * 1024;
			byte[] buf = new byte[bufferSize];
			do {
				int block = partSize > bufferSize ? bufferSize : (int) partSize;
				int len = randomFile.read(buf, 0, block);
				out.write(buf, 0, len);

				partSize -= block;
			} while (partSize > 0);
		} catch (IOException e) {
			log.debug("canceled request: {}", e.getMessage());
		} finally {
			if (randomFile != null)
				try {
					randomFile.close();
				} catch (IOException e) {
					log.error("Fail to randomFile.close()", e);
				}
		}
		log.info("END streamFile {}", file);
	}

}
