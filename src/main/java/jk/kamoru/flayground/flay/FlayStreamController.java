package jk.kamoru.flayground.flay;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequestMapping("/stream")
public class FlayStreamController {

	@Autowired FlayService flayService;

	@GetMapping("/flay/movie/{opus}/{fileIndex}")
	public void streamFlayMovie(@PathVariable String opus, @PathVariable int fileIndex, HttpServletRequest request, HttpServletResponse response) {
		log.debug("START streamFlay {}", opus);

		long rangeStart = 0; // 요청 범위의 시작 위치
		long rangeEnd = 0; // 요청 범위의 끝 위치
		boolean isPart = false; // 부분 요청일 경우 true, 전체 요청의 경우 false

		File file = flayService.get(opus).getFiles().get(Flay.MOVIE).get(fileIndex);
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
			log.debug(String.format("%s streamed from %14s to %14s at %14s", opus, Flayground.Format.Number.MB_Format.format(rangeStart), Flayground.Format.Number.MB_Format.format(rangeEnd), Flayground.Format.Number.MB_Format.format(movieSize)));

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
		log.debug("END streamFlay {}", opus);
	}

	@GetMapping("/flay/subtitles/{opus}/{fileIndex}")
	public void streamFlaySubtitles(@PathVariable String opus, @PathVariable int fileIndex, HttpServletRequest request, HttpServletResponse response) throws IOException {
		File file = flayService.get(opus).getFiles().get(Flay.SUBTI).get(fileIndex);
		response.reset();
		response.setHeader("Content-Length", "" + file.length());
//		response.setHeader("Content-Type", "text/vtt; charset=utf-8");
		response.setHeader("Content-Type", "text/" + FilenameUtils.getExtension(file.getName()) + "; charset=utf-8");
		ServletOutputStream outputStream = response.getOutputStream();
		outputStream.write(FileUtils.readFileToByteArray(file));
	}

}
