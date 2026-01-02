package jk.kamoru.ground.flay;

import java.io.File;
import java.io.IOException;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.flay.domain.Flay;
import jk.kamoru.ground.flay.service.FlayService;
import jk.kamoru.ground.stream.MovieStreamHandler;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@io.swagger.v3.oas.annotations.tags.Tag(name = "FlayStream")
@Controller
@RequestMapping(Ground.API_PREFIX + "/stream")
public class FlayStreamController {

  @Autowired
  FlayService flayService;

  @Autowired
  MovieStreamHandler movieStreamHandler;

  @GetMapping("/flay/movie/{opus}/{fileIndex}")
  public void streamFlayMovie(@PathVariable String opus, @PathVariable int fileIndex, HttpServletRequest request, HttpServletResponse response) {
    File file = flayService.get(opus).getFiles().get(Flay.MOVIE).get(fileIndex);
    movieStreamHandler.streamFile(request, response, file);
  }

  @GetMapping("/flay/subtitles/{opus}/{fileIndex}")
  public void streamFlaySubtitles(@PathVariable String opus, @PathVariable int fileIndex, HttpServletRequest request, HttpServletResponse response) throws IOException {
    File file = flayService.get(opus).getFiles().get(Flay.SUBTI).get(fileIndex);
    response.reset();
    response.setHeader("Content-Length", "" + file.length());
    // response.setHeader("Content-Type", "text/vtt; charset=utf-8");
    response.setHeader("Content-Type", "text/" + FilenameUtils.getExtension(file.getName()) + "; charset=utf-8");
    ServletOutputStream outputStream = response.getOutputStream();
    outputStream.write(FileUtils.readFileToByteArray(file));
  }

}
